import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading, updateRecoveredPassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setChecking(false), user ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, [loading, user?.id]);

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage({ type: "error", text: "A nova senha precisa ter pelo menos 8 caracteres." });
      return;
    }
    if (password !== confirmation) {
      setMessage({ type: "error", text: "As duas senhas precisam ser iguais." });
      return;
    }

    setBusy(true);
    const result = await updateRecoveredPassword(password);
    setBusy(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    setMessage({ type: "success", text: "Senha alterada. Agora entre novamente com sua nova senha." });
    window.setTimeout(async () => {
      await signOut();
      navigate("/login", { replace: true });
    }, 1100);
  };

  const invalidLink = !loading && !checking && !user;

  return (
    <div className="auth-flow-screen">
      <div className="auth-flow-glow" aria-hidden="true" />
      <main className="auth-flow-card">
        <button className="auth-flow-back" type="button" onClick={() => navigate("/login", { replace: true })}>
          <span aria-hidden="true">←</span> Voltar ao login
        </button>
        <div className="auth-flow-logo"><AccquaLogo compact /></div>
        <span className="auth-flow-kicker">NOVA SENHA</span>
        <h1>Crie uma senha nova</h1>

        {loading || checking ? (
          <div className="auth-flow-checking"><span />Validando o link recebido...</div>
        ) : invalidLink ? (
          <div className="auth-flow-invalid">
            <strong>Este link não está mais válido.</strong>
            <p>Solicite um novo e-mail de recuperação para continuar com segurança.</p>
            <button type="button" onClick={() => navigate("/recuperar-senha", { replace: true })}>Enviar outro link</button>
          </div>
        ) : (
          <form className="auth-flow-form" onSubmit={savePassword}>
            <label>
              Nova senha
              <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" />
            </label>
            <label>
              Confirmar nova senha
              <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite a mesma senha" />
            </label>
            {message ? <div className={`auth-flow-message is-${message.type}`}>{message.text}</div> : null}
            <button type="submit" disabled={busy}>{busy ? "Alterando..." : "Salvar nova senha"}</button>
          </form>
        )}
      </main>
    </div>
  );
}
