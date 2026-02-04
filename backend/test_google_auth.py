#!/usr/bin/env python3
"""
Test script to verify Google OAuth configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Google OAuth Configuration Check")
print("=" * 60)

# Check environment variables
client_id = os.environ.get('GOOGLE_CLIENT_ID')
client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')

print(f"\n✓ GOOGLE_CLIENT_ID: {client_id[:20]}..." if client_id else "✗ GOOGLE_CLIENT_ID: NOT SET")
print(f"✓ GOOGLE_CLIENT_SECRET: {client_secret[:10]}..." if client_secret else "✗ GOOGLE_CLIENT_SECRET: NOT SET")
print(f"✓ GOOGLE_REDIRECT_URI: {redirect_uri}" if redirect_uri else "✗ GOOGLE_REDIRECT_URI: NOT SET")

print("\n" + "=" * 60)
print("Expected Configuration:")
print("=" * 60)
print("Redirect URI should be: http://localhost:3000/auth/callback")
print("This must be added to Google Cloud Console:")
print("  → APIs & Services → Credentials → OAuth 2.0 Client IDs")
print("  → Authorized redirect URIs")

if redirect_uri and redirect_uri != "http://localhost:3000/auth/callback":
    print(f"\n⚠️  WARNING: Redirect URI mismatch!")
    print(f"   .env has: {redirect_uri}")
    print(f"   Expected: http://localhost:3000/auth/callback")

print("\n" + "=" * 60)
print("Frontend Configuration Check")
print("=" * 60)
print("The frontend needs REACT_APP_GOOGLE_CLIENT_ID in .env")
print("Check: frontend/.env or frontend/.env.local")
print("=" * 60)
