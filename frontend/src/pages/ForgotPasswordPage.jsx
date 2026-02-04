import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, CheckCircle, ShieldCheck } from "lucide-react";
import { API } from "../App";
import LuxurySuccessToast from "../components/LuxurySuccessToast";
import LuxuryErrorToast from "../components/LuxuryErrorToast";

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API}/auth/forgot-password`, { email });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Code Sent" message="Please check your email for the verification code." />
            ), { duration: 5000, unstyled: true });
            setStep(2);
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Request Failed" message={error.response?.data?.detail || "Something went wrong. Please try again."} />
            ), { duration: 5000, unstyled: true });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API}/auth/verify-reset-code`, { email, code });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Verified" message="Code verified! Now set your new password." />
            ), { duration: 5000, unstyled: true });
            setStep(3);
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Verification Failed" message={error.response?.data?.detail || "Invalid code. Please try again."} />
            ), { duration: 5000, unstyled: true });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API}/auth/reset-password`, { email, code, new_password: newPassword });
            toast.custom((t) => (
                <LuxurySuccessToast t={t} title="Success" message="Your password has been reset successfully. Please log in." />
            ), { duration: 5000, unstyled: true });
            navigate("/login");
        } catch (error) {
            toast.custom((t) => (
                <LuxuryErrorToast t={t} title="Reset Failed" message={error.response?.data?.detail || "Something went wrong. Please try again."} />
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

                <div className="relative z-10 text-center">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate("/login")}
                        className="absolute -top-4 -left-4 p-2 text-stone-400 hover:text-stone-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="mb-8">
                        {step === 1 && <Mail className="w-12 h-12 text-pink-500 mx-auto mb-4 opacity-80" />}
                        {step === 2 && <ShieldCheck className="w-12 h-12 text-pink-500 mx-auto mb-4 opacity-80" />}
                        {step === 3 && <Lock className="w-12 h-12 text-pink-500 mx-auto mb-4 opacity-80" />}

                        <h1 className="font-serif text-3xl text-stone-800 mb-3">
                            {step === 1 && "Forgot Password"}
                            {step === 2 && "Enter Code"}
                            {step === 3 && "Reset Password"}
                        </h1>
                        <p className="text-stone-500 font-light px-4">
                            {step === 1 && "Enter your email to receive a 6-digit verification code."}
                            {step === 2 && `We've sent a code to ${email}`}
                            {step === 3 && "Enter your new password below."}
                        </p>
                    </div>

                    <form onSubmit={step === 1 ? handleRequestCode : step === 2 ? handleVerifyCode : handleResetPassword} className="space-y-6 text-left">
                        {step === 1 && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-luxury text-center"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-2 text-center">
                                <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Verification Code</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="input-luxury text-center text-2xl tracking-[1em] font-bold"
                                    placeholder="000000"
                                    required
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input-luxury"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-luxury"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="w-full btn-luxury-primary mt-4"
                            disabled={loading}
                        >
                            {loading && <span className="loading-luxury border-white border-t-transparent w-5 h-5 mr-2"></span>}
                            {loading ? "Processing..." : (step === 1 ? "Send Code" : step === 2 ? "Verify Code" : "Reset Password")}
                        </button>
                    </form>

                    {step === 2 && (
                        <button
                            onClick={handleRequestCode}
                            disabled={loading}
                            className="mt-6 text-sm text-stone-400 hover:text-pink-600 transition-colors"
                        >
                            Didn't receive the code? Resend
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
