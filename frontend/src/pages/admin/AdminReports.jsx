import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, ShoppingCart, Calendar } from "lucide-react";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const AdminReports = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reports, setReports] = useState({
        total_revenue: 0,
        total_orders: 0,
        avg_order_value: 0,
        best_sellers: [],
        daily_sales: [],
        orders_by_status: {}
    });

    useEffect(() => {
        if (dateRange !== "custom") {
            fetchReports();
        }
    }, [dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            let url = `${API}/admin/reports`;
            if (dateRange === "custom") {
                if (!startDate || !endDate) {
                    setLoading(false);
                    return;
                }
                url = `${API}/admin/reports?start_date=${startDate}&end_date=${endDate}`;
            } else if (dateRange !== "all") {
                url = `${API}/admin/reports?days=${dateRange}`;
            }

            const response = await axios.get(url, { withCredentials: true });
            setReports(response.data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearCustomDate = () => {
        setStartDate("");
        setEndDate("");
        setDateRange("all");
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                    <p className="text-gray-500">View sales performance and insights</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0 items-end">
                    <div className="flex gap-2">
                        {[{ label: "All Time", value: "all" }, { label: "7 Days", value: "7" }, { label: "30 Days", value: "30" }, { label: "90 Days", value: "90" }, { label: "Custom", value: "custom" }].map(opt => (
                            <Button key={opt.value} variant={dateRange === opt.value ? "default" : "outline"} size="sm" onClick={() => setDateRange(opt.value)}>
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-auto h-9"
                            />
                            <span className="text-gray-400">-</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-auto h-9"
                            />
                            <Button size="sm" onClick={fetchReports} disabled={!startDate || !endDate}>
                                Apply
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearCustomDate}>
                                Clear
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Revenue</p>
                                        <p className="text-3xl font-bold text-green-600">₹{(reports.total_revenue || 0).toLocaleString()}</p>
                                    </div>
                                    <TrendingUp className="h-10 w-10 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Orders</p>
                                        <p className="text-3xl font-bold text-blue-600">{reports.total_orders || 0}</p>
                                    </div>
                                    <ShoppingCart className="h-10 w-10 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Avg Order Value</p>
                                        <p className="text-3xl font-bold text-purple-600">₹{(reports.avg_order_value || 0).toLocaleString()}</p>
                                    </div>
                                    <Calendar className="h-10 w-10 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Best Sellers */}
                    <Card className="border-0 shadow-lg mb-8">
                        <CardHeader><CardTitle>Best Selling Products</CardTitle></CardHeader>
                        <CardContent>
                            {reports.best_sellers?.length > 0 ? (
                                <div className="space-y-3">
                                    {reports.best_sellers.map((product, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.total_quantity} units sold</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-green-600">₹{(product.total_revenue || 0).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No sales data available</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orders by Status */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(reports.orders_by_status || {}).map(([status, count]) => (
                                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold">{count}</p>
                                        <p className="text-sm text-gray-500 capitalize">{status}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default AdminReports;
