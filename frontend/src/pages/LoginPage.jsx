import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import LuxurySuccessToast from "../components/LuxurySuccessToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect path
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(`${API}/auth/login`, {
                email,
                password
            });

            if (response.data.status === "success") {
                login(response.data.user);
                toast.custom((t) => (
                    <LuxurySuccessToast t={t} title="Welcome Back" message="Signed in successfully! Happy shopping." />
                ), { duration: 5000, unstyled: true });
                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error("Login failed:", error);
            const errorMessage = error.response?.data?.detail || "Invalid email or password. Please try again.";
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Sign In Failed" message={errorMessage} />
            ), { duration: 5000, unstyled: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 px-4">
            <div className="glass-panel w-full max-w-md p-8 md:p-12 rounded-3xl relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 mb-3">Welcome Back</h1>
                        <p className="text-stone-500 font-light">Sign in to access your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-luxury"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-[10px] font-semibold uppercase tracking-widest text-pink-600 hover:text-pink-700 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-luxury"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-luxury-primary mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-luxury border-white border-t-transparent w-5 h-5 mr-2"></span>
                            ) : null}
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-stone-500 text-sm">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-pink-600 font-medium hover:text-pink-700 transition-colors">
                                Create one now
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;
