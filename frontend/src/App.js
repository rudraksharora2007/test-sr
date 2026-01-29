import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import axios from "axios";

// Pages
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AuthCallback from "./components/AuthCallback";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
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
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
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
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

// App Router Component
function AppRouter() {
  const location = useLocation();
  
  // Check for session_id in URL fragment (Emergent Auth callback)
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
      <Route path="/product/:slug" element={<MainLayout><ProductPage /></MainLayout>} />
      <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
      <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
      <Route path="/order/:orderId" element={<MainLayout><OrderConfirmationPage /></MainLayout>} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute>
          <AdminLayout><AdminProducts /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute>
          <AdminLayout><AdminCategories /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute>
          <AdminLayout><AdminOrders /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/coupons" element={
        <ProtectedRoute>
          <AdminLayout><AdminCoupons /></AdminLayout>
        </ProtectedRoute>
      } />
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
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API, BACKEND_URL };
