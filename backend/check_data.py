
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    cat_count = await db.categories.count_documents({})
    prod_count = await db.products.count_documents({})
    
    print(f"Categories: {cat_count}")
    print(f"Products: {prod_count}")
    
    if prod_count > 0:
        first_prod = await db.products.find_one({})
        print(f"First product category_id: {first_prod.get('category_id')}")
    
    if cat_count > 0:
        first_cat = await db.categories.find_one({})
        print(f"First category category_id: {first_cat.get('category_id')}")
        print(f"First category slug: {first_cat.get('slug')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
