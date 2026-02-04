import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        if not mongo_url:
            print("ERROR: MONGO_URL not found in environment")
            return
        if not db_name:
            print("ERROR: DB_NAME not found in environment")
            return
            
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        print(f"✓ Connected to database: {db_name}")
        print("-" * 50)
        
        # Check users collection
        user_count = await db.users.count_documents({})
        print(f"Customer Users: {user_count}")
        
        # Check admin users collection
        admin_count = await db.admin_users.count_documents({})
        print(f"Admin Users: {admin_count}")
        
        if admin_count > 0:
            print("\nAdmin User Details:")
            admins = await db.admin_users.find().to_list(10)
            for admin in admins:
                print(f"  - {admin.get('email')} ({admin.get('name')})")
        
        # Check active sessions
        session_count = await db.user_sessions.count_documents({})
        print(f"\nActive Sessions: {session_count}")
        
        print("-" * 50)
        print("✓ Database check complete")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check())
