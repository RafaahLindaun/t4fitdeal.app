import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function TestMenu() {
  const { user, profile, loading, landingPath, signOut, isTeam } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;

  return (
    <div className="test-menu-screen">
      <main className="test-menu-card">
        <AccquaLogo />
        <span className="test-badge">Login funcionando</span>
        <h1>Olá, {profile?.fullName?.split(" ")[0] || "Aluno"}</h1>
        <p>
          Esta é uma tela temporária para confirmar login, Google, primeiro acesso e permissões.
        </p>
        <div className="test-summary">
          <div><span>Conta</span><strong>{profile?.status ?? "pending"}</strong></div>
          <div><span>Tipo</span><strong>{profile?.role ?? "student"}</strong></div>
          <div><span>Área da equipe</span><strong>{isTeam ? "Liberada" : "Não"}</strong></div>
        </div>
        <div className="test-buttons">
          <button type="button">Treino</button>
          <button type="button">Dieta</button>
          <button type="button">Ranking</button>
          <button type="button">Conta</button>
        </div>
        <button className="first-access-button" type="button" onClick={() => signOut()}>
          Sair da conta
        </button>
      </main>
    </div>
  );
}
