import { useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    document.body.classList.add('app-page');
    return () => document.body.classList.remove('app-page');
  }, []);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles to their appropriate home page
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "MANAGER") return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/hostels" replace />;
  }

  return <>{children}</>;
}
