import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

async def check_order():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'dubai_sr_ecommerce')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    order = await db.orders.find_one({'order_id': 'ORD2EEC433E'})
    print(f"Order: {order}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_order())
