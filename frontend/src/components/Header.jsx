import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useCart, useAuth } from "../App";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const Header = () => {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "New Arrivals", href: "/shop?filter=new" },
    { name: "Sale", href: "/shop?filter=sale" },
  ];

  return (
    <header className="header-luxury" data-testid="main-header">
      {/* Promo Banner - Animated Rolling Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white overflow-hidden py-2 relative shadow-sm">
        <div className="animate-marquee flex gap-12">
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase">
            ✨ Free Shipping Site Wide • Exclusive Luxury Ethnic Wear • Dubai SR Signature Collection • Free Shipping Site Wide ✨
          </p>
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase">
            ✨ Free Shipping Site Wide • Exclusive Luxury Ethnic Wear • Dubai SR Signature Collection • Free Shipping Site Wide ✨
          </p>
        </div>
      </div>

      {/* Main Header */}
      <div className="luxury-container">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 -ml-2 text-stone-700 hover:text-pink-600 transition-colors" data-testid="mobile-menu-btn">
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0 border-r-0">
              <div className="bg-soft-pink h-full p-8">
                <Link to="/" onClick={() => setIsOpen(false)} className="block mb-10">
                  <img src={LOGO_URL} alt="Dubai SR" className="h-28 w-auto" />
                </Link>
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-lg font-serif text-stone-800 hover:text-pink-600 transition-colors border-b border-pink-100"
                      data-testid={`mobile-nav-${link.name.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-10 pt-6 border-t border-pink-100">
                  <p className="text-xs text-stone-400">
                    © {new Date().getFullYear()} Dubai SR. All rights reserved.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo - Left on Desktop */}
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <img src={LOGO_URL} alt="Dubai SR" className="h-16 md:h-24 w-auto drop-shadow-sm transition-transform hover:scale-105" />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center justify-center flex-1 px-12">
            <div className="flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="nav-link"
                  data-testid={`nav-${link.name.toLowerCase().replace(' ', '-')}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Actions - Right */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate("/shop")}
              className="p-2.5 text-stone-600 hover:text-pink-600 transition-colors hidden md:flex"
              data-testid="search-btn"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <Link to="/cart" className="relative p-2.5 text-stone-600 hover:text-pink-600 transition-colors" data-testid="cart-link">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  data-testid="cart-count"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>


            {/* User dropdown only shown for logged-in admin users */}
            {user && (
              <div className="relative group hidden md:block">
                <button className="p-2.5 text-stone-600 hover:text-pink-600 transition-colors">
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-pink-100 py-2 opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                  <div className="px-4 py-2 border-b border-pink-50 mb-1">
                    <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-pink-50 hover:text-pink-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>
      </div >
    </header >
  );
};

export default Header;
