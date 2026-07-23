import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function Pending() {
  const { user, loading, landingPath, signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user || landingPath !== "/aguardando") return;

    const checkAccess = () => {
      void refreshProfile();
    };

    const interval = window.setInterval(checkAccess, 4000);
    const handleFocus = () => checkAccess();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkAccess();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [landingPath, refreshProfile, user]);

  const verifyAccess = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/aguardando") return <Navigate to={landingPath} replace />;

  return (
    <div className="state-screen">
      <main className="state-card">
        <AccquaLogo />
        <span className="state-icon">✓</span>
        <h1>Cadastro recebido</h1>
        <p>
          Sua conta está aguardando a liberação da recepção, do professor ou da
          administração. Esta tela verifica a autorização automaticamente.
        </p>
        <button
          className="login-primary-button"
          type="button"
          onClick={() => void verifyAccess()}
          disabled={checking}
        >
          {checking ? "Verificando..." : "Verificar liberação"}
        </button>
        <a
          className="first-access-button"
          href="https://wa.me/551147181730"
          target="_blank"
          rel="noreferrer"
        >
          Falar com a recepção
        </a>
        <button
          className="first-access-button"
          type="button"
          onClick={() => signOut()}
        >
          Voltar ao login
        </button>
      </main>
    </div>
  );
}
