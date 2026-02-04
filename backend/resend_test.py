import asyncio
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from server import send_order_email, generate_order_confirmation_html

async def resend():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'dubai_sr_ecommerce')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    order = await db.orders.find_one({'order_id': 'ORD2EEC433E'})
    if order:
        print(f"Resending confirmation for {order['order_id']} to {order['shipping_address']['email']}")
        html = generate_order_confirmation_html(order)
        await send_order_email(order['shipping_address']['email'], f"Order Confirmed #{order['order_id']}", html)
    else:
        print("Order not found")
    client.close()

if __name__ == "__main__":
    asyncio.run(resend())
