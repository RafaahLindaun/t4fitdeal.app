import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 7000);
    return () => window.clearTimeout(timer);
  }, []);

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get("error_description") || params.get("error");

  if (oauthError) {
    return (
      <div className="auth-flow-screen">
        <main className="auth-flow-card auth-callback-error">
          <span className="auth-flow-kicker">LOGIN GOOGLE</span>
          <h1>Não foi possível entrar</h1>
          <p>{decodeURIComponent(oauthError)}</p>
          <button type="button" onClick={() => navigate("/login", { replace: true })}>Voltar ao login</button>
        </main>
      </div>
    );
  }

  if (!loading && user) return <Navigate to={landingPath} replace />;
  if (timedOut && !user) {
    return (
      <div className="auth-flow-screen">
        <main className="auth-flow-card auth-callback-error">
          <span className="auth-flow-kicker">LOGIN GOOGLE</span>
          <h1>O acesso não foi concluído</h1>
          <p>Tente entrar novamente e escolha a conta Google vinculada ao seu cadastro ACCQUA.</p>
          <button type="button" onClick={() => navigate("/login", { replace: true })}>Tentar novamente</button>
        </main>
      </div>
    );
  }

  return <LoadingSplash />;
}
