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
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.31v2.77h3.56c2.09-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.85Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.85C6.7 7.31 9.13 5.38 12 5.38Z"/>
    </svg>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
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
  const [registerStep, setRegisterStep] = useState(0);
  const [register, setRegister] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [registerFeedback, setRegisterFeedback] = useState("");

  const stepValid = useMemo(() => {
    if (registerStep === 0) {
      return Boolean(
        register.fullName.trim().length >= 3 &&
          onlyDigits(register.cpf).length === 11 &&
          register.birthDate,
      );
    }
    if (registerStep === 1) {
      return Boolean(
        register.email.includes("@") &&
          onlyDigits(register.phone).length >= 10 &&
          onlyDigits(register.emergencyPhone).length >= 10,
      );
    }
    if (registerStep === 2) {
      return Boolean(register.objective && register.password.length >= 6);
    }
    return true;
  }, [register, registerStep]);

  if (!loading && user) return <Navigate to={landingPath} replace />;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!identifier.trim() || !password) {
      setFeedback({ type: "error", text: "Preencha seu acesso e sua senha." });
      return;
    }

    setBusy(true);
    const result = await signIn(identifier, password);
    setBusy(false);

    if (result.error) {
      setFeedback({ type: "error", text: result.error });
    }
  };

  const handleGoogle = async () => {
    setFeedback(null);
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);

    if (result.error) {
      setFeedback({ type: "error", text: result.error });
    }
  };

  const handleReset = async () => {
    const email = identifier.includes("@") ? identifier : "";
    const result = await resetPassword(email);
    setFeedback({
      type: result.error ? "error" : "success",
      text: result.error ?? result.message ?? "",
    });
  };

  const openRegister = () => {
    setRegisterFeedback("");
    setRegisterStep(0);
    setRegisterOpen(true);
  };

  const closeRegister = () => {
    if (busy) return;
    setRegisterOpen(false);
    setRegisterFeedback("");
  };

  const nextRegisterStep = () => {
    setRegisterFeedback("");

    if (!stepValid) {
      setRegisterFeedback("Complete os campos desta etapa para continuar.");
      return;
    }

    setRegisterStep((current) => Math.min(3, current + 1));
  };

  const previousRegisterStep = () => {
    setRegisterFeedback("");
    setRegisterStep((current) => Math.max(0, current - 1));
  };

  const handleRegister = async () => {
    setRegisterFeedback("");
    setBusy(true);

    const result = await signUpFirstAccess(register);
    setBusy(false);

    if (result.error) {
      setRegisterFeedback(result.error);
      return;
    }

    setRegisterOpen(false);
    setRegisterStep(0);
    setRegister(initialForm);
    setFeedback({
      type: "success",
      text: result.message ?? "Cadastro enviado para liberação.",
    });
  };

  return (
    <div className="login-screen">
      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <main className="login-content">
        <AccquaLogo compact />

        <section className="login-intro">
          <h1>
            Bem-vindo ao app<br />
            da <span>Accqua Sports</span>
          </h1>
          <p>Treinos, evolução, aulas e orientações em um só lugar.</p>
        </section>

        <section className="access-banner">
          <div className="access-banner-icon">
            <LockIcon size={24} />
          </div>
          <div>
            <strong>Acesso exclusivo para alunos matriculados</strong>
            <span>Liberação conforme sua matrícula ativa.</span>
          </div>
        </section>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-field">
            <UserIcon size={21} />
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="CPF, e-mail ou telefone"
              autoComplete="username"
            />
          </label>

          <label className="login-field">
            <LockIcon size={20} />
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
              <EyeIcon size={21} />
            </button>
          </label>

          <button className="forgot-button" type="button" onClick={handleReset}>
            Esqueci minha senha
          </button>

          {feedback ? (
            <div className={`login-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          ) : null}

          <button className="login-primary-button" disabled={busy} type="submit">
            {busy ? "Entrando..." : "Entrar"}
          </button>

          <div className="login-secondary-actions">
            <button
              className="google-button"
              disabled={busy}
              type="button"
              onClick={handleGoogle}
            >
              <GoogleMark />
              Google
            </button>

            <button
              className="first-access-button"
              type="button"
              onClick={openRegister}
            >
              Primeiro acesso
            </button>
          </div>
        </form>

        <section className="feature-grid" aria-label="Recursos do aplicativo">
          <article>
            <DumbbellIcon />
            <strong>Treino</strong>
          </article>
          <article>
            <AppleIcon />
            <strong>Dieta</strong>
          </article>
          <article>
            <CalendarIcon />
            <strong>Aulas</strong>
          </article>
          <article>
            <ChartIcon />
            <strong>Evolução</strong>
          </article>
        </section>

        <a
          className="reception-link"
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
        >
          <HeadsetIcon size={19} />
          Problemas para acessar? <strong>Fale com a recepção.</strong>
        </a>
      </main>

      {registerOpen ? (
        <div
          className="onboarding-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Primeiro acesso"
        >
          <section className="onboarding-card">
            <header className="onboarding-header">
              <button
                className="onboarding-back"
                type="button"
                onClick={registerStep === 0 ? closeRegister : previousRegisterStep}
                aria-label={registerStep === 0 ? "Fechar" : "Voltar"}
              >
                ←
              </button>

              <div className="onboarding-progress" aria-label={`Etapa ${registerStep + 1} de 4`}>
                <span style={{ width: `${((registerStep + 1) / 4) * 100}%` }} />
              </div>

              <button
                className="onboarding-close"
                type="button"
                onClick={closeRegister}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="onboarding-body">
              {registerStep === 0 ? (
                <div className="onboarding-step">
                  <div className="onboarding-emoji">👋</div>
                  <span className="onboarding-kicker">Etapa 1 de 4</span>
                  <h2>Vamos começar por você</h2>
                  <p>Esses dados serão conferidos pela recepção.</p>

                  <div className="onboarding-fields">
                    <label>
                      Nome completo
                      <input
                        value={register.fullName}
                        onChange={(event) =>
                          setRegister({ ...register, fullName: event.target.value })
                        }
                        placeholder="Como você se chama?"
                        autoFocus
                      />
                    </label>

                    <label>
                      CPF
                      <input
                        value={register.cpf}
                        onChange={(event) =>
                          setRegister({
                            ...register,
                            cpf: maskCpf(event.target.value),
                          })
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>

                    <label>
                      Data de nascimento
                      <input
                        value={register.birthDate}
                        onChange={(event) =>
                          setRegister({
                            ...register,
                            birthDate: event.target.value,
                          })
                        }
                        type="date"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {registerStep === 1 ? (
                <div className="onboarding-step">
                  <div className="onboarding-emoji">📱</div>
                  <span className="onboarding-kicker">Etapa 2 de 4</span>
                  <h2>Como podemos falar com você?</h2>
                  <p>Usaremos esses contatos apenas para sua conta e segurança.</p>

                  <div className="onboarding-fields">
                    <label>
                      E-mail
                      <input
                        value={register.email}
                        onChange={(event) =>
                          setRegister({ ...register, email: event.target.value })
                        }
                        placeholder="voce@email.com"
                        type="email"
                        autoFocus
                      />
                    </label>

                    <label>
                      Telefone
                      <input
                        value={register.phone}
                        onChange={(event) =>
                          setRegister({
                            ...register,
                            phone: maskPhone(event.target.value),
                          })
                        }
                        placeholder="(11) 99999-9999"
                        inputMode="tel"
                      />
                    </label>

                    <label>
                      Telefone de emergência
                      <input
                        value={register.emergencyPhone}
                        onChange={(event) =>
                          setRegister({
                            ...register,
                            emergencyPhone: maskPhone(event.target.value),
                          })
                        }
                        placeholder="(11) 99999-9999"
                        inputMode="tel"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {registerStep === 2 ? (
                <div className="onboarding-step">
                  <div className="onboarding-emoji">🎯</div>
                  <span className="onboarding-kicker">Etapa 3 de 4</span>
                  <h2>Qual é o seu objetivo?</h2>
                  <p>Isso ajuda o professor e também personaliza sua futura dieta.</p>

                  <div className="objective-grid">
                    {["Hipertrofia", "Emagrecimento", "Condicionamento", "Saúde"].map(
                      (objective) => (
                        <button
                          key={objective}
                          type="button"
                          className={
                            register.objective === objective ? "selected" : ""
                          }
                          onClick={() =>
                            setRegister({ ...register, objective })
                          }
                        >
                          {objective}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="onboarding-fields">
                    <label>
                      Crie sua senha
                      <input
                        value={register.password}
                        onChange={(event) =>
                          setRegister({ ...register, password: event.target.value })
                        }
                        placeholder="Mínimo de 6 caracteres"
                        type="password"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {registerStep === 3 ? (
                <div className="onboarding-step review-step">
                  <div className="onboarding-emoji">✅</div>
                  <span className="onboarding-kicker">Última etapa</span>
                  <h2>Revise seu cadastro</h2>
                  <p>Depois de enviar, sua conta ficará aguardando liberação.</p>

                  <div className="review-list">
                    <div>
                      <span>Nome</span>
                      <strong>{register.fullName}</strong>
                    </div>
                    <div>
                      <span>CPF</span>
                      <strong>{register.cpf}</strong>
                    </div>
                    <div>
                      <span>E-mail</span>
                      <strong>{register.email}</strong>
                    </div>
                    <div>
                      <span>Objetivo</span>
                      <strong>{register.objective}</strong>
                    </div>
                  </div>

                  <div className="register-note">
                    <strong>Aluno:</strong> aguarda liberação da recepção ou do professor.
                    <br />
                    <strong>Professor:</strong> o e-mail autorizado mantém a lógica já configurada no Supabase.
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="onboarding-footer">
              {registerFeedback ? (
                <div className="onboarding-feedback">{registerFeedback}</div>
              ) : null}

              {registerStep < 3 ? (
                <button
                  className="onboarding-primary"
                  type="button"
                  disabled={!stepValid}
                  onClick={nextRegisterStep}
                >
                  Continuar
                </button>
              ) : (
                <button
                  className="onboarding-primary"
                  type="button"
                  disabled={busy}
                  onClick={handleRegister}
                >
                  {busy ? "Enviando..." : "Enviar para liberação"}
                </button>
              )}

              <span>Etapa {registerStep + 1} de 4</span>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
