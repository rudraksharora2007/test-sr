import { Link } from "react-router-dom";
import { toast } from "sonner";
import LuxuryToast from "./LuxuryToast";
import LuxuryErrorToast from "./LuxuryErrorToast";
import { ShoppingBag } from "lucide-react";
import { useCart, BACKEND_URL, resolveImageUrl, isUnstitchedProduct } from "../App";

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
      const sizeToAdd = isUnstitchedProduct(product) ? "Unstitched" : (product.sizes?.[0] || "M");
      await addToCart(product.product_id, 1, sizeToAdd);
      toast.custom((t) => (
        <LuxuryToast t={t} product={product} quantity={1} size={sizeToAdd} />
      ), { duration: 5000, unstyled: true });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Please try again.";
      toast.custom((t) => (
        <LuxuryErrorToast t={t} title="Error" message={errorMessage} />
      ), { duration: 5000, unstyled: true });
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="product-card-luxury"
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Image Container */}
      <div className="image-container">
        <img
          src={resolveImageUrl(product.images?.[0], "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1?crop=entropy&cs=srgb&fm=jpg&q=85")}
          alt={product.name}
          loading="lazy"
          className="transition-transform duration-700"
        />


        {/* Badges - Left Side */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {hasDiscount && (
            <span className="badge badge-sale" data-testid="sale-badge">
              -{discountPercent}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="badge badge-new" data-testid="new-badge">
              New
            </span>
          )}
        </div>

        {/* Low Stock Badge - Right Side */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-4 right-4 z-10">
            <span className="badge badge-low whitespace-nowrap" data-testid="low-stock-badge">
              {product.stock} left
            </span>
          </div>
        )}

        {/* Quick Add Button */}
        {product.stock > 0 ? (
          <button
            className="quick-add"
            onClick={handleAddToCart}
            disabled={loading}
            data-testid={`quick-add-${product.product_id}`}
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            {loading ? "Adding..." : "Quick Add"}
          </button>
        ) : (
          <div className="quick-add bg-stone-100 text-stone-500">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1.5 font-medium">
          {product.brand}
        </p>
        <h3 className="font-serif text-stone-800 text-base md:text-lg mb-2 line-clamp-2 leading-snug group-hover:text-pink-700 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2.5">
          <span className="price-current">
            ₹{displayPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="price-original">
              ₹{product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
