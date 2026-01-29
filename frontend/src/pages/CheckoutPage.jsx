import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CreditCard, Banknote, Shield, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useRazorpay } from "react-razorpay";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
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
        color: "#BE185D"
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
      toast.error("Your cart is empty");
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
        // COD order
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
    <div className="min-h-screen bg-gray-50" data-testid="checkout-page">
      <div className="section-container py-8 md:py-12">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center text-gray-600 hover:text-pink-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-serif mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="checkout-form">
                <h2 className="text-xl font-serif mb-6">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      data-testid="input-full-name"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="checkout-form">
                <h2 className="text-xl font-serif mb-6">Shipping Address</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      placeholder="House/Flat No., Building Name"
                      data-testid="input-address1"
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      placeholder="Street, Landmark (Optional)"
                      data-testid="input-address2"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      data-testid="input-city"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      data-testid="input-state"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
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
              <div className="checkout-form">
                <h2 className="text-xl font-serif mb-6">Payment Method</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <label 
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "razorpay" ? "border-pink-700 bg-pink-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      data-testid="payment-razorpay"
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" className="mr-3" />
                      <CreditCard className="h-5 w-5 mr-3 text-pink-700" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-sm text-gray-500">UPI, Credit/Debit Card, Net Banking</p>
                      </div>
                    </label>
                    
                    <label 
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "cod" ? "border-pink-700 bg-pink-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      data-testid="payment-cod"
                    >
                      <RadioGroupItem value="cod" id="cod" className="mr-3" />
                      <Banknote className="h-5 w-5 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-500">Pay when you receive</p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 border sticky top-24" data-testid="checkout-summary">
                <h2 className="text-xl font-serif mb-6">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-4 border-b pb-4 mb-4 max-h-[300px] overflow-y-auto">
                  {cart.items.map((item, index) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                      <img 
                        src={item.image || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1"} 
                        alt={item.name}
                        className="w-16 h-20 object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-500">Size: {item.size} × {item.quantity}</p>
                        <p className="text-sm font-medium text-pink-700">
                          ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  {cart.coupon_discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({cart.coupon_code})</span>
                      <span>-₹{cart.coupon_discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Total</span>
                    <span className="text-pink-700">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full btn-primary mt-6"
                  disabled={loading}
                  data-testid="place-order-btn"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="loading-spinner mr-2"></span>
                      Processing...
                    </span>
                  ) : (
                    `Place Order - ₹${finalTotal.toLocaleString()}`
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                  <Shield className="h-4 w-4" />
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
