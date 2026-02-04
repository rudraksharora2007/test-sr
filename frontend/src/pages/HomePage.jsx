import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Truck, Shield, RotateCcw, Sparkles, Star, Quote } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { API, BACKEND_URL, resolveImageUrl } from "../App";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featuredRes, newRes, saleRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/products?is_featured=true&limit=4`),
          axios.get(`${API}/products?is_new_arrival=true&limit=4`),
          axios.get(`${API}/products?is_on_sale=true&limit=4`)
        ]);
        setCategories(catRes.data);
        setFeaturedProducts(featuredRes.data.products);
        setNewArrivals(newRes.data.products);
        setSaleProducts(saleRes.data.products);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const testimonials = [
    {
      text: "The quality is absolutely stunning. My Maria B suit was even more beautiful in person than in the photos. Dubai SR has become my go-to boutique.",
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5
    },
    {
      text: "Found my dream bridal lehenga here. The attention to detail and customer service exceeded all my expectations. Truly premium quality.",
      name: "Aisha Khan",
      location: "Delhi",
      rating: 5
    },
    {
      text: "I've shopped from many boutiques, but Dubai SR stands out for their authentic collections and elegant packaging. Worth every penny.",
      name: "Neha Patel",
      location: "Bangalore",
      rating: 5
    }
  ];

  const heroImages = {
    main: "https://images.unsplash.com/photo-1745482036880-03c56199649f?crop=entropy&cs=srgb&fm=jpg&q=85",
    collection: "https://images.unsplash.com/photo-1638964327749-53436bcccdca?crop=entropy&cs=srgb&fm=jpg&q=85"
  };

  // Organization structured data for homepage
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Dubai SR",
    "url": window.location.origin,
    "logo": "https://customer-assets.emergentagent.com/job_luxury-ethnic-1/artifacts/6p9d4kzc_srlogo.png",
    "description": "Premium luxury ethnic wear boutique offering exquisite Indian designer suits, lehengas, and traditional wear",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    }
  };

  return (
    <div data-testid="home-page" className="overflow-hidden">
      <SEO
        title="Luxury Ethnic Wear & Designer Suits"
        description="Discover Dubai SR's exquisite collection of premium Indian ethnic wear. Shop authentic designer suits, lehengas, and traditional wear with free shipping across India."
        keywords="luxury ethnic wear, designer suits, Indian traditional wear, premium lehenga, Maria B suits, Dubai SR boutique"
        image={heroImages.main}
        structuredData={organizationSchema}
      />

      {/* Hero Section - Luxury */}
      <section className="hero-luxury h-[60vh] md:h-[70vh] min-h-[500px]" data-testid="hero-section">
        <img
          src={heroImages.main}
          alt="Dubai SR Collection"
          className="bg-image"
        />
        <div className="overlay"></div>
        <div className="content animate-fade-in-up">
          <p className="text-gold-light text-[10px] md:text-xs uppercase tracking-[0.3em] mb-3 font-medium">
            New Collection 2024
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium mb-4 leading-tight">
            Elegance in<br />
            <span className="font-accent italic">Every Thread</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
            Discover our exquisite collection of premium Indian ethnic wear. Curated for women who appreciate timeless beauty and modern elegance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/shop">
              <button className="btn-luxury-primary group px-6 py-3 text-sm" data-testid="shop-collection-btn">
                Shop Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/shop?filter=new">
              <button className="btn-luxury-outline px-6 py-3 text-sm" data-testid="new-arrivals-btn">
                New Arrivals
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-soft-pink py-8 md:py-10">
        <div className="luxury-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders above ₹2,999" },
              { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
              { icon: RotateCcw, title: "Exchange Policy", desc: "Exchange on damaged articles" },
              { icon: Sparkles, title: "Premium Quality", desc: "Authentic collections" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 md:justify-center">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-pink-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-sm text-stone-800">{feature.title}</p>
                  <p className="text-xs text-stone-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections - Bento Grid */}
      <section className="section-luxury py-12 md:py-16" data-testid="categories-section">
        <div className="luxury-container">
          <div className="text-center mb-10">
            <p className="text-gold text-[10px] uppercase tracking-[0.3em] mb-2 font-semibold">Explore</p>
            <h2 className="text-2xl md:text-4xl font-serif text-stone-800">Our Collections</h2>
            <div className="divider-gold mt-4"></div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-luxury rounded-3xl aspect-[4/5]"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {categories.map((category) => (
                <Link
                  key={category.category_id}
                  to={`/shop?category=${category.slug}`}
                  className="category-card-luxury group aspect-[4/5]"
                  data-testid={`category-${category.slug}`}
                >
                  <img
                    src={resolveImageUrl(category.image_url, heroImages.collection)}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="overlay bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                    <p className="text-gold-light text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Collection
                    </p>
                    <h3 className="font-serif text-white mb-1 text-lg md:text-xl">
                      {category.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 group-hover:text-gold-light transition-colors duration-300">
                      Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-luxury bg-soft-pink" data-testid="featured-products-section">
        <div className="luxury-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Handpicked</p>
              <h2 className="text-3xl md:text-5xl font-serif text-stone-800">Featured Collection</h2>
            </div>
            <Link to="/shop?is_featured=true">
              <button className="btn-luxury-secondary group" data-testid="view-all-featured">
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] skeleton-luxury rounded-2xl"></div>
                  <div className="h-4 skeleton-luxury rounded w-1/2 mx-auto"></div>
                  <div className="h-6 skeleton-luxury rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 stagger-animate">
              {featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section-luxury">
        <div className="luxury-container">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-luxury">
                <img
                  src="/images/our-story.jpg"
                  alt="Dubai SR Story"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Decorative Gold Frame */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-gold/30 rounded-3xl -z-10 animate-pulse-slow"></div>
            </div>
            <div className="py-8 md:py-12 stagger-animate">
              <p className="text-gold text-xs uppercase tracking-[0.3em] mb-4 font-semibold">The Dubai SR Legacy</p>
              <h2 className="text-3xl md:text-5xl font-serif text-stone-800 mb-6 leading-tight">
                Crafting Elegance,<br />
                <span className="font-accent italic">Defined by Tradition</span>
              </h2>
              <div className="gold-line mb-8"></div>
              <p className="text-stone-600 text-lg leading-relaxed mb-6 font-medium">
                At Dubai SR, we believe that true luxury lies in the details. Our journey began with a simple vision: to bring the most exquisite, authentic Indian ethnic wear to the modern woman.
              </p>
              <p className="text-stone-500 leading-relaxed mb-8">
                From the intricate hand-work of Maria B to the timeless silhouettes of our signatures, every piece in our collection is handpicked for its craftsmanship and elegance. We don't just sell clothes; we curate masterpieces that make you feel like royalty.
              </p>
              <Link to="/shop">
                <button className="btn-luxury-primary group px-8 py-4">
                  Experience the Collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="section-luxury bg-stone-50">
          <div className="luxury-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Just Landed</p>
                <h2 className="text-3xl md:text-5xl font-serif text-stone-800">New Arrivals</h2>
              </div>
              <Link to="/shop?filter=new">
                <button className="btn-luxury-secondary group">
                  View All New
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 stagger-animate">
              {newArrivals.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sale Section */}
      {saleProducts.length > 0 && (
        <section className="section-luxury">
          <div className="luxury-container">
            <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 rounded-[2rem] p-8 md:p-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <p className="text-pink-200 text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Limited Time</p>
                  <h2 className="text-3xl md:text-5xl font-serif text-white">Sale Collection</h2>
                </div>
                <Link to="/shop?filter=sale">
                  <button className="bg-white text-pink-600 hover:bg-pink-50 rounded-full px-8 py-4 font-medium transition-all inline-flex items-center gap-2 group">
                    Shop All Sale
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 stagger-animate">
                {saleProducts.map((product) => (
                  <div key={product.product_id} className="bg-white rounded-2xl p-3 pb-5">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="section-luxury bg-soft-pink" data-testid="testimonials-section">
        <div className="luxury-container">
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Customer Love</p>
            <h2 className="text-3xl md:text-5xl font-serif text-stone-800">What They Say</h2>
            <div className="divider-gold mt-6"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card" data-testid={`testimonial-${index}`}>
                <Quote className="w-8 h-8 text-pink-200 mb-4" fill="currentColor" />
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-stone-600 leading-relaxed mb-6 font-accent text-lg italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                    <span className="text-pink-600 font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{testimonial.name}</p>
                    <p className="text-xs text-stone-500">{testimonial.location}</p>
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
