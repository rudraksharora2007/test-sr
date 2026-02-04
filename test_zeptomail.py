import asyncio
import os
import httpx
from dotenv import load_dotenv

# Load env from backend folder
load_dotenv('backend/.env')

ZEPTOMAIL_API_KEY = os.environ.get('ZEPTOMAIL_API_KEY')
ZEPTOMAIL_SENDER_EMAIL = os.environ.get('ZEPTOMAIL_SENDER_EMAIL')
ZEPTOMAIL_SENDER_NAME = os.environ.get('ZEPTOMAIL_SENDER_NAME', 'Dubai SR')
ZEPTOMAIL_REGION = os.environ.get('ZEPTOMAIL_REGION', 'zoho.in')

async def test_email():
    if not ZEPTOMAIL_API_KEY:
        print("Error: ZEPTOMAIL_API_KEY not found in .env")
        return

    url = f"https://api.zeptomail.{ZEPTOMAIL_REGION}/v1.1/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": f"Zoho-encrsendtoken {ZEPTOMAIL_API_KEY}",
    }
    
    payload = {
        "from": {"address": ZEPTOMAIL_SENDER_EMAIL, "name": ZEPTOMAIL_SENDER_NAME},
        "to": [{"email_address": {"address": ZEPTOMAIL_SENDER_EMAIL, "name": "Test User"}}],
        "subject": "ZeptoMail Test",
        "htmlbody": "<h1>If you see this, ZeptoMail is working!</h1>"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
