
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_specific_order(order_id):
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print(f"Searching for order: {order_id}...")
    
    order = await db.orders.find_one({"order_id": order_id})
    
    if order:
        print(f"\n--- Order Details ---")
        print(f"Order ID: {order.get('order_id')}")
        print(f"Status: {order.get('order_status')}")
        print(f"Payment Status: {order.get('payment_status')}")
        print(f"Payment Method: '{order.get('payment_method')}'") # Quote to see exact string
        print(f"Created At: {order.get('created_at')}")
        print("-" * 30)
        
        # Verify against the logic
        payment_method = order.get('payment_method')
        excluded_methods = ["COD", "cod", "Cash on Delivery"]
        
        if payment_method in excluded_methods:
            print("✅ SAFE: This order matches the exclusion list. It will NOT be auto-cancelled.")
        else:
            print("⚠️ RISK: This order does NOT match the exclusion list. It MIGHT be auto-cancelled if unpaid.")
            
    else:
        print("Order not found.")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_specific_order("ORD1949F22F"))
