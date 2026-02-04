"""
Shipping Rate Calculator Module
Uses Shiprocket API to fetch rates from DTDC (India) and DHL (International)
"""
import httpx
import os
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

# Origin (Warehouse) Configuration
ORIGIN_PINCODE = "110002"  # Delhi warehouse - Update to actual warehouse pincode
ORIGIN_COUNTRY = "IN"

# Shiprocket API Configuration
# These are read inside functions to ensure .env is loaded
SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external"

class ShippingError(Exception):
    """Raised when shipping rates cannot be fetched"""
    pass

def get_shipping_zone(country: str) -> str:
    """Determine shipping zone from country"""
    if country.lower() in ["india", "in", "ind"]:
        return "india"
    return "international"

def calculate_total_weight(items: list) -> float:
    """Calculate total weight in kg from cart items"""
    total_grams = sum(item.get("weight_grams", 0) * item.get("quantity", 1) for item in items)
    return max(0.5, total_grams / 1000)  # Minimum 0.5kg

async def get_shiprocket_token(db) -> str:
    """
    Get or refresh Shiprocket JWT token.
    Token is cached in database and valid for 10 days.
    """
    email = os.environ.get("SHIPROCKET_EMAIL", "")
    password = os.environ.get("SHIPROCKET_PASSWORD", "")
    
    if not email or not password:
        logger.warning("Shiprocket credentials not configured")
        raise ShippingError("Shiprocket credentials not configured")
    
    # Check if we have a valid cached token
    settings = await db.shiprocket_settings.find_one({"_id": "auth_token"})
    
    if settings:
        expiry = settings.get("expiry")
        if expiry and isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry)
        
        # If token is still valid (with 1 hour buffer), return it
        if expiry and expiry > datetime.now(timezone.utc) + timedelta(hours=1):
            logger.info("Using cached Shiprocket token")
            return settings["token"]
    
    # Token expired or doesn't exist, fetch new one
    logger.info("Fetching new Shiprocket token")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SHIPROCKET_API_BASE}/auth/login",
                json={
                    "email": email,
                    "password": password
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Shiprocket auth failed: {response.text}")
                raise ShippingError("Failed to authenticate with Shiprocket")
            
            data = response.json()
            token = data.get("token")
            
            if not token:
                raise ShippingError("No token received from Shiprocket")
            
            # Cache token in database (valid for 10 days)
            expiry = datetime.now(timezone.utc) + timedelta(days=10)
            await db.shiprocket_settings.update_one(
                {"_id": "auth_token"},
                {
                    "$set": {
                        "token": token,
                        "expiry": expiry.isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
            
            logger.info("Shiprocket token cached successfully")
            return token
            
    except httpx.RequestError as e:
        logger.error(f"Shiprocket auth connection error: {e}")
        raise ShippingError("Unable to connect to Shiprocket")

async def get_shiprocket_rates(
    db,
    pickup_pincode: str,
    delivery_pincode: str,
    weight_kg: float,
    cod: bool,
    declared_value: float,
    preferred_courier: str = None
) -> list:
    """
    Fetch shipping rates from Shiprocket API.
    Returns list of available courier options.
    """
    token = await get_shiprocket_token(db)
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Shiprocket serviceability endpoint
            url = f"{SHIPROCKET_API_BASE}/courier/serviceability/"
            
            params = {
                "pickup_postcode": pickup_pincode,
                "delivery_postcode": delivery_pincode,
                "weight": weight_kg,
                "cod": 1 if cod else 0,
                "declared_value": declared_value
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 401:
                # Token expired, clear cache and retry once
                logger.warning("Shiprocket token expired, refreshing...")
                await db.shiprocket_settings.delete_one({"_id": "auth_token"})
                token = await get_shiprocket_token(db)
                headers["Authorization"] = f"Bearer {token}"
                response = await client.get(url, params=params, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Shiprocket API error: {response.status_code} - {response.text}")
                raise ShippingError("Failed to fetch shipping rates from Shiprocket")
            
            data = response.json()
            
            # Extract available couriers
            couriers = data.get("data", {}).get("available_courier_companies", [])
            
            if not couriers:
                logger.warning(f"No couriers available for {pickup_pincode} -> {delivery_pincode}")
                raise ShippingError("No courier services available for this route")
            
            # Filter for preferred courier if specified
            if preferred_courier:
                filtered = [c for c in couriers if preferred_courier.upper() in c.get("courier_name", "").upper()]
                if filtered:
                    return filtered
                logger.warning(f"{preferred_courier} not available, showing all options")
            
            return couriers
            
    except httpx.RequestError as e:
        logger.error(f"Shiprocket API connection error: {e}")
        raise ShippingError("Unable to connect to Shiprocket")

def format_shiprocket_response(courier_data: Dict, cod_available: bool) -> Dict[str, Any]:
    """
    Format Shiprocket courier data into our standard response format.
    """
    return {
        "cost": float(courier_data.get("freight_charge", 0)),
        "delivery_days": courier_data.get("etd", "5-7 days"),
        "carrier": courier_data.get("courier_name", "Unknown"),
        "cod_available": cod_available and courier_data.get("cod") == 1,
        "cod_fee": float(courier_data.get("cod_charges", 0)),
        "courier_id": courier_data.get("courier_company_id")
    }

async def get_shipping_rate(db, country: str, pincode: str, items: list, subtotal: float = 0) -> Dict[str, Any]:
    """
    Main function to get shipping rates via Shiprocket.
    Filters for DTDC (India) or DHL (International) only.
    Strictly requires Shiprocket configuration; no mock fallback.
    """
    zone = get_shipping_zone(country)
    weight_kg = calculate_total_weight(items)
    
    email = os.environ.get("SHIPROCKET_EMAIL", "")
    password = os.environ.get("SHIPROCKET_PASSWORD", "")
    
    if not email or not password:
        logger.error("Shiprocket credentials not configured")
        raise ShippingError("Shipping service currently unavailable (Configuration missing)")
    
    try:
        if zone == "india":
            # Fetch rates and filter for DTDC
            couriers = await get_shiprocket_rates(
                db=db,
                pickup_pincode=ORIGIN_PINCODE,
                delivery_pincode=pincode,
                weight_kg=weight_kg,
                cod=True,
                declared_value=subtotal,
                preferred_courier="DTDC"
            )
            
            # Find DTDC in the results
            dtdc = next((c for c in couriers if "DTDC" in c.get("courier_name", "").upper()), None)
            
            if not dtdc:
                logger.warning("DTDC not available, using first available courier")
                dtdc = couriers[0] if couriers else None
            
            if not dtdc:
                raise ShippingError("No courier available for this pincode")
            
            return format_shiprocket_response(dtdc, cod_available=True)
        
        else:
            # International - fetch rates and filter for DHL
            couriers = await get_shiprocket_rates(
                db=db,
                pickup_pincode=ORIGIN_PINCODE,
                delivery_pincode=pincode,
                weight_kg=weight_kg,
                cod=False,
                declared_value=subtotal,
                preferred_courier="DHL"
            )
            
            # Find DHL in the results
            dhl = next((c for c in couriers if "DHL" in c.get("courier_name", "").upper()), None)
            
            if not dhl:
                logger.warning("DHL not available, using first available international courier")
                dhl = couriers[0] if couriers else None
            
            if not dhl:
                raise ShippingError("No international courier available")
            
            return format_shiprocket_response(dhl, cod_available=False)
    
    except Exception as e:
        logger.error(f"Shiprocket API failure: {e}")
        if isinstance(e, ShippingError):
            raise e
        raise ShippingError(f"Shipping calculation failed: {str(e)}")
