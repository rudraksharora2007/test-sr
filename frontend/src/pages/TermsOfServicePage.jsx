import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const TermsOfServicePage = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="terms-of-service-page">
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
                    Terms of Service
                </h1>

                <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed space-y-8">
                    <p>
                        These Terms of Service (“Terms”) govern your access to and use of the Dubai SR website and services. By using this website, you agree to be bound by these Terms.
                    </p>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">1. Acceptance of Terms</h3>
                        <p>
                            By accessing or using this website, you agree to comply with these Terms and all applicable laws.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">2. Products & Descriptions</h3>
                        <p>
                            We strive to display product colors, embroidery, and details as accurately as possible. Actual appearance may vary due to photography, lighting, or screen settings. All products are subject to availability.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">3. Pricing</h3>
                        <p>
                            All prices are listed in INR. Prices may change without prior notice. Dubai SR reserves the right to correct pricing or listing errors at any time.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">4. Orders</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Orders are confirmed after successful placement and verification.</li>
                            <li>Dubai SR reserves the right to cancel any order due to stock issues, pricing errors, or suspected fraudulent activity.</li>
                            <li>Once an order is confirmed, it cannot be canceled by the customer.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">5. Shipping, Exchange & Replacement</h3>
                        <p className="mb-4">Shipping, exchange, and replacement are governed by our Shipping & Replacement Policy.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Replacement is offered only for damaged or manufacturing defect items with sufficient proof that the issue existed upon arrival.</li>
                            <li>Exchange requests must be raised exclusively via WhatsApp at +91 85953 71004 with full proof within 24 hours of delivery.</li>
                            <li>No exchanges for wrong size ordered.</li>
                            <li>No refunds under any circumstances.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">6. Payments</h3>
                        <p className="mb-4">We use secure third-party payment gateways (e.g., Razorpay) for prepaid orders. Dubai SR does not store card or UPI details. We offer:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>UPI</li>
                            <li>Debit / Credit Cards</li>
                            <li>Cash on Delivery (COD)</li>
                        </ul>
                        <p>
                            Dubai SR reserves the right to restrict COD availability for certain orders or locations.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">7. User Responsibilities</h3>
                        <p className="mb-4">By using this website, you agree:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To provide accurate and complete information</li>
                            <li>Not to misuse the website for unlawful activities</li>
                            <li>Not to attempt to disrupt or compromise website security</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">8. Intellectual Property</h3>
                        <p>
                            All content on this website including images, logo, text, design, and layout is the property of Dubai SR and may not be copied, reproduced, or used without permission.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">9. Limitation of Liability</h3>
                        <p className="mb-4">Dubai SR shall not be liable for:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Delays caused by courier partners or external factors</li>
                            <li>Losses arising from incorrect information provided by users</li>
                            <li>Technical issues beyond reasonable control</li>
                            <li>Minor variations in product appearance</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">10. Privacy</h3>
                        <p>
                            Your use of the website is also governed by our Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">11. Modifications</h3>
                        <p>
                            Dubai SR reserves the right to update or modify these Terms at any time without prior notice. Continued use of the website constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">12. Governing Law</h3>
                        <p>
                            These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of the courts in Delhi, India.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">13. Contact</h3>
                        <p>
                            For any queries related to these Terms, contact us via WhatsApp at +91 85953 71004.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
