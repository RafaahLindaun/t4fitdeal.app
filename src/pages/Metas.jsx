// ✅ COLE EM: src/pages/Metas.jsx
// Metas simples + “Apple vibe”
// - você escolhe metas prontas (frequência / PR / peso / cardio)
// - ao ativar, salva em localStorage e o Dashboard consegue mostrar “balões”
//   lendo em: active_goals_<email>

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function normalizeNumber(v) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function labelFromGoal(g) {
  if (!g) return "";
  if (g.type === "freq") return `${g.value} dias de frequência`;
  if (g.type === "pr") return `${g.value} kg no ${g.exercise}`;
  if (g.type === "peso") return `${g.value} kg de peso-alvo`;
  if (g.type === "cardio") return `${g.value} sessões de cardio/sem`;
  return g.title || "Meta";
}

function iconFromGoal(g) {
  if (!g) return "🎯";
  if (g.type === "freq") return "📅";
  if (g.type === "pr") return "🏋️";
  if (g.type === "peso") return "⚖️";
  if (g.type === "cardio") return "🏃";
  return "🎯";
}

/* ---- catálogo simples (fácil de entender) ---- */
const GOALS_CATALOG = [
  {
    id: "g_freq_30",
    type: "freq",
    title: "Frequência",
    subtitle: "Consistência",
    value: 30,
    accent: "soft",
  },
  {
    id: "g_freq_60",
    type: "freq",
    title: "Frequência",
    subtitle: "Disciplina",
    value: 60,
    accent: "orange",
  },
  {
    id: "g_freq_90",
    type: "freq",
    title: "Frequência",
    subtitle: "Transformação",
    value: 90,
    accent: "soft",
  },

  {
    id: "g_pr_supino_50",
    type: "pr",
    title: "PR — Supino",
    subtitle: "Força no peito",
    exercise: "Supino",
    value: 50,
    accent: "orange",
  },
  {
    id: "g_pr_supino_60",
    type: "pr",
    title: "PR — Supino",
    subtitle: "Meta forte",
    exercise: "Supino",
    value: 60,
    accent: "soft",
  },
  {
    id: "g_pr_agacho_80",
    type: "pr",
    title: "PR — Agachamento",
    subtitle: "Base de pernas",
    exercise: "Agachamento",
    value: 80,
    accent: "soft",
  },

  {
    id: "g_cardio_3",
    type: "cardio",
    title: "Cardio",
    subtitle: "Saúde e corte",
    value: 3,
    accent: "soft",
  },
  {
    id: "g_cardio_5",
    type: "cardio",
    title: "Cardio",
    subtitle: "Turbo no shape",
    value: 5,
    accent: "orange",
  },
];

export default function Metas() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const storageKey = `active_goals_${email}`;

  const initial = useMemo(() => safeJsonParse(localStorage.getItem(storageKey), []), [storageKey]);
  const [active, setActive] = useState(Array.isArray(initial) ? initial : []);

  // custom PR simples
  const [customKg, setCustomKg] = useState("");
  const [customEx, setCustomEx] = useState("Supino");

  function persist(next) {
    setActive(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function isActive(catalogId) {
    return active.some((g) => g.catalogId === catalogId);
  }

  function toggleCatalogGoal(item) {
    const on = isActive(item.id);

    if (on) {
      const next = active.filter((g) => g.catalogId !== item.id);
      return persist(next);
    }

    const goal = {
      id: uid(),
      catalogId: item.id,
      type: item.type,
      value: item.value,
      exercise: item.exercise,
      title: item.title,
      createdAt: Date.now(),
    };

    const next = [goal, ...active].slice(0, 12);
    persist(next);
  }

  function removeGoal(goalId) {
    const next = active.filter((g) => g.id !== goalId);
    persist(next);
  }

  function addCustomPR() {
    const kg = normalizeNumber(customKg);
    const ex = String(customEx || "").trim();
    if (!ex || kg <= 0) return;

    const goal = {
      id: uid(),
      catalogId: null,
      type: "pr",
      value: kg,
      exercise: ex,
      title: "PR",
      createdAt: Date.now(),
    };

    const next = [goal, ...active].slice(0, 12);
    persist(next);
    setCustomKg("");
  }

  return (
    <div style={S.page}>
      {/* header */}
      <div style={S.head}>
        <button style={S.back} onClick={() => nav("/dashboard")} aria-label="Voltar">
          ←
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.hTitle}>Metas</div>
          <div style={S.hSub}>Toque para ativar. As metas aparecem no Dashboard.</div>
        </div>

        <button style={S.goDash} onClick={() => nav("/dashboard")}>
          Dashboard
        </button>
      </div>

      {/* ACTIVE BUBBLES */}
      <div style={S.sectionTitle}>Ativas</div>

      {active.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={S.emptyBig}>Sem metas ativas.</div>
          <div style={S.emptySmall}>Escolhe uma meta abaixo e ela vai virar um balão no Dashboard.</div>
        </div>
      ) : (
        <div style={S.activeWrap}>
          {active.map((g) => (
            <div key={g.id} style={S.activePill}>
              <div style={S.pillIcon}>{iconFromGoal(g)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={S.pillText}>{labelFromGoal(g)}</div>
                <div style={S.pillSub}>No dashboard agora</div>
              </div>
              <button style={S.pillX} onClick={() => removeGoal(g.id)} aria-label="Remover">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* QUICK PICK */}
      <div style={S.sectionTitle}>Escolha rápida</div>
      <div style={S.grid}>
        {GOALS_CATALOG.map((item) => {
          const on = isActive(item.id);
          const isOrange = item.accent === "orange";

          return (
            <button
              key={item.id}
              style={{
                ...S.goalCard,
                ...(isOrange ? S.goalOrange : S.goalSoft),
                ...(on ? S.goalOn : null),
              }}
              onClick={() => toggleCatalogGoal(item)}
            >
              <div style={S.goalTop}>
                <div style={S.goalIcon}>{item.type === "freq" ? "📅" : item.type === "pr" ? "🏋️" : item.type === "cardio" ? "🏃" : "🎯"}</div>
                <div style={{ marginLeft: "auto", ...S.toggleDot, ...(on ? S.toggleOn : S.toggleOff) }} />
              </div>

              <div style={S.goalTitle}>{item.type === "freq" ? `${item.value} dias` : item.type === "pr" ? `${item.value} kg` : `${item.value}x/sem`}</div>
              <div style={S.goalSub}>
                {item.type === "pr" ? item.exercise : item.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* CUSTOM PR (mínimo e intuitivo) */}
      <div style={S.sectionTitle}>Meta personalizada</div>
      <div style={S.customCard}>
        <div style={S.customTop}>
          <div style={S.customTitle}>PR (força)</div>
          <div style={S.customHint}>Ex: “50 kg no supino”</div>
        </div>

        <div style={S.customRow}>
          <div style={{ flex: 1 }}>
            <div style={S.label}>Exercício</div>
            <select style={S.select} value={customEx} onChange={(e) => setCustomEx(e.target.value)}>
              <option>Supino</option>
              <option>Agachamento</option>
              <option>Levantamento terra</option>
              <option>Remada</option>
              <option>Desenvolvimento</option>
              <option>Rosca direta</option>
            </select>
          </div>

          <div style={{ width: 130 }}>
            <div style={S.label}>Kg</div>
            <input
              style={S.input}
              value={customKg}
              onChange={(e) => setCustomKg(e.target.value)}
              inputMode="decimal"
              placeholder="50"
            />
          </div>
        </div>

        <button style={S.addBtn} onClick={addCustomPR}>
          Adicionar meta
        </button>
      </div>

      {/* CTA */}
      <button style={S.cta} onClick={() => nav("/dashboard")}>
        <div style={S.ctaRow}>
          <div>
            <div style={S.ctaTitle}>Ver no Dashboard</div>
            <div style={S.ctaSub}>Seus balões aparecem lá na hora.</div>
          </div>
          <div style={S.ctaIcon}>›</div>
        </div>
        <div style={S.ctaTrack}>
          <div style={S.ctaFill} />
        </div>
      </button>

      <div style={{ height: 120 }} />
    </div>
  );
}

/* ----------------- styles (apple simples) ----------------- */
const S = {
  page: { padding: 18, paddingBottom: 130, background: BG },

  head: {
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "rgba(255,106,0,.14)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
  },
  hTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  hSub: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: 800, lineHeight: 1.35 },
  goDash: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 950,
    color: TEXT,
  },

  sectionTitle: { marginTop: 14, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },

  emptyCard: {
    marginTop: 10,
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  emptyBig: { fontSize: 14, fontWeight: 950, color: TEXT },
  emptySmall: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  activeWrap: { marginTop: 10, display: "grid", gap: 10 },
  activePill: {
    borderRadius: 22,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.90))",
    border: "1px solid rgba(255,106,0,.20)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pillIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.85)",
    border: "1px solid rgba(15,23,42,.06)",
    flexShrink: 0,
    fontSize: 18,
  },
  pillText: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  pillSub: { marginTop: 3, fontSize: 12, fontWeight: 800, color: MUTED },
  pillX: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },

  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  goalCard: {
    border: "none",
    borderRadius: 22,
    padding: 14,
    textAlign: "left",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    borderTop: "1px solid rgba(255,255,255,.60)",
    transition: "transform .12s ease",
  },
  goalSoft: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
  },
  goalOrange: {
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,106,0,.18)",
  },
  goalOn: {
    boxShadow: "0 16px 55px rgba(255,106,0,.16)",
    transform: "translateY(-1px)",
  },
  goalTop: { display: "flex", alignItems: "center", gap: 10 },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
  },
  toggleDot: { width: 14, height: 14, borderRadius: 999 },
  toggleOn: { background: ORANGE, boxShadow: "0 10px 24px rgba(255,106,0,.25)" },
  toggleOff: { background: "rgba(15,23,42,.14)" },

  goalTitle: { marginTop: 10, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  goalSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED },

  customCard: {
    marginTop: 10,
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  customTop: { display: "grid", gap: 4 },
  customTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  customHint: { fontSize: 12, fontWeight: 800, color: MUTED },

  customRow: { marginTop: 12, display: "flex", gap: 10, alignItems: "end" },
  label: { fontSize: 12, fontWeight: 900, color: MUTED },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "#fff",
  },
  select: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "#fff",
  },
  addBtn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },

  cta: {
    marginTop: 14,
    width: "100%",
    border: "none",
    borderRadius: 26,
    padding: 16,
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.20), rgba(255,255,255,.95))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: "1px solid rgba(15,23,42,.06)",
  },
  ctaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  ctaTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  ctaSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 950,
    color: "#111",
    boxShadow: "0 14px 34px rgba(255,106,0,.22)",
    flexShrink: 0,
  },
  ctaTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
  },
  ctaFill: {
    height: "100%",
    width: "78%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
  },
};
