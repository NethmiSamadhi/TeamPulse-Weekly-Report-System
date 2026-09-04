import {
  type ReactNode,
} from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  type UserRole,
} from "../types";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    user,
    isLoading,
  } = useAuth();

  const location = useLocation();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        <p>Loading TeamPulse...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
           />
    );
  }

  return children;
}