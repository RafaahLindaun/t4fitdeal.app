import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children, teamOnly = false }: { children: ReactNode; teamOnly?: boolean }) {
  const { user, loading, profile, isTeam } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (teamOnly && !isTeam) return <Navigate to="/home" replace />;

  if (profile && profile.status !== "active" && !isTeam) {
    return (
      <div className="pending-page">
        <div className="pending-card">
          <h2>Acesso aguardando liberação</h2>
          <p>
            Seu cadastro já foi recebido. Agora a recepção ou o professor precisa liberar sua conta para o app funcionar.
          </p>
          <a className="primary-btn" href="https://wa.me/551147181730" target="_blank" rel="noreferrer">Falar com a recepção</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
