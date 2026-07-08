import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({
  children,
  staff = false,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, profile, loading, isStaff, needsOnboarding } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!profile) {
    if (location.pathname === "/aguardando") return children;
    return <Navigate to="/aguardando" replace />;
  }
  if (needsOnboarding && location.pathname !== "/completar-cadastro") {
    return <Navigate to="/completar-cadastro" replace />;
  }
  if (staff && !isStaff) return <Navigate to="/home" replace />;
  if (!isStaff && profile.status !== "active" && location.pathname !== "/aguardando") {
    return <Navigate to="/aguardando" replace />;
  }
  return children;
}
