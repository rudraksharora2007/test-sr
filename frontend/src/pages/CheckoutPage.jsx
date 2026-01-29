import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CreditCard, Banknote, Shield, ChevronLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useRazorpay } from "react-razorpay";
import { useCart, API } from "../App";

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_placeholder";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const [Razorpay] = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const required = ["full_name", "email", "phone", "address_line1", "city", "state", "pincode"];
    for (const field of required) {
      if (!formData[field]?.trim()) {
        toast.error(`Please fill in ${field.replace(/_/g, " ")}`);
        return false;
      }
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return false;
    }
    
    return true;
  };

  const handleRazorpayPayment = useCallback(async (order) => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.total * 100,
      currency: "INR",
      name: "Dubai SR",
      description: `Order ${order.order_id}`,
      order_id: order.razorpay_order_id,
      handler: async (response) => {
        try {
          await axios.post(`${API}/orders/verify-payment`, {
            order_id: order.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          
          await clearCart();
          toast.success("Payment successful!");
          navigate(`/order/${order.order_id}`);
        } catch (error) {
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: formData.full_name,
        email: formData.email,
        contact: formData.phone
      },
      theme: {
        color: "#EC4899"
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          toast.error("Payment cancelled");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      toast.error("Payment failed: " + response.error.description);
      setLoading(false);
    });
    rzp.open();
  }, [Razorpay, formData, navigate, clearCart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!cart.items || cart.items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    
    setLoading(true);
    
    try {
      const orderData = {
        items: cart.items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          sale_price: item.sale_price,
          quantity: item.quantity,
          size: item.size,
          image: item.image
        })),
        shipping_address: formData,
        coupon_code: cart.coupon_code,
        payment_method: paymentMethod
      };
      
      const response = await axios.post(`${API}/orders`, orderData);
      const order = response.data;
      
      if (paymentMethod === "razorpay") {
        handleRazorpayPayment(order);
      } else {
        await clearCart();
        toast.success("Order placed successfully!");
        navigate(`/order/${order.order_id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to place order");
      setLoading(false);
    }
  };

  const shippingCost = cartTotal >= 2999 ? 0 : 99;
  const finalTotal = cartTotal - (cart.coupon_discount || 0) + shippingCost;

  if (!cart.items || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="checkout-page">
      {/* Header */}
      <div className="bg-soft-pink py-6">
        <div className="luxury-container">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center text-stone-500 hover:text-pink-600 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Bag
          </button>
        </div>
      </div>

      <div className="luxury-container py-10 md:py-16">
        <h1 className="text-3xl font-serif text-stone-800 mb-10 text-center">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Form Sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Info */}
              <div className="checkout-luxury">
                <h2 className="text-lg font-serif text-stone-800 mb-6">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label>Full Name *</label>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      data-testid="input-full-name"
                    />
                  </div>
                  <div>
                    <label>Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label>Phone Number *</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="checkout-luxury">
                <h2 className="text-lg font-serif text-stone-800 mb-6">Shipping Address</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label>Address Line 1 *</label>
                    <input
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      placeholder="House/Flat No., Building Name"
                      data-testid="input-address1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label>Address Line 2</label>
                    <input
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      placeholder="Street, Landmark (Optional)"
                      data-testid="input-address2"
                    />
                  </div>
                  <div>
                    <label>City *</label>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <label>State *</label>
                    <input
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <label>Pincode *</label>
                    <input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      data-testid="input-pincode"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-luxury">
                <h2 className="text-lg font-serif text-stone-800 mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label 
                    className={`flex items-center p-5 rounded-xl cursor-pointer transition-all border-2 ${
                      paymentMethod === "razorpay" 
                        ? "border-pink-500 bg-pink-50" 
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    data-testid="payment-razorpay"
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === "razorpay" ? "border-pink-500 bg-pink-500" : "border-stone-300"
                    }`}>
                      {paymentMethod === "razorpay" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <CreditCard className="w-5 h-5 mr-3 text-pink-600" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-stone-800">Pay Online</p>
                      <p className="text-xs text-stone-500">UPI, Credit/Debit Card, Net Banking</p>
                    </div>
                  </label>
                  
                  <label 
                    className={`flex items-center p-5 rounded-xl cursor-pointer transition-all border-2 ${
                      paymentMethod === "cod" 
                        ? "border-pink-500 bg-pink-50" 
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    data-testid="payment-cod"
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === "cod" ? "border-pink-500 bg-pink-500" : "border-stone-300"
                    }`}>
                      {paymentMethod === "cod" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <Banknote className="w-5 h-5 mr-3 text-green-600" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-stone-800">Cash on Delivery</p>
                      <p className="text-xs text-stone-500">Pay when you receive</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-soft p-8 sticky top-28" data-testid="checkout-summary">
                <h2 className="text-lg font-serif text-stone-800 mb-6">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
                  {cart.items.map((item, index) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <img 
                          src={item.image || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1"} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 line-clamp-2">{item.name}</p>
                        <p className="text-xs text-stone-500">Size: {item.size} × {item.quantity}</p>
                        <p className="text-sm font-semibold text-pink-600 mt-1">
                          ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="space-y-3 border-t border-stone-100 pt-6">
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  {cart.coupon_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({cart.coupon_code})</span>
                      <span>-₹{cart.coupon_discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-green-600">Free</span> : `₹${shippingCost}`}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t border-stone-100 pt-4">
                    <span className="text-stone-800">Total</span>
                    <span className="text-pink-600">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full btn-luxury-primary mt-8 py-5"
                  disabled={loading}
                  data-testid="place-order-btn"
                >
                  {loading ? (
                    <span className="loading-luxury"></span>
                  ) : (
                    `Place Order · ₹${finalTotal.toLocaleString()}`
                  )}
                </button>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-stone-400">
                  <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Secure & Encrypted Payment</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
