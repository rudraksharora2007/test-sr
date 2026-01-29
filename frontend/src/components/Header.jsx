import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useCart } from "../App";
import { Button } from "./ui/button";
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm" data-testid="main-header">
      {/* Top Bar */}
      <div className="bg-pink-700 text-white text-center py-2 text-sm">
        <p>Free Shipping on Orders Above ₹2,999 | Use Code <span className="font-semibold">WELCOME10</span> for 10% Off</p>
      </div>
      
      {/* Main Header */}
      <div className="section-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="p-6">
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img src={LOGO_URL} alt="Dubai SR" className="h-16 w-auto mb-6" />
                </Link>
                <nav className="space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-lg font-medium text-gray-800 hover:text-pink-700 transition-colors"
                      data-testid={`mobile-nav-${link.name.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <img src={LOGO_URL} alt="Dubai SR" className="h-12 md:h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-700 hover:text-pink-700 font-medium transition-colors relative group"
                data-testid={`nav-${link.name.toLowerCase().replace(' ', '-')}`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex"
              onClick={() => navigate("/shop")}
              data-testid="search-btn"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Link to="/admin/login" data-testid="admin-link">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/cart" className="relative" data-testid="cart-link">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium" data-testid="cart-count">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
