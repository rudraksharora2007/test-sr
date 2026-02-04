import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Package, Truck, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { API, hideSizeDisplay } from "../App";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API}/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-luxury"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-xl text-stone-600 mb-6 font-serif">Order not found</p>
        <Link to="/" className="btn-luxury-primary">
          Go to Home
        </Link>
      </div>
    );
  }

  const statusSteps = [
    { key: "pending", label: "Placed", icon: CheckCircle },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: MapPin }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.order_status);

  return (
    <div className="min-h-screen bg-stone-50" data-testid="order-confirmation-page">
      {/* Success Message */}
      <div className="bg-soft-pink py-16 md:py-20">
        <div className="luxury-container text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 mb-3">Thank You!</h1>
          <p className="text-stone-500 max-w-md mx-auto">
            Your order has been confirmed. We'll send you a confirmation email with your order details.
          </p>
        </div>
      </div>

      <div className="luxury-container py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Info */}
            <div className="card-soft p-8">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="font-semibold text-lg text-stone-800" data-testid="order-id">{order.order_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Order Date</p>
                  <p className="text-stone-600">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              {/* Order Status */}
              <div className="mb-8">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-6">Order Status</p>
                <div className="flex items-center justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-stone-200 -z-10"></div>
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-pink-500 -z-10 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 40px)' }}
                  ></div>

                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${index <= currentStepIndex
                          ? "bg-pink-500 text-white"
                          : "bg-white border-2 border-stone-200 text-stone-400"
                        }`}>
                        <step.icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <p className={`text-xs mt-2 ${index <= currentStepIndex ? "text-pink-600 font-medium" : "text-stone-400"
                        }`}>
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="p-5 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-500 uppercase tracking-wider mb-2">Tracking Information</p>
                  <p className="text-sm text-blue-800 mb-1">
                    <strong>Courier:</strong> {order.courier_name}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Tracking:</strong> {order.tracking_number}
                  </p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      Track Your Order <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="card-soft p-8">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-6">Order Items</p>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {!hideSizeDisplay(item.size) && `Size: ${item.size} · `}
                        Qty: {item.quantity}
                      </p>
                      <p className="font-semibold text-pink-600 mt-2">
                        ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Address */}
          <div className="space-y-8">
            {/* Payment Summary */}
            <div className="card-soft p-8">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-6">Payment Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="text-stone-800">₹{order.subtotal.toLocaleString()}</span>
                </div>
                {order.coupon_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({order.coupon_code})</span>
                    <span>-₹{order.coupon_discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Shipping</span>
                  <span className="text-stone-800">{order.shipping_cost === 0 ? "Free" : `₹${order.shipping_cost}`}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-stone-100 pt-4 mt-4">
                  <span className="text-stone-800">Total</span>
                  <span className="text-pink-600">₹{order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-stone-400">Payment</span>
                  <span className={`font-medium ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"
                    }`}>
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Paid"}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card-soft p-8">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-6">Shipping Address</p>
              <div className="space-y-2 text-stone-600 text-sm">
                <p className="font-medium text-stone-800">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
                <div className="pt-3 space-y-2">
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                    {order.shipping_address.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                    {order.shipping_address.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link to="/shop" className="block">
                <button className="w-full btn-luxury-primary">
                  Continue Shopping
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a
                href={`https://wa.me/918595371004?text=${encodeURIComponent(`Hi, I have a query about order ${order.order_id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <button className="w-full btn-luxury-secondary">
                  Need Help? Chat with Us
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
