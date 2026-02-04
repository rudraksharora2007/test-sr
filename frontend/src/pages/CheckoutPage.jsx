import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { CreditCard, Shield, ChevronLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart, useAuth, API, hideSizeDisplay } from "../App";
import LuxurySuccessToast from "../components/LuxurySuccessToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";
import SEO from "../components/SEO";

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
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
    pincode: "",
    country: "India"
  });

  const [shippingRate, setShippingRate] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  const calculateShipping = async (pincodeOverride, countryOverride) => {
    const pincode = pincodeOverride || formData.pincode;
    const country = countryOverride || formData.country;

    if (!country || cart.items.length === 0) return;

    if (country.toLowerCase() === "india") {
      setShippingRate({
        cost: 0.0,
        delivery_days: "5-7 days",
        carrier: "Free Delivery (India)",
        cod_available: true,
        cod_fee: 100.0,
        zone: "india"
      });
      setShippingError(null);
      return;
    }

    // International shipping handled via WhatsApp
    setShippingRate(null);
    setShippingError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Debounce shipping calculation
    if (name === "pincode" && value.length >= 5) {
      // Clear previous timeout if exists (simple implementation relies on useEffect mostly for complex cases, but direct call is good for user feedback)
      calculateShipping(value, formData.country);
    }
    if (name === "country") {
      calculateShipping(formData.pincode, value);
    }
  };

  // Also trigger when cart changes or on initial load if data present
  useEffect(() => {
    if (formData.pincode && formData.country) {
      calculateShipping();
    }
  }, [cart.items.length]);

  const validateForm = () => {
    const required = ["full_name", "email", "phone", "address_line1", "city", "state", "pincode"];
    for (const field of required) {
      if (!formData[field]?.trim()) {
        const fieldName = field.replace(/_/g, " ");
        toast.custom((t) => (
          <LuxuryErrorToast t={t} title="Missing Information" message={`Please fill in your ${fieldName}.`} />
        ), { duration: 4000, unstyled: true });
        return false;
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Invalid Email" message="Please enter a valid email address." />
      ), { duration: 4000, unstyled: true });
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Invalid Phone" message="Please enter a valid 10-digit phone number." />
      ), { duration: 4000, unstyled: true });
      return false;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Invalid Pincode" message="Please enter a valid 6-digit pincode." />
      ), { duration: 4000, unstyled: true });
      return false;
    }

    return true;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (order) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Payment Error" message="Failed to load payment gateway. Please try again." />
      ), { duration: 5000, unstyled: true });
      setLoading(false);
      return;
    }

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
          }, { withCredentials: true });

          await clearCart();
          toast.custom((t) => (
            <LuxurySuccessToast t={t} title="Payment Successful" message="Your payment was verified. Redirecting to confirmation..." />
          ), { duration: 5000, unstyled: true });
          navigate(`/order/${order.order_id}`);
        } catch (error) {
          toast.custom((t) => (
            <LuxuryErrorToast t={t} title="Verification Failed" message="Payment verification failed. Please contact support." />
          ), { duration: 5000, unstyled: true });
          setLoading(false);
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
          toast.custom((t) => (
            <LuxuryErrorToast t={t} title="Payment Cancelled" message="You have cancelled the payment process." />
          ), { duration: 3000, unstyled: true });
        },
        confirm_close: false, // Don't ask for confirmation when closing
        escape: true, // Allow ESC key to close
        backdropclose: true, // Allow clicking outside to close
        handleback: true // Handle back button
      },
      retry: {
        enabled: false // Disable retry on payment failure
      }
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failure - this fires when payment fails
    rzp.on("payment.failed", async (response) => {
      console.error("Payment failed:", response.error);

      // Show error toast
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Payment Failed" message="Payment was unsuccessful. Your order has been cancelled." />
      ), { duration: 5000, unstyled: true });

      setLoading(false);

      // The modal will close automatically since retry is disabled
    });

    rzp.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (shippingLoading) {
      toast.error("Please wait for shipping rates to load.");
      return;
    }

    if (!shippingRate && !shippingError) {
      // Try calculating again if missing
      await calculateShipping();
      if (!shippingRate) return;
    }

    if (shippingError || !shippingRate) {
      toast.error("Unable to verify shipping rates. Please check your address.");
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Empty Bag" message="Your shopping bag is empty. Add some items before checkout." />
      ), { duration: 4000, unstyled: true });
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

      const response = await axios.post(`${API}/orders`, orderData, { withCredentials: true });
      const order = response.data;

      if (paymentMethod === "razorpay") {
        handleRazorpayPayment(order);
      } else {
        // Navigate first, then clear cart to prevent redirect
        const orderId = order.order_id;
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Order Confirmed" message="Your order has been placed successfully! Thank you for shopping with us." />
        ), { duration: 5000, unstyled: true });
        navigate(`/order/${orderId}`);
        // Clear cart after navigation
        setTimeout(() => clearCart(), 100);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to place order. Please try again.";
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Order Failed" message={errorMessage} />
      ), { duration: 5000, unstyled: true });
      setLoading(false);
    }
  };

  const codFee = (paymentMethod === "cod" && shippingRate?.cod_fee) ? shippingRate.cod_fee : 0;
  const finalTotal = cartTotal - (cart.coupon_discount || 0) + (shippingRate?.cost || 0) + codFee;

  const isCodAvailable = shippingRate?.cod_available ?? false;

  // Don't redirect if we're in the process of placing an order
  if ((!cart.items || cart.items.length === 0) && !loading) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="checkout-page">
      <SEO
        title="Checkout"
        description="Complete your order securely with our encrypted payment gateway."
      />
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
                  <div>
                    <label>Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-stone-200 outline-none focus:border-pink-500 bg-white"
                      data-testid="input-country"
                    >
                      <option value="India">India</option>
                      <option value="USA">United States</option>
                      <option value="UAE">United Arab Emirates (Dubai)</option>
                      <option value="UK">United Kingdom</option>
                      <option disabled>──────────</option>
                      <option value="Albania">Albania</option>
                      <option value="Austria">Austria</option>
                      <option value="Belarus">Belarus</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Bulgaria">Bulgaria</option>
                      <option value="Croatia">Croatia</option>
                      <option value="Cyprus">Cyprus</option>
                      <option value="Czech Republic">Czech Republic</option>
                      <option value="Denmark">Denmark</option>
                      <option value="Estonia">Estonia</option>
                      <option value="Finland">Finland</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Greece">Greece</option>
                      <option value="Greenland">Greenland</option>
                      <option value="Hungary">Hungary</option>
                      <option value="Ireland">Ireland</option>
                      <option value="Italy">Italy</option>
                      <option value="Latvia">Latvia</option>
                      <option value="Lithuania">Lithuania</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Malta">Malta</option>
                      <option value="Monaco">Monaco</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Norway">Norway</option>
                      <option value="Poland">Poland</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Romania">Romania</option>
                      <option value="Russia">Russia</option>
                      <option value="Slovakia">Slovakia</option>
                      <option value="Slovenia">Slovenia</option>
                      <option value="Spain">Spain</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Ukraine">Ukraine</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-luxury">
                <h2 className="text-lg font-serif text-stone-800 mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center p-5 rounded-xl cursor-pointer transition-all border-2 ${paymentMethod === "razorpay"
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
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-pink-500 bg-pink-500" : "border-stone-300"
                      }`}>
                      {paymentMethod === "razorpay" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <CreditCard className="w-5 h-5 mr-3 text-pink-600" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-stone-800">Pay Online</p>
                      <p className="text-xs text-stone-500">UPI, Credit/Debit Card, Net Banking</p>
                    </div>
                  </label>
                </div>

                {/* COD Option Logic: Show if available OR if user is in India (even if loading/not calculated yet, to show it exists) */}
                {(isCodAvailable || (formData.country === "India" && !shippingRate)) && (
                  <label
                    className={`flex items-center p-5 rounded-xl transition-all border-2 mt-3 ${!isCodAvailable
                      ? "opacity-50 cursor-not-allowed border-stone-200 bg-stone-50"
                      : paymentMethod === "cod"
                        ? "cursor-pointer border-pink-500 bg-pink-50"
                        : "cursor-pointer border-stone-200 hover:border-stone-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => isCodAvailable && setPaymentMethod("cod")}
                      disabled={!isCodAvailable}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${paymentMethod === "cod" ? "border-pink-500 bg-pink-500" : "border-stone-300"
                      }`}>
                      {paymentMethod === "cod" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">Cash on Delivery</p>
                      <p className="text-xs text-stone-500">
                        {isCodAvailable
                          ? `Pay when you receive (Fixed COD Surcharge: ₹100)`
                          : shippingLoading
                            ? "Checking availability..."
                            : formData.country !== "India"
                              ? "Not available for international orders"
                              : "Enter valid pincode to check availability"}
                      </p>
                    </div>
                  </label>
                )}

                {!isCodAvailable && shippingRate && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-100">
                    Note: Cash on Delivery is not available for {shippingRate.zone === "international" ? "international orders" : "this location"}.
                  </p>
                )}
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
                        <p className="text-xs text-stone-500">
                          {!hideSizeDisplay(item.size) && `Size: ${item.size} × `}
                          {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                        </p>
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
                    {shippingLoading ? (
                      <span className="animate-pulse text-stone-400">Calculating...</span>
                    ) : shippingRate ? (
                      <div className="text-right">
                        <span className={shippingRate.cost === 0 ? "text-green-600" : ""}>
                          {shippingRate.cost === 0 ? "Free" : `₹${shippingRate.cost.toLocaleString()}`}
                        </span>
                        <p className="text-xs text-stone-500">
                          via {shippingRate.carrier} • {shippingRate.delivery_days}
                        </p>
                      </div>
                    ) : (
                      <span className="text-stone-400">Enter address</span>
                    )}
                  </div>
                  {shippingError && <p className="text-xs text-red-500 text-right mt-1">{shippingError}</p>}

                  {paymentMethod === "cod" && shippingRate?.cod_fee > 0 && (
                    <div className="flex justify-between text-sm text-stone-600">
                      <span>COD Surcharge</span>
                      <span>₹{shippingRate.cod_fee.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-semibold border-t border-stone-100 pt-4">
                    <span className="text-stone-800">Total</span>
                    <span className="text-pink-600">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {formData.country.toLowerCase() === "india" ? (
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
                ) : (
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-amber-800 text-sm font-medium">International Orders</p>
                      <p className="text-amber-700 text-xs mt-1">
                        We currently handle all international orders (outside India) exclusively through WhatsApp to provide personal assistance with shipping and exports.
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/919910000000?text=${encodeURIComponent(`Hi, I'm interested in ordering from outside India. My items: ${cart.items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(', ')}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-luxury-primary py-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 border-none"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Order via WhatsApp
                    </a>
                  </div>
                )}
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
