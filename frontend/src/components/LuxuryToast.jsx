import { toast } from "sonner";
import { X, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { hideSizeDisplay } from "../App";

const LuxuryToast = ({ t, product, quantity = 1, size = "M" }) => {
    const image = product.images?.[0] || "https://images.unsplash.com/photo-1756483517695-d0aa21ee1ea1";

    return (
        <div className="relative bg-white rounded-2xl shadow-xl border border-pink-100 p-4 w-full max-w-sm animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto">
            <button
                onClick={() => toast.dismiss(t)}
                className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex gap-4">
                <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 shadow-sm">
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <ShoppingBag className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Added to Bag</p>
                    </div>
                    <h4 className="font-serif text-stone-800 text-sm line-clamp-1 mb-1 font-medium">{product.name}</h4>
                    <p className="text-xs text-stone-500 mb-3">
                        {!hideSizeDisplay(size) && (
                            <>Size: <span className="font-semibold text-stone-700">{size}</span> • </>
                        )}
                        Qty: <span className="font-semibold text-stone-700">{quantity}</span>
                    </p>
                    <div className="flex gap-2">
                        <Link
                            to="/cart"
                            onClick={() => toast.dismiss(t)}
                            className="flex-1 bg-stone-100 text-stone-800 text-xs font-semibold py-2.5 rounded-xl text-center hover:bg-stone-200 transition-colors border border-stone-200"
                        >
                            View Bag
                        </Link>
                        <Link
                            to="/checkout"
                            onClick={() => toast.dismiss(t)}
                            className="flex-1 bg-pink-600 text-white text-xs font-semibold py-2.5 rounded-xl text-center hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                        >
                            Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LuxuryToast;
