# Dubai SR - Premium Indian Ethnic Fashion E-commerce Platform

## Project Overview
A production-ready, dynamic e-commerce platform for Dubai SR, a premium Indian ethnic fashion boutique brand.

## Original Problem Statement
Build a full e-commerce platform with:
- Database-driven inventory system
- Admin dashboard with product/category/order/coupon management
- Razorpay payment integration (UPI, cards, COD)
- Order management with shipping tracking
- WhatsApp integration
- Pink/white/gold boutique aesthetic

## User Personas
1. **Shoppers**: Women 25-50, interested in premium Indian ethnic wear (suits, lehengas, bridal wear)
2. **Admin**: Store owner managing inventory, orders, and promotions

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay (test mode)
- **Auth**: Emergent Google OAuth (admin)
- **Notifications**: Resend Email (configurable)

## Core Requirements (Static)
1. ✅ Dynamic product catalog with categories
2. ✅ Shopping cart with coupon support
3. ✅ Checkout with Razorpay/COD options
4. ✅ Admin dashboard with CRUD operations
5. ✅ Order management with status tracking
6. ✅ Inventory management (auto-decrease on order)
7. ✅ WhatsApp floating button

## What's Been Implemented (January 29, 2026)

### Customer-Facing Features
- **Homepage**: Hero section, category grid, featured products, sale countdown, testimonials, newsletter
- **Shop Page**: Product grid with filters (category, brand, new arrivals, sale), sorting, pagination
- **Product Detail**: Image gallery, size selection, quantity, add to cart
- **Cart**: Item management, coupon application (WELCOME10, FLAT500), price summary
- **Checkout**: Shipping form, Razorpay/COD payment methods
- **Order Confirmation**: Order details, status tracking, shipping info

### Admin Features
- **Dashboard**: Order stats, revenue, pending orders, low stock alerts
- **Products**: Full CRUD, image URLs, stock, featured/sale/new badges
- **Categories**: CRUD with images
- **Orders**: View, status updates, add tracking details (courier + tracking number)
- **Coupons**: Create/edit percentage/flat discounts with expiry, min cart, usage limits

### Technical Features
- Session-based cart (localStorage session ID)
- MongoDB with proper _id exclusion
- CORS configured for production
- Hot reload enabled
- Responsive mobile-first design

## Sample Data
- **Categories**: Stitched Suits, Unstitched Suits, Bridal Wear, Party Wear
- **Brands**: Maria B, Sana Safinaz, Tawakkal, Noor, Adan Libas
- **Coupons**: WELCOME10 (10% off), FLAT500 (₹500 off)

## API Endpoints
- `GET /api/products` - List products with filters
- `GET /api/categories` - List categories
- `GET/POST /api/cart/{session_id}` - Cart operations
- `POST /api/orders` - Create order
- `POST /api/orders/verify-payment` - Verify Razorpay payment
- `GET /api/admin/dashboard` - Admin stats
- `CRUD /api/admin/products|categories|orders|coupons`

## Prioritized Backlog

### P0 (Critical)
- ✅ All core e-commerce features implemented

### P1 (Important - Next Phase)
- Production Razorpay keys configuration
- Resend email configuration for order notifications
- SMS notifications via Twilio
- Image upload functionality (currently URL-based)
- Product search functionality
- User order history (customer accounts)

### P2 (Nice to Have)
- Product reviews and ratings
- Wishlist functionality
- Multiple shipping addresses
- Order invoice PDF generation
- Analytics dashboard
- SEO optimization (meta tags, sitemap)

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RESEND_API_KEY=re_xxx (optional)
SENDER_EMAIL=onboarding@resend.dev

# Frontend (.env)
REACT_APP_BACKEND_URL=https://xxx.emergentagent.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxx
```

## Notes
- Razorpay is in TEST mode - provide production keys for live payments
- Email notifications are MOCKED unless RESEND_API_KEY is configured
- Admin auth uses Emergent Google OAuth - any Google account can login as admin
