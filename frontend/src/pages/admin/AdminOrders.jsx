import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut, Menu, X, Eye, Truck, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminOrders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingData, setTrackingData] = useState({ courier_name: "", tracking_number: "", tracking_url: "" });

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await axios.get(`${API}/admin/orders${params}`, { withCredentials: true });
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/admin/login"); };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status`, { order_status: newStatus }, { withCredentials: true });
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingData.courier_name || !trackingData.tracking_number) {
      toast.error("Please fill courier name and tracking number");
      return;
    }
    try {
      await axios.put(`${API}/admin/orders/${selectedOrder.order_id}/tracking`, trackingData, { withCredentials: true });
      toast.success("Tracking details updated and customer notified");
      setIsTrackingDialogOpen(false);
      setTrackingData({ courier_name: "", tracking_number: "", tracking_url: "" });
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update tracking");
    }
  };

  const openTrackingDialog = (order) => {
    setSelectedOrder(order);
    setTrackingData({ courier_name: order.courier_name || "", tracking_number: order.tracking_number || "", tracking_url: order.tracking_url || "" });
    setIsTrackingDialogOpen(true);
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderOpen },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
  ];

  const Sidebar = () => (
    <div className="admin-sidebar">
      <Link to="/admin" className="block mb-8"><img src={LOGO_URL} alt="Dubai SR" className="h-14 w-auto" /></Link>
      <div className="mb-8 p-3 bg-white/10 rounded-lg">
        <p className="text-sm text-pink-100">Welcome,</p>
        <p className="font-medium truncate">{user?.name || "Admin"}</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link key={item.name} to={item.href} className={`admin-nav-item ${location.pathname === item.href ? "active" : ""}`}>
            <item.icon className="h-5 w-5" />{item.name}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-6 left-6 right-6">
        <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-2" />Logout
        </Button>
        <Link to="/" className="block mt-2 text-center text-sm text-white/60 hover:text-white">View Store →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-orders">
      <div className="lg:hidden bg-pink-700 text-white p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}><div className="w-64" onClick={e => e.stopPropagation()}><Sidebar /></div></div>}
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="admin-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-serif">Orders</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="order-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? <div className="p-8 text-center">Loading...</div> :
            orders.length === 0 ? <div className="p-8 text-center text-gray-500">No orders found</div> :
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td>
                        <p className="font-medium">{order.order_id}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td>
                        <p className="font-medium">{order.shipping_address?.full_name}</p>
                        <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td className="font-medium">₹{order.total?.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${order.payment_status === "paid" ? "status-delivered" : order.payment_status === "cod_pending" ? "status-processing" : "status-pending"}`}>
                          {order.payment_method === "cod" ? "COD" : order.payment_status}
                        </span>
                      </td>
                      <td>
                        <Select value={order.order_status} onValueChange={(v) => handleStatusChange(order.order_id, v)}>
                          <SelectTrigger className="w-32" data-testid={`order-status-${order.order_id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsViewDialogOpen(true); }} data-testid={`view-order-${order.order_id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openTrackingDialog(order)} data-testid={`tracking-order-${order.order_id}`}>
                            <Truck className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </CardContent>
        </Card>

        {/* View Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Order Details - {selectedOrder?.order_id}</DialogTitle></DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Address</h4>
                    <p>{selectedOrder.shipping_address?.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.address_line1}</p>
                    {selectedOrder.shipping_address?.address_line2 && <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.address_line2}</p>}
                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}</p>
                    <p className="text-sm mt-2">{selectedOrder.shipping_address?.phone}</p>
                    <p className="text-sm">{selectedOrder.shipping_address?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Order Info</h4>
                    <p className="text-sm"><strong>Status:</strong> <span className={`status-badge status-${selectedOrder.order_status}`}>{selectedOrder.order_status}</span></p>
                    <p className="text-sm"><strong>Payment:</strong> {selectedOrder.payment_method === "cod" ? "Cash on Delivery" : "Online"} ({selectedOrder.payment_status})</p>
                    <p className="text-sm"><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    {selectedOrder.tracking_number && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-sm"><strong>Courier:</strong> {selectedOrder.courier_name}</p>
                        <p className="text-sm"><strong>Tracking:</strong> {selectedOrder.tracking_number}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex gap-3 p-2 bg-gray-50 rounded">
                        <img src={item.image || "https://via.placeholder.com/50"} alt="" className="w-12 h-14 object-cover" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">Size: {item.size} × {item.quantity}</p>
                        </div>
                        <p className="font-medium text-sm">₹{((item.sale_price || item.price) * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{selectedOrder.subtotal?.toLocaleString()}</span></div>
                  {selectedOrder.coupon_discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({selectedOrder.coupon_code})</span><span>-₹{selectedOrder.coupon_discount?.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-sm"><span>Shipping</span><span>{selectedOrder.shipping_cost === 0 ? "Free" : `₹${selectedOrder.shipping_cost}`}</span></div>
                  <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t"><span>Total</span><span>₹{selectedOrder.total?.toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tracking Dialog */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Update Tracking - {selectedOrder?.order_id}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Courier Name *</Label>
                <Select value={trackingData.courier_name} onValueChange={(v) => setTrackingData({...trackingData, courier_name: v})}>
                  <SelectTrigger data-testid="courier-name"><SelectValue placeholder="Select courier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DTDC">DTDC</SelectItem>
                    <SelectItem value="Delhivery">Delhivery</SelectItem>
                    <SelectItem value="Tirupati">Tirupati</SelectItem>
                    <SelectItem value="Speed Post">Speed Post</SelectItem>
                    <SelectItem value="BlueDart">BlueDart</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tracking Number *</Label>
                <Input value={trackingData.tracking_number} onChange={(e) => setTrackingData({...trackingData, tracking_number: e.target.value})} data-testid="tracking-number" />
              </div>
              <div>
                <Label>Tracking URL (Optional)</Label>
                <Input value={trackingData.tracking_url} onChange={(e) => setTrackingData({...trackingData, tracking_url: e.target.value})} placeholder="https://..." data-testid="tracking-url" />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>Cancel</Button>
                <Button className="btn-primary" onClick={handleUpdateTracking} data-testid="save-tracking-btn">Update & Notify Customer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOrders;
