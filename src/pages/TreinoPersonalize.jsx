import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

const SPLITS = [
  { id: "AB", days: 2, label: "AB (2 dias)" },
  { id: "ABC", days: 3, label: "ABC (3 dias)" },
  { id: "ABCD", days: 4, label: "ABCD (4 dias)" },
  { id: "ABCDE", days: 5, label: "ABCDE (5 dias)" },
  { id: "ABCDEF", days: 6, label: "ABCDEF (6 dias)" },
];

/**
 * ✅ Catálogo grande (20+ por “membro muscular” / foco)
 * Você pode expandir quando quiser — a UI já aguenta.
 */
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
    default: { sets: 4, reps: "6–12", rest: "75–120s" },
    // UI usa isso pra decidir quais listas mostrar no picker
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
    default: { sets: 4, reps: "8–12", rest: "75–120s" },
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
    default: { sets: 4, reps: "8–15", rest: "75–150s" },
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
    default: { sets: 4, reps: "8–12", rest: "75–150s" },
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
    default: { sets: 3, reps: "10–15", rest: "60–90s" },
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
    default: { sets: 3, reps: "10–15", rest: "45–90s" },
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
    for (const m of muscles) {
      volume[m] = (volume[m] || 0) + share;
    }
  }
  const out = {};
  Object.keys(volume).forEach((k) => (out[k] = Math.round(volume[k] * 10) / 10));
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
    if (!key) continue;
    if (s.has(key)) continue;
    s.add(key);
    out.push(key);
  }
  return out;
}

/* ---------------------- APP ---------------------- */
export default function TreinoPersonalize() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();
  const paid = localStorage.getItem(`paid_${email}`) === "1";
  const storageKey = `custom_split_${email}`;

  // --------- não pagante ----------
  if (!paid) {
    return (
      <div style={S.page}>
        <HeaderBrand title="Personalizar treino" subtitle="Disponível somente para assinantes." onBack={() => nav("/treino")} />

        <div style={S.lockCard}>
          <div style={S.lockIcon}>🔒</div>
          <div style={S.lockTitle}>Recurso exclusivo</div>
          <div style={S.lockText}>
            Assine para montar seu treino do seu jeito: split, músculos, séries, reps, descanso, volume semanal e seleção de exercícios.
          </div>

          <button style={S.cta} onClick={() => nav("/planos")}>
            Ver planos
          </button>

          <button style={S.ghost} onClick={() => nav("/treino")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // --------- pagante ----------
  const saved = useMemo(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, [storageKey]);

  const initialDays = saved?.days || Number(user?.frequencia || 4) || 4;
  const initialSplit =
    saved?.splitId ||
    (initialDays === 2 ? "AB" : initialDays === 3 ? "ABC" : initialDays === 4 ? "ABCD" : initialDays === 5 ? "ABCDE" : "ABCDEF");

  const [daysPerWeek, setDaysPerWeek] = useState(clamp(initialDays, 2, 6));
  const [splitId, setSplitId] = useState(initialSplit);

  const [dayGroups, setDayGroups] = useState(() => {
    const base = saved?.dayGroups;
    if (Array.isArray(base) && base.length) return base;
    return pickDefaultSplit(clamp(initialDays, 2, 6));
  });

  const [prescriptions, setPrescriptions] = useState(() => {
    const base = saved?.prescriptions;
    if (base && typeof base === "object") return base;

    const obj = {};
    const baseGroups = pickDefaultSplit(clamp(initialDays, 2, 6));
    for (let i = 0; i < baseGroups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === baseGroups[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
    }
    return obj;
  });

  // ✅ NOVO: exercícios escolhidos por dia
  const [dayExercises, setDayExercises] = useState(() => {
    const base = saved?.dayExercises;
    if (base && typeof base === "object") return base;

    // default: usa a library do grupo (primeiros 8) como base
    const out = {};
    const n = clamp(initialDays, 2, 6);
    const baseGroups = pickDefaultSplit(n);
    for (let i = 0; i < n; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === baseGroups[i]);
      const list = (g?.library || []).map((x) => x.name);
      out[i] = uniq(list).slice(0, 8);
    }
    return out;
  });

  // sheet (picker)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(0);

  function ensureDaysConfig(nextDays) {
    const n = clamp(nextDays, 2, 6);

    setDayGroups((prev) => {
      const base = Array.isArray(prev) ? [...prev] : [];
      if (base.length === n) return base;
      if (base.length < n) {
        const add = pickDefaultSplit(n).slice(base.length);
        return [...base, ...add];
      }
      return base.slice(0, n);
    });

    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      for (let i = 0; i < n; i++) {
        if (!out[i]) {
          const gid = (Array.isArray(dayGroups) && dayGroups[i]) || pickDefaultSplit(n)[i];
          const g = MUSCLE_GROUPS.find((x) => x.id === gid);
          out[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
        }
      }
      Object.keys(out).forEach((k) => {
        const idx = Number(k);
        if (idx >= n) delete out[k];
      });
      return out;
    });

    // ✅ garante dayExercises
    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      for (let i = 0; i < n; i++) {
        if (!out[i] || !Array.isArray(out[i])) {
          const gid = (Array.isArray(dayGroups) && dayGroups[i]) || pickDefaultSplit(n)[i];
          const g = MUSCLE_GROUPS.find((x) => x.id === gid);
          const list = (g?.library || []).map((x) => x.name);
          out[i] = uniq(list).slice(0, 8);
        }
      }
      Object.keys(out).forEach((k) => {
        const idx = Number(k);
        if (idx >= n) delete out[k];
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
    setDayGroups((prev) => {
      const arr = [...prev];
      arr[dayIndex] = groupId;
      return arr;
    });

    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      const g = MUSCLE_GROUPS.find((x) => x.id === groupId);
      out[dayIndex] = {
        sets: out[dayIndex]?.sets ?? g?.default?.sets ?? 4,
        reps: out[dayIndex]?.reps ?? g?.default?.reps ?? "6–12",
        rest: out[dayIndex]?.rest ?? g?.default?.rest ?? "75–120s",
      };
      return out;
    });

    // ✅ quando troca grupo: preenche seleção de exercícios com base no grupo (não apaga se já existe e tem coisa)
    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      if (Array.isArray(out[dayIndex]) && out[dayIndex].length >= 5) return out;

      const g = MUSCLE_GROUPS.find((x) => x.id === groupId);
      const list = (g?.library || []).map((x) => x.name);
      out[dayIndex] = uniq(list).slice(0, 8);
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
        prescription: prescriptions[i] || groupObj?.default || { sets: 4, reps: "6–12", rest: "75–120s" },
        chosenExercises: Array.isArray(dayExercises?.[i]) ? dayExercises[i] : [],
      });
    }
    return arr;
  }, [daysPerWeek, dayGroups, prescriptions, dayExercises]);

  const weeklyVolume = useMemo(() => calcWeeklyVolume(daysConfig), [daysConfig]);

  function save() {
    const payload = {
      splitId,
      days: daysPerWeek,
      dayGroups,
      prescriptions,
      dayExercises, // ✅ novo
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    nav("/treino", { replace: true });
  }

  function reset() {
    const d = clamp(Number(user?.frequencia || 4) || 4, 2, 6);
    const sid = d === 2 ? "AB" : d === 3 ? "ABC" : d === 4 ? "ABCD" : d === 5 ? "ABCDE" : "ABCDEF";
    setDaysPerWeek(d);
    setSplitId(sid);

    const groups = pickDefaultSplit(d);
    setDayGroups(groups);

    const obj = {};
    for (let i = 0; i < groups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === groups[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
    }
    setPrescriptions(obj);

    // ✅ reset exercícios
    const ex = {};
    for (let i = 0; i < groups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === groups[i]);
      ex[i] = uniq((g?.library || []).map((x) => x.name)).slice(0, 8);
    }
    setDayExercises(ex);

    localStorage.removeItem(storageKey);
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
      out[dayIndex] = uniq(list).slice(0, 40); // limite alto, mas controlado
      return out;
    });
  }

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      <HeaderBrand title="Personalizar treino" subtitle="Split, volume e exercícios do seu jeito." onBack={() => nav("/treino")} />

      {/* CARD: Split */}
      <div style={S.card}>
        <div style={S.cardTitle}>1) Split</div>

        <div style={S.splitRow}>
          {SPLITS.map((s) => (
            <button
              key={s.id}
              onClick={() => changeSplit(s.id)}
              style={{
                ...S.pill,
                ...(splitId === s.id ? S.pillOn : S.pillOff),
              }}
            >
              {s.id}
            </button>
          ))}
        </div>

        <div style={S.smallNote}>
          Dias/semana:
          <div style={S.daysRow}>
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => changeDays(d)}
                style={{
                  ...S.dayBtn,
                  ...(daysPerWeek === d ? S.dayOn : S.dayOff),
                }}
              >
                {d}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD: Dias */}
      <div style={S.card}>
        <div style={S.cardTitle}>2) Músculos por dia</div>

        <div style={S.daysGrid}>
          {daysConfig.map((d) => (
            <div key={d.dayIndex} style={S.dayCard}>
              <div style={S.dayTop}>
                <div style={S.badge}>{d.letter}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={S.dayLabel}>Dia {d.letter}</div>
                  <div style={S.daySub}>Escolha o foco do dia</div>
                </div>

                {/* ✅ Apple button */}
                <button style={S.appleBtn} onClick={() => openPicker(d.dayIndex)}>
                  <span style={S.appleBtnDot} />
                  Escolher exercícios
                </button>
              </div>

              <select value={d.groupId} onChange={(e) => setDayGroup(d.dayIndex, e.target.value)} style={S.select}>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <div style={S.musclesLine}>{d.groupObj?.muscles?.join(" • ") || "—"}</div>

              <div style={S.presRow}>
                <div style={S.presBox}>
                  <div style={S.presLabel}>Séries</div>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={d.prescription.sets}
                    onChange={(e) => setPrescription(d.dayIndex, { sets: clamp(Number(e.target.value || 1), 1, 8) })}
                    style={S.input}
                  />
                </div>

                <div style={S.presBox}>
                  <div style={S.presLabel}>Reps</div>
                  <input
                    value={d.prescription.reps}
                    onChange={(e) => setPrescription(d.dayIndex, { reps: e.target.value })}
                    placeholder="ex: 6–12"
                    style={S.input}
                  />
                </div>

                <div style={S.presBox}>
                  <div style={S.presLabel}>Descanso</div>
                  <input
                    value={d.prescription.rest}
                    onChange={(e) => setPrescription(d.dayIndex, { rest: e.target.value })}
                    placeholder="ex: 75–120s"
                    style={S.input}
                  />
                </div>
              </div>

              {/* ✅ selecionados */}
              <div style={S.pickPreview}>
                <div style={S.pickPreviewTop}>
                  <div style={S.previewTitle}>Seu treino (exercícios escolhidos)</div>
                  <div style={S.previewCount}>{(d.chosenExercises || []).length} itens</div>
                </div>

                {(d.chosenExercises || []).length === 0 ? (
                  <div style={S.previewEmpty}>Nenhum exercício escolhido. Toque em “Escolher exercícios”.</div>
                ) : (
                  <div style={S.previewChips}>
                    {d.chosenExercises.slice(0, 10).map((name) => (
                      <div key={name} style={S.chip}>
                        {name}
                      </div>
                    ))}
                    {d.chosenExercises.length > 10 ? <div style={S.moreChip}>+{d.chosenExercises.length - 10}</div> : null}
                  </div>
                )}
              </div>

              {/* antiga prévia (agora só como “sugestões”) */}
              <div style={S.previewBox}>
                <div style={S.previewTitle}>Sugestões do grupo</div>
                <div style={S.previewList}>
                  {(d.groupObj?.library || []).slice(0, 6).map((x, i) => (
                    <div key={i} style={S.previewItem}>
                      <span style={S.dot} />
                      <div style={{ minWidth: 0 }}>
                        <div style={S.previewName}>{x.name}</div>
                        <div style={S.previewSub}>{x.group}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD: Volume semanal */}
      <div style={S.card}>
        <div style={S.cardTitle}>3) Volume semanal (estimativa)</div>
        <div style={S.volGrid}>
          {Object.keys(weeklyVolume).length === 0 ? (
            <div style={S.volEmpty}>Defina os dias acima para ver o volume.</div>
          ) : (
            Object.entries(weeklyVolume).map(([m, v]) => (
              <div key={m} style={S.volCard}>
                <div style={S.volName}>{m}</div>
                <div style={S.volVal}>{v} sets/sem</div>
              </div>
            ))
          )}
        </div>

        <div style={S.volTip}>
          Dica: consistência + progressão de carga (sem pressa) é o que mais “vende resultado” pro usuário comum.
        </div>
      </div>

      {/* Actions */}
      <div style={S.actions}>
        <button style={S.save} onClick={save}>
          Salvar
        </button>
        <button style={S.reset} onClick={reset}>
          Restaurar padrão
        </button>
      </div>

      <div style={{ height: 140 }} />

      {/* ✅ SHEET: Picker */}
      <ExercisePickerSheet
        open={pickerOpen}
        onClose={closePicker}
        day={daysConfig[pickerDayIndex]}
        dayIndex={pickerDayIndex}
        onApply={(list) => updateDayExercises(pickerDayIndex, list)}
      />
    </div>
  );
}

/* ---------------------- COMPONENTS ---------------------- */

function HeaderBrand({ title, subtitle, onBack }) {
  return (
    <div style={S.head}>
      <button style={S.back} onClick={onBack}>
        ←
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={S.brandMark}>
          <div style={S.brandInner} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={S.brandTop}>
            <span style={S.brandName}>fitdeal</span>
            <span style={S.brandBadge}>PRO</span>
          </div>

          <div style={S.hTitle}>{title}</div>
          <div style={S.hSub}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function ExercisePickerSheet({ open, onClose, day, dayIndex, onApply }) {
  const group = day?.groupObj;
  const groupName = group?.name || `Dia ${day?.letter || ""}`;
  const pickerKeys = Array.isArray(group?.pickerKeys) ? group.pickerKeys : [];

  const [tab, setTab] = useState(() => pickerKeys[0] || "peito");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(() => (Array.isArray(day?.chosenExercises) ? [...day.chosenExercises] : []));

  // quando troca de dia/abre sheet: sincroniza
  useMemo(() => {
    if (open) {
      setSelected(Array.isArray(day?.chosenExercises) ? [...day.chosenExercises] : []);
      setQ("");
      setTab(pickerKeys[0] || "peito");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dayIndex]);

  const list = useMemo(() => {
    const base = (EXERCISE_CATALOG[tab] || []).map((name) => ({ name, key: tab }));
    const term = String(q || "").trim().toLowerCase();
    if (!term) return base;

    return base.filter((x) => x.name.toLowerCase().includes(term));
  }, [tab, q]);

  const selectedSet = useMemo(() => new Set((selected || []).map((x) => String(x))), [selected]);

  function add(name) {
    setSelected((prev) => uniq([...(prev || []), name]));
  }

  function remove(name) {
    setSelected((prev) => (prev || []).filter((x) => x !== name));
  }

  function clearAll() {
    setSelected([]);
  }

  function apply() {
    onApply(uniq(selected));
    onClose();
  }

  if (!open) return null;

  return (
    <div style={S.sheetOverlay} onMouseDown={onClose}>
      <div style={S.sheet} onMouseDown={(e) => e.stopPropagation()}>
        {/* Top */}
        <div style={S.sheetTop}>
          <div style={{ minWidth: 0 }}>
            <div style={S.sheetTitle}>Escolher exercícios</div>
            <div style={S.sheetSub}>
              {groupName} • Dia {day?.letter || ""} • toque para adicionar
            </div>
          </div>

          <button style={S.sheetClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={S.searchWrap}>
          <div style={S.searchIcon}>⌕</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exercício..."
            style={S.search}
          />
          {q ? (
            <button style={S.searchClear} onClick={() => setQ("")}>
              Limpar
            </button>
          ) : null}
        </div>

        {/* Tabs */}
        <div style={S.tabsRow}>
          {pickerKeys.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                ...S.tab,
                ...(tab === k ? S.tabOn : S.tabOff),
              }}
            >
              {prettyKeyLabel(k)}
            </button>
          ))}
        </div>

        {/* Selected bar */}
        <div style={S.selectedBar}>
          <div style={S.selectedLeft}>
            <div style={S.selectedTitle}>Selecionados</div>
            <div style={S.selectedCount}>{selected.length} exercícios</div>
          </div>

          <button style={S.clearBtn} onClick={clearAll} disabled={selected.length === 0}>
            Limpar
          </button>
        </div>

        {/* Selected chips */}
        {selected.length ? (
          <div style={S.selectedChips}>
            {selected.slice(0, 20).map((name) => (
              <button key={name} style={S.selChip} onClick={() => remove(name)} title="Remover">
                <span style={S.selChipDot} />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                <span style={S.selChipX}>×</span>
              </button>
            ))}
            {selected.length > 20 ? <div style={S.moreSel}>+{selected.length - 20}</div> : null}
          </div>
        ) : (
          <div style={S.selectedEmpty}>Nenhum selecionado ainda. Adicione abaixo 👇</div>
        )}

        {/* List */}
        <div style={S.list}>
          {list.map((item) => {
            const isOn = selectedSet.has(item.name);
            return (
              <div key={item.name} style={S.row}>
                <div style={{ minWidth: 0 }}>
                  <div style={S.rowName}>{item.name}</div>
                  <div style={S.rowSub}>{prettyKeyLabel(tab)}</div>
                </div>

                {!isOn ? (
                  <button style={S.addBtn} onClick={() => add(item.name)}>
                    + Adicionar
                  </button>
                ) : (
                  <button style={S.addBtnOn} onClick={() => remove(item.name)}>
                    ✓ Adicionado
                  </button>
                )}
              </div>
            );
          })}

          {list.length === 0 ? (
            <div style={S.listEmpty}>Nada encontrado. Tente outro termo.</div>
          ) : null}
        </div>

        {/* Actions */}
        <div style={S.sheetActions}>
          <button style={S.sheetGhost} onClick={onClose}>
            Voltar
          </button>
          <button style={S.sheetMain} onClick={apply}>
            Aplicar ao Dia {day?.letter || ""}
          </button>
        </div>

        <div style={S.safeBottom} />
      </div>
    </div>
  );
}

/* -------------------- styles (Apple clean + glass) -------------------- */
const S = {
  page: { padding: 18, paddingBottom: 120, background: BG, minHeight: "100vh", position: "relative", overflowX: "hidden" },

  bgGlow: {
    position: "absolute",
    inset: -140,
    pointerEvents: "none",
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.16), rgba(248,250,252,0) 60%), radial-gradient(520px 260px at 86% 6%, rgba(15,23,42,.06), rgba(255,255,255,0) 70%)",
    opacity: 0.95,
  },

  head: {
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 16px 50px rgba(15,23,42,.08)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
    flexShrink: 0,
  },

  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    boxShadow: "0 14px 30px rgba(255,106,0,.20)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  brandInner: {
    width: 14,
    height: 14,
    borderRadius: 6,
    background: "rgba(255,255,255,.92)",
  },
  brandTop: { display: "flex", gap: 8, alignItems: "center" },
  brandName: { fontWeight: 950, letterSpacing: -0.4, color: TEXT, fontSize: 14 },
  brandBadge: {
    fontSize: 10,
    fontWeight: 950,
    padding: "4px 8px",
    borderRadius: 999,
    background: ORANGE_SOFT,
    border: "1px solid rgba(255,106,0,.25)",
    color: ORANGE,
  },

  hTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  hSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  card: {
    marginTop: 12,
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    position: "relative",
    zIndex: 1,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },

  splitRow: { marginTop: 12, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  pill: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
    transition: "transform .12s ease",
  },
  pillOn: { background: "rgba(255,106,0,.14)", border: "1px solid rgba(255,106,0,.35)", color: ORANGE },
  pillOff: { background: "rgba(15,23,42,.04)", border: "1px solid rgba(15,23,42,.06)", color: TEXT },

  smallNote: { marginTop: 12, fontSize: 12, fontWeight: 900, color: MUTED },
  daysRow: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
  dayBtn: { padding: 12, borderRadius: 18, border: "1px solid rgba(15,23,42,.08)", fontWeight: 950 },
  dayOn: { background: ORANGE, color: "#111", border: "none", boxShadow: "0 14px 34px rgba(255,106,0,.22)" },
  dayOff: { background: "#fff", color: TEXT },

  daysGrid: { marginTop: 12, display: "grid", gap: 12 },
  dayCard: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,106,0,.06))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
  },
  dayTop: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    display: "grid",
    placeItems: "center",
  },
  dayLabel: { fontSize: 14, fontWeight: 950, color: TEXT },
  daySub: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED },

  appleBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.25)",
    background: "rgba(255,255,255,.70)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    fontWeight: 950,
    color: TEXT,
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 12px 26px rgba(255,106,0,.12)",
  },
  appleBtnDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 10px 20px rgba(255,106,0,.25)",
  },

  select: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontWeight: 900,
    color: TEXT,
    background: "#fff",
  },
  musclesLine: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  presRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  presBox: { borderRadius: 18, padding: 12, background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  presLabel: { fontSize: 11, fontWeight: 950, color: MUTED },
  input: {
    marginTop: 6,
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontWeight: 900,
    color: TEXT,
  },

  pickPreview: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.08)",
    border: "1px solid rgba(255,106,0,.18)",
  },
  pickPreviewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  previewTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.9 },
  previewCount: { fontSize: 12, fontWeight: 950, color: ORANGE },
  previewEmpty: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  previewChips: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.75)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 900,
    fontSize: 12,
    color: TEXT,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  moreChip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
  },

  previewBox: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  previewList: { marginTop: 10, display: "grid", gap: 8 },
  previewItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  dot: { width: 10, height: 10, borderRadius: 999, background: ORANGE, marginTop: 4, flexShrink: 0 },
  previewName: { fontSize: 13, fontWeight: 950, color: TEXT, lineHeight: 1.2 },
  previewSub: { marginTop: 2, fontSize: 11, fontWeight: 800, color: MUTED },

  volGrid: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  volCard: { borderRadius: 18, padding: 12, background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  volName: { fontSize: 12, fontWeight: 950, color: MUTED },
  volVal: { marginTop: 6, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  volEmpty: { fontSize: 12, fontWeight: 800, color: MUTED },
  volTip: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  actions: { marginTop: 12, display: "grid", gap: 10, position: "relative", zIndex: 1 },
  save: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.22)",
  },
  reset: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },

  lockCard: {
    marginTop: 12,
    borderRadius: 24,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(15,23,42,.03))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 55px rgba(15,23,42,.12)",
    textAlign: "center",
  },
  lockIcon: { fontSize: 34 },
  lockTitle: { marginTop: 10, fontSize: 18, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },
  cta: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },
  ghost: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },

  /* -------- Sheet -------- */
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,.38)",
    zIndex: 999,
    display: "grid",
    alignItems: "end",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    background: "rgba(255,255,255,.88)",
    borderTop: "1px solid rgba(255,255,255,.55)",
    boxShadow: "0 -26px 80px rgba(0,0,0,.28)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: 14,
    maxHeight: "88vh",
    overflow: "hidden",
  },
  sheetTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  sheetTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.75)",
    fontWeight: 950,
    color: TEXT,
  },

  searchWrap: {
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.75)",
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: { fontWeight: 950, color: MUTED },
  search: {
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
    fontWeight: 900,
    color: TEXT,
  },
  searchClear: {
    border: "none",
    background: ORANGE_SOFT,
    color: ORANGE,
    fontWeight: 950,
    padding: "8px 10px",
    borderRadius: 999,
  },

  tabsRow: { marginTop: 12, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  tab: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  tabOn: { background: "rgba(255,106,0,.16)", border: "1px solid rgba(255,106,0,.30)", color: ORANGE },
  tabOff: { background: "rgba(15,23,42,.05)", border: "1px solid rgba(15,23,42,.06)", color: TEXT },

  selectedBar: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,106,0,.08)",
    border: "1px solid rgba(255,106,0,.18)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  selectedLeft: { display: "flex", flexDirection: "column" },
  selectedTitle: { fontSize: 12, fontWeight: 950, color: TEXT },
  selectedCount: { marginTop: 4, fontSize: 12, fontWeight: 900, color: ORANGE },
  clearBtn: {
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,255,255,.70)",
    color: TEXT,
    fontWeight: 950,
    padding: "10px 12px",
    borderRadius: 16,
    opacity: 1,
  },

  selectedChips: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 96, overflow: "auto" },
  selChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.75)",
    padding: "10px 12px",
    fontWeight: 950,
    color: TEXT,
    maxWidth: "100%",
  },
  selChipDot: { width: 10, height: 10, borderRadius: 999, background: ORANGE },
  selChipX: { marginLeft: 2, color: MUTED, fontWeight: 950 },
  moreSel: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 950,
    color: TEXT,
  },
  selectedEmpty: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED },

  list: {
    marginTop: 12,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.70)",
    overflow: "auto",
    maxHeight: "36vh",
  },
  row: {
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid rgba(15,23,42,.06)",
  },
  rowName: { fontSize: 13, fontWeight: 950, color: TEXT, lineHeight: 1.2 },
  rowSub: { marginTop: 4, fontSize: 11, fontWeight: 800, color: MUTED },

    addBtn: {
    border: "none",
    background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    color: "#111",
    fontWeight: 950,
    padding: "10px 12px",
    borderRadius: 999,
    boxShadow: "0 14px 30px rgba(255,106,0,.18)",
    whiteSpace: "nowrap",
  },
  addBtnOn: {
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    padding: "10px 12px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  listEmpty: { padding: 16, fontSize: 12, fontWeight: 800, color: MUTED },

  sheetActions: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  sheetGhost: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.75)",
    color: TEXT,
    fontWeight: 950,
  },
  sheetMain: {
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.22)",
  },

  safeBottom: { height: "calc(10px + env(safe-area-inset-bottom))" },
};
