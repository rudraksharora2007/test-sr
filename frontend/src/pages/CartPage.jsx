import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, Tag, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useCart } from "../App";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, updateCartItem, removeFromCart, applyCoupon, removeCoupon, loading } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleUpdateQuantity = async (productId, size, newQuantity) => {
    try {
      await updateCartItem(productId, size, newQuantity);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (productId, size) => {
    try {
      await removeFromCart(productId, size);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      toast.success("Coupon applied successfully!");
      setCouponCode("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success("Coupon removed");
    } catch (error) {
      toast.error("Failed to remove coupon");
    }
  };

  const shippingCost = cartTotal >= 2999 ? 0 : 99;
  const finalTotal = cartTotal - (cart.coupon_discount || 0) + shippingCost;

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center" data-testid="empty-cart">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-serif mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop">
          <Button className="btn-primary" data-testid="continue-shopping-btn">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="cart-page">
      <div className="section-container py-8 md:py-12">
        <h1 className="text-3xl font-serif mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <div 
                key={`${item.product_id}-${item.size}`} 
                className="cart-item"
                data-testid={`cart-item-${index}`}
              >
                <Link to={`/product/${item.product_id}`}>
                  <img 
                    src={item.image || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"} 
                    alt={item.name}
                    className="cart-item-image"
                  />
                </Link>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <Link to={`/product/${item.product_id}`} className="font-medium hover:text-pink-700 transition-colors">
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">Size: {item.size}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.product_id, item.size)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.size, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={loading}
                        data-testid={`decrease-qty-${index}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 min-w-[50px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.size, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={loading}
                        data-testid={`increase-qty-${index}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-pink-700">
                        ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                      </p>
                      {item.sale_price && item.sale_price < item.price && (
                        <p className="text-sm price-strike">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 border sticky top-24" data-testid="order-summary">
              <h2 className="text-xl font-serif mb-6">Order Summary</h2>
              
              {/* Coupon */}
              <div className="mb-6">
                {cart.coupon_code ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">{cart.coupon_code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 text-sm hover:underline"
                      data-testid="remove-coupon-btn"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase"
                      data-testid="coupon-input"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      data-testid="apply-coupon-btn"
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                
                {cart.coupon_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{cart.coupon_discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                </div>
                
                {cartTotal < 2999 && (
                  <p className="text-xs text-gray-500">
                    Add ₹{(2999 - cartTotal).toLocaleString()} more for free shipping
                  </p>
                )}
                
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total</span>
                  <span className="text-pink-700">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              
              <Button
                className="w-full btn-primary mt-6"
                onClick={() => navigate("/checkout")}
                data-testid="checkout-btn"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Link to="/shop" className="block text-center mt-4 text-sm text-gray-500 hover:text-pink-700">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
