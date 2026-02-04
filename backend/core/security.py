"""
Core security utilities for authentication, authorization, and account protection.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib
import secrets
import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Session Configuration
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_HOURS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_HOURS", "12"))

# Account Lockout Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


async def check_account_lockout(db: AsyncIOMotorDatabase, email: str, collection: str = "users") -> tuple[bool, Optional[datetime]]:
    """
    Check if an account is currently locked due to failed login attempts.
    
    Args:
        db: MongoDB database instance
        email: User email to check
        collection: Collection name ("users" or "admin_users")
    
    Returns:
        Tuple of (is_locked: bool, locked_until: Optional[datetime])
    """
    user = await db[collection].find_one({"email": email})
    
    if not user:
        return False, None
    
    locked_until = user.get("locked_until")
    
    if locked_until:
        # Check if lock has expired
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        
        if datetime.now(timezone.utc) < locked_until:
            return True, locked_until
        else:
            # Lock expired, clear it
            await db[collection].update_one(
                {"email": email},
                {"$set": {"locked_until": None, "failed_login_attempts": 0}}
            )
            return False, None
    
    return False, None


async def record_failed_login(db: AsyncIOMotorDatabase, email: str, collection: str = "users") -> int:
    """
    Record a failed login attempt and lock account if threshold exceeded.
    
    Args:
        db: MongoDB database instance
        email: User email
        collection: Collection name ("users" or "admin_users")
    
    Returns:
        Number of failed attempts
    """
    user = await db[collection].find_one({"email": email})
    
    if not user:
        return 0
    
    failed_attempts = user.get("failed_login_attempts", 0) + 1
    
    update_data = {"failed_login_attempts": failed_attempts}
    
    # Lock account if threshold exceeded
    if failed_attempts >= MAX_FAILED_ATTEMPTS:
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        update_data["locked_until"] = locked_until.isoformat()
    
    await db[collection].update_one(
        {"email": email},
        {"$set": update_data}
    )
    
    return failed_attempts


async def clear_failed_attempts(db: AsyncIOMotorDatabase, email: str, collection: str = "users"):
    """
    Clear failed login attempts on successful authentication.
    
    Args:
        db: MongoDB database instance
        email: User email
        collection: Collection name ("users" or "admin_users")
    """
    await db[collection].update_one(
        {"email": email},
        {"$set": {"failed_login_attempts": 0, "locked_until": None}}
    )


def hash_reset_code(code: str) -> str:
    """
    Hash a password reset code using SHA256.
    
    Args:
        code: Plain text reset code (e.g., "123456")
    
    Returns:
        SHA256 hash of the code
    """
    return hashlib.sha256(code.encode()).hexdigest()


def verify_reset_code(plain_code: str, hashed_code: str) -> bool:
    """
    Verify a password reset code against its hash.
    
    Args:
        plain_code: Plain text code entered by user
        hashed_code: Stored SHA256 hash
    
    Returns:
        True if codes match, False otherwise
    """
    return hash_reset_code(plain_code) == hashed_code


def create_access_token(user_id: str, is_admin: bool = False, expires_minutes: Optional[int] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id: User ID to encode in token
        is_admin: Whether user is an admin
        expires_minutes: Token expiry in minutes (default: ACCESS_TOKEN_EXPIRE_MINUTES)
    
    Returns:
        JWT token string
    """
    if expires_minutes is None:
        expires_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str, expires_hours: Optional[int] = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        user_id: User ID to encode in token
        expires_hours: Token expiry in hours (default: REFRESH_TOKEN_EXPIRE_HOURS)
    
    Returns:
        JWT token string
    """
    if expires_hours is None:
        expires_hours = REFRESH_TOKEN_EXPIRE_HOURS
    
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_session_token() -> str:
    """
    Generate a secure random session token.
    
    Returns:
        32-byte hex string
    """
    return secrets.token_hex(32)


# 2FA Utilities (for future implementation)
def generate_otp_secret() -> str:
    """
    Generate a base32 secret for TOTP 2FA.
    
    Returns:
        Base32 encoded secret
    """
    import pyotp
    return pyotp.random_base32()


def verify_otp(secret: str, token: str) -> bool:
    """
    Verify a TOTP token.
    
    Args:
        secret: Base32 encoded secret
        token: 6-digit OTP token
    
    Returns:
        True if valid, False otherwise
    """
    import pyotp
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)
