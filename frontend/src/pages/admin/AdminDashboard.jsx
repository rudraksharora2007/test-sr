import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut,
  Menu, X, TrendingUp, AlertCircle, Clock, Truck, Users, FileText,
  Settings, BarChart3, Activity, BoxIcon
} from "lucide-react";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/admin/dashboard`, { withCredentials: true });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome back! Here's an overview of your store.</p>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="Total Orders"
              value={stats?.total_orders || 0}
              icon={ShoppingCart}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${(stats?.total_revenue || 0).toLocaleString()}`}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <StatCard
              title="Pending Orders"
              value={stats?.pending_orders || 0}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Shipped Today"
              value={stats?.shipped_today || 0}
              icon={Truck}
              color="bg-purple-500"
            />
            <StatCard
              title="Low Stock"
              value={stats?.low_stock_count || 0}
              icon={AlertCircle}
              color="bg-red-500"
              subtext="Products below 5 units"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                    View All →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {stats?.recent_orders?.length > 0 ? (
                  <div className="divide-y">
                    {stats.recent_orders.map((order) => (
                      <div key={order.order_id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{order.order_id}</p>
                          <p className="text-xs text-gray-500">{order.shipping_address?.full_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{order.total?.toLocaleString()}</p>
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {order.order_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-red-50/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Low Stock Alert
                </CardTitle>
                <Link to="/inventory">
                  <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                    Manage →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {stats?.low_stock_products?.length > 0 ? (
                  <div className="divide-y">
                    {stats.low_stock_products.map((product) => (
                      <div key={product.product_id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                        <img
                          src={product.images?.[0] || "https://via.placeholder.com/50"}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className={`text-xs font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {product.stock === 0 ? 'OUT OF STOCK' : `Only ${product.stock} left`}
                          </p>
                        </div>
                        <Link to={`/products`}>
                          <Button variant="outline" size="sm">Restock</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">All products well stocked!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
