import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const ProductCard = ({ product }) => {
  const { addToCart, loading } = useCart();
  
  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.product_id, 1, "M");
      toast.success("Added to cart!", {
        description: `${product.name} has been added to your cart.`
      });
    } catch (error) {
      toast.error("Failed to add to cart", {
        description: error.response?.data?.detail || "Please try again"
      });
    }
  };

  return (
    <Link 
      to={`/product/${product.slug}`} 
      className="product-card group"
      data-testid={`product-card-${product.product_id}`}
    >
      <div className="product-card-image">
        <img 
          src={product.images?.[0] || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85"} 
          alt={product.name}
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <Badge className="badge-sale" data-testid="sale-badge">
              -{discountPercent}%
            </Badge>
          )}
          {product.is_new_arrival && (
            <Badge className="badge-new" data-testid="new-badge">
              New
            </Badge>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <Badge className="badge-low-stock" data-testid="low-stock-badge">
              Only {product.stock} left
            </Badge>
          )}
        </div>

        {/* Quick Add Button */}
        {product.stock > 0 && (
          <button 
            className="quick-add-btn"
            onClick={handleAddToCart}
            disabled={loading}
            data-testid={`quick-add-${product.product_id}`}
          >
            {loading ? "Adding..." : "Add to Cart"}
          </button>
        )}
        
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.brand}</p>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-700 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-pink-700">
            ₹{displayPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm price-strike">
              ₹{product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
