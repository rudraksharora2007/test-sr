import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-white" data-testid="privacy-policy-page">
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
                    Privacy Policy
                </h1>

                <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed space-y-8">
                    <p>
                        We value your privacy and are committed to protecting your personal information in compliance with the Information Technology Act, 2000 (India) and internationally accepted data protection principles.
                    </p>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Information Collection</h3>
                        <p className="mb-4">We may collect personal information including:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>Name</li>
                            <li>Phone number</li>
                            <li>Email address</li>
                            <li>Shipping and billing address</li>
                            <li>Order and transaction details</li>
                        </ul>
                        <p>
                            This information is collected solely for order processing, delivery, customer communication, and operational purposes.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Data Storage & Sharing</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>All user data is stored securely on our servers using reasonable security safeguards.</li>
                            <li>We do not sell, rent, or misuse customer data.</li>
                            <li>Information may be shared only with essential service providers such as payment gateways and courier partners for order fulfillment.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">User Responsibility & Limitation of Liability</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>By using our website, you voluntarily provide personal information and consent to its use.</li>
                            <li>You are responsible for the accuracy of the information provided.</li>
                            <li>Dubai SR shall not be liable for any loss, misuse, or consequences arising from:
                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                    <li>Incorrect or incomplete information submitted by the user</li>
                                    <li>Unauthorized access beyond reasonable security measures</li>
                                    <li>Circumstances beyond our reasonable control</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Data Rights</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Users may request access, correction, or deletion of their personal data.</li>
                            <li>Data will be retained only as long as required for legal, business, or operational purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-serif text-stone-800 mb-4">Policy Updates</h3>
                        <p>
                            We reserve the right to amend this policy at any time. Changes will be effective immediately upon being posted on the website.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
