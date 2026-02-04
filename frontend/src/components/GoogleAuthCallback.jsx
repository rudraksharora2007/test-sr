/**
 * GoogleAuthCallback - Secure OAuth Flow
 * 
 * This component simply redirects to the backend OAuth endpoint.
 * The backend handles ALL OAuth logic including:
 * - State token generation (CSRF protection)
 * - Code exchange with Google
 * - Session creation
 * - HTTP-only cookie setting
 * - Redirect back to frontend
 * 
 * NO TOKENS ARE EVER EXPOSED TO JAVASCRIPT
 */
import { useEffect } from 'react';

const GoogleAuthCallback = () => {
    useEffect(() => {
        // Redirect to backend OAuth login endpoint
        // Backend will handle the entire OAuth flow securely
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        window.location.href = `${API_URL}/auth/google/login`;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-pink-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-700 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Redirecting to Google...</p>
            </div>
        </div>
    );
};

export default GoogleAuthCallback;
