from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import razorpay
# import resend  # Replaced with ZeptoMail
import asyncio
import json
import hmac
import hashlib
import shutil
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import httpx
import base64
from shipping import get_shipping_rate, ShippingError

# Security modules
from core.security import (
    check_account_lockout, record_failed_login, clear_failed_attempts,
    hash_reset_code, verify_reset_code, create_access_token, create_refresh_token
)
from core.rate_limit import limiter, rate_limit_exceeded_handler
from core.headers import SecurityHeadersMiddleware
from utils.hashers import hash_sha256, verify_sha256
from utils.file_validator import secure_file_upload
from utils.audit_logger import (
    log_failed_login, log_account_locked, log_password_reset_request,
    log_password_reset_success, log_admin_action, log_order_lookup
)
from slowapi.errors import RateLimitExceeded


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay setup (test keys)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ZeptoMail setup
ZEPTOMAIL_API_KEY = os.environ.get('ZEPTOMAIL_API_KEY', '')
ZEPTOMAIL_SENDER_EMAIL = os.environ.get('ZEPTOMAIL_SENDER_EMAIL', 'srdubaifashion@gmail.com')
ZEPTOMAIL_SENDER_NAME = os.environ.get('ZEPTOMAIL_SENDER_NAME', 'Dubai SR')
ZEPTOMAIL_BOUNCE_ADDRESS = os.environ.get('ZEPTOMAIL_BOUNCE_ADDRESS', '')
ZEPTOMAIL_REGION = os.environ.get('ZEPTOMAIL_REGION', 'in') # Default to 'in' for India

# Create the main app
app = FastAPI(title="Dubai SR E-commerce API")

# Ensure uploads directory exists
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount uploads directory to serve static files
app.mount("/col-imgs", StaticFiles(directory=UPLOAD_DIR), name="uploads")

api_router = APIRouter(prefix="/api")

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    name: str
    slug: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name: str
    slug: str
    description: str
    brand: str
    category_id: str
    price: float
    sale_price: Optional[float] = None
    images: List[str] = []
    sizes: List[str] = [] # Defaults to empty (Unstitched)
    stock: int = 0
    sku: Optional[str] = None
    is_featured: bool = False
    is_new_arrival: bool = False
    is_on_sale: bool = False
    is_active: bool = True
    weight_grams: Optional[int] = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str
    brand: str
    category_id: str
    price: float
    sale_price: Optional[float] = None
    images: List[str] = []
    sku: Optional[str] = None
    weight_grams: Optional[int] = 0

class MarketingLead(BaseModel):
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sizes: List[str] = ["S", "M", "L", "XL"]
    stock: int = 0
    is_featured: bool = False
    is_new_arrival: bool = False
    is_on_sale: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    images: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    is_active: Optional[bool] = None
    weight_grams: Optional[int] = None

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    coupon_id: str = Field(default_factory=lambda: f"cpn_{uuid.uuid4().hex[:12]}")
    code: str
    discount_type: str  # "percentage" or "flat"
    discount_value: float
    min_cart_value: float = 0
    max_uses: Optional[int] = None
    current_uses: int = 0
    expires_at: Optional[datetime] = None
    is_active: bool = True

class StoreSettings(BaseModel):
    store_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    store_email: Optional[str] = None
    low_stock_threshold: int = 5
    free_shipping_threshold: float = 999
    cod_enabled: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContentPageUpdate(BaseModel):
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_cart_value: float = 0
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    sale_price: Optional[float] = None
    quantity: int
    size: str
    image: str

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_id: str = Field(default_factory=lambda: f"cart_{uuid.uuid4().hex[:12]}")
    session_id: str
    items: List[CartItem] = []
    coupon_code: Optional[str] = None
    coupon_discount: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    sale_price: Optional[float] = None
    quantity: int
    size: str
    image: str
    weight_grams: int = 0  # NEW: Pass weight from cart for shipping calculation

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class ShippingAddress(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    country: str = "India"

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    sale_price: Optional[float] = None
    quantity: int
    size: str
    image: str
    weight_grams: int = 0

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"ORD{uuid.uuid4().hex[:8].upper()}")
    user_id: Optional[str] = None
    items: List[OrderItem]
    shipping_address: ShippingAddress
    subtotal: float
    coupon_code: Optional[str] = None
    coupon_discount: float = 0
    shipping_cost: float = 0
    cod_fee: float = 0
    total: float
    payment_method: str  # "razorpay" or "cod"
    payment_status: str = "pending"  # pending, paid, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    order_status: str = "pending"  # pending, processing, shipped, delivered, cancelled
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    shipping_zone: str = "india"
    shipping_carrier: Optional[str] = None
    estimated_delivery: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    coupon_code: Optional[str] = None
    payment_method: str

class ShippingRateRequest(BaseModel):
    country: str
    pincode: str
    items: List[Dict[str, Any]] # [{product_id, quantity, weight_grams}, ...]
    subtotal: float = 0

class ShippingRateResponse(BaseModel):
    cost: float
    delivery_days: str
    carrier: str
    cod_available: bool
    cod_fee: float = 0
    zone: str

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = ""
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================

async def get_current_admin(request: Request) -> Optional["AdminUser"]:
    """Get current admin from session token in cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.admin_users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return AdminUser(**user_doc)

async def get_current_user(request: Request) -> Optional["User"]:
    """Get current customer from session token"""
    logger.info(f"get_current_user called from {request.url.path}")
    logger.info(f"Cookies received: {list(request.cookies.keys())}")
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        logger.warning("No session_token in cookies, checking Authorization header")
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
            logger.info("Found token in Authorization header")
            
    if not session_token:
        logger.warning("No session token found in cookies or headers")
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_admin(request: Request) -> "AdminUser":
    """Require admin authentication"""
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Authentication required")
    return admin

async def send_order_email(email: str, subject: str, html_content: str):
    """Send email using ZeptoMail (non-blocking)"""
    if not ZEPTOMAIL_API_KEY:
        logger.warning("ZEPTOMAIL_API_KEY not configured, skipping email")
        return
    
    url = f"https://api.zeptomail.{ZEPTOMAIL_REGION}/v1.1/email"
    
    # If the key already contains the prefix, use it as is. Otherwise prepend Zoho-enczapikey
    auth_header = ZEPTOMAIL_API_KEY if ZEPTOMAIL_API_KEY.startswith("Zoho-") else f"Zoho-enczapikey {ZEPTOMAIL_API_KEY}"
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": auth_header,
    }
    
    payload = {
        "from": {
            "address": ZEPTOMAIL_SENDER_EMAIL,
            "name": ZEPTOMAIL_SENDER_NAME
        },
        "to": [
            {
                "email_address": {
                    "address": email,
                    "name": email.split('@')[0]
                }
            }
        ],
        "subject": subject,
        "htmlbody": html_content
    }
    
    # ZeptoMail uses the default bounce address configured for the domain
    # if not provided in the payload. Providing it manually was causing 401 errors.
    # if ZEPTOMAIL_BOUNCE_ADDRESS:
    #     payload["bounce_address"] = ZEPTOMAIL_BOUNCE_ADDRESS

    logger.info(f"Attempting to send email to {email} via {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code not in [200, 201]:
                logger.error(f"ZeptoMail API error: {response.status_code} - {response.text}")
            else:
                logger.info(f"Email sent successfully via ZeptoMail to {email}")
                logger.debug(f"ZeptoMail Response: {response.text}")
    except Exception as e:
        logger.error(f"Failed to send email via ZeptoMail: {e}")

async def log_activity(admin_id: str, admin_name: str, action: str, type: str, description: str):
    """Log admin activity"""
    activity = {
        "admin_id": admin_id,
        "user_name": admin_name,
        "action": action, # create, update, delete
        "type": type, # order, product, coupon, settings
        "description": description,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_log.insert_one(activity)

# ==================== EMAIL TEMPLATES ====================

def get_email_header():
    return """
    <div style="background: linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f43f5e 100%); color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700;">DUBAI SR</h1>
        <p style="margin: 5px 0 0; opacity: 0.9; font-size: 12px; letter-spacing: 2px;">Premium Ethnic Fashion</p>
    </div>
    """

def get_email_footer():
    return """
    <div style="background: #FAFAF9; padding: 25px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #f3f4f6; border-radius: 0 0 12px 12px;">
        <p>&copy; 2026 Dubai SR. All rights reserved.</p>
        <p>3192-A Behind Golcha Cinema, Partap Street, Darya Ganj, Delhi-2</p>
        <p>Premium Fabrics | Traditional Craftsmanship | Modern Elegance</p>
        <p style="margin-top: 10px;">
            <a href="https://srfashiondubai.com/returns-policy" style="color: #db2777; text-decoration: none; font-weight: 600;">Returns & Exchanges</a> | 
            <a href="https://srfashiondubai.com/shipping-policy" style="color: #db2777; text-decoration: none; font-weight: 600;">Shipping Information</a>
        </p>
        <p style="margin-top: 10px;">Contact us: srdubaifashion@gmail.com | WhatsApp: +91 85953 71004</p>
    </div>
    """

def generate_order_confirmation_html(order: Any):
    # order can be Pydantic model or dict
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    items_html = ""
    for item in order_data["items"]:
        item_price = float(item.get('sale_price') or item['price']) * item['quantity']
        formatted_price = f"{item_price:.2f}"
        items_html += f"""
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #fbcfe8; padding: 10px 0;">
            <span style="font-weight: 600;">{item['name']} (x{item['quantity']})</span>
            <span>Rs. {formatted_price}</span>
        </div>
        """

    total_amount = float(order_data['total'])
    formatted_total = f"{total_amount:.2f}"
    
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #fdf2f8; color: #db2777; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #fbcfe8;">Order Status: Processing</div>
            <h2 style="margin-top: 0; font-size: 20px;">Thank you for your order!</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Your order <span style="color: #D4AF37; font-weight: bold;">#{order_data['order_id']}</span> has been confirmed. We are carefully preparing your items for shipment.</p>
            
            <div style="background: #fff8e1; border: 1px dashed #ffb300; padding: 15px; border-radius: 8px; font-size: 13px; color: #856404; margin: 20px 0; text-align: center;">
                <strong>Note:</strong> Your order is under processing. Tracking details will be updated here and emailed to you as soon as the package is dispatched.
            </div>

            <div style="background: #FDF2F8; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #db2777;">
                <p style="margin-top: 0; font-weight: bold;">Order Summary:</p>
                {items_html}
                <div style="display: flex; justify-content: space-between; padding: 15px 0 0; font-size: 18px; font-weight: bold; color: #db2777;">
                    <span>Total Amount</span>
                    <span>Rs. {formatted_total}</span>
                </div>
            </div>

            <p style="font-size: 14px;"><strong>Shipping Address:</strong><br>
            {order_data['shipping_address']['full_name']}<br>
            {order_data['shipping_address']['address_line1']}, {order_data['shipping_address']['city']}<br>
            {order_data['shipping_address']['state']} - {order_data['shipping_address']['pincode']}</p>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/track-order" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #f59e0b 0%, #facc15 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Track Your Order</a>
            </div>
            <p style="text-align: center; margin-top: 15px; font-size: 13px; color: #78716c;">Use Order ID: <strong>{order_data['order_id']}</strong> to track your order</p>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_order_shipped_html(order: Any):
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    tracking_url = order_data.get("tracking_url") or "#"
    
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #059669; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #a7f3d0;">Order Status: Shipped</div>
            <h2 style="margin-top: 0; font-size: 20px;">Your order is on the way!</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Great news! Your order <span style="color: #db2777; font-weight: bold;">#{order_data['order_id']}</span> has been shipped via <b>{order_data.get('courier_name', 'our courier partner')}</b>.</p>
            
            <div style="background: #FDF2F8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
                <p style="margin-top: 0; font-weight: bold;">Tracking Information:</p>
                <p style="margin-bottom: 5px;">Courier: {order_data.get('courier_name', 'N/A')}</p>
                <p style="margin-bottom: 15px;">Tracking ID: <span style="color: #db2777; font-weight: bold;">{order_data.get('tracking_number', 'N/A')}</span></p>
                <a href="{tracking_url}" style="display: inline-block; padding: 10px 20px; background: #db2777; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Track Package</a>
            </div>

            <p style="font-size: 14px;">Once your package arrives, feel free to share your look on Instagram and tag us <b>@samairaonline786_6</b>!</p>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/track-order" style="display: inline-block; padding: 12px 30px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border: 1px solid #d1d5db;">Track Your Order</a>
            </div>
            <p style="text-align: center; margin-top: 15px; font-size: 13px; color: #78716c;">Use Order ID: <strong>{order_data['order_id']}</strong></p>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_order_delivered_html(order: Any):
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #d1fae5; color: #065f46; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #6ee7b7;">Order Status: Delivered</div>
            <h2 style="margin-top: 0; font-size: 20px;">Your order has been delivered! 🎉</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Great news! Your order <span style="color: #db2777; font-weight: bold;">#{order_data['order_id']}</span> has been successfully delivered.</p>
            
            <div style="background: #FDF2F8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
                <p style="margin-top: 0; font-weight: bold;">We hope you love your purchase!</p>
                <p style="margin-bottom: 0; font-size: 14px;">If you have any questions or concerns about your order, please do not hesitate to reach out to us.</p>
            </div>

            <p style="font-size: 14px;">Share your look on Instagram and tag us <b>@samairaonline786_6</b>! We would love to see how you style your new pieces.</p>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/shop" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #f59e0b 0%, #facc15 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Shop More</a>
            </div>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_order_cancelled_manual_html(order: Any):
    """Email for when admin manually cancels an order"""
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #fecaca;">Status: Cancelled</div>
            <h2 style="margin-top: 0; font-size: 20px;">Order Cancelled</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Your order <span style="color: #db2777; font-weight: bold;">#{order_data['order_id']}</span> has been cancelled.</p>
            
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin-top: 0; font-weight: bold;">What happens next?</p>
                <p style="margin-bottom: 5px; font-size: 14px;">- Our sales representative will contact you shortly</p>
                <p style="margin-bottom: 0; font-size: 14px;">- You will receive a refund on your payment method in 5-7 business days</p>
            </div>

            <p style="font-size: 14px;">If you have any questions, please do not hesitate to reach out to our support team.</p>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/shop" style="display: inline-block; padding: 12px 30px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border: 1px solid #d1d5db;">Continue Shopping</a>
            </div>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_order_cancelled_auto_html(order: Any):
    """Email for when order is auto-cancelled due to non-payment"""
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #fecaca;">Status: Cancelled</div>
            <h2 style="margin-top: 0; font-size: 20px;">Order Cancelled</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Your order <span style="color: #db2777; font-weight: bold;">#{order_data['order_id']}</span> has been cancelled because we didn't receive the payment within the required window.</p>
            
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin-top: 0; font-weight: bold;">Items returned to inventory</p>
                <p style="margin-bottom: 0; font-size: 14px;">The items have been returned to our inventory. If you still wish to purchase them, please place a new order on our website.</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/shop" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #db2777 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Continue Shopping</a>
            </div>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_cart_reminder_html(order: Any):
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    items_html = ""
    for item in order_data["items"]:
        item_price = float(item.get('sale_price') or item['price']) * item['quantity']
        formatted_price = f"{item_price:.2f}"
        items_html += f"""
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #fbcfe8; padding: 10px 0;">
            <span style="font-weight: 600;">{item['name']} (x{item['quantity']})</span>
            <span>Rs. {formatted_price}</span>
        </div>
        """

    total_amount = float(order_data['total'])
    formatted_total = f"{total_amount:.2f}"
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fce7f3;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #fffbeb; color: #d97706; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #fef3c7;">Reminder: Items in your Bag</div>
            <h2 style="margin-top: 0; font-size: 20px;">Complete your order!</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Your items are waiting in your bag! We've received your order request <span style="color: #db2777; font-weight: bold;">#{order_data['order_id']}</span>, but the checkout hasn't been completed yet.</p>
            
            <div style="background: #FDF2F8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
                <p style="margin-top: 0; font-weight: bold;">Order Summary:</p>
                {items_html}
                <div style="display: flex; justify-content: space-between; padding: 15px 0 0; font-size: 16px; font-weight: bold; color: #db2777;">
                    <span>Total Amount</span>
                    <span>Rs. {formatted_total}</span>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">Complete your payment within <b>5 minutes</b> to secure these items.</p>
                    <a href="https://srfashiondubai.com/account/orders/{order_data['order_id']}" style="display: inline-block; padding: 12px 30px; background: #db2777; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Complete Checkout</a>
                </div>
            </div>

            <p style="font-size: 14px;">If you have already completed the payment, please ignore this email. Your order will be updated shortly.</p>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_payment_failed_html(order: Any):
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #fee2e2;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #fef2f2; color: #dc2626; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #fecaca;">Status: Payment Failed</div>
            <h2 style="margin-top: 0; font-size: 20px;">Payment Unsuccessful</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>We are sorry, but the payment for your order <span style="font-weight: bold;">#{order_data['order_id']}</span> was unsuccessful.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin-top: 0;">Your order has been cancelled and the items have been returned to inventory. If you would like to purchase these items, please place a new order on our website.</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/shop" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #db2777 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Continue Shopping</a>
            </div>
            
            <p style="font-size: 14px; margin-top: 25px;">If you need assistance, please reply to this email or contact us via WhatsApp.</p>
        </div>
        {get_email_footer()}
    </div>
    """

def generate_order_cancelled_html(order: Any):
    if hasattr(order, "model_dump"):
        order_data = order.model_dump()
    else:
        order_data = order

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1C1917; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        {get_email_header()}
        <div style="padding: 30px;">
            <div style="display: inline-block; padding: 4px 12px; background: #f3f4f6; color: #4b5563; border-radius: 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border: 1px solid #e5e7eb;">Status: Cancelled</div>
            <h2 style="margin-top: 0; font-size: 20px;">Order Cancelled</h2>
            <p>Hi {order_data['shipping_address']['full_name']},</p>
            <p>Your order <span style="font-weight: bold;">#{order_data['order_id']}</span> has been cancelled because we didn't receive the payment within the required window.</p>
            
            <p style="font-size: 14px;">The items have been returned to our inventory. If you still wish to purchase them, please place a new order on our website.</p>

            <div style="text-align: center; margin-top: 25px;">
                <a href="https://srfashiondubai.com/shop" style="display: inline-block; padding: 12px 30px; border: 1px solid #db2777; color: #db2777; text-decoration: none; border-radius: 50px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Continue Shopping</a>
            </div>
        </div>
        {get_email_footer()}
    </div>
    """


# ==================== PASSWORD HASHING ====================
import bcrypt

def verify_password(plain_password: str, hashed_password: str):
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# ==================== USER MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    email: EmailStr
    name: str
    hashed_password: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class MarketingLead(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== MARKETING ROUTES ====================

@api_router.post("/marketing/subscribe")
async def subscribe_marketing(lead: MarketingLead):
    # Check if already exists
    existing = await db.marketing_leads.find_one({"email": lead.email})
    if existing:
        return {"message": "Already subscribed"}
    
    # Save new lead
    lead_doc = lead.model_dump()
    lead_doc["created_at"] = lead_doc["created_at"].isoformat()
    await db.marketing_leads.insert_one(lead_doc)
    return {"message": "Subscription successful"}

# ==================== UPLOAD ROUTE ====================

@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...), admin: AdminUser = Depends(require_admin)):
    """Upload a file to the server with secure validation"""
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Use secure file upload utility (validates MIME type, size, sanitizes filename)
        relative_path = await secure_file_upload(file, str(UPLOAD_DIR))
        
        # Log admin action
        log_admin_action(
            admin.user_id, 
            admin.email, 
            "file_upload", 
            "uploads", 
            client_ip,
            {"filename": file.filename, "path": relative_path}
        )
        
        # Return URL
        return {"url": relative_path, "filename": os.path.basename(relative_path)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

# ==================== ADMIN ROUTES ====================

@api_router.post("/auth/register")
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserCreate):
    """Register a new customer"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user (Pydantic model will set default values for failed_login_attempts and locked_until)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        phone=user_data.phone
    )
    
    user_doc = new_user.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    await db.users.insert_one(user_doc)
    
    # Auto-login: Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=new_user.user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_doc = session.model_dump()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    
    await db.user_sessions.insert_one(session_doc)
    
    # Return response with cookie
    response = JSONResponse(content={
        "status": "success", 
        "user": {
            "user_id": new_user.user_id,
            "email": new_user.email,
            "name": new_user.name
        },
        "session_token": session_token
    })
    
    # Cookie domain for subdomain sharing in dev
    is_prod = os.environ.get('ENVIRONMENT', 'development') == 'production'
    cookie_domain = None if is_prod else "localhost"
    
    # Cross-site cookie (admin.localhost -> localhost:8000) requires SameSite=None + Secure
    # Localhost is treated as a secure context, so Secure=True works
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,  # Always true to allow SameSite=None
        samesite="none", # Always none to allow cross-subdomain API calls
        path="/",
        domain=cookie_domain,
        max_age=7*24*60*60
    )  
    return response

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, login_data: UserLogin):
    """Login with email and password"""
    client_ip = request.client.host if request.client else "unknown"
    
    # Check account lockout
    is_locked, locked_until = await check_account_lockout(db, login_data.email, "users")
    if is_locked:
        log_failed_login(login_data.email, client_ip, "account_locked")
        raise HTTPException(
            status_code=403, 
            detail=f"Account locked due to too many failed attempts. Try again after {locked_until.strftime('%Y-%m-%d %H:%M:%S UTC')}"
        )
    
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        log_failed_login(login_data.email, client_ip, "user_not_found")
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not verify_password(login_data.password, user["hashed_password"]):
        # Record failed attempt
        failed_attempts = await record_failed_login(db, login_data.email, "users")
        
        if failed_attempts >= 5:
            log_account_locked(login_data.email, client_ip, failed_attempts)
            raise HTTPException(
                status_code=403,
                detail="Account locked due to too many failed attempts. Try again in 15 minutes."
            )
        
        log_failed_login(login_data.email, client_ip, "invalid_password")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts on successful login
    await clear_failed_attempts(db, login_data.email, "users")
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user["user_id"],
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_doc = session.model_dump()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    
    # Remove old sessions? Optional.
    await db.user_sessions.insert_one(session_doc)
    
    response = JSONResponse(content={
        "status": "success", 
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"]
        },
        "session_token": session_token
    })
    
    # Cookie configuration based on environment
    is_prod = os.environ.get('ENVIRONMENT', 'development') == 'production'
    cookie_domain = None if is_prod else "localhost"
    
    # CRITICAL: secure=True requires HTTPS. On localhost (HTTP), use secure=False
    # samesite="none" requires secure=True, so use "lax" for development
    secure_flag = is_prod
    samesite_value = "none" if is_prod else "lax"

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure_flag,
        samesite=samesite_value,
        path="/",
        domain=cookie_domain,
        max_age=7*24*60*60
    )
    
    logger.info(f"Login successful for {user['email']}")
    logger.info(f"Cookie settings: secure={secure_flag}, samesite={samesite_value}, domain={cookie_domain}")
    logger.info(f"Session token: {session_token[:10]}...")
    
    return response

@api_router.get("/auth/google/login")
async def google_login():
    """
    Initiate Google OAuth 2.0 flow (SECURE).
    
    Flow:
    1. Generate state token for CSRF protection
    2. Build Google OAuth URL
    3. Create RedirectResponse
    4. Attach state cookie to THAT SAME response
    5. Return response with cookie
    """
    from core.oauth import generate_state_token, get_google_oauth_url
    from fastapi.responses import RedirectResponse
    import os
    
    # 1. Generate state token
    state = generate_state_token()
    
    # 2. Build Google OAuth URL
    oauth_url = get_google_oauth_url(state)
    
    # 3. Create RedirectResponse
    redirect_response = RedirectResponse(url=oauth_url, status_code=302)
    
    # 4. Attach state cookie to THIS response
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    
    redirect_response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,           # Prevent JavaScript access
        secure=is_production,    # HTTPS only in production
        samesite="lax",          # CSRF protection
        path="/",
        max_age=600              # 10 minutes (OAuth flow should complete quickly)
    )
    
    # 5. Return the response with cookie attached
    return redirect_response



@api_router.get("/auth/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...)
):
    """
    Handle Google OAuth 2.0 callback (SECURE).
    
    Flow:
    1. Verify state token (CSRF protection)
    2. Exchange code for access token
    3. Fetch user info from Google
    4. Check admin whitelist
    5. Create/update user
    6. Create session
    7. Set HTTP-only cookie
    8. Redirect to admin frontend (clean URL, no tokens)
    """
    from core.oauth import (
        verify_state_token,
        exchange_code_for_token,
        get_google_user_info
    )
    from core.session import (
        get_state_from_cookie,
        clear_state_cookie,
        create_session_cookie,
        get_admin_frontend_url
    )
    from fastapi.responses import RedirectResponse
    
    try:
        # 1. Verify state token (CSRF protection)
        stored_state = get_state_from_cookie(request)
        if not verify_state_token(state, stored_state):
            logger.error("OAuth state verification failed - possible CSRF attack")
            raise HTTPException(status_code=403, detail="Invalid state parameter")
        
        # 2. Exchange code for tokens
        try:
            tokens = await exchange_code_for_token(code)
            access_token = tokens.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=401, detail="Failed to obtain access token")
        except Exception as e:
            logger.error(f"Token exchange failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Failed to exchange authorization code")
        
        # 3. Fetch user info
        try:
            user_data = await get_google_user_info(access_token)
        except Exception as e:
            logger.error(f"Failed to fetch user info: {str(e)}")
            raise HTTPException(status_code=401, detail="Failed to retrieve user information")
        
        # 4. Check admin whitelist
        email = user_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        ALLOWED_ADMIN_EMAILS = [
            'alinameer145@gmail.com',
            'rudraksharora2007@gmail.com',
            'shaikhruheen@gmail.com'
        ]
        
        if email not in ALLOWED_ADMIN_EMAILS:
            logger.warning(f"Unauthorized admin login attempt from: {email}")
            # Redirect to main site with error message
            frontend_url = get_admin_frontend_url().replace('/admin', '')
            return RedirectResponse(
                url=f"{frontend_url}/?error=unauthorized",
                status_code=302
            )
        
        # 5. Create or update user
        existing_user = await db.admin_users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
        else:
            # Create new admin user
            new_user = AdminUser(
                email=email,
                name=user_data.get("name", email.split('@')[0]),
                picture=user_data.get("picture", "")
            )
            user_doc = new_user.model_dump()
            user_doc["created_at"] = user_doc["created_at"].isoformat()
            await db.admin_users.insert_one(user_doc)
            user_id = new_user.user_id
        
        # 7. Create session
        session_token = f"sess_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at
        )
        session_doc = session.model_dump()
        session_doc["created_at"] = session_doc["created_at"].isoformat()
        session_doc["expires_at"] = session_doc["expires_at"].isoformat()
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one(session_doc)
        
        # 8. Redirect to admin frontend with clean URL
        admin_url = get_admin_frontend_url()
        logger.info(f"OAuth successful for {email}, redirecting to {admin_url}")
        
        # Create RedirectResponse FIRST
        redirect_response = RedirectResponse(url=admin_url, status_code=302)
        
        # Attach session cookie to THIS response
        create_session_cookie(redirect_response, session_token)

        # Now clear the OAuth state cookie on the same response
        clear_state_cookie(redirect_response)
        
        # Return the response with cookie attached
        return redirect_response

        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user/admin profile"""
    # 1. Try to find an admin session first
    admin = await get_current_admin(request)
    if admin:
        admin_data = admin.model_dump()
        admin_data["is_admin"] = True
        return admin_data
    
    # 2. Try to find a regular customer session
    user = await get_current_user(request)
    if user:
        user_data = user.model_dump()
        user_data["is_admin"] = False
        return user_data
    
    # 3. No valid session found
    raise HTTPException(status_code=401, detail="Not authenticated")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"status": "success"}

@api_router.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, reset_request: ForgotPasswordRequest):
    """Generate and send a password reset code"""
    client_ip = request.client.host if request.client else "unknown"
    
    user = await db.users.find_one({"email": reset_request.email})
    if not user:
        # For security, don't reveal if email exists
        return {"status": "success", "message": "If your email is registered, you will receive a reset code."}
    
    # Generate 6-digit code
    import random
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Hash the code before storing
    code_hash = hash_sha256(reset_code)
    
    # Save to DB
    await db.password_resets.delete_many({"email": reset_request.email}) # Clear old ones
    await db.password_resets.insert_one({
        "email": reset_request.email,
        "code_hash": code_hash,  # Store hashed code
        "expires_at": expires_at.isoformat()
    })
    
    # Log password reset request
    log_password_reset_request(reset_request.email, client_ip)
    
    # Send email
    subject = "Password Reset Verification Code - Dubai SR"
    html_content = f"""
        <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: #1c1c1c; text-align: center; margin-bottom: 30px;">Verification Code</h2>
            <p style="color: #444; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #444; line-height: 1.6; font-size: 16px;">We received a request to reset your password. Use the following 6-digit verification code to proceed:</p>
            <div style="background-color: #fff5f7; border: 1px dashed #ffb6c1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #db2777;">{reset_code}</span>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Dubai SR - Premium Ethnic Fashion</p>
        </div>
    """
    
    await send_order_email(request.email, subject, html_content)
    
    return {"status": "success", "message": "Verification code sent to your email."}

@api_router.post("/auth/verify-reset-code")
@limiter.limit("5/minute")
async def verify_reset_code(http_request: Request, request: VerifyResetCodeRequest):
    """Verify the 6-digit password reset code"""
    reset_doc = await db.password_resets.find_one({"email": request.email})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Verify hashed code
    if not verify_sha256(request.code, reset_doc["code_hash"]):
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.password_resets.delete_one({"_id": reset_doc["_id"]})
        raise HTTPException(status_code=400, detail="Verification code has expired")
        
    return {"status": "success", "message": "Code verified successfully"}

@api_router.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(http_request: Request, request: ResetPasswordRequest):
    """Reset the password after verification"""
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    reset_doc = await db.password_resets.find_one({"email": request.email})
    
    if not reset_doc or not verify_sha256(request.code, reset_doc["code_hash"]):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired session")
        
    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.password_resets.delete_one({"_id": reset_doc["_id"]})
        raise HTTPException(status_code=400, detail="Session expired")
        
    # Update password
    hashed_password = get_password_hash(request.new_password)
    result = await db.users.update_one(
        {"email": request.email},
        {"$set": {
            "hashed_password": hashed_password,
            "failed_login_attempts": 0,  # Clear failed attempts
            "locked_until": None  # Clear any lockout
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete the reset code
    await db.password_resets.delete_one({"_id": reset_doc["_id"]})
    
    # Log successful password reset
    log_password_reset_success(request.email, client_ip)
    
    return {"status": "success", "message": "Password updated successfully"}


# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories(active_only: bool = True):
    """Get all categories"""
    query = {"is_active": True} if active_only else {}
    categories = await db.categories.find(query, {"_id": 0}).to_list(100)
    return categories

@api_router.get("/categories/{category_id}")
async def get_category(category_id: str):
    """Get single category"""
    category = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.post("/admin/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, admin: AdminUser = Depends(require_admin)):
    """Create a new category (admin only)"""
    category = Category(**category_data.model_dump())
    doc = category.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.categories.insert_one(doc)
    return category

@api_router.put("/admin/categories/{category_id}")
async def update_category(category_id: str, category_data: CategoryCreate, admin: AdminUser = Depends(require_admin)):
    """Update a category (admin only)"""
    result = await db.categories.update_one(
        {"category_id": category_id},
        {"$set": category_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    return category

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, admin: AdminUser = Depends(require_admin)):
    """Delete a category (admin only)"""
    result = await db.categories.delete_one({"category_id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"status": "success"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(
    category_id: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_on_sale: Optional[bool] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
    active_only: bool = True
):
    """Get products with filtering and pagination"""
    query = {}
    
    if active_only:
        query["is_active"] = True
    if category_id and category_id.strip():
        query["category_id"] = category_id
    elif category and category.strip():
        # Resolve category slug to ID
        cat_doc = await db.categories.find_one({"slug": category})
        if cat_doc:
            query["category_id"] = cat_doc["category_id"]
        else:
            # If slug not found, return empty results
            return {"products": [], "total": 0, "skip": skip, "limit": limit}
    if brand:
        query["brand"] = brand
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_new_arrival is not None:
        query["is_new_arrival"] = is_new_arrival
    if is_on_sale is not None:
        query["is_on_sale"] = is_on_sale
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_direction).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {"products": products, "total": total, "skip": skip, "limit": limit}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/products/slug/{slug}")
async def get_product_by_slug(slug: str):
    """Get product by slug"""
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: AdminUser = Depends(require_admin)):
    """Create a new product (admin only)"""
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, admin: AdminUser = Depends(require_admin)):
    """Update a product (admin only)"""
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: AdminUser = Depends(require_admin)):
    """Delete a product (admin only)"""
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success"}

@api_router.get("/brands")
async def get_brands():
    """Get unique brands"""
    brands = await db.products.distinct("brand")
    return brands

# ==================== ORDER ROUTES ====================

@api_router.post("/shipping/calculate", response_model=ShippingRateResponse)
async def calculate_shipping(request: ShippingRateRequest):
    """Simplified shipping: Free for India, Contact for International"""
    country_lower = request.country.lower()
    if country_lower in ["india", "in"]:
        return ShippingRateResponse(
            cost=0.0,
            delivery_days="5-7 days",
            carrier="Free Delivery (India)",
            cod_available=True,
            cod_fee=100.0,
            zone="india"
        )
    else:
        # International orders redirected to WhatsApp
        raise HTTPException(
            status_code=400, 
            detail="International orders are currently handled via WhatsApp. Please contact us to place your order."
        )

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, request: Request):
    """Create a new order"""
    # Calculate subtotal first as it may affect shipping/COD fees
    subtotal = sum((item.sale_price or item.price) * item.quantity for item in order_data.items)
    
    # Enforcement of Free Shipping for India, Block International
    country_lower = order_data.shipping_address.country.lower()
    if country_lower not in ["india", "in"]:
        raise HTTPException(
            status_code=400, 
            detail="International orders are currently handled via WhatsApp. Please contact us to place your order."
        )
    
    shipping_cost = 0.0
    shipping_zone = "india"
    cod_fee = 100.0 if order_data.payment_method == "cod" else 0.0
    
    # Verify stock availability and deduct immediately
    for item in order_data.items:
        product = await db.products.find_one({"product_id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.name} not found")
        
        # Check stock (assuming stock is a number in the DB)
        current_stock = product.get("stock", 0)
        if current_stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {item.name}. Available: {current_stock}"
            )
        
        # Deduct stock atomically
        await db.products.update_one(
            {"product_id": item.product_id},
            {"$inc": {"stock": -item.quantity}}
        )
    
    # Estimated delivery
    estimated_delivery = "5-7 days"
    shipping_carrier = "Standard Delivery"

    coupon_discount = 0 # Initial discount
    # Simple coupon logic
    if order_data.coupon_code:
        pass

    total = subtotal - coupon_discount + shipping_cost + cod_fee
    
    # Now create the Order object with all required fields
    order = Order(
        **order_data.model_dump(),
        subtotal=subtotal,
        total=total,
        coupon_discount=coupon_discount,
        shipping_cost=shipping_cost,
        cod_fee=cod_fee,
        shipping_zone=shipping_zone,
        shipping_carrier=shipping_carrier,
        estimated_delivery=estimated_delivery
    )
    
    # Associate with user if logged in
    user_token = request.cookies.get("session_token")
    if user_token:
        # Try to find user
        session = await db.user_sessions.find_one({"session_token": user_token})
        if session:
            order.user_id = session.get("user_id")

    # Create Razorpay order if needed
    if order.payment_method == "razorpay":
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": int(order.total * 100),
                "currency": "INR",
                "receipt": order.order_id,
                "payment_capture": 1
            })
            order.razorpay_order_id = razorpay_order['id']
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {e}")
            raise HTTPException(status_code=500, detail="Failed to initialize payment gateway")
            
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Send appropriate email
    if order.payment_method == "razorpay":
        # Send Cart Reminder email immediately for online payments
        email_html = generate_cart_reminder_html(order)
        await send_order_email(order.shipping_address.email, f"Items waiting in your bag! Order #{order.order_id}", email_html)
    else:
        # For COD or other methods that are confirmed immediately
        email_html = generate_order_confirmation_html(order)
        await send_order_email(order.shipping_address.email, f"Order Confirmation #{order.order_id}", email_html)
    
    return order

@api_router.post("/orders/verify-payment")
async def verify_payment(payload: dict):
    """Verify Razorpay payment signature"""
    logger.info(f"Payment verification request received. Payload: {payload}")
    
    order_id = payload.get("order_id")
    razorpay_order_id = payload.get("razorpay_order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id")
    razorpay_signature = payload.get("razorpay_signature")
    
    logger.info(f"Extracted values - order_id: {order_id}, razorpay_order_id: {razorpay_order_id}, razorpay_payment_id: {razorpay_payment_id}, razorpay_signature: {razorpay_signature}")
    
    if not all([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        missing_fields = []
        if not order_id: missing_fields.append("order_id")
        if not razorpay_order_id: missing_fields.append("razorpay_order_id")
        if not razorpay_payment_id: missing_fields.append("razorpay_payment_id")
        if not razorpay_signature: missing_fields.append("razorpay_signature")
        logger.error(f"Missing payment verification details: {missing_fields}")
        raise HTTPException(status_code=400, detail=f"Missing payment verification details: {', '.join(missing_fields)}")
        
    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # If verification successful, update order
        result = await db.orders.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "payment_status": "paid",
                    "order_status": "processing",
                    "razorpay_payment_id": razorpay_payment_id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Send Order Confirmation email now that payment is verified
        order = await db.orders.find_one({"order_id": order_id})
        email_html = generate_order_confirmation_html(order)
        await send_order_email(order["shipping_address"]["email"], f"Order Confirmed #{order_id}", email_html)
            
        return {"status": "success", "message": "Payment verified"}
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(f"Payment verification failed for order {order_id}")
        logger.error(f"Error type: {error_type}")
        logger.error(f"Error message: {error_msg}")
        logger.error(f"Full exception: {e}", exc_info=True)
        
        # Mark payment as failed in DB if needed
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        # Send Payment Failed email
        order = await db.orders.find_one({"order_id": order_id})
        if order:
            email_html = generate_payment_failed_html(order)
            await send_order_email(order["shipping_address"]["email"], f"Payment Failed for Order #{order_id}", email_html)
            
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {error_msg}")

@api_router.get("/orders/{order_id}")
async def get_order(request: Request, order_id: str):
    """Get order details by order ID - public access"""
    client_ip = request.client.host if request.client else "unknown"
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        logger.warning(f"Order lookup failed - order not found: {order_id} from {client_ip}")
        raise HTTPException(status_code=404, detail="Order not found")
    
    logger.info(f"Order lookup successful: {order_id} from {client_ip}")
    return order


@api_router.get("/orders/user/my-orders")
async def get_my_orders(user: User = Depends(get_current_user)):
    """Get orders for current user"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    logger.info(f"get_my_orders: Fetching for user_id={user.user_id}")
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    logger.info(f"get_my_orders: Found {len(orders)} orders for user_id={user.user_id}")
    
    return orders

@api_router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None, 
    limit: int = 50, 
    skip: int = 0,
    admin: AdminUser = Depends(require_admin)
):
    """Get all orders (admin only)"""
    query = {}
    if status and status != "all":
        query["order_status"] = status
        
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"orders": orders, "count": len(orders)}

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: dict, admin: AdminUser = Depends(require_admin)):
    """Update order status"""
    new_status = status_update.get("order_status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status required")
        
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"order_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Fetch the updated order for email
    order = await db.orders.find_one({"order_id": order_id})
    
    # Send email notification for delivered or cancelled status
    if new_status.lower() == "delivered":
        email_html = generate_order_delivered_html(order)
        await send_order_email(order["shipping_address"]["email"], f"Order Delivered #{order_id}", email_html)
    elif new_status.lower() == "cancelled":
        # Manual cancellation by admin - send manual cancel email
        email_html = generate_order_cancelled_manual_html(order)
        await send_order_email(order["shipping_address"]["email"], f"Order Cancelled #{order_id}", email_html)
        
    # Log activity
    await log_activity(admin.user_id, admin.name, "update", "order", f"Updated order {order_id} status to {new_status}")
    
    return {"status": "success"}

@api_router.put("/admin/orders/{order_id}/tracking")
async def update_order_tracking(order_id: str, tracking_data: dict, admin: AdminUser = Depends(require_admin)):
    """Update order tracking info"""
    update = {
        "courier_name": tracking_data.get("courier_name"),
        "tracking_number": tracking_data.get("tracking_number"),
        "tracking_url": tracking_data.get("tracking_url"),
        "order_status": "shipped", # Auto set to shipped
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.orders.update_one({"order_id": order_id}, {"$set": update})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    # Send shipping email
    order = await db.orders.find_one({"order_id": order_id})
    email_html = generate_order_shipped_html(order)
    await send_order_email(order["shipping_address"]["email"], f"Order Shipped #{order_id}", email_html)
    
    await log_activity(admin.user_id, admin.name, "update", "order", f"Added tracking for order {order_id}")
    
    return {"status": "success"}

@api_router.post("/admin/orders/{order_id}/resend-notification")
async def resend_notification(order_id: str, payload: dict, admin: AdminUser = Depends(require_admin)):
    """Resend email notification"""
    type = payload.get("type", "confirmation")
    order = await db.orders.find_one({"order_id": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    email = order["shipping_address"]["email"]
    
    if type == "confirmation":
        email_html = generate_order_confirmation_html(order)
        await send_order_email(email, f"Order Confirmation #{order_id}", email_html)
    elif type == "shipping" and order.get("tracking_number"):
        email_html = generate_order_shipped_html(order)
        await send_order_email(email, f"Order Shipped #{order_id}", email_html)
    
    return {"status": "success"}

# ==================== COUPON ROUTES ====================

@api_router.get("/admin/coupons")
async def get_coupons(admin: AdminUser = Depends(require_admin)):
    """Get all coupons"""
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"coupons": coupons}

@api_router.post("/admin/coupons")
async def create_coupon(coupon_data: CouponCreate, admin: AdminUser = Depends(require_admin)):
    """Create coupon"""
    coupon = Coupon(**coupon_data.model_dump())
    doc = coupon.model_dump()
    if doc.get("expires_at"):
        doc["expires_at"] = doc["expires_at"].isoformat()
    
    await db.coupons.insert_one(doc)
    
    await log_activity(admin.user_id, admin.name, "create", "coupon", f"Created coupon {coupon.code}")
    return coupon

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: AdminUser = Depends(require_admin)):
    """Delete coupon"""
    await db.coupons.delete_one({"coupon_id": coupon_id})
    await log_activity(admin.user_id, admin.name, "delete", "coupon", f"Deleted coupon {coupon_id}")
    return {"status": "success"}

@api_router.post("/cart/{session_id}/coupon")
async def apply_coupon_to_cart(session_id: str, payload: dict):
    """Apply coupon to cart"""
    code = payload.get("code")
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    coupon = await db.coupons.find_one({"code": code, "is_active": True})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon")
        
    # Calculate discount (simplified)
    # In real app, check min_cart_value, expiry, etc.
    discount = coupon["discount_value"]
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"coupon_code": code, "coupon_discount": discount}}
    )
    
    updated_cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    return updated_cart

@api_router.delete("/cart/{session_id}/coupon")
async def remove_coupon_from_cart(session_id: str):
    """Remove coupon from cart"""
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"coupon_code": None, "coupon_discount": 0}}
    )
    updated_cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    return updated_cart

# ==================== SETTINGS & REPORTS ROUTES ====================

@api_router.get("/admin/settings")
async def get_settings(admin: AdminUser = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        return StoreSettings().model_dump()
    return settings

@api_router.put("/admin/settings")
async def update_settings(settings: StoreSettings, admin: AdminUser = Depends(require_admin)):
    doc = settings.model_dump()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.settings.replace_one({}, doc, upsert=True)
    await log_activity(admin.user_id, admin.name, "update", "settings", "Updated store settings")
    return settings

@api_router.get("/admin/activity-log")
async def get_activity_log(
    limit: int = 50, 
    skip: int = 0,
    type: Optional[str] = None,
    admin: AdminUser = Depends(require_admin)
):
    query = {}
    if type:
        query["type"] = type
    activities = await db.activity_log.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return {"activities": activities}

@api_router.get("/admin/reports/sales")
async def get_sales_report(admin: AdminUser = Depends(require_admin)):
    # Mock data for now
    today = datetime.now()
    dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    dates.reverse()
    
    return {
        "dates": dates,
        "sales": [1200, 1500, 800, 2000, 1800, 2500, 3000],
        "orders": [5, 7, 3, 9, 8, 12, 15]
    }

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        # Create new cart
        new_cart = Cart(session_id=session_id)
        doc = new_cart.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.carts.insert_one(doc)
        return new_cart
    return cart

@api_router.post("/cart/{session_id}/add")
async def add_to_cart(session_id: str, item: dict):
    """Add a product to the cart or increment quantity if it exists"""
    product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        # Should be created by get_cart, but just in case
        new_cart = Cart(session_id=session_id)
        cart = new_cart.model_dump()
        cart["created_at"] = cart["created_at"].isoformat()
        cart["updated_at"] = cart["updated_at"].isoformat()
        await db.carts.insert_one(cart)
    
    items = cart.get("items", [])
    product_id = item["product_id"]
    size = item.get("size", "M")
    quantity = item.get("quantity", 1)
    
    # Check if item exists
    found = False
    for cart_item in items:
        if cart_item["product_id"] == product_id and cart_item["size"] == size:
            cart_item["quantity"] += quantity
            found = True
            break
            
    if not found:
        # Add new item
        new_item = {
            "product_id": product_id,
            "name": product["name"],
            "price": product["price"],
            "sale_price": product.get("sale_price"),
            "quantity": quantity,
            "size": size,
            "image": product["images"][0] if product.get("images") else "",
            "weight_grams": product.get("weight_grams", 0)
        }
        items.append(new_item)
        
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(session_id)

@api_router.put("/cart/{session_id}/update")
async def update_cart_item(session_id: str, payload: dict):
    """Update quantity of an item in the cart"""
    product_id = payload.get("product_id")
    size = payload.get("size")
    quantity = payload.get("quantity", 1)
    
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    items = cart.get("items", [])
    
    if quantity <= 0:
        # Remove item if quantity is 0 or less
        items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    else:
        # Update quantity
        for i in items:
            if i["product_id"] == product_id and i["size"] == size:
                i["quantity"] = quantity
                break
                
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(session_id)

@api_router.delete("/cart/{session_id}/item")
async def remove_from_cart(session_id: str, product_id: str = Query(...), size: str = Query(...)):
    """Remove an item from the cart"""
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    items = cart.get("items", [])
    items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(session_id)

@api_router.delete("/cart/{session_id}")
async def clear_cart(session_id: str):
    """Clear all items from the cart"""
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"items": [], "coupon_code": None, "coupon_discount": 0, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success", "message": "Cart cleared"}


# ==================== CUSTOMER ROUTES ====================

@api_router.get("/admin/customers")
async def get_customers(
    limit: int = 50, 
    skip: int = 0,
    search: Optional[str] = None,
    admin: AdminUser = Depends(require_admin)
):
    """Get all customers"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
        
    customers = await db.users.find(query, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"customers": customers, "total": total}

@api_router.get("/admin/customers/{user_id}")
async def get_customer_details(user_id: str, admin: AdminUser = Depends(require_admin)):
    """Get customer details and orders"""
    customer = await db.users.find_one({"user_id": user_id}, {"_id": 0, "hashed_password": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {"customer": customer, "orders": orders}



# ==================== ANALYTICS ROUTES ====================

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: AdminUser = Depends(require_admin)):
    """Get dashboard statistics"""
    
    # 1. Totals
    total_orders = await db.orders.count_documents({})
    
    # Calculate revenue
    pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    pending_orders = await db.orders.count_documents({"order_status": "pending"})
    
    # Shipped today
    start_of_day = datetime.combine(datetime.now(), datetime.min.time())
    shipped_today = await db.orders.count_documents({
        "order_status": "shipped",
        # Note: string comparison for ISO dates works for > check if format is consistent
        "updated_at": {"$gte": start_of_day.isoformat()}
    })

    # 2. Low Stock
    low_stock_threshold = 5
    low_stock_count = await db.products.count_documents({"stock": {"$lte": low_stock_threshold}})
    low_stock_products = await db.products.find(
        {"stock": {"$lte": low_stock_threshold}}, 
        {"_id": 0}
    ).limit(5).to_list(5)
    
    # 3. Recent Orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "shipped_today": shipped_today,
        "low_stock_count": low_stock_count,
        "low_stock_products": low_stock_products,
        "recent_orders": recent_orders
    }

@api_router.get("/admin/reports")
async def get_reports(
    days: Optional[int] = None, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    admin: AdminUser = Depends(require_admin)
):
    """Get sales reports with custom date range support"""
    match_stage = {}
    
    # Determine date range
    if start_date and end_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
            
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        if end.hour == 0 and end.minute == 0:
            end = end.replace(hour=23, minute=59, second=59)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
            
        match_stage = {"$match": {"created_at": {"$gte": start.isoformat(), "$lte": end.isoformat()}}}
    elif days:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        match_stage = {"$match": {"created_at": {"$gte": cutoff_date.isoformat()}}}
    
    # If neither days nor custom range provided, match_stage remains empty (All Time)
    
    # helper to build pipeline stages safely
    active_match = [match_stage] if match_stage else []
    
    revenue_pipeline = active_match + [{"$group": {"_id": None, "total_revenue": {"$sum": "$total"}, "count": {"$sum": 1}}}]
    revenue_res = await db.orders.aggregate(revenue_pipeline).to_list(1)
    
    total_revenue = revenue_res[0]["total_revenue"] if revenue_res else 0
    total_orders = revenue_res[0]["count"] if revenue_res else 0
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # 3. Orders by Status
    status_pipeline = active_match + [
        {"$group": {"_id": "$order_status", "count": {"$sum": 1}}}
    ]
    status_res = await db.orders.aggregate(status_pipeline).to_list(10)
    orders_by_status = {item["_id"]: item["count"] for item in status_res}
    
    # 4. Best Sellers
    best_seller_pipeline = active_match + [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id", 
            "name": {"$first": "$items.name"},
            "total_quantity": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
        }},
        {"$sort": {"total_quantity": -1}},
        {"$limit": 5}
    ]
    best_sellers = await db.orders.aggregate(best_seller_pipeline).to_list(5)
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "avg_order_value": avg_order_value,
        "best_sellers": best_sellers,
        "orders_by_status": orders_by_status
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Security Headers Middleware (first in chain)
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware (second in chain)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://srfashiondubai.com",
        "https://admin.srfashiondubai.com"
    ] + os.environ.get('CORS_ORIGINS', '').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

async def cancel_expired_orders():
    """Background task to cancel orders with pending payment for more than 5 minutes (excludes COD)"""
    while True:
        try:
            # Calculate 5 minutes ago
            five_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
            
            # Find orders with pending payment older than 5 minutes (exclude COD orders)
            expired_orders = await db.orders.find({
                "payment_status": "pending",
                "payment_method": {"$nin": ["COD", "cod", "Cash on Delivery"]},  # Exclude all COD naming variations
                "created_at": {"$lt": five_minutes_ago},
                "order_status": {"$ne": "cancelled"}
            }).to_list(100)
            
            for order in expired_orders:
                order_id = order["order_id"]
                logger.info(f"Auto-cancelling expired order and returning stock: {order_id}")
                
                # 1. Return items to inventory
                for item in order["items"]:
                    await db.products.update_one(
                        {"product_id": item["product_id"]},
                        {"$inc": {"stock": item["quantity"]}}
                    )
                
                # 2. Update order status
                await db.orders.update_one(
                    {"order_id": order_id},
                    {
                        "$set": {
                            "order_status": "cancelled",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # 3. Send auto-cancellation email (payment not received)
                email_html = generate_order_cancelled_auto_html(order)
                await send_order_email(order["shipping_address"]["email"], f"Order Cancelled #{order_id}", email_html)
                
                # Log activity (system action)
                await log_activity("system", "System", "update", "order", f"Auto-cancelled expired order {order_id} and restored inventory")
                
        except Exception as e:
            logger.error(f"Error in background cancel task: {e}")
            
        # Run every 1 minute for better responsiveness
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    # Start the background task
    asyncio.create_task(cancel_expired_orders())
    logger.info("Background task for order cancellation started")
