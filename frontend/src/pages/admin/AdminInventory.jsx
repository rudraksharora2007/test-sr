import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut,
    Menu, X, Search, Plus, Minus, AlertCircle, Users, FileText,
    Settings, BarChart3, Activity, BoxIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, API } from "../../App";
import LuxurySuccessToast from "../../components/LuxurySuccessToast";
import LuxuryErrorToast from "../../components/LuxuryErrorToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminInventory = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
    const [adjustmentValue, setAdjustmentValue] = useState("");
    const [adjustmentType, setAdjustmentType] = useState("set"); // set, add, subtract

    useEffect(() => {
        fetchProducts();
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

    const openAdjustDialog = (product) => {
        setSelectedProduct(product);
        setAdjustmentValue(product.stock.toString());
        setAdjustmentType("set");
        setIsAdjustDialogOpen(true);
    };

    const handleStockAdjustment = async () => {
        if (!adjustmentValue || isNaN(parseInt(adjustmentValue))) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Invalid" message="Please enter a valid number." />
            ), { duration: 3000, unstyled: true });
            return;
        }

        let newStock = parseInt(adjustmentValue);
        if (adjustmentType === "add") {
            newStock = selectedProduct.stock + parseInt(adjustmentValue);
        } else if (adjustmentType === "subtract") {
            newStock = Math.max(0, selectedProduct.stock - parseInt(adjustmentValue));
        }

        try {
            await axios.put(`${API}/admin/products/${selectedProduct.product_id}`, { stock: newStock }, { withCredentials: true });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Stock Updated" message={`Stock updated to ${newStock} units.`} />
            ), { duration: 3000, unstyled: true });
            setIsAdjustDialogOpen(false);
            fetchProducts();
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Failed" message="Failed to update stock." />
            ), { duration: 4000, unstyled: true });
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = stockFilter === "all" ? true :
            stockFilter === "low" ? p.stock < 5 && p.stock > 0 :
                stockFilter === "out" ? p.stock === 0 :
                    stockFilter === "instock" ? p.stock >= 5 : true;
        return matchesSearch && matchesFilter;
    });

    const stockCounts = {
        total: products.length,
        inStock: products.filter(p => p.stock >= 5).length,
        lowStock: products.filter(p => p.stock < 5 && p.stock > 0).length,
        outOfStock: products.filter(p => p.stock === 0).length
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-500 mb-8">Track and adjust product stock levels</p>

            {/* Stock Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className={`cursor-pointer transition-all ${stockFilter === 'all' ? 'ring-2 ring-pink-500' : ''}`} onClick={() => setStockFilter('all')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{stockCounts.total}</p>
                        <p className="text-sm text-gray-500">Total Products</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer transition-all ${stockFilter === 'instock' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setStockFilter('instock')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stockCounts.inStock}</p>
                        <p className="text-sm text-gray-500">In Stock</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer transition-all ${stockFilter === 'low' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setStockFilter('low')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{stockCounts.lowStock}</p>
                        <p className="text-sm text-gray-500">Low Stock</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer transition-all ${stockFilter === 'out' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setStockFilter('out')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{stockCounts.outOfStock}</p>
                        <p className="text-sm text-gray-500">Out of Stock</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by product name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Products Grid */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">Loading...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No products found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-600">Product</th>
                                        <th className="text-left p-4 font-medium text-gray-600">SKU</th>
                                        <th className="text-center p-4 font-medium text-gray-600">Current Stock</th>
                                        <th className="text-center p-4 font-medium text-gray-600">Status</th>
                                        <th className="text-center p-4 font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={product.images?.[0] || "https://via.placeholder.com/50"} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                                    <div>
                                                        <p className="font-medium text-sm">{product.name}</p>
                                                        <p className="text-xs text-gray-500">{product.brand}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{product.sku || "-"}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' :
                                                    product.stock < 5 ? 'text-yellow-600' : 'text-green-600'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {product.stock === 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                        <AlertCircle className="h-3 w-3" /> Out of Stock
                                                    </span>
                                                ) : product.stock < 5 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                                        <AlertCircle className="h-3 w-3" /> Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">In Stock</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Button variant="outline" size="sm" onClick={() => openAdjustDialog(product)}>
                                                    Adjust Stock
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Adjust Stock Dialog */}
            <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Current Stock</p>
                            <p className="text-3xl font-bold">{selectedProduct?.stock}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={adjustmentType === "set" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setAdjustmentType("set")}
                            >
                                Set to
                            </Button>
                            <Button
                                variant={adjustmentType === "add" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setAdjustmentType("add")}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                            <Button
                                variant={adjustmentType === "subtract" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setAdjustmentType("subtract")}
                            >
                                <Minus className="h-4 w-4 mr-1" /> Remove
                            </Button>
                        </div>

                        <div>
                            <Label>{adjustmentType === "set" ? "New Stock Value" : "Quantity"}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustmentValue}
                                onChange={(e) => setAdjustmentValue(e.target.value)}
                                className="text-center text-lg"
                            />
                        </div>

                        {adjustmentType !== "set" && (
                            <p className="text-sm text-gray-500 text-center">
                                New stock will be: <strong>
                                    {adjustmentType === "add"
                                        ? (selectedProduct?.stock || 0) + (parseInt(adjustmentValue) || 0)
                                        : Math.max(0, (selectedProduct?.stock || 0) - (parseInt(adjustmentValue) || 0))}
                                </strong>
                            </p>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setIsAdjustDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 btn-primary" onClick={handleStockAdjustment}>Update Stock</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminInventory;
