import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem("medcard_authenticated");
        }
      } catch (error) {
        // If API is unavailable, fall back to localStorage check
        setIsAuthenticated(localStorage.getItem("medcard_authenticated") === "true");
      }
    };

    verifyAuth();
  }, []);

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
