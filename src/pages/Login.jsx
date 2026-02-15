// ✅ COLE EM: src/pages/Login.jsx
// ✅ MUDA SÓ O DESTINO DO SIGNUP PARA /onboarding (antes era /conta)
// ✅ Logo: coloque sua imagem do símbolo em: src/assets/fitdeal-mark.png (PNG)
//    e mantenha o import abaixo.
// UI: “Apple / premium” (segmented control, card, micro-animações, CTAs discretos)

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ✅ ajuste o caminho do arquivo se você salvar com outro nome
import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-login-ui";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes fdFadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes fdGlow { 0%,100% { opacity:.65; transform: translateY(0);} 50% { opacity:.9; transform: translateY(-2px);} }
      .tap { transform: translateZ(0); }
      .tap:active { transform: scale(.99); }
      .tapSoft:active { transform: scale(.985); }
      .fadeUp { animation: fdFadeUp .22s ease both; }
      .glowFloat { animation: fdGlow 3.6s ease-in-out infinite; }
      input::placeholder { color: rgba(100,116,139,.75); }
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

  function quickFillDemo() {
    // Não quebra nada: só preenche para agilizar testes
    setErro("");
    setForm((p) => ({
      ...p,
      nome: p.nome || "Rafael",
      email: p.email || "demo@fitdeal.app",
      senha: p.senha || "123456",
      altura: p.altura || "181",
      peso: p.peso || "80",
    }));
  }

  function comingSoon(feature) {
    setErro(`${feature} — em breve.`);
  }

  return (
    <div style={S.page}>
      <div style={S.bgGlowA} className="glowFloat" />
      <div style={S.bgGlowB} />

      <div style={S.shell} className="fadeUp">
        {/* Top brand */}
        <div style={S.brandWrap}>
          <div style={S.logoCard} className="tap">
            <div style={S.logoCardInner}>
              <img
                src={LogoMark}
                alt="fitdeal"
                style={S.logoImg}
                onError={(e) => {
                  // fallback se o asset não existir ainda
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* fallback visual */}
              <div style={S.logoFallback}>
                <span style={S.logoFallbackText}>FD</span>
              </div>

              <div style={S.logoRing} />
              <div style={S.logoDot} />
            </div>
          </div>

          <div style={S.brandText}>
            <div style={S.brandName}>
              fitdeal<span style={{ color: ORANGE }}>.</span>
            </div>
            <div style={S.brandSub}>
              Treino + nutrição + rotina, com uma estética limpa e rápida.
            </div>
          </div>
        </div>

        {/* Segmented control */}
        <div style={S.segmentWrap}>
          <button
            className="tap"
            onClick={() => {
              setErro("");
              setMode("signup");
            }}
            style={{ ...S.segmentBtn, ...(isSignup ? S.segmentOn : S.segmentOff) }}
            type="button"
          >
            Criar conta
          </button>
          <button
            className="tap"
            onClick={() => {
              setErro("");
              setMode("login");
            }}
            style={{ ...S.segmentBtn, ...(!isSignup ? S.segmentOn : S.segmentOff) }}
            type="button"
          >
            Entrar
          </button>
        </div>

        {/* Card principal */}
        <div style={S.card}>
          <div style={S.titleRow}>
            <div style={S.title}>{isSignup ? "Vamos começar" : "Bem-vindo de volta"}</div>
            <div style={S.pill}>
              {isSignup ? "Onboarding" : "Dashboard"}
              <span style={S.pillDot} />
            </div>
          </div>

          <div style={S.subtitle}>
            {isSignup
              ? "Crie sua conta em segundos. Você ajusta metas e preferências no onboarding."
              : "Entre com email e senha para continuar do ponto onde parou."}
          </div>

          {/* Inputs */}
          <div style={S.form}>
            {isSignup && (
              <>
                <div style={S.field}>
                  <div style={S.label}>Nome</div>
                  <input
                    name="nome"
                    value={form.nome}
                    onChange={onChange}
                    placeholder="Seu nome"
                    style={S.input}
                    autoComplete="name"
                  />
                </div>

                <div style={S.row2}>
                  <div style={S.field}>
                    <div style={S.label}>Altura</div>
                    <input
                      name="altura"
                      value={form.altura}
                      onChange={onChange}
                      placeholder="cm"
                      style={S.input}
                      inputMode="numeric"
                    />
                  </div>

                  <div style={S.field}>
                    <div style={S.label}>Peso</div>
                    <input
                      name="peso"
                      value={form.peso}
                      onChange={onChange}
                      placeholder="kg"
                      style={S.input}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={S.field}>
              <div style={S.label}>Email</div>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="seuemail@email.com"
                style={S.input}
                autoComplete="email"
              />
            </div>

            <div style={S.field}>
              <div style={S.label}>Senha</div>
              <input
                name="senha"
                value={form.senha}
                onChange={onChange}
                placeholder="••••••••"
                type="password"
                style={S.input}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <div style={S.helperRow}>
                <span style={S.helperLeft}>
                  {isSignup ? "Mín. 6 caracteres (recomendado)" : "Use sua senha cadastrada"}
                </span>

                {/* CTA discreto (sem quebrar fluxo) */}
                {!isSignup ? (
                  <button
                    type="button"
                    className="tapSoft"
                    style={S.linkBtn}
                    onClick={() => comingSoon("Recuperar senha")}
                  >
                    Esqueci a senha
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tapSoft"
                    style={S.linkBtn}
                    onClick={quickFillDemo}
                    title="Preencher valores para teste"
                  >
                    Preencher demo
                  </button>
                )}
              </div>
            </div>

            {erro ? <div style={S.error}>{erro}</div> : null}

            {/* CTA principal */}
            <button onClick={submit} style={S.cta} className="tap" type="button">
              <span style={S.ctaText}>{isSignup ? "Continuar" : "Entrar"}</span>
              <span style={S.ctaChev}>›</span>
            </button>

            {/* CTAs secundários “premium”, discretos */}
            <div style={S.secondaryWrap}>
              <button
                type="button"
                className="tap"
                style={S.secBtn}
                onClick={() => comingSoon("Entrar com Apple")}
                aria-label="Entrar com Apple"
              >
                <span style={S.secIcon}>
                  <AppleIcon />
                </span>
                Continuar com Apple
              </button>

              <button
                type="button"
                className="tap"
                style={S.secBtn}
                onClick={() => comingSoon("Entrar com Google")}
                aria-label="Entrar com Google"
              >
                <span style={S.secIcon}>
                  <GoogleIcon />
                </span>
                Continuar com Google
              </button>
            </div>

            {/* Rodapé do card: confiança + micro-info */}
            <div style={S.trustRow}>
              <TrustPill label="Privacidade" value="sem spam" />
              <TrustPill label="Setup" value="rápido" />
              <TrustPill label="Premium" value="visual clean" />
            </div>

            <div style={S.legal}>
              Ao continuar, você concorda com os termos e políticas do app.
              <span style={S.legalDot}> • </span>
              <button
                type="button"
                className="tapSoft"
                style={S.legalLink}
                onClick={() => comingSoon("Políticas")}
              >
                Ver detalhes
              </button>
            </div>
          </div>
        </div>

        {/* CTA final “discreto” (estilo apps premium) */}
        <div style={S.bottomRow}>
          <button
            type="button"
            className="tapSoft"
            style={S.bottomLink}
            onClick={() => comingSoon("Suporte")}
          >
            Precisa de ajuda?
          </button>

          <div style={S.bottomDot} />

          <button
            type="button"
            className="tapSoft"
            style={S.bottomLink}
            onClick={() => nav("/planos")}
          >
            Ver planos
          </button>
        </div>
      </div>

      <div style={{ height: 90 }} />
    </div>
  );
}

/* ---------- micro components ---------- */
function TrustPill({ label, value }) {
  return (
    <div style={S.trustPill}>
      <div style={S.trustLabel}>{label}</div>
      <div style={S.trustValue}>{value}</div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.7 13.3c0 2.6 2.3 3.4 2.3 3.5s-1.8 5.2-4.3 5.2c-1.1 0-1.6-.6-2.7-.6-1.1 0-1.7.6-2.8.6-2.1 0-4.7-4.4-4.7-8.1C4.5 9.9 6 8 8.3 8c1 0 1.9.7 2.6.7.7 0 1.8-.8 3.1-.8.5 0 2.1.1 3.1 1.6-.1.1-1.9 1.1-1.9 3.2Z"
        stroke="rgba(15,23,42,.70)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.6 4.4c-.7.9-1.8 1.5-3 1.4-.2-1.1.4-2.2 1-2.9.7-.8 1.9-1.4 3-1.4.2 1.1-.3 2.1-1 2.9Z"
        stroke="rgba(15,23,42,.55)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 12.2c0-.6-.1-1.1-.2-1.6H12v3.1h4.7c-.2 1-.8 1.9-1.7 2.5v2h2.8c1.6-1.4 2.7-3.6 2.7-6Z"
        stroke="rgba(15,23,42,.70)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 21c2.3 0 4.2-.8 5.6-2l-2.8-2c-.8.5-1.8.8-2.8.8-2.1 0-3.9-1.4-4.6-3.3H4.5v2.1C5.9 19.4 8.7 21 12 21Z"
        stroke="rgba(15,23,42,.55)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 14.5c-.2-.6-.4-1.1-.4-1.7s.1-1.2.3-1.7V9H4.5C3.9 10.2 3.5 11.6 3.5 12.8s.4 2.6 1 3.8l2.9-2.1Z"
        stroke="rgba(15,23,42,.55)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.1c1.3 0 2.5.4 3.4 1.3l2.5-2.5C16.2 4.4 14.3 3.5 12 3.5c-3.3 0-6.1 1.6-7.5 4.3l2.8 2.1C8.1 8.5 9.9 7.1 12 7.1Z"
        stroke="rgba(15,23,42,.55)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: {
    minHeight: "100vh",
    padding: 18,
    paddingTop: 36,
    background:
      "radial-gradient(900px 520px at 18% -10%, rgba(255,106,0,.14), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
    position: "relative",
    overflow: "hidden",
  },

  bgGlowA: {
    position: "absolute",
    inset: -140,
    pointerEvents: "none",
    background:
      "radial-gradient(520px 260px at 86% 10%, rgba(15,23,42,.08), rgba(255,255,255,0) 70%), radial-gradient(520px 260px at 18% 0%, rgba(255,106,0,.12), rgba(255,255,255,0) 60%)",
  },
  bgGlowB: {
    position: "absolute",
    inset: -120,
    pointerEvents: "none",
    background: "radial-gradient(420px 220px at 50% 40%, rgba(15,23,42,.04), rgba(255,255,255,0) 65%)",
  },

  shell: {
    position: "relative",
    zIndex: 1,
    width: "min(520px, 100%)",
    margin: "0 auto",
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  logoCard: {
    width: 68,
    height: 68,
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.72))",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  logoCardInner: {
    width: 58,
    height: 58,
    borderRadius: 18,
    background:
      "radial-gradient(120px 80px at 18% 0%, rgba(255,106,0,.18), rgba(255,255,255,0) 60%), radial-gradient(120px 80px at 86% 20%, rgba(15,23,42,.08), rgba(255,255,255,0) 65%), rgba(255,255,255,.88)",
    border: "1px solid rgba(15,23,42,.08)",
    position: "relative",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
  },
  logoImg: {
    width: 44,
    height: 44,
    objectFit: "contain",
    filter: "saturate(1.05) contrast(1.05)",
    transform: "translateY(1px)",
    zIndex: 2,
  },
  logoFallback: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    zIndex: 1,
  },
  logoFallbackText: {
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: -0.6,
    color: "rgba(15,23,42,.72)",
  },
  logoRing: {
    position: "absolute",
    inset: -10,
    borderRadius: 999,
    border: "1px solid rgba(255,106,0,.18)",
    zIndex: 0,
  },
  logoDot: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,106,0,.95)",
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
    zIndex: 3,
  },

  brandText: { minWidth: 0 },
  brandName: { fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.4, lineHeight: 1.1 },
  brandSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  segmentWrap: {
    marginTop: 10,
    padding: 6,
    borderRadius: 18,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  segmentBtn: {
    padding: "12px 12px",
    borderRadius: 14,
    border: "none",
    fontWeight: 950,
    letterSpacing: -0.2,
    transition: "transform .12s ease",
  },
  segmentOn: {
    background: "linear-gradient(180deg, #0B0C0F 0%, #14161B 100%)",
    color: "#fff",
    boxShadow: "0 16px 50px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.06)",
  },
  segmentOff: {
    background: "rgba(255,255,255,.70)",
    color: MUTED,
  },

  card: {
    marginTop: 12,
    borderRadius: 26,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  pill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "rgba(255,106,0,.95)",
    boxShadow: "0 0 0 5px rgba(255,106,0,.14)",
  },

  subtitle: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  form: { marginTop: 12 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  field: { marginTop: 12 },
  label: { fontSize: 12, fontWeight: 950, color: "rgba(15,23,42,.72)", letterSpacing: 0.2 },

  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    marginTop: 8,
    fontSize: 14,
    outline: "none",
    fontWeight: 850,
    color: TEXT,
    background: "rgba(255,255,255,.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
  },

  helperRow: { marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  helperLeft: { fontSize: 12, fontWeight: 800, color: "rgba(100,116,139,.95)" },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: TEXT,
    fontWeight: 950,
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
  },

  error: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(254,242,242,.95)",
    color: "#991b1b",
    border: "1px solid #fecaca",
    fontSize: 13,
    fontWeight: 900,
  },

  cta: {
    width: "100%",
    padding: 16,
    marginTop: 14,
    borderRadius: 20,
    border: "none",
    background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    color: "#111",
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 16px 44px rgba(255,106,0,.26)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  ctaText: { letterSpacing: -0.2 },
  ctaChev: {
    width: 34,
    height: 34,
    borderRadius: 14,
    background: "rgba(0,0,0,.14)",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },

  secondaryWrap: { marginTop: 12, display: "grid", gap: 10 },
  secBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.88)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  secIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    background: "rgba(15,23,42,.05)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
  },

  trustRow: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  trustPill: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    textAlign: "center",
  },
  trustLabel: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.3, textTransform: "uppercase" },
  trustValue: { marginTop: 6, fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },

  legal: { marginTop: 12, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35, textAlign: "center" },
  legalDot: { opacity: 0.65 },
  legalLink: { border: "none", background: "transparent", color: TEXT, fontWeight: 950, fontSize: 12 },

  bottomRow: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    color: MUTED,
  },
  bottomLink: {
    border: "none",
    background: "transparent",
    color: "rgba(15,23,42,.78)",
    fontWeight: 950,
    fontSize: 12,
    padding: "10px 12px",
    borderRadius: 999,
  },
  bottomDot: { width: 6, height: 6, borderRadius: 999, background: "rgba(255,106,0,.75)" },
};

