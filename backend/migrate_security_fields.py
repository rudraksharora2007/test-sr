"""
Database migration script to add security fields to existing users.
Run this once to update existing user documents with new security fields.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_users():
    """Add failed_login_attempts and locked_until fields to existing users."""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Starting user migration...")
    
    # Update users collection
    result = await db.users.update_many(
        {"failed_login_attempts": {"$exists": False}},
        {"$set": {
            "failed_login_attempts": 0,
            "locked_until": None
        }}
    )
    print(f"Updated {result.modified_count} user documents")
    
    # Update admin_users collection
    result = await db.admin_users.update_many(
        {"failed_login_attempts": {"$exists": False}},
        {"$set": {
            "failed_login_attempts": 0,
            "locked_until": None
        }}
    )
    print(f"Updated {result.modified_count} admin user documents")
    
    print("Migration complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_users())
