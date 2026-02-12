import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await axios.post(`${API}/marketing/subscribe`, { email });
      toast.success("Welcome aboard! You're now subscribed to our luxury updates.");
      setEmail("");
    } catch (error) {
      toast.error("Subscription failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer-luxury" data-testid="main-footer">
      {/* Newsletter Section */}
      <div className="luxury-container py-20">
        <div className="newsletter-luxury text-center">
          <p className="text-pink-200 text-sm uppercase tracking-[0.2em] mb-3 font-medium">Join Our Style Circle</p>
          <h3 className="text-3xl md:text-4xl font-serif mb-4">Get Exclusive Offers</h3>
          <p className="text-pink-100 mb-8 max-w-md mx-auto">
            Subscribe for early access to new arrivals, exclusive discounts and free shipping.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full text-stone-800 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              data-testid="newsletter-email"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-full bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
              data-testid="newsletter-submit"
            >
              {loading ? "Subscribing..." : "Subscribe"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-t border-stone-200">
        <div className="luxury-container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/">
                <img src={LOGO_URL} alt="Dubai SR" className="h-28 w-auto mb-6 drop-shadow-sm transition-transform hover:scale-105" />
              </Link>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                Elegance in Every Thread.  Premium Imported MiddleEastern Wear for the modern woman who appreciates timeless beauty.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/samairaonline786_6?igsh=dHFkZ3VzcXR1N2N6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors"
                  data-testid="social-instagram"
                >
                  <Instagram className="w-4 h-4" strokeWidth={1.5} />
                </a>
                <a
                  href="https://www.facebook.com/BEUNIQUETRENDY/?ref=pl_edit_xav_ig_profile_page_web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors"
                  data-testid="social-facebook"
                >
                  <Facebook className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg mb-6 text-stone-800">Shop</h4>
              <ul className="space-y-4">
                <li><Link to="/shop" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">All Products</Link></li>
                <li><Link to="/shop?filter=new" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">New Arrivals</Link></li>
                <li><Link to="/shop?filter=sale" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Sale</Link></li>
                <li><Link to="/shop?category=stitched-suits" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Stitched Suits</Link></li>
                <li><Link to="/shop?category=unstitched-suits" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Unstitched Suits</Link></li>
                <li><Link to="/shop?category=hijabs" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Hijabs</Link></li>
                <li><Link to="/shop?category=bags" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Luxury Bags</Link></li>
                <li><Link to="/shop?category=jewellery" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Jewellery</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="font-serif text-lg mb-6 text-stone-800">Help</h4>
              <ul className="space-y-4">
                <li><Link to="/track-order" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Track Your Order</Link></li>
                <li><Link to="/shipping-policy" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Shipping Information</Link></li>
                <li><Link to="/returns-policy" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Returns & Exchanges</Link></li>
                <li><Link to="/razorpay-policy" className="text-stone-500 hover:text-pink-600 text-sm transition-colors">Razorpay Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg mb-6 text-stone-800">Contact</h4>
              <ul className="space-y-4">
                <li>
                  <a href="tel:+918595371004" className="flex items-center gap-3 text-stone-500 hover:text-pink-600 text-sm transition-colors">
                    <Phone className="w-4 h-4 text-gold" strokeWidth={1.5} />
                    +91 85953 71004
                  </a>
                </li>
                <li>
                  <a href="mailto:srdubaifashion@gmail.com" className="flex items-center gap-3 text-stone-500 hover:text-pink-600 text-sm transition-colors">
                    <Mail className="w-4 h-4 text-gold" strokeWidth={1.5} />
                    srdubaifashion@gmail.com
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-3 text-stone-500 text-sm">
                    <MapPin className="w-4 h-4 text-gold mt-1 flex-shrink-0" strokeWidth={1.5} />
                    <span>3192-A Behind Golcha Cenima, Partap Street,<br />Darya Ganj, Delhi-2</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-200">
        <div className="luxury-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <div className="text-center md:text-left">
              <p>© 2026 Dubai SR. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/razorpay-policy" className="hover:text-pink-600 transition-colors">Razorpay Policy</Link>
              <Link to="/privacy-policy" className="hover:text-pink-600 transition-colors">Privacy Policy</Link>
              <Link to="/returns-policy" className="hover:text-pink-600 transition-colors">Returns & Exchanges</Link>
              <Link to="/terms-of-service" className="hover:text-pink-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
