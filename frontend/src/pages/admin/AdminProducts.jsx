import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut, 
  Menu, X, Plus, Pencil, Trash2, Search
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminProducts = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    brand: "",
    category_id: "",
    price: "",
    sale_price: "",
    images: [""],
    sizes: ["S", "M", "L", "XL"],
    stock: "",
    is_featured: false,
    is_new_arrival: false,
    is_on_sale: false
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?active_only=false&limit=100`, { withCredentials: true });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=false`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      brand: "",
      category_id: "",
      price: "",
      sale_price: "",
      images: [""],
      sizes: ["S", "M", "L", "XL"],
      stock: "",
      is_featured: false,
      is_new_arrival: false,
      is_on_sale: false
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      category_id: product.category_id,
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || "",
      images: product.images.length > 0 ? product.images : [""],
      sizes: product.sizes,
      stock: product.stock.toString(),
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_on_sale: product.is_on_sale
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock: parseInt(formData.stock),
      images: formData.images.filter(img => img.trim() !== "")
    };

    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.product_id}`, data, { withCredentials: true });
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/admin/products`, data, { withCredentials: true });
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save product");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`${API}/admin/products/${productId}`, { withCredentials: true });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderOpen },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
  ];

  const Sidebar = () => (
    <div className="admin-sidebar">
      <Link to="/admin" className="block mb-8">
        <img src={LOGO_URL} alt="Dubai SR" className="h-14 w-auto" />
      </Link>
      <div className="mb-8 p-3 bg-white/10 rounded-lg">
        <p className="text-sm text-pink-100">Welcome,</p>
        <p className="font-medium truncate">{user?.name || "Admin"}</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`admin-nav-item ${location.pathname === item.href ? "active" : ""}`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-6 left-6 right-6">
        <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
        <Link to="/" className="block mt-2 text-center text-sm text-white/60 hover:text-white">View Store →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-products">
      <div className="lg:hidden bg-pink-700 text-white p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64" onClick={e => e.stopPropagation()}><Sidebar /></div>
        </div>
      )}

      <div className="hidden lg:block"><Sidebar /></div>

      <div className="admin-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-serif">Products</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-products"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-product-btn">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required data-testid="product-name" />
                    </div>
                    <div>
                      <Label>Slug *</Label>
                      <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required data-testid="product-slug" />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description *</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required data-testid="product-description" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Brand *</Label>
                      <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} required data-testid="product-brand" />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                        <SelectTrigger data-testid="product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.category_id} value={cat.category_id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Price (₹) *</Label>
                      <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required data-testid="product-price" />
                    </div>
                    <div>
                      <Label>Sale Price (₹)</Label>
                      <Input type="number" value={formData.sale_price} onChange={(e) => setFormData({...formData, sale_price: e.target.value})} data-testid="product-sale-price" />
                    </div>
                    <div>
                      <Label>Stock *</Label>
                      <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required data-testid="product-stock" />
                    </div>
                  </div>

                  <div>
                    <Label>Image URLs (one per line)</Label>
                    <Textarea 
                      value={formData.images.join("\n")} 
                      onChange={(e) => setFormData({...formData, images: e.target.value.split("\n")})}
                      placeholder="https://example.com/image1.jpg"
                      data-testid="product-images"
                    />
                  </div>

                  <div>
                    <Label>Sizes (comma separated)</Label>
                    <Input 
                      value={formData.sizes.join(", ")} 
                      onChange={(e) => setFormData({...formData, sizes: e.target.value.split(",").map(s => s.trim())})}
                      data-testid="product-sizes"
                    />
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({...formData, is_featured: v})} data-testid="product-featured" />
                      <Label>Featured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.is_new_arrival} onCheckedChange={(v) => setFormData({...formData, is_new_arrival: v})} data-testid="product-new" />
                      <Label>New Arrival</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formData.is_on_sale} onCheckedChange={(v) => setFormData({...formData, is_on_sale: v})} data-testid="product-sale" />
                      <Label>On Sale</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                    <Button type="submit" className="btn-primary" data-testid="save-product-btn">
                      {editingProduct ? "Update Product" : "Create Product"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No products found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img src={product.images?.[0] || "https://via.placeholder.com/50"} alt="" className="w-12 h-14 object-cover" />
                            <div>
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.product_id}</p>
                            </div>
                          </div>
                        </td>
                        <td>{product.brand}</td>
                        <td>
                          <div>
                            <p className="font-medium">₹{(product.sale_price || product.price).toLocaleString()}</p>
                            {product.sale_price && <p className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</p>}
                          </div>
                        </td>
                        <td>
                          <span className={product.stock < 5 ? "text-red-600 font-medium" : ""}>{product.stock}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {product.is_featured && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Featured</span>}
                            {product.is_new_arrival && <span className="px-2 py-0.5 bg-gold/20 text-gold-dark text-xs rounded">New</span>}
                            {product.is_on_sale && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded">Sale</span>}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} data-testid={`edit-product-${product.product_id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.product_id)} className="text-red-600 hover:text-red-700" data-testid={`delete-product-${product.product_id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProducts;
