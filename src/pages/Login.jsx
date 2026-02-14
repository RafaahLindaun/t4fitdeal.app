// ✅ COLE EM: src/pages/Login.jsx
// ✅ MUDA SÓ O DESTINO DO SIGNUP PARA /onboarding (antes era /conta)
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const TEXT = "#0f172a";
const MUTED = "#64748b";

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

  function submit() {
    setErro("");

    if (isSignup) {
      const res = signup(form);
      if (!res.ok) return setErro(res.msg);
      return nav("/onboarding");
    } else {
      const res = loginWithEmail(form.email, form.senha);
      if (!res.ok) return setErro(res.msg);
      return nav("/dashboard");
    }
  }

  return (
    <div className="container page" style={styles.page}>
      <div style={styles.logoWrap}>
        <div style={styles.logoBox}>FD</div>
        <div style={styles.logoText}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>
      </div>

      <h1 style={styles.title}>{isSignup ? "Criar conta" : "Entrar"}</h1>
      <p style={styles.subtitle}>
        {isSignup ? "Crie sua conta para acessar o app" : "Entre com seu email e senha"}
      </p>

      <div style={styles.switchRow}>
        <button
          onClick={() => setMode("signup")}
          style={{ ...styles.switchBtn, ...(isSignup ? styles.switchActive : {}) }}
        >
          Sign up
        </button>
        <button
          onClick={() => setMode("login")}
          style={{ ...styles.switchBtn, ...(!isSignup ? styles.switchActive : {}) }}
        >
          Log in
        </button>
      </div>

      {isSignup && (
        <>
          <input name="nome" value={form.nome} onChange={onChange} placeholder="Nome" style={styles.input} />
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

      <input name="email" value={form.email} onChange={onChange} placeholder="Email" style={styles.input} />
      <input name="senha" value={form.senha} onChange={onChange} placeholder="Senha" type="password" style={styles.input} />

      {erro && <div style={styles.error}>{erro}</div>}

      <button onClick={submit} style={styles.cta}>
        {isSignup ? "Continuar" : "Entrar"}
      </button>
    </div>
  );
}

const styles = {
  page: { paddingTop: 40 },

  logoWrap: { display: "grid", placeItems: "center", marginBottom: 18 },
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
  },
  logoText: { fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },

  title: { fontSize: 26, fontWeight: 950, color: TEXT, textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, color: MUTED, textAlign: "center" },

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

  cta: {
    width: "100%",
    padding: 16,
    marginTop: 18,
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
