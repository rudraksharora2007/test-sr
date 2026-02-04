import { toast } from "sonner";
import { X, Check } from "lucide-react";

const LuxurySuccessToast = ({ t, title, message }) => {
    return (
        <div className="relative bg-white rounded-2xl shadow-xl border border-pink-100 p-5 w-full max-w-sm animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto">
            <button
                onClick={() => toast.dismiss(t)}
                className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 pt-0.5">
                    <h4 className="font-serif text-stone-800 text-lg mb-1 font-medium">{title}</h4>
                    <p className="text-sm text-stone-500 font-light leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LuxurySuccessToast;
