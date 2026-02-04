import { Link } from "react-router-dom";
import { ChevronLeft, ShieldAlert } from "lucide-react";

const RazorpayPolicyPage = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="razorpay-policy-page">
            {/* Breadcrumb */}
            <div className="bg-soft-pink py-4">
                <div className="luxury-container">
                    <Link to="/" className="inline-flex items-center text-stone- stone-500 hover:text-pink-600 transition-colors text-sm">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <div className="luxury-container py-12 md:py-20 max-w-4xl">
                <div className="flex items-center gap-4 mb-8 border-b border-pink-100 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                        <ShieldAlert className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif text-stone-800">
                        Razorpay Payment Policy
                    </h1>
                </div>

                <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed space-y-8">
                    <p className="text-xl text-stone-800 font-medium">
                        At Dubai SR, we strive to provide a seamless shopping experience. For all online transactions, we utilize Razorpay, a secure and trusted payment gateway.
                    </p>

                    <section className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
                        <h3 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
                            Our Responsibility Disclaimer
                        </h3>
                        <p className="mb-0 italic text-stone-700">
                            "Please note that Dubai SR is not responsible for any payments stuck or failed from Razorpay's side. While we ensure that our system integration is robust, issues within the banking network or the payment gateway's infrastructure are beyond our control."
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">What to do if your payment is stuck?</h3>
                        <p className="mb-4 text-stone-600">
                            In the rare event that your money is deducted from your bank account but the order is not confirmed on our website:
                        </p>
                        <ul className="list-disc pl-5 space-y-3">
                            <li>
                                <strong>Check with your Bank:</strong> Most failed transactions result in an automatic refund within 5-7 working days by your bank.
                            </li>
                            <li>
                                <strong>Contact Razorpay Support:</strong> You can reach out to Razorpay directly with your payment ID for a faster resolution.
                            </li>
                            <li>
                                <strong>Notify Us:</strong> Share your transaction screen recording/screenshot with us via WhatsApp or Email, and we will do our best to assist you in tracking the status with the gateway.
                            </li>
                        </ul>
                    </section>

                    <p className="text-sm text-stone-400 mt-12 pt-8 border-t border-stone-100 italic">
                        By proceeding with an online payment on our platform, you acknowledge and agree to this policy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RazorpayPolicyPage;
