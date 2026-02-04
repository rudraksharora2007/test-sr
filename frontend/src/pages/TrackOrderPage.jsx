import { useState } from "react";
import { Package, Search, Calendar, Truck, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import SEO from "../components/SEO";

const TrackOrderPage = () => {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setOrder(null);

        if (!orderId.trim()) {
            setError("Please enter an order ID");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.get(`${API}/orders/${orderId.trim()}`);
            setOrder(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError("Order not found. Please check your order ID and try again.");
            } else {
                setError("Unable to fetch order details. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return <CheckCircle2 className="w-5 h-5" />;
            case 'shipped': return <Truck className="w-5 h-5" />;
            case 'processing': return <Clock className="w-5 h-5" />;
            case 'cancelled': return <XCircle className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'text-green-600 bg-green-50 border-green-100';
            case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'processing': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-stone-600 bg-stone-50 border-stone-100';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-pink-50/30 py-12 md:py-20">
            <SEO
                title="Track Your Order"
                description="Enter your order ID to track your luxury ethnic wear delivery status and get real-time updates."
                keywords="track order, order status, delivery tracking"
            />
            <div className="luxury-container max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Order Tracking</p>
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-4">Track Your Order</h1>
                    <p className="text-stone-500 max-w-md mx-auto">
                        Enter your order ID below to view the status and details of your purchase
                    </p>
                </div>

                {/* Search Form */}
                <div className="glass-panel p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="orderId" className="block text-sm font-semibold text-stone-700 mb-2">
                                Order ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="orderId"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="e.g., ORDFA0B7239"
                                    className="w-full px-4 py-3 pl-12 border-2 border-stone-200 rounded-xl focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            </div>
                            <p className="text-xs text-stone-500 mt-2">
                                You can find your order ID in the confirmation email we sent you
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-rose-700">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-luxury-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="loading-luxury w-5 h-5"></div>
                                    <span>Searching...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <Search className="w-5 h-5" />
                                    <span>Track Order</span>
                                </div>
                            )}
                        </button>
                    </form>
                </div>

                {/* Order Details */}
                {order && (
                    <div className="glass-panel overflow-hidden">
                        {/* Order Header */}
                        <div className="p-6 md:p-8 border-b border-stone-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-1">Order Number</p>
                                    <p className="text-2xl font-serif text-stone-800">#{order.order_id}</p>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold tracking-wide uppercase ${getStatusColor(order.order_status)}`}>
                                    {getStatusIcon(order.order_status)}
                                    {order.order_status}
                                </div>
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="p-6 md:p-8 space-y-8">
                            {/* Date & Total */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-3 bg-pink-50 rounded-xl">
                                        <Calendar className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-1">Order Date</p>
                                        <p className="text-stone-700 font-medium">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-3 bg-green-50 rounded-xl">
                                        <Package className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-1">Total Amount</p>
                                        <p className="text-2xl font-serif text-pink-600 font-bold">₹{order.total?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shipping_address && (
                                <div className="p-6 bg-stone-50/50 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-stone-600" />
                                        <h3 className="font-serif text-lg text-stone-800">Shipping Address</h3>
                                    </div>
                                    <div className="pl-7 text-stone-600 space-y-1">
                                        <p className="font-medium">{order.shipping_address.full_name}</p>
                                        <p>{order.shipping_address.address_line_1}</p>
                                        {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                                        <p>{order.shipping_address.country}</p>
                                        <div className="pt-2 space-y-1">
                                            {order.shipping_address.phone && (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {order.shipping_address.phone}
                                                </p>
                                            )}
                                            {order.shipping_address.email && (
                                                <p className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    {order.shipping_address.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Info */}
                            {order.tracking_number && (
                                <div className="p-6 bg-blue-50/50 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <Truck className="w-5 h-5 text-blue-600 mt-1" />
                                        <div className="flex-1">
                                            <h3 className="font-serif text-lg text-stone-800 mb-2">Tracking Information</h3>
                                            <p className="text-sm text-stone-600 mb-1">Tracking Number:</p>
                                            <p className="text-lg font-semibold text-blue-600">{order.tracking_number}</p>
                                            {order.tracking_url && (
                                                <a
                                                    href={order.tracking_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                                                >
                                                    Track Shipment →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            {order.items && order.items.length > 0 && (
                                <div>
                                    <h3 className="font-serif text-lg text-stone-800 mb-4">Order Items ({order.items.length})</h3>
                                    <div className="space-y-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 bg-white rounded-xl border border-stone-100">
                                                <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-stone-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-stone-800">{item.name || 'Product'}</p>
                                                    <p className="text-sm text-stone-500">Quantity: {item.quantity}</p>
                                                    <p className="text-sm font-semibold text-pink-600 mt-1">₹{item.price?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackOrderPage;
