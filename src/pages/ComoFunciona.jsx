import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";

const TEXT = "#0f172a";

const MUTED = "#64748b";

const BG = "#f8fafc";

const BORDER = "rgba(15,23,42,.08)";

export default function ComoFunciona() {

  const nav = useNavigate();

  const { user } = useAuth();

  const isLogged = !!user;

  const primaryCta = useMemo(() => {

    return isLogged

      ? { label: "Ir para o app", to: "/dashboard" }

      : { label: "Criar conta", to: "/" };

  }, [isLogged]);

  return (

    <div style={S.page}>

      <style>{`

        .fitdeal-how-page {

          min-height: 100dvh;

          overflow-x: hidden;

          overflow-y: auto;

          -webkit-overflow-scrolling: touch;

        }

        .fitdeal-how-main {

          width: 100%;

          max-width: 760px;

          margin: 0 auto;

          position: relative;

          z-index: 2;

        }

        .fitdeal-how-actions {

          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 10px;

        }

        .fitdeal-how-steps {

          display: grid;

          gap: 12px;

          margin-top: 14px;

        }

        @media (max-width: 520px) {

          .fitdeal-how-actions {

            grid-template-columns: 1fr;

          }

        }

        button {

          font-family: inherit;

          -webkit-tap-highlight-color: transparent;

          cursor: pointer;

        }

        button:active {

          transform: scale(.985);

        }

      `}</style>

      <div style={S.bgOne} />

      <div style={S.bgTwo} />

      <main className="fitdeal-how-page fitdeal-how-main">

        <header style={S.header}>

          <button type="button" style={S.backBtn} onClick={() => nav(-1)} aria-label="Voltar">

            <ChevronLeft />

          </button>

          <div style={S.headerText}>

            <div style={S.kicker}>Como funciona</div>

            <h1 style={S.title}>O FitDeal organiza seu treino de forma simples.</h1>

            <p style={S.subtitle}>

              Você configura seu perfil, recebe um plano e acompanha sua evolução pelo app.

            </p>

          </div>

        </header>

        <section style={S.hero}>

          <div style={S.logoText}>

            fitdeal<span style={{ color: ORANGE }}>.</span>

          </div>

          <p style={S.heroText}>

            O app foi feito para você não se perder: treino do dia, metas, cardio,

            nutrição e hidratação ficam em um fluxo direto.

          </p>

          <div className="fitdeal-how-actions" style={{ marginTop: 18 }}>

            <button type="button" style={S.primaryBtn} onClick={() => nav(primaryCta.to)}>

              {primaryCta.label}

            </button>

            <button type="button" style={S.secondaryBtn} onClick={() => nav("/planos")}>

              Ver planos

            </button>

          </div>

        </section>

        <section className="fitdeal-how-steps">

          <StepCard

            number="1"

            title="Configure seu perfil"

            text="Informe objetivo, nível e frequência semanal. Isso cria a base do seu plano."

          />

          <StepCard

            number="2"

            title="Siga o treino do dia"

            text="O app mostra o treino atual, exercícios, cargas e progresso da semana."

          />

          <StepCard

            number="3"

            title="Acompanhe sua evolução"

            text="Consistência, metas, cardio, kcal e histórico ajudam você a manter o ritmo."

          />

          <StepCard

            number="4"

            title="Use Nutri+ se quiser mais controle"

            text="No Nutri+, você libera nutrição, hidratação e recursos extras para rotina alimentar."

          />

        </section>

        <section style={S.plansCard}>

          <div style={S.sectionMini}>Planos</div>

          <h2 style={S.sectionTitle}>Qual plano libera o quê?</h2>

          <div style={S.planList}>

            <PlanRow title="Gratuito" text="Prévia do treino e acesso inicial ao app." />

            <PlanRow title="Básico" text="Treino completo, progresso e personalização." />

            <PlanRow title="Nutri+" text="Tudo do Básico + nutrição, hidratação e recursos premium." />

          </div>

          <button type="button" style={S.fullBtn} onClick={() => nav("/planos")}>

            Comparar planos

          </button>

        </section>

        <section style={S.finalCard}>

          <h2 style={S.finalTitle}>Pronto para começar?</h2>

          <p style={S.finalText}>

            Em poucos minutos você configura o app e já entra no seu primeiro treino.

          </p>

          <div className="fitdeal-how-actions" style={{ marginTop: 14 }}>

            <button type="button" style={S.primaryBtn} onClick={() => nav(primaryCta.to)}>

              {primaryCta.label}

            </button>

            <button type="button" style={S.secondaryBtn} onClick={() => nav(-1)}>

              Voltar

            </button>

          </div>

        </section>

        <div style={{ height: 34 }} />

      </main>

    </div>

  );

}

function StepCard({ number, title, text }) {

  return (

    <article style={S.stepCard}>

      <div style={S.stepNumber}>{number}</div>

      <div style={{ minWidth: 0 }}>

        <h2 style={S.stepTitle}>{title}</h2>

        <p style={S.stepText}>{text}</p>

      </div>

    </article>

  );

}

function PlanRow({ title, text }) {

  return (

    <div style={S.planRow}>

      <div style={S.planDot} />

      <div>

        <div style={S.planTitle}>{title}</div>

        <div style={S.planText}>{text}</div>

      </div>

    </div>

  );

}

function ChevronLeft() {

  return (

    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path

        d="M15 18l-6-6 6-6"

        stroke="#111"

        strokeWidth="2.7"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}

const S = {

  page: {

    minHeight: "100dvh",

    width: "100%",

    background:

      "radial-gradient(620px 320px at 18% -8%, rgba(255,106,0,.13), rgba(255,255,255,0) 62%), linear-gradient(180deg, #fbfcff 0%, #f7f9fc 100%)",

    color: TEXT,

    position: "relative",

    overflowX: "hidden",

    boxSizing: "border-box",

    padding: "18px 14px 0",

  },

  bgOne: {

    position: "absolute",

    width: 280,

    height: 280,

    borderRadius: 999,

    background: "rgba(255,106,0,.08)",

    filter: "blur(60px)",

    top: -110,

    left: -120,

    pointerEvents: "none",

  },

  bgTwo: {

    position: "absolute",

    width: 240,

    height: 240,

    borderRadius: 999,

    background: "rgba(15,23,42,.045)",

    filter: "blur(60px)",

    top: 180,

    right: -130,

    pointerEvents: "none",

  },

  header: {

    display: "flex",

    alignItems: "flex-start",

    gap: 12,

    marginBottom: 14,

  },

  backBtn: {

    width: 44,

    height: 44,

    borderRadius: 16,

    border: `1px solid ${BORDER}`,

    background: "rgba(255,255,255,.88)",

    display: "grid",

    placeItems: "center",

    boxShadow: "0 12px 30px rgba(15,23,42,.07)",

    flexShrink: 0,

  },

  headerText: {

    minWidth: 0,

    flex: 1,

  },

  kicker: {

    fontSize: 12,

    fontWeight: 900,

    color: ORANGE,

    textTransform: "uppercase",

    letterSpacing: 0.8,

  },

  title: {

    margin: "6px 0 0",

    fontSize: 27,

    fontWeight: 950,

    letterSpacing: -0.9,

    lineHeight: 1.07,

    color: TEXT,

  },

  subtitle: {

    margin: "9px 0 0",

    fontSize: 14,

    fontWeight: 750,

    lineHeight: 1.42,

    color: MUTED,

  },

  hero: {

    borderRadius: 28,

    padding: 20,

    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.94) 62%)",

    border: "1px solid rgba(255,106,0,.15)",

    boxShadow: "0 18px 50px rgba(15,23,42,.08)",

    boxSizing: "border-box",

  },

  logoText: {

    fontSize: 34,

    fontWeight: 950,

    letterSpacing: -1.2,

    color: "#020617",

    lineHeight: 1,

  },

  heroText: {

    margin: "14px 0 0",

    fontSize: 15,

    fontWeight: 800,

    lineHeight: 1.45,

    color: MUTED,

  },

  primaryBtn: {

    minHeight: 48,

    borderRadius: 17,

    border: "none",

    background: "linear-gradient(135deg, #FF6A00, #FF7A22)",

    color: "#111",

    fontSize: 14,

    fontWeight: 950,

    boxShadow: "0 16px 36px rgba(255,106,0,.26)",

    padding: "0 15px",

  },

  secondaryBtn: {

    minHeight: 48,

    borderRadius: 17,

    border: `1px solid ${BORDER}`,

    background: "rgba(255,255,255,.90)",

    color: TEXT,

    fontSize: 14,

    fontWeight: 950,

    boxShadow: "0 12px 30px rgba(15,23,42,.06)",

    padding: "0 15px",

  },

  stepCard: {

    borderRadius: 24,

    padding: 16,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 36px rgba(15,23,42,.06)",

    display: "grid",

    gridTemplateColumns: "48px 1fr",

    gap: 13,

    alignItems: "flex-start",

    boxSizing: "border-box",

  },

  stepNumber: {

    width: 48,

    height: 48,

    borderRadius: 18,

    background: "rgba(255,106,0,.12)",

    border: "1px solid rgba(255,106,0,.18)",

    color: ORANGE,

    display: "grid",

    placeItems: "center",

    fontSize: 18,

    fontWeight: 950,

    boxSizing: "border-box",

  },

  stepTitle: {

    margin: 0,

    fontSize: 17,

    fontWeight: 950,

    letterSpacing: -0.3,

    color: TEXT,

  },

  stepText: {

    margin: "6px 0 0",

    fontSize: 13.5,

    fontWeight: 750,

    lineHeight: 1.38,

    color: MUTED,

  },

  plansCard: {

    marginTop: 14,

    borderRadius: 26,

    padding: 18,

    background: "rgba(255,255,255,.92)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 36px rgba(15,23,42,.06)",

    boxSizing: "border-box",

  },

  sectionMini: {

    fontSize: 12,

    fontWeight: 950,

    color: ORANGE,

    textTransform: "uppercase",

    letterSpacing: 0.7,

  },

  sectionTitle: {

    margin: "7px 0 0",

    fontSize: 20,

    fontWeight: 950,

    letterSpacing: -0.5,

    color: TEXT,

  },

  planList: {

    marginTop: 14,

    display: "grid",

    gap: 10,

  },

  planRow: {

    display: "grid",

    gridTemplateColumns: "12px 1fr",

    gap: 10,

    alignItems: "flex-start",

    padding: 13,

    borderRadius: 18,

    background: "rgba(15,23,42,.03)",

    border: `1px solid ${BORDER}`,

  },

  planDot: {

    width: 10,

    height: 10,

    borderRadius: 999,

    background: ORANGE,

    marginTop: 4,

    boxShadow: "0 0 0 5px rgba(255,106,0,.11)",

  },

  planTitle: {

    fontSize: 14,

    fontWeight: 950,

    color: TEXT,

  },

  planText: {

    marginTop: 3,

    fontSize: 12.5,

    fontWeight: 750,

    lineHeight: 1.35,

    color: MUTED,

  },

  fullBtn: {

    width: "100%",

    minHeight: 48,

    marginTop: 14,

    borderRadius: 17,

    border: "none",

    background: TEXT,

    color: "#fff",

    fontSize: 14,

    fontWeight: 950,

    boxShadow: "0 16px 34px rgba(15,23,42,.16)",

  },

  finalCard: {

    marginTop: 14,

    borderRadius: 26,

    padding: 18,

    background: "linear-gradient(135deg, #0B0B0C, #171717)",

    border: "1px solid rgba(255,106,0,.20)",

    boxShadow: "0 20px 54px rgba(15,23,42,.18)",

    boxSizing: "border-box",

  },

  finalTitle: {

    margin: 0,

    fontSize: 21,

    fontWeight: 950,

    letterSpacing: -0.5,

    color: "#fff",

  },

  finalText: {

    margin: "8px 0 0",

    fontSize: 13.5,

    fontWeight: 750,

    lineHeight: 1.4,

    color: "rgba(255,255,255,.68)",

  },

};
