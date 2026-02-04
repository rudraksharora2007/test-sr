import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env from parent directory
load_dotenv(Path(__file__).parent / 'backend' / '.env')

async def migrate():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'dubai_sr_ecommerce')
    
    print(f"Connecting to {mongo_url}, DB: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Migrate Categories
    print('Migrating Categories...')
    cursor = db.categories.find({'image_url': {'$regex': 'localhost:8000'}})
    async for cat in cursor:
        url = cat.get('image_url')
        if url:
            # Extract path after localhost:8000
            new_url = '/' + url.split('/', 3)[3] if len(url.split('/', 3)) > 3 else url
            print(f"Updating category {cat['name']}: {url} -> {new_url}")
            await db.categories.update_one({'_id': cat['_id']}, {'$set': {'image_url': new_url}})

    # Migrate Products
    print('Migrating Products...')
    cursor = db.products.find({'images': {'$elemMatch': {'$regex': 'localhost:8000'}}})
    async for prod in cursor:
        images = prod.get('images', [])
        new_images = []
        changed = False
        for img in images:
            if img and 'localhost:8000' in img:
                new_img = '/' + img.split('/', 3)[3] if len(img.split('/', 3)) > 3 else img
                print(f"Updating product image: {img} -> {new_img}")
                new_images.append(new_img)
                changed = True
            else:
                new_images.append(img)
        if changed:
            print(f"Updating product {prod['name']}")
            await db.products.update_one({'_id': prod['_id']}, {'$set': {'images': new_images}})

    print('Migration complete.')
    client.close()

if __name__ == '__main__':
    asyncio.run(migrate())
