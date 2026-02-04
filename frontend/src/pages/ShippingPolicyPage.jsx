import { Link } from "react-router-dom";
import { ChevronLeft, Phone } from "lucide-react";

const ShippingPolicyPage = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="shipping-policy-page">
            {/* Breadcrumb */}
            <div className="bg-soft-pink py-4">
                <div className="luxury-container">
                    <Link to="/" className="inline-flex items-center text-stone-500 hover:text-pink-600 transition-colors text-sm">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <div className="luxury-container py-12 md:py-20 max-w-4xl">
                <h1 className="text-3xl md:text-5xl font-serif text-stone-800 mb-8 border-b border-pink-100 pb-6">
                    Shipping, Exchange & Replacement Policy
                </h1>

                <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed space-y-8">
                    <p className="font-medium text-lg">
                        We take utmost care in packaging and shipping all products to ensure they reach you in good condition.
                    </p>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Shipping</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Orders are processed after successful payment confirmation.</li>
                            <li>Delivery timelines are indicative and may vary based on location, courier partner, or unforeseen circumstances.</li>
                            <li>Once shipped, tracking details will be shared via email and/or SMS.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Exchanges & Replacements</h3>
                        <p className="mb-4">We offer replacement <strong>only</strong> in the following cases:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>Product damaged during transit</li>
                            <li>Manufacturing defect</li>
                        </ul>

                        <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 mb-6">
                            <p className="font-medium text-stone-800 mb-2">How to Request:</p>
                            <p className="flex items-center gap-2">
                                All exchange or replacement requests must be raised <strong>exclusively via WhatsApp</strong> at:
                                <a href="https://wa.me/918595371004" className="inline-flex items-center gap-1 text-pink-700 font-bold hover:underline">
                                    <Phone className="w-4 h-4" /> +91 85953 71004
                                </a>
                            </p>
                        </div>

                        <p className="font-medium mb-2">To be eligible for replacement:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>The request must be made within <strong>24 hours</strong> of delivery.</li>
                            <li>Clear and complete proof must be provided, including <strong>unboxing video</strong> and product images, demonstrating that the product was damaged upon arrival.</li>
                            <li>The product must be unused, unwashed, and in original condition with tags intact.</li>
                            <li>Replacement requests are subject to verification and approval by our quality control team.</li>
                            <li>Dubai SR is obligated to replace the product only if sufficient evidence confirms that the damage existed at the time of delivery.</li>
                            <li>In case the same product is unavailable, an alternative product of similar value may be offered at our discretion.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Non-Eligible Cases</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>No replacement or exchange for incorrect size ordered by the customer.</li>
                            <li>No replacement for damage caused after delivery, wear and tear, or improper handling.</li>
                            <li>No cancellations once the order is confirmed.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Refunds</h3>
                        <p className="font-medium text-rose-600">
                            No refunds are offered under any circumstances.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicyPage;
