import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import exerciseBank from "../data/exerciseBank";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const BLACK = "#0B0B0C";

const GIF_OK_CACHE = new Map();
const GIF_BAD_CACHE = new Set();

const SPLITS = [
  { id: "AB", days: 2 },
  { id: "ABC", days: 3 },
  { id: "ABCD", days: 4 },
  { id: "ABCDE", days: 5 },
  { id: "ABCDEF", days: 6 },
];

const METHOD_OPTIONS = [
  { id: "normal", label: "Normal", hint: "Série tradicional." },
  { id: "biset", label: "Biset", hint: "2 exercícios conjugados." },
  { id: "triset", label: "Triset", hint: "3 exercícios conjugados." },
  { id: "dropset", label: "Dropset", hint: "Reduz carga na última série." },
];

const GROUP_LABELS = {
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

const FALLBACK_EXERCISE_CATALOG = {
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
    "Pullover com halter",
  ],
  triceps: [
    "Tríceps corda",
    "Tríceps barra reta",
    "Tríceps barra V",
    "Tríceps francês (halter)",
    "Tríceps francês unilateral",
    "Tríceps testa (barra W)",
    "Tríceps banco (mergulho)",
    "Mergulho nas paralelas (assistido)",
    "Supino fechado (barra)",
    "Tríceps coice (halter)",
  ],
  costas: [
    "Puxada frente (puxador)",
    "Puxada neutra (triângulo)",
    "Puxada supinada",
    "Barra fixa pronada",
    "Remada baixa no cabo",
    "Remada unilateral com halter",
    "Remada curvada com barra",
    "Remada máquina (hammer)",
    "Remada cavalinho (T-bar)",
    "Pulldown braço reto",
    "Face pull",
    "Hiperextensão lombar",
  ],
  biceps: [
    "Rosca direta (barra)",
    "Rosca direta (barra W)",
    "Rosca alternada (halter)",
    "Rosca martelo (halter)",
    "Rosca concentrada",
    "Rosca Scott (barra)",
    "Rosca na polia (barra)",
    "Rosca inclinada (halter)",
    "Rosca spider",
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
    "Afundo com halteres",
    "Bulgarian split squat",
    "Step-up (banco)",
  ],
  posterior: [
    "Terra romeno (barra)",
    "Stiff com halteres",
    "Mesa flexora",
    "Cadeira flexora",
    "Flexora unilateral",
    "Good morning (leve)",
    "Hiperextensão",
    "Nordic curl (assistido)",
    "Pull-through no cabo",
    "Flexora sentada",
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
    "Kickback no cabo",
    "Kickback na máquina",
    "Step-up alto (glúteo)",
  ],
  panturrilha: [
    "Panturrilha em pé na máquina",
    "Panturrilha sentado",
    "Panturrilha no leg press",
    "Panturrilha unilateral em pé",
    "Panturrilha no smith",
    "Panturrilha com pausa no pico",
  ],
  ombro: [
    "Desenvolvimento com halteres",
    "Desenvolvimento com barra",
    "Desenvolvimento máquina",
    "Arnold press",
    "Elevação lateral",
    "Elevação lateral no cabo",
    "Elevação frontal (halter)",
    "Reverse fly (posterior)",
    "Reverse fly na máquina",
    "Face pull",
    "Remada alta no cabo",
  ],
  core: [
    "Prancha",
    "Prancha lateral",
    "Dead bug",
    "Hollow hold",
    "Abdominal infra (elevação de pernas)",
    "Abdominal na polia",
    "Crunch",
    "Russian twist",
    "Pallof press",
    "Woodchopper (cabo)",
    "Bird dog",
    "Rollout (ab wheel)",
  ],
};

const GIF_NAME_MAP = {
  "Supino reto com barra": "supino-reto",
  "Supino reto com halteres": "supino-reto-halteres",
  "Supino inclinado com barra": "supino-inclinado",
  "Supino inclinado com halteres": "supino-inclinado-halteres",
  "Supino máquina": "supino-maquina",
  "Peck-deck": "peck-deck",
  "Crossover na polia (alto)": "crossover-na-polia-alto",
  "Tríceps corda": "triceps-corda",
  "Tríceps francês (halter)": "triceps-frances-halter",
  "Puxada frente (puxador)": "puxada-frente",
  "Puxada neutra (triângulo)": "puxada-neutra",
  "Remada baixa no cabo": "remada-baixa",
  "Remada unilateral com halter": "remada-unilateral-halter",
  "Remada curvada com barra": "remada-curvada",
  "Face pull": "face-pull",
  "Rosca direta (barra)": "rosca-direta",
  "Rosca martelo (halter)": "rosca-martelo",
  "Agachamento livre": "agachamento-livre",
  "Agachamento goblet": "agachamento-goblet",
  "Leg press 45°": "leg-press",
  "Cadeira extensora": "cadeira-extensora",
  "Afundo com halteres": "afundo-halteres",
  "Terra romeno (barra)": "terra-romeno",
  "Stiff com halteres": "stiff-halteres",
  "Mesa flexora": "mesa-flexora",
  "Flexora sentada": "flexora-sentada",
  "Hip thrust (barra)": "hip-thrust",
  "Hip thrust (máquina)": "hip-thrust-maquina",
  "Abdução na máquina": "cadeira-abdutora",
  "Kickback no cabo": "kickback-no-cabo",
  "Panturrilha em pé na máquina": "panturrilha-em-pe",
  "Panturrilha sentado": "panturrilha-sentado",
  "Desenvolvimento com halteres": "desenvolvimento-com-halteres",
  "Elevação lateral": "elevacao-lateral",
  "Reverse fly (posterior)": "reverse-fly",
  "Prancha": "prancha",
  "Dead bug": "dead-bug",
  "Pallof press": "pallof-press",
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function dayLetter(i) {
  return ["A", "B", "C", "D", "E", "F"][i % 6] || "A";
}

function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(v) {
  return normalizeText(v)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function asTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function getBankList() {
  try {
    if (Array.isArray(exerciseBank)) return exerciseBank;

    if (Array.isArray(exerciseBank?.list)) return exerciseBank.list;

    if (typeof exerciseBank?.list === "function") {
      const result = exerciseBank.list();
      return Array.isArray(result) ? result : [];
    }

    if (Array.isArray(exerciseBank?.exercises)) return exerciseBank.exercises;
    if (Array.isArray(exerciseBank?.EXERCISE_BANK)) return exerciseBank.EXERCISE_BANK;
    if (Array.isArray(exerciseBank?.data)) return exerciseBank.data;
  } catch (err) {
    console.warn("exerciseBank list fallback:", err);
  }

  return [];
}

const BANK_LIST = getBankList();

function bankExerciseName(item) {
  return String(item?.name || item?.title || item?.id || "").trim();
}

function bankSearchableNames(item) {
  const out = [bankExerciseName(item), ...asTextList(item?.aliases), ...asTextList(item?.alias)];

  if (item?.id) out.push(String(item.id));
  if (item?.slug) out.push(String(item.slug));

  return out.filter(Boolean);
}

function normalizeGroupKey(value) {
  const n = normalizeText(value);

  if (!n) return "";

  if (n.includes("peito") || n.includes("peitoral") || n.includes("chest")) return "peito";
  if (n.includes("triceps") || n.includes("tricep")) return "triceps";

  if (
    n.includes("costas") ||
    n.includes("dorsal") ||
    n.includes("latissimo") ||
    n.includes("lats") ||
    n.includes("back")
  ) {
    return "costas";
  }

  if (n.includes("biceps") || n.includes("bicep")) return "biceps";
  if (n.includes("quadriceps") || n.includes("quadricep") || n.includes("coxa anterior")) return "quadriceps";
  if (n.includes("posterior") || n.includes("isquio") || n.includes("hamstring") || n.includes("flexor")) {
    return "posterior";
  }
  if (n.includes("glute") || n.includes("gluteo") || n.includes("glúteo")) return "gluteo";
  if (n.includes("panturrilha") || n.includes("gemeo") || n.includes("gastro") || n.includes("calf")) {
    return "panturrilha";
  }
  if (n.includes("ombro") || n.includes("deltoide") || n.includes("shoulder")) return "ombro";
  if (n.includes("abdomen") || n.includes("abdominal") || n.includes("core") || n.includes("lombar") || n.includes("prancha")) {
    return "core";
  }

  return "";
}

function groupKeyForExerciseFallback(name) {
  const target = normalizeText(name);

  for (const [key, list] of Object.entries(FALLBACK_EXERCISE_CATALOG)) {
    if ((list || []).some((item) => normalizeText(item) === target)) return key;
  }

  if (target.includes("supino") || target.includes("peck") || target.includes("crossover") || target.includes("crucifixo")) {
    return "peito";
  }

  if (target.includes("triceps")) return "triceps";

  if (target.includes("puxada") || target.includes("remada") || target.includes("face pull") || target.includes("barra fixa")) {
    return "costas";
  }

  if (target.includes("rosca")) return "biceps";

  if (target.includes("agachamento") || target.includes("leg") || target.includes("extensora") || target.includes("afundo")) {
    return "quadriceps";
  }

  if (target.includes("terra") || target.includes("stiff") || target.includes("flexora")) return "posterior";

  if (target.includes("glute") || target.includes("thrust") || target.includes("abducao") || target.includes("kickback")) {
    return "gluteo";
  }

  if (target.includes("panturrilha")) return "panturrilha";

  if (target.includes("desenvolvimento") || target.includes("elevacao") || target.includes("reverse") || target.includes("ombro")) {
    return "ombro";
  }

  return "core";
}

function bankGroupKey(item) {
  const candidates = [
    item?.group,
    item?.category,
    item?.muscleGroup,
    item?.muscle,
    item?.bodyPart,
    ...asTextList(item?.primaryMuscles),
    ...asTextList(item?.muscles),
    ...asTextList(item?.target),
  ];

  for (const candidate of candidates) {
    const key = normalizeGroupKey(candidate);
    if (key) return key;
  }

  return groupKeyForExerciseFallback(bankExerciseName(item));
}

function findBankExercise(name) {
  const target = normalizeText(name);
  if (!target) return null;

  try {
    if (typeof exerciseBank?.get === "function") {
      const found = exerciseBank.get(name);
      if (found) return found;
    }
  } catch {}

  return (
    BANK_LIST.find((item) => {
      const names = bankSearchableNames(item);
      return names.some((candidate) => normalizeText(candidate) === target);
    }) ||
    BANK_LIST.find((item) => {
      const names = bankSearchableNames(item);

      return names.some((candidate) => {
        const n = normalizeText(candidate);
        return n.includes(target) || target.includes(n);
      });
    }) ||
    null
  );
}

function groupKeyForExercise(name) {
  const bank = findBankExercise(name);
  if (bank) return bankGroupKey(bank);
  return groupKeyForExerciseFallback(name);
}

function groupLabelForExercise(name) {
  return GROUP_LABELS[groupKeyForExercise(name)] || "Exercício";
}

function buildExerciseCatalogFromBank() {
  const catalog = {
    peito: [],
    triceps: [],
    costas: [],
    biceps: [],
    quadriceps: [],
    posterior: [],
    gluteo: [],
    panturrilha: [],
    ombro: [],
    core: [],
  };

  BANK_LIST.forEach((item) => {
    const name = bankExerciseName(item);
    if (!name) return;

    const key = bankGroupKey(item) || "core";
    if (!catalog[key]) catalog[key] = [];

    if (!catalog[key].some((existing) => normalizeText(existing) === normalizeText(name))) {
      catalog[key].push(name);
    }
  });

  Object.entries(FALLBACK_EXERCISE_CATALOG).forEach(([key, names]) => {
    if (!catalog[key]) catalog[key] = [];

    names.forEach((name) => {
      if (!catalog[key].some((existing) => normalizeText(existing) === normalizeText(name))) {
        catalog[key].push(name);
      }
    });
  });

  return catalog;
}

const EXERCISE_CATALOG = buildExerciseCatalogFromBank();

function pickFirst(names, key) {
  const list = EXERCISE_CATALOG[key] || [];

  for (const name of names) {
    const found = list.find((item) => normalizeText(item) === normalizeText(name));
    if (found) return found;
  }

  for (const name of names) {
    const found = list.find((item) => normalizeText(item).includes(normalizeText(name)));
    if (found) return found;
  }

  return list[0] || names[0];
}

const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    pickerKeys: ["peito", "triceps", "ombro"],
    defaults: [
      pickFirst(["Supino reto com barra", "Supino reto", "Supino com barra"], "peito"),
      pickFirst(["Supino inclinado com halteres", "Supino inclinado"], "peito"),
      pickFirst(["Peck-deck", "Voador", "Crucifixo máquina"], "peito"),
      pickFirst(["Crossover na polia (alto)", "Crossover na polia alto", "Crossover"], "peito"),
      pickFirst(["Tríceps corda", "Triceps corda"], "triceps"),
      pickFirst(["Tríceps francês (halter)", "Triceps francês", "Tríceps francês"], "triceps"),
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    pickerKeys: ["costas", "biceps", "ombro"],
    defaults: [
      pickFirst(["Puxada frente (puxador)", "Puxada frente", "Puxada alta"], "costas"),
      pickFirst(["Remada baixa no cabo", "Remada baixa"], "costas"),
      pickFirst(["Remada unilateral com halter", "Remada unilateral"], "costas"),
      pickFirst(["Face pull"], "costas"),
      pickFirst(["Rosca direta (barra)", "Rosca direta"], "biceps"),
      pickFirst(["Rosca martelo (halter)", "Rosca martelo"], "biceps"),
    ],
  },
  {
    id: "pernas",
    name: "Pernas",
    pickerKeys: ["quadriceps", "gluteo", "panturrilha", "core"],
    defaults: [
      pickFirst(["Agachamento livre", "Agachamento"], "quadriceps"),
      pickFirst(["Leg press 45°", "Leg press"], "quadriceps"),
      pickFirst(["Cadeira extensora"], "quadriceps"),
      pickFirst(["Afundo com halteres", "Afundo"], "quadriceps"),
      pickFirst(["Panturrilha em pé na máquina", "Panturrilha em pé"], "panturrilha"),
      pickFirst(["Prancha"], "core"),
    ],
  },
  {
    id: "posterior_gluteo",
    name: "Posterior + Glúteo",
    pickerKeys: ["posterior", "gluteo", "core"],
    defaults: [
      pickFirst(["Terra romeno (barra)", "Terra romeno", "Levantamento terra romeno"], "posterior"),
      pickFirst(["Mesa flexora"], "posterior"),
      pickFirst(["Hip thrust (barra)", "Hip thrust"], "gluteo"),
      pickFirst(["Abdução na máquina", "Cadeira abdutora"], "gluteo"),
      pickFirst(["Kickback no cabo", "Coice no cabo"], "gluteo"),
      pickFirst(["Dead bug"], "core"),
    ],
  },
  {
    id: "ombro_core",
    name: "Ombro + Core",
    pickerKeys: ["ombro", "core", "costas"],
    defaults: [
      pickFirst(["Desenvolvimento com halteres"], "ombro"),
      pickFirst(["Elevação lateral"], "ombro"),
      pickFirst(["Reverse fly (posterior)", "Crucifixo inverso"], "ombro"),
      pickFirst(["Face pull"], "costas"),
      pickFirst(["Pallof press"], "core"),
      pickFirst(["Abdominal na polia"], "core"),
    ],
  },
  {
    id: "fullbody",
    name: "Full body",
    pickerKeys: ["quadriceps", "peito", "costas", "posterior", "gluteo", "ombro", "core"],
    defaults: [
      pickFirst(["Agachamento goblet", "Agachamento"], "quadriceps"),
      pickFirst(["Supino reto com halteres", "Supino reto"], "peito"),
      pickFirst(["Remada baixa no cabo", "Remada baixa"], "costas"),
      pickFirst(["Desenvolvimento com halteres"], "ombro"),
      pickFirst(["Terra romeno (barra)", "Terra romeno"], "posterior"),
      pickFirst(["Prancha"], "core"),
    ],
  },
];

function splitIdFromDays(days) {
  return SPLITS.find((s) => s.days === Number(days))?.id || "ABC";
}

function defaultGroups(days) {
  if (days <= 2) return ["fullbody", "fullbody"];
  if (days === 3) return ["peito_triceps", "costas_biceps", "pernas"];
  if (days === 4) return ["peito_triceps", "costas_biceps", "pernas", "posterior_gluteo"];
  if (days === 5) return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo"];
  return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo", "fullbody"];
}

function groupById(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || MUSCLE_GROUPS[0];
}

function bankGifCandidates(value) {
  const gif = String(value || "").trim();
  if (!gif) return [];

  if (/^https?:\/\//i.test(gif)) return [gif];
  if (gif.startsWith("/")) return [gif];

  const raw = gif.replace(/^public\//, "").replace(/^\/+/, "");
  const noFolder = raw.replace(/^gifs\//, "");
  const noExt = noFolder.replace(/\.(gif|webp|png|jpg|jpeg)$/i, "");

  return Array.from(
    new Set([
      `/${raw}`,
      `/gifs/${noFolder}`,
      `/gifs/${noExt}.gif`,
      `/gifs/${noExt}.GIF`,
      `/gifs/${noExt}.webp`,
      `/gifs/${noExt}.png`,
    ])
  );
}

function gifBase(name) {
  const bank = findBankExercise(name);
  const fromBank = bank?.slug || bank?.id || bank?.name;
  return GIF_NAME_MAP[name] || slugify(fromBank || name);
}

function gifSources(name) {
  const bank = findBankExercise(name);
  const base = gifBase(name);
  const raw = slugify(name);

  const names = Array.from(
    new Set([base, raw, GIF_NAME_MAP[name], base?.replaceAll("-", "_"), raw?.replaceAll("-", "_")])
  ).filter(Boolean);

  const out = [
    ...bankGifCandidates(bank?.gif),
    ...bankGifCandidates(bank?.image),
    ...bankGifCandidates(bank?.animation),
  ];

  names.forEach((n) => {
    out.push(`/gifs/${n}.gif`);
    out.push(`/gifs/${n}.GIF`);
    out.push(`/gifs/${n}.webp`);
    out.push(`/gifs/${n}.png`);
  });

  return Array.from(new Set(out)).filter(Boolean);
}

function methodLabel(id) {
  return METHOD_OPTIONS.find((m) => m.id === id)?.label || "Normal";
}

function normalizeMethod(v) {
  const n = normalizeText(v);
  if (n.includes("biset")) return "biset";
  if (n.includes("triset")) return "triset";
  if (n.includes("drop")) return "dropset";
  return "normal";
}

function bankInfoFor(name) {
  const bank = findBankExercise(name);

  if (!bank) {
    return {
      equipment: "",
      pattern: "",
      aliases: [],
      primaryMuscles: [],
      variants: null,
      gif: "",
    };
  }

  return {
    equipment: bank?.equipment || bank?.equipamento || "",
    pattern: bank?.pattern || bank?.padrao || "",
    aliases: asTextList(bank?.aliases || bank?.alias),
    primaryMuscles: asTextList(bank?.primaryMuscles || bank?.muscles || bank?.target),
    variants: bank?.variants || bank?.variations || bank?.variacoes || null,
    gif: bank?.gif || bank?.image || bank?.animation || "",
  };
}

function exerciseInfoLine(ex) {
  const parts = [];

  if (ex?.group) parts.push(ex.group);
  if (ex?.equipment) parts.push(ex.equipment);
  if (ex?.pattern) parts.push(ex.pattern);

  return parts.filter(Boolean).join(" • ");
}

function parseExerciseRow(row) {
  const repsText = String(row?.reps || "");
  const notesText = String(row?.notes || "");
  const sets = Number((repsText.match(/(\d+)\s*s[ée]ries/i) || [])[1] || 4);
  const reps = (repsText.match(/s[ée]ries\s*•\s*([^•]+)/i) || [])[1]?.trim() || "8–12";
  const rest = (repsText.match(/descanso\s*([^•]+)/i) || [])[1]?.trim() || "75–120s";
  const method = normalizeMethod((notesText.match(/m[ée]todo:([^•]+)/i) || [])[1] || repsText);
  const pairRaw = (notesText.match(/conjugado:([^•]+)/i) || [])[1] || "";
  const pairedWith = pairRaw ? pairRaw.split(",").map((x) => x.trim()).filter(Boolean) : [];

  return makeExercise({
    name: row?.name || "Exercício",
    sets,
    reps,
    rest,
    method,
    pairedWith,
  });
}

function makeExercise(input) {
  const name = input?.name || "Exercício";
  const info = bankInfoFor(name);

  return {
    id: input?.id || uid(),
    name,
    group: input?.group || groupLabelForExercise(name),
    sets: input?.sets ?? 4,
    reps: input?.reps || "8–12",
    rest: input?.rest || "75–120s",
    method: normalizeMethod(input?.method || "normal"),
    pairedWith: Array.isArray(input?.pairedWith) ? input.pairedWith : [],
    equipment: input?.equipment || info.equipment,
    pattern: input?.pattern || info.pattern,
    aliases: input?.aliases || info.aliases,
    primaryMuscles: input?.primaryMuscles || info.primaryMuscles,
    variants: input?.variants || info.variants,
    gif: input?.gif || info.gif,
    gifSources: gifSources(name),
  };
}

function defaultExercises(groupId) {
  return groupById(groupId).defaults.filter(Boolean).map((name) => makeExercise({ name }));
}

function createInitialState(days = 3) {
  const groups = defaultGroups(days);
  const exercisesByDay = {};

  groups.forEach((groupId, index) => {
    exercisesByDay[index] = defaultExercises(groupId);
  });

  return { groups, exercisesByDay };
}

function buildRows(keys, query) {
  const q = normalizeText(query);
  const rows = [];

  keys.forEach((key) => {
    (EXERCISE_CATALOG[key] || []).forEach((name) => {
      const bank = findBankExercise(name);
      const searchParts = [name, ...bankSearchableNames(bank || {})].map(normalizeText);

      if (q && !searchParts.some((part) => part.includes(q))) return;

      const info = bankInfoFor(name);

      rows.push({
        name,
        key,
        group: GROUP_LABELS[key] || key,
        equipment: info.equipment,
        pattern: info.pattern,
        primaryMuscles: info.primaryMuscles,
      });
    });
  });

  const seen = new Set();

  return rows.filter((item) => {
    const id = normalizeText(item.name);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function MiniGif({ name, size = 52, expanded = false }) {
  const sources = useMemo(() => gifSources(name), [name]);

  const initialIndex = useMemo(() => {
    const cached = GIF_OK_CACHE.get(name);
    if (!cached) return 0;

    const foundIndex = sources.findIndex((src) => src === cached);
    return foundIndex >= 0 ? foundIndex : 0;
  }, [name, sources]);

  const [idx, setIdx] = useState(initialIndex);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = GIF_OK_CACHE.get(name);
    const foundIndex = cached ? sources.findIndex((src) => src === cached) : -1;

    setIdx(foundIndex >= 0 ? foundIndex : 0);
    setFailed(false);
  }, [name, sources]);

  function tryNext() {
    let next = idx + 1;

    while (next < sources.length && GIF_BAD_CACHE.has(sources[next])) {
      next += 1;
    }

    if (next < sources.length) {
      setIdx(next);
    } else {
      setFailed(true);
    }
  }

  const currentSrc = sources[idx];

  if (!failed && currentSrc) {
    return (
      <div style={{ ...S.gifBox, width: size, height: size, borderRadius: expanded ? 22 : 16 }}>
        <img
          src={currentSrc}
          alt={name}
          style={S.gifImg}
          loading={expanded ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => {
            GIF_OK_CACHE.set(name, currentSrc);
          }}
          onError={() => {
            GIF_BAD_CACHE.add(currentSrc);
            tryNext();
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...S.gifBox, width: size, height: size, borderRadius: expanded ? 22 : 16 }}>
      <span style={S.gifFallback}>{String(name || "?").slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

function FitDealFooter() {
  return (
    <footer style={S.fitdealFooter}>
      <img src="/logo/logo_app_4k.png" alt="FitDeal" style={S.fitdealLogoImg} />
      <div style={S.fitdealBrandText}>
        <span>fitdeal</span>
        <span style={S.fitdealDot}>.</span>
      </div>
    </footer>
  );
}

function Loading({ onBack }) {
  return (
    <main style={S.page}>
      <div style={S.phone}>
        <button style={S.backBtn} onClick={onBack} type="button">
          ←
        </button>

        <div style={S.loadingCard}>
          <div style={S.loadingDot} />
          <b>Carregando treino</b>
          <span>Buscando seu plano salvo.</span>
        </div>

        <FitDealFooter />
      </div>

      <HideBottomMenuStyle />
    </main>
  );
}

export default function TreinoPersonalize() {
  const nav = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;

  const dragTimerRef = useRef(null);
  const dragDataRef = useRef(null);
  const dragRafRef = useRef(null);
  const swipeDataRef = useRef(null);
  const lastSwipeRef = useRef(false);

  const defaultDays = 3;
  const initial = useMemo(() => createInitialState(defaultDays), []);

  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(defaultDays);
  const [splitId, setSplitId] = useState(splitIdFromDays(defaultDays));
  const [dayGroups, setDayGroups] = useState(initial.groups);
  const [exercisesByDay, setExercisesByDay] = useState(initial.exercisesByDay);
  const [activeDay, setActiveDay] = useState(0);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pairPicker, setPairPicker] = useState(null);
  const [draggingExerciseId, setDraggingExerciseId] = useState(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState(null);
  const [swipeState, setSwipeState] = useState({ id: null, offset: 0 });

  useEffect(() => {
    document.body.classList.add("fitdeal-hide-bottom-menu");
    return () => document.body.classList.remove("fitdeal-hide-bottom-menu");
  }, []);

  useEffect(() => {
    let alive = true;

    async function boot() {
      if (!userId) {
        if (alive) setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: subs, error: subError } = await supabase
          .from("user_subscriptions")
          .select("plan_key,status")
          .eq("user_id", userId)
          .in("status", ["active", "trialing"])
          .order("updated_at", { ascending: false })
          .limit(1);

        if (subError) console.error("TreinoPersonalize subscription:", subError);

        const sub = Array.isArray(subs) ? subs[0] : null;
        const access = ["active", "trialing"].includes(String(sub?.status || "").toLowerCase());

        if (!alive) return;

        setPaid(access);

        if (!access) {
          setLoading(false);
          return;
        }

        const { data: plans, error: planError } = await supabase
          .from("workout_plans")
          .select("id, split_label, split_len")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1);

        if (planError) throw planError;

        const plan = Array.isArray(plans) ? plans[0] : null;

        if (!plan?.id) {
          setLoading(false);
          return;
        }

        const { data: daysRows, error: daysError } = await supabase
          .from("workout_plan_days")
          .select("id, day_index, group_id, group_name")
          .eq("plan_id", plan.id)
          .order("day_index", { ascending: true });

        if (daysError) throw daysError;

        const dayIds = (daysRows || []).map((d) => d.id);
        let exRows = [];

        if (dayIds.length) {
          const { data, error } = await supabase
            .from("workout_plan_exercises")
            .select("plan_day_id, exercise_order, name, reps, notes")
            .in("plan_day_id", dayIds)
            .order("exercise_order", { ascending: true });

          if (error) throw error;
          exRows = data || [];
        }

        if (!alive) return;

        const n = clamp(Number(plan.split_len || daysRows?.length || 3), 2, 6);
        const fallbackGroups = defaultGroups(n);
        const nextGroups = [...fallbackGroups];
        const nextExercises = {};

        for (let i = 0; i < n; i++) {
          const dayRow = (daysRows || []).find((d) => Number(d.day_index) === i);
          const groupId =
            dayRow?.group_id && MUSCLE_GROUPS.some((g) => g.id === dayRow.group_id)
              ? dayRow.group_id
              : fallbackGroups[i];

          nextGroups[i] = groupId;

          const rowsForDay = dayRow
            ? exRows
                .filter((ex) => ex.plan_day_id === dayRow.id)
                .sort((a, b) => Number(a.exercise_order || 0) - Number(b.exercise_order || 0))
            : [];

          nextExercises[i] = rowsForDay.length ? rowsForDay.map(parseExerciseRow) : defaultExercises(groupId);
        }

        setDaysPerWeek(n);
        setSplitId(splitIdFromDays(n));
        setDayGroups(nextGroups);
        setExercisesByDay(nextExercises);
      } catch (err) {
        console.error("TreinoPersonalize boot:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    boot();

    return () => {
      alive = false;
    };
  }, [userId]);

  const daysConfig = useMemo(() => {
    const out = [];

    for (let i = 0; i < daysPerWeek; i++) {
      const groupId = dayGroups[i] || defaultGroups(daysPerWeek)[i];

      out.push({
        index: i,
        letter: dayLetter(i),
        groupId,
        group: groupById(groupId),
        exercises: exercisesByDay[i] || [],
      });
    }

    return out;
  }, [daysPerWeek, dayGroups, exercisesByDay]);

  const selectedDay = daysConfig.find((d) => d.index === activeDay) || daysConfig[0];

  function changeSplit(days) {
    const n = clamp(days, 2, 6);
    const groups = defaultGroups(n);
    const nextExercises = {};

    for (let i = 0; i < n; i++) {
      nextExercises[i] = exercisesByDay[i]?.length ? exercisesByDay[i] : defaultExercises(groups[i]);
    }

    setDaysPerWeek(n);
    setSplitId(splitIdFromDays(n));

    setDayGroups((prev) => {
      const next = [...groups];
      for (let i = 0; i < n; i++) if (prev[i]) next[i] = prev[i];
      return next;
    });

    setExercisesByDay(nextExercises);
    setActiveDay(0);
    setExpandedExerciseId(null);
  }

  function changeDayGroup(dayIndex, groupId) {
    setDayGroups((prev) => {
      const next = [...prev];
      next[dayIndex] = groupId;
      return next;
    });

    setExercisesByDay((prev) => ({ ...prev, [dayIndex]: defaultExercises(groupId) }));
    setExpandedExerciseId(null);
  }

  function setDayExercises(dayIndex, list) {
    setExercisesByDay((prev) => ({ ...prev, [dayIndex]: list }));
  }

  function updateExercise(dayIndex, exId, patch) {
    setExercisesByDay((prev) => {
      const list = prev[dayIndex] || [];

      return {
        ...prev,
        [dayIndex]: list.map((ex) => (ex.id === exId ? { ...ex, ...patch } : ex)),
      };
    });
  }

  function removeExercise(dayIndex, exId) {
    setExercisesByDay((prev) => {
      const list = prev[dayIndex] || [];
      return { ...prev, [dayIndex]: list.filter((ex) => ex.id !== exId) };
    });

    if (expandedExerciseId === exId) setExpandedExerciseId(null);
  }

  function reorderExerciseByIds(dayIndex, draggedId, overId) {
    if (!draggedId || !overId || draggedId === overId) return;

    setExercisesByDay((prev) => {
      const list = [...(prev[dayIndex] || [])];

      const fromIndex = list.findIndex((ex) => ex.id === draggedId);
      const toIndex = list.findIndex((ex) => ex.id === overId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

      const [draggedItem] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, draggedItem);

      return {
        ...prev,
        [dayIndex]: list,
      };
    });
  }

  function startExerciseDrag(e, dayIndex, exId) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    clearTimeout(dragTimerRef.current);

    dragDataRef.current = {
      dayIndex,
      exId,
      started: false,
      startY: e.clientY,
      lastY: e.clientY,
      lastX: e.clientX,
      lastOverId: null,
      lastMoveAt: 0,
    };

    e.currentTarget.setPointerCapture?.(e.pointerId);

    dragTimerRef.current = setTimeout(() => {
      const data = dragDataRef.current;
      if (!data) return;

      data.started = true;
      setDraggingExerciseId(exId);
      setExpandedExerciseId(null);

      if (navigator?.vibrate) navigator.vibrate(10);
    }, 55);
  }

  function moveExerciseDrag(e) {
    const data = dragDataRef.current;

    if (!data?.started) return;

    e.preventDefault();
    e.stopPropagation();

    data.lastY = e.clientY;
    data.lastX = e.clientX;

    if (dragRafRef.current) return;

    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;

      const current = dragDataRef.current;
      if (!current?.started) return;

      const now = performance.now();

      if (now - current.lastMoveAt < 42) return;

      const element = document.elementFromPoint(current.lastX, current.lastY);
      const card = element?.closest?.("[data-exercise-id]");
      const overId = card?.getAttribute?.("data-exercise-id");

      if (!overId || overId === current.exId) return;

      const overRect = card.getBoundingClientRect();
      const middleY = overRect.top + overRect.height / 2;
      const movingDown = current.lastY > current.startY;

      const passedZone = movingDown
        ? current.lastY > middleY - overRect.height * 0.12
        : current.lastY < middleY + overRect.height * 0.12;

      if (!passedZone) return;
      if (overId === current.lastOverId) return;

      current.lastMoveAt = now;
      current.lastOverId = overId;
      current.startY = current.lastY;

      setDragOverExerciseId(overId);
      reorderExerciseByIds(current.dayIndex, current.exId, overId);
    });
  }

  function endExerciseDrag(e) {
    clearTimeout(dragTimerRef.current);

    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    dragDataRef.current = null;
    setDraggingExerciseId(null);
    setDragOverExerciseId(null);
  }

  function startExerciseSwipe(e, dayIndex, exId) {
    if (draggingExerciseId) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const target = e.target;

    if (
      target?.closest?.("[data-drag-handle]") ||
      target?.closest?.("[data-no-swipe]") ||
      target?.closest?.("input") ||
      target?.closest?.("textarea") ||
      target?.closest?.("select")
    ) {
      return;
    }

    swipeDataRef.current = {
      dayIndex,
      exId,
      startX: e.clientX,
      startY: e.clientY,
      offset: 0,
      active: false,
    };
  }

  function moveExerciseSwipe(e) {
    const data = swipeDataRef.current;

    if (!data || draggingExerciseId) return;

    const dx = e.clientX - data.startX;
    const dy = e.clientY - data.startY;

    if (!data.active) {
      if (Math.abs(dx) < 12) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 0) return;

      data.active = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    e.preventDefault();
    e.stopPropagation();

    const offset = clamp(dx, -112, 0);
    data.offset = offset;

    setSwipeState({
      id: data.exId,
      offset,
    });
  }

  function endExerciseSwipe(e) {
    const data = swipeDataRef.current;

    if (!data) return;

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    const shouldDelete = data.active && data.offset <= -86;

    if (data.active) {
      lastSwipeRef.current = true;

      setTimeout(() => {
        lastSwipeRef.current = false;
      }, 220);
    }

    if (shouldDelete) {
      if (navigator?.vibrate) navigator.vibrate(18);

      setSwipeState({ id: null, offset: 0 });
      removeExercise(data.dayIndex, data.exId);
    } else {
      setSwipeState({ id: null, offset: 0 });
    }

    swipeDataRef.current = null;
  }

  function addPairedExercise(dayIndex, targetExId, pickedName, method) {
    const comboMethod = normalizeMethod(method);
    const limit = comboMethod === "triset" ? 2 : 1;

    setExercisesByDay((prev) => {
      const list = [...(prev[dayIndex] || [])];
      const exists = list.some((ex) => ex.name === pickedName);

      if (!exists) {
        list.push(makeExercise({ name: pickedName, method: "normal" }));
      }

      const nextList = list.map((ex) => {
        if (ex.id !== targetExId) return ex;

        const current = Array.isArray(ex.pairedWith) ? ex.pairedWith : [];
        const nextPaired = current.includes(pickedName) ? current : [...current, pickedName].slice(0, limit);

        return {
          ...ex,
          method: comboMethod,
          pairedWith: nextPaired,
        };
      });

      return { ...prev, [dayIndex]: nextList };
    });

    setPairPicker(null);
  }

  function serializeExerciseForDb(ex, index) {
    const method = normalizeMethod(ex.method || "normal");
    const pairedWith = Array.isArray(ex.pairedWith) ? ex.pairedWith : [];

    return {
      order: index,
      name: ex.name,
      group: ex.group || groupLabelForExercise(ex.name),
      sets: ex.sets || 4,
      reps: ex.reps || "8–12",
      rest: ex.rest || "75–120s",
      method,
      pairedWith,
      equipment: ex.equipment || "",
      pattern: ex.pattern || "",
      primaryMuscles: safeArray(ex.primaryMuscles),
      gif: ex.gif || "",
    };
  }

  async function saveActiveWorkout() {
    const now = new Date().toISOString();

    const { data: existingPlans, error: existingError } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const existingPlanId = Array.isArray(existingPlans) ? existingPlans[0]?.id : null;

    let planId = existingPlanId;

    if (planId) {
      const { error } = await supabase
        .from("workout_plans")
        .update({
          title: `Treino ${splitId}`,
          split_label: splitId,
          split_len: daysPerWeek,
          is_active: true,
          source: "personalize",
          updated_at: now,
        })
        .eq("id", planId)
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("workout_plans")
        .insert({
          user_id: userId,
          title: `Treino ${splitId}`,
          split_label: splitId,
          split_len: daysPerWeek,
          is_active: true,
          source: "personalize",
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (error) throw error;

      planId = data.id;
    }

    const { data: oldDays, error: oldDaysError } = await supabase
      .from("workout_plan_days")
      .select("id")
      .eq("plan_id", planId);

    if (oldDaysError) throw oldDaysError;

    const oldDayIds = (oldDays || []).map((day) => day.id);

    if (oldDayIds.length) {
      const { error: deleteExercisesError } = await supabase
        .from("workout_plan_exercises")
        .delete()
        .in("plan_day_id", oldDayIds);

      if (deleteExercisesError) throw deleteExercisesError;

      const { error: deleteDaysError } = await supabase
        .from("workout_plan_days")
        .delete()
        .eq("plan_id", planId);

      if (deleteDaysError) throw deleteDaysError;
    }

    for (const day of daysConfig) {
      const { data: insertedDay, error: dayError } = await supabase
        .from("workout_plan_days")
        .insert({
          plan_id: planId,
          day_index: day.index,
          day_key: day.letter,
          title: `Treino ${day.letter}`,
          group_id: day.groupId,
          group_name: day.group.name,
        })
        .select("id")
        .single();

      if (dayError) throw dayError;

      const exercisesToInsert = (day.exercises || []).map((ex, index) => {
        const clean = serializeExerciseForDb(ex, index);

        return {
          plan_day_id: insertedDay.id,
          exercise_order: index,
          name: clean.name,
          group_name: clean.group,
          reps: `${clean.sets} séries • ${clean.reps} • descanso ${clean.rest}`,
          notes: `método: ${methodLabel(clean.method)}${
            clean.pairedWith.length ? ` • conjugado: ${clean.pairedWith.join(", ")}` : ""
          }`,
        };
      });

      if (exercisesToInsert.length) {
        const { error: exercisesError } = await supabase.from("workout_plan_exercises").insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }
    }

    return planId;
  }

  async function saveWorkoutCopy() {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .from("saved_workout_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

    const nextNumber = Number(count || 0) + 1;

    const payload = {
      splitId,
      daysPerWeek,
      dayGroups,
      days: daysConfig.map((day) => ({
        index: day.index,
        letter: day.letter,
        groupId: day.groupId,
        groupName: day.group.name,
        exercises: (day.exercises || []).map((ex, index) => serializeExerciseForDb(ex, index)),
      })),
    };

    const { error } = await supabase.from("saved_workout_plans").insert({
      user_id: userId,
      name: `Treino salvo ${nextNumber}`,
      split_label: splitId,
      split_len: daysPerWeek,
      payload,
      times_done: 0,
      created_at: now,
      updated_at: now,
    });

    if (error) throw error;
  }

  async function save() {
    if (!userId || saving) return;

    setSaving(true);

    try {
      await saveActiveWorkout();
      await saveWorkoutCopy();

      nav("/treino", { replace: true });
    } catch (err) {
      console.error("TreinoPersonalize save:", err);
      alert(err?.message || "Não foi possível salvar o treino agora.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading onBack={() => nav("/treino")} />;

  if (!paid) {
    return (
      <main style={S.page}>
        <HideBottomMenuStyle />

        <div style={S.phone}>
          <button style={S.backBtn} onClick={() => nav("/treino")} type="button">
            ←
          </button>

          <section style={S.lockCard}>
            <div style={S.lockBadge}>Premium</div>
            <h1 style={S.lockTitle}>Personalização bloqueada</h1>
            <p style={S.lockText}>
              Assine para escolher exercícios, editar séries, reps, descanso e métodos avançados.
            </p>
            <button style={S.primaryBtn} onClick={() => nav("/planos")} type="button">
              Ver planos
            </button>
          </section>

          <FitDealFooter />
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <HideBottomMenuStyle />

      <div style={S.phone}>
        <header style={S.hero}>
          <button style={S.heroBack} onClick={() => nav("/treino")} type="button">
            ←
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={S.kicker}>FitDeal</div>
            <h1 style={S.title}>Personalizar treino</h1>
            <p style={S.subtitle}>Escolha exercícios, método e salve seu plano.</p>
          </div>
        </header>

        <section style={S.card}>
          <div style={S.splitRow}>
            {SPLITS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => changeSplit(s.days)}
                style={{ ...S.splitPill, ...(splitId === s.id ? S.splitPillOn : null) }}
              >
                {s.id}
              </button>
            ))}
          </div>

          <div style={S.dayTabsWrap}>
            <div style={S.dayTabs}>
              {daysConfig.map((day) => {
                const active = activeDay === day.index;

                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => {
                      setActiveDay(day.index);
                      setExpandedExerciseId(null);
                    }}
                    style={{ ...S.dayTab, ...(active ? S.dayTabOn : null) }}
                  >
                    <span style={{ ...S.dayTabLabel, ...(active ? S.dayTabLabelOn : null) }}>Treino</span>
                    <span style={{ ...S.dayTabLetter, ...(active ? S.dayTabLetterOn : null) }}>{day.letter}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.dayHeader}>
            <div>
              <div style={S.sectionTitle}>Treino {selectedDay.letter}</div>
              <div style={S.sectionSub}>{selectedDay.group.name}</div>
            </div>

            <div style={S.dayActions}>
              <button style={S.savedBtn} onClick={() => nav("/treinos-salvos")} type="button">
                Salvos
              </button>

              <button style={S.blackBtn} onClick={() => setPickerOpen(true)} type="button">
                + Exercício
              </button>
            </div>
          </div>

          <div style={S.groupScroller}>
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => changeDayGroup(selectedDay.index, g.id)}
                style={{ ...S.groupChip, ...(selectedDay.groupId === g.id ? S.groupChipOn : null) }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </section>

        <section style={S.exerciseList}>
          {(selectedDay.exercises || []).map((ex, index) => {
            const expanded = expandedExerciseId === ex.id;
            const needsPair = ["biset", "triset"].includes(normalizeMethod(ex.method));
            const otherExercises = (selectedDay.exercises || []).filter((item) => item.id !== ex.id);
            const infoLine = exerciseInfoLine(ex);

            return (
              <article
                key={ex.id}
                data-exercise-id={ex.id}
                style={{
                  ...S.exerciseCard,
                  ...(draggingExerciseId === ex.id ? S.exerciseCardDragging : null),
                  ...(dragOverExerciseId === ex.id ? S.exerciseCardOver : null),
                }}
              >
                <div style={S.deleteReveal}>
                  <span>Excluir</span>
                </div>

                <div
                  style={{
                    ...S.exerciseSwipeContent,
                    transform: swipeState.id === ex.id ? `translateX(${swipeState.offset}px)` : "translateX(0px)",
                    transition: swipeState.id === ex.id ? "none" : "transform .22s cubic-bezier(.2,.8,.2,1)",
                  }}
                  onPointerDown={(e) => startExerciseSwipe(e, selectedDay.index, ex.id)}
                  onPointerMove={moveExerciseSwipe}
                  onPointerUp={endExerciseSwipe}
                  onPointerCancel={endExerciseSwipe}
                >
                  <div style={S.exerciseTop}>
                    <button
                      type="button"
                      style={S.exerciseTapArea}
                      onClick={() => {
                        if (lastSwipeRef.current) return;
                        setExpandedExerciseId(expanded ? null : ex.id);
                      }}
                    >
                      <MiniGif name={ex.name} size={54} />

                      <div style={S.exerciseText}>
                        <div style={S.exerciseName}>{ex.name}</div>
                        <div style={S.exerciseMeta}>
                          {ex.group} • {ex.sets}x • {ex.reps} • {ex.rest}
                        </div>
                        {ex.equipment ? <div style={S.exerciseBankMeta}>{ex.equipment}</div> : null}
                      </div>

                      <div style={S.orderBadge}>{index + 1}</div>
                    </button>

                    <div
                      role="button"
                      data-drag-handle="true"
                      aria-label="Arrastar exercício"
                      title="Segure e arraste"
                      style={S.dragHandle}
                      onPointerDown={(e) => startExerciseDrag(e, selectedDay.index, ex.id)}
                      onPointerMove={moveExerciseDrag}
                      onPointerUp={endExerciseDrag}
                      onPointerCancel={endExerciseDrag}
                    >
                      <span style={S.dragDot} />
                      <span style={S.dragDot} />
                      <span style={S.dragDot} />
                    </div>
                  </div>

                  {expanded ? (
                    <div style={S.expandedArea} data-no-swipe="true">
                      <MiniGif name={ex.name} size={210} expanded />

                      {infoLine || safeArray(ex.primaryMuscles).length ? (
                        <div style={S.bankInfoBox}>
                          {infoLine ? <div style={S.bankInfoTitle}>{infoLine}</div> : null}
                          {safeArray(ex.primaryMuscles).length ? (
                            <div style={S.bankInfoText}>Músculos: {safeArray(ex.primaryMuscles).join(", ")}</div>
                          ) : null}
                        </div>
                      ) : null}

                      <div style={S.editGrid}>
                        <label style={S.label}>
                          Séries
                          <input
                            style={S.input}
                            inputMode="numeric"
                            value={ex.sets}
                            onChange={(e) => updateExercise(selectedDay.index, ex.id, { sets: e.target.value })}
                          />
                        </label>

                        <label style={S.label}>
                          Reps
                          <input
                            style={S.input}
                            value={ex.reps}
                            onChange={(e) => updateExercise(selectedDay.index, ex.id, { reps: e.target.value })}
                          />
                        </label>

                        <label style={S.label}>
                          Descanso
                          <input
                            style={S.input}
                            value={ex.rest}
                            onChange={(e) => updateExercise(selectedDay.index, ex.id, { rest: e.target.value })}
                          />
                        </label>
                      </div>

                      <div style={S.methodTitle}>Método</div>

                      <div style={S.methodRow}>
                        {METHOD_OPTIONS.map((m) => {
                          const active = normalizeMethod(ex.method) === m.id;
                          const combo = ["biset", "triset"].includes(m.id);

                          return (
                            <div key={m.id} style={{ ...S.methodChip, ...(active ? S.methodChipOn : null) }}>
                              <button
                                type="button"
                                style={S.methodMainBtn}
                                data-no-swipe="true"
                                onClick={() =>
                                  updateExercise(selectedDay.index, ex.id, {
                                    method: m.id,
                                    pairedWith: m.id === "normal" || m.id === "dropset" ? [] : ex.pairedWith,
                                  })
                                }
                              >
                                <b>{m.label}</b>
                                <span>{m.hint}</span>
                              </button>

                              {combo ? (
                                <button
                                  type="button"
                                  style={S.methodPlusBtn}
                                  data-no-swipe="true"
                                  onClick={() => {
                                    updateExercise(selectedDay.index, ex.id, { method: m.id });
                                    setPairPicker({
                                      dayIndex: selectedDay.index,
                                      exId: ex.id,
                                      method: m.id,
                                      targetName: ex.name,
                                    });
                                  }}
                                >
                                  +
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {needsPair && ex.pairedWith?.length ? (
                        <div style={S.pairBox}>
                          <div style={S.methodTitle}>Conjugado com</div>
                          <div style={S.pairList}>
                            {ex.pairedWith.map((name) => (
                              <button
                                key={name}
                                type="button"
                                style={S.pairChipOn}
                                data-no-swipe="true"
                                onClick={() =>
                                  updateExercise(selectedDay.index, ex.id, {
                                    pairedWith: ex.pairedWith.filter((item) => item !== name),
                                  })
                                }
                              >
                                {name} ×
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : needsPair ? (
                        <div style={S.pairBox}>
                          <div style={S.methodTitle}>Exercícios conjugados</div>
                          <div style={S.pairList}>
                            {otherExercises.map((candidate) => {
                              const active = (ex.pairedWith || []).includes(candidate.name);
                              const limit = normalizeMethod(ex.method) === "triset" ? 2 : 1;

                              return (
                                <button
                                  key={candidate.id}
                                  type="button"
                                  style={{ ...S.pairChip, ...(active ? S.pairChipOn : null) }}
                                  data-no-swipe="true"
                                  onClick={() => {
                                    const current = Array.isArray(ex.pairedWith) ? ex.pairedWith : [];
                                    const next = active
                                      ? current.filter((name) => name !== candidate.name)
                                      : [...current, candidate.name].slice(0, limit);

                                    updateExercise(selectedDay.index, ex.id, { pairedWith: next });
                                  }}
                                >
                                  {candidate.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div style={S.toolRowSingle}>
                        <button
                          style={S.removeBtn}
                          data-no-swipe="true"
                          onClick={() => removeExercise(selectedDay.index, ex.id)}
                          type="button"
                        >
                          Remover exercício
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <section style={S.saveCard}>
          <button style={S.saveBtn} onClick={save} disabled={saving} type="button">
            {saving ? "Salvando..." : "Salvar treino"}
          </button>
        </section>

        <FitDealFooter />
      </div>

      {pickerOpen ? (
        <ExercisePicker
          day={selectedDay}
          onClose={() => setPickerOpen(false)}
          onPick={(name) => {
            setDayExercises(selectedDay.index, [...(selectedDay.exercises || []), makeExercise({ name })]);
          }}
          currentNames={(selectedDay.exercises || []).map((ex) => ex.name)}
        />
      ) : null}

      {pairPicker ? (
        <PairExercisePicker
          day={daysConfig.find((d) => d.index === pairPicker.dayIndex) || selectedDay}
          targetName={pairPicker.targetName}
          method={pairPicker.method}
          onClose={() => setPairPicker(null)}
          onPick={(name) => addPairedExercise(pairPicker.dayIndex, pairPicker.exId, name, pairPicker.method)}
        />
      ) : null}
    </main>
  );
}

function ExercisePicker({ day, currentNames, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("foco");
  const [member, setMember] = useState(day?.group?.pickerKeys?.[0] || "peito");

  const keys = useMemo(() => (mode === "foco" ? day?.group?.pickerKeys || ["peito"] : [member]), [
    mode,
    member,
    day?.group?.pickerKeys,
  ]);

  const rows = useMemo(() => buildRows(keys, query), [keys, query]);
  const current = useMemo(() => new Set(currentNames || []), [currentNames]);

  return (
    <div style={S.sheetOverlay}>
      <button style={S.sheetBackdrop} onClick={onClose} type="button" aria-label="Fechar" />

      <div style={S.sheet}>
        <div style={S.sheetGrab} />

        <div style={S.sheetHead}>
          <div>
            <div style={S.sheetTitle}>Selecionar exercício</div>
            <div style={S.sheetSub}>Puxando exercícios do banco principal.</div>
          </div>

          <button style={S.closeBtn} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div style={S.sheetTabs}>
          <button
            style={{ ...S.sheetTab, ...(mode === "foco" ? S.sheetTabOn : null) }}
            onClick={() => setMode("foco")}
            type="button"
          >
            Do treino
          </button>

          <button
            style={{ ...S.sheetTab, ...(mode === "membro" ? S.sheetTabOn : null) }}
            onClick={() => setMode("membro")}
            type="button"
          >
            Membro
          </button>
        </div>

        {mode === "membro" ? (
          <div style={S.memberScroller}>
            {Object.keys(EXERCISE_CATALOG).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMember(key)}
                style={{ ...S.memberChip, ...(member === key ? S.memberChipOn : null) }}
              >
                {GROUP_LABELS[key] || key}
              </button>
            ))}
          </div>
        ) : null}

        <input
          style={S.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar. Ex: supino inclinado"
        />

        <div style={S.pickerList}>
          {rows.map((row) => {
            const active = current.has(row.name);
            const detail = [row.group, row.equipment, row.pattern].filter(Boolean).join(" • ");

            return (
              <button
                key={`${row.key}_${row.name}`}
                type="button"
                style={{ ...S.pickerItem, ...(active ? S.pickerItemOn : null) }}
                onClick={() => !active && onPick(row.name)}
              >
                <MiniGif name={row.name} size={42} />

                <div style={S.pickerText}>
                  <b style={S.pickerName}>{row.name}</b>
                  <span style={S.pickerGroup}>{detail || row.group}</span>
                </div>

                <strong style={S.pickerPlus}>{active ? "✓" : "+"}</strong>
              </button>
            );
          })}
        </div>

        <button style={S.doneBtn} onClick={onClose} type="button">
          Concluir
        </button>
      </div>
    </div>
  );
}

function PairExercisePicker({ day, targetName, method, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [member, setMember] = useState(day?.group?.pickerKeys?.[0] || "peito");

  const keys = useMemo(() => [member], [member]);
  const rows = useMemo(() => buildRows(keys, query).filter((row) => row.name !== targetName), [keys, query, targetName]);

  return (
    <div style={S.sheetOverlay}>
      <button style={S.sheetBackdrop} onClick={onClose} type="button" aria-label="Fechar" />

      <div style={S.sheet}>
        <div style={S.sheetGrab} />

        <div style={S.sheetHead}>
          <div>
            <div style={S.sheetTitle}>Adicionar no {methodLabel(method)}</div>
            <div style={S.sheetSub}>Escolha o exercício conjugado.</div>
          </div>

          <button style={S.closeBtn} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div style={S.memberScroller}>
          {Object.keys(EXERCISE_CATALOG).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMember(key)}
              style={{ ...S.memberChip, ...(member === key ? S.memberChipOn : null) }}
            >
              {GROUP_LABELS[key] || key}
            </button>
          ))}
        </div>

        <input
          style={S.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício conjugado..."
        />

        <div style={S.pickerList}>
          {rows.map((row) => {
            const detail = [row.group, row.equipment, row.pattern].filter(Boolean).join(" • ");

            return (
              <button key={`${row.key}_${row.name}`} type="button" style={S.pickerItem} onClick={() => onPick(row.name)}>
                <MiniGif name={row.name} size={42} />

                <div style={S.pickerText}>
                  <b style={S.pickerName}>{row.name}</b>
                  <span style={S.pickerGroup}>{detail || row.group}</span>
                </div>

                <strong style={S.pickerPlus}>+</strong>
              </button>
            );
          })}
        </div>

        <button style={S.doneBtn} onClick={onClose} type="button">
          Cancelar
        </button>
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

      button {
        appearance: none;
        -webkit-appearance: none;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        background-clip: padding-box;
      }

      img {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
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
    color: TEXT,
    padding: 12,
    paddingBottom: 34,
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  phone: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    boxSizing: "border-box",
  },

  hero: {
    display: "flex",
    gap: 11,
    alignItems: "flex-start",
    borderRadius: 26,
    padding: 13,
    background:
      "radial-gradient(circle at 92% 0%, rgba(255,106,0,.20), rgba(255,106,0,0) 34%), linear-gradient(135deg, #fff, #fff7ed)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.065)",
    overflow: "hidden",
  },

  heroBack: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
  },

  kicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  title: {
    margin: "5px 0 0",
    fontSize: 27,
    lineHeight: 1.02,
    fontWeight: 980,
    letterSpacing: -1,
    color: TEXT,
  },

  subtitle: {
    margin: "8px 0 0",
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.34,
    fontWeight: 800,
    maxWidth: 300,
  },

  card: {
    marginTop: 12,
    borderRadius: 23,
    padding: 13,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 30px rgba(15,23,42,.045)",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  splitRow: {
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
    borderColor: "rgba(255,106,0,.30)",
    color: "#111",
  },

  dayTabsWrap: {
    marginTop: 12,
    overflow: "hidden",
  },

  dayTabs: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    WebkitOverflowScrolling: "touch",
  },

  dayTab: {
    minWidth: 104,
    height: 88,
    borderRadius: 24,
    border: "1px solid rgba(15,23,42,.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.96))",
    boxShadow: "0 8px 24px rgba(15,23,42,.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexShrink: 0,
    padding: "10px 12px",
    color: TEXT,
  },

  dayTabOn: {
    border: "1px solid rgba(255,106,0,.22)",
    background: "linear-gradient(180deg, rgba(255,106,0,.14), rgba(255,106,0,.08))",
    boxShadow: "0 12px 28px rgba(255,106,0,.14)",
  },

  dayTabLabel: {
    fontSize: 13,
    lineHeight: 1,
    fontWeight: 800,
    color: "#7C8798",
    letterSpacing: 0.2,
  },

  dayTabLabelOn: {
    color: "#A15A21",
  },

  dayTabLetter: {
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 980,
    color: TEXT,
    letterSpacing: -0.4,
  },

  dayTabLetterOn: {
    color: ORANGE,
  },

  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 980,
    letterSpacing: -0.4,
    color: TEXT,
  },

  sectionSub: {
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  dayActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  savedBtn: {
    border: "1px solid rgba(255,106,0,.22)",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    color: ORANGE,
    padding: "11px 12px",
    minWidth: 76,
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  blackBtn: {
    border: "none",
    borderRadius: 999,
    background: BLACK,
    color: "#fff",
    padding: "11px 12px",
    minWidth: 98,
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  groupScroller: {
    marginTop: 12,
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

  exerciseList: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },

  exerciseCard: {
    position: "relative",
    borderRadius: 23,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 32px rgba(15,23,42,.05)",
    overflow: "hidden",
    transition:
      "transform .26s cubic-bezier(.2,.9,.2,1), box-shadow .26s cubic-bezier(.2,.9,.2,1), border-color .18s ease",
    transform: "translateZ(0)",
    WebkitTransform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },

  exerciseCardDragging: {
    opacity: 1,
    transform: "scale(1.018) translateZ(0)",
    boxShadow: "0 24px 58px rgba(15,23,42,.18)",
    borderColor: "rgba(255,106,0,.20)",
    zIndex: 30,
  },

  exerciseCardOver: {
    borderColor: "rgba(255,106,0,.20)",
    background: "#fff",
    boxShadow: "0 12px 32px rgba(15,23,42,.05)",
  },

  deleteReveal: {
    position: "absolute",
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 22,
    background: "linear-gradient(135deg, #FF3B30, #FF453A)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 980,
    letterSpacing: -0.2,
    pointerEvents: "none",
  },

  exerciseSwipeContent: {
    position: "relative",
    zIndex: 2,
    background: "#fff",
    borderRadius: 22,
    touchAction: "pan-y",
    willChange: "transform",
    overflow: "hidden",
    transform: "translateZ(0)",
    WebkitTransform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },

  exerciseTop: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    textAlign: "left",
    color: TEXT,
    boxSizing: "border-box",
  },

  exerciseTapArea: {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
    color: TEXT,
  },

  exerciseText: {
    minWidth: 0,
    flex: 1,
    display: "grid",
    gap: 4,
  },

  gifBox: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  gifImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#fff",
  },

  gifFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.11)",
    color: ORANGE,
    fontSize: 18,
    fontWeight: 950,
  },

  exerciseName: {
    fontSize: 15,
    fontWeight: 980,
    letterSpacing: -0.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: TEXT,
  },

  exerciseMeta: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 850,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  exerciseBankMeta: {
    color: "rgba(15,23,42,.46)",
    fontSize: 11,
    fontWeight: 850,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  bankInfoBox: {
    borderRadius: 18,
    padding: 11,
    background: "rgba(15,23,42,.03)",
    border: `1px solid ${BORDER}`,
    display: "grid",
    gap: 5,
  },

  bankInfoTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: 950,
  },

  bankInfoText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.35,
  },

  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    fontWeight: 980,
    flexShrink: 0,
  },

  dragHandle: {
    width: 38,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.055)",
    background: "rgba(15,23,42,.022)",
    display: "grid",
    placeItems: "center",
    gap: 3,
    padding: "9px 0",
    flexShrink: 0,
    touchAction: "none",
    cursor: "grab",
    transform: "translateZ(0)",
    WebkitTransform: "translateZ(0)",
  },

  dragDot: {
    width: 16,
    height: 2,
    borderRadius: 999,
    background: "rgba(15,23,42,.26)",
  },

  expandedArea: {
    padding: "0 12px 12px",
    display: "grid",
    gap: 11,
  },

  editGrid: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0,1fr) minmax(0,1fr)",
    gap: 7,
  },

  label: {
    display: "grid",
    gap: 6,
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
  },

  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    background: "#fff",
    color: TEXT,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
  },

  methodTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: 980,
  },

  methodRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    alignItems: "stretch",
  },

  methodChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: "#fff",
    color: TEXT,
    padding: 8,
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 30px",
    gap: 6,
    alignItems: "center",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  methodChipOn: {
    background: "rgba(255,106,0,.12)",
    borderColor: "rgba(255,106,0,.30)",
    color: ORANGE,
  },

  methodMainBtn: {
    border: "none",
    background: "transparent",
    color: "inherit",
    padding: 0,
    minWidth: 0,
    display: "grid",
    gap: 3,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
  },

  methodPlusBtn: {
    width: 30,
    height: 30,
    borderRadius: 11,
    border: "none",
    background: BLACK,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 980,
  },

  pairBox: {
    borderRadius: 18,
    padding: 10,
    background: "rgba(15,23,42,.03)",
    border: `1px solid ${BORDER}`,
    display: "grid",
    gap: 8,
  },

  pairList: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  pairChip: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    background: "#fff",
    color: TEXT,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
  },

  pairChipOn: {
    border: `1px solid ${BLACK}`,
    borderRadius: 999,
    background: BLACK,
    color: "#fff",
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
  },

  toolRowSingle: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },

  removeBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    background: "rgba(255,55,95,.08)",
    color: "#FF375F",
    padding: 10,
    fontSize: 12,
    fontWeight: 950,
  },

  saveCard: {
    marginTop: 12,
    borderRadius: 24,
    background: "transparent",
    padding: 0,
    boxShadow: "none",
  },

  saveBtn: {
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 20,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 16,
    fontWeight: 980,
    boxShadow: "0 14px 34px rgba(255,106,0,.24)",
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
    maxWidth: 430,
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
    boxSizing: "border-box",
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
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.6,
    color: TEXT,
  },

  sheetSub: {
    marginTop: 6,
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

  sheetTabs: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 5,
    borderRadius: 18,
    background: "rgba(15,23,42,.04)",
    flexShrink: 0,
  },

  sheetTab: {
    border: "none",
    borderRadius: 14,
    background: "transparent",
    color: MUTED,
    padding: 11,
    fontSize: 13,
    fontWeight: 950,
  },

  sheetTabOn: {
    background: "#fff",
    color: TEXT,
    boxShadow: "0 8px 22px rgba(15,23,42,.08)",
  },

  memberScroller: {
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

  pickerList: {
    marginTop: 11,
    overflowY: "auto",
    display: "grid",
    gap: 8,
    paddingBottom: 8,
    minHeight: 0,
    flex: 1,
    WebkitOverflowScrolling: "touch",
  },

  pickerItem: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    background: "#fff",
    color: TEXT,
    padding: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    appearance: "none",
    WebkitAppearance: "none",
  },

  pickerText: {
    minWidth: 0,
    flex: 1,
    display: "grid",
    gap: 5,
    lineHeight: 1.16,
    color: TEXT,
  },

  pickerName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: 980,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  pickerGroup: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 850,
  },

  pickerPlus: {
    color: ORANGE,
    fontSize: 18,
    fontWeight: 980,
  },

  pickerItemOn: {
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

  loadingCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 38px rgba(15,23,42,.06)",
    display: "grid",
    gap: 8,
  },

  loadingDot: {
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontSize: 23,
    fontWeight: 950,
  },

  lockCard: {
    marginTop: 14,
    borderRadius: 26,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 38px rgba(15,23,42,.06)",
    padding: 16,
  },

  lockBadge: {
    display: "inline-flex",
    borderRadius: 999,
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    padding: "8px 11px",
    fontSize: 12,
    fontWeight: 950,
  },

  lockTitle: {
    margin: "12px 0 0",
    fontSize: 27,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.8,
    color: TEXT,
  },

  lockText: {
    margin: "9px 0 0",
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 800,
  },

  primaryBtn: {
    marginTop: 14,
    width: "100%",
    height: 50,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 14,
    fontWeight: 980,
  },

  fitdealFooter: {
    marginTop: 16,
    padding: "8px 0 2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "rgba(15,23,42,.72)",
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: -0.5,
  },

  fitdealLogoImg: {
    width: 27,
    height: 27,
    objectFit: "contain",
    display: "block",
    borderRadius: 8,
  },

  fitdealBrandText: {
    display: "flex",
    alignItems: "baseline",
    color: "rgba(15,23,42,.72)",
  },

  fitdealDot: {
    color: ORANGE,
  },
};
