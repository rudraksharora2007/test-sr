from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import razorpay
import resend
import asyncio
import json
import hmac
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay setup (test keys)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Resend setup
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI(title="Dubai SR E-commerce API")
api_router = APIRouter(prefix="/api")

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
    sizes: List[str] = ["S", "M", "L", "XL"]
    stock: int = 0
    is_featured: bool = False
    is_new_arrival: bool = False
    is_on_sale: bool = False
    is_active: bool = True
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
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    is_active: Optional[bool] = None

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

class ShippingAddress(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    sale_price: Optional[float] = None
    quantity: int
    size: str
    image: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"ORD{uuid.uuid4().hex[:8].upper()}")
    items: List[OrderItem]
    shipping_address: ShippingAddress
    subtotal: float
    coupon_code: Optional[str] = None
    coupon_discount: float = 0
    shipping_cost: float = 0
    total: float
    payment_method: str  # "razorpay" or "cod"
    payment_status: str = "pending"  # pending, paid, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    order_status: str = "pending"  # pending, processing, shipped, delivered, cancelled
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    coupon_code: Optional[str] = None
    payment_method: str

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = ""
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================

async def get_current_admin(request: Request) -> Optional[AdminUser]:
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

async def require_admin(request: Request) -> AdminUser:
    """Require admin authentication"""
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Authentication required")
    return admin

async def send_order_email(email: str, subject: str, html_content: str):
    """Send email using Resend (non-blocking)"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create session"""
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        # Call Emergent Auth to get user data
        async with httpx.AsyncClient() as client_http:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        
        # Check if user exists or create new
        existing_user = await db.admin_users.find_one({"email": user_data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
        else:
            # Create new admin user
            new_user = AdminUser(
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture", "")
            )
            user_doc = new_user.model_dump()
            user_doc["created_at"] = user_doc["created_at"].isoformat()
            await db.admin_users.insert_one(user_doc)
            user_id = new_user.user_id
        
        # Create session
        session_token = user_data.get("session_token", f"sess_{uuid.uuid4().hex}")
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
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        
        # Get user data to return
        user_doc = await db.admin_users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {"status": "success", "user": user_doc}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return admin.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"status": "success"}

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
    if category_id:
        query["category_id"] = category_id
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
    """Get all unique brands"""
    brands = await db.products.distinct("brand", {"is_active": True})
    return {"brands": brands}

# ==================== COUPON ROUTES ====================

@api_router.get("/admin/coupons", response_model=List[Coupon])
async def get_coupons(admin: AdminUser = Depends(require_admin)):
    """Get all coupons (admin only)"""
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return coupons

@api_router.post("/admin/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponCreate, admin: AdminUser = Depends(require_admin)):
    """Create a new coupon (admin only)"""
    # Check if code already exists
    existing = await db.coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(**coupon_data.model_dump())
    coupon.code = coupon.code.upper()
    doc = coupon.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    if doc["expires_at"]:
        doc["expires_at"] = doc["expires_at"].isoformat()
    await db.coupons.insert_one(doc)
    return coupon

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_data: CouponCreate, admin: AdminUser = Depends(require_admin)):
    """Update a coupon (admin only)"""
    update_data = coupon_data.model_dump()
    update_data["code"] = update_data["code"].upper()
    if update_data["expires_at"]:
        update_data["expires_at"] = update_data["expires_at"].isoformat()
    
    result = await db.coupons.update_one(
        {"coupon_id": coupon_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon = await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})
    return coupon

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: AdminUser = Depends(require_admin)):
    """Delete a coupon (admin only)"""
    result = await db.coupons.delete_one({"coupon_id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"status": "success"}

@api_router.post("/coupons/validate")
async def validate_coupon(request: Request):
    """Validate a coupon code"""
    body = await request.json()
    code = body.get("code", "").upper()
    cart_total = body.get("cart_total", 0)
    
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check expiry
    if coupon.get("expires_at"):
        expires_at = coupon["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check usage limit
    if coupon.get("max_uses") and coupon.get("current_uses", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Check minimum cart value
    if cart_total < coupon.get("min_cart_value", 0):
        raise HTTPException(status_code=400, detail=f"Minimum cart value of ₹{coupon['min_cart_value']} required")
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = cart_total * (coupon["discount_value"] / 100)
    else:
        discount = coupon["discount_value"]
    
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": discount
    }

# ==================== CART ROUTES ====================

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    """Get cart by session ID"""
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"cart_id": None, "session_id": session_id, "items": [], "coupon_code": None, "coupon_discount": 0}
    return cart

@api_router.post("/cart/{session_id}/add")
async def add_to_cart(session_id: str, request: Request):
    """Add item to cart"""
    body = await request.json()
    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)
    size = body.get("size", "M")
    
    # Get product
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product.get("stock", 0) < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Get or create cart
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    
    if not cart:
        cart = Cart(session_id=session_id).model_dump()
        cart["created_at"] = cart["created_at"].isoformat()
        cart["updated_at"] = cart["updated_at"].isoformat()
    
    # Check if item already in cart
    items = cart.get("items", [])
    item_found = False
    
    for item in items:
        if item["product_id"] == product_id and item["size"] == size:
            item["quantity"] += quantity
            item_found = True
            break
    
    if not item_found:
        new_item = CartItem(
            product_id=product_id,
            name=product["name"],
            price=product["price"],
            sale_price=product.get("sale_price"),
            quantity=quantity,
            size=size,
            image=product["images"][0] if product.get("images") else ""
        )
        items.append(new_item.model_dump())
    
    cart["items"] = items
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart},
        upsert=True
    )
    
    return cart

@api_router.put("/cart/{session_id}/update")
async def update_cart_item(session_id: str, request: Request):
    """Update cart item quantity"""
    body = await request.json()
    product_id = body.get("product_id")
    size = body.get("size")
    quantity = body.get("quantity")
    
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    
    if quantity <= 0:
        # Remove item
        items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    else:
        # Update quantity
        for item in items:
            if item["product_id"] == product_id and item["size"] == size:
                # Check stock
                product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
                if product and product.get("stock", 0) < quantity:
                    raise HTTPException(status_code=400, detail="Insufficient stock")
                item["quantity"] = quantity
                break
    
    cart["items"] = items
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart}
    )
    
    return cart

@api_router.delete("/cart/{session_id}/item")
async def remove_cart_item(session_id: str, product_id: str, size: str):
    """Remove item from cart"""
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    items = [i for i in items if not (i["product_id"] == product_id and i["size"] == size)]
    
    cart["items"] = items
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart}
    )
    
    return cart

@api_router.post("/cart/{session_id}/coupon")
async def apply_cart_coupon(session_id: str, request: Request):
    """Apply coupon to cart"""
    body = await request.json()
    code = body.get("code", "").upper()
    
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Calculate cart total
    items = cart.get("items", [])
    cart_total = sum(
        (item.get("sale_price") or item["price"]) * item["quantity"]
        for item in items
    )
    
    # Validate coupon
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check expiry
    if coupon.get("expires_at"):
        expires_at = coupon["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check minimum cart value
    if cart_total < coupon.get("min_cart_value", 0):
        raise HTTPException(status_code=400, detail=f"Minimum cart value of ₹{coupon['min_cart_value']} required")
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = cart_total * (coupon["discount_value"] / 100)
    else:
        discount = min(coupon["discount_value"], cart_total)
    
    cart["coupon_code"] = code
    cart["coupon_discount"] = discount
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart}
    )
    
    return cart

@api_router.delete("/cart/{session_id}/coupon")
async def remove_cart_coupon(session_id: str):
    """Remove coupon from cart"""
    result = await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"coupon_code": None, "coupon_discount": 0, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    return cart

@api_router.delete("/cart/{session_id}")
async def clear_cart(session_id: str):
    """Clear entire cart"""
    await db.carts.delete_one({"session_id": session_id})
    return {"status": "success"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    # Calculate totals
    subtotal = sum(
        (item.sale_price or item.price) * item.quantity
        for item in order_data.items
    )
    
    # Apply coupon if present
    coupon_discount = 0
    if order_data.coupon_code:
        coupon = await db.coupons.find_one({"code": order_data.coupon_code.upper(), "is_active": True}, {"_id": 0})
        if coupon:
            if coupon["discount_type"] == "percentage":
                coupon_discount = subtotal * (coupon["discount_value"] / 100)
            else:
                coupon_discount = min(coupon["discount_value"], subtotal)
    
    # Calculate shipping (free above 2999)
    shipping_cost = 0 if subtotal >= 2999 else 99
    
    total = subtotal - coupon_discount + shipping_cost
    
    # Verify stock for all items
    for item in order_data.items:
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
    
    # Create order
    order = Order(
        items=[item.model_dump() for item in order_data.items],
        shipping_address=order_data.shipping_address.model_dump(),
        subtotal=subtotal,
        coupon_code=order_data.coupon_code,
        coupon_discount=coupon_discount,
        shipping_cost=shipping_cost,
        total=total,
        payment_method=order_data.payment_method
    )
    
    # If Razorpay payment, create Razorpay order
    if order_data.payment_method == "razorpay":
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": int(total * 100),  # In paise
                "currency": "INR",
                "receipt": order.order_id,
                "payment_capture": 1
            })
            order.razorpay_order_id = razorpay_order["id"]
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Payment gateway error")
    else:
        # COD order - mark as confirmed
        order.payment_status = "cod_pending"
        order.order_status = "processing"
        
        # Reduce stock
        for item in order_data.items:
            await db.products.update_one(
                {"product_id": item.product_id},
                {"$inc": {"stock": -item.quantity}}
            )
        
        # Increment coupon usage
        if order_data.coupon_code:
            await db.coupons.update_one(
                {"code": order_data.coupon_code.upper()},
                {"$inc": {"current_uses": 1}}
            )
    
    # Save order
    order_doc = order.model_dump()
    order_doc["created_at"] = order_doc["created_at"].isoformat()
    order_doc["updated_at"] = order_doc["updated_at"].isoformat()
    await db.orders.insert_one(order_doc)
    
    # Send confirmation email for COD orders
    if order_data.payment_method == "cod":
        email_html = f"""
        <h1>Order Confirmed - Dubai SR</h1>
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> {order.order_id}</p>
        <p><strong>Total:</strong> ₹{total:,.2f}</p>
        <p><strong>Payment:</strong> Cash on Delivery</p>
        <p>Your order is confirmed and under processing.</p>
        """
        asyncio.create_task(send_order_email(
            order_data.shipping_address.email,
            f"Order Confirmed - {order.order_id}",
            email_html
        ))
    
    return order.model_dump()

@api_router.post("/orders/verify-payment")
async def verify_payment(request: Request):
    """Verify Razorpay payment and update order"""
    body = await request.json()
    order_id = body.get("order_id")
    razorpay_order_id = body.get("razorpay_order_id")
    razorpay_payment_id = body.get("razorpay_payment_id")
    razorpay_signature = body.get("razorpay_signature")
    
    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update order
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Reduce stock
    for item in order["items"]:
        await db.products.update_one(
            {"product_id": item["product_id"]},
            {"$inc": {"stock": -item["quantity"]}}
        )
    
    # Increment coupon usage
    if order.get("coupon_code"):
        await db.coupons.update_one(
            {"code": order["coupon_code"]},
            {"$inc": {"current_uses": 1}}
        )
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "payment_status": "paid",
            "razorpay_payment_id": razorpay_payment_id,
            "order_status": "processing",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send confirmation email
    email_html = f"""
    <h1>Payment Received - Dubai SR</h1>
    <p>Thank you for your payment!</p>
    <p><strong>Order ID:</strong> {order_id}</p>
    <p><strong>Total:</strong> ₹{order['total']:,.2f}</p>
    <p>Your order is confirmed and under processing.</p>
    """
    asyncio.create_task(send_order_email(
        order["shipping_address"]["email"],
        f"Payment Confirmed - {order_id}",
        email_html
    ))
    
    return {"status": "success", "order_id": order_id}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin: AdminUser = Depends(require_admin)
):
    """Get all orders (admin only)"""
    query = {}
    if status:
        query["order_status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {"orders": orders, "total": total}

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, admin: AdminUser = Depends(require_admin)):
    """Update order status (admin only)"""
    body = await request.json()
    order_status = body.get("order_status")
    
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if order_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"order_status": order_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return order

@api_router.put("/admin/orders/{order_id}/tracking")
async def update_order_tracking(order_id: str, request: Request, admin: AdminUser = Depends(require_admin)):
    """Update order tracking details (admin only)"""
    body = await request.json()
    courier_name = body.get("courier_name")
    tracking_number = body.get("tracking_number")
    tracking_url = body.get("tracking_url")
    
    update_data = {
        "courier_name": courier_name,
        "tracking_number": tracking_number,
        "tracking_url": tracking_url,
        "order_status": "shipped",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Send shipping notification email
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    email_html = f"""
    <h1>Your Order Has Been Shipped - Dubai SR</h1>
    <p>Great news! Your order is on its way.</p>
    <p><strong>Order ID:</strong> {order_id}</p>
    <p><strong>Courier:</strong> {courier_name}</p>
    <p><strong>Tracking Number:</strong> {tracking_number}</p>
    {"<p><strong>Track your order:</strong> <a href='" + tracking_url + "'>Click here</a></p>" if tracking_url else ""}
    """
    asyncio.create_task(send_order_email(
        order["shipping_address"]["email"],
        f"Order Shipped - {order_id}",
        email_html
    ))
    
    return order

# ==================== ADMIN DASHBOARD ROUTES ====================

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: AdminUser = Depends(require_admin)):
    """Get dashboard statistics (admin only)"""
    # Total orders
    total_orders = await db.orders.count_documents({})
    
    # Pending orders
    pending_orders = await db.orders.count_documents({"order_status": "pending"})
    
    # Processing orders
    processing_orders = await db.orders.count_documents({"order_status": "processing"})
    
    # Total revenue (from paid orders)
    pipeline = [
        {"$match": {"$or": [{"payment_status": "paid"}, {"payment_status": "cod_pending"}]}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Total products
    total_products = await db.products.count_documents({"is_active": True})
    
    # Low stock products (stock < 5)
    low_stock = await db.products.count_documents({"stock": {"$lt": 5}, "is_active": True})
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "total_revenue": total_revenue,
        "total_products": total_products,
        "low_stock_products": low_stock,
        "recent_orders": recent_orders
    }

# ==================== SEEDING ROUTES ====================

@api_router.post("/seed")
async def seed_database():
    """Seed initial data"""
    # Check if already seeded
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"status": "already_seeded"}
    
    # Seed categories
    categories = [
        Category(name="Stitched Suits", slug="stitched-suits", description="Ready to wear designer suits", image_url="https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"),
        Category(name="Unstitched Suits", slug="unstitched-suits", description="Premium fabric collections", image_url="https://images.unsplash.com/photo-1725677356693-cdd8b255250a?crop=entropy&cs=srgb&fm=jpg&q=85"),
        Category(name="Bridal Wear", slug="bridal-wear", description="Exquisite bridal collections", image_url="https://images.unsplash.com/photo-1640181637089-cce4a3040ed2?crop=entropy&cs=srgb&fm=jpg&q=85"),
        Category(name="Party Wear", slug="party-wear", description="Elegant party collections", image_url="https://images.unsplash.com/photo-1580406266957-2b06a222bca5?crop=entropy&cs=srgb&fm=jpg&q=85"),
    ]
    
    category_ids = {}
    for cat in categories:
        doc = cat.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.categories.insert_one(doc)
        category_ids[cat.slug] = cat.category_id
    
    # Seed products
    products = [
        Product(
            name="Maria B Embroidered Lawn Suit",
            slug="maria-b-embroidered-lawn",
            description="Exquisite embroidered lawn suit with intricate threadwork. Perfect for summer occasions. Includes shirt, dupatta, and trousers.",
            brand="Maria B",
            category_id=category_ids["stitched-suits"],
            price=8999,
            sale_price=6999,
            images=["https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=15,
            is_featured=True,
            is_on_sale=True
        ),
        Product(
            name="Sana Safinaz Luxury Collection",
            slug="sana-safinaz-luxury",
            description="Premium luxury suit from Sana Safinaz. Featuring elegant embroidery and premium fabric.",
            brand="Sana Safinaz",
            category_id=category_ids["stitched-suits"],
            price=12999,
            images=["https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=10,
            is_featured=True,
            is_new_arrival=True
        ),
        Product(
            name="Tawakkal Unstitched Lawn",
            slug="tawakkal-unstitched-lawn",
            description="Beautiful unstitched lawn fabric with modern prints. Customize to your measurements.",
            brand="Tawakkal",
            category_id=category_ids["unstitched-suits"],
            price=4999,
            sale_price=3999,
            images=["https://images.unsplash.com/photo-1725677356693-cdd8b255250a?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=25,
            is_on_sale=True
        ),
        Product(
            name="Noor Bridal Lehenga Rose Gold",
            slug="noor-bridal-lehenga-rose-gold",
            description="Stunning rose gold bridal lehenga with heavy embroidery. Perfect for your special day.",
            brand="Noor",
            category_id=category_ids["bridal-wear"],
            price=45999,
            sale_price=39999,
            images=["https://images.unsplash.com/photo-1640181637089-cce4a3040ed2?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=3,
            is_featured=True,
            is_on_sale=True
        ),
        Product(
            name="Adan Libas Bridal Lehenga",
            slug="adan-libas-bridal-lehenga",
            description="Luxurious bridal lehenga with traditional craftsmanship and modern elegance.",
            brand="Adan Libas",
            category_id=category_ids["bridal-wear"],
            price=55999,
            sale_price=49999,
            images=["https://images.unsplash.com/photo-1766763846239-bfea22785d03?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=2,
            is_featured=True,
            is_on_sale=True
        ),
        Product(
            name="Maria B Formal Collection",
            slug="maria-b-formal",
            description="Elegant formal suit for special occasions. Features premium fabric and sophisticated design.",
            brand="Maria B",
            category_id=category_ids["party-wear"],
            price=15999,
            images=["https://images.unsplash.com/photo-1769500810141-644865a6d35c?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=8,
            is_new_arrival=True
        ),
        Product(
            name="Sana Safinaz Party Wear",
            slug="sana-safinaz-party-wear",
            description="Glamorous party wear suit with intricate detailing. Stand out at any event.",
            brand="Sana Safinaz",
            category_id=category_ids["party-wear"],
            price=18999,
            sale_price=15999,
            images=["https://images.unsplash.com/photo-1580406266957-2b06a222bca5?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=6,
            is_on_sale=True
        ),
        Product(
            name="Tawakkal Summer Collection",
            slug="tawakkal-summer",
            description="Light and breezy summer suit. Perfect for everyday elegance.",
            brand="Tawakkal",
            category_id=category_ids["stitched-suits"],
            price=5999,
            images=["https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"],
            stock=20,
            is_new_arrival=True
        ),
    ]
    
    for prod in products:
        doc = prod.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.products.insert_one(doc)
    
    # Seed sample coupons
    coupons = [
        Coupon(code="WELCOME10", discount_type="percentage", discount_value=10, min_cart_value=1000),
        Coupon(code="FLAT500", discount_type="flat", discount_value=500, min_cart_value=3000),
    ]
    
    for cpn in coupons:
        doc = cpn.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.coupons.insert_one(doc)
    
    return {"status": "seeded", "categories": len(categories), "products": len(products), "coupons": len(coupons)}

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
