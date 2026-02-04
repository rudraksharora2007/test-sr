import requests
import sys
import json
from datetime import datetime

class DubaiSREcommerceAPITester:
    def __init__(self, base_url="https://luxury-ethnic-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_seed_database(self):
        """Test database seeding"""
        return self.run_test("Seed Database", "POST", "seed", 200)

    def test_categories(self):
        """Test category endpoints"""
        print("\n📂 Testing Category Endpoints...")
        
        # Get all categories
        success, categories = self.run_test("Get Categories", "GET", "categories", 200)
        if success and categories:
            print(f"   Found {len(categories)} categories")
            
            # Test individual category
            if categories:
                cat_id = categories[0].get('category_id')
                if cat_id:
                    self.run_test("Get Single Category", "GET", f"categories/{cat_id}", 200)
        
        return success

    def test_products(self):
        """Test product endpoints"""
        print("\n🛍️ Testing Product Endpoints...")
        
        # Get all products
        success, response = self.run_test("Get Products", "GET", "products", 200)
        if success and response.get('products'):
            products = response['products']
            print(f"   Found {len(products)} products")
            
            # Test individual product
            if products:
                product_id = products[0].get('product_id')
                slug = products[0].get('slug')
                
                if product_id:
                    self.run_test("Get Product by ID", "GET", f"products/{product_id}", 200)
                if slug:
                    self.run_test("Get Product by Slug", "GET", f"products/slug/{slug}", 200)
        
        # Test product filters
        self.run_test("Get Featured Products", "GET", "products?is_featured=true", 200)
        self.run_test("Get New Arrivals", "GET", "products?is_new_arrival=true", 200)
        self.run_test("Get Sale Products", "GET", "products?is_on_sale=true", 200)
        
        # Test brands
        self.run_test("Get Brands", "GET", "brands", 200)
        
        return success

    def test_cart_operations(self):
        """Test cart functionality"""
        print("\n🛒 Testing Cart Operations...")
        
        # Get empty cart
        success, cart = self.run_test("Get Empty Cart", "GET", f"cart/{self.session_id}", 200)
        
        # Get a product to add to cart
        _, products_response = self.run_test("Get Products for Cart", "GET", "products?limit=1", 200)
        if products_response.get('products'):
            product = products_response['products'][0]
            product_id = product.get('product_id')
            
            if product_id:
                # Add to cart
                add_data = {
                    "product_id": product_id,
                    "quantity": 2,
                    "size": "M"
                }
                success, cart = self.run_test("Add to Cart", "POST", f"cart/{self.session_id}/add", 200, add_data)
                
                if success and cart.get('items'):
                    print(f"   Cart now has {len(cart['items'])} items")
                    
                    # Update cart item
                    update_data = {
                        "product_id": product_id,
                        "size": "M",
                        "quantity": 3
                    }
                    self.run_test("Update Cart Item", "PUT", f"cart/{self.session_id}/update", 200, update_data)
                    
                    # Remove cart item
                    self.run_test("Remove Cart Item", "DELETE", f"cart/{self.session_id}/item?product_id={product_id}&size=M", 200)
        
        return success

    def test_coupon_validation(self):
        """Test coupon functionality"""
        print("\n🎫 Testing Coupon Validation...")
        
        # Test WELCOME10 coupon
        coupon_data = {
            "code": "WELCOME10",
            "cart_total": 5000
        }
        success, _ = self.run_test("Validate WELCOME10 Coupon", "POST", "coupons/validate", 200, coupon_data)
        
        # Test FLAT500 coupon
        coupon_data = {
            "code": "FLAT500",
            "cart_total": 5000
        }
        self.run_test("Validate FLAT500 Coupon", "POST", "coupons/validate", 200, coupon_data)
        
        # Test invalid coupon
        coupon_data = {
            "code": "INVALID",
            "cart_total": 5000
        }
        self.run_test("Invalid Coupon", "POST", "coupons/validate", 404, coupon_data)
        
        return success

    def test_cart_coupon_operations(self):
        """Test applying coupons to cart"""
        print("\n🎫 Testing Cart Coupon Operations...")
        
        # First add item to cart
        _, products_response = self.run_test("Get Products for Coupon Test", "GET", "products?limit=1", 200)
        if products_response.get('products'):
            product = products_response['products'][0]
            product_id = product.get('product_id')
            
            if product_id:
                # Add expensive item to cart
                add_data = {
                    "product_id": product_id,
                    "quantity": 5,
                    "size": "L"
                }
                success, _ = self.run_test("Add Item for Coupon Test", "POST", f"cart/{self.session_id}/add", 200, add_data)
                
                if success:
                    # Apply coupon
                    coupon_data = {"code": "WELCOME10"}
                    success, _ = self.run_test("Apply Coupon to Cart", "POST", f"cart/{self.session_id}/coupon", 200, coupon_data)
                    
                    # Remove coupon
                    self.run_test("Remove Coupon from Cart", "DELETE", f"cart/{self.session_id}/coupon", 200)
        
        return success

    def test_order_creation(self):
        """Test order creation (COD)"""
        print("\n📦 Testing Order Creation...")
        
        # First add item to cart
        _, products_response = self.run_test("Get Products for Order", "GET", "products?limit=1", 200)
        if products_response.get('products'):
            product = products_response['products'][0]
            
            order_data = {
                "items": [{
                    "product_id": product.get('product_id'),
                    "name": product.get('name'),
                    "price": product.get('price'),
                    "sale_price": product.get('sale_price'),
                    "quantity": 1,
                    "size": "M",
                    "image": product.get('images', [''])[0] if product.get('images') else ""
                }],
                "shipping_address": {
                    "full_name": "Test User",
                    "email": "test@example.com",
                    "phone": "9876543210",
                    "address_line1": "123 Test Street",
                    "address_line2": "",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                },
                "coupon_code": None,
                "payment_method": "cod"
            }
            
            success, order = self.run_test("Create COD Order", "POST", "orders", 200, order_data)
            
            if success and order.get('order_id'):
                order_id = order['order_id']
                print(f"   Created order: {order_id}")
                
                # Get order details
                self.run_test("Get Order Details", "GET", f"orders/{order_id}", 200)
                
                return success, order_id
        
        return False, None

    def test_admin_login_page(self):
        """Test if admin login page is accessible"""
        print("\n👤 Testing Admin Login Page...")
        
        try:
            # Test if admin login page loads (should return HTML, not JSON)
            response = requests.get(f"{self.base_url}/admin/login", timeout=10)
            if response.status_code == 200:
                print("✅ Admin login page accessible")
                return True
            else:
                print(f"❌ Admin login page failed - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin login page error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Dubai SR E-commerce API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Session ID: {self.session_id}")
        
        # Test sequence
        self.test_health_check()
        self.test_seed_database()
        self.test_categories()
        self.test_products()
        self.test_cart_operations()
        self.test_coupon_validation()
        self.test_cart_coupon_operations()
        order_success, order_id = self.test_order_creation()
        self.test_admin_login_page()
        
        # Print summary
        print(f"\n📊 Test Summary")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DubaiSREcommerceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())