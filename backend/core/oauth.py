"""
Google OAuth 2.0 utilities for secure Authorization Code flow.
"""
import os
import secrets
import httpx
from typing import Dict, Optional
from urllib.parse import urlencode


# OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_OAUTH_SCOPES = "openid email profile"

# Environment-based redirect URI
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI_PROD", "")
else:
    GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI_DEV", "http://localhost:8000/api/auth/google/callback")

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def generate_state_token() -> str:
    """
    Generate a cryptographically secure random state token for CSRF protection.
    
    Returns:
        32-byte hex string
    """
    return secrets.token_hex(32)


def get_google_oauth_url(state: str) -> str:
    """
    Generate Google OAuth authorization URL.
    
    Args:
        state: CSRF protection token
    
    Returns:
        Full Google OAuth URL with all required parameters
    """
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": GOOGLE_OAUTH_SCOPES,
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }
    
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> Dict[str, any]:
    """
    Exchange authorization code for access token and ID token.
    
    Args:
        code: Authorization code from Google
    
    Returns:
        Dictionary containing access_token, id_token, etc.
    
    Raises:
        httpx.HTTPError: If token exchange fails
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> Dict[str, any]:
    """
    Fetch user profile information from Google.
    
    Args:
        access_token: Google access token
    
    Returns:
        Dictionary containing user info (email, name, picture, etc.)
    
    Raises:
        httpx.HTTPError: If user info request fails
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        response.raise_for_status()
        return response.json()


def verify_state_token(request_state: str, stored_state: Optional[str]) -> bool:
    """
    Verify state token to prevent CSRF attacks.
    
    Args:
        request_state: State parameter from OAuth callback
        stored_state: State token stored in cookie/session
    
    Returns:
        True if states match, False otherwise
    """
    if not request_state or not stored_state:
        return False
    
    # Use constant-time comparison to prevent timing attacks
    return secrets.compare_digest(request_state, stored_state)
