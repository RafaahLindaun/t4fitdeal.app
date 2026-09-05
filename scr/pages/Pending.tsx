import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

const AUTO_CHECK_MS = 30_000;

export default function Pending() {
  const {
    user,
    loading,
    profile,
    landingPath,
    signOut,
    refreshProfile,
  } = useAuth();
  const [checking, setChecking] = useState(false);
  const inFlight = useRef(false);

  const checkRelease = useCallback(async (showBusy = true) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (showBusy) setChecking(true);

    try {
      await refreshProfile();
    } finally {
      inFlight.current = false;
      if (showBusy) setChecking(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    const runWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      void checkRelease(false);
    };

    // Uma checagem inicial é suficiente. Antes eram chamadas a cada 2s e podiam
    // se sobrepor quando o banco estava lento, criando uma tempestade de RPCs.
    runWhenVisible();
    const interval = window.setInterval(runWhenVisible, AUTO_CHECK_MS);
    window.addEventListener("focus", runWhenVisible);
    document.addEventListener("visibilitychange", runWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", runWhenVisible);
      document.removeEventListener("visibilitychange", runWhenVisible);
    };
  }, [checkRelease]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/aguardando") {
    return <Navigate to={landingPath} replace />;
  }

  return (
    <div className="state-screen">
      <main className="state-card">
        <AccquaLogo />
        <span className="state-icon">{profile?.status === "blocked" ? "!" : "✓"}</span>
        <h1>
          {profile?.status === "blocked"
            ? "Acesso bloqueado"
            : "Cadastro recebido"}
        </h1>
        <p>
          {profile?.status === "blocked"
            ? "Seu acesso ao aplicativo está bloqueado. Fale com a administração da ACCQUA Sports."
            : "Sua conta está aguardando a liberação de um professor, da administração ou da recepção. Assim que autorizarem, esta tela abrirá o aplicativo automaticamente."}
        </p>

        <button
          className="login-primary-button"
          type="button"
          onClick={() => void checkRelease(true)}
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
