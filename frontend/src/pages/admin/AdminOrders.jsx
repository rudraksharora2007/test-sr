import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Truck, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import ConfirmationDialog from "../../components/admin/ConfirmationDialog";

const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingData, setTrackingData] = useState({ courier_name: "", tracking_number: "", tracking_url: "" });

  // Confirmation Dialog State
  const [confirmAction, setConfirmAction] = useState({ open: false, orderId: null, status: null });

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

  const initiateStatusChange = (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      setConfirmAction({
        open: true,
        orderId,
        status: newStatus,
        title: "Cancel Order?",
        description: "Are you sure you want to cancel this order? This action cannot be undone and the customer will be notified."
      });
    } else {
      handleStatusChange(orderId, newStatus);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status`, { order_status: newStatus }, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Status Updated" message="Order status has been updated successfully." />
      ), { duration: 3000, unstyled: true });
      fetchOrders();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Update Failed" message="Failed to update order status." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingData.courier_name || !trackingData.tracking_number) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Missing Info" message="Please fill in both courier name and tracking number." />
      ), { duration: 4000, unstyled: true });
      return;
    }
    try {
      await axios.put(`${API}/admin/orders/${selectedOrder.order_id}/tracking`, trackingData, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Tracking Updated" message="Tracking details updated and customer has been notified." />
      ), { duration: 4000, unstyled: true });
      setIsTrackingDialogOpen(false);
      setTrackingData({ courier_name: "", tracking_number: "", tracking_url: "" });
      fetchOrders();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Update Failed" message="Failed to update tracking information." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const openTrackingDialog = (order) => {
    setSelectedOrder(order);
    setTrackingData({ courier_name: order.courier_name || "", tracking_number: order.tracking_number || "", tracking_url: order.tracking_url || "" });
    setIsTrackingDialogOpen(true);
  };

  const handleResendNotification = async (orderId, type) => {
    try {
      await axios.post(`${API}/admin/orders/${orderId}/resend-notification`, { type }, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Email Sent" message={`${type === 'shipping' ? 'Shipping' : 'Confirmation'} email resent successfully.`} />
      ), { duration: 3000, unstyled: true });
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Failed" message={error.response?.data?.detail || "Failed to resend email."} />
      ), { duration: 4000, unstyled: true });
    }
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="admin-orders">
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
                <table className="data-table w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Order ID</th>
                      <th className="p-4 text-left">Customer</th>
                      <th className="p-4 text-left">Items</th>
                      <th className="p-4 text-left">Total</th>
                      <th className="p-4 text-left">Payment</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.order_id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-medium">{order.order_id}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{order.shipping_address?.full_name}</p>
                          <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                        </td>
                        <td className="p-4">{order.items?.length || 0} items</td>
                        <td className="p-4 font-medium">₹{order.total?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {order.payment_method === "cod" ? "COD" : order.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Select value={order.order_status} onValueChange={(v) => initiateStatusChange(order.order_id, v)}>
                            <SelectTrigger
                              className={`w-32 border-0 shadow-none font-medium ${order.order_status === 'delivered' ? 'text-green-600' :
                                  order.order_status === 'cancelled' ? 'text-red-600' :
                                    order.order_status === 'shipped' ? 'text-blue-600' :
                                      'text-yellow-600'
                                }`}
                              data-testid={`order-status-${order.order_id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled" className="text-red-600">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
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
                  <p className="text-sm"><strong>Status:</strong> <span className={`capitalize font-medium`}>{selectedOrder.order_status}</span></p>
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

              {/* Resend Notification Buttons */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Resend Notifications</h4>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendNotification(selectedOrder.order_id, 'confirmation')}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Resend Confirmation
                  </Button>
                  {selectedOrder.tracking_number && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendNotification(selectedOrder.order_id, 'shipping')}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resend Shipping
                    </Button>
                  )}
                </div>
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
              <Select value={trackingData.courier_name} onValueChange={(v) => setTrackingData({ ...trackingData, courier_name: v })}>
                <SelectTrigger data-testid="courier-name"><SelectValue placeholder="Select courier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DTDC">DTDC</SelectItem>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="Tirupati">Tirupati</SelectItem>
                  <SelectItem value="Speed Post">Speed Post</SelectItem>
                  <SelectItem value="BlueDart">BlueDart</SelectItem>
                  <SelectItem value="Smartr">Smartr</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tracking Number *</Label>
              <Input value={trackingData.tracking_number} onChange={(e) => setTrackingData({ ...trackingData, tracking_number: e.target.value })} data-testid="tracking-number" />
            </div>
            <div>
              <Label>Tracking URL (Optional)</Label>
              <Input value={trackingData.tracking_url} onChange={(e) => setTrackingData({ ...trackingData, tracking_url: e.target.value })} placeholder="https://..." data-testid="tracking-url" />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>Cancel</Button>
              <Button className="btn-primary" onClick={handleUpdateTracking} data-testid="save-tracking-btn">Update & Notify Customer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmAction.open}
        onOpenChange={(open) => setConfirmAction({ ...confirmAction, open })}
        title={confirmAction.title}
        description={confirmAction.description}
        onConfirm={() => handleStatusChange(confirmAction.orderId, confirmAction.status)}
        confirmText="Cancel Order"
        destructive={true}
      />
    </div>
  );
};

export default AdminOrders;
