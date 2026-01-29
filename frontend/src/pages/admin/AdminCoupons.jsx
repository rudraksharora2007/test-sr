import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut, Menu, X, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminCoupons = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "", discount_type: "percentage", discount_value: "", min_cart_value: "", max_uses: "", expires_at: ""
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`, { withCredentials: true });
      setCoupons(response.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/admin/login"); };

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
        toast.success("Coupon updated successfully");
      } else {
        await axios.post(`${API}/admin/coupons`, data, { withCredentials: true });
        toast.success("Coupon created successfully");
      }
      setIsDialogOpen(false); resetForm(); fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save coupon");
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axios.delete(`${API}/admin/coupons/${couponId}`, { withCredentials: true });
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
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
    <div className="min-h-screen bg-gray-50" data-testid="admin-coupons">
      <div className="lg:hidden bg-pink-700 text-white p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}><div className="w-64" onClick={e => e.stopPropagation()}><Sidebar /></div></div>}
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="admin-content">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif">Coupons</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-coupon-btn"><Plus className="h-4 w-4 mr-2" /> Add Coupon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Coupon Code *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="uppercase" required data-testid="coupon-code" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type *</Label>
                    <Select value={formData.discount_type} onValueChange={(v) => setFormData({...formData, discount_type: v})}>
                      <SelectTrigger data-testid="coupon-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value *</Label>
                    <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} required data-testid="coupon-value" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Cart Value (₹)</Label>
                    <Input type="number" value={formData.min_cart_value} onChange={(e) => setFormData({...formData, min_cart_value: e.target.value})} data-testid="coupon-min-value" />
                  </div>
                  <div>
                    <Label>Max Uses</Label>
                    <Input type="number" value={formData.max_uses} onChange={(e) => setFormData({...formData, max_uses: e.target.value})} data-testid="coupon-max-uses" />
                  </div>
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} data-testid="coupon-expiry" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" className="btn-primary" data-testid="save-coupon-btn">{editingCoupon ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? <div className="p-8 text-center">Loading...</div> :
            coupons.length === 0 ? <div className="p-8 text-center text-gray-500">No coupons found</div> :
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min Cart</th>
                    <th>Usage</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.coupon_id}>
                      <td className="font-mono font-semibold">{coupon.code}</td>
                      <td>{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                      <td>{coupon.min_cart_value > 0 ? `₹${coupon.min_cart_value}` : "-"}</td>
                      <td>{coupon.current_uses} / {coupon.max_uses || "∞"}</td>
                      <td>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "No expiry"}</td>
                      <td>
                        <span className={`status-badge ${coupon.is_active ? "status-delivered" : "status-cancelled"}`}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} data-testid={`edit-coupon-${coupon.coupon_id}`}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.coupon_id)} className="text-red-600 hover:text-red-700" data-testid={`delete-coupon-${coupon.coupon_id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCoupons;
