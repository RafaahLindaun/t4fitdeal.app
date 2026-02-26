// ✅ COLE EM: src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  // ✅ enquanto reidrata sessão, não decide nada
  if (!ready) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
