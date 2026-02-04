
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_categories():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    categories = await db.categories.find({}, {"_id": 0, "name": 1, "slug": 1}).to_list(100)
    print("Categories in DB:")
    for cat in categories:
        print(f" - {cat['name']} ({cat['slug']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_categories())
