"""
Session and cookie management utilities.
"""
import os
from typing import Optional
from fastapi import Request, Response


# Environment configuration
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Cookie configuration
COOKIE_NAME = "session_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def create_session_cookie(
    response: Response,
    session_token: str,
    max_age: int = COOKIE_MAX_AGE
) -> None:
    """
    Set session cookie with proper security attributes based on environment.
    
    Development (localhost):
        - httponly: True (JavaScript cannot access)
        - secure: False (allows HTTP)
        - samesite: Lax (CSRF protection)
        - domain: None (same-origin only)
    
    Production:
        - httponly: True (JavaScript cannot access)
        - secure: True (HTTPS only)
        - samesite: Lax (CSRF protection)
        - domain: .yourdomain.com (subdomain sharing)
    
    Args:
        response: FastAPI Response object
        session_token: Session token to store
        max_age: Cookie expiration in seconds (default: 7 days)
    """
    cookie_domain = None
    
    if IS_PRODUCTION:
        # Production: Share cookie across subdomains
        cookie_domain = os.environ.get("COOKIE_DOMAIN", ".srfashiondubai.com")
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_token,
        httponly=True,                    # Prevent JavaScript access (XSS protection)
        secure=IS_PRODUCTION,             # HTTPS only in production
        samesite="lax",                   # CSRF protection (allows top-level navigation)
        path="/",
        max_age=max_age,
        domain=cookie_domain
    )


def create_state_cookie(
    response: Response,
    state_token: str
) -> None:
    """
    Set temporary state cookie for CSRF protection during OAuth flow.
    
    Args:
        response: FastAPI Response object
        state_token: State token to store temporarily
    """
    response.set_cookie(
        key="oauth_state",
        value=state_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=600  # 10 minutes (OAuth flow should complete quickly)
    )


def clear_session_cookie(response: Response) -> None:
    """
    Clear session cookie (logout).
    
    Args:
        response: FastAPI Response object
    """
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        domain=os.environ.get("COOKIE_DOMAIN") if IS_PRODUCTION else None
    )


def clear_state_cookie(response: Response) -> None:
    """
    Clear OAuth state cookie after verification.
    
    Args:
        response: FastAPI Response object
    """
    response.delete_cookie(
        key="oauth_state",
        path="/"
    )


def get_session_from_cookie(request: Request) -> Optional[str]:
    """
    Extract session token from cookie.
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Session token if present, None otherwise
    """
    return request.cookies.get(COOKIE_NAME)


def get_state_from_cookie(request: Request) -> Optional[str]:
    """
    Extract OAuth state token from cookie.
    
    Args:
        request: FastAPI Request object
    
    Returns:
        State token if present, None otherwise
    """
    return request.cookies.get("oauth_state")


def get_frontend_url() -> str:
    """
    Get frontend URL based on environment.
    
    Returns:
        Frontend base URL
    """
    if IS_PRODUCTION:
        return os.environ.get("FRONTEND_URL_PROD", "https://srfashiondubai.com")
    else:
        return os.environ.get("FRONTEND_URL_DEV", "http://localhost:3000")


def get_admin_frontend_url() -> str:
    """
    Get admin frontend URL based on environment.
    
    Returns:
        Admin frontend base URL
    """
    if IS_PRODUCTION:
        return os.environ.get("ADMIN_FRONTEND_URL_PROD", "https://admin.srfashiondubai.com")
    else:
        return os.environ.get("ADMIN_FRONTEND_URL_DEV", "http://localhost:3000/admin")
