import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function Pending() {
  const { user, loading, landingPath, signOut } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/aguardando") return <Navigate to={landingPath} replace />;

  return (
    <div className="state-screen">
      <main className="state-card">
        <AccquaLogo />
        <span className="state-icon">✓</span>
        <h1>Cadastro recebido</h1>
        <p>Sua conta está aguardando a liberação da recepção ou do professor.</p>
        <a className="login-primary-button" href="https://wa.me/551147181730" target="_blank" rel="noreferrer">Falar com a recepção</a>
        <button className="first-access-button" type="button" onClick={() => signOut()}>Voltar ao login</button>
      </main>
    </div>
  );
}
