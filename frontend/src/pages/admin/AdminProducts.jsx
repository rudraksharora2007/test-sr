import { Plus, Edit, Trash2, Search, Package, Upload, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API, BACKEND_URL, resolveImageUrl } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import ConfirmationDialog from "../../components/admin/ConfirmationDialog";

const AdminProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    sku: "",
    is_featured: false,
    is_new_arrival: false,
    is_on_sale: false,
    weight_grams: ""
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
      sku: "",
      is_featured: false,
      is_new_arrival: false,
      is_on_sale: false,
      weight_grams: ""
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
      sku: product.sku || "",
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_on_sale: product.is_on_sale,
      weight_grams: product.weight_grams?.toString() || ""
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
      sku: formData.sku || null,
      weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : 0,
      images: formData.images.filter(img => img.trim() !== "")
    };

    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.product_id}`, data, { withCredentials: true });
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Product updated successfully." />
        ), { duration: 3000, unstyled: true });
      } else {
        await axios.post(`${API}/admin/products`, data, { withCredentials: true });
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Product created successfully." />
        ), { duration: 3000, unstyled: true });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message={error.response?.data?.detail || "Failed to save product."} />
      ), { duration: 4000, unstyled: true });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    setUploading(true);
    try {
      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      const imageUrl = response.data.url;
      setFormData(prev => ({
        ...prev,
        images: [...prev.images.filter(img => img !== ""), imageUrl]
      }));

      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Uploaded" message="Image uploaded successfully." />
      ), { duration: 3000, unstyled: true });
    } catch (error) {
      console.error("Upload error:", error);
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Failed to upload image." />
      ), { duration: 4000, unstyled: true });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`${API}/admin/products/${deleteId}`, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Deleted" message="Product deleted successfully." />
      ), { duration: 3000, unstyled: true });
      fetchProducts();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Failed to delete product." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-content" data-testid="admin-products">
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
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
                    <Input name="name" autoComplete="off" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="product-name" />
                  </div>
                  <div>
                    <Label>Slug *</Label>
                    <Input name="slug" autoComplete="off" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required data-testid="product-slug" />
                  </div>
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required data-testid="product-description" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand *</Label>
                    <Input name="brand" autoComplete="off" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required data-testid="product-brand" />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
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

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Price (₹) *</Label>
                    <Input name="price" autoComplete="off" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required data-testid="product-price" />
                  </div>
                  <div>
                    <Label>Sale Price (₹)</Label>
                    <Input name="sale_price" autoComplete="off" type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} data-testid="product-sale-price" />
                  </div>
                  <div>
                    <Label>Stock *</Label>
                    <Input name="stock" autoComplete="off" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required data-testid="product-stock" />
                  </div>
                  <div>
                    <Label>Weight (grams)</Label>
                    <Input name="weight_grams" autoComplete="off" type="number" value={formData.weight_grams} onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })} placeholder="e.g. 500" data-testid="product-weight" />
                  </div>
                </div>

                <div>
                  <Label>SKU</Label>
                  <Input name="sku" autoComplete="off" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. ELAF-001" data-testid="product-sku" />
                </div>

                <div>
                  <Label>Product Images</Label>
                  <div className="mt-2 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {formData.images.filter(img => img).map((img, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={resolveImageUrl(img)} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-pink-600 hover:bg-pink-50 transition-colors"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-600">Upload Image</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Or add image URL manually..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.target.value) {
                              setFormData(prev => ({
                                ...prev,
                                images: [...prev.images.filter(img => img !== ""), e.target.value]
                              }));
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Sizes (comma separated)</Label>
                  <Input
                    value={formData.sizes.join(", ")}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value.split(",").map(s => s.trim()) })}
                    data-testid="product-sizes"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} data-testid="product-featured" />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_new_arrival} onCheckedChange={(v) => setFormData({ ...formData, is_new_arrival: v })} data-testid="product-new" />
                    <Label>New Arrival</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_on_sale} onCheckedChange={(v) => setFormData({ ...formData, is_on_sale: v })} data-testid="product-sale" />
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
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[40%]">Product</th>
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[15%]">Brand</th>
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[10%]">Price</th>
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[10%]">Stock</th>
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[15%]">Status</th>
                    <th className="p-4 font-serif font-semibold text-gray-900 w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            {product.images && product.images[0] ? (
                              <img
                                src={resolveImageUrl(product.images[0])}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-gray-900 truncate block max-w-[200px] lg:max-w-[300px]" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono mt-0.5">
                              {product.product_id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-gray-600">
                        {product.brand}
                      </td>
                      <td className="p-4 align-middle font-medium text-gray-900">
                        ₹{(product.sale_price || product.price).toLocaleString()}
                        {product.sale_price && <span className="text-xs text-gray-400 line-through ml-2">₹{product.price.toLocaleString()}</span>}
                      </td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.stock > 10
                          ? "bg-green-50 text-green-700 border-green-200"
                          : product.stock > 0
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {product.is_featured && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              Featured
                            </span>
                          )}
                          {product.is_new_arrival && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              New
                            </span>
                          )}
                          {product.is_on_sale && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
                              Sale
                            </span>
                          )}
                          {!product.is_featured && !product.is_new_arrival && !product.is_on_sale && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                              Standard
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(product.product_id)}>
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

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminProducts;
