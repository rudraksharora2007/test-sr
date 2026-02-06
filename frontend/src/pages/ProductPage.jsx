import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, Minus, Plus, Truck, Shield, RotateCcw, Heart, Share2, X, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import LuxuryToast from "../components/LuxuryToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";
import { useCart, API, BACKEND_URL, resolveImageUrl, isUnstitchedProduct, hideSizeDisplay } from "../App";

const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart, loading: cartLoading } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Decode the URL-encoded slug
        const decodedSlug = decodeURIComponent(slug);
        const response = await axios.get(`${API}/products/slug/${decodedSlug}`);
        setProduct(response.data);
        const isUnstitched = isUnstitchedProduct(response.data);
        setSelectedSize(isUnstitched ? "Unstitched" : (response.data.sizes?.[0] || "M"));
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Select Size" message="Please select a size before adding to your bag." />
      ), { duration: 3000, unstyled: true });
      return;
    }

    try {
      await addToCart(product.product_id, quantity, selectedSize);

      // Custom Luxury Toast
      toast.custom((t) => (
        <LuxuryToast t={t} product={product} quantity={quantity} size={selectedSize} />
      ), { duration: 5000, unstyled: true });

    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Please try again.";
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Add to Bag Failed" message={errorMessage} />
      ), { duration: 5000, unstyled: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-luxury"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-xl text-stone-600 mb-6 font-serif">Product not found</p>
        <Link to="/shop" className="btn-luxury-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const isUnstitched = isUnstitchedProduct(product);

  const images = product.images?.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"];

  return (
    <div className="min-h-screen bg-white" data-testid="product-page">
      {/* Breadcrumb */}
      <div className="bg-soft-pink py-4">
        <div className="luxury-container">
          <Link to="/shop" className="inline-flex items-center text-stone-500 hover:text-pink-600 transition-colors text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Shop
          </Link>
        </div>
      </div>

      <div className="luxury-container py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-50" data-testid="product-main-image">
              <img
                src={resolveImageUrl(images[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden transition-all ${selectedImage === index
                      ? "ring-2 ring-pink-500 ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                      }`}
                    data-testid={`product-thumbnail-${index}`}
                  >
                    <img src={resolveImageUrl(image)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="py-4 md:py-8">
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {hasDiscount && (
                <span className="badge badge-sale">-{discountPercent}% Off</span>
              )}
              {product.is_new_arrival && (
                <span className="badge badge-new">New Arrival</span>
              )}
            </div>

            {/* Brand */}
            <p className="text-gold text-xs uppercase tracking-[0.2em] mb-2 font-semibold">{product.brand}</p>

            {/* Name */}
            <h1 className="text-2xl md:text-4xl font-serif text-stone-800 mb-6" data-testid="product-name">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8" data-testid="product-price">
              <span className="text-3xl font-semibold text-pink-600">
                ₹{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xl text-stone-400 line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-stone-600 leading-relaxed mb-8" data-testid="product-description">
              {product.description}
            </p>

            {/* Size Selection */}
            {!isUnstitched && (
              <div className="mb-8">
                <label className="text-xs uppercase tracking-[0.15em] text-stone-500 font-semibold mb-4 block">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-xl font-medium transition-all ${selectedSize === size
                        ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                        : "bg-stone-50 text-stone-700 hover:bg-pink-50 hover:text-pink-600 border border-stone-200"
                        }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <label className="text-xs uppercase tracking-[0.15em] text-stone-500 font-semibold mb-4 block">
                Quantity
              </label>
              <div className="flex items-center gap-6">
                <div className="qty-selector-luxury">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    data-testid="quantity-decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span data-testid="quantity-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    data-testid="quantity-increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className={`text-sm ${product.stock <= 5 ? "text-rose-500 font-medium" : "text-stone-500"}`}>
                  {product.stock > 0
                    ? product.stock <= 5
                      ? `Only ${product.stock} left!`
                      : `${product.stock} in stock`
                    : "Out of stock"
                  }
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-4 mb-10">
              <button
                className={`flex-1 btn-luxury-primary py-5 text-base ${product.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || cartLoading}
                data-testid="add-to-cart-btn"
              >
                {cartLoading ? (
                  <span className="loading-luxury"></span>
                ) : product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  "Add to Bag"
                )}
              </button>
              <button className="w-14 h-14 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-pink-600 hover:border-pink-200 transition-all">
                <Heart className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-stone-100">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-5 h-5 text-pink-600" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">Free Shipping<br />Above ₹2,999</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-pink-600" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">Secure<br />Payment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-5 h-5 text-pink-600" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">7-Day<br />Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>



    </div >
  );
};

export default ProductPage;
