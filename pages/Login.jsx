import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WHATSAPP_RECEPCAO = "551147181730";
const TELEFONE_RECEPCAO = "(11) 4718-1730";

function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "user") {
    return (
      <svg {...common}>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "eyeOff") {
    return (
      <svg {...common}>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
        <path d="M9.9 4.2A9.5 9.5 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-2.2 3.2" />
        <path d="M6.6 6.6C3.6 8.7 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 4.4-1.1" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg {...common}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />
      </svg>
    );
  }

  if (name === "dumbbell") {
    return (
      <svg {...common}>
        <path d="M6 6v12" />
        <path d="M18 6v12" />
        <path d="M6 12h12" />
        <path d="M3 9v6" />
        <path d="M21 9v6" />
        <path d="M9 8v8" />
        <path d="M15 8v8" />
      </svg>
    );
  }

  if (name === "apple") {
    return (
      <svg {...common}>
        <path d="M12 7c2.8-2.4 5.8-1.2 6.9 1.2 1.2 2.6.2 7.2-3.1 10.5-1.5 1.5-3.1.5-3.8.5s-2.3 1-3.8-.5C4.9 15.4 3.9 10.8 5.1 8.2 6.2 5.8 9.2 4.6 12 7Z" />
        <path d="M12 7c.2-2.2 1.4-3.7 3.5-4" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
        <path d="M17 7h2v2" />
      </svg>
    );
  }

  return null;
}

function AccquaLogo() {
  return (
    <div className="accqua-logo" aria-label="Accqua Sports Academia">
      <span className="accqua-line" />
      <strong>ACCQUA<br />SPORTS</strong>
      <small>ACADEMIA</small>
      <span className="accqua-line" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.6-2.1 3.4v2.8h3.4c2-1.9 3.4-4.7 3.4-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.4-2.8c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.7H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.6 13.8a6.6 6.6 0 0 1 0-4.2V6.7H2.1a11 11 0 0 0 0 10l3.5-2.9Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A10.5 10.5 0 0 0 12 1 11 11 0 0 0 2.1 6.7l3.5 2.9C6.5 7.4 9 5.4 12 5.4Z" />
    </svg>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="login-feature-card">
      <div className="login-feature-icon"><Icon name={icon} size={27} /></div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();
  const { loginWithEmail, loginWithGoogle } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showReception, setShowReception] = useState(false);

  const email = useMemo(() => identifier.trim().toLowerCase(), [identifier]);
  const canSubmit = email.length > 4 && senha.length > 0 && !loading;

  useEffect(() => {
    const id = "accqua-login-screen-v1";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      :root {
        --accqua-bg: #06172e;
        --accqua-bg2: #082653;
        --accqua-card: rgba(9, 35, 72, .72);
        --accqua-card2: rgba(12, 43, 84, .82);
        --accqua-border: rgba(199, 216, 255, .18);
        --accqua-border-strong: rgba(255, 222, 0, .44);
        --accqua-blue: #006dff;
        --accqua-yellow: #ffdc08;
        --accqua-text: #f8fbff;
        --accqua-muted: rgba(240, 246, 255, .72);
        --accqua-soft: rgba(255, 255, 255, .08);
      }

      html, body, #root { min-height: 100%; }
      body { margin: 0; background: #06172e; }
      * { box-sizing: border-box; }

      .accqua-login-page {
        min-height: 100vh;
        width: 100%;
        color: var(--accqua-text);
        background:
          radial-gradient(circle at 84% 12%, rgba(0, 109, 255, .30), transparent 31%),
          radial-gradient(circle at 15% 0%, rgba(19, 122, 255, .18), transparent 34%),
          linear-gradient(160deg, #061024 0%, #071a36 45%, #08234c 100%);
        position: relative;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .accqua-login-page::before {
        content: "";
        position: absolute;
        inset: -10% -28% auto auto;
        width: 82%;
        height: 66%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(0, 102, 255, .22), transparent 64%);
        filter: blur(4px);
        transform: rotate(-18deg);
        pointer-events: none;
      }

      .accqua-login-page::after {
        content: "";
        position: absolute;
        right: -20%;
        top: 6%;
        width: 68%;
        height: 45%;
        border-radius: 999px;
        border-left: 34px solid rgba(42, 107, 209, .15);
        transform: rotate(23deg);
        pointer-events: none;
      }

      .accqua-login-shell {
        position: relative;
        z-index: 1;
        width: min(100%, 430px);
        margin: 0 auto;
        min-height: 100vh;
        padding: max(20px, env(safe-area-inset-top)) 24px max(18px, env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
      }

      .accqua-statusbar {
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 800;
        letter-spacing: .2px;
        font-size: 15px;
        color: rgba(255,255,255,.96);
        margin-bottom: 8px;
      }

      .accqua-signal {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        opacity: .96;
      }

      .accqua-logo {
        width: 250px;
        max-width: 80%;
        margin: 5px auto 20px;
        display: grid;
        justify-items: center;
        gap: 7px;
        text-align: center;
        color: var(--accqua-blue);
        filter: drop-shadow(0 10px 24px rgba(0, 90, 255, .24));
      }

      .accqua-logo strong {
        font-size: clamp(32px, 10vw, 45px);
        line-height: .83;
        letter-spacing: .105em;
        font-weight: 950;
        transform: scaleX(1.22);
        transform-origin: center;
      }

      .accqua-logo small {
        color: rgba(219, 232, 255, .86);
        font-size: 11px;
        letter-spacing: .72em;
        font-weight: 600;
        margin-left: .72em;
      }

      .accqua-line {
        width: 100%;
        height: 3px;
        border-radius: 10px;
        background: var(--accqua-yellow);
        box-shadow: 0 0 16px rgba(255, 220, 8, .26);
      }

      .accqua-login-title {
        margin: 0 auto 10px;
        max-width: 355px;
        text-align: center;
        font-size: clamp(28px, 7.8vw, 42px);
        line-height: 1.08;
        font-weight: 920;
        letter-spacing: -.04em;
      }

      .accqua-login-title mark {
        background: transparent;
        color: var(--accqua-yellow);
      }

      .accqua-login-subtitle {
        margin: 0 auto 26px;
        max-width: 330px;
        color: var(--accqua-muted);
        text-align: center;
        font-size: 16px;
        line-height: 1.35;
      }

      .accqua-access-card {
        display: grid;
        grid-template-columns: 66px 1fr;
        gap: 15px;
        align-items: center;
        padding: 15px 17px;
        border: 1px solid var(--accqua-border);
        border-radius: 19px;
        background: linear-gradient(135deg, rgba(19, 66, 124, .70), rgba(4, 25, 56, .72));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 22px 60px rgba(0, 0, 0, .20);
        margin-bottom: 18px;
      }

      .accqua-lock-circle {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--accqua-yellow);
        background: rgba(255,255,255,.10);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
      }

      .accqua-access-card strong {
        color: var(--accqua-yellow);
        font-size: 16px;
        display: block;
        line-height: 1.18;
        margin-bottom: 6px;
      }

      .accqua-access-card span {
        color: rgba(255,255,255,.78);
        line-height: 1.35;
        font-size: 14px;
      }

      .accqua-login-form {
        display: grid;
        gap: 10px;
      }

      .accqua-field {
        height: 55px;
        display: grid;
        grid-template-columns: 42px 1fr 42px;
        align-items: center;
        background: rgba(255,255,255,.96);
        color: #0f172a;
        border: 1px solid rgba(255,255,255,.24);
        border-radius: 13px;
        box-shadow: 0 10px 26px rgba(0, 0, 0, .16);
        overflow: hidden;
      }

      .accqua-field-icon {
        display: grid;
        place-items: center;
        color: rgba(15,23,42,.50);
      }

      .accqua-field input {
        width: 100%;
        height: 100%;
        border: 0;
        outline: none;
        background: transparent;
        color: #111827;
        font-size: 16px;
        font-weight: 700;
        min-width: 0;
      }

      .accqua-field input::placeholder {
        color: rgba(15, 23, 42, .45);
        font-weight: 700;
      }

      .accqua-eye-btn {
        width: 42px;
        height: 42px;
        border: 0;
        background: transparent;
        display: grid;
        place-items: center;
        color: rgba(15,23,42,.53);
        cursor: pointer;
      }

      .accqua-primary-btn,
      .accqua-outline-btn,
      .accqua-google-btn,
      .accqua-reception-btn {
        border: 0;
        border-radius: 13px;
        min-height: 55px;
        padding: 0 18px;
        font-size: 16px;
        font-weight: 920;
        cursor: pointer;
        transition: transform .15s ease, filter .15s ease, opacity .15s ease;
        -webkit-tap-highlight-color: transparent;
      }

      .accqua-primary-btn:active,
      .accqua-outline-btn:active,
      .accqua-google-btn:active,
      .accqua-reception-btn:active {
        transform: scale(.985);
      }

      .accqua-primary-btn {
        margin-top: 6px;
        background: linear-gradient(135deg, #ffd600, #ffbf19);
        color: #071427;
        box-shadow: 0 18px 38px rgba(255, 214, 0, .22);
      }

      .accqua-primary-btn:disabled {
        opacity: .62;
        cursor: not-allowed;
      }

      .accqua-google-btn {
        background: rgba(255,255,255,.95);
        color: #0f172a;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 24px rgba(0,0,0,.14);
      }

      .accqua-outline-btn {
        color: var(--accqua-yellow);
        background: rgba(0,0,0,.08);
        border: 1.5px solid rgba(255, 220, 8, .74);
      }

      .accqua-divider {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 12px;
        color: rgba(255,255,255,.54);
        font-size: 13px;
        font-weight: 800;
        margin: 2px 0;
      }

      .accqua-divider::before,
      .accqua-divider::after {
        content: "";
        height: 1px;
        background: rgba(255,255,255,.16);
      }

      .accqua-error {
        border-radius: 14px;
        padding: 11px 13px;
        background: rgba(239, 68, 68, .14);
        color: #fecaca;
        border: 1px solid rgba(248, 113, 113, .30);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.35;
      }

      .accqua-feature-label {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 14px;
        align-items: center;
        margin: 22px 0 11px;
        color: rgba(255,255,255,.72);
        font-size: 14px;
        font-weight: 700;
        text-align: center;
      }

      .accqua-feature-label::before,
      .accqua-feature-label::after {
        content: "";
        height: 1px;
        background: rgba(255,255,255,.18);
      }

      .accqua-features-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 15px;
      }

      .login-feature-card {
        min-height: 106px;
        border: 1px solid rgba(199, 216, 255, .18);
        background: linear-gradient(180deg, rgba(15, 54, 102, .66), rgba(9, 31, 65, .70));
        border-radius: 15px;
        padding: 12px 8px 10px;
        display: grid;
        justify-items: center;
        align-content: start;
        gap: 6px;
        text-align: center;
      }

      .login-feature-icon {
        color: var(--accqua-yellow);
        height: 30px;
        display: grid;
        place-items: center;
        margin-bottom: 1px;
      }

      .login-feature-card strong {
        color: rgba(255,255,255,.96);
        font-size: 13px;
        line-height: 1.08;
      }

      .login-feature-card span {
        color: rgba(255,255,255,.67);
        font-size: 10.5px;
        line-height: 1.25;
      }

      .accqua-login-footer {
        margin-top: auto;
        padding-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(255,255,255,.62);
        font-size: 13px;
        text-align: center;
      }

      .accqua-footer-link {
        border: 0;
        background: transparent;
        padding: 2px 0;
        color: var(--accqua-yellow);
        font: inherit;
        font-weight: 900;
        cursor: pointer;
      }

      .accqua-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10;
        background: rgba(0, 6, 18, .68);
        display: grid;
        place-items: end center;
        padding: 18px;
        backdrop-filter: blur(10px);
      }

      .accqua-reception-panel {
        width: min(100%, 420px);
        border-radius: 26px;
        background: linear-gradient(165deg, rgba(10, 37, 76, .96), rgba(5, 19, 41, .98));
        border: 1px solid rgba(255,255,255,.16);
        box-shadow: 0 -18px 70px rgba(0,0,0,.36);
        padding: 22px;
        color: var(--accqua-text);
        animation: accquaUp .18s ease both;
      }

      @keyframes accquaUp {
        from { opacity: 0; transform: translateY(16px) scale(.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .accqua-reception-head {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }

      .accqua-reception-head .accqua-lock-circle {
        width: 54px;
        height: 54px;
      }

      .accqua-reception-panel h2 {
        font-size: 24px;
        margin: 0;
        line-height: 1.1;
      }

      .accqua-reception-panel p {
        margin: 0 0 16px;
        color: rgba(255,255,255,.73);
        line-height: 1.45;
        font-size: 15px;
      }

      .accqua-reception-steps {
        display: grid;
        gap: 10px;
        margin: 16px 0;
      }

      .accqua-step {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: 11px;
        align-items: center;
        padding: 12px;
        border-radius: 16px;
        background: rgba(255,255,255,.07);
        border: 1px solid rgba(255,255,255,.10);
      }

      .accqua-step b {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(255, 220, 8, .15);
        color: var(--accqua-yellow);
      }

      .accqua-step span {
        font-size: 13px;
        color: rgba(255,255,255,.74);
        line-height: 1.32;
      }

      .accqua-reception-actions {
        display: grid;
        gap: 10px;
        margin-top: 16px;
      }

      .accqua-reception-btn {
        width: 100%;
        background: linear-gradient(135deg, #ffd600, #ffbf19);
        color: #071427;
      }

      .accqua-close-btn {
        border: 0;
        background: transparent;
        color: rgba(255,255,255,.78);
        font-weight: 850;
        padding: 12px;
        cursor: pointer;
      }

      @media (max-width: 375px) {
        .accqua-login-shell { padding-left: 18px; padding-right: 18px; }
        .accqua-access-card { grid-template-columns: 52px 1fr; gap: 12px; }
        .accqua-lock-circle { width: 50px; height: 50px; }
        .accqua-features-grid { grid-template-columns: repeat(2, 1fr); }
        .login-feature-card { min-height: 98px; }
      }

      @media (min-height: 820px) {
        .accqua-logo { margin-top: 12px; margin-bottom: 26px; }
        .accqua-login-subtitle { margin-bottom: 30px; }
        .accqua-feature-label { margin-top: 25px; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  function openReception() {
    setShowReception(true);
  }

  function openWhatsApp() {
    const text = encodeURIComponent(
      "Olá! Preciso de ajuda para liberar meu primeiro acesso ao app Accqua Sports."
    );
    window.open(`https://wa.me/${WHATSAPP_RECEPCAO}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function handleEmailLogin(event) {
    event.preventDefault();
    setErro("");

    if (!email.includes("@")) {
      setErro("Use o e-mail cadastrado na recepção. Para CPF ou telefone, fale com a recepção para liberar seu acesso.");
      return;
    }

    if (!senha) {
      setErro("Digite sua senha para continuar.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithEmail(email, senha);
      if (!res?.ok) {
        setErro(res?.msg || "Não foi possível entrar. Confira seus dados ou fale com a recepção.");
        return;
      }
      nav("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setErro("");
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res?.ok) {
        setErro(res?.msg || "Não foi possível entrar com Google. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="accqua-login-page">
      <section className="accqua-login-shell">
        <div className="accqua-statusbar">
          <span>9:41</span>
          <span className="accqua-signal">▮▮▮  Wi‑Fi  ▰</span>
        </div>

        <AccquaLogo />

        <h1 className="accqua-login-title">
          Bem-vindo ao app<br />da <mark>Accqua Sports</mark>
        </h1>
        <p className="accqua-login-subtitle">
          Treinos, evolução, aulas e orientações em um só lugar.
        </p>

        <div className="accqua-access-card">
          <div className="accqua-lock-circle"><Icon name="lock" size={27} /></div>
          <div>
            <strong>Acesso exclusivo para alunos matriculados</strong>
            <span>Seu acesso é liberado de acordo com sua matrícula ativa na academia.</span>
          </div>
        </div>

        <form className="accqua-login-form" onSubmit={handleEmailLogin}>
          <label className="accqua-field">
            <span className="accqua-field-icon"><Icon name="user" size={22} /></span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="CPF, e-mail ou telefone"
            />
            <span />
          </label>

          <label className="accqua-field">
            <span className="accqua-field-icon"><Icon name="lock" size={21} /></span>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              type={showPass ? "text" : "password"}
              placeholder="Senha"
            />
            <button
              className="accqua-eye-btn"
              type="button"
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPass((current) => !current)}
            >
              <Icon name={showPass ? "eyeOff" : "eye"} size={22} />
            </button>
          </label>

          {erro ? <div className="accqua-error">{erro}</div> : null}

          <button className="accqua-primary-btn" disabled={!canSubmit} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="accqua-divider">ou</div>

          <button className="accqua-google-btn" disabled={loading} type="button" onClick={handleGoogleLogin}>
            <GoogleIcon />
            Entrar com Google
          </button>

          <button className="accqua-outline-btn" type="button" onClick={openReception}>
            Primeiro acesso
          </button>
        </form>

        <div className="accqua-feature-label">No app, você pode:</div>

        <div className="accqua-features-grid">
          <FeatureCard icon="dumbbell" title="Treino" text="Acesse seus treinos e acompanhe sua performance." />
          <FeatureCard icon="apple" title="Dieta" text="Veja sua dieta e receba dicas personalizadas." />
          <FeatureCard icon="calendar" title="Aulas" text="Confira horários e veja aulas disponíveis." />
          <FeatureCard icon="chart" title="Evolução" text="Acompanhe seus resultados e evolua sempre." />
        </div>

        <footer className="accqua-login-footer">
          <Icon name="phone" size={18} />
          <span>Problemas para acessar?</span>
          <button className="accqua-footer-link" type="button" onClick={openReception}>Fale com a recepção.</button>
        </footer>
      </section>

      {showReception ? (
        <div className="accqua-modal-backdrop" role="dialog" aria-modal="true" aria-label="Primeiro acesso">
          <div className="accqua-reception-panel">
            <div className="accqua-reception-head">
              <div className="accqua-lock-circle"><Icon name="shield" size={28} /></div>
              <div>
                <h2>Primeiro acesso</h2>
                <p style={{ margin: "6px 0 0" }}>A liberação do app é feita pela recepção.</p>
              </div>
            </div>

            <p>
              Para proteger os dados dos alunos, a conta precisa estar vinculada a uma matrícula ativa. Fale com a recepção da Accqua Sports e peça a liberação do seu acesso.
            </p>

            <div className="accqua-reception-steps">
              <div className="accqua-step"><b>1</b><span>Confirme sua matrícula ativa na academia.</span></div>
              <div className="accqua-step"><b>2</b><span>Informe o e-mail que você quer usar no app.</span></div>
              <div className="accqua-step"><b>3</b><span>A recepção libera seu acesso e você entra pelo app.</span></div>
            </div>

            <div className="accqua-reception-actions">
              <button className="accqua-reception-btn" type="button" onClick={openWhatsApp}>
                Falar com a recepção · {TELEFONE_RECEPCAO}
              </button>
              <button className="accqua-close-btn" type="button" onClick={() => setShowReception(false)}>
                Voltar para o login
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
