from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def restore_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # 1. Ensure Categories Exist
    categories_data = [
        {"name": "Stitched Suits", "slug": "stitched-suits", "description": "Ready to wear designer suits", "image_url": "https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"},
        {"name": "Bridal Wear", "slug": "bridal-wear", "description": "Exquisite bridal collections", "image_url": "https://images.unsplash.com/photo-1640181637089-cce4a3040ed2?crop=entropy&cs=srgb&fm=jpg&q=85"},
        {"name": "Party Wear", "slug": "party-wear", "description": "Elegant party collections", "image_url": "https://images.unsplash.com/photo-1580406266957-2b06a222bca5?crop=entropy&cs=srgb&fm=jpg&q=85"},
    ]
    
    category_ids = {}
    
    # Check "Unstitched" which we added
    unstitched = await db.categories.find_one({"slug": "unstitched"})
    if unstitched:
        category_ids["unstitched-suits"] = unstitched["category_id"]
    else:
        # Check standard slug
        unstitched_std = await db.categories.find_one({"slug": "unstitched-suits"})
        if unstitched_std:
             category_ids["unstitched-suits"] = unstitched_std["category_id"]
        else:
            # Create it
            cat_id = f"cat_{uuid.uuid4().hex[:12]}"
            await db.categories.insert_one({
                "category_id": cat_id,
                "name": "Unstitched Suits",
                "slug": "unstitched-suits",
                "description": "Premium fabric collections",
                "image_url": "https://images.unsplash.com/photo-1725677356693-cdd8b255250a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            })
            category_ids["unstitched-suits"] = cat_id

    for cat in categories_data:
        existing = await db.categories.find_one({"slug": cat["slug"]})
        if existing:
            category_ids[cat["slug"]] = existing["category_id"]
        else:
            cat_id = f"cat_{uuid.uuid4().hex[:12]}"
            cat["category_id"] = cat_id
            cat["is_active"] = True
            cat["created_at"] = datetime.now(timezone.utc)
            await db.categories.insert_one(cat)
            category_ids[cat["slug"]] = cat_id
            print(f"Created category: {cat['name']}")

    # 2. Add Standard Products
    products_data = [
        {
            "name": "Maria B Embroidered Lawn Suit",
            "slug": "maria-b-embroidered-lawn",
            "description": "Exquisite embroidered lawn suit with intricate threadwork. Perfect for summer occasions. Includes shirt, dupatta, and trousers.",
            "brand": "Maria B",
            "category_id": category_ids.get("stitched-suits"),
            "price": 8999,
            "sale_price": 6999,
            "images": ["https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 15,
            "is_featured": True,
            "is_on_sale": True
        },
        {
            "name": "Sana Safinaz Luxury Collection",
            "slug": "sana-safinaz-luxury",
            "description": "Premium luxury suit from Sana Safinaz. Featuring elegant embroidery and premium fabric.",
            "brand": "Sana Safinaz",
            "category_id": category_ids.get("stitched-suits"),
            "price": 12999,
            "images": ["https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 10,
            "is_featured": True,
            "is_new_arrival": True
        },
        {
            "name": "Tawakkal Unstitched Lawn",
            "slug": "tawakkal-unstitched-lawn",
            "description": "Beautiful unstitched lawn fabric with modern prints. Customize to your measurements.",
            "brand": "Tawakkal",
            "category_id": category_ids.get("unstitched-suits"),
            "price": 4999,
            "sale_price": 3999,
            "images": ["https://images.unsplash.com/photo-1725677356693-cdd8b255250a?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 25,
            "is_on_sale": True
        },
        {
            "name": "Noor Bridal Lehenga Rose Gold",
            "slug": "noor-bridal-lehenga-rose-gold",
            "description": "Stunning rose gold bridal lehenga with heavy embroidery. Perfect for your special day.",
            "brand": "Noor",
            "category_id": category_ids.get("bridal-wear"),
            "price": 45999,
            "sale_price": 39999,
            "images": ["https://images.unsplash.com/photo-1640181637089-cce4a3040ed2?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 3,
            "is_featured": True,
            "is_on_sale": True
        },
        {
            "name": "Adan Libas Bridal Lehenga",
            "slug": "adan-libas-bridal-lehenga",
            "description": "Luxurious bridal lehenga with traditional craftsmanship and modern elegance.",
            "brand": "Adan Libas",
            "category_id": category_ids.get("bridal-wear"),
            "price": 55999,
            "sale_price": 49999,
            "images": ["https://images.unsplash.com/photo-1766763846239-bfea22785d03?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 2,
            "is_featured": True,
            "is_on_sale": True
        },
        {
            "name": "Maria B Formal Collection",
            "slug": "maria-b-formal",
            "description": "Elegant formal suit for special occasions. Features premium fabric and sophisticated design.",
            "brand": "Maria B",
            "category_id": category_ids.get("party-wear"),
            "price": 15999,
            "images": ["https://images.unsplash.com/photo-1769500810141-644865a6d35c?crop=entropy&cs=srgb&fm=jpg&q=85"],
            "stock": 8,
            "is_new_arrival": True
        }
    ]

    for p in products_data:
        existing = await db.products.find_one({"slug": p["slug"]})
        if not existing and p["category_id"]:
            p["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
            p["is_active"] = True
            p["sizes"] = ["S", "M", "L", "XL"]
            p["created_at"] = datetime.now(timezone.utc)
            await db.products.insert_one(p)
            print(f"Added product: {p['name']}")
    
    print("Database restored.")

if __name__ == "__main__":
    asyncio.run(restore_db())
