import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function Pending() {
  const {
    user,
    loading,
    landingPath,
    signOut,
    refreshProfile,
  } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkRelease = useCallback(async () => {
    if (checking) return;
    setChecking(true);

    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  }, [checking, refreshProfile]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshProfile();
    }, 3500);

    const handleFocus = () => {
      void refreshProfile();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshProfile]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/aguardando") {
    return <Navigate to={landingPath} replace />;
  }

  return (
    <div className="state-screen">
      <main className="state-card">
        <AccquaLogo />
        <span className="state-icon">✓</span>
        <h1>Cadastro recebido</h1>
        <p>
          Sua conta está aguardando a liberação da recepção ou do
          professor. Assim que autorizarem, esta tela abrirá o app
          automaticamente.
        </p>

        <button
          className="login-primary-button"
          type="button"
          onClick={() => void checkRelease()}
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
