import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, Minus, Plus, Truck, Shield, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useCart, API } from "../App";

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
        const response = await axios.get(`${API}/products/slug/${slug}`);
        setProduct(response.data);
        setSelectedSize(response.data.sizes?.[0] || "M");
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
      toast.error("Please select a size");
      return;
    }
    
    try {
      await addToCart(product.product_id, quantity, selectedSize);
      toast.success("Added to cart!", {
        description: `${product.name} (${selectedSize}) has been added to your cart.`
      });
    } catch (error) {
      toast.error("Failed to add to cart", {
        description: error.response?.data?.detail || "Please try again"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-gray-600 mb-4">Product not found</p>
        <Link to="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
    : 0;

  const images = product.images?.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"];

  return (
    <div className="min-h-screen bg-white" data-testid="product-page">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="section-container">
          <Link to="/shop" className="inline-flex items-center text-gray-600 hover:text-pink-700 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Shop
          </Link>
        </div>
      </div>

      <div className="section-container py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden bg-gray-100" data-testid="product-main-image">
              <img 
                src={images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-pink-700" : "border-transparent"
                    }`}
                    data-testid={`product-thumbnail-${index}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              {hasDiscount && (
                <Badge className="badge-sale">-{discountPercent}% Off</Badge>
              )}
              {product.is_new_arrival && (
                <Badge className="badge-new">New Arrival</Badge>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <Badge className="badge-low-stock">Only {product.stock} left</Badge>
              )}
            </div>

            {/* Brand & Name */}
            <div>
              <p className="text-pink-700 uppercase tracking-wider text-sm mb-2">{product.brand}</p>
              <h1 className="text-2xl md:text-3xl font-serif" data-testid="product-name">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3" data-testid="product-price">
              <span className="text-3xl font-semibold text-pink-700">
                ₹{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xl price-strike">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {/* Size Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md transition-all ${
                      selectedSize === size
                        ? "border-pink-700 bg-pink-50 text-pink-700"
                        : "border-gray-300 hover:border-pink-300"
                    }`}
                    data-testid={`size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-3">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    data-testid="quantity-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 min-w-[50px] text-center" data-testid="quantity-value">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    data-testid="quantity-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              className="w-full btn-primary py-6 text-lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || cartLoading}
              data-testid="add-to-cart-btn"
            >
              {cartLoading ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-pink-700 mb-2" />
                <p className="text-xs text-gray-600">Free Shipping<br />Above ₹2999</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-pink-700 mb-2" />
                <p className="text-xs text-gray-600">Secure<br />Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto text-pink-700 mb-2" />
                <p className="text-xs text-gray-600">7-Day<br />Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
