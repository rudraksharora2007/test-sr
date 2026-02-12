import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Truck, Shield, RotateCcw, Sparkles, Star, Quote } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { API, BACKEND_URL, resolveImageUrl } from "../App";

/* Hero Slider Logic */
const heroSlides = [
  {
    id: 1,
    image: "/images/hero/hero-1.jpg",
    title: "Elegance in",
    subtitle: "Every Thread",
    description: "Discover our exquisite collection of Premium Imported MiddleEastern Wear. Curated for women who appreciate timeless beauty and modern elegance."
  },
  {
    id: 2,
    image: "/images/hero/hero-2.jpg",
    title: "Timeless",
    subtitle: "Sophistication",
    description: "Experience the perfect blend of tradition and contemporary style with our latest arrivals."
  },
  {
    id: 3,
    image: "/images/hero/hero-3.jpg",
    title: "Graceful",
    subtitle: "Drape",
    description: "Embrace the flow of our premium fabrics, designed to make you feel as beautiful as you look."
  },
  {
    id: 4,
    image: "/images/hero/hero-4.jpg",
    title: "Signature",
    subtitle: "Style",
    description: "Make a statement with our exclusive designer pieces, crafted for the modern woman."
  },
  {
    id: 5,
    image: "/images/hero/hero-5.jpg",
    title: "Pure",
    subtitle: "Luxury",
    description: "Indulge in the finest materials and intricate details that define true luxury."
  },
  {
    id: 6,
    image: "/images/hero/hero-6.jpg",
    title: "Modern",
    subtitle: "Tradition",
    description: "Where heritage meets contemporary fashion. Discover the new era of ethnic wear."
  }
];

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



  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
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
        description="Discover Dubai SR's exquisite collection of Premium Imported MiddleEastern Wear. Shop authentic designer suits, lehengas, and traditional wear with free shipping across India."
        keywords="luxury ethnic wear, designer suits, Indian traditional wear, premium lehenga, Maria B suits, Dubai SR boutique"
        image={heroSlides[0].image}
        structuredData={organizationSchema}
      />

      {/* Hero Section - Dynamic Slider */}
      <section className="relative h-[60vh] md:h-[80vh] min-h-[500px] overflow-hidden group" data-testid="hero-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
              <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}>
                <p className="text-gold-light text-[10px] md:text-sm uppercase tracking-[0.3em] mb-4 font-medium animate-fade-in">
                  New Collection {new Date().getFullYear()}
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium mb-6 leading-tight text-white drop-shadow-lg">
                  {slide.title}<br />
                  <span className="font-accent italic text-gold-light">{slide.subtitle}</span>
                </h1>
                <p className="text-white/90 text-sm md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full px-4 sm:px-0">
                  <Link to="/shop" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-white text-stone-900 border border-white hover:bg-stone-100 px-8 py-4 text-sm uppercase tracking-wider font-medium transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2" data-testid="shop-collection-btn">
                      Shop Collection
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link to="/shop?filter=new" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-transparent text-white border border-white hover:bg-white/10 px-8 py-4 text-sm uppercase tracking-wider font-medium transition-all duration-300 transform hover:-translate-y-1" data-testid="new-arrivals-btn">
                      New Arrivals
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-stone-900 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label="Previous Slide"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-stone-900 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label="Next Slide"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-gold w-8" : "bg-white/50 hover:bg-white"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
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
                    src={resolveImageUrl(category.image_url, "/images/hero/hero-collection.jpg")}
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
                  src="/images/our-story.jpg?v=2"
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
