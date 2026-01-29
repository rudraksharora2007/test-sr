import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useCart } from "../App";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const Header = () => {
  const { cartCount } = useCart();
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
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white text-center py-2.5 px-4">
        <p className="text-xs md:text-sm font-medium tracking-wide">
          Free Shipping on Orders Above ₹2,999 · Use Code <span className="font-bold">WELCOME10</span> for 10% Off
        </p>
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
                  <img src={LOGO_URL} alt="Dubai SR" className="h-20 w-auto" />
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
                  <Link 
                    to="/admin/login" 
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-stone-500 hover:text-pink-600 transition-colors"
                  >
                    Admin Login →
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo - Left on Desktop */}
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <img src={LOGO_URL} alt="Dubai SR" className="h-14 md:h-18 w-auto" />
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
            
            <Link 
              to="/admin/login" 
              className="p-2.5 text-stone-600 hover:text-pink-600 transition-colors hidden md:flex"
              data-testid="admin-link"
            >
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>

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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
