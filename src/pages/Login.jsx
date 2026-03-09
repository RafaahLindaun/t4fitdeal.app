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

  return (

    <div className="container page" style={styles.page}>

      <div style={styles.logoWrap}>

        <div style={styles.logoBox}>
          <img src={LogoMark} alt="fitdeal" style={styles.logoImg}/>
        </div>

        <div style={styles.logoText}>
          fitdeal<span style={{color:ORANGE}}>.</span>
        </div>

        {createdLabel && (
          <div style={styles.metaRow}>
            <span style={styles.metaPill}>
              Conta criada <b style={styles.metaBold}>{createdLabel}</b>
            </span>
          </div>
        )}

      </div>

      <h1 style={styles.title}>{isSignup ? "Criar conta" : "Entrar"}</h1>

      <p style={styles.subtitle}>
        {isSignup
          ? "Crie sua conta e personalize suas metas."
          : "Entre com seu email e senha para continuar."}
      </p>

      {isSignup && (
        <>
          <input name="nome" value={form.nome} onChange={onChange} placeholder="Nome" style={styles.input}/>
          <div style={styles.row}>
            <input name="altura" value={form.altura} onChange={onChange} placeholder="Altura (cm)" style={styles.input}/>
            <input name="peso" value={form.peso} onChange={onChange} placeholder="Peso (kg)" style={styles.input}/>
          </div>
        </>
      )}

      <input name="email" value={form.email} onChange={onChange} placeholder="Email" style={styles.input}/>

      <input
        name="senha"
        value={form.senha}
        onChange={onChange}
        placeholder="Senha"
        type={showPass ? "text" : "password"}
        style={styles.input}
      />

      {erro && <div style={styles.error}>{erro}</div>}

      <button onClick={submit} style={styles.cta} className="tap">
        {isSignup ? "Continuar" : "Entrar"}
      </button>

      <div style={styles.dividerRow}>
        <div style={styles.dividerLine}/>
        <div style={styles.dividerText}>ou</div>
        <div style={styles.dividerLine}/>
      </div>

      {/* BOTÃO GOOGLE OCUPANDO TODO ESPAÇO */}

      <div style={styles.socialWrap}>

        <button
          type="button"
          className="tap"
          style={styles.socialBtnFull}
          onClick={async () => {

            setErro("");

            const res = await loginWithGoogle();

            if (!res?.ok) setErro(res?.msg || "Erro ao entrar com Google.");

          }}
        >

          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={styles.googleIcon}
          />

          Continuar com Google

        </button>

      </div>

    </div>
  );
}

const styles = {

  page:{ paddingTop:40 },

  logoWrap:{ display:"grid", placeItems:"center", marginBottom:18 },

  logoBox:{
    width:68,
    height:68,
    borderRadius:20,
    background:ORANGE_SOFT,
    display:"grid",
    placeItems:"center",
    marginBottom:8
  },

  logoImg:{ width:50,height:50,objectFit:"contain" },

  logoText:{
    fontSize:26,
    fontWeight:950,
    color:TEXT,
    letterSpacing:-0.6
  },

  title:{
    fontSize:26,
    fontWeight:950,
    color:TEXT,
    textAlign:"center"
  },

  subtitle:{
    marginTop:6,
    fontSize:14,
    color:MUTED,
    textAlign:"center"
  },

  input:{
    width:"100%",
    padding:14,
    borderRadius:14,
    border:"1px solid #e5e7eb",
    marginTop:12
  },

  row:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:10
  },

  cta:{
    width:"100%",
    padding:16,
    marginTop:16,
    borderRadius:18,
    border:"none",
    background:ORANGE,
    color:"#111",
    fontWeight:950
  },

  dividerRow:{
    marginTop:14,
    display:"grid",
    gridTemplateColumns:"1fr auto 1fr",
    alignItems:"center",
    gap:10
  },

  dividerLine:{ height:1, background:"rgba(15,23,42,.10)" },

  dividerText:{ fontSize:12, fontWeight:900, color:MUTED },

  socialWrap:{ marginTop:12 },

  socialBtnFull:{
    width:"100%",
    padding:14,
    borderRadius:14,
    border:"1px solid rgba(15,23,42,.10)",
    background:"#fff",
    fontWeight:900,
    color:TEXT,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:10,
    boxShadow:"0 12px 30px rgba(15,23,42,.06)"
  },

  googleIcon:{
    width:20,
    height:20
  },

  error:{
    marginTop:12,
    padding:"10px 12px",
    borderRadius:12,
    background:"#fef2f2",
    color:"#991b1b",
    border:"1px solid #fecaca",
    fontSize:13,
    fontWeight:700
  }

};
