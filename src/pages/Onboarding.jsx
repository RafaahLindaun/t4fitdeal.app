// ✅ COLE EM: src/pages/Onboarding.jsx
import { useMemo, useState } from "react";
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
  // simples e estável
  if (goalId === "saude") return levelId === "iniciante" ? "baixa" : "moderada";
  if (goalId === "condicionamento") return levelId === "iniciante" ? "moderada" : "alta";
  if (goalId === "powerlifting") return levelId === "iniciante" ? "moderada" : "alta";
  if (goalId === "bodybuilding") return levelId === "iniciante" ? "moderada" : "alta";
  return levelId === "iniciante" ? "moderada" : "alta"; // hipertrofia
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

  return (
    <div className="page" style={styles.page}>
      <div style={styles.top}>
        <div style={styles.kicker}>Configuração rápida</div>
        <div style={styles.title}>Defina seu caminho</div>
        <div style={styles.sub}>3 perguntas para montar seu treino</div>
      </div>

      {/* PROGRESS */}
      <div style={styles.progressRow}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              ...styles.dot,
              ...(step >= n ? styles.dotOn : styles.dotOff),
            }}
          />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>1) Qual é sua meta?</div>
          <div style={styles.grid}>
            {GOALS.map((g) => (
              <button
                key={g.id}
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
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>2) Quantos dias por semana?</div>
          <div style={styles.daysRow}>
            {DAYS.map((d) => (
              <button
                key={d}
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
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>3) Seu nível atual?</div>
          <div style={styles.grid}>
            {LEVELS.map((l) => (
              <button
                key={l.id}
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
              Meta: <b>{goal || "—"}</b> • Frequência: <b>{days || "—"}x</b>
            </div>
            <div style={styles.bigLine}>
              Split: <b>{split}</b> • Intensidade: <b>{intensity}</b>
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div style={styles.actions}>
        <button onClick={back} style={{ ...styles.btn, ...styles.btnGhost }} disabled={step === 1}>
          Voltar
        </button>

        {step < 3 ? (
          <button
            onClick={next}
            style={{ ...styles.btn, ...styles.btnMain }}
            disabled={(step === 1 && !goal) || (step === 2 && !days)}
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={finish}
            style={{ ...styles.btn, ...styles.btnMain }}
            disabled={!goal || !days || !level}
          >
            Concluir
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop: 24, paddingBottom: 120, background: BG },
  top: { marginBottom: 12 },
  kicker: { fontSize: 12, fontWeight: 900, color: MUTED },
  title: { marginTop: 6, fontSize: 30, fontWeight: 950, color: TEXT, letterSpacing: -0.8 },
  sub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED },

  progressRow: { display: "flex", gap: 8, marginTop: 10, marginBottom: 14 },
  dot: { height: 8, borderRadius: 999, flex: 1 },
  dotOn: { background: ORANGE },
  dotOff: { background: "rgba(15,23,42,.10)" },

  card: {
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 55px rgba(15,23,42,.06)",
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, marginBottom: 12 },

  grid: { display: "grid", gap: 10 },
  choice: {
    textAlign: "left",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    transition: "transform .12s ease, background .12s ease, border .12s ease",
  },
  choiceOn: {
    background: ORANGE_SOFT,
    border: `1px solid rgba(255,106,0,.38)`,
    transform: "scale(0.99)",
  },
  choiceOff: { background: "#fff" },
  choiceTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  choiceSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  daysRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  dayBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    fontSize: 14,
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
  },
  bigTitle: { fontSize: 14, fontWeight: 950, opacity: 0.9 },
  bigLine: { marginTop: 6, fontSize: 13, fontWeight: 800, opacity: 0.95, lineHeight: 1.4 },

  actions: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  btn: { padding: 14, borderRadius: 18, border: "none", fontWeight: 950 },
  btnGhost: { background: "#fff", border: "1px solid rgba(15,23,42,.10)", color: TEXT },
  btnMain: { background: ORANGE, color: "#111", boxShadow: "0 16px 40px rgba(255,106,0,.25)" },
};
