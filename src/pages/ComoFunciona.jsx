import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BG = "#f8fafc";

export default function ComoFunciona() {
  const nav = useNavigate();
  const { user } = useAuth();

  const isLogged = !!user;

  const primaryCta = useMemo(() => {
    return isLogged
      ? { label: "Ir para o app", to: "/dashboard" }
      : { label: "Criar minha conta", to: "/" };
  }, [isLogged]);

  function go(to) {
    nav(to);
  }

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      {/* Top bar */}
      <div style={S.topBar}>
        <button type="button" style={S.backMini} onClick={() => nav(-1)} aria-label="Voltar">
          <ChevronLeft />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Como funciona</div>
          <div style={S.title}>Entenda o Fitdeal em 2 minutos</div>
          <div style={S.sub}>
            Treino + nutrição + hábitos, com um fluxo simples. Você escolhe sua meta e o app organiza o resto.
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={S.hero}>
        <div style={S.heroCard}>
          <div style={S.heroTop}>
            <div style={S.heroPill}>VISÃO GERAL</div>
            <div style={S.heroHint}>Rápido, direto, sem bagunça</div>
          </div>

          <div style={S.heroHeadline}>
            Um caminho claro: <span style={{ color: ORANGE }}>meta</span> →{" "}
            <span style={{ color: ORANGE }}>plano</span> → <span style={{ color: ORANGE }}>execução</span>.
          </div>

          <div style={S.heroRow}>
            <MiniStat title="Treinos" value="Rotina do dia" />
            <MiniStat title="Nutrição" value="Refeições e água" />
            <MiniStat title="Evolução" value="Metas e consistência" />
          </div>

          <div style={S.heroActions}>
            <button type="button" style={S.primaryBtn} onClick={() => go(primaryCta.to)}>
              {primaryCta.label}
            </button>

            <button type="button" style={S.ghostBtn} onClick={() => go("/planos")}>
              Ver planos
            </button>
          </div>

          <div style={S.heroFoot}>
            Dica: se você estiver no primeiro acesso, comece respondendo as 3 perguntas do onboarding.
          </div>
        </div>

        {/* “Mock” do app (sem imagens, só shapes bonitos) */}
        <div style={S.mockWrap} aria-hidden="true">
          <div style={S.mockPhone}>
            <div style={S.mockTop} />
            <div style={S.mockHeader}>
              <div style={S.mockLogo}>fitdeal<span style={{ color: ORANGE }}>.</span></div>
              <div style={S.mockChip}>Configuração rápida</div>
            </div>
            <div style={S.mockCard}>
              <div style={S.mockLineLg} />
              <div style={S.mockLineSm} />
              <div style={S.mockBarRow}>
                <div style={{ ...S.mockBar, width: "28%" }} />
                <div style={{ ...S.mockBar, width: "28%", opacity: 0.25 }} />
                <div style={{ ...S.mockBar, width: "28%", opacity: 0.25 }} />
              </div>
              <div style={S.mockChoice} />
              <div style={S.mockChoice} />
              <div style={S.mockChoice} />
            </div>
            <div style={S.mockBottomFade} />
          </div>
        </div>
      </div>

      {/* SEÇÕES */}
      <Section
        eyebrow="1) Configure"
        title="Onboarding: 3 perguntas e pronto"
        desc="Você define objetivo, frequência semanal e nível. Com isso, o app monta um plano inicial coerente e direto."
        bullets={[
          "Objetivo: hipertrofia, saúde, condicionamento, bodybuilding ou powerlifting",
          "Frequência: quantos dias por semana você treina",
          "Nível: iniciante, intermediário ou avançado",
        ]}
        ctas={[
          { label: isLogged ? "Refazer configuração" : "Começar agora", to: isLogged ? "/onboarding" : "/" },
          { label: "Ver planos", to: "/planos" },
        ]}
      />

      <Section
        eyebrow="2) Execute"
        title="Treino do dia, sem enrolação"
        desc="A tela de treino foca em clareza: o que fazer hoje, com progressão e visão do que vem na sequência."
        bullets={[
          "Rotina objetiva: você abre e sabe exatamente o que fazer",
          "Personalização: ajuste do treino quando necessário",
          "Metas: mantenha consistência e acompanhe sua evolução",
        ]}
        ctas={[
          { label: isLogged ? "Ir para treino" : "Entrar e treinar", to: isLogged ? "/treino" : "/" },
          { label: "Definir metas", to: isLogged ? "/metas" : "/planos" },
        ]}
      />

      <Section
        eyebrow="3) Nutrição"
        title="Refeições, variações e hidratação"
        desc="Na nutrição, você encontra ideias práticas de refeição e acompanha água diária. Tudo pensado para ser rápido."
        bullets={[
          "Opções de refeições com trocas e variações por objetivo",
          "Favoritos para repetir o que funciona pra você",
          "Contador de água do dia com botões rápidos",
          "Histórico no calendário para visualizar consistência",
        ]}
        ctas={[
          { label: "Abrir nutrição", to: isLogged ? "/nutricao" : "/planos" },
          { label: "Ver calendário de água", to: isLogged ? "/calendario" : "/planos" },
        ]}
      />

      <Section
        eyebrow="4) Suplementação"
        title="Plano simples por objetivo"
        desc="Uma área organizada para você consultar sugestão de suplementação de forma clara (sem poluir a tela)."
        bullets={[
          "Recomendação por objetivo (ex.: hipertrofia, condicionamento)",
          "Interface limpa com leitura rápida",
          "Acesso direto dentro do fluxo do app",
        ]}
        ctas={[
          { label: "Abrir suplementação", to: isLogged ? "/suplementacao" : "/planos" },
          { label: "Ver planos", to: "/planos" },
        ]}
      />

      <Section
        eyebrow="5) Planos"
        title="O que libera no app"
        desc="Você pode começar básico e evoluir. A ideia é liberar exatamente o que faz sentido para cada fase."
        bullets={[
          "Básico: treinos e evolução",
          "Nutri+: nutrição completa, receitas, favoritos e hidratação",
          "Pagamento recorrente e fluxo simples",
        ]}
        ctas={[
          { label: "Abrir planos", to: "/planos" },
          { label: isLogged ? "Ir ao dashboard" : "Criar conta", to: isLogged ? "/dashboard" : "/" },
        ]}
      />

      {/* CTA final */}
      <div style={S.finalCard}>
        <div style={S.finalTop}>
          <div style={S.finalTitle}>Pronto para começar?</div>
          <div style={S.finalSub}>
            Configure em menos de 2 minutos e tenha um plano claro já no primeiro acesso.
          </div>
        </div>

        <div style={S.finalActions}>
          <button type="button" style={S.primaryBtn} onClick={() => go(primaryCta.to)}>
            {primaryCta.label}
          </button>
          <button type="button" style={S.ghostBtn} onClick={() => go("/planos")}>
            Ver planos
          </button>
        </div>

        <div style={S.finalHint}>
          Se você já tem conta, entre e vá direto ao dashboard.
        </div>
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

/* ---------- components ---------- */
function Section({ eyebrow, title, desc, bullets, ctas }) {
  const nav = useNavigate();
  return (
    <div style={S.section}>
      <div style={S.sectionCard}>
        <div style={S.sectionEyebrow}>{eyebrow}</div>
        <div style={S.sectionTitle}>{title}</div>
        <div style={S.sectionDesc}>{desc}</div>

        <div style={S.bullets}>
          {bullets.map((b, i) => (
            <div key={i} style={S.bulletRow}>
              <div style={S.bulletIcon}>
                <CheckIcon />
              </div>
              <div style={S.bulletText}>{b}</div>
            </div>
          ))}
        </div>

        <div style={S.ctaRow}>
          {ctas.map((c) => (
            <button
              key={c.to + c.label}
              type="button"
              style={c.primary ? S.primaryBtn : S.softBtn}
              onClick={() => nav(c.to)}
            >
              {c.label}
              <span style={{ opacity: 0.7, marginLeft: 8 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div style={S.miniStat}>
      <div style={S.miniStatTop}>{title}</div>
      <div style={S.miniStatVal}>{value}</div>
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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 7 10.5 16.5 4 10"
        stroke="rgba(15,23,42,.82)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- styles (Apple vibe / clean / sem emojis / sem poluição) ---------- */
const S = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    background: BG,
    paddingTop: "calc(16px + env(safe-area-inset-top))",
    paddingLeft: 18,
    paddingRight: 18,
    paddingBottom: 0,
    boxSizing: "border-box",
  },
  bgGlow: {
    position: "absolute",
    inset: -140,
    pointerEvents: "none",
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.16), rgba(248,250,252,0) 60%), radial-gradient(520px 260px at 86% 6%, rgba(15,23,42,.06), rgba(255,255,255,0) 70%)",
    opacity: 0.95,
  },

  topBar: {
    position: "relative",
    zIndex: 1,
    maxWidth: 880,
    margin: "0 auto",
    width: "100%",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
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

  kicker: { fontSize: 12, fontWeight: 900, color: MUTED, letterSpacing: 0.2 },
  title: { marginTop: 6, fontSize: 26, fontWeight: 950, color: TEXT, letterSpacing: -0.9, lineHeight: 1.05 },
  sub: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  hero: {
    position: "relative",
    zIndex: 1,
    maxWidth: 880,
    margin: "0 auto",
    width: "100%",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "1.2fr .8fr",
    alignItems: "stretch",
  },

  heroCard: {
    borderRadius: 26,
    padding: 16,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    overflow: "hidden",
  },

  heroTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroPill: {
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
  heroHint: { fontSize: 12, fontWeight: 850, color: MUTED },

  heroHeadline: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
    lineHeight: 1.25,
  },

  heroRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  miniStat: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  miniStatTop: { fontSize: 11, fontWeight: 900, color: MUTED },
  miniStatVal: { marginTop: 6, fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },

  heroActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  primaryBtn: {
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
  ghostBtn: {
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
  heroFoot: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  // Mock “phone”
  mockWrap: { display: "grid", placeItems: "center" },
  mockPhone: {
    width: "100%",
    maxWidth: 310,
    borderRadius: 30,
    padding: 14,
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 70px rgba(15,23,42,.12)",
    position: "relative",
    overflow: "hidden",
  },
  mockTop: {
    height: 10,
    width: 120,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    margin: "0 auto 10px",
  },
  mockHeader: { display: "grid", gap: 10 },
  mockLogo: { fontSize: 24, fontWeight: 950, color: TEXT, letterSpacing: -0.8, textAlign: "center" },
  mockChip: {
    margin: "0 auto",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
  },
  mockCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 55px rgba(15,23,42,.08)",
  },
  mockLineLg: { height: 14, borderRadius: 999, background: "rgba(15,23,42,.10)", width: "86%" },
  mockLineSm: { height: 10, borderRadius: 999, background: "rgba(15,23,42,.08)", width: "64%", marginTop: 10 },
  mockBarRow: { display: "flex", gap: 10, marginTop: 12 },
  mockBar: { height: 7, borderRadius: 999, background: ORANGE },
  mockChoice: {
    height: 56,
    borderRadius: 18,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    marginTop: 10,
  },
  mockBottomFade: {
    position: "absolute",
    inset: "auto 0 0 0",
    height: 110,
    background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(248,250,252,1))",
    pointerEvents: "none",
  },

  // Sections
  section: {
    position: "relative",
    zIndex: 1,
    maxWidth: 880,
    margin: "12px auto 0",
    width: "100%",
  },
  sectionCard: {
    borderRadius: 26,
    padding: 16,
    background: "rgba(255,255,255,.86)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: MUTED,
    letterSpacing: 0.2,
  },
  sectionTitle: { marginTop: 6, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  sectionDesc: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },

  bullets: { marginTop: 12, display: "grid", gap: 10 },
  bulletRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 18,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  bulletIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
  },
  bulletText: { fontSize: 13, fontWeight: 850, color: TEXT, lineHeight: 1.35 },

  ctaRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  softBtn: {
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

  // Final CTA
  finalCard: {
    position: "relative",
    zIndex: 1,
    maxWidth: 880,
    margin: "12px auto 0",
    width: "100%",
    borderRadius: 26,
    padding: 16,
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.14), rgba(248,250,252,0) 60%), rgba(255,255,255,.86)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  finalTop: { display: "grid", gap: 8 },
  finalTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  finalSub: { fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },
  finalActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  finalHint: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
};

/* Responsivo simples sem CSS externo */
if (typeof window !== "undefined") {
  const mq = window.matchMedia?.("(max-width: 820px)");
  const apply = () => {
    // No mobile, empilha hero em 1 coluna
    if (mq?.matches) {
      S.hero.gridTemplateColumns = "1fr";
    } else {
      S.hero.gridTemplateColumns = "1.2fr .8fr";
    }
  };
  try {
    apply();
    mq?.addEventListener?.("change", apply);
  } catch {}
}
