import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, Tag, ArrowRight, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart, API, BACKEND_URL, resolveImageUrl, hideSizeDisplay } from "../App";
import LuxurySuccessToast from "../components/LuxurySuccessToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";
import SEO from "../components/SEO";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, updateCartItem, removeFromCart, applyCoupon, removeCoupon, loading } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleUpdateQuantity = async (productId, size, newQuantity) => {
    try {
      await updateCartItem(productId, size, newQuantity);
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Update Failed" message={error.response?.data?.detail || "Couldn't update quantity."} />
      ), { duration: 4000, unstyled: true });
    }
  };

  const handleRemoveItem = async (productId, size) => {
    try {
      await removeFromCart(productId, size);
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Removed" message="Item has been removed from your bag." />
      ), { duration: 3000, unstyled: true });
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Couldn't remove item from bag." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Missing Code" message="Please enter a coupon code." />
      ), { duration: 3000, unstyled: true });
      return;
    }

    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Coupon Applied" message={`Coupon "${couponCode}" applied successfully!`} />
      ), { duration: 4000, unstyled: true });
      setCouponCode("");
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Invalid Coupon" message={error.response?.data?.detail || "This coupon code is not valid."} />
      ), { duration: 4000, unstyled: true });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Coupon Removed" message="The promo code has been removed." />
      ), { duration: 3000, unstyled: true });
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Couldn't remove coupon." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const shippingCost = cartTotal >= 2999 ? 0 : 99;
  const finalTotal = cartTotal - (cart.coupon_discount || 0) + shippingCost;

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-soft-pink" data-testid="empty-cart">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-luxury">
          <ShoppingBag className="w-10 h-10 text-pink-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-serif text-stone-800 mb-3">Your bag is empty</h2>
        <p className="text-stone-500 mb-8 text-center max-w-sm">
          Looks like you haven't added anything to your bag yet. Let's find something beautiful for you.
        </p>
        <Link to="/shop">
          <button className="btn-luxury-primary" data-testid="continue-shopping-btn">
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="cart-page">
      <SEO
        title="Shopping Cart"
        description="Review your selected items and proceed to checkout."
      />
      {/* Header */}
      <div className="bg-soft-pink py-12 md:py-16">
        <div className="luxury-container text-center">
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800">Shopping Bag</h1>
          <p className="text-stone-500 mt-2">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      <div className="luxury-container py-10 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <div
                key={`${item.product_id}-${item.size}`}
                className="cart-item-luxury"
                data-testid={`cart-item-${index}`}
              >
                <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                  <div className="w-28 h-36 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={resolveImageUrl(item.image, "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1")}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link to={`/product/${item.product_id}`} className="font-serif text-stone-800 hover:text-pink-600 transition-colors block mb-1">
                        {item.name}
                      </Link>
                      {!hideSizeDisplay(item.size) && (
                        <p className="text-xs text-stone-500 uppercase tracking-wider">Size: {item.size}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.product_id, item.size)}
                      className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                      data-testid={`remove-item-${index}`}
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="qty-selector-luxury">
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.size, item.quantity - 1)}
                        disabled={loading}
                        data-testid={`decrease-qty-${index}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.size, item.quantity + 1)}
                        disabled={loading}
                        data-testid={`increase-qty-${index}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-pink-600">
                        ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                      </p>
                      {item.sale_price && item.sale_price < item.price && (
                        <p className="text-sm text-stone-400 line-through">
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
            <div className="card-soft p-8 sticky top-28" data-testid="order-summary">
              <h2 className="text-xl font-serif text-stone-800 mb-6">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-6">
                {cart.coupon_code ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                      <span className="text-green-700 font-medium text-sm">{cart.coupon_code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-rose-500 text-xs font-medium hover:underline"
                      data-testid="remove-coupon-btn"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="input-luxury flex-1 text-sm py-3"
                      data-testid="coupon-input"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-6 py-3 rounded-full bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                      data-testid="apply-coupon-btn"
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-4 border-t border-stone-100 pt-6">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>

                {cart.coupon_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{cart.coupon_discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span className="text-pink-600 font-medium uppercase tracking-wider text-xs">FREE in India</span>
                </div>

                <div className="flex justify-between text-xl font-semibold border-t border-stone-100 pt-4">
                  <span className="text-stone-800">Subtotal</span>
                  <span className="text-pink-600">₹{(cartTotal - (cart.coupon_discount || 0)).toLocaleString()}</span>
                </div>
                <p className="text-xs text-stone-500 text-center mt-2">
                  Shipping and taxes calculated at checkout
                </p>
              </div>

              <button
                className="w-full btn-luxury-primary mt-8 py-5"
                onClick={() => navigate("/checkout")}
                data-testid="checkout-btn"
              >
                Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link to="/shop" className="block text-center mt-4 text-sm text-stone-500 hover:text-pink-600 transition-colors">
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
