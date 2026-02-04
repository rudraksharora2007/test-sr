
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import pprint

load_dotenv()

async def check_last_cod_order():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Searching for last COD order...")
    
    # Find orders with payment_method as COD (case insensitive check via list)
    query = {
        "payment_method": {"$in": ["COD", "cod", "Cash on Delivery"]}
    }
    
    # Sort by created_at descending to get the latest
    cursor = db.orders.find(query).sort("created_at", -1).limit(1)
    
    orders = await cursor.to_list(length=1)
    
    if orders:
        order = orders[0]
        print(f"\n--- Last COD Order Found ---")
        print(f"Order ID: {order.get('order_id')}")
        print(f"Status: {order.get('order_status')}")
        print(f"Payment Status: {order.get('payment_status')}")
        print(f"Payment Method: {order.get('payment_method')}")
        print(f"Created At: {order.get('created_at')}")
        print(f"Total: {order.get('total')}")
        print(f"Customer: {order.get('shipping_address', {}).get('full_name')}")
        print("-" * 30)
    else:
        print("No COD orders found.")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_last_cod_order())
