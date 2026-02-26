import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // enquanto valida o login, não redireciona
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontWeight: 900,
        }}
      >
        Carregando…
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
}
