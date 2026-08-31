import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { landingPath } = useAuth();

  return (
    <main className="state-screen" aria-labelledby="not-found-title">
      <section className="state-card">
        <div className="state-icon" aria-hidden="true">404</div>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p>
          O endereço <strong>{location.pathname}</strong> não existe nesta versão do ACCQUA Sports.
        </p>
        <button
          type="button"
          className="login-primary-button"
          onClick={() => navigate(landingPath, { replace: true })}
        >
          Voltar ao início
        </button>
      </section>
    </main>
  );
}
