import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Package, Truck, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { API } from "../App";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-gray-600 mb-4">Order not found</p>
        <Link to="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: CheckCircle },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: MapPin }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.order_status);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="order-confirmation-page">
      <div className="section-container py-8 md:py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white p-6 border">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-semibold text-lg" data-testid="order-id">{order.order_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Order Status</h3>
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= currentStepIndex 
                          ? "bg-pink-700 text-white" 
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${
                        index <= currentStepIndex ? "text-pink-700 font-medium" : "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute h-0.5 w-full top-5 left-1/2 -z-10 ${
                          index < currentStepIndex ? "bg-pink-700" : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Tracking Information</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Courier:</strong> {order.courier_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Tracking Number:</strong> {order.tracking_number}
                  </p>
                  {order.tracking_url && (
                    <a 
                      href={order.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline mt-2 inline-block"
                    >
                      Track Your Order →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 border">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1"} 
                      alt={item.name}
                      className="w-20 h-24 object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Size: {item.size}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="font-medium text-pink-700">
                        ₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Address */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white p-6 border">
              <h3 className="font-semibold mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                {order.coupon_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({order.coupon_code})</span>
                    <span>-₹{order.coupon_discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{order.shipping_cost === 0 ? "Free" : `₹${order.shipping_cost}`}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total</span>
                  <span className="text-pink-700">₹{order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className={`font-medium ${
                    order.payment_status === "paid" ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-6 border">
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium text-gray-900">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
                <div className="pt-2 space-y-1">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {order.shipping_address.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {order.shipping_address.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link to="/shop" className="block">
                <Button className="w-full btn-primary">Continue Shopping</Button>
              </Link>
              <a 
                href={`https://wa.me/918595371004?text=${encodeURIComponent(`Hi, I have a query about order ${order.order_id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  Need Help? Chat with Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
