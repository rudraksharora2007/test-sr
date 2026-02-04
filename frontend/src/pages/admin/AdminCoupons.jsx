import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import ConfirmationDialog from "../../components/admin/ConfirmationDialog";

const AdminCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "", discount_type: "percentage", discount_value: "", min_cart_value: "", max_uses: "", expires_at: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`, { withCredentials: true });
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ code: "", discount_type: "percentage", discount_value: "", min_cart_value: "", max_uses: "", expires_at: "" });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_cart_value: coupon.min_cart_value?.toString() || "",
      max_uses: coupon.max_uses?.toString() || "",
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_cart_value: formData.min_cart_value ? parseFloat(formData.min_cart_value) : 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
    };
    try {
      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.coupon_id}`, data, { withCredentials: true });
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Coupon updated successfully." />
        ), { duration: 3000, unstyled: true });
      } else {
        await axios.post(`${API}/admin/coupons`, data, { withCredentials: true });
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Coupon created successfully." />
        ), { duration: 3000, unstyled: true });
      }
      setIsDialogOpen(false); resetForm(); fetchCoupons();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message={error.response?.data?.detail || "Failed to save coupon."} />
      ), { duration: 4000, unstyled: true });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/admin/coupons/${deleteId}`, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Deleted" message="Coupon deleted successfully." />
      ), { duration: 3000, unstyled: true });
      fetchCoupons();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Failed to delete coupon." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto" data-testid="admin-coupons">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-serif">Coupons</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-coupon-btn"><Plus className="h-4 w-4 mr-2" /> Add Coupon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Coupon Code *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="uppercase" required data-testid="coupon-code" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type *</Label>
                    <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                      <SelectTrigger data-testid="coupon-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value *</Label>
                    <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} required data-testid="coupon-value" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Cart Value (₹)</Label>
                    <Input type="number" value={formData.min_cart_value} onChange={(e) => setFormData({ ...formData, min_cart_value: e.target.value })} data-testid="coupon-min-value" />
                  </div>
                  <div>
                    <Label>Max Uses</Label>
                    <Input type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} data-testid="coupon-max-uses" />
                  </div>
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} data-testid="coupon-expiry" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" className="btn-primary" data-testid="save-coupon-btn">{editingCoupon ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center">Loading...</div> :
            filteredCoupons.length === 0 ? <div className="p-8 text-center text-gray-500">No coupons found</div> :
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Code</th>
                      <th className="p-4 text-left">Discount</th>
                      <th className="p-4 text-left">Min Cart</th>
                      <th className="p-4 text-left">Usage</th>
                      <th className="p-4 text-left">Expiry</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.coupon_id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-mono font-semibold">{coupon.code}</td>
                        <td className="p-4">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                        <td className="p-4">{coupon.min_cart_value > 0 ? `₹${coupon.min_cart_value}` : "-"}</td>
                        <td className="p-4">{coupon.current_uses} / {coupon.max_uses || "∞"}</td>
                        <td className="p-4">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "No expiry"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${coupon.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {coupon.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} data-testid={`edit-coupon-${coupon.coupon_id}`}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(coupon.coupon_id)} className="text-red-600 hover:text-red-700" data-testid={`delete-coupon-${coupon.coupon_id}`}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminCoupons;
