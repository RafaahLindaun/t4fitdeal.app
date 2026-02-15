// ✅ COLE EM: src/pages/Login.jsx
// ✅ SIGNUP VAI PARA /onboarding
// ✅ Troque o "FD" pelo seu símbolo: /src/assets/fitdeal-mark.png
// ✅ Pedido: remover 3 CTAs (chips), remover “Seu coach digital • rotina inteligente”, remover “no onboarding”,
// ✅ sem emojis, usar ícones com cara Apple (SVG), aumentar “fitdeal.”

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const TEXT = "#0f172a";
const MUTED = "#64748b";

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

function Icon({ name }) {
  const stroke = "rgba(15,23,42,.78)";
  const stroke2 = "rgba(15,23,42,.56)";

  if (name === "eye") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.2 12s3.4-7 9.8-7 9.8 7 9.8 7-3.4 7-9.8 7S2.2 12 2.2 12Z"
          stroke={stroke2}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          stroke={stroke}
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "eyeOff") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4l16 16" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M2.2 12s3.4-7 9.8-7c2 0 3.7.6 5.1 1.4M21.8 12s-3.4 7-9.8 7c-2.2 0-4.1-.7-5.6-1.7"
          stroke={stroke2}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.2 10.2a3.2 3.2 0 0 0 3.6 3.6"
          stroke={stroke2}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 7L10.5 16.5 4 10"
          stroke="rgba(17,24,39,.92)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // arrow right (chevron)
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke={stroke2}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Login() {
  const { signup, loginWithEmail } = useAuth();
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

  // extras: remember + last email + createdAt
  const [remember, setRemember] = useState(() => localStorage.getItem("remember_login") === "1");
  const [lastEmail, setLastEmail] = useState(() => localStorage.getItem("last_login_email") || "");
  const [createdAt, setCreatedAt] = useState(() => localStorage.getItem("account_created_at") || "");
  const createdLabel = useMemo(() => timeAgo(createdAt), [createdAt]);

  useEffect(() => {
    if (!form.email && lastEmail) setForm((p) => ({ ...p, email: lastEmail }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // micro animações leves
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-login-micro-v2";
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

  function submit() {
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

      const res = signup({ ...form, email });
      if (!res.ok) return setErro(res.msg);
      return nav("/onboarding");
    } else {
      const res = loginWithEmail(email, form.senha);
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

        {/* ✅ removido: "Seu coach digital • rotina inteligente"
            ✅ mantido apenas se já tiver createdAt, senão some (fica clean) */}
        {createdLabel ? (
          <div style={styles.metaRow}>
            <span style={styles.metaPill}>
              Conta criada <b style={styles.metaBold}>{createdLabel}</b>
            </span>
          </div>
        ) : null}
      </div>

      <h1 style={styles.title}>{isSignup ? "Criar conta" : "Entrar"}</h1>

      {/* ✅ removido “no onboarding” */}
      <p style={styles.subtitle}>
        {isSignup ? "Crie sua conta e personalize suas metas." : "Entre com seu email e senha para continuar."}
      </p>

      {/* ✅ mantém (discreto e útil) */}
      {quickEmail && (
        <button onClick={continueAsLast} style={styles.lastUser} className="tap" type="button">
          <span style={styles.lastDot} />
          Continuar como <b style={{ color: TEXT }}>{quickEmail}</b>
          <span style={styles.lastChev} aria-hidden="true">
            <Icon name="chev" />
          </span>
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

      {/* ✅ removidas as 3 CTAs (chips/benefícios) */}

      {isSignup && (
        <>
          <input name="nome" value={form.nome} onChange={onChange} placeholder="Nome" style={styles.input} autoComplete="name" />
          <div style={styles.row}>
            <input
              name="altura"
              value={form.altura}
              onChange={onChange}
              placeholder="Altura (cm)"
              style={styles.input}
              inputMode="numeric"
            />
            <input
              name="peso"
              value={form.peso}
              onChange={onChange}
              placeholder="Peso (kg)"
              style={styles.input}
              inputMode="numeric"
            />
          </div>
        </>
      )}

      <input
        name="email"
        value={form.email}
        onChange={onChange}
        placeholder="Email"
        style={styles.input}
        autoComplete="email"
      />

      <div style={styles.passWrap}>
        <input
          name="senha"
          value={form.senha}
          onChange={onChange}
          placeholder="Senha"
          type={showPass ? "text" : "password"}
          style={{ ...styles.input, marginTop: 0, paddingRight: 52 }}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
        <button
          type="button"
          style={styles.eyeBtn}
          className="tapSoft"
          onClick={() => setShowPass((p) => !p)}
          aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
          title={showPass ? "Ocultar senha" : "Mostrar senha"}
        >
          <Icon name={showPass ? "eyeOff" : "eye"} />
        </button>
      </div>

      <div style={styles.auxRow}>
        <button
          type="button"
          className="tapSoft"
          onClick={() => setRemember((p) => !p)}
          style={{ ...styles.auxBtn, ...(remember ? styles.auxOn : null) }}
          aria-pressed={remember}
        >
          <span style={{ ...styles.checkbox, ...(remember ? styles.checkboxOn : null) }} aria-hidden="true">
            {remember ? <Icon name="check" /> : null}
          </span>
          Lembrar
        </button>

        <button type="button" className="tapSoft" style={styles.linkBtn} onClick={() => toastSoon("Em breve.")}>
          {isSignup ? "Como funciona?" : "Esqueci a senha"}
        </button>
      </div>

      {erro && <div style={styles.error}>{erro}</div>}

      <button onClick={submit} style={styles.cta} className="tap" type="button">
        {isSignup ? "Continuar" : "Entrar"}
      </button>

      {/* ✅ CTAs removidos (Apple/Google) */}
      {/* ✅ footer removido para ficar clean (se quiser depois eu coloco minimal de volta) */}
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

  // ✅ aumenta fitdeal.
  logoText: {
    fontSize: 26,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.6,
    lineHeight: 1.05,
  },

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

  lastUser: {
    width: "100%",
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 850,
    color: MUTED,
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },
  lastDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
    flexShrink: 0,
  },
  lastChev: { marginLeft: "auto", display: "grid", placeItems: "center", opacity: 0.55 },

  switchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  switchBtn: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 900,
    color: MUTED,
  },
  switchActive: { border: `1px solid ${ORANGE}`, background: ORANGE_SOFT, color: ORANGE },

  input: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    marginTop: 12,
    fontSize: 14,
    outline: "none",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  passWrap: { position: "relative", marginTop: 12 },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 9,
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
  },

  auxRow: { marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  auxBtn: {
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 900,
    color: MUTED,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },
  auxOn: { borderColor: "rgba(255,106,0,.35)", background: "rgba(255,106,0,.08)", color: TEXT },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 9,
    border: "1px solid rgba(15,23,42,.14)",
    display: "grid",
    placeItems: "center",
    background: "#fff",
  },
  checkboxOn: { borderColor: "rgba(255,106,0,.45)", background: "rgba(255,106,0,.18)" },

  linkBtn: {
    border: "none",
    background: "transparent",
    color: TEXT,
    fontWeight: 950,
    padding: "10px 10px",
    borderRadius: 999,
  },

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
