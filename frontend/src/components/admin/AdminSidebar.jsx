import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Package, FolderOpen, ShoppingCart, Tag, LogOut,
    Menu, X, Users, FileText, Settings, BarChart3, Activity, BoxIcon
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../App";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isSubdomain = window.location.hostname.startsWith("admin.");

    const handleLogout = async () => {
        await logout();
        navigate(isSubdomain ? "/login" : "/admin/login");
    };

    const navItems = [
        { name: "Dashboard", href: isSubdomain ? "/" : "/admin", icon: LayoutDashboard },
        { name: "Products", href: isSubdomain ? "/products" : "/admin/products", icon: Package },
        { name: "Categories", href: isSubdomain ? "/categories" : "/admin/categories", icon: FolderOpen },
        { name: "Inventory", href: isSubdomain ? "/inventory" : "/admin/inventory", icon: BoxIcon },
        { name: "Orders", href: isSubdomain ? "/orders" : "/admin/orders", icon: ShoppingCart },
        { name: "Coupons", href: isSubdomain ? "/coupons" : "/admin/coupons", icon: Tag },
        { name: "Customers", href: isSubdomain ? "/customers" : "/admin/customers", icon: Users },
        { name: "Content", href: isSubdomain ? "/content" : "/admin/content", icon: FileText },
        { name: "Reports", href: isSubdomain ? "/reports" : "/admin/reports", icon: BarChart3 },
        { name: "Settings", href: isSubdomain ? "/settings" : "/admin/settings", icon: Settings },
        { name: "Activity", href: isSubdomain ? "/activity" : "/admin/activity", icon: Activity },
    ];

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden bg-pink-800 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <img src={LOGO_URL} alt="Dubai SR" className="h-10" />
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-pink-800 via-pink-900 to-pink-950 text-white p-6 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Link to="/" className="block mb-8">
                    <img src={LOGO_URL} alt="Dubai SR" className="h-16 w-auto drop-shadow-xl brightness-110" />
                </Link>

                <div className="mb-6 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-xs text-pink-200 uppercase tracking-wider mb-1">Welcome</p>
                    <p className="font-medium truncate text-sm">{user?.name || "Admin"}</p>
                </div>

                <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === item.href
                                ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Logout
                    </Button>
                    <Link
                        to="/"
                        className="block text-center text-xs text-white/50 hover:text-white transition-colors mt-4"
                    >
                        View Live Store →
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
