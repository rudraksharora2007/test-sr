import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def verify_auth():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db_name = os.getenv("DB_NAME", "dubai_sr_ecommerce")
    db = client[db_name]
    
    # 1. Check if imperialx420@gmail.com is in skip loop (conceptual)
    # The whitelist is hardcoded in server.py, so we can't check it here easily
    # But we can check if the user exists in admin_users or if it will be created
    
    admin = await db.admin_users.find_one({"email": "imperialx420@gmail.com"})
    print(f"Admin User exists: {bool(admin)}")
    if admin:
        print(f"Admin User ID: {admin['user_id']}")
        
    # 2. Verify we can find a session
    latest_session = await db.user_sessions.find_one(sort=[("created_at", -1)])
    if latest_session:
        print(f"Latest Session User ID: {latest_session['user_id']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_auth())
