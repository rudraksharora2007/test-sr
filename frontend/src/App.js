import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import { HelmetProvider } from 'react-helmet-async';

// Pages
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import ReturnsPolicyPage from "./pages/ReturnsPolicyPage";
import RazorpayPolicyPage from "./pages/RazorpayPolicyPage";

import TrackOrderPage from "./pages/TrackOrderPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";

import AdminInventory from "./pages/admin/AdminInventory";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminContent from "./pages/admin/AdminContent";
import AdminReports from "./pages/admin/AdminReports";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminSidebar from "./components/admin/AdminSidebar";
import GoogleAuthCallback from "./components/GoogleAuthCallback";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "./components/ui/sonner";

const getBackendUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "admin.localhost") {
    return "http://localhost:8000";
  }
  return process.env.REACT_APP_BACKEND_URL;
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

// Cart Context
export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// Auth Context
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Generate session ID for cart
const getSessionId = () => {
  let sessionId = localStorage.getItem("dubai_sr_session");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("dubai_sr_session", sessionId);
  }
  return sessionId;
};

// Cart Provider Component
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], coupon_code: null, coupon_discount: 0 });
  const [loading, setLoading] = useState(false);
  const sessionId = getSessionId();

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart/${sessionId}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const addToCart = async (productId, quantity = 1, size = "M") => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/cart/${sessionId}/add`, {
        product_id: productId,
        quantity,
        size
      });
      // Force refresh of cart to get updated items structure (or rely on backend response)
      setCart(response.data);
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, size, quantity) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API}/cart/${sessionId}/update`, {
        product_id: productId,
        size,
        quantity
      });
      setCart(response.data);
    } catch (error) {
      console.error("Error updating cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId, size) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/cart/${sessionId}/item?product_id=${productId}&size=${size}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code) => {
    try {
      const response = await axios.post(`${API}/cart/${sessionId}/coupon`, { code });
      setCart(response.data);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const removeCoupon = async () => {
    try {
      const response = await axios.delete(`${API}/cart/${sessionId}/coupon`);
      setCart(response.data);
    } catch (error) {
      console.error("Error removing coupon:", error);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/${sessionId}`);
      setCart({ items: [], coupon_code: null, coupon_discount: 0 });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartTotal = cart.items?.reduce((total, item) => {
    const price = item.sale_price || item.price;
    return total + (price * item.quantity);
  }, 0) || 0;

  const cartCount = cart.items?.reduce((count, item) => count + item.quantity, 0) || 0;

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      cartTotal,
      cartCount,
      loading,
      sessionId,
      addToCart,
      updateCartItem,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};


// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = window.location;

  const checkAuth = async () => {
    try {
      // SECURE: No URL parsing, no localStorage
      // Session is handled via HTTP-only cookies set by backend
      // Just call /auth/me with credentials
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        timeout: 5000
      });
      setUser(response.data);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route for Admin
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const hostname = window.location.hostname;
  const isSubdomain = hostname.startsWith("admin.");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    const isAdminPath = location.pathname.startsWith("/admin");
    return (
      <Navigate
        to={isAdminPath ? "/admin/login" : "/login"}
        state={{ from: location }}
        replace
      />
    );
  }

  // Strict check for admin privileges if required
  if (adminOnly && !user.is_admin && !user.user_id?.startsWith("admin_")) {
    console.warn("Non-admin user attempted to access protected admin route:", user.email);
    // Redirect to main shop to avoid confusion
    const mainDomain = window.location.hostname.includes("localhost")
      ? "http://localhost:3000"
      : window.location.protocol + "//" + window.location.host.replace("admin.", "");

    window.location.href = mainDomain;
    return null;
  }

  return children;
};

// Layout with Header/Footer
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

// Admin Layout
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:ml-64 p-6 lg:p-8 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
};

// App Router Component
function AppRouter() {
  const hostname = window.location.hostname;
  const isSubdomain = hostname.startsWith("admin.");

  if (isSubdomain) {
    return (
      <Routes>
        {/* Admin Login is at /login on the subdomain */}
        <Route path="/login" element={<AdminLoginPage />} />
        {/* Auth Callback needs to be here too for the jump back */}
        <Route path="/auth/callback" element={<GoogleAuthCallback />} />
        {/* All other admin routes */}
        <Route path="/" element={<AdminLayout />}>
          <Route
            index
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute adminOnly>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute adminOnly>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute adminOnly>
                <AdminInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute adminOnly>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={
              <ProtectedRoute adminOnly>
                <AdminCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="content"
            element={
              <ProtectedRoute adminOnly>
                <AdminContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute adminOnly>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="activity"
            element={
              <ProtectedRoute adminOnly>
                <AdminActivity />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <ProtectedRoute adminOnly>
                <AdminCoupons />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public Store Routes */}
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
      <Route path="/product/:slug" element={<MainLayout><ProductPage /></MainLayout>} />
      <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
      <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      {/* Admin routes now run on same origin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute adminOnly>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ProtectedRoute adminOnly>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute adminOnly>
              <AdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute adminOnly>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute adminOnly>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="content"
          element={
            <ProtectedRoute adminOnly>
              <AdminContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity"
          element={
            <ProtectedRoute adminOnly>
              <AdminActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="coupons"
          element={
            <ProtectedRoute adminOnly>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/auth/callback" element={<GoogleAuthCallback />} />
      <Route path="/order/:orderId" element={<MainLayout><OrderConfirmationPage /></MainLayout>} />
      <Route path="/track-order" element={<MainLayout><TrackOrderPage /></MainLayout>} />
      <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicyPage /></MainLayout>} />
      <Route path="/shipping-policy" element={<MainLayout><ShippingPolicyPage /></MainLayout>} />
      <Route path="/terms-of-service" element={<MainLayout><TermsOfServicePage /></MainLayout>} />
      <Route path="/returns-policy" element={<MainLayout><ReturnsPolicyPage /></MainLayout>} />
      <Route path="/razorpay-policy" element={<MainLayout><RazorpayPolicyPage /></MainLayout>} />

      {/* REMOVED: /admin* routes from main domain to strict isolation */}

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  // Seed database on first load
  useEffect(() => {
    const seedDB = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (error) {
        // Ignore if already seeded
      }
    };
    seedDB();
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <AppRouter />
            <Toaster position="top-right" richColors />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

const resolveImageUrl = (path, fallback) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/col-imgs/')) return `${BACKEND_URL}${path}`;
  return path; // Treat as frontend asset or relative path
};

const hideSizeDisplay = (size) => {
  if (!size) return true;
  const s = size.toLowerCase();
  return s === "unstitched" || s === "unstitch" || s === "none" || s === "one size";
};

const isUnstitchedProduct = (product) => {
  const sizes = product?.sizes || [];
  return sizes.length === 0 || (sizes.length === 1 && hideSizeDisplay(sizes[0]));
};

export default App;
export { API, BACKEND_URL, resolveImageUrl, hideSizeDisplay, isUnstitchedProduct };
