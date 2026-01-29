import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut, Menu, X, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminCategories = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", image_url: "" });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=false`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/admin/login"); };

  const resetForm = () => { setFormData({ name: "", slug: "", description: "", image_url: "" }); setEditingCategory(null); };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug, description: category.description || "", image_url: category.image_url || "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/admin/categories/${editingCategory.category_id}`, formData, { withCredentials: true });
        toast.success("Category updated successfully");
      } else {
        await axios.post(`${API}/admin/categories`, formData, { withCredentials: true });
        toast.success("Category created successfully");
      }
      setIsDialogOpen(false); resetForm(); fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save category");
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`${API}/admin/categories/${categoryId}`, { withCredentials: true });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
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
    <div className="min-h-screen bg-gray-50" data-testid="admin-categories">
      <div className="lg:hidden bg-pink-700 text-white p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}><div className="w-64" onClick={e => e.stopPropagation()}><Sidebar /></div></div>}
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="admin-content">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif">Categories</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-category-btn"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required data-testid="category-name" /></div>
                <div><Label>Slug *</Label><Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required data-testid="category-slug" /></div>
                <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} data-testid="category-description" /></div>
                <div><Label>Image URL</Label><Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} data-testid="category-image" /></div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" className="btn-primary" data-testid="save-category-btn">{editingCategory ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>) :
          categories.length === 0 ? <p className="text-gray-500 col-span-full text-center py-8">No categories found</p> :
          categories.map((category) => (
            <Card key={category.category_id} className="overflow-hidden" data-testid={`category-card-${category.category_id}`}>
              <div className="h-32 bg-gray-100 relative">
                {category.image_url && <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)} data-testid={`edit-category-${category.category_id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(category.category_id)} data-testid={`delete-category-${category.category_id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.slug}</p>
                {category.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{category.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
