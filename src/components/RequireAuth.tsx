import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth";

interface RequireAuthProps {
  children: ReactNode;
  roles?: UserRole[];
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { isAuthenticated, claims } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !claims) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(claims.role)) {
    const fallback = claims.role === "SuperMan" ? "/superman" : "/";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
