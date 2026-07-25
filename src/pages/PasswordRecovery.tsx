import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const sendRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    const result = await resetPassword(email);
    setBusy(false);
    setMessage({
      type: result.error ? "error" : "success",
      text: result.error ?? result.message ?? "",
    });
  };

  return (
    <div className="auth-flow-screen">
      <div className="auth-flow-glow" aria-hidden="true" />
      <main className="auth-flow-card">
        <button className="auth-flow-back" type="button" onClick={() => navigate("/login", { replace: true })}>
          <span aria-hidden="true">←</span> Voltar ao login
        </button>
        <div className="auth-flow-logo"><AccquaLogo compact /></div>
        <span className="auth-flow-kicker">RECUPERAÇÃO DE ACESSO</span>
        <h1>Esqueceu sua senha?</h1>
        <p>Digite o e-mail cadastrado. Enviaremos um link exclusivo para você criar uma nova senha.</p>

        <form className="auth-flow-form" onSubmit={sendRecovery}>
          <label>
            E-mail cadastrado
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              required
            />
          </label>
          {message ? <div className={`auth-flow-message is-${message.type}`}>{message.text}</div> : null}
          <button type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar link de recuperação"}</button>
        </form>

        <small>Abra o link no mesmo navegador deste aparelho. O aplicativo levará você diretamente para a tela de nova senha.</small>
      </main>
    </div>
  );
}
