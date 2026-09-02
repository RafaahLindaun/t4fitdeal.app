import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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

const ARTBOARD_WIDTH = 450;
const ARTBOARD_HEIGHT = 780;

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

const featureItems = [
  {
    icon: <DumbbellIcon />,
    title: "Treino",
    text: "Acesse seus treinos e acompanhe sua performance.",
  },
  {
    icon: <AppleIcon />,
    title: "Dieta",
    text: "Veja sua dieta e receba dicas personalizadas.",
  },
  {
    icon: <CalendarIcon />,
    title: "Aulas",
    text: "Confira horários e reserve sua vaga nas aulas.",
  },
  {
    icon: <ChartIcon />,
    title: "Evolução",
    text: "Acompanhe seus resultados e evolua sempre.",
  },
];

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.31v2.77h3.56c2.09-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.85Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.85C6.7 7.31 9.13 5.38 12 5.38Z" />
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
  const navigate = useNavigate();
  const {
    user,
    loading,
    landingPath,
    signIn,
    signInWithGoogle,
    signUpFirstAccess,
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

  const stableViewport = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const body = document.body;
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const previousViewportContent = viewportMeta?.getAttribute("content") ?? "";

    // Evita que Chrome/Android redimensione o layout quando o teclado abre.
    // No Safari, o font-size de 16px nos inputs evita o zoom automático.
    if (viewportMeta && !previousViewportContent.includes("interactive-widget")) {
      viewportMeta.setAttribute(
        "content",
        `${previousViewportContent || "width=device-width, initial-scale=1"}, viewport-fit=cover, interactive-widget=overlays-content`,
      );
    }

    body.classList.add("accqua-fixed-keyboard-layout");

    const isTextFieldFocused = () => {
      const active = document.activeElement;
      return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
    };

    const applyStableViewport = (force = false) => {
      const measuredWidth = Math.round(viewport?.width ?? window.innerWidth);
      const measuredHeight = Math.round(viewport?.height ?? window.innerHeight);
      const current = stableViewport.current;
      const orientationChanged = current.width > 0 && Math.abs(measuredWidth - current.width) > 80;

      // Durante a digitação, mantém exatamente as medidas anteriores.
      // Assim a tela e o modal não sobem, encolhem ou recalculam o scale.
      if (
        force ||
        current.width === 0 ||
        current.height === 0 ||
        orientationChanged ||
        (!isTextFieldFocused() && measuredHeight >= current.height - 36)
      ) {
        stableViewport.current = {
          width: measuredWidth,
          height: measuredHeight,
        };
      }

      const width = stableViewport.current.width || measuredWidth;
      const height = stableViewport.current.height || measuredHeight;
      const widthScale = Math.min((width - 12) / ARTBOARD_WIDTH, 1.08);
      const fitScale = Math.min(widthScale, (height - 8) / ARTBOARD_HEIGHT);

      root.style.setProperty("--app-viewport-width", `${width}px`);
      root.style.setProperty("--app-viewport-height", `${height}px`);
      root.style.setProperty("--login-artboard-scale", String(Math.max(0.52, fitScale)));
    };

    const keepPageLocked = () => {
      if (isTextFieldFocused()) {
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          root.scrollTop = 0;
          body.scrollTop = 0;
        });
        return;
      }
      applyStableViewport();
    };

    const handleOrientation = () => {
      window.setTimeout(() => applyStableViewport(true), 160);
    };

    const handleFocus = () => {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        root.scrollTop = 0;
        body.scrollTop = 0;
      });
    };

    applyStableViewport(true);
    viewport?.addEventListener("resize", keepPageLocked);
    viewport?.addEventListener("scroll", keepPageLocked);
    window.addEventListener("resize", keepPageLocked);
    window.addEventListener("orientationchange", handleOrientation);
    document.addEventListener("focusin", handleFocus);

    return () => {
      viewport?.removeEventListener("resize", keepPageLocked);
      viewport?.removeEventListener("scroll", keepPageLocked);
      window.removeEventListener("resize", keepPageLocked);
      window.removeEventListener("orientationchange", handleOrientation);
      document.removeEventListener("focusin", handleFocus);
      body.classList.remove("accqua-fixed-keyboard-layout");
      if (viewportMeta) viewportMeta.setAttribute("content", previousViewportContent);
    };
  }, []);

  useEffect(() => {
    if (!registerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [registerOpen]);

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
    <div className="login-screen concept-login">
      <div className="login-water-overlay" aria-hidden="true" />
      <div className="login-tech-ring ring-one" aria-hidden="true" />
      <div className="login-tech-ring ring-two" aria-hidden="true" />

      <main className="login-artboard" aria-label="Login Accqua Sports">
        <div className="concept-logo">
          <AccquaLogo />
        </div>

        <section className="concept-intro">
          <h1>
            Bem-vindo ao app<br />
            da <span>Accqua Sports</span>
          </h1>
          <p>Treinos, evolução, aulas e orientações<br />em um só lugar.</p>
        </section>

        <section className="concept-access-banner">
          <div className="access-banner-icon">
            <LockIcon size={23} />
          </div>
          <div>
            <strong>Acesso exclusivo para alunos matriculados</strong>
            <span>Seu acesso é liberado de acordo com sua matrícula ativa na academia.</span>
          </div>
        </section>

        <form className="concept-login-form" onSubmit={handleLogin}>
          {feedback ? <div className={`concept-feedback ${feedback.type}`} role="alert">{feedback.text}</div> : null}

          <label className="concept-login-field">
            <UserIcon size={20} />
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="CPF, e-mail ou telefone"
              autoComplete="username"
            />
          </label>

          <label className="concept-login-field">
            <LockIcon size={19} />
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
              <EyeIcon size={20} />
            </button>
          </label>

          <button className="concept-forgot-below" type="button" onClick={() => navigate("/recuperar-senha")}>
            Esqueci minha senha
          </button>

          <button className="concept-enter-button" disabled={busy} type="submit">
            {busy ? <span className="button-loader" /> : "Entrar"}
          </button>

          <button className="concept-first-access" type="button" onClick={openRegister}>
            Primeiro acesso
          </button>
          <button className="concept-google-link" disabled={busy} type="button" onClick={handleGoogle}><GoogleMark /> Entrar com Google</button>
        </form>

        <section className="concept-feature-section" aria-label="Recursos do aplicativo">
          <div className="concept-feature-title">
            <span />
            <p>No app, você pode:</p>
            <span />
          </div>
          <div className="concept-feature-grid">
            {featureItems.map((item) => (
              <article key={item.title}>
                <div className="feature-icon">{item.icon}</div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <a className="concept-reception-link" href={WHATSAPP} target="_blank" rel="noreferrer">
          <HeadsetIcon size={17} />
          <span>Problemas para acessar?</span>
          <strong>Fale com a recepção.</strong>
        </a>
      </main>

      {registerOpen ? (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Primeiro acesso">
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

              <button className="onboarding-close" type="button" onClick={closeRegister} aria-label="Fechar">
                ×
              </button>
            </header>

            <div className="onboarding-body">
              {registerStep === 0 ? (
                <div className="onboarding-step">
                  <div className="onboarding-illustration">👋</div>
                  <span className="onboarding-kicker">Etapa 1 de 4</span>
                  <h2>Vamos começar por você</h2>
                  <p>Esses dados serão conferidos pela recepção antes da liberação.</p>

                  <div className="onboarding-fields">
                    <label>
                      Nome completo
                      <input
                        value={register.fullName}
                        onChange={(event) => setRegister({ ...register, fullName: event.target.value })}
                        placeholder="Como você se chama?"
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={register.cpf}
                        onChange={(event) => setRegister({ ...register, cpf: maskCpf(event.target.value) })}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        value={register.birthDate}
                        onChange={(event) => setRegister({ ...register, birthDate: event.target.value })}
                        type="date"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {registerStep === 1 ? (
                <div className="onboarding-step">
                  <div className="onboarding-illustration">📱</div>
                  <span className="onboarding-kicker">Etapa 2 de 4</span>
                  <h2>Como podemos falar com você?</h2>
                  <p>Esses contatos ficam vinculados à sua conta e ao contato de emergência.</p>

                  <div className="onboarding-fields">
                    <label>
                      E-mail
                      <input
                        value={register.email}
                        onChange={(event) => setRegister({ ...register, email: event.target.value })}
                        placeholder="voce@email.com"
                        type="email"
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={register.phone}
                        onChange={(event) => setRegister({ ...register, phone: maskPhone(event.target.value) })}
                        placeholder="(11) 99999-9999"
                        inputMode="tel"
                      />
                    </label>
                    <label>
                      Telefone de emergência
                      <input
                        value={register.emergencyPhone}
                        onChange={(event) =>
                          setRegister({ ...register, emergencyPhone: maskPhone(event.target.value) })
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
                  <div className="onboarding-illustration">🎯</div>
                  <span className="onboarding-kicker">Etapa 3 de 4</span>
                  <h2>Qual é o seu objetivo?</h2>
                  <p>Isso ajuda o professor e personaliza sua futura experiência de dieta.</p>

                  <div className="objective-grid">
                    {["Hipertrofia", "Emagrecimento", "Condicionamento", "Saúde"].map((objective) => (
                      <button
                        key={objective}
                        type="button"
                        className={register.objective === objective ? "selected" : ""}
                        onClick={() => setRegister({ ...register, objective })}
                      >
                        {objective}
                      </button>
                    ))}
                  </div>

                  <div className="onboarding-fields">
                    <label>
                      Crie sua senha
                      <input
                        value={register.password}
                        onChange={(event) => setRegister({ ...register, password: event.target.value })}
                        placeholder="Mínimo de 6 caracteres"
                        type="password"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {registerStep === 3 ? (
                <div className="onboarding-step review-step">
                  <div className="onboarding-illustration">✅</div>
                  <span className="onboarding-kicker">Última etapa</span>
                  <h2>Revise seu cadastro</h2>
                  <p>Depois de enviar, sua conta ficará aguardando liberação.</p>

                  <div className="review-list">
                    <div><span>Nome</span><strong>{register.fullName}</strong></div>
                    <div><span>CPF</span><strong>{register.cpf}</strong></div>
                    <div><span>E-mail</span><strong>{register.email}</strong></div>
                    <div><span>Objetivo</span><strong>{register.objective}</strong></div>
                  </div>

                  <div className="register-note">
                    Depois do envio, a equipe da ACCQUA confere os dados e libera o acesso ao aplicativo.
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="onboarding-footer">
              {registerFeedback ? <div className="onboarding-feedback">{registerFeedback}</div> : null}
              {registerStep < 3 ? (
                <button className="onboarding-primary" type="button" disabled={!stepValid} onClick={nextRegisterStep}>
                  Continuar
                </button>
              ) : (
                <button className="onboarding-primary" type="button" disabled={busy} onClick={handleRegister}>
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
