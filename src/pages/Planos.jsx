import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

export default function Planos() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = useMemo(() => localStorage.getItem(`paid_${email}`) === "1", [email]);

  // refs para scroll suave (corrige botão Nutri+ e qualquer deep link)
  const basicRef = useRef(null);
  const nutriRef = useRef(null);

  const [tap, setTap] = useState(null);

  function activateBasic() {
    // SIMULA pagamento do básico (depois troca por Stripe)
    localStorage.setItem(`paid_${email}`, "1");
    const paymentsKey = `payments_${email}`;
    const raw = localStorage.getItem(paymentsKey);
    const list = raw ? JSON.parse(raw) : [];

    list.unshift({
      id: String(Date.now()),
      plan: "Básico",
      price: 12.99,
      at: Date.now(),
      note: "Recorrente (simulado)",
    });

    localStorage.setItem(paymentsKey, JSON.stringify(list.slice(0, 50)));
    nav("/treino");
  }

  function scrollTo(ref) {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ✅ Corrige: /planos#nutri ou /planos?focus=nutri vai direto pra seção certa
  useEffect(() => {
    const hash = (location.hash || "").toLowerCase();
    const qs = new URLSearchParams(location.search || "");
    const focus = (qs.get("focus") || "").toLowerCase();

    if (hash === "#nutri" || focus === "nutri" || focus === "nutri+") {
      setTimeout(() => scrollTo(nutriRef), 60);
      return;
    }
    if (hash === "#basico" || focus === "basico" || focus === "basic") {
      setTimeout(() => scrollTo(basicRef), 60);
    }
  }, [location.hash, location.search]);

  // mini “tabs” no topo (bem Apple)
  function goTab(which) {
    setTap(which);
    setTimeout(() => setTap(null), 140);
    if (which === "basico") scrollTo(basicRef);
    if (which === "nutri") scrollTo(nutriRef);
  }

  return (
    <div className="page" style={styles.page}>
      <div style={styles.bgGlow} />

      {/* HERO */}
      <div style={styles.hero}>
        <div style={styles.heroTop}>
          <button
            type="button"
            onClick={() => nav(-1)}
            style={styles.backMini}
            aria-label="Voltar"
            title="Voltar"
          >
            <ChevronLeft />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={styles.kicker}>Planos</div>
            <div style={styles.title}>Escolha seu acesso</div>
            <div style={styles.sub}>
              Pagamento recorrente. Cancelamento simples, sem burocracia.
            </div>
          </div>
        </div>

        {/* Tabs “glass” */}
        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => goTab("basico")}
            style={{
              ...styles.tab,
              ...(tap === "basico" ? styles.tabTap : null),
            }}
          >
            Básico
          </button>
          <button
            type="button"
            onClick={() => goTab("nutri")}
            style={{
              ...styles.tab,
              ...(tap === "nutri" ? styles.tabTap : null),
            }}
          >
            Nutri+
          </button>
        </div>

        {paid ? (
          <div style={styles.paidBanner}>
            <span style={styles.paidDot} />
            Você já tem o <b>Básico</b> ativo.
            <button type="button" style={styles.paidBtn} onClick={() => nav("/dashboard")}>
              Ir pro dashboard
            </button>
          </div>
        ) : (
          <div style={styles.freeBanner}>
            <span style={styles.lockDot}>🔒</span>
            Você está no modo gratuito. Assine para liberar tudo do treino.
          </div>
        )}
      </div>

      {/* CARD — BÁSICO */}
      <div ref={basicRef} id="basico" style={styles.section}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.tag}>BÁSICO</div>
            <div style={styles.priceWrap}>
              <div style={styles.price}>R$ 12,99</div>
              <div style={styles.per}>/mês</div>
            </div>
          </div>

          <div style={styles.cardTitle}>Treinos personalizados</div>
          <div style={styles.cardNote}>
            Foque no essencial: execução, constância e progressão.
          </div>

          <div style={styles.featureGrid}>
            <Feature icon="✅" title="Treino do dia" text="Rotina clara + progresso no app" />
            <Feature icon="📈" title="Consistência" text="Streak e frequência semanal" />
            <Feature icon="🔥" title="Estimativa kcal" text="Visão rápida de gasto por treino" />
          </div>

          <button
            type="button"
            style={{
              ...styles.primary,
              ...(paid ? styles.primaryDisabled : null),
            }}
            onClick={paid ? () => nav("/dashboard") : activateBasic}
            disabled={paid}
          >
            {paid ? "Já ativado" : "Assinar agora"}
          </button>

          <div style={styles.micro}>
            Ao assinar, o app libera o treino completo e evolução.
          </div>
        </div>
      </div>

      {/* CARD — NUTRI+ */}
      <div ref={nutriRef} id="nutri" style={styles.section}>
        <div style={styles.cardSoft}>
          <div style={styles.cardHeader}>
            <div style={styles.tagSoft}>NUTRI+</div>
            <div style={styles.priceWrap}>
              <div style={styles.price}>R$ 65,99</div>
              <div style={styles.per}>/mês</div>
            </div>
          </div>

          <div style={styles.cardTitle}>Nutrição + Treino (upgrade)</div>
          <div style={styles.cardNote}>
            Para quem quer dieta guiada e evolução completa.
          </div>

          <div style={styles.featureGrid}>
            <Feature icon="🥗" title="Cardápios" text="Rotativos e práticos (em breve)" />
            <Feature icon="🛒" title="Lista de compras" text="Organização automática (em breve)" />
            <Feature icon="💧" title="Hidratação" text="Controle diário (em breve)" />
          </div>

          {/* ✅ BOTÃO CORRIGIDO:
              - aqui ele pode ir pra /nutricao (área), mas também existe scroll certo vindo de fora (#nutri)
          */}
          <button type="button" style={styles.secondary} onClick={() => nav("/nutriplus")}>
            Ver área de nutrição
          </button>

          <div style={styles.micro}>
            Orientação Nutricional.
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <button type="button" style={styles.back} onClick={() => nav("/dashboard")}>
          Voltar
        </button>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function Feature({ icon, title, text }) {
  return (
    <div style={styles.feat}>
      <div style={styles.featIcon}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.featTitle}>{title}</div>
        <div style={styles.featText}>{text}</div>
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="#111"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- styles (Jony Ive-ish: menos ruído, mais respiro, camadas sutis) ---------- */
const styles = {
  page: {
    padding: 18,
    paddingBottom: 120,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.16), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
  },
  bgGlow: {
    position: "absolute",
    inset: -120,
    pointerEvents: "none",
    background:
      "radial-gradient(520px 260px at 86% 6%, rgba(15,23,42,.06), rgba(255,255,255,0) 70%)",
  },

  hero: {
    position: "relative",
    zIndex: 1,
    borderRadius: 26,
    padding: 16,
    background: "rgba(255,255,255,.72)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  heroTop: { display: "flex", gap: 12, alignItems: "flex-start" },

  backMini: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.82)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 34px rgba(15,23,42,.08)",
    flexShrink: 0,
  },

  kicker: { fontSize: 12, fontWeight: 950, color: MUTED },
  title: { marginTop: 6, fontSize: 28, fontWeight: 950, color: TEXT, letterSpacing: -0.8, lineHeight: 1.05 },
  sub: { marginTop: 8, fontSize: 13, color: MUTED, fontWeight: 800, lineHeight: 1.35 },

  tabs: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  tab: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.86)",
    fontWeight: 950,
    color: TEXT,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
    transition: "transform .12s ease",
  },
  tabTap: { transform: "scale(0.985)" },

  paidBanner: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 850,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  paidDot: { width: 10, height: 10, borderRadius: 999, background: ORANGE },
  paidBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    color: TEXT,
    cursor: "pointer",
  },

  freeBanner: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,106,0,.08)",
    border: "1px solid rgba(255,106,0,.18)",
    color: TEXT,
    fontWeight: 850,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  lockDot: { fontSize: 14 },

  section: { position: "relative", zIndex: 1, marginTop: 14 },

  card: {
    borderRadius: 26,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },
  cardSoft: {
    borderRadius: 26,
    padding: 18,
    background:
      "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.03)), rgba(255,255,255,.88)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
  },

  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  tag: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.12)",
    border: "1px solid rgba(255,106,0,.24)",
    color: ORANGE,
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tagSoft: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    border: "1px solid rgba(15,23,42,.10)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  priceWrap: { display: "flex", alignItems: "baseline", gap: 6 },
  price: { fontSize: 28, fontWeight: 950, color: TEXT, letterSpacing: -0.7 },
  per: { fontSize: 12, fontWeight: 900, color: MUTED },

  cardTitle: { marginTop: 12, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  cardNote: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.4 },

  featureGrid: { marginTop: 12, display: "grid", gap: 10 },

  feat: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  featIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.9)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  featTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  featText: { marginTop: 3, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.3 },

  primary: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 60px rgba(255,106,0,.26)",
    cursor: "pointer",
  },
  primaryDisabled: {
    opacity: 0.55,
    boxShadow: "none",
    cursor: "default",
  },
  secondary: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.30)",
    background: "rgba(255,106,0,.12)",
    color: TEXT,
    fontWeight: 950,
    cursor: "pointer",
  },

  micro: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  footer: { position: "relative", zIndex: 1, marginTop: 14 },
  back: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },
};
