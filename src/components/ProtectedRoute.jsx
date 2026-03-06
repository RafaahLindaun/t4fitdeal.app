import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ✅ Se já existe user, NÃO bloqueia a UI durante loading (evita travar ao salvar perfil)
  if (loading && user) return children;

  // ✅ Se está carregando e ainda não sabemos se tem user
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
