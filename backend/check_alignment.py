
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_one_product():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    prod = await db.products.find_one({})
    if prod:
        cat_id = prod.get('category_id')
        cat = await db.categories.find_one({"category_id": cat_id})
        print(f"Product '{prod['name']}' belongs to category: {cat['name'] if cat else 'UNKNOWN (' + cat_id + ')'}")
    else:
        print("No products found")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_one_product())
