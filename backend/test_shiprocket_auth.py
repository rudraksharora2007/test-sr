import httpx
import os
import asyncio
from dotenv import load_dotenv

async def test_shiprocket_auth():
    load_dotenv('.env')
    email = os.environ.get("SHIPROCKET_EMAIL")
    password = os.environ.get("SHIPROCKET_PASSWORD")
    
    print(f"Testing Shiprocket Auth for: {email}")
    
    url = "https://apiv2.shiprocket.in/v1/external/auth/login"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "email": email,
                    "password": password
                }
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {response.headers}")
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_shiprocket_auth())
