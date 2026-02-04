import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import LuxurySuccessToast from "../components/LuxurySuccessToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Password Mismatch" message="Passwords do not match. Please try again." />
            ), { duration: 5000, unstyled: true });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API}/auth/register`, {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (response.data.status === "success") {
                login(response.data.user);

                toast.custom((t) => (
                    <LuxurySuccessToast
                        t={t}
                        title="Welcome to Dubai SR"
                        message="Your account has been created successfully. Enjoy your shopping!"
                    />
                ), { duration: 5000, unstyled: true });

                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error("Signup failed:", error);
            const errorMessage = error.response?.data?.detail || "Registration failed. Please try again.";
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Registration Failed" message={errorMessage} />
            ), { duration: 5000, unstyled: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 px-4">
            <div className="glass-panel w-full max-w-md p-8 md:p-12 rounded-3xl relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 mb-3">Create Account</h1>
                        <p className="text-stone-500 font-light">Join Dubai SR for exclusive benefits</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-luxury"
                                placeholder="Jane Doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-luxury"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-luxury"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-luxury"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-luxury-primary mt-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-luxury border-white border-t-transparent w-5 h-5 mr-2"></span>
                            ) : null}
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-stone-500 text-sm">
                            Already have an account?{" "}
                            <Link to="/login" className="text-pink-600 font-medium hover:text-pink-700 transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
