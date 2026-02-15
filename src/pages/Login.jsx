// ✅ COLE EM: src/pages/Login.jsx
// ✅ MUDA SÓ O DESTINO DO SIGNUP PARA /onboarding (antes era /conta)
// ✅ Troque o "FD" pelo seu símbolo: coloque o PNG em /src/assets/fitdeal-mark.png
// ✅ Mantém o estilo simples do seu código, só adiciona: logo imagem + CTAs discretos + "benefícios" + "desde quando" + social (placeholders) + remember me + show/hide senha

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ✅ ajuste se o nome do arquivo for diferente
import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

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

  // extras de “apps premium”
  const [remember, setRemember] = useState(() => localStorage.getItem("remember_login") === "1");
  const [lastEmail, setLastEmail] = useState(() => localStorage.getItem("last_login_email") || "");
  const [createdAt, setCreatedAt] = useState(() => localStorage.getItem("account_created_at") || "");
  const createdLabel = useMemo(() => timeAgo(createdAt), [createdAt]);

  useEffect(() => {
    // pré-preencher email se usuário já usou antes (login UX)
    if (!form.email && lastEmail) setForm((p) => ({ ...p, email: lastEmail }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // micro animações leves (sem mudar o “jeito” do seu layout)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-login-micro";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .tap:active { transform: scale(.99); }
      .tapSoft:active { transform: scale(.985); }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      .fadeUp { animation: fadeUp .18s ease both; }
      @keyframes pop { from { transform: scale(.98); opacity: .9;} to { transform: scale(1); opacity: 1;} }
      .pop { animation: pop .14s ease both; }
    `;
    document.head.appendChild(style);
  }, []);

  function onChange(e) {
    const { name, value } = e.target;

    if (name === "altura" || name === "peso") {
      // só números
      const onlyDigits = value.replace(/[^\d]/g, "");
      setForm((p) => ({ ...p, [name]: onlyDigits }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  }

  function toastSoon(msg) {
    setErro(msg);
    setTimeout(() => setErro(""), 1800);
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
      // marca “desde quando criou” (local)
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

  // “continuar como” (extra premium)
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
          {/* ✅ troca FD por símbolo (com fallback se não achar o png) */}
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

        {/* micro “status / desde quando” */}
        <div style={styles.metaRow}>
          <span style={styles.metaPill}>
            {createdLabel ? (
              <>
                Conta criada <b style={styles.metaBold}>{createdLabel}</b>
              </>
            ) : (
              <>Seu coach digital • rotina inteligente</>
            )}
          </span>
        </div>
      </div>

      <h1 style={styles.title}>{isSignup ? "Criar conta" : "Entrar"}</h1>
      <p style={styles.subtitle}>
        {isSignup
          ? "Crie sua conta e personalize metas no onboarding."
          : "Entre com seu email e senha para continuar."}
      </p>

      {/* CTA discreto: continuar como último email */}
      {quickEmail && (
        <button onClick={continueAsLast} style={styles.lastUser} className="tap" type="button">
          <span style={styles.lastDot} />
          Continuar como <b style={{ color: TEXT }}>{quickEmail}</b>
          <span style={styles.lastChev}>›</span>
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

      {/* “benefícios” (leve, igual app premium) */}
      <div style={styles.benefits}>
        <div style={styles.benefitPill}>
          <span style={styles.benefitDot} />
          Treino + nutrição em 1 lugar
        </div>
        <div style={styles.benefitPill}>
          <span style={styles.benefitDot} />
          Metas por objetivo e peso
        </div>
        <div style={styles.benefitPill}>
          <span style={styles.benefitDot} />
          Visual clean, rápido
        </div>
      </div>

      {isSignup && (
        <>
          <input
            name="nome"
            value={form.nome}
            onChange={onChange}
            placeholder="Nome"
            style={styles.input}
            autoComplete="name"
          />
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
          style={{ ...styles.input, marginTop: 0, paddingRight: 44 }}
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
          {showPass ? "🙈" : "👁️"}
        </button>
      </div>

      {/* remember + recuperar (discreto) */}
      <div style={styles.auxRow}>
        <button
          type="button"
          className="tapSoft"
          onClick={() => setRemember((p) => !p)}
          style={{ ...styles.auxBtn, ...(remember ? styles.auxOn : null) }}
        >
          <span style={{ ...styles.checkbox, ...(remember ? styles.checkboxOn : null) }}>
            {remember ? "✓" : ""}
          </span>
          Lembrar
        </button>

        {!isSignup ? (
          <button
            type="button"
            className="tapSoft"
            style={styles.linkBtn}
            onClick={() => toastSoon("Recuperar senha — em breve.")}
          >
            Esqueci a senha
          </button>
        ) : (
          <button
            type="button"
            className="tapSoft"
            style={styles.linkBtn}
            onClick={() => toastSoon("Ao criar conta você ajusta tudo no onboarding.")}
          >
            Como funciona?
          </button>
        )}
      </div>

      {erro && <div style={styles.error}>{erro}</div>}

      <button onClick={submit} style={styles.cta} className="tap" type="button">
        {isSignup ? "Continuar" : "Entrar"}
      </button>

      {/* CTAs “premium” discretos (placeholders) */}
      <div style={styles.socialWrap}>
        <button
          type="button"
          className="tap"
          style={styles.socialBtn}
          onClick={() => toastSoon("Continuar com Apple — em breve.")}
        >
          <span style={styles.socialIcon}></span>
          Continuar com Apple
        </button>

        <button
          type="button"
          className="tap"
          style={styles.socialBtn}
          onClick={() => toastSoon("Continuar com Google — em breve.")}
        >
          <span style={styles.socialIcon}>G</span>
          Continuar com Google
        </button>
      </div>

      {/* links finais estilo “apps” */}
      <div style={styles.footerRow}>
        <button type="button" className="tapSoft" style={styles.footerLink} onClick={() => nav("/planos")}>
          Ver planos
        </button>
        <span style={styles.footerDot} />
        <button type="button" className="tapSoft" style={styles.footerLink} onClick={() => toastSoon("Suporte — em breve.")}>
          Suporte
        </button>
        <span style={styles.footerDot} />
        <button type="button" className="tapSoft" style={styles.footerLink} onClick={() => toastSoon("Políticas — em breve.")}>
          Políticas
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop: 40 },

  logoWrap: { display: "grid", placeItems: "center", marginBottom: 16 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: ORANGE_SOFT,
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 22,
    marginBottom: 6,
    letterSpacing: -0.5,
    overflow: "hidden",
    position: "relative",
  },
  logoImg: {
    width: 46,
    height: 46,
    objectFit: "contain",
    display: "block",
  },
  logoFallback: {
    display: "none",
    width: "100%",
    height: "100%",
    placeItems: "center",
  },
  logoText: { fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },

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
  lastChev: { marginLeft: "auto", fontSize: 18, fontWeight: 950, color: TEXT, opacity: 0.5 },

  switchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
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

  benefits: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  benefitPill: {
    padding: "9px 12px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.08)",
    fontSize: 12,
    fontWeight: 850,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
  },

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
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    display: "grid",
    placeItems: "center",
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
    width: 20,
    height: 20,
    borderRadius: 8,
    border: "1px solid rgba(15,23,42,.14)",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 950,
    color: "#111",
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

  socialWrap: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
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
  },
  socialIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    background: "rgba(15,23,42,.05)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
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

  footerRow: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: MUTED,
    flexWrap: "wrap",
  },
  footerLink: {
    border: "none",
    background: "transparent",
    color: MUTED,
    fontWeight: 900,
    padding: "8px 10px",
    borderRadius: 999,
  },
  footerDot: { width: 6, height: 6, borderRadius: 999, background: "rgba(255,106,0,.65)" },
};
