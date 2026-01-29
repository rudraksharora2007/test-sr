import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Truck, Shield, RotateCcw, MessageCircle, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import ProductCard from "../components/ProductCard";
import { API } from "../App";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 5, hours: 12, mins: 34, secs: 56 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/products?is_featured=true&limit=8`)
        ]);
        setCategories(catRes.data);
        setFeaturedProducts(prodRes.data.products);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, mins, secs } = prev;
        secs--;
        if (secs < 0) { secs = 59; mins--; }
        if (mins < 0) { mins = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 5, hours: 12, mins: 34, secs: 56 };
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      text: "Absolutely stunning collection! The quality of the suits exceeded my expectations. Will definitely shop again.",
      name: "Priya Sharma",
      location: "Mumbai"
    },
    {
      text: "Found my dream bridal lehenga here. The customer service was exceptional and delivery was on time.",
      name: "Aisha Khan",
      location: "Delhi"
    },
    {
      text: "Best ethnic wear boutique online. The Maria B collection is authentic and beautifully crafted.",
      name: "Neha Patel",
      location: "Bangalore"
    }
  ];

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section" data-testid="hero-section">
        <img 
          src="https://images.unsplash.com/photo-1766763846239-bfea22785d03?crop=entropy&cs=srgb&fm=jpg&q=85" 
          alt="Dubai SR Collection"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content animate-fade-in">
          <p className="text-gold-light uppercase tracking-[0.3em] text-sm mb-4">New Collection 2024</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
            Elegance in<br />
            <span className="italic font-accent">Every Thread</span>
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-xl mx-auto">
            Discover our exquisite collection of premium Indian ethnic wear. From Maria B to Sana Safinaz, find your perfect style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="btn-primary text-base px-8 py-6" data-testid="shop-collection-btn">
                Shop Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/shop?filter=new">
              <Button className="btn-outline text-base px-8 py-6" data-testid="new-arrivals-btn">
                New Arrivals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-8 border-b">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 justify-center">
              <Truck className="h-6 w-6 text-pink-700" />
              <div>
                <p className="font-medium text-sm">Free Shipping</p>
                <p className="text-xs text-gray-500">On orders above ₹2999</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Shield className="h-6 w-6 text-pink-700" />
              <div>
                <p className="font-medium text-sm">Secure Payment</p>
                <p className="text-xs text-gray-500">UPI, Cards & COD</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <RotateCcw className="h-6 w-6 text-pink-700" />
              <div>
                <p className="font-medium text-sm">Easy Returns</p>
                <p className="text-xs text-gray-500">7-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <MessageCircle className="h-6 w-6 text-pink-700" />
              <div>
                <p className="font-medium text-sm">24/7 Support</p>
                <p className="text-xs text-gray-500">WhatsApp assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding bg-white" data-testid="categories-section">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-pink-700 uppercase tracking-widest text-sm mb-2">Browse by Category</p>
            <h2 className="text-3xl md:text-4xl font-serif">Shop Our Collections</h2>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <Link 
                  key={category.category_id} 
                  to={`/shop?category=${category.slug}`}
                  className="category-card"
                  data-testid={`category-${category.slug}`}
                >
                  <img 
                    src={category.image_url || "https://images.unsplash.com/photo-1635490540200-7d6c2a871377?crop=entropy&cs=srgb&fm=jpg&q=85"} 
                    alt={category.name}
                    loading="lazy"
                  />
                  <div className="category-overlay">
                    <h3 className="text-xl font-serif font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-200 mt-1">{category.description}</p>
                    <span className="text-sm font-medium mt-2 flex items-center">
                      Shop Now <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-gray-50" data-testid="featured-products-section">
        <div className="section-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <p className="text-pink-700 uppercase tracking-widest text-sm mb-2">Curated for You</p>
              <h2 className="text-3xl md:text-4xl font-serif">Featured Collection</h2>
            </div>
            <Link to="/shop" className="mt-4 md:mt-0">
              <Button variant="outline" className="border-pink-700 text-pink-700 hover:bg-pink-50" data-testid="view-all-products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="product-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="product-grid stagger-children">
              {featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sale Banner */}
      <section className="sale-banner py-16 md:py-24" data-testid="sale-banner">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden rounded-lg">
              <img 
                src="https://images.unsplash.com/photo-1640181637089-cce4a3040ed2?crop=entropy&cs=srgb&fm=jpg&q=85" 
                alt="Bridal Collection"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-pink-700 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Up to 30% Off</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gold uppercase tracking-widest text-sm mb-2">Limited Time Offer</p>
              <h2 className="text-3xl md:text-5xl font-serif mb-4">
                Bridal Collection<br />
                <span className="text-pink-700">Sale is Live</span>
              </h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Discover our exquisite bridal lehengas and wedding suits. Premium quality, handcrafted with love. Make your special day truly memorable.
              </p>
              
              {/* Countdown */}
              <div className="flex gap-3 justify-center md:justify-start mb-8">
                <div className="countdown-item">
                  <span className="countdown-value">{String(countdown.days).padStart(2, '0')}</span>
                  <span className="countdown-label">Days</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="countdown-label">Hours</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{String(countdown.mins).padStart(2, '0')}</span>
                  <span className="countdown-label">Mins</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{String(countdown.secs).padStart(2, '0')}</span>
                  <span className="countdown-label">Secs</span>
                </div>
              </div>
              
              <Link to="/shop?category=bridal-wear">
                <Button className="btn-primary" data-testid="shop-bridal-btn">
                  Shop Bridal Wear
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-white" data-testid="testimonials-section">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-pink-700 uppercase tracking-widest text-sm mb-2">Customer Love</p>
            <h2 className="text-3xl md:text-4xl font-serif">What Our Customers Say</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card" data-testid={`testimonial-${index}`}>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-700 font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
