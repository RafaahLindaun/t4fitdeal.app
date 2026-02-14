// ✅ COLE EM: src/pages/TreinoDetalhe.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- THEME ---------------- */
const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const INK = "rgba(15,23,42,.86)";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";

/* ---------------- helpers ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function mod(n, m) {
  if (!m) return 0;
  return ((n % m) + m) % m;
}
function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function calcDayIndex(email) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

/* ---------------- banco (MESMO do Treino) ---------------- */
const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps"],
    library: [
      { name: "Supino reto", group: "Peito" },
      { name: "Supino inclinado", group: "Peito" },
      { name: "Crucifixo / Peck-deck", group: "Peito" },
      { name: "Crossover", group: "Peito" },
      { name: "Paralelas (ou mergulho)", group: "Tríceps/Peito" },
      { name: "Tríceps corda", group: "Tríceps" },
      { name: "Tríceps francês", group: "Tríceps" },
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps"],
    library: [
      { name: "Puxada (barra/puxador)", group: "Costas" },
      { name: "Remada (máquina/curvada)", group: "Costas" },
      { name: "Remada unilateral", group: "Costas" },
      { name: "Pulldown braço reto", group: "Costas" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Rosca direta", group: "Bíceps" },
      { name: "Rosca martelo", group: "Bíceps" },
    ],
  },
  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    library: [
      { name: "Agachamento", group: "Pernas" },
      { name: "Leg press", group: "Pernas" },
      { name: "Cadeira extensora", group: "Quadríceps" },
      { name: "Afundo / passada", group: "Glúteo/Quadríceps" },
      { name: "Panturrilha", group: "Panturrilha" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
  {
    id: "posterior_gluteo",
    name: "Posterior + Glúteo",
    muscles: ["Posterior", "Glúteos", "Core"],
    library: [
      { name: "Terra romeno", group: "Posterior" },
      { name: "Mesa flexora", group: "Posterior" },
      { name: "Hip thrust", group: "Glúteo" },
      { name: "Abdução", group: "Glúteo médio" },
      { name: "Passada (foco glúteo)", group: "Glúteo" },
      { name: "Core (dead bug)", group: "Core" },
    ],
  },
  {
    id: "ombro_core",
    name: "Ombro + Core",
    muscles: ["Ombros", "Core"],
    library: [
      { name: "Desenvolvimento", group: "Ombros" },
      { name: "Elevação lateral", group: "Ombros" },
      { name: "Posterior (reverse fly)", group: "Ombro posterior" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Pallof press", group: "Core" },
      { name: "Abdominal", group: "Core" },
    ],
  },
  {
    id: "fullbody",
    name: "Full body (saúde / base)",
    muscles: ["Corpo todo"],
    library: [
      { name: "Agachamento (leve)", group: "Pernas" },
      { name: "Supino (leve)", group: "Peito" },
      { name: "Remada (leve)", group: "Costas" },
      { name: "Desenvolvimento (leve)", group: "Ombros" },
      { name: "Posterior (leve)", group: "Posterior" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
];

function groupById(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || MUSCLE_GROUPS[0];
}

/** garante volume */
function ensureVolume(list, minCount = 7) {
  const base = Array.isArray(list) ? [...list] : [];
  if (base.length >= minCount) return base;

  const extras = [
    { name: "Aquecimento (5–8min)", group: "Preparação" },
    { name: "Alongamento curto", group: "Mobilidade" },
    { name: "Core (prancha)", group: "Core" },
    { name: "Elevação lateral (leve)", group: "Ombros" },
    { name: "Rosca direta (leve)", group: "Bíceps" },
    { name: "Tríceps corda (leve)", group: "Tríceps" },
    { name: "Panturrilha", group: "Panturrilha" },
  ];

  let i = 0;
  while (base.length < minCount && i < extras.length) base.push(extras[i++]);
  return base;
}

function buildCustomPlan(email) {
  const raw = localStorage.getItem(`custom_split_${email}`);
  const custom = safeJsonParse(raw, null);
  if (!custom || !Array.isArray(custom.dayGroups) || custom.dayGroups.length === 0) return null;

  const rawDays = Number(custom.days || custom.dayGroups.length || 3);
  const days = clamp(rawDays, 2, 6);

  const dayGroups = [];
  for (let i = 0; i < days; i++) {
    dayGroups.push(custom.dayGroups[i] || custom.dayGroups[i % custom.dayGroups.length] || "fullbody");
  }

  const prescriptions = custom.prescriptions || {};

  const split = dayGroups.map((gid, idx) => {
    const g = groupById(gid);
    const pres = prescriptions[idx] || { sets: 4, reps: "6–12", rest: "75–120s" };

    const baseList = ensureVolume((g.library || []).slice(0, 9), 7);

    return baseList.map((ex) => ({
      ...ex,
      sets: pres.sets,
      reps: pres.reps,
      rest: pres.rest,
      method: `Split ${custom.splitId || ""} • ${g.name}`,
    }));
  });

  const base = {
    sets: "custom",
    reps: "custom",
    rest: "custom",
    style: `Personalizado • ${custom.splitId || `${days}x/sem`}`,
  };

  return { base, split, meta: { days } };
}

function buildFallbackSplit() {
  const A = [
    { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
    { name: "Supino inclinado", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
    { name: "Tríceps corda", group: "Tríceps", sets: 4, reps: "8–12", rest: "60–90s", method: "Básico" },
    { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "10–15", rest: "60–90s", method: "Básico" },
    { name: "Crucifixo", group: "Peito", sets: 3, reps: "10–15", rest: "60–90s", method: "Básico" },
    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
    { name: "Paralelas", group: "Tríceps/Peito", sets: 3, reps: "8–12", rest: "60–90s", method: "Básico" },
  ];
  const B = [
    { name: "Puxada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
    { name: "Remada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
    { name: "Remada unilateral", group: "Costas", sets: 3, reps: "10–12", rest: "75–120s", method: "Básico" },
    { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "8–12", rest: "60–90s", method: "Básico" },
    { name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "10–12", rest: "60–90s", method: "Básico" },
    { name: "Face pull", group: "Ombro/escápulas", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
    { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45–75s", method: "Básico" },
  ];
  const C = [
    { name: "Agachamento", group: "Pernas", sets: 4, reps: "6–12", rest: "90–150s", method: "Básico" },
    { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "75–120s", method: "Básico" },
    { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–12", rest: "90–150s", method: "Básico" },
    { name: "Cadeira extensora", group: "Quadríceps", sets: 3, reps: "12–15", rest: "60–90s", method: "Básico" },
    { name: "Panturrilha", group: "Panturrilha", sets: 4, reps: "10–15", rest: "45–75s", method: "Básico" },
    { name: "Afundo", group: "Pernas", sets: 3, reps: "10–12", rest: "60–90s", method: "Básico" },
    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
  ];
  return { base: { style: "Padrão", sets: 4, reps: "6–12", rest: "75–120s" }, split: [A, B, C] };
}

/* ---------------- cargas ---------------- */
function loadLoads(email) {
  return safeJsonParse(localStorage.getItem(`loads_${email}`), {});
}
function saveLoads(email, obj) {
  localStorage.setItem(`loads_${email}`, JSON.stringify(obj));
}
function keyForLoad(viewIdx, exName) {
  return `${viewIdx}__${String(exName || "").toLowerCase()}`;
}

/* ---------------- detalhes por nome ---------------- */
function detailFor(exName) {
  const n = String(exName || "").toLowerCase();

  if (n.includes("supino"))
    return { area: "Peitoral, tríceps e deltoide anterior.", cue: "Escápulas firmes. Pés no chão. Desça controlando e suba forte sem perder postura." };
  if (n.includes("crucifixo") || n.includes("peck") || n.includes("crossover"))
    return { area: "Peitoral (isolamento).", cue: "Abra até alongar com segurança. Feche apertando o peito. Controle total na volta." };

  if (n.includes("puxada") || n.includes("pulldown"))
    return { area: "Dorsal e bíceps.", cue: "Peito alto. Cotovelos descem para o lado do corpo. Evite puxar com pescoço." };
  if (n.includes("remada"))
    return { area: "Costas médias/dorsal e estabilização.", cue: "Coluna firme. Puxe com cotovelos. Segure 1s no final. Volte controlando." };
  if (n.includes("face pull"))
    return { area: "Posterior de ombro + escápulas.", cue: "Puxe para o rosto abrindo cotovelos. Ombros baixos. Sem jogar o tronco." };

  if (n.includes("rosca"))
    return { area: "Bíceps e antebraço.", cue: "Cotovelo fixo. Sem roubar com tronco. Suba e desça com controle." };
  if (n.includes("tríceps") || n.includes("triceps"))
    return { area: "Tríceps.", cue: "Cotovelo firme e alinhado. Estenda até o final. Retorne devagar." };
  if (n.includes("paralelas") || n.includes("mergulho"))
    return { area: "Tríceps e peito.", cue: "Desça controlando. Tronco levemente inclinado. Suba sem balançar." };

  if (n.includes("agacha"))
    return { area: "Quadríceps, glúteos e core.", cue: "Joelho acompanha o pé. Tronco firme. Desça controlando e suba forte." };
  if (n.includes("leg press"))
    return { area: "Quadríceps e glúteos.", cue: "Amplitude segura. Não trave joelho. Controle na descida." };
  if (n.includes("terra") || n.includes("romeno"))
    return { area: "Posterior e glúteos.", cue: "Quadril para trás. Coluna neutra. Alongue com controle e suba mantendo postura." };
  if (n.includes("extensora"))
    return { area: "Quadríceps (isolamento).", cue: "Segure 1s em cima. Volte lento sem bater o peso." };
  if (n.includes("flexora"))
    return { area: "Posterior (isolamento).", cue: "Controle total. Segure 1s contraindo. Evite levantar quadril." };
  if (n.includes("panturrilha"))
    return { area: "Panturrilha.", cue: "Pausa em cima e embaixo. Sem quicar. Amplitude completa." };
  if (n.includes("afundo") || n.includes("passada"))
    return { area: "Glúteos e quadríceps.", cue: "Passo firme. Tronco estável. Desça controlando e suba sem tombar." };
  if (n.includes("abdu"))
    return { area: "Glúteo médio.", cue: "Movimento controlado. Sem girar o tronco. Sinta o lado do glúteo." };
  if (n.includes("hip thrust"))
    return { area: "Glúteos.", cue: "Queixo neutro. Suba contraindo. Segure 1s no topo sem hiperextender lombar." };

  if (n.includes("prancha"))
    return { area: "Core e estabilização.", cue: "Glúteo contraído. Barriga firme. Não deixe quadril cair." };
  if (n.includes("abdominal"))
    return { area: "Core.", cue: "Exale subindo. Sem puxar pescoço. Controle a descida." };

  if (n.includes("aquecimento"))
    return { area: "Preparação geral.", cue: "Aqueça leve por 5–8 min. Objetivo é preparar, não cansar." };

  return { area: "Músculos relacionados ao movimento.", cue: "Postura firme. Controle na descida. Execução limpa sem roubar." };
}

function suggestLoadRange(exName, pesoKg, objetivo) {
  const kg = Number(pesoKg || 0) || 70;
  const n = String(exName || "").toLowerCase();
  let base = 0.35;

  if (n.includes("supino")) base = 0.55;
  if (n.includes("agacha")) base = 0.7;
  if (n.includes("leg press")) base = 0.8;
  if (n.includes("remada")) base = 0.5;
  if (n.includes("puxada")) base = 0.45;
  if (n.includes("terra") || n.includes("romeno")) base = 0.75;
  if (n.includes("desenvolvimento")) base = 0.35;
  if (n.includes("elevação lateral") || n.includes("elevacao lateral")) base = 0.12;
  if (n.includes("rosca")) base = 0.2;
  if (n.includes("tríceps") || n.includes("triceps")) base = 0.22;
  if (n.includes("panturrilha")) base = 0.35;

  const goal = String(objetivo || "").toLowerCase();
  const isForca = goal.includes("forc");
  const isHip = goal.includes("hip");
  const mult = isForca ? 1.12 : isHip ? 1.0 : 0.92;

  const mid = kg * base * mult;
  const low = Math.max(2, Math.round(mid * 0.85));
  const high = Math.max(low + 1, Math.round(mid * 1.05));
  return `${low}–${high}kg`;
}

function splitSteps(text) {
  const t = String(text || "").trim();
  if (!t) return [];
  const parts = t
    .replace(/\s*•\s*/g, ". ")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, 7);
}

/* ---------------- icons (sem emoji) ---------------- */
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 6l12 12" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
function IconSets() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.8 8.2h10.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6.8 12h10.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6.8 15.8h10.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.0 18.8h6.4" stroke="rgba(255,106,0,.30)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function IconReps() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 7.6h9.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.2 16.4h9.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.2 9.2c-2 2-2 5.6 0 7.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.8 9.2c2 2 2 5.6 0 7.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 12.2v2.4" stroke="rgba(255,106,0,.30)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function IconRest() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7.2v5.1l3.2 1.7" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20.2a8.2 8.2 0 1 1 8.2-8.2" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20.2 12a8.2 8.2 0 0 1-.9 3.7" stroke="rgba(255,106,0,.30)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function IconGroup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 20h10" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M9 20V8.8c0-.6.3-1.1.8-1.4l1.8-1a1.5 1.5 0 0 1 1.4 0l1.8 1c.5.3.8.8.8 1.4V20"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12h6" stroke="rgba(255,106,0,.30)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- UI components ---------------- */
function MetricChip({ icon, label, value }) {
  return (
    <div style={S.metricChip}>
      <div style={S.metricTop}>
        <span style={S.metricIcon}>{icon}</span>
        <span style={S.metricLabel}>{label}</span>
      </div>

      <div style={S.metricValue}>{value}</div>

      <div style={S.metricSheen} aria-hidden="true" />
    </div>
  );
}

function ActionButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={S.actionBtn} className="td-press">
      <span style={S.actionBtnText}>{children}</span>
      <span style={S.actionBtnIcon} aria-hidden="true">
        <IconArrowRight />
      </span>
      <span style={S.actionBtnSheen} aria-hidden="true" />
    </button>
  );
}

function HowToModal({ open, onClose, title, group, sets, reps, rest, area, cue }) {
  if (!open) return null;
  const steps = splitSteps(cue);

  return (
    <div style={S.modalWrap} role="dialog" aria-modal="true">
      <button style={S.modalBackdrop} onClick={onClose} aria-label="Fechar" type="button" />

      <div style={S.modalCard}>
        <div style={S.modalGlow} aria-hidden="true" />

        <div style={S.modalTop}>
          <div style={{ minWidth: 0 }}>
            <div style={S.modalKicker}>Execução</div>
            <div style={S.modalTitle}>{title}</div>
            <div style={S.modalSub}>{group}</div>
          </div>

          <button type="button" onClick={onClose} style={S.modalClose} aria-label="Fechar" className="td-press">
            <IconClose />
          </button>
        </div>

        <div style={S.modalMetrics}>
          <MetricChip icon={<IconSets />} label="Séries" value={String(sets)} />
          <MetricChip icon={<IconReps />} label="Repetições" value={String(reps)} />
          <MetricChip icon={<IconRest />} label="Descanso" value={String(rest)} />
        </div>

        <div style={S.modalPanelSoft}>
          <div style={S.panelTitle}>Área trabalhada</div>
          <div style={S.panelText}>{area}</div>
        </div>

        <div style={S.modalPanel}>
          <div style={S.panelTitle}>Passo a passo</div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {steps.length ? (
              steps.map((s, i) => (
                <div key={i} style={S.stepRow}>
                  <div style={S.stepDot}>{i + 1}</div>
                  <div style={S.stepText}>{s}</div>
                </div>
              ))
            ) : (
              <div style={S.panelText}>{cue}</div>
            )}
          </div>
        </div>

        <button type="button" onClick={onClose} style={S.modalDone} className="td-press">
          Fechar
        </button>
      </div>
    </div>
  );
}

/* ----------------- Page ----------------- */
export default function TreinoDetalhe() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  // origem do Treino
  const plan = useMemo(() => buildCustomPlan(email), [email]);
  const fallback = useMemo(() => buildFallbackSplit(), []);
  const base = plan?.base || fallback.base;
  const split = plan?.split || fallback.split;

  // dia real
  const dayIndex = useMemo(() => calcDayIndex(email), [email]);

  // dia exibido (?d=)
  const dParam = Number(sp.get("d"));
  const viewIdx = Number.isFinite(dParam) ? dParam : dayIndex;
  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);

  // exercícios do dia (remove aquecimento)
  const workoutRaw = useMemo(() => split[viewSafe] || [], [split, viewSafe]);
  const workout = useMemo(
    () => workoutRaw.filter((ex) => !String(ex?.name || "").toLowerCase().includes("aquecimento")),
    [workoutRaw]
  );

  // cargas
  const [loads, setLoads] = useState(() => loadLoads(email));
  function setLoad(exName, v) {
    const k = keyForLoad(viewSafe, exName);
    const next = { ...loads, [k]: v };
    setLoads(next);
    saveLoads(email, next);
  }

  // preview próximos 3 dias
  const upcoming = useMemo(() => {
    const arr = [];
    for (let k = 1; k <= 3; k++) {
      const idx = (viewSafe + k) % split.length;
      arr.push({ idx, title: `Treino ${dayLetter(idx)}`, count: (split[idx] || []).length });
    }
    return arr;
  }, [viewSafe, split]);

  // modal
  const [howTo, setHowTo] = useState(null);

  // defaults do dia (pra deixar sempre claro no topo)
  const exCount = workout.length;
  const defaultSets = workout[0]?.sets ?? base.sets;
  const defaultReps = workout[0]?.reps ?? base.reps;
  const defaultRest = workout[0]?.rest ?? base.rest;

  // injeta CSS keyframes + micro-interactions
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "treino-detalhe-advanced-keyframes";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes tdFloat {
        0%,100% { transform: translateY(0px); }
        50%     { transform: translateY(-2px); }
      }
      @keyframes tdSheetUp {
        from { transform: translateY(14px); opacity: 0; }
        to   { transform: translateY(0px); opacity: 1; }
      }
      @keyframes tdSheen {
        0%, 35%   { transform: translateX(-70%); opacity: .18; }
        55%, 100% { transform: translateX(140%); opacity: .18; }
      }
      @keyframes tdPulseBorder {
        0%,100% { filter: drop-shadow(0 0 0 rgba(255,106,0,.00)); }
        50%     { filter: drop-shadow(0 16px 28px rgba(255,106,0,.14)); }
      }
      .td-press { transition: transform .12s ease, filter .12s ease; }
      .td-press:active { transform: translateY(1px) scale(.99); filter: brightness(.985); }
      input:focus {
        border-color: rgba(255,106,0,.38) !important;
        box-shadow: 0 0 0 4px rgba(255,106,0,.10), inset 0 1px 0 rgba(255,255,255,.7) !important;
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Treino detalhado bloqueado</div>
          <div style={S.lockText}>Assine para liberar detalhamento, execução e registro de carga.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")} type="button" className="td-press">
            Ver planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* TOP HEADER */}
      <div style={S.head}>
        <div style={S.headGlow} aria-hidden="true" />

        <button style={S.back} onClick={() => nav("/treino")} aria-label="Voltar" type="button" className="td-press">
          <IconChevronLeft />
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={S.hKicker}>Treino detalhado</div>
          <div style={S.hTitle}>Treino {dayLetter(viewSafe)}</div>

          <div style={S.hLine}>
            <span style={S.tagStrong}>{base.style}</span>
            <span style={S.tagSoft}>{exCount} exercícios</span>
          </div>

          {/* ✅ Sempre legível: séries / reps / descanso no topo */}
          <div style={S.dayMetrics}>
            <MetricChip icon={<IconSets />} label="Séries" value={String(defaultSets)} />
            <MetricChip icon={<IconReps />} label="Repetições" value={String(defaultReps)} />
            <MetricChip icon={<IconRest />} label="Descanso" value={String(defaultRest)} />
          </div>

          <div style={S.hMeta}>Toque em “Execução” para ver detalhes e instruções.</div>
        </div>
      </div>

      {/* Próximos dias */}
      <div style={S.nextCard}>
        <div style={S.nextGlow} aria-hidden="true" />

        <div style={S.nextTop}>
          <div style={S.nextTitle}>Próximos dias</div>
          <div style={S.nextNote}>Prévia do ciclo</div>
        </div>

        <div style={S.nextRow}>
          {upcoming.map((d, i) => (
            <div key={i} style={S.nextItem}>
              <div style={S.nextSheen} aria-hidden="true" />
              <div style={S.nextDay}>Dia +{i + 1}</div>
              <div style={S.nextName}>{d.title}</div>
              <div style={S.nextMini}>{d.count} exercícios</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.section}>Exercícios do dia</div>

      <div style={S.list}>
        {workout.map((ex, i) => {
          const det = detailFor(ex.name);

          const peso = user?.peso ?? user?.weight ?? 70;
          const objetivo = user?.objetivo ?? user?.goal ?? "";
          const suggested = suggestLoadRange(ex.name, peso, objetivo);

          const k = keyForLoad(viewSafe, ex.name);
          const myLoad = loads[k] ?? "";

          const sets = ex.sets ?? base.sets;
          const reps = ex.reps ?? base.reps;
          const rest = ex.rest ?? base.rest;

          return (
            <div key={i} style={S.card}>
              <div style={S.cardGlow} aria-hidden="true" />
              <div style={S.cardSheen} aria-hidden="true" />

              <div style={S.cardTop}>
                <div style={S.num}>{i + 1}</div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={S.nameRow}>
                    <div style={S.name}>{ex.name}</div>
                    <div style={S.groupPill}>
                      <span style={{ display: "grid", placeItems: "center" }}>
                        <IconGroup />
                      </span>
                      <span style={S.groupText}>{ex.group}</span>
                    </div>
                  </div>

                  {/* ✅ Corrige “bugado”: grid auto-fit com min width, sempre visível */}
                  <div style={S.metricsGrid}>
                    <MetricChip icon={<IconSets />} label="Séries" value={String(sets)} />
                    <MetricChip icon={<IconReps />} label="Repetições" value={String(reps)} />
                    <MetricChip icon={<IconRest />} label="Descanso" value={String(rest)} />
                  </div>
                </div>

                <div style={S.rightCol}>
                  <ActionButton
                    onClick={() =>
                      setHowTo({
                        name: ex.name,
                        group: ex.group,
                        sets,
                        reps,
                        rest,
                        area: det.area,
                        cue: det.cue,
                      })
                    }
                  >
                    Execução
                  </ActionButton>
                </div>
              </div>

              {/* Carga */}
              <div style={S.loadRow}>
                <div style={S.loadLeft}>
                  <div style={S.loadLabel}>Carga sugerida</div>
                  <div style={S.loadVal}>{suggested}</div>
                  <div style={S.loadHint}>Ajuste para manter forma e controle.</div>
                </div>

                <div style={S.loadRight}>
                  <div style={S.loadLabel}>Sua carga</div>
                  <input
                    value={myLoad}
                    onChange={(e) => setLoad(ex.name, e.target.value)}
                    placeholder="Ex.: 40kg"
                    style={S.input}
                    inputMode="text"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Cardio */}
      <button style={S.cardioGo} onClick={() => nav("/cardio")} type="button" className="td-press">
        <div style={S.cardioGlow} aria-hidden="true" />
        <div style={S.cardioSheen} aria-hidden="true" />

        <div style={S.cardioGoRow}>
          <div style={{ minWidth: 0 }}>
            <div style={S.cardioTop}>Cardio</div>
            <div style={S.cardioSub}>Abrir rotina pós-treino</div>
          </div>

          <div style={S.cardioIcon} aria-hidden="true">
            <IconArrowRight />
          </div>
        </div>

        <div style={S.progressTrack}>
          <div style={S.progressFill} />
        </div>

        <div style={S.cardioMeta}>Rápido, direto e consistente.</div>
      </button>

      <div style={{ height: 140 }} />

      <HowToModal
        open={!!howTo}
        onClose={() => setHowTo(null)}
        title={howTo?.name}
        group={howTo?.group}
        sets={howTo?.sets}
        reps={howTo?.reps}
        rest={howTo?.rest}
        area={howTo?.area}
        cue={howTo?.cue}
      />
    </div>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: {
    padding: 18,
    paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
    background: BG,
  },

  /* Header */
  head: {
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.88))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 20px 80px rgba(15,23,42,.10)",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  headGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(600px 260px at 20% 10%, rgba(255,106,0,.18), transparent 55%), radial-gradient(520px 260px at 92% 0%, rgba(15,23,42,.10), transparent 58%)",
    pointerEvents: "none",
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.72)",
    boxShadow: "0 16px 44px rgba(15,23,42,.08)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  hKicker: {
    fontSize: 11,
    fontWeight: 950,
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.7,
  },
  hLine: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  tagStrong: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.20)",
    fontSize: 12,
    fontWeight: 900,
    color: TEXT,
  },
  tagSoft: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: SOFT,
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 900,
    color: TEXT,
  },
  hMeta: { marginTop: 10, fontSize: 12, color: MUTED, fontWeight: 800, lineHeight: 1.35 },

  dayMetrics: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },

  /* Próximos dias */
  nextCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 16,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 62px rgba(15,23,42,.06)",
    position: "relative",
    overflow: "hidden",
  },
  nextGlow: {
    position: "absolute",
    inset: -40,
    background: "radial-gradient(520px 240px at 30% 0%, rgba(255,106,0,.10), transparent 60%)",
    pointerEvents: "none",
  },
  nextTop: { display: "grid", gap: 4, position: "relative" },
  nextTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  nextNote: { fontSize: 12, fontWeight: 800, color: MUTED },

  nextRow: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  nextItem: {
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.02))",
    border: "1px solid rgba(255,106,0,.14)",
    position: "relative",
    overflow: "hidden",
  },
  nextSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.30) 25%, transparent 55%)",
    transform: "translateX(-70%)",
    animation: "tdSheen 5.2s ease-in-out infinite",
    pointerEvents: "none",
  },
  nextDay: { fontSize: 11, fontWeight: 950, color: MUTED, textTransform: "uppercase" },
  nextName: { marginTop: 6, fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  nextMini: { marginTop: 10, fontSize: 11, fontWeight: 900, color: ORANGE },

  /* Exercícios */
  section: { marginTop: 14, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.7 },
  list: { marginTop: 12, display: "grid", gap: 14 },

  card: {
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,.94))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 70px rgba(15,23,42,.06)",
    position: "relative",
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(600px 240px at 12% 0%, rgba(255,106,0,.12), transparent 60%), radial-gradient(620px 240px at 98% 10%, rgba(15,23,42,.08), transparent 62%)",
    pointerEvents: "none",
  },
  cardSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.22) 22%, transparent 50%)",
    transform: "translateX(-70%)",
    animation: "tdSheen 6.0s ease-in-out infinite",
    pointerEvents: "none",
  },

  cardTop: { display: "flex", gap: 12, alignItems: "flex-start", position: "relative" },
  num: {
    width: 50,
    height: 50,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.98), rgba(255,106,0,.58))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    flexShrink: 0,
    boxShadow: "0 16px 42px rgba(255,106,0,.22)",
    animation: "tdPulseBorder 6.5s ease-in-out infinite",
  },

  nameRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  name: { fontSize: 17, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },

  groupPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 999,
    background: SOFT,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 26px rgba(15,23,42,.05)",
  },
  groupText: { fontSize: 12, fontWeight: 900, color: "#334155" },

  rightCol: { display: "flex", alignItems: "flex-start", flexShrink: 0 },

  metricsGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },

  metricChip: {
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.98))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 34px rgba(15,23,42,.05)",
    minHeight: 78,
    position: "relative",
    overflow: "hidden",
  },
  metricTop: { display: "flex", alignItems: "center", gap: 10 },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 14px 28px rgba(255,106,0,.10)",
    flexShrink: 0,
  },
  metricLabel: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
  metricValue: { marginTop: 10, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.45 },
  metricSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, rgba(255,255,255,.45) 0%, transparent 25%, transparent 70%, rgba(255,255,255,.18) 100%)",
    opacity: 0.42,
    pointerEvents: "none",
  },

  actionBtn: {
    height: 46,
    padding: "0 12px",
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.22)",
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.72))",
    color: TEXT,
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    whiteSpace: "nowrap",
    boxShadow: "0 16px 36px rgba(255,106,0,.14)",
    position: "relative",
    overflow: "hidden",
  },
  actionBtnText: { fontSize: 13, fontWeight: 950 },
  actionBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.70)",
    border: "1px solid rgba(255,255,255,.55)",
    boxShadow: "0 14px 34px rgba(15,23,42,.10)",
  },
  actionBtnSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.32) 25%, transparent 55%)",
    transform: "translateX(-70%)",
    animation: "tdSheen 6.2s ease-in-out infinite",
    pointerEvents: "none",
  },

  loadRow: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "1fr minmax(160px, 220px)",
    gap: 12,
    alignItems: "end",
    position: "relative",
  },
  loadLeft: { minWidth: 0 },
  loadRight: { minWidth: 0 },
  loadLabel: { fontSize: 12, fontWeight: 900, color: MUTED },
  loadVal: { marginTop: 6, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  loadHint: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "#475569", lineHeight: 1.35 },

  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "rgba(255,255,255,.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 12px 26px rgba(15,23,42,.05)",
  },

  /* Cardio CTA */
  cardioGo: {
    marginTop: 14,
    width: "100%",
    borderRadius: 30,
    padding: 18,
    border: "none",
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.20), rgba(255,255,255,.96))",
    boxShadow: "0 22px 80px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: `1px solid ${BORDER}`,
    position: "relative",
    overflow: "hidden",
    animation: "tdFloat 3.6s ease-in-out infinite",
  },
  cardioGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(520px 240px at 20% 10%, rgba(255,106,0,.22), transparent 58%), radial-gradient(520px 240px at 90% 0%, rgba(15,23,42,.12), transparent 60%)",
    pointerEvents: "none",
  },
  cardioSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.34) 25%, transparent 55%)",
    transform: "translateX(-70%)",
    animation: "tdSheen 4.8s ease-in-out infinite",
    pointerEvents: "none",
  },
  cardioGoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, position: "relative" },
  cardioTop: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  cardioSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  cardioIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(255,255,255,.78), rgba(255,255,255,.52))",
    border: "1px solid rgba(255,255,255,.55)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 18px 40px rgba(15,23,42,.12)",
    flexShrink: 0,
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    width: "78%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    boxShadow: "0 12px 28px rgba(255,106,0,.18)",
  },
  cardioMeta: { marginTop: 10, fontSize: 12, fontWeight: 850, color: "#334155", position: "relative" },

  /* Lock */
  lockCard: {
    borderRadius: 26,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,106,0,.08))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 6, fontSize: 13, color: MUTED, fontWeight: 800, lineHeight: 1.4 },
  lockBtn: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 20,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(255,106,0,.22)",
  },

  /* Modal */
  modalWrap: { position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "end center", padding: 14 },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,.60)", border: "none" },
  modalCard: {
    position: "relative",
    width: "min(720px, 100%)",
    borderRadius: 30,
    background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,255,255,.30)",
    boxShadow: "0 38px 150px rgba(2,6,23,.46)",
    padding: 16,
    overflow: "hidden",
    animation: "tdSheetUp .22s ease-out",
  },
  modalGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(620px 260px at 25% 0%, rgba(255,106,0,.18), transparent 60%), radial-gradient(540px 240px at 95% 0%, rgba(15,23,42,.12), transparent 62%)",
    pointerEvents: "none",
  },
  modalTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, position: "relative" },
  modalKicker: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.8, textTransform: "uppercase" },
  modalTitle: { marginTop: 4, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  modalSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED },
  modalClose: {
    width: 44,
    height: 44,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.72)",
    boxShadow: "0 16px 40px rgba(15,23,42,.12)",
    display: "grid",
    placeItems: "center",
  },
  modalMetrics: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  modalPanelSoft: { marginTop: 12, borderRadius: 22, padding: 14, background: "rgba(255,106,0,.10)", border: "1px solid rgba(255,106,0,.20)", position: "relative" },
  modalPanel: { marginTop: 10, borderRadius: 22, padding: 14, background: "rgba(15,23,42,.03)", border: `1px solid ${BORDER}`, position: "relative" },
  panelTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.95 },
  panelText: { marginTop: 6, fontSize: 13, fontWeight: 800, color: "#334155", lineHeight: 1.5 },

  stepRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.14)",
    border: "1px solid rgba(255,106,0,.22)",
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
    flexShrink: 0,
  },
  stepText: { fontSize: 13, fontWeight: 850, color: "#334155", lineHeight: 1.45 },

  modalDone: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 22,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 65px rgba(255,106,0,.22)",
  },
};
