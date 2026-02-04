import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, API, BACKEND_URL, resolveImageUrl } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import ConfirmationDialog from "../../components/admin/ConfirmationDialog";

const AdminCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", image_url: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Category updated successfully." />
        ), { duration: 3000, unstyled: true });
      } else {
        await axios.post(`${API}/admin/categories`, formData, { withCredentials: true });
        toast.custom((t) => (
          <LuxurySuccessToast t={t} title="Success" message="Category created successfully." />
        ), { duration: 3000, unstyled: true });
      }
      setIsDialogOpen(false); resetForm(); fetchCategories();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message={error.response?.data?.detail || "Failed to save category."} />
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
        image_url: imageUrl
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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/admin/categories/${deleteId}`, { withCredentials: true });
      toast.custom((t) => (
        <LuxurySuccessToast t={t} title="Deleted" message="Category deleted successfully." />
      ), { duration: 3000, unstyled: true });
      fetchCategories();
    } catch (error) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message="Failed to delete category." />
      ), { duration: 4000, unstyled: true });
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-content" data-testid="admin-categories">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-serif">Categories</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-category-btn"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="category-name" /></div>
                <div><Label>Slug *</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required data-testid="category-slug" /></div>
                <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="category-description" /></div>

                <div>
                  <Label>Category Image</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      {formData.image_url ? (
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">
                          <img src={resolveImageUrl(formData.image_url)} alt="Category" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: "" })}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-pink-600 hover:bg-pink-50 transition-colors bg-gray-50"
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
                              <span className="text-sm font-medium text-gray-600 text-center px-2">Click to Upload Portrait Image</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 flex flex-col justify-center">
                      <p className="text-sm text-gray-500 mb-2">Recommended: Portrait (3:4)</p>
                      {!formData.image_url && (
                        <Input
                          placeholder="Or paste image URL..."
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" className="btn-primary" data-testid="save-category-btn">{editingCategory ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? [...Array(10)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-stone-100 animate-pulse rounded-2xl border border-stone-200"></div>
        )) :
          filteredCategories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-serif italic">No categories found matching your search</p>
            </div>
          ) :
            filteredCategories.map((category) => (
              <Card
                key={category.category_id}
                className="group overflow-hidden flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl bg-white"
                data-testid={`category-card-${category.category_id}`}
              >
                <div className="aspect-[3/4] bg-stone-50 relative overflow-hidden">
                  {category.image_url ? (
                    <img
                      src={resolveImageUrl(category.image_url)}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                      <Upload className="h-12 w-12 opacity-20" />
                    </div>
                  )}

                  {/* Luxury Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-[50ms]"
                      onClick={() => handleEdit(category)}
                      data-testid={`edit-category-${category.category_id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-[100ms]"
                      onClick={() => setDeleteId(category.category_id)}
                      data-testid={`delete-category-${category.category_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-5 flex-grow flex flex-col justify-between border-t border-stone-100/50">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-stone-800 truncate" title={category.name}>{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-stone-100 text-[10px] font-medium text-stone-500 rounded-full uppercase tracking-wider">
                        {category.slug}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminCategories;
