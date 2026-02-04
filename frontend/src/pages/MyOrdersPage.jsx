import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, Package, Truck, Calendar, ArrowRight, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth, API } from "../App";

const MyOrdersPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${API}/orders/user/my-orders`, { withCredentials: true });
                setOrders(response.data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'text-green-600 bg-green-50 border-green-100';
            case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'processing': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-stone-600 bg-stone-50 border-stone-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
            case 'shipped': return <Truck className="w-4 h-4" />;
            case 'processing': return <Clock className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="loading-luxury"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50/50 py-12 md:py-20" data-testid="my-orders-page">
            <div className="luxury-container">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Account</p>
                            <h1 className="text-3xl md:text-5xl font-serif text-stone-800">My Orders</h1>
                        </div>
                        <p className="text-stone-500 font-light">
                            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
                        </p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="glass-panel p-12 md:p-20 text-center rounded-3xl">
                            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-200">
                                <ShoppingBag className="w-10 h-10" strokeWidth={1} />
                            </div>
                            <h2 className="text-2xl font-serif text-stone-800 mb-4">No orders yet</h2>
                            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
                                Browsing our collection and finding something you love is just a click away.
                            </p>
                            <Link to="/shop">
                                <button className="btn-luxury-primary px-8 py-4">
                                    Start Shopping
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div key={order.order_id} className="glass-panel overflow-hidden transition-all hover:shadow-luxury-lg group">
                                    {/* Order Header */}
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Order Number</p>
                                                <p className="font-semibold text-stone-800">#{order.order_id}</p>
                                            </div>
                                            <div className="w-px h-8 bg-stone-100 hidden sm:block"></div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Date Placed</p>
                                                <p className="text-stone-600 text-sm">
                                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase ${getStatusColor(order.order_status)}`}>
                                            {getStatusIcon(order.order_status)}
                                            {order.order_status}
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="p-6 md:p-8 bg-white/40 backdrop-blur-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {order.items?.map((item, idx) => (
                                                        idx < 4 && (
                                                            <div key={idx} className="inline-block h-16 w-12 rounded-lg border-2 border-white overflow-hidden shadow-sm bg-stone-100">
                                                                {/* Image handling simplified for preview */}
                                                                <div className="w-full h-full bg-pink-50 flex items-center justify-center text-[10px] text-pink-300">
                                                                    IMG
                                                                </div>
                                                            </div>
                                                        )
                                                    ))}
                                                    {order.items?.length > 4 && (
                                                        <div className="flex items-center justify-center h-16 w-12 rounded-lg border-2 border-white bg-stone-50 text-[10px] font-bold text-stone-400 shadow-sm">
                                                            +{order.items.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-stone-500 italic">
                                                    {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col md:items-end justify-center">
                                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Total Amount</p>
                                                <p className="text-2xl font-serif text-pink-600 font-bold">
                                                    ₹{order.total?.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Footer / Actions */}
                                    <div className="px-6 py-4 md:px-8 bg-stone-50/50 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100">
                                        <div className="flex items-center gap-4">
                                            {order.tracking_number ? (
                                                <div className="flex items-center gap-2 text-xs text-stone-600">
                                                    <span className="font-bold uppercase tracking-tighter">Tracking:</span>
                                                    <a
                                                        href={order.tracking_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-pink-600 hover:underline font-medium"
                                                    >
                                                        {order.tracking_number}
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-stone-400 italic">
                                                    Tracking info will be updated once shipped
                                                </p>
                                            )}
                                        </div>

                                        <Link
                                            to={`/order/${order.order_id}`}
                                            className="text-stone-800 hover:text-pink-600 text-sm font-semibold flex items-center gap-1 transition-colors group/link"
                                        >
                                            View Full Details
                                            <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;
