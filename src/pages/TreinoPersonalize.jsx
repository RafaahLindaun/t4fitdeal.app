import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const BLACK = "#0B0B0C";

const SPLITS = [
  { id: "AB", days: 2, label: "AB" },
  { id: "ABC", days: 3, label: "ABC" },
  { id: "ABCD", days: 4, label: "ABCD" },
  { id: "ABCDE", days: 5, label: "ABCDE" },
  { id: "ABCDEF", days: 6, label: "ABCDEF" },
];

const METHODS = [
  {
    id: "normal",
    label: "Normal",
    short: "Base",
    hint: "Séries tradicionais com descanso completo.",
    note: "Método padrão. Melhor para técnica, progressão de carga e segurança.",
  },
  {
    id: "biset",
    label: "Biset",
    short: "2 exercícios",
    hint: "2 exercícios em sequência.",
    note: "Faça o exercício atual e o próximo antes de descansar. Use com cargas moderadas.",
  },
  {
    id: "triset",
    label: "Triset",
    short: "3 exercícios",
    hint: "3 exercícios em sequência.",
    note: "Faça três exercícios seguidos antes do descanso. Bom para intensidade e tempo curto.",
  },
  {
    id: "dropset",
    label: "Dropset",
    short: "Reduz carga",
    hint: "Falhou, reduz carga e continua.",
    note: "Após a última série, reduza 20–35% da carga e continue com boa execução.",
  },
];

const EXERCISE_CATALOG = {
  peito: [
    "Supino reto com barra",
    "Supino reto com halteres",
    "Supino inclinado com barra",
    "Supino inclinado com halteres",
    "Supino declinado",
    "Supino máquina",
    "Supino inclinado máquina",
    "Crucifixo reto com halteres",
    "Crucifixo inclinado com halteres",
    "Peck-deck",
    "Crossover na polia (alto)",
    "Crossover na polia (médio)",
    "Crossover na polia (baixo)",
    "Flexão de braço tradicional",
    "Flexão inclinada (banco)",
    "Flexão declinada (pé elevado)",
    "Flexão com pegada fechada",
    "Pullover com halter",
    "Pullover na polia",
    "Squeeze press (halter)",
    "Supino com pausa (controle)",
    "Chest press unilateral",
    "Crossover unilateral",
    "Isometria de peitoral na polia",
  ],
  triceps: [
    "Tríceps corda",
    "Tríceps barra reta",
    "Tríceps barra V",
    "Tríceps francês (halter)",
    "Tríceps francês unilateral",
    "Tríceps testa (barra W)",
    "Tríceps testa (halter)",
    "Tríceps banco (mergulho)",
    "Mergulho nas paralelas (assistido)",
    "Mergulho nas paralelas (livre)",
    "Tríceps coice (halter)",
    "Tríceps na polia acima da cabeça (corda)",
    "Tríceps na polia acima da cabeça (barra)",
    "Skull crusher no banco inclinado",
    "Supino fechado (barra)",
    "Supino fechado (halter)",
    "Tríceps no cross unilateral",
    "Extensão de tríceps no cabo sentado",
    "Extensão de tríceps com elástico",
    "Kickback no cabo",
    "Diamond push-up (flexão diamante)",
    "Tríceps máquina (press)",
    "Tríceps com pegada reversa no cabo",
    "Extensão de tríceps na polia deitado",
  ],
  costas: [
    "Puxada frente (puxador)",
    "Puxada neutra (triângulo)",
    "Puxada supinada",
    "Puxada unilateral no cabo",
    "Barra fixa pronada",
    "Barra fixa supinada",
    "Remada baixa no cabo",
    "Remada baixa neutra",
    "Remada unilateral com halter",
    "Remada curvada com barra",
    "Remada curvada com halteres",
    "Remada máquina (hammer)",
    "Remada articulada (serrote máquina)",
    "Remada cavalinho (T-bar)",
    "Pulldown braço reto",
    "Pullover na polia (costas)",
    "Remada alta no cabo",
    "Encolhimento (pegada aberta) para trapézio",
    "Face pull (escápulas/postura)",
    "Remada no smith",
    "Remada no banco inclinado (halter)",
    "Good morning leve (técnica/postura)",
    "Hiperextensão lombar",
    "Pull-up assistido",
  ],
  biceps: [
    "Rosca direta (barra)",
    "Rosca direta (barra W)",
    "Rosca alternada (halter)",
    "Rosca martelo (halter)",
    "Rosca martelo cruzada",
    "Rosca concentrada",
    "Rosca Scott (barra)",
    "Rosca Scott (halter)",
    "Rosca Scott (máquina)",
    "Rosca na polia (barra)",
    "Rosca na polia (corda)",
    "Rosca 21",
    "Rosca inclinada (halter)",
    "Rosca spider",
    "Rosca reversa (barra)",
    "Rosca reversa (halter)",
    "Rosca Zottman",
    "Rosca no cabo unilateral",
    "Rosca bayesian (cabo atrás)",
    "Rosca em pé com elástico",
    "Chin-up (barra supinada)",
    "Rosca no banco inclinado unilateral",
    "Rosca martelo no cabo",
    "Isometria de bíceps (90 graus)",
  ],
  quadriceps: [
    "Agachamento livre",
    "Agachamento no smith",
    "Agachamento frontal",
    "Agachamento goblet",
    "Leg press 45°",
    "Leg press horizontal",
    "Hack squat",
    "Cadeira extensora",
    "Passada caminhando",
    "Afundo no smith",
    "Afundo com halteres",
    "Bulgarian split squat",
    "Step-up (banco)",
    "Agachamento sumô leve",
    "Sissy squat (controle)",
    "Agachamento com pausa",
    "Leg press (pés baixos)",
    "Agachamento na caixa",
    "Cadeira abdutora (apoio de quadril)",
    "Cadeira adutora",
    "Lunge reverso",
    "Agachamento no TRX (iniciante)",
    "Wall sit (isometria)",
    "Extensora unilateral",
  ],
  posterior: [
    "Terra romeno (barra)",
    "Stiff com halteres",
    "Mesa flexora",
    "Cadeira flexora",
    "Flexora unilateral",
    "Levantamento terra (técnica)",
    "Good morning (leve)",
    "Hiperextensão",
    "Nordic curl (assistido)",
    "Ponte de posterior no solo",
    "Pull-through no cabo",
    "Deadlift romeno unilateral",
    "Swing com kettlebell (leve)",
    "Flexão de joelho no cabo (unilateral)",
    "Glute ham raise (assistido)",
    "Stiff no smith",
    "Terra romeno no cabo",
    "Hiperextensão com foco glúteo/posterior",
    "Flexora sentada",
    "Curl de posterior com elástico",
    "Isometria de posterior (ponte)",
    "RDL com pausa",
    "Mesa flexora com drop-set (avançado)",
    "Flexora 1.5 reps",
  ],
  gluteo: [
    "Hip thrust (barra)",
    "Hip thrust (máquina)",
    "Glute bridge",
    "Glute bridge unilateral",
    "Abdução na máquina",
    "Abdução no cabo (unilateral)",
    "Passada (foco glúteo)",
    "Bulgarian (foco glúteo)",
    "Agachamento sumô",
    "Pull-through no cabo",
    "Kickback no cabo",
    "Kickback na máquina",
    "Step-up alto (glúteo)",
    "Extensão de quadril no banco",
    "Levantamento terra romeno (ênfase glúteo)",
    "Agachamento no smith (pés à frente)",
    "Elevação pélvica com pausa",
    "Lunge reverso longo",
    "Abdução com elástico",
    "Caminhada lateral com elástico",
    "Frog pumps",
    "Hip thrust unilateral (halter)",
    "Kickback com elástico",
    "Isometria glúteo (ponte 30–60s)",
  ],
  panturrilha: [
    "Panturrilha em pé na máquina",
    "Panturrilha sentado",
    "Panturrilha no leg press",
    "Panturrilha unilateral em pé",
    "Panturrilha unilateral sentado",
    "Panturrilha no smith",
    "Panturrilha com halter (em degrau)",
    "Panturrilha no hack squat",
    "Panturrilha no step (peso corpo)",
    "Panturrilha com pausa em alongamento",
    "Panturrilha com pausa no pico",
    "Panturrilha isométrica (pico)",
    "Panturrilha no leg press unilateral",
    "Panturrilha no banco (improvisado)",
    "Panturrilha com elástico",
    "Panturrilha em pé com barra",
    "Panturrilha 1.5 reps",
    "Panturrilha sentado 1.5 reps",
    "Panturrilha dropset (avançado)",
    "Panturrilha em tempo (3-1-2)",
    "Panturrilha com amplitude máxima",
    "Panturrilha na máquina inclinada",
    "Panturrilha no step com carga",
    "Panturrilha no smith unilateral",
  ],
  ombro: [
    "Desenvolvimento com halteres",
    "Desenvolvimento com barra",
    "Desenvolvimento máquina",
    "Arnold press",
    "Elevação lateral",
    "Elevação lateral no cabo",
    "Elevação lateral sentado",
    "Elevação frontal (halter)",
    "Elevação frontal (barra)",
    "Elevação frontal no cabo",
    "Reverse fly (posterior)",
    "Reverse fly na máquina",
    "Face pull",
    "Remada alta (barra leve)",
    "Remada alta no cabo",
    "Crucifixo inverso no cabo",
    "Landmine press",
    "Desenvolvimento unilateral no cabo",
    "Y-raise (leve)",
    "W-raise (postura)",
    "Trap 3 raise",
    "Isometria lateral (30s)",
    "Desenvolvimento com pausa",
    "Elevação lateral 1.5 reps",
  ],
  core: [
    "Prancha",
    "Prancha lateral",
    "Dead bug",
    "Hollow hold",
    "Abdominal infra (elevação de pernas)",
    "Abdominal infra (banco)",
    "Abdominal na polia",
    "Crunch",
    "Crunch na bola",
    "Bicicleta no solo",
    "Russian twist",
    "Pallof press",
    "Woodchopper (cabo)",
    "Mountain climber (controlado)",
    "Bird dog",
    "Plank com toque no ombro",
    "Prancha com elevação de perna",
    "Farmer carry (core)",
    "Suitcase carry (core)",
    "V-up (avançado)",
    "Toe touches",
    "Rollout (ab wheel)",
    "Abdominal máquina",
    "Isometria anti-rotação (cabo)",
  ],
};

const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps", "Ombro ant."],
    default: { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" },
    pickerKeys: ["peito", "triceps", "ombro"],
    library: [
      { name: "Supino reto", group: "Peito" },
      { name: "Supino inclinado", group: "Peito" },
      { name: "Crucifixo / Peck-deck", group: "Peito" },
      { name: "Crossover", group: "Peito" },
      { name: "Tríceps corda", group: "Tríceps" },
      { name: "Tríceps francês", group: "Tríceps" },
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps", "Ombro post."],
    default: { sets: 4, reps: "8–12", rest: "75–120s", method: "normal" },
    pickerKeys: ["costas", "biceps", "ombro"],
    library: [
      { name: "Puxada (barra/puxador)", group: "Costas" },
      { name: "Remada (máquina/curvada)", group: "Costas" },
      { name: "Remada unilateral", group: "Costas" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Rosca direta", group: "Bíceps" },
      { name: "Rosca martelo", group: "Bíceps" },
    ],
  },
  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    default: { sets: 4, reps: "8–15", rest: "75–150s", method: "normal" },
    pickerKeys: ["quadriceps", "gluteo", "panturrilha", "core"],
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
    default: { sets: 4, reps: "8–12", rest: "75–150s", method: "normal" },
    pickerKeys: ["posterior", "gluteo", "core"],
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
    muscles: ["Ombros", "Trapézio", "Core"],
    default: { sets: 3, reps: "10–15", rest: "60–90s", method: "normal" },
    pickerKeys: ["ombro", "core"],
    library: [
      { name: "Desenvolvimento", group: "Ombros" },
      { name: "Elevação lateral", group: "Ombros" },
      { name: "Posterior (reverse)", group: "Ombro posterior" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Pallof press", group: "Core" },
      { name: "Abdominal", group: "Core" },
    ],
  },
  {
    id: "fullbody",
    name: "Full body (seguro / saúde)",
    muscles: ["Corpo todo"],
    default: { sets: 3, reps: "10–15", rest: "45–90s", method: "normal" },
    pickerKeys: ["quadriceps", "peito", "costas", "ombro", "posterior", "gluteo", "core", "panturrilha"],
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

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

function pickDefaultSplit(days) {
  if (days <= 2) return ["fullbody", "fullbody"];
  if (days === 3) return ["peito_triceps", "costas_biceps", "pernas"];
  if (days === 4) return ["peito_triceps", "pernas", "costas_biceps", "posterior_gluteo"];
  if (days === 5) return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo"];
  return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo", "fullbody"];
}

function calcWeeklyVolume(daysConfig) {
  const volume = {};
  for (const day of daysConfig) {
    const sets = Number(day?.prescription?.sets || 0) || 0;
    const g = day?.groupObj;
    if (!g) continue;
    const muscles = Array.isArray(g.muscles) ? g.muscles : [];
    const share = muscles.length ? sets / muscles.length : 0;
    for (const m of muscles) volume[m] = (volume[m] || 0) + share;
  }

  const out = {};
  Object.keys(volume).forEach((k) => {
    out[k] = Math.round(volume[k] * 10) / 10;
  });
  return out;
}

function prettyKeyLabel(k) {
  const map = {
    peito: "Peito",
    triceps: "Tríceps",
    costas: "Costas",
    biceps: "Bíceps",
    quadriceps: "Quadríceps",
    posterior: "Posterior",
    gluteo: "Glúteo",
    panturrilha: "Panturrilha",
    ombro: "Ombro",
    core: "Core",
  };
  return map[k] || k;
}

function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr || []) {
    const key = String(x || "").trim();
    if (!key || s.has(key)) continue;
    s.add(key);
    out.push(key);
  }
  return out;
}

function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function parsePrescriptionFromReps(raw, fallback) {
  const text = String(raw || "");
  let sets = fallback?.sets ?? 4;
  let reps = fallback?.reps ?? "6–12";
  let rest = fallback?.rest ?? "75–120s";
  let method = fallback?.method ?? "normal";

  const setsMatch = text.match(/(\d+)\s*s[ée]ries/i);
  const repsMatch = text.match(/s[ée]ries\s*•\s*([^•]+)/i);
  const restMatch = text.match(/descanso\s*([^•]+)/i);
  const methodMatch = text.match(/m[ée]todo\s*([^•]+)/i);

  if (setsMatch) sets = clamp(Number(setsMatch[1] || sets), 1, 8);
  if (repsMatch) reps = String(repsMatch[1] || reps).trim();
  if (restMatch) rest = String(restMatch[1] || rest).trim();
  if (methodMatch) method = normalizeMethod(methodMatch[1]);

  return { sets, reps, rest, method };
}

function normalizeMethod(value) {
  const key = normalizeText(value).replace(/[^a-z0-9]+/g, "_");
  if (key.includes("biset")) return "biset";
  if (key.includes("triset")) return "triset";
  if (key.includes("drop")) return "dropset";
  return "normal";
}

function methodLabel(method) {
  return METHODS.find((m) => m.id === method)?.label || "Normal";
}

function defaultExercisesForGroup(groupId) {
  const g = MUSCLE_GROUPS.find((x) => x.id === groupId);
  return uniq((g?.library || []).map((x) => x.name)).slice(0, 8);
}

function findExerciseGroup(name) {
  const target = normalizeText(name);
  for (const [key, list] of Object.entries(EXERCISE_CATALOG)) {
    if ((list || []).some((item) => normalizeText(item) === target)) return key;
  }
  return null;
}

function makeExerciseRows(keys, query) {
  const q = normalizeText(query);
  const rows = [];
  for (const key of keys || []) {
    const list = EXERCISE_CATALOG[key] || [];
    for (const name of list) {
      if (q && !normalizeText(name).includes(q)) continue;
      rows.push({ name, key, group: prettyKeyLabel(key) });
    }
  }

  const seen = new Set();
  return rows.filter((row) => {
    const id = `${row.key}_${row.name}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function LoadingScreen({ onBack }) {
  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={onBack} type="button">←</button>
      <div style={S.loadingCard}>
        <div style={S.loadingDot} />
        <div style={S.loadingTitle}>Carregando personalização</div>
        <div style={S.loadingText}>Buscando seu plano atual no Supabase.</div>
      </div>
    </div>
  );
}

export default function TreinoPersonalize() {
  const nav = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;

  const defaultDays = clamp(Number(user?.frequencia || 4) || 4, 2, 6);
  const defaultSplitId = defaultDays === 2 ? "AB" : defaultDays === 3 ? "ABC" : defaultDays === 4 ? "ABCD" : defaultDays === 5 ? "ABCDE" : "ABCDEF";

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [paid, setPaid] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [saving, setSaving] = useState(false);

  const [daysPerWeek, setDaysPerWeek] = useState(defaultDays);
  const [splitId, setSplitId] = useState(defaultSplitId);
  const [dayGroups, setDayGroups] = useState(() => pickDefaultSplit(defaultDays));
  const [prescriptions, setPrescriptions] = useState(() => {
    const obj = {};
    const baseGroups = pickDefaultSplit(defaultDays);
    for (let i = 0; i < baseGroups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === baseGroups[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" };
    }
    return obj;
  });
  const [dayExercises, setDayExercises] = useState(() => {
    const out = {};
    const baseGroups = pickDefaultSplit(defaultDays);
    for (let i = 0; i < defaultDays; i++) out[i] = defaultExercisesForGroup(baseGroups[i]);
    return out;
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(0);

  useEffect(() => {
    document.body.classList.add("fitdeal-hide-bottom-menu");
    return () => document.body.classList.remove("fitdeal-hide-bottom-menu");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      if (!userId) {
        if (active) {
          setPaid(false);
          setLoadingAccess(false);
        }
        return;
      }

      setLoadingAccess(true);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("plan_key,status")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!active) return;

      if (error) {
        console.error("TreinoPersonalize access error:", error);
        setPaid(false);
      } else {
        const row = Array.isArray(data) ? data[0] : null;
        const allowed =
          ["active", "trialing"].includes(String(row?.status || "").toLowerCase()) &&
          ["basico", "premium", "nutri"].includes(String(row?.plan_key || "").toLowerCase());
        setPaid(!!allowed);
      }

      setLoadingAccess(false);
    }

    loadAccess();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function loadPlanFromDb() {
      if (!userId || !paid) {
        if (active) setLoadingPlan(false);
        return;
      }

      setLoadingPlan(true);

      const { data: plans, error: planError } = await supabase
        .from("workout_plans")
        .select("id, split_label, split_len, updated_at, created_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (!active) return;

      if (planError) {
        console.error("TreinoPersonalize plan error:", planError);
        setLoadingPlan(false);
        return;
      }

      const plan = Array.isArray(plans) ? plans[0] : null;
      if (!plan?.id) {
        setLoadingPlan(false);
        return;
      }

      const { data: planDays, error: daysError } = await supabase
        .from("workout_plan_days")
        .select("id, day_index, day_key, group_id, group_name")
        .eq("plan_id", plan.id)
        .order("day_index", { ascending: true });

      if (!active) return;

      if (daysError) {
        console.error("TreinoPersonalize plan days error:", daysError);
        setLoadingPlan(false);
        return;
      }

      const dayIds = (planDays || []).map((d) => d.id);
      let exercises = [];

      if (dayIds.length) {
        const { data: exData, error: exError } = await supabase
          .from("workout_plan_exercises")
          .select("plan_day_id, exercise_order, name, reps, notes")
          .in("plan_day_id", dayIds)
          .order("exercise_order", { ascending: true });

        if (exError) console.error("TreinoPersonalize exercises error:", exError);
        else exercises = exData || [];
      }

      if (!active) return;

      const splitLen = clamp(Number(plan.split_len || planDays?.length || defaultDays), 2, 6);
      const nextSplitId = SPLITS.find((s) => s.days === splitLen)?.id || defaultSplitId;
      const nextGroups = pickDefaultSplit(splitLen);
      const nextPrescriptions = {};
      const nextExercises = {};

      for (let i = 0; i < splitLen; i++) {
        const row = (planDays || []).find((d) => Number(d.day_index) === i);
        const groupId = row?.group_id && MUSCLE_GROUPS.some((g) => g.id === row.group_id) ? row.group_id : nextGroups[i];
        nextGroups[i] = groupId;

        const groupObj = MUSCLE_GROUPS.find((g) => g.id === groupId);
        const baseDefault = groupObj?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" };
        const exRows = row
          ? exercises
              .filter((ex) => ex.plan_day_id === row.id)
              .sort((a, b) => Number(a.exercise_order || 0) - Number(b.exercise_order || 0))
          : [];

        nextPrescriptions[i] = exRows[0]?.reps ? parsePrescriptionFromReps(exRows[0].reps, baseDefault) : baseDefault;
        nextExercises[i] = exRows.length ? uniq(exRows.map((ex) => ex.name)) : defaultExercisesForGroup(groupId);
      }

      setDaysPerWeek(splitLen);
      setSplitId(nextSplitId);
      setDayGroups(nextGroups);
      setPrescriptions(nextPrescriptions);
      setDayExercises(nextExercises);
      setLoadingPlan(false);
    }

    loadPlanFromDb();
    return () => {
      active = false;
    };
  }, [userId, paid, defaultDays, defaultSplitId]);

  function ensureDaysConfig(nextDays) {
    const n = clamp(nextDays, 2, 6);
    const defaults = pickDefaultSplit(n);

    setDayGroups((prev) => {
      const base = Array.isArray(prev) ? [...prev] : [];
      if (base.length < n) return [...base, ...defaults.slice(base.length)];
      return base.slice(0, n);
    });

    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      for (let i = 0; i < n; i++) {
        if (!out[i]) {
          const gid = (Array.isArray(dayGroups) && dayGroups[i]) || defaults[i];
          const g = MUSCLE_GROUPS.find((x) => x.id === gid);
          out[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" };
        }
      }
      Object.keys(out).forEach((k) => {
        if (Number(k) >= n) delete out[k];
      });
      return out;
    });

    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      for (let i = 0; i < n; i++) {
        if (!Array.isArray(out[i])) {
          const gid = (Array.isArray(dayGroups) && dayGroups[i]) || defaults[i];
          out[i] = defaultExercisesForGroup(gid);
        }
      }
      Object.keys(out).forEach((k) => {
        if (Number(k) >= n) delete out[k];
      });
      return out;
    });
  }

  function changeSplit(nextSplitId) {
    setSplitId(nextSplitId);
    const d = SPLITS.find((s) => s.id === nextSplitId)?.days || daysPerWeek;
    setDaysPerWeek(d);
    ensureDaysConfig(d);
  }

  function changeDays(d) {
    const next = clamp(d, 2, 6);
    setDaysPerWeek(next);
    const map = next === 2 ? "AB" : next === 3 ? "ABC" : next === 4 ? "ABCD" : next === 5 ? "ABCDE" : "ABCDEF";
    setSplitId(map);
    ensureDaysConfig(next);
  }

  function setDayGroup(dayIndex, groupId) {
    const g = MUSCLE_GROUPS.find((x) => x.id === groupId);

    setDayGroups((prev) => {
      const arr = [...(Array.isArray(prev) ? prev : [])];
      arr[dayIndex] = groupId;
      return arr;
    });

    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" };
      return out;
    });

    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = defaultExercisesForGroup(groupId);
      return out;
    });
  }

  function setPrescription(dayIndex, patch) {
    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = { ...(out[dayIndex] || {}), ...patch };
      return out;
    });
  }

  const daysConfig = useMemo(() => {
    const n = clamp(daysPerWeek, 2, 6);
    const arr = [];

    for (let i = 0; i < n; i++) {
      const gid = dayGroups[i] || pickDefaultSplit(n)[i];
      const groupObj = MUSCLE_GROUPS.find((x) => x.id === gid);
      arr.push({
        dayIndex: i,
        letter: dayLetter(i),
        groupId: gid,
        groupObj,
        prescription: prescriptions[i] || groupObj?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" },
        chosenExercises: Array.isArray(dayExercises?.[i]) ? dayExercises[i] : [],
      });
    }

    return arr;
  }, [daysPerWeek, dayGroups, prescriptions, dayExercises]);

  const weeklyVolume = useMemo(() => calcWeeklyVolume(daysConfig), [daysConfig]);

  async function save() {
    if (!userId || saving) return;

    try {
      setSaving(true);

      const normalizedDays = daysConfig.map((day) => ({
        ...day,
        prescription: {
          ...(day.prescription || {}),
          sets: clamp(Number(day.prescription?.sets || 4), 1, 8),
          reps: day.prescription?.reps || "6–12",
          rest: day.prescription?.rest || "75–120s",
          method: normalizeMethod(day.prescription?.method || "normal"),
        },
        chosenExercises: uniq(day.chosenExercises || []),
      }));

      const { data: currentPlans, error: planError } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (planError) throw planError;

      let planRow = Array.isArray(currentPlans) ? currentPlans[0] : null;

      if (!planRow?.id) {
        const { data: insertedPlan, error: insertPlanError } = await supabase
          .from("workout_plans")
          .insert({
            user_id: userId,
            title: "Plano atual",
            split_label: splitId,
            split_len: daysPerWeek,
            is_active: true,
            source: "custom",
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertPlanError) throw insertPlanError;
        planRow = insertedPlan;
      } else {
        const { error: updatePlanError } = await supabase
          .from("workout_plans")
          .update({
            title: "Plano atual",
            split_label: splitId,
            split_len: daysPerWeek,
            is_active: true,
            source: "custom",
            updated_at: new Date().toISOString(),
          })
          .eq("id", planRow.id);

        if (updatePlanError) throw updatePlanError;
      }

      const { error: deactivateOtherPlansError } = await supabase
        .from("workout_plans")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .neq("id", planRow.id);

      if (deactivateOtherPlansError) throw deactivateOtherPlansError;

      const { data: existingDays, error: existingDaysError } = await supabase
        .from("workout_plan_days")
        .select("id")
        .eq("plan_id", planRow.id);

      if (existingDaysError) throw existingDaysError;

      const oldDayIds = (existingDays || []).map((d) => d.id);

      if (oldDayIds.length) {
        const { error: deleteExError } = await supabase.from("workout_plan_exercises").delete().in("plan_day_id", oldDayIds);
        if (deleteExError) throw deleteExError;
      }

      const { error: deleteDaysError } = await supabase.from("workout_plan_days").delete().eq("plan_id", planRow.id);
      if (deleteDaysError) throw deleteDaysError;

      const dayRowsPayload = normalizedDays.map((day) => ({
        plan_id: planRow.id,
        day_index: day.dayIndex,
        day_key: day.letter,
        title: `Treino ${day.letter}`,
        group_id: day.groupId,
        group_name: day.groupObj?.name || `Treino ${day.letter}`,
      }));

      const { data: insertedDays, error: insertDaysError } = await supabase
        .from("workout_plan_days")
        .insert(dayRowsPayload)
        .select("id, day_index");

      if (insertDaysError) throw insertDaysError;

      const exercisesPayload = [];

      for (const day of normalizedDays) {
        const dayRow = (insertedDays || []).find((row) => Number(row.day_index) === Number(day.dayIndex));
        if (!dayRow?.id) continue;

        const prescription = day.prescription || {};
        const repsText = `${prescription.sets || 4} séries • ${prescription.reps || "6–12"} • descanso ${prescription.rest || "75–120s"} • método ${methodLabel(prescription.method)}`;

        for (const [order, name] of (day.chosenExercises || []).entries()) {
          exercisesPayload.push({
            plan_day_id: dayRow.id,
            exercise_order: order,
            name,
            group_name: prettyKeyLabel(findExerciseGroup(name)) || day.groupObj?.name || "",
            reps: repsText,
            notes: `${splitId} • ${methodLabel(prescription.method)}`,
          });
        }
      }

      if (exercisesPayload.length) {
        const { error: exError } = await supabase.from("workout_plan_exercises").insert(exercisesPayload);
        if (exError) throw exError;
      }

      nav("/treino", { replace: true });
    } catch (err) {
      console.error("TreinoPersonalize save error:", err);
      alert(err?.message || "Não foi possível salvar o treino agora.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    const d = clamp(Number(user?.frequencia || 4) || 4, 2, 6);
    const sid = d === 2 ? "AB" : d === 3 ? "ABC" : d === 4 ? "ABCD" : d === 5 ? "ABCDE" : "ABCDEF";
    const groups = pickDefaultSplit(d);
    const obj = {};
    const ex = {};

    for (let i = 0; i < groups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === groups[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s", method: "normal" };
      ex[i] = defaultExercisesForGroup(groups[i]);
    }

    setDaysPerWeek(d);
    setSplitId(sid);
    setDayGroups(groups);
    setPrescriptions(obj);
    setDayExercises(ex);
  }

  function openPicker(dayIndex) {
    setPickerDayIndex(dayIndex);
    setPickerOpen(true);
  }

  function closePicker() {
    setPickerOpen(false);
  }

  function updateDayExercises(dayIndex, list) {
    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = uniq(list).slice(0, 40);
      return out;
    });
  }

  if (loadingAccess || loadingPlan) {
    return <LoadingScreen onBack={() => nav("/treino")} />;
  }

  if (!paid) {
    return (
      <div style={S.page}>
        <button style={S.backBtn} onClick={() => nav("/treino")} type="button">←</button>
        <section style={S.lockCard}>
          <div style={S.lockBadge}>Premium</div>
          <h1 style={S.lockTitle}>Recurso exclusivo</h1>
          <p style={S.lockText}>Assine para montar seu treino do seu jeito: split, músculos, séries, reps, descanso, métodos avançados e seleção de exercícios.</p>
          <div style={S.lockActions}>
            <button style={S.primaryBtn} onClick={() => nav("/planos")} type="button">Ver planos</button>
            <button style={S.secondaryBtn} onClick={() => nav("/treino")} type="button">Voltar</button>
          </div>
        </section>
        <HideBottomMenuStyle />
      </div>
    );
  }

  return (
    <div style={S.page}>
      <HideBottomMenuStyle />

      <section style={S.hero}>
        <button style={S.heroBack} onClick={() => nav("/treino")} type="button">←</button>
        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Personalizar treino</div>
          <h1 style={S.title}>Monte seu plano</h1>
          <p style={S.subtitle}>Mais leve, rápido e organizado. Escolha o split, o foco de cada dia, os exercícios e o método.</p>
        </div>
      </section>

      <section style={S.quickCard}>
        <div style={S.cardHead}>
          <div>
            <div style={S.sectionTitle}>Split da semana</div>
            <div style={S.sectionSub}>Defina quantos treinos entram no ciclo.</div>
          </div>
        </div>

        <div style={S.splitRow}>
          {SPLITS.map((s) => (
            <button key={s.id} onClick={() => changeSplit(s.id)} style={{ ...S.splitPill, ...(splitId === s.id ? S.splitPillOn : null) }} type="button">
              {s.label}
            </button>
          ))}
        </div>

        <div style={S.daysRow}>
          {[2, 3, 4, 5, 6].map((d) => (
            <button key={d} onClick={() => changeDays(d)} style={{ ...S.dayBtn, ...(daysPerWeek === d ? S.dayOn : null) }} type="button">
              {d}x
            </button>
          ))}
        </div>
      </section>

      <section style={S.volumeCard}>
        <div>
          <div style={S.sectionTitle}>Volume semanal</div>
          <div style={S.sectionSub}>Estimativa simples por grupo muscular.</div>
        </div>
        <div style={S.volumeGrid}>
          {Object.entries(weeklyVolume).slice(0, 8).map(([muscle, volume]) => (
            <div key={muscle} style={S.volumeItem}>
              <b>{volume}</b>
              <span>{muscle}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={S.daysList}>
        {daysConfig.map((day) => {
          const p = day.prescription || {};
          const method = normalizeMethod(p.method || "normal");

          return (
            <article key={day.dayIndex} style={S.dayCard}>
              <div style={S.dayTop}>
                <div style={S.dayLetter}>{day.letter}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={S.dayTitle}>Treino {day.letter}</div>
                  <div style={S.daySub}>{day.groupObj?.name || "Foco do dia"}</div>
                </div>
                <button style={S.chooseBtn} onClick={() => openPicker(day.dayIndex)} type="button">Exercícios</button>
              </div>

              <div style={S.groupScroller}>
                {MUSCLE_GROUPS.map((g) => (
                  <button key={g.id} onClick={() => setDayGroup(day.dayIndex, g.id)} style={{ ...S.groupChip, ...(day.groupId === g.id ? S.groupChipOn : null) }} type="button">
                    {g.name}
                  </button>
                ))}
              </div>

              <div style={S.prescriptionGrid}>
                <label style={S.fieldLabel}>
                  Séries
                  <input style={S.fieldInput} inputMode="numeric" value={p.sets || 4} onChange={(e) => setPrescription(day.dayIndex, { sets: e.target.value })} />
                </label>
                <label style={S.fieldLabel}>
                  Reps
                  <input style={S.fieldInput} value={p.reps || "6–12"} onChange={(e) => setPrescription(day.dayIndex, { reps: e.target.value })} />
                </label>
                <label style={S.fieldLabel}>
                  Descanso
                  <input style={S.fieldInput} value={p.rest || "75–120s"} onChange={(e) => setPrescription(day.dayIndex, { rest: e.target.value })} />
                </label>
              </div>

              <div style={S.methodBlock}>
                <div style={S.methodTitle}>Método</div>
                <div style={S.methodRow}>
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPrescription(day.dayIndex, { method: m.id })}
                      style={{ ...S.methodChip, ...(method === m.id ? S.methodChipOn : null) }}
                    >
                      <b>{m.label}</b>
                      <span>{m.short}</span>
                    </button>
                  ))}
                </div>
                <div style={S.methodHint}>{METHODS.find((m) => m.id === method)?.note || METHODS[0].note}</div>
              </div>

              <div style={S.exercisePreview}>
                {(day.chosenExercises || []).slice(0, 8).map((name, index) => (
                  <div key={`${name}_${index}`} style={S.previewRow}>
                    <span>{index + 1}</span>
                    <b>{name}</b>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section style={S.saveCard}>
        <div>
          <div style={S.saveTitle}>Salvar plano atual</div>
          <div style={S.saveText}>O treino principal vai ler esse plano salvo no Supabase.</div>
        </div>
        <div style={S.saveActions}>
          <button style={S.secondaryDarkBtn} onClick={reset} type="button">Restaurar</button>
          <button style={S.saveBtn} onClick={save} disabled={saving} type="button">{saving ? "Salvando..." : "Salvar treino"}</button>
        </div>
      </section>

      {pickerOpen ? (
        <ExercisePicker
          day={daysConfig.find((d) => d.dayIndex === pickerDayIndex)}
          current={dayExercises[pickerDayIndex] || []}
          onChange={(list) => updateDayExercises(pickerDayIndex, list)}
          onClose={closePicker}
        />
      ) : null}
    </div>
  );
}

function ExercisePicker({ day, current, onChange, onClose }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("foco");
  const [groupKey, setGroupKey] = useState(day?.groupObj?.pickerKeys?.[0] || "peito");

  const selected = useMemo(() => new Set(current || []), [current]);

  const keys = useMemo(() => {
    if (mode === "foco") return day?.groupObj?.pickerKeys || ["peito", "costas", "quadriceps"];
    return [groupKey];
  }, [mode, groupKey, day?.groupObj?.pickerKeys]);

  const rows = useMemo(() => makeExerciseRows(keys, query), [keys, query]);

  function toggle(name) {
    const exists = selected.has(name);
    const next = exists ? current.filter((x) => x !== name) : [...current, name];
    onChange(next);
  }

  function remove(name) {
    onChange(current.filter((x) => x !== name));
  }

  function move(name, dir) {
    const index = current.findIndex((x) => x === name);
    if (index < 0) return;
    const nextIndex = clamp(index + dir, 0, current.length - 1);
    if (nextIndex === index) return;
    const copy = [...current];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, item);
    onChange(copy);
  }

  return (
    <div style={S.sheetOverlay}>
      <button style={S.sheetBackdrop} onClick={onClose} type="button" aria-label="Fechar" />
      <div style={S.sheet}>
        <div style={S.sheetGrab} />
        <div style={S.sheetHead}>
          <div>
            <div style={S.sheetTitle}>Selecionar exercícios</div>
            <div style={S.sheetSub}>Treino {day?.letter} • {day?.groupObj?.name}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose} type="button">×</button>
        </div>

        <div style={S.pickerTabs}>
          <button style={{ ...S.pickerTab, ...(mode === "foco" ? S.pickerTabOn : null) }} onClick={() => setMode("foco")} type="button">Do foco</button>
          <button style={{ ...S.pickerTab, ...(mode === "membros" ? S.pickerTabOn : null) }} onClick={() => setMode("membros")} type="button">Por membro</button>
        </div>

        {mode === "membros" ? (
          <div style={S.memberRow}>
            {Object.keys(EXERCISE_CATALOG).map((key) => (
              <button key={key} style={{ ...S.memberChip, ...(groupKey === key ? S.memberChipOn : null) }} onClick={() => setGroupKey(key)} type="button">
                {prettyKeyLabel(key)}
              </button>
            ))}
          </div>
        ) : null}

        <input style={S.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar exercício..." />

        {current?.length ? (
          <div style={S.selectedBox}>
            <div style={S.selectedBoxTitle}>Selecionados</div>
            <div style={S.selectedList}>
              {current.map((name, index) => (
                <div key={`${name}_${index}`} style={S.selectedExercise}>
                  <span>{index + 1}</span>
                  <b>{name}</b>
                  <button onClick={() => move(name, -1)} type="button">↑</button>
                  <button onClick={() => move(name, 1)} type="button">↓</button>
                  <button onClick={() => remove(name)} type="button">×</button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={S.catalogList}>
          {rows.map((item) => {
            const active = selected.has(item.name);
            return (
              <button key={`${item.key}_${item.name}`} style={{ ...S.catalogItem, ...(active ? S.catalogItemOn : null) }} onClick={() => toggle(item.name)} type="button">
                <div>
                  <b>{item.name}</b>
                  <span>{item.group}</span>
                </div>
                <strong>{active ? "✓" : "+"}</strong>
              </button>
            );
          })}
        </div>

        <button style={S.doneBtn} onClick={onClose} type="button">Concluir seleção</button>
      </div>
    </div>
  );
}

function HideBottomMenuStyle() {
  return (
    <style>{`
      body.fitdeal-hide-bottom-menu nav:has(.fitdeal-bottom-item),
      body.fitdeal-hide-bottom-menu div:has(> nav .fitdeal-bottom-item),
      body.fitdeal-hide-bottom-menu .fitdeal-bottom-item,
      body.fitdeal-hide-bottom-menu .fitdeal-main-item,
      body.fitdeal-hide-bottom-menu .bottom-menu,
      body.fitdeal-hide-bottom-menu .bottom-nav,
      body.fitdeal-hide-bottom-menu .tabbar,
      body.fitdeal-hide-bottom-menu .mobile-bottom-nav {
        display: none !important;
      }

      button, input {
        -webkit-tap-highlight-color: transparent;
      }

      ::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
    `}</style>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: 14,
    paddingBottom: 36,
    color: TEXT,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 17,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontSize: 24,
    fontWeight: 950,
    boxShadow: "0 12px 30px rgba(15,23,42,.07)",
  },

  hero: {
    display: "flex",
    gap: 13,
    alignItems: "flex-start",
    borderRadius: 28,
    padding: 15,
    background: "radial-gradient(circle at 90% 0%, rgba(255,106,0,.26), rgba(255,106,0,0) 34%), linear-gradient(135deg, #fff, #fff7ed)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 54px rgba(15,23,42,.08)",
  },

  heroBack: {
    width: 46,
    height: 46,
    borderRadius: 17,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontSize: 24,
    fontWeight: 950,
    flexShrink: 0,
  },

  kicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },

  title: {
    margin: "5px 0 0",
    fontSize: 31,
    lineHeight: 0.98,
    fontWeight: 980,
    letterSpacing: -1.2,
  },

  subtitle: {
    margin: "9px 0 0",
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.38,
    fontWeight: 800,
  },

  quickCard: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.055)",
  },

  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 980,
    letterSpacing: -0.45,
  },

  sectionSub: {
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  splitRow: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 3,
  },

  splitPill: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    background: "rgba(15,23,42,.035)",
    color: TEXT,
    padding: "10px 13px",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  splitPillOn: {
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    borderColor: "rgba(255,106,0,.32)",
    color: "#111",
    boxShadow: "0 12px 28px rgba(255,106,0,.18)",
  },

  daysRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
  },

  dayBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: "#fff",
    color: TEXT,
    padding: 12,
    fontSize: 13,
    fontWeight: 950,
  },

  dayOn: {
    background: "rgba(255,106,0,.12)",
    borderColor: "rgba(255,106,0,.26)",
    color: ORANGE,
  },

  volumeCard: {
    marginTop: 12,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 38px rgba(15,23,42,.045)",
  },

  volumeGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 9,
  },

  volumeItem: {
    borderRadius: 18,
    padding: 11,
    background: "rgba(15,23,42,.035)",
    border: `1px solid ${BORDER}`,
    display: "grid",
    gap: 4,
  },

  daysList: {
    marginTop: 12,
    display: "grid",
    gap: 12,
  },

  dayCard: {
    borderRadius: 27,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 42px rgba(15,23,42,.06)",
  },

  dayTop: {
    display: "flex",
    alignItems: "center",
    gap: 11,
  },

  dayLetter: {
    width: 48,
    height: 48,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 18,
    fontWeight: 980,
    flexShrink: 0,
  },

  dayTitle: {
    fontSize: 16,
    fontWeight: 980,
    letterSpacing: -0.3,
  },

  daySub: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: 800,
  },

  chooseBtn: {
    border: "none",
    borderRadius: 999,
    background: BLACK,
    color: "#fff",
    padding: "11px 13px",
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  groupScroller: {
    marginTop: 13,
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 3,
  },

  groupChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    background: "rgba(15,23,42,.035)",
    color: TEXT,
    padding: "9px 11px",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  groupChipOn: {
    background: "rgba(255,106,0,.12)",
    borderColor: "rgba(255,106,0,.28)",
    color: ORANGE,
  },

  prescriptionGrid: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "78px 1fr 1fr",
    gap: 8,
  },

  fieldLabel: {
    display: "grid",
    gap: 6,
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
  },

  fieldInput: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    background: "#fff",
    color: TEXT,
    padding: "11px 9px",
    fontSize: 13,
    fontWeight: 900,
    outline: "none",
  },

  methodBlock: {
    marginTop: 13,
    borderRadius: 20,
    padding: 11,
    background: "rgba(248,250,252,.9)",
    border: `1px solid ${BORDER}`,
  },

  methodTitle: {
    fontSize: 12,
    fontWeight: 980,
    color: TEXT,
    marginBottom: 9,
  },

  methodRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },

  methodChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 17,
    background: "#fff",
    color: TEXT,
    padding: 11,
    display: "grid",
    gap: 4,
    textAlign: "left",
  },

  methodChipOn: {
    background: "rgba(255,106,0,.12)",
    borderColor: "rgba(255,106,0,.30)",
    color: ORANGE,
  },

  methodHint: {
    marginTop: 9,
    fontSize: 12,
    lineHeight: 1.35,
    color: MUTED,
    fontWeight: 800,
  },

  exercisePreview: {
    marginTop: 12,
    display: "grid",
    gap: 7,
  },

  previewRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    borderRadius: 15,
    background: "rgba(15,23,42,.025)",
    border: `1px solid ${BORDER}`,
    padding: "9px 10px",
  },

  saveCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 15,
    background: "radial-gradient(circle at 90% 10%, rgba(255,106,0,.33), rgba(255,106,0,0) 34%), linear-gradient(135deg, #050506, #121214)",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(0,0,0,.20)",
  },

  saveTitle: {
    fontSize: 21,
    fontWeight: 980,
    letterSpacing: -0.6,
  },

  saveText: {
    marginTop: 7,
    color: "rgba(255,255,255,.68)",
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 800,
  },

  saveActions: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: 9,
  },

  secondaryDarkBtn: {
    border: "1px solid rgba(255,255,255,.13)",
    borderRadius: 18,
    background: "rgba(255,255,255,.08)",
    color: "#fff",
    padding: 14,
    fontSize: 14,
    fontWeight: 950,
  },

  saveBtn: {
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    padding: 14,
    fontSize: 14,
    fontWeight: 980,
    boxShadow: "0 16px 42px rgba(255,106,0,.24)",
  },

  loadingCard: {
    marginTop: 16,
    borderRadius: 28,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 44px rgba(15,23,42,.06)",
    padding: 18,
  },

  loadingDot: {
    width: 42,
    height: 42,
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    boxShadow: "0 16px 40px rgba(255,106,0,.20)",
  },

  loadingTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: 980,
  },

  loadingText: {
    marginTop: 6,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  lockCard: {
    marginTop: 16,
    borderRadius: 28,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 44px rgba(15,23,42,.06)",
    padding: 18,
  },

  lockBadge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "8px 11px",
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    fontSize: 12,
    fontWeight: 950,
  },

  lockTitle: {
    margin: "13px 0 0",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -1,
  },

  lockText: {
    margin: "10px 0 0",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.42,
    fontWeight: 800,
  },

  lockActions: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  primaryBtn: {
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    padding: 14,
    fontSize: 14,
    fontWeight: 980,
  },

  secondaryBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    background: "#fff",
    color: TEXT,
    padding: 14,
    fontSize: 14,
    fontWeight: 950,
  },

  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 20000,
    display: "grid",
    alignItems: "end",
    padding: 10,
    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
  },

  sheetBackdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    background: "rgba(2,6,23,.34)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 540,
    maxHeight: "86vh",
    margin: "0 auto",
    borderRadius: 30,
    padding: 14,
    background: "rgba(255,255,255,.98)",
    border: "1px solid rgba(255,255,255,.60)",
    boxShadow: "0 30px 90px rgba(15,23,42,.24)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  sheetGrab: {
    width: 46,
    height: 5,
    borderRadius: 999,
    background: "rgba(100,116,139,.24)",
    margin: "0 auto 12px",
    flexShrink: 0,
  },

  sheetHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexShrink: 0,
  },

  sheetTitle: {
    fontSize: 21,
    fontWeight: 980,
    letterSpacing: -0.7,
  },

  sheetSub: {
    marginTop: 5,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "rgba(15,23,42,.04)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
  },

  pickerTabs: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 5,
    borderRadius: 18,
    background: "rgba(15,23,42,.04)",
    flexShrink: 0,
  },

  pickerTab: {
    border: "none",
    borderRadius: 14,
    background: "transparent",
    color: MUTED,
    padding: 11,
    fontSize: 13,
    fontWeight: 950,
  },

  pickerTabOn: {
    background: "#fff",
    color: TEXT,
    boxShadow: "0 8px 22px rgba(15,23,42,.08)",
  },

  memberRow: {
    marginTop: 11,
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 3,
    flexShrink: 0,
  },

  memberChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    background: "#fff",
    color: TEXT,
    padding: "9px 11px",
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  memberChipOn: {
    background: "rgba(255,106,0,.12)",
    borderColor: "rgba(255,106,0,.28)",
    color: ORANGE,
  },

  searchInput: {
    marginTop: 11,
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    background: "#fff",
    color: TEXT,
    padding: "13px 13px",
    fontSize: 14,
    fontWeight: 850,
    outline: "none",
    flexShrink: 0,
  },

  selectedBox: {
    marginTop: 11,
    borderRadius: 20,
    padding: 10,
    background: "rgba(255,106,0,.07)",
    border: "1px solid rgba(255,106,0,.14)",
    flexShrink: 0,
    maxHeight: 160,
    overflowY: "auto",
  },

  selectedBoxTitle: {
    fontSize: 12,
    fontWeight: 980,
    marginBottom: 8,
  },

  selectedList: {
    display: "grid",
    gap: 7,
  },

  selectedExercise: {
    display: "grid",
    gridTemplateColumns: "28px 1fr 30px 30px 30px",
    gap: 6,
    alignItems: "center",
    borderRadius: 14,
    background: "#fff",
    padding: 8,
    fontSize: 12,
  },

  catalogList: {
    marginTop: 11,
    overflowY: "auto",
    display: "grid",
    gap: 8,
    paddingBottom: 8,
    minHeight: 0,
    flex: 1,
    WebkitOverflowScrolling: "touch",
  },

  catalogItem: {
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    background: "#fff",
    color: TEXT,
    padding: "12px 12px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    textAlign: "left",
  },

  catalogItemOn: {
    borderColor: "rgba(255,106,0,.30)",
    background: "rgba(255,106,0,.08)",
  },

  doneBtn: {
    marginTop: 10,
    height: 50,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 14,
    fontWeight: 980,
    flexShrink: 0,
  },
};
