import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const AUTO_CHECK_MS = 15_000;

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
  const [initialChecked, setInitialChecked] = useState(false);
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
    if (!user?.id) return;
    let alive = true;

    const firstCheck = async () => {
      await checkRelease(false);
      if (alive) setInitialChecked(true);
    };
    void firstCheck();

    const runWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      void checkRelease(false);
    };

    const interval = window.setInterval(runWhenVisible, AUTO_CHECK_MS);
    window.addEventListener("focus", runWhenVisible);
    document.addEventListener("visibilitychange", runWhenVisible);

    const approvalChannel = supabase
      .channel(`accqua-approval-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "accqua_app_approval", filter: `user_id=eq.${user.id}` },
        () => void checkRelease(false),
      )
      .subscribe();

    const accessChannel = supabase
      .channel(`accqua-access-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "accqua_app_access", filter: `student_id=eq.${user.id}` },
        () => void checkRelease(false),
      )
      .subscribe();

    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", runWhenVisible);
      document.removeEventListener("visibilitychange", runWhenVisible);
      void supabase.removeChannel(approvalChannel);
      void supabase.removeChannel(accessChannel);
    };
  }, [checkRelease, user?.id]);

  if (loading || (user && !initialChecked)) return null;
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
