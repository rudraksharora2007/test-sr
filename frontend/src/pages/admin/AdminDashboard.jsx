import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut, 
  Menu, X, TrendingUp, AlertCircle, Clock 
} from "lucide-react";
import { useAuth, API } from "../../App";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
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
      {/* Logo */}
      <Link to="/admin" className="block mb-8">
        <img src={LOGO_URL} alt="Dubai SR" className="h-14 w-auto" />
      </Link>

      {/* Admin Info */}
      <div className="mb-8 p-3 bg-white/10 rounded-lg">
        <p className="text-sm text-pink-100">Welcome,</p>
        <p className="font-medium truncate">{user?.name || "Admin"}</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`admin-nav-item ${location.pathname === item.href ? "active" : ""}`}
            data-testid={`admin-nav-${item.name.toLowerCase()}`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-6 left-6 right-6">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
          data-testid="admin-logout-btn"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
        <Link to="/" className="block mt-2 text-center text-sm text-white/60 hover:text-white">
          View Store →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <div className="lg:hidden bg-pink-700 text-white p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <h1 className="text-2xl font-serif mb-8">Dashboard Overview</h1>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="stat-total-orders">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-pink-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{(stats?.total_revenue || 0).toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card data-testid="stat-pending-orders">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pending_orders || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="stat-low-stock">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Low Stock Items</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.low_stock_products || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link to="/admin/orders">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats?.recent_orders?.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_orders.map((order) => (
                        <tr key={order.order_id}>
                          <td className="font-medium">{order.order_id}</td>
                          <td>{order.shipping_address?.full_name}</td>
                          <td>₹{order.total.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge status-${order.order_status}`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
