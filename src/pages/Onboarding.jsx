// ✅ COLE EM: src/pages/Onboarding.jsx
// FIXES:
// 1) Topo encaixado no iPhone (safe-area, width, wrapping, sem “estourar”)
// 2) Some com a barra/abas de baixo durante o onboarding (pra ninguém pular perguntas)
//    - Faz isso adicionando uma classe no <body> e injetando um CSS que esconde seletores comuns de bottom tab

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

const GOALS = [
  { id: "hipertrofia", title: "Hipertrofia", sub: "Ganhar massa / estética" },
  { id: "saude", title: "Saúde & bem-estar", sub: "Rotina leve, postura, energia" },
  { id: "condicionamento", title: "Condicionamento", sub: "Fôlego, resistência, performance" },
  { id: "bodybuilding", title: "Bodybuilding", sub: "Volume alto, foco total estética" },
  { id: "powerlifting", title: "Powerlifting", sub: "Força nos básicos (supino/terra/agacho)" },
];

const LEVELS = [
  { id: "iniciante", title: "Iniciante", sub: "0–3 meses de treino" },
  { id: "intermediario", title: "Intermediário", sub: "3–18 meses" },
  { id: "avancado", title: "Avançado", sub: "18+ meses" },
];

const DAYS = [2, 3, 4, 5];

function buildSplit(goalId, days) {
  const d = Number(days || 3);

  if (goalId === "powerlifting") {
    if (d <= 2) return "AB (Força Full)";
    if (d === 3) return "ABC (Força)";
    if (d === 4) return "ABCD (Força)";
    return "ABCDE (Força)";
  }

  if (goalId === "condicionamento") {
    if (d <= 2) return "AB (Full + Cardio)";
    if (d === 3) return "ABC (Full/Metabólico)";
    if (d === 4) return "Upper/Lower + Metabólico";
    return "ABCDE (Metabólico + Volume)";
  }

  if (goalId === "saude") {
    if (d <= 2) return "AB (Full leve)";
    if (d === 3) return "ABC (Full equilibrado)";
    if (d === 4) return "Upper/Lower (leve)";
    return "ABCDE (leve + mobilidade)";
  }

  // hipertrofia/bodybuilding
  if (d <= 2) return "AB (Full)";
  if (d === 3) return "ABC";
  if (d === 4) return "ABCD";
  return "ABCDE";
}

function intensityFrom(levelId, goalId) {
  if (goalId === "saude") return levelId === "iniciante" ? "baixa" : "moderada";
  if (goalId === "condicionamento") return levelId === "iniciante" ? "moderada" : "alta";
  if (goalId === "powerlifting") return levelId === "iniciante" ? "moderada" : "alta";
  if (goalId === "bodybuilding") return levelId === "iniciante" ? "moderada" : "alta";
  return levelId === "iniciante" ? "moderada" : "alta";
}

export default function Onboarding() {
  const nav = useNavigate();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(user?.objetivo || "");
  const [days, setDays] = useState(user?.frequencia || "");
  const [level, setLevel] = useState(user?.nivel || "");

  const split = useMemo(() => buildSplit(goal || "hipertrofia", days || 3), [goal, days]);
  const intensity = useMemo(() => intensityFrom(level || "iniciante", goal || "hipertrofia"), [level, goal]);

  // ✅ Esconde a bottom tab enquanto estiver no onboarding
  useEffect(() => {
    const cls = "onboarding-mode";
    document.body.classList.add(cls);

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-onboarding-hide-tabs", "1");
    styleEl.textContent = `
      body.${cls} { overflow-x: hidden; }
      body.${cls} #bottom-nav,
      body.${cls} .bottom-nav,
      body.${cls} .bottomNav,
      body.${cls} .tabbar,
      body.${cls} .tabBar,
      body.${cls} .tabs,
      body.${cls} .bottom-tabs,
      body.${cls} .bottomTabs,
      body.${cls} .bottomBar,
      body.${cls} nav[aria-label="Bottom navigation"],
      body.${cls} nav[aria-label="Navegação inferior"],
      body.${cls} footer[role="navigation"],
      body.${cls} .app-bottom-nav,
      body.${cls} .appBottomNav {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.body.classList.remove(cls);
      styleEl.remove();
    };
  }, []);

  function next() {
    if (step === 1 && !goal) return;
    if (step === 2 && !days) return;
    if (step === 3 && !level) return;
    setStep((s) => Math.min(3, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function finish() {
    if (!goal || !days || !level) return;
    updateUser({
      objetivo: goal,
      frequencia: Number(days),
      nivel: level,
      split,
      intensidade: intensity,
      onboarded: true,
    });
    nav("/treino", { replace: true });
  }

  const stepTitle =
    step === 1 ? "1) Qual é sua meta?" : step === 2 ? "2) Quantos dias por semana?" : "3) Seu nível atual?";

  return (
    <div className="page" style={styles.page}>
      <div style={styles.bgGlow} />

      {/* Conteúdo central (limite de largura só pra ficar “Apple”, mas sem cortar no mobile) */}
      <div style={styles.container}>
        {/* TOP */}
        <div style={styles.top}>
          <div style={styles.kicker}>Configuração rápida</div>

          <div style={styles.titleWrap}>
            <div style={styles.title}>Defina seu caminho</div>
          </div>

          <div style={styles.sub}>3 perguntas para montar seu treino</div>

          {/* PROGRESS (barrinhas, estilo screenshot) */}
          <div style={styles.progressRow} aria-label={`Etapa ${step} de 3`}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: step >= n ? "100%" : "0%",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* STEP CARD */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>{stepTitle}</div>

          {step === 1 ? (
            <div style={styles.grid}>
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  style={{
                    ...styles.choice,
                    ...(goal === g.id ? styles.choiceOn : styles.choiceOff),
                  }}
                >
                  <div style={styles.choiceTitle}>{g.title}</div>
                  <div style={styles.choiceSub}>{g.sub}</div>
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div style={styles.daysRow}>
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    style={{
                      ...styles.dayBtn,
                      ...(Number(days) === d ? styles.dayOn : styles.dayOff),
                    }}
                  >
                    {d}x
                  </button>
                ))}
              </div>

              <div style={styles.preview}>
                <div style={styles.previewLine}>
                  Split sugerido: <b>{split}</b>
                </div>
                <div style={styles.previewLine}>
                  Intensidade: <b>{intensity}</b>
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div style={styles.grid}>
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    style={{
                      ...styles.choice,
                      ...(level === l.id ? styles.choiceOn : styles.choiceOff),
                    }}
                  >
                    <div style={styles.choiceTitle}>{l.title}</div>
                    <div style={styles.choiceSub}>{l.sub}</div>
                  </button>
                ))}
              </div>

              <div style={styles.bigPreview}>
                <div style={styles.bigTitle}>Seu plano inicial</div>
                <div style={styles.bigLine}>
                  Meta: <b>{labelGoal(goal)}</b> • Frequência: <b>{days || "—"}x</b>
                </div>
                <div style={styles.bigLine}>
                  Split: <b>{split}</b> • Intensidade: <b>{intensity}</b>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div style={{ height: 18 }} />
      </div>

      {/* ACTIONS (sticky, sem depender de bottom nav) */}
      <div style={styles.actionsWrap}>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={back}
            style={{ ...styles.btn, ...styles.btnGhost }}
            disabled={step === 1}
          >
            Voltar
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              style={{ ...styles.btn, ...styles.btnMain }}
              disabled={(step === 1 && !goal) || (step === 2 && !days)}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              style={{ ...styles.btn, ...styles.btnMain }}
              disabled={!goal || !days || !level}
            >
              Concluir
            </button>
          )}
        </div>

        {/* espaço seguro iOS */}
        <div style={styles.safeBottom} />
      </div>
    </div>
  );
}

/* helpers UI */
function labelGoal(goal) {
  const g = GOALS.find((x) => x.id === goal);
  return g?.title || "—";
}

/* ---------- styles (Apple vibe / iPhone safe-area / sem overflow) ---------- */
const styles = {
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

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 560,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  top: {
    marginBottom: 14,
    paddingTop: 6,
  },
  kicker: { fontSize: 12, fontWeight: 900, color: MUTED, letterSpacing: 0.2 },
  titleWrap: { minWidth: 0, maxWidth: "100%" },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.9,
    lineHeight: 1.05,
    wordBreak: "break-word",
  },
  sub: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  // progress (3 barras)
  progressRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    background: "rgba(15,23,42,.10)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: ORANGE,
    transition: "width .2s ease",
  },

  card: {
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 55px rgba(15,23,42,.06)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, marginBottom: 12 },

  grid: { display: "grid", gap: 10 },

  choice: {
    width: "100%",
    textAlign: "left",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "#fff",
    transition: "transform .12s ease, background .12s ease, border .12s ease",
    minWidth: 0,
  },
  choiceOn: {
    background: ORANGE_SOFT,
    border: "1px solid rgba(255,106,0,.38)",
    transform: "scale(0.99)",
  },
  choiceOff: { background: "#fff" },

  choiceTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  choiceSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.25 },

  daysRow: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 },
  dayBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    fontSize: 14,
    background: "#fff",
    minWidth: 0,
  },
  dayOn: { background: ORANGE, color: "#111", border: "none" },
  dayOff: { background: "#fff", color: TEXT },

  preview: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
  },
  previewLine: { fontSize: 13, fontWeight: 800, color: TEXT, lineHeight: 1.45 },

  bigPreview: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "#0B0B0C",
    color: "#fff",
    boxShadow: "0 18px 60px rgba(0,0,0,.22)",
  },
  bigTitle: { fontSize: 14, fontWeight: 950, opacity: 0.92 },
  bigLine: { marginTop: 6, fontSize: 13, fontWeight: 800, opacity: 0.95, lineHeight: 1.4 },

  // Sticky actions
  actionsWrap: {
    position: "sticky",
    bottom: 0,
    zIndex: 5,
    width: "100%",
    left: 0,
    right: 0,
    marginTop: 10,
    paddingTop: 10,
    background: "linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,.92) 35%, rgba(248,250,252,1))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  actions: {
    maxWidth: 560,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    paddingLeft: 0,
    paddingRight: 0,
  },
  btn: {
    padding: 14,
    borderRadius: 18,
    border: "none",
    fontWeight: 950,
    cursor: "pointer",
  },
  btnGhost: { background: "#fff", border: "1px solid rgba(15,23,42,.10)", color: TEXT },
  btnMain: { background: ORANGE, color: "#111", boxShadow: "0 16px 40px rgba(255,106,0,.25)" },

  safeBottom: { height: "calc(12px + env(safe-area-inset-bottom))" },
};
