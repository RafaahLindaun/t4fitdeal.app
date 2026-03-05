import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ESSENCIAL: não redirecionar enquanto está carregando
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
