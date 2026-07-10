import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import {
  AppleIcon,
  CalendarIcon,
  ChartIcon,
  DumbbellIcon,
  EyeIcon,
  HeadsetIcon,
  LockIcon,
  UserIcon,
} from "../components/Icons";
import { useAuth, type FirstAccessInput } from "../auth/AuthProvider";

const WHATSAPP =
  "https://wa.me/551147181730?text=Olá,%20preciso%20de%20ajuda%20para%20acessar%20o%20app%20da%20Accqua%20Sports.";

const initialForm: FirstAccessInput = {
  fullName: "",
  cpf: "",
  email: "",
  password: "",
  phone: "",
  emergencyPhone: "",
  birthDate: "",
  objective: "Hipertrofia",
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.31v2.77h3.56c2.09-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.85Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.85C6.7 7.31 9.13 5.38 12 5.38Z"/>
    </svg>
  );
}

export default function Login() {
  const {
    user,
    loading,
    landingPath,
    signIn,
    signInWithGoogle,
    signUpFirstAccess,
    resetPassword,
  } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [register, setRegister] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const registerValid = useMemo(
    () =>
      Boolean(
        register.fullName.trim() &&
          register.cpf.trim() &&
          register.email.includes("@") &&
          register.password.length >= 6 &&
          register.phone.trim() &&
          register.emergencyPhone.trim(),
      ),
    [register],
  );

  if (!loading && user) return <Navigate to={landingPath} replace />;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (!identifier.trim() || !password) {
      setFeedback({ type: "error", text: "Preencha o acesso e a senha." });
      return;
    }
    setBusy(true);
    const result = await signIn(identifier, password);
    setBusy(false);
    if (result.error) setFeedback({ type: "error", text: result.error });
  };

  const handleGoogle = async () => {
    setFeedback(null);
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.error) setFeedback({ type: "error", text: result.error });
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (!registerValid) {
      setFeedback({ type: "error", text: "Preencha todos os dados obrigatórios." });
      return;
    }
    setBusy(true);
    const result = await signUpFirstAccess(register);
    setBusy(false);
    if (result.error) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    setRegisterOpen(false);
    setRegister(initialForm);
    setFeedback({ type: "success", text: result.message ?? "Cadastro enviado." });
  };

  const handleReset = async () => {
    const email = identifier.includes("@") ? identifier : "";
    const result = await resetPassword(email);
    setFeedback({
      type: result.error ? "error" : "success",
      text: result.error ?? result.message ?? "",
    });
  };

  return (
    <div className="login-screen">
      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <main className="login-content">
        <AccquaLogo />

        <section className="login-intro">
          <h1>
            Bem-vindo ao app<br />
            da <span>Accqua Sports</span>
          </h1>
          <p>Treinos, evolução, aulas e orientações em um só lugar.</p>
        </section>

        <section className="access-banner">
          <div className="access-banner-icon"><LockIcon size={27} /></div>
          <div>
            <strong>Acesso exclusivo para alunos matriculados</strong>
            <span>Seu acesso é liberado conforme sua matrícula ativa na academia.</span>
          </div>
        </section>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-field">
            <UserIcon size={23} />
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="CPF, e-mail ou telefone"
              autoComplete="username"
              inputMode="email"
            />
          </label>

          <label className="login-field">
            <LockIcon size={22} />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              <EyeIcon size={22} />
            </button>
          </label>

          <button className="forgot-button" type="button" onClick={handleReset}>
            Esqueci minha senha
          </button>

          {feedback ? (
            <div className={`login-feedback ${feedback.type}`}>{feedback.text}</div>
          ) : null}

          <button className="login-primary-button" disabled={busy} type="submit">
            {busy ? "Entrando..." : "Entrar"}
          </button>

          <button className="google-button" disabled={busy} type="button" onClick={handleGoogle}>
            <GoogleMark />
            Continuar com Google
          </button>

          <button className="first-access-button" type="button" onClick={() => setRegisterOpen(true)}>
            Primeiro acesso
          </button>
        </form>

        <div className="features-title"><span />No app, você pode:<span /></div>
        <section className="feature-grid">
          <article><DumbbellIcon /><strong>Treino</strong><small>Acompanhe seu treino.</small></article>
          <article><AppleIcon /><strong>Dieta</strong><small>Veja seu plano alimentar.</small></article>
          <article><CalendarIcon /><strong>Aulas</strong><small>Confira os horários.</small></article>
          <article><ChartIcon /><strong>Evolução</strong><small>Acompanhe resultados.</small></article>
        </section>

        <a className="reception-link" href={WHATSAPP} target="_blank" rel="noreferrer">
          <HeadsetIcon size={21} />
          Problemas para acessar? <strong>Fale com a recepção.</strong>
        </a>
      </main>

      {registerOpen ? (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Primeiro acesso">
          <button className="sheet-backdrop" type="button" onClick={() => setRegisterOpen(false)} aria-label="Fechar" />
          <section className="register-sheet">
            <div className="sheet-handle" />
            <header>
              <div>
                <h2>Primeiro acesso</h2>
                <p>Preencha os dados para a recepção liberar sua conta.</p>
              </div>
              <button type="button" onClick={() => setRegisterOpen(false)}>×</button>
            </header>

            <form className="register-form" onSubmit={handleRegister}>
              <label>Nome completo<input value={register.fullName} onChange={(e) => setRegister({ ...register, fullName: e.target.value })} placeholder="Seu nome" /></label>
              <div className="register-two-columns">
                <label>CPF<input value={register.cpf} onChange={(e) => setRegister({ ...register, cpf: e.target.value })} placeholder="000.000.000-00" inputMode="numeric" /></label>
                <label>Nascimento<input value={register.birthDate} onChange={(e) => setRegister({ ...register, birthDate: e.target.value })} type="date" /></label>
              </div>
              <label>E-mail<input value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} placeholder="voce@email.com" type="email" /></label>
              <label>Senha<input value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} placeholder="Mínimo de 6 caracteres" type="password" /></label>
              <div className="register-two-columns">
                <label>Telefone<input value={register.phone} onChange={(e) => setRegister({ ...register, phone: e.target.value })} placeholder="(11) 99999-9999" inputMode="tel" /></label>
                <label>Emergência<input value={register.emergencyPhone} onChange={(e) => setRegister({ ...register, emergencyPhone: e.target.value })} placeholder="(11) 99999-9999" inputMode="tel" /></label>
              </div>
              <label>Objetivo
                <select value={register.objective} onChange={(e) => setRegister({ ...register, objective: e.target.value })}>
                  <option>Hipertrofia</option>
                  <option>Emagrecimento</option>
                  <option>Condicionamento</option>
                  <option>Saúde e qualidade de vida</option>
                </select>
              </label>
              <div className="register-note">
                Alunos ficam aguardando liberação. E-mails terminados em <strong>@professor.com</strong> seguem a lógica de professor já configurada no Supabase.
              </div>
              {feedback ? (
                <div className={`login-feedback ${feedback.type}`}>{feedback.text}</div>
              ) : null}
              <button className="login-primary-button" disabled={busy || !registerValid} type="submit">
                {busy ? "Enviando..." : "Enviar cadastro"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
