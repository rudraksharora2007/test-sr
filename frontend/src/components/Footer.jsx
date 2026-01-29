import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200" data-testid="main-footer">
      {/* Newsletter Section */}
      <div className="bg-pink-700 py-12">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-serif text-white mb-2">Join Our Style Circle</h3>
              <p className="text-pink-100">Subscribe for exclusive offers and 10% off your first order.</p>
            </div>
            <div className="flex w-full md:w-auto max-w-md gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/10 border-white/30 text-white placeholder:text-pink-200 focus:bg-white focus:text-gray-900"
                data-testid="newsletter-email"
              />
              <Button className="bg-white text-pink-700 hover:bg-pink-50 px-6" data-testid="newsletter-submit">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/">
              <img src={LOGO_URL} alt="Dubai SR" className="h-16 w-auto mb-4" />
            </Link>
            <p className="text-gray-600 text-sm mb-4">
              Elegance in Every Thread. Premium Indian ethnic fashion for the modern woman.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-700 transition-colors" data-testid="social-instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-700 transition-colors" data-testid="social-facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Shop All</Link></li>
              <li><Link to="/shop?filter=new" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?filter=sale" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Sale</Link></li>
              <li><Link to="/shop?category=stitched-suits" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Stitched Suits</Link></li>
              <li><Link to="/shop?category=unstitched-suits" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Unstitched Suits</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Customer Service</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Track Order</a></li>
              <li><a href="#" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Returns & Exchange</a></li>
              <li><a href="#" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-gray-600 hover:text-pink-700 text-sm transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone className="h-4 w-4 text-pink-700" />
                <a href="tel:+918595371004" className="hover:text-pink-700">+91 8595371004</a>
              </li>
              <li className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail className="h-4 w-4 text-pink-700" />
                <a href="mailto:hello@dubaisr.com" className="hover:text-pink-700">hello@dubaisr.com</a>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="h-4 w-4 text-pink-700 mt-0.5" />
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-6">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2024 Dubai SR. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-pink-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-pink-700 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
