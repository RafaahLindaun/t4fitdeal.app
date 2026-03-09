import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const TEXT = "#0f172a";
const MUTED = "#64748b";

const GOOGLE_LOGO =
  "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg";

function timeAgo(ts) {
  const d = ts ? new Date(ts) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const day = 1000 * 60 * 60 * 24;
  const days = Math.floor(diff / day);
  if (days <= 0) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  if (months < 12) return `há ${months} meses`;
  const years = Math.floor(months / 12);
  if (years === 1) return "há 1 ano";
  return `há ${years} anos`;
}

export default function Login() {
  const { signup, loginWithEmail, loginWithGoogle } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState("signup");
  const isSignup = useMemo(() => mode === "signup", [mode]);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    altura: "",
    peso: "",
  });

  const [erro, setErro] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [remember, setRemember] = useState(() => localStorage.getItem("remember_login") === "1");
  const [lastEmail] = useState(() => localStorage.getItem("last_login_email") || "");
  const [createdAt, setCreatedAt] = useState(() => localStorage.getItem("account_created_at") || "");
  const createdLabel = useMemo(() => timeAgo(createdAt), [createdAt]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-login-micro-v4";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .tap { transition: transform .14s ease, filter .14s ease; }
      .tap:active { transform: scale(.99); }
      .tapSoft { transition: transform .14s ease, filter .14s ease; }
      .tapSoft:active { transform: scale(.985); }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      .fadeUp { animation: fadeUp .18s ease both; }
      @keyframes pop { from { transform: scale(.985); opacity: .9;} to { transform: scale(1); opacity: 1;} }
      .pop { animation: pop .14s ease both; }
    `;
    document.head.appendChild(style);
  }, []);

  function onChange(e) {
    const { name, value } = e.target;

    if (name === "altura" || name === "peso") {
      const onlyDigits = value.replace(/[^\d]/g, "");
      setForm((p) => ({ ...p, [name]: onlyDigits }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toastSoon(msg) {
    setErro(msg);
    setTimeout(() => setErro(""), 1700);
  }

  async function submit() {
    setErro("");
    const email = (form.email || "").trim().toLowerCase();

    if (remember) {
      localStorage.setItem("remember_login", "1");
      if (email) localStorage.setItem("last_login_email", email);
    } else {
      localStorage.setItem("remember_login", "0");
      localStorage.removeItem("last_login_email");
    }

    if (isSignup) {
      if (!localStorage.getItem("account_created_at")) {
        localStorage.setItem("account_created_at", new Date().toISOString());
        setCreatedAt(localStorage.getItem("account_created_at") || "");
      }

      const res = await signup({ ...form, email });
      if (!res.ok) return setErro(res.msg);
      return nav("/onboarding");
    } else {
      const res = await loginWithEmail(email, form.senha);
      if (!res.ok) return setErro(res.msg);
      return nav("/dashboard");
    }
  }

  const quickEmail = lastEmail && lastEmail.includes("@") ? lastEmail : "";
  function continueAsLast() {
    if (!quickEmail) return;
    setMode("login");
    setForm((p) => ({ ...p, email: quickEmail }));
  }

  function toggleMode(next) {
    setErro("");
    setMode(next);
  }

  return (
    <div className="container page fadeUp" style={styles.page}>
      <div style={styles.logoWrap}>
        <div style={styles.logoBox} className="pop">
          <img
            src={LogoMark}
            alt="fitdeal"
            style={styles.logoImg}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget?.nextSibling;
              if (fb) fb.style.display = "grid";
            }}
          />
          <div style={styles.logoFallback}>FD</div>
        </div>

        <div style={styles.logoText}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

        {createdLabel ? (
          <div style={styles.metaRow}>
            <span style={styles.metaPill}>
              Conta criada <b style={styles.metaBold}>{createdLabel}</b>
            </span>
          </div>
        ) : null}
      </div>

      <h1 style={styles.title}>{isSignup ? "Criar conta" : "Entrar"}</h1>

      <p style={styles.subtitle}>
        {isSignup ? "Crie sua conta e personalize suas metas." : "Entre com seu email e senha para continuar."}
      </p>

      {quickEmail && (
        <button onClick={continueAsLast} style={styles.lastUser} className="tap" type="button">
          <span style={styles.lastDot} />
          Continuar como <b style={{ color: TEXT }}>{quickEmail}</b>
        </button>
      )}

      <div style={styles.switchRow}>
        <button
          onClick={() => toggleMode("signup")}
          style={{ ...styles.switchBtn, ...(isSignup ? styles.switchActive : {}) }}
          className="tap"
          type="button"
        >
          Sign up
        </button>
        <button
          onClick={() => toggleMode("login")}
          style={{ ...styles.switchBtn, ...(!isSignup ? styles.switchActive : {}) }}
          className="tap"
          type="button"
        >
          Log in
        </button>
      </div>

      <input name="email" value={form.email} onChange={onChange} placeholder="Email" style={styles.input} />

      <div style={styles.passWrap}>
        <input
          name="senha"
          value={form.senha}
          onChange={onChange}
          placeholder="Senha"
          type={showPass ? "text" : "password"}
          style={{ ...styles.input, marginTop: 0, paddingRight: 48 }}
        />
      </div>

      {erro && <div style={styles.error}>{erro}</div>}

      <button onClick={submit} style={styles.cta} className="tap" type="button">
        {isSignup ? "Continuar" : "Entrar"}
      </button>

      <div style={styles.dividerRow}>
        <div style={styles.dividerLine} />
        <div style={styles.dividerText}>ou</div>
        <div style={styles.dividerLine} />
      </div>

      <div style={styles.socialWrap}>
        <button
          type="button"
          className="tap"
          style={{ ...styles.socialBtn, width: "100%" }}
          onClick={async () => {
            setErro("");
            const res = await loginWithGoogle();
            if (!res?.ok) setErro(res?.msg || "Erro ao entrar com Google.");
          }}
          aria-label="Continuar com Google"
        >
          <span style={styles.socialIcon}>
            <img src={GOOGLE_LOGO} alt="Google" style={{ width: 18, height: 18 }} />
          </span>
          Continuar com Google
        </button>
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}

const styles = {
  page: { paddingTop: 40 },
  logoWrap: { display: "grid", placeItems: "center", marginBottom: 18 },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    background: ORANGE_SOFT,
    border: "1px solid rgba(255,106,0,.14)",
    display: "grid",
    placeItems: "center",
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },
  logoImg: { width: 50, height: 50, objectFit: "contain", display: "block" },
  logoFallback: { display: "none", width: "100%", height: "100%", placeItems: "center", fontWeight: 950, color: ORANGE, fontSize: 22 },
  logoText: { fontSize: 26, fontWeight: 950, color: TEXT, letterSpacing: -0.6, lineHeight: 1.05 },
  metaRow: { marginTop: 10 },
  metaPill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
  },
  metaBold: { fontWeight: 950 },
  title: { fontSize: 26, fontWeight: 950, color: TEXT, textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, color: MUTED, textAlign: "center" },
  switchRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18, marginBottom: 12 },
  switchBtn: { padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 900, color: MUTED },
  switchActive: { border: `1px solid ${ORANGE}`, background: ORANGE_SOFT, color: ORANGE },
  input: { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #e5e7eb", marginTop: 12, fontSize: 14, outline: "none" },
  passWrap: { position: "relative", marginTop: 12 },
  cta: {
    width: "100%",
    padding: 16,
    marginTop: 16,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 16px 40px rgba(255,106,0,.28)",
  },
  dividerRow: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, color: MUTED },
  dividerLine: { height: 1, background: "rgba(15,23,42,.10)" },
  dividerText: { fontSize: 12, fontWeight: 900, color: MUTED },
  socialWrap: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr" },
  socialBtn: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 900,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 11,
    background: "rgba(15,23,42,.05)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  error: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    fontSize: 13,
    fontWeight: 700,
  },
};
