import { Link } from "react-router-dom";
import { ChevronLeft, Phone, ShieldCheck, RefreshCcw, AlertTriangle } from "lucide-react";

const ReturnsPolicyPage = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="returns-policy-page">
            {/* Breadcrumb */}
            <div className="bg-stone-50 py-4 border-b border-stone-100">
                <div className="luxury-container">
                    <Link to="/" className="inline-flex items-center text-stone-500 hover:text-pink-600 transition-colors text-sm font-medium">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <div className="luxury-container py-12 md:py-20 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 text-pink-600 mb-6">
                        <RefreshCcw className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">
                        Returns & Exchanges
                    </h1>
                    <p className="text-stone-500 max-w-2xl mx-auto italic">
                        Our commitment to quality ensures that every piece from Dubai SR meets the highest standards of luxury and craftsmanship.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Core Policy */}
                    <section className="bg-stone-50 rounded-3xl p-8 md:p-12 border border-stone-100">
                        <div className="flex items-start gap-4 mb-6">
                            <ShieldCheck className="w-6 h-6 text-pink-600 mt-1" />
                            <h2 className="text-2xl font-serif text-stone-800">Exchange & Replacement Policy</h2>
                        </div>
                        <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed">
                            <p className="mb-6">
                                We take utmost care in packaging and shipping all products to ensure they reach you in pristine condition. Due to the exclusive nature of our collections, we offer replacements <strong>only</strong> in the following specific cases:
                            </p>
                            <ul className="grid md:grid-cols-2 gap-4 list-none pl-0 mb-8">
                                <li className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-100 text-stone-800 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    Product damaged during transit
                                </li>
                                <li className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-100 text-stone-800 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    Manufacturing defect
                                </li>
                            </ul>

                            <div className="bg-white p-8 rounded-2xl border border-pink-100 shadow-sm mb-8">
                                <h4 className="text-pink-700 font-bold mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> Mandatory Requirements:
                                </h4>
                                <ul className="space-y-3 text-sm md:text-base">
                                    <li>The request must be raised within <strong>24 hours</strong> of delivery.</li>
                                    <li>A complete, unedited <strong>unboxing video</strong> is mandatory as proof.</li>
                                    <li>The product must be unused, unwashed, and in its original condition with all tags intact.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How to initiate */}
                    <section className="px-4">
                        <h3 className="text-xl font-serif text-stone-800 mb-6 flex items-center gap-3">
                            Initiate a Request
                        </h3>
                        <p className="text-stone-600 mb-8">
                            To ensure a swift resolution, all replacement requests must be handled through our dedicated WhatsApp support line. Our team will review your proof and guide you through the process.
                        </p>

                        <a
                            href="https://wa.me/918595371004"
                            className="flex flex-col md:flex-row items-center justify-between p-6 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all shadow-xl group"
                        >
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">WhatsApp Support</p>
                                    <p className="text-xl font-medium">+91 85953 71004</p>
                                </div>
                            </div>
                            <span className="bg-white/10 px-6 py-2 rounded-full text-sm font-bold group-hover:bg-white/20 transition-colors">
                                Message Now
                            </span>
                        </a>
                    </section>

                    {/* Exceptions */}
                    <section className="bg-rose-50 rounded-3xl p-8 md:p-12 border border-rose-100">
                        <h3 className="text-xl font-serif text-stone-800 mb-6">Non-Eligible for Replacement</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white/50 p-6 rounded-2xl border border-rose-200">
                                <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-tight">Size Issues</p>
                                <p className="text-xs text-rose-700">No replacements for incorrect sizes ordered by the customer.</p>
                            </div>
                            <div className="bg-white/50 p-6 rounded-2xl border border-rose-200">
                                <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-tight">Usage Damage</p>
                                <p className="text-xs text-rose-700">Damage caused after delivery or through improper handling/washing.</p>
                            </div>
                            <div className="bg-white/50 p-6 rounded-2xl border border-rose-200">
                                <p className="text-sm font-bold text-rose-800 mb-2 uppercase tracking-tight">Change of Mind</p>
                                <p className="text-xs text-rose-700">We do not offer cancellations or exchanges once an order is confirmed.</p>
                            </div>
                        </div>
                    </section>

                    {/* Refund Disclaimer */}
                    <section className="text-center pb-20">
                        <div className="inline-block p-4 bg-stone-100 rounded-2xl border border-stone-200">
                            <p className="text-stone-800 font-bold text-lg">
                                Refund Policy: <span className="text-rose-600">No refunds are offered under any circumstances.</span>
                            </p>
                        </div>
                        <p className="text-stone-400 text-sm mt-6 max-w-lg mx-auto">
                            Dubai SR reserves the right to approve or reject requests based on quality control verification of the evidence provided.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicyPage;
