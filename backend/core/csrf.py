"""
CSRF protection configuration using fastapi-csrf-protect.
"""
from fastapi_csrf_protect import CsrfProtect
from pydantic_settings import BaseSettings
import os


class CsrfSettings(BaseSettings):
    """CSRF protection settings."""
    secret_key: str = os.environ.get("CSRF_SECRET_KEY", "change-this-to-random-secret-in-production")
    cookie_name: str = "csrf_token"
    header_name: str = "X-CSRF-Token"
    cookie_samesite: str = "lax"
    cookie_secure: bool = os.environ.get("ENVIRONMENT", "development") == "production"
    cookie_httponly: bool = False  # Must be False so JS can read it


@CsrfProtect.load_config
def get_csrf_config():
    """Load CSRF configuration."""
    return CsrfSettings()


# Paths that should be exempt from CSRF protection
CSRF_EXEMPT_PATHS = [
    "/api/auth/google/callback",  # OAuth callback
    "/api/payment/verify",  # Razorpay webhook
    "/api/auth/me",  # GET request
    "/api/categories",  # GET request
    "/api/products",  # GET request
    "/api/brands",  # GET request
]


def is_csrf_exempt(path: str) -> bool:
    """
    Check if a path is exempt from CSRF protection.
    
    Args:
        path: Request path
    
    Returns:
        True if exempt, False otherwise
    """
    return any(path.startswith(exempt_path) for exempt_path in CSRF_EXEMPT_PATHS)
