import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../App";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          navigate("/admin/login");
          return;
        }

        // Exchange session_id for session token
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        if (response.data.status === "success") {
          login(response.data.user);
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
          navigate("/admin", { state: { user: response.data.user } });
        } else {
          navigate("/admin/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/admin/login");
      }
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
