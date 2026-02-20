import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- THEME ---------------- */
const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* ---------------- helpers ---------------- */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
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
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}
function calcDayIndex(email) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}
function bumpDayIndex(email, max) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  localStorage.setItem(key, String(next % Math.max(max, 1)));
}
function getWeekdaysStrip(splitLen, currentIdx) {
  const out = [];
  const len = Math.max(splitLen, 1);
  for (let k = 0; k < 5; k++) {
    const idx = (currentIdx + k) % len;
    out.push({ idx, label: `Treino ${dayLetter(idx)}`, isToday: k === 0 });
  }
  return out;
}

/* ---------------- banco de exercícios (20+ por “membro”) ----------------
   Você pode enriquecer isso depois com nomes exatos que você usa no Personalize.
   O importante: Treino e TreinoDetalhe puxam DA MESMA lógica do custom_split.
*/
const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps", "Ombro ant."],
    default: { sets: 4, reps: "6–12", rest: "75–120s" },
    library: [
      // Peito (20+)
      { name: "Supino reto", group: "Peito" },
      { name: "Supino inclinado", group: "Peito" },
      { name: "Supino declinado", group: "Peito" },
      { name: "Supino com halteres", group: "Peito" },
      { name: "Supino inclinado halteres", group: "Peito" },
      { name: "Crucifixo reto", group: "Peito" },
      { name: "Crucifixo inclinado", group: "Peito" },
      { name: "Crucifixo na máquina", group: "Peito" },
      { name: "Peck-deck", group: "Peito" },
      { name: "Crossover alto", group: "Peito" },
      { name: "Crossover médio", group: "Peito" },
      { name: "Crossover baixo", group: "Peito" },
      { name: "Flexão de braços", group: "Peito" },
      { name: "Flexão inclinada", group: "Peito" },
      { name: "Flexão declinada", group: "Peito" },
      { name: "Pullover", group: "Peito" },
      { name: "Supino fechado", group: "Peito/Tríceps" },
      { name: "Chest press (máquina)", group: "Peito" },
      { name: "Chest press inclinado", group: "Peito" },
      { name: "Isometria no peitoral (aperto)", group: "Peito" },

      // Tríceps (20+)
      { name: "Tríceps corda", group: "Tríceps" },
      { name: "Tríceps barra reta", group: "Tríceps" },
      { name: "Tríceps unilateral na polia", group: "Tríceps" },
      { name: "Tríceps testa", group: "Tríceps" },
      { name: "Tríceps francês", group: "Tríceps" },
      { name: "Tríceps francês unilateral", group: "Tríceps" },
      { name: "Mergulho no banco", group: "Tríceps" },
      { name: "Paralelas (mergulho)", group: "Tríceps/Peito" },
      { name: "Tríceps coice", group: "Tríceps" },
      { name: "Tríceps na máquina", group: "Tríceps" },
      { name: "Extensão acima da cabeça na polia", group: "Tríceps" },
      { name: "Extensão acima da cabeça com halter", group: "Tríceps" },
      { name: "Supino fechado halteres", group: "Tríceps/Peito" },
      { name: "Flexão diamante", group: "Tríceps" },
      { name: "Kickback na polia", group: "Tríceps" },
      { name: "Skullcrusher", group: "Tríceps" },
      { name: "Extensão no TRX", group: "Tríceps" },
      { name: "Tríceps banco (peso corporal)", group: "Tríceps" },
      { name: "Tríceps corda + pausa", group: "Tríceps" },
      { name: "Tríceps barra V", group: "Tríceps" },
    ],
  },

  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps", "Ombro post."],
    default: { sets: 4, reps: "8–12", rest: "75–120s" },
    library: [
      // Costas (20+)
      { name: "Puxada na barra fixa", group: "Costas" },
      { name: "Puxada no puxador (aberta)", group: "Costas" },
      { name: "Puxada no puxador (fechada)", group: "Costas" },
      { name: "Puxada neutra", group: "Costas" },
      { name: "Pulldown braço reto", group: "Costas" },
      { name: "Remada curvada", group: "Costas" },
      { name: "Remada cavalinho", group: "Costas" },
      { name: "Remada baixa", group: "Costas" },
      { name: "Remada unilateral", group: "Costas" },
      { name: "Remada na máquina", group: "Costas" },
      { name: "Serrote com halter", group: "Costas" },
      { name: "Remada invertida", group: "Costas" },
      { name: "Rack pull", group: "Costas" },
      { name: "Levantamento terra", group: "Costas" },
      { name: "Terra romeno (ênfase posterior)", group: "Posterior/Costas" },
      { name: "Pull-over na polia", group: "Costas" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Remada alta", group: "Costas/Trapézio" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Good morning (leve)", group: "Posterior/Costas" },

      // Bíceps (20+)
      { name: "Rosca direta", group: "Bíceps" },
      { name: "Rosca alternada", group: "Bíceps" },
      { name: "Rosca martelo", group: "Bíceps" },
      { name: "Rosca concentrada", group: "Bíceps" },
      { name: "Rosca 21", group: "Bíceps" },
      { name: "Rosca Scott", group: "Bíceps" },
      { name: "Rosca na polia", group: "Bíceps" },
      { name: "Rosca na polia unilateral", group: "Bíceps" },
      { name: "Rosca inclinada", group: "Bíceps" },
      { name: "Rosca com barra W", group: "Bíceps" },
      { name: "Rosca inversa", group: "Antebraço/Bíceps" },
      { name: "Rosca martelo na corda", group: "Bíceps" },
      { name: "Rosca spider", group: "Bíceps" },
      { name: "Rosca no banco inclinado", group: "Bíceps" },
      { name: "Rosca no TRX", group: "Bíceps" },
      { name: "Rosca com pausa", group: "Bíceps" },
      { name: "Rosca no cabo alto", group: "Bíceps" },
      { name: "Rosca no cabo baixo", group: "Bíceps" },
      { name: "Rosca zottman", group: "Bíceps/Antebraço" },
      { name: "Rosca martelo cruzada", group: "Bíceps" },
    ],
  },

  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    default: { sets: 4, reps: "8–15", rest: "75–150s" },
    library: [
      // Quadríceps / pernas (20+)
      { name: "Agachamento", group: "Pernas" },
      { name: "Agachamento frontal", group: "Quadríceps" },
      { name: "Agachamento hack", group: "Quadríceps" },
      { name: "Agachamento smith", group: "Quadríceps" },
      { name: "Leg press", group: "Pernas" },
      { name: "Leg press unilateral", group: "Pernas" },
      { name: "Cadeira extensora", group: "Quadríceps" },
      { name: "Afundo / passada", group: "Glúteo/Quadríceps" },
      { name: "Passada andando", group: "Glúteo/Quadríceps" },
      { name: "Step-up", group: "Glúteo/Quadríceps" },
      { name: "Cadeira adutora", group: "Adutores" },
      { name: "Cadeira abdutora", group: "Glúteo médio" },
      { name: "Sissy squat (assistido)", group: "Quadríceps" },
      { name: "Agachamento búlgaro", group: "Glúteo/Quadríceps" },
      { name: "Agachamento sumô", group: "Glúteos/Adutores" },
      { name: "Pistol squat (assistido)", group: "Quadríceps" },
      { name: "Subida no banco", group: "Glúteos" },
      { name: "Extensora unilateral", group: "Quadríceps" },
      { name: "Leg press pés juntos", group: "Quadríceps" },
      { name: "Agachamento com pausa", group: "Pernas" },

      // Panturrilha (20+ “variações”)
      { name: "Panturrilha em pé", group: "Panturrilha" },
      { name: "Panturrilha sentado", group: "Panturrilha" },
      { name: "Panturrilha no leg press", group: "Panturrilha" },
      { name: "Panturrilha unilateral", group: "Panturrilha" },
      { name: "Panturrilha com pausa no topo", group: "Panturrilha" },
      { name: "Panturrilha com pausa embaixo", group: "Panturrilha" },
      { name: "Panturrilha na escada", group: "Panturrilha" },
      { name: "Panturrilha na máquina", group: "Panturrilha" },
      { name: "Panturrilha com elástico", group: "Panturrilha" },
      { name: "Panturrilha isométrica", group: "Panturrilha" },
      { name: "Panturrilha dropset", group: "Panturrilha" },
      { name: "Panturrilha cadenciada (3-1-3)", group: "Panturrilha" },
      { name: "Panturrilha no smith", group: "Panturrilha" },
      { name: "Panturrilha com halteres", group: "Panturrilha" },
      { name: "Panturrilha com barra", group: "Panturrilha" },
      { name: "Panturrilha em pé unilateral", group: "Panturrilha" },
      { name: "Panturrilha sentado unilateral", group: "Panturrilha" },
      { name: "Panturrilha no leg press unilateral", group: "Panturrilha" },
      { name: "Panturrilha com amplitude máxima", group: "Panturrilha" },
      { name: "Panturrilha com tempo", group: "Panturrilha" },
    ],
  },

  {
    id: "posterior_gluteo",
    name: "Posterior + Glúteo",
    muscles: ["Posterior", "Glúteos", "Core"],
    default: { sets: 4, reps: "8–12", rest: "75–150s" },
    library: [
      // Posterior / glúteo (20+)
      { name: "Terra romeno", group: "Posterior" },
      { name: "Stiff", group: "Posterior" },
      { name: "Mesa flexora", group: "Posterior" },
      { name: "Flexora sentada", group: "Posterior" },
      { name: "Flexora em pé", group: "Posterior" },
      { name: "Good morning", group: "Posterior" },
      { name: "Levantamento terra", group: "Posterior/Costas" },
      { name: "Hip thrust", group: "Glúteo" },
      { name: "Hip thrust na máquina", group: "Glúteo" },
      { name: "Glute bridge", group: "Glúteo" },
      { name: "Glute bridge unilateral", group: "Glúteo" },
      { name: "Abdução", group: "Glúteo médio" },
      { name: "Abdução na polia", group: "Glúteo médio" },
      { name: "Passada (foco glúteo)", group: "Glúteo" },
      { name: "Búlgaro (foco glúteo)", group: "Glúteo" },
      { name: "Step-up (foco glúteo)", group: "Glúteo" },
      { name: "Coice na polia", group: "Glúteo" },
      { name: "Coice na máquina", group: "Glúteo" },
      { name: "Pull-through", group: "Glúteo/Posterior" },
      { name: "Extensão lombar (leve)", group: "Posterior" },

      // Core (extra)
      { name: "Core (dead bug)", group: "Core" },
      { name: "Core (prancha)", group: "Core" },
      { name: "Elevação de pernas", group: "Core" },
      { name: "Abdominal", group: "Core" },
      { name: "Pallof press", group: "Core" },
    ],
  },

  {
    id: "ombro_core",
    name: "Ombro + Core",
    muscles: ["Ombros", "Trapézio", "Core"],
    default: { sets: 3, reps: "10–15", rest: "60–90s" },
    library: [
      // Ombro (20+)
      { name: "Desenvolvimento", group: "Ombros" },
      { name: "Desenvolvimento halteres", group: "Ombros" },
      { name: "Desenvolvimento militar", group: "Ombros" },
      { name: "Arnold press", group: "Ombros" },
      { name: "Elevação lateral", group: "Ombros" },
      { name: "Elevação lateral na polia", group: "Ombros" },
      { name: "Elevação lateral sentada", group: "Ombros" },
      { name: "Elevação frontal", group: "Ombros" },
      { name: "Elevação frontal na polia", group: "Ombros" },
      { name: "Posterior (reverse fly)", group: "Ombro posterior" },
      { name: "Crucifixo inverso na máquina", group: "Ombro posterior" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Remada alta", group: "Trapézio/Ombros" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Encolhimento halteres", group: "Trapézio" },
      { name: "Elevação lateral + pausa", group: "Ombros" },
      { name: "Desenvolvimento no smith", group: "Ombros" },
      { name: "Y-raise", group: "Ombros" },
      { name: "W-raise", group: "Ombros" },
      { name: "L-raise (rotadores)", group: "Manguito" },

      // Core (20+ “variações”)
      { name: "Pallof press", group: "Core" },
      { name: "Abdominal", group: "Core" },
      { name: "Prancha", group: "Core" },
      { name: "Prancha lateral", group: "Core" },
      { name: "Dead bug", group: "Core" },
      { name: "Bird dog", group: "Core" },
      { name: "Elevação de pernas", group: "Core" },
      { name: "Crunch na polia", group: "Core" },
      { name: "Abdominal infra no banco", group: "Core" },
      { name: "Abdominal bicicleta", group: "Core" },
      { name: "Ab wheel", group: "Core" },
      { name: "Hollow hold", group: "Core" },
      { name: "Sit-up", group: "Core" },
      { name: "Russian twist", group: "Core" },
      { name: "Mountain climber (core)", group: "Core" },
      { name: "V-up", group: "Core" },
      { name: "Prancha com toque no ombro", group: "Core" },
      { name: "Prancha com elevação de perna", group: "Core" },
      { name: "Farmer walk (core)", group: "Core" },
      { name: "Carry unilateral", group: "Core" },
    ],
  },

  {
    id: "fullbody",
    name: "Full body (seguro / saúde)",
    muscles: ["Corpo todo"],
    default: { sets: 3, reps: "10–15", rest: "45–90s" },
    library: [
      { name: "Agachamento (leve)", group: "Pernas" },
      { name: "Supino (leve)", group: "Peito" },
      { name: "Remada (leve)", group: "Costas" },
      { name: "Desenvolvimento (leve)", group: "Ombros" },
      { name: "Posterior (leve)", group: "Posterior" },
      { name: "Core (prancha)", group: "Core" },
      { name: "Puxada (leve)", group: "Costas" },
      { name: "Flexão", group: "Peito" },
      { name: "Búlgaro (leve)", group: "Pernas" },
      { name: "Caminhada inclinada", group: "Cardio" },
    ],
  },
];

function groupById(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || MUSCLE_GROUPS[0];
}

/* ✅ garante volume: se vier pouco, completa com acessórios coerentes */
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

/* ---------------- custom split reader (compatível com vários nomes) ---------------- */
function normalizeDayExercises(custom, days) {
  // aceita: dayExercises (array), daysExercises (array), exercisesByDay (obj), selectedExercisesByDay (obj)
  const a1 = Array.isArray(custom?.dayExercises) ? custom.dayExercises : null;
  const a2 = Array.isArray(custom?.daysExercises) ? custom.daysExercises : null;
  const o1 = custom?.exercisesByDay && typeof custom.exercisesByDay === "object" ? custom.exercisesByDay : null;
  const o2 =
    custom?.selectedExercisesByDay && typeof custom.selectedExercisesByDay === "object"
      ? custom.selectedExercisesByDay
      : null;

  const out = Array.from({ length: days }).map(() => []);

  for (let i = 0; i < days; i++) {
    let raw = null;

    if (a1 && Array.isArray(a1[i])) raw = a1[i];
    else if (a2 && Array.isArray(a2[i])) raw = a2[i];
    else if (o1 && Array.isArray(o1[i])) raw = o1[i];
    else if (o2 && Array.isArray(o2[i])) raw = o2[i];

    if (!raw) continue;

    // pode vir como string ou objeto {name, group}
    out[i] = raw
      .map((x) => {
        if (!x) return null;
        if (typeof x === "string") return { name: x, group: guessGroupFromName(x) };
        if (typeof x === "object" && x.name) return { name: x.name, group: x.group || guessGroupFromName(x.name) };
        return null;
      })
      .filter(Boolean);
  }

  return out;
}

function guessGroupFromName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("supino") || n.includes("crucif") || n.includes("peck") || n.includes("crossover") || n.includes("flexão"))
    return "Peito";
  if (n.includes("tríce") || n.includes("triceps") || n.includes("corda") || n.includes("testa") || n.includes("mergulho"))
    return "Tríceps";
  if (n.includes("puxada") || n.includes("remada") || n.includes("pulldown") || n.includes("barra fixa") || n.includes("terra"))
    return "Costas";
  if (n.includes("rosca") || n.includes("bíce") || n.includes("biceps") || n.includes("martelo") || n.includes("scott"))
    return "Bíceps";
  if (n.includes("agacha") || n.includes("leg press") || n.includes("extensora") || n.includes("afundo") || n.includes("passada") || n.includes("búlgaro"))
    return "Pernas";
  if (n.includes("flexora") || n.includes("stiff") || n.includes("romeno") || n.includes("posterior") || n.includes("good morning"))
    return "Posterior";
  if (n.includes("hip thrust") || n.includes("glute") || n.includes("abdu") || n.includes("coice"))
    return "Glúteo";
  if (n.includes("panturrilha")) return "Panturrilha";
  if (n.includes("ombro") || n.includes("lateral") || n.includes("desenvolvimento") || n.includes("arnold") || n.includes("face pull"))
    return "Ombros";
  if (n.includes("core") || n.includes("prancha") || n.includes("abdominal") || n.includes("dead bug") || n.includes("pallof"))
    return "Core";
  return "Treino";
}

function buildCustomPlan(email) {
  const raw = localStorage.getItem(`custom_split_${email}`);
  const custom = safeJsonParse(raw, null);
  if (!custom) return null;

  const rawDays = Number(custom.days || custom.dayGroups?.length || 0);
  const days = clamp(rawDays || 0, 2, 6);

  // se não tiver dayGroups, ainda dá pra usar exercícios selecionados (se existirem)
  const dayGroups = Array.from({ length: days }).map((_, i) => {
    const gid = custom?.dayGroups?.[i];
    return gid || "fullbody";
  });

  const prescriptions = custom.prescriptions || {};
  const pickedByDay = normalizeDayExercises(custom, days);

  const split = dayGroups.map((gid, idx) => {
    const g = groupById(gid);
    const pres = prescriptions[idx] || g.default || { sets: 4, reps: "6–12", rest: "75–120s" };

    // prioridade: exercícios escolhidos manualmente nesse dia
    const chosen = Array.isArray(pickedByDay[idx]) && pickedByDay[idx].length ? pickedByDay[idx] : null;

    // fallback: library do grupo
    const baseList = chosen ? chosen : (g.library || []).slice(0, 10);

    // garante volume mínimo
    const list = ensureVolume(baseList, 7);

    // aplica sets/reps/rest do dia em todos
    return list.map((ex) => ({
      name: ex.name,
      group: ex.group || guessGroupFromName(ex.name),
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

/* ---------------- carga/progressão (localStorage) ---------------- */
function loadLoads(email) {
  return safeJsonParse(localStorage.getItem(`loads_${email}`), {});
}
function saveLoads(email, obj) {
  localStorage.setItem(`loads_${email}`, JSON.stringify(obj));
}
function keyForLoad(viewIdx, exName) {
  return `${viewIdx}__${String(exName || "").toLowerCase()}`;
}

export default function Treino() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  const plan = useMemo(() => buildCustomPlan(email), [email]);

  const fallbackSplit = useMemo(() => {
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
  }, []);

  const base = plan?.base || fallbackSplit.base;
  const split = plan?.split || fallbackSplit.split;

  const dayIndex = useMemo(() => calcDayIndex(email), [email]);
  const [viewIdx, setViewIdx] = useState(dayIndex);

  // se o dia do usuário mudar em outra tela, mantém em sync
  useEffect(() => setViewIdx(dayIndex), [dayIndex]);

  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);
  const viewingIsToday = viewSafe === mod(dayIndex, split.length);

  const workout = useMemo(() => split[viewSafe] || [], [split, viewSafe]);

  const doneKey = `done_ex_${email}_${viewSafe}`;
  const [done, setDone] = useState(() => safeJsonParse(localStorage.getItem(doneKey), {}));
  const [tapId, setTapId] = useState(null);

  const [loads, setLoads] = useState(() => loadLoads(email));

  // quando troca o dia visualizado, carrega done daquele dia
  useEffect(() => {
    const nextKey = `done_ex_${email}_${viewSafe}`;
    setDone(safeJsonParse(localStorage.getItem(nextKey), {}));
  }, [email, viewSafe]);

  function toggleDone(i) {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    localStorage.setItem(doneKey, JSON.stringify(next));
    setTapId(i);
    setTimeout(() => setTapId(null), 160);
  }

  function adjustLoad(exName, delta) {
    const k = keyForLoad(viewSafe, exName);
    const cur = Number(loads[k] || 0);
    const nextVal = Math.max(0, Math.round((cur + delta) * 2) / 2); // 0.5kg
    const next = { ...loads, [k]: nextVal };
    setLoads(next);
    saveLoads(email, next);
  }

  function finishWorkout() {
    if (!viewingIsToday) return;

    bumpDayIndex(email, split.length);

    // limpa progresso do dia atual
    localStorage.removeItem(doneKey);
    setDone({});

    // salva histórico (dias treinados)
    const wkKey = `workout_${email}`;
    const today = todayKey();
    const raw = localStorage.getItem(wkKey);
    const list = safeJsonParse(raw, []);
    const arr = Array.isArray(list) ? list : [];
    if (!arr.includes(today)) localStorage.setItem(wkKey, JSON.stringify([...arr, today]));

    nav("/dashboard");
  }

  const previewCount = Math.max(2, Math.ceil(workout.length / 2));
  const previewList = workout.slice(0, previewCount);
  const lockedList = workout.slice(previewCount);

  const strip = useMemo(
    () => getWeekdaysStrip(split.length, mod(dayIndex, split.length)),
    [split.length, dayIndex]
  );

  function openExercises() {
    nav(`/treino/detalhe?d=${viewSafe}`, { state: { from: "/treino" } });
  }

  const doneCount = Object.values(done).filter(Boolean).length;
  const progressPct = workout.length ? clamp(doneCount / workout.length, 0, 1) : 0;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerKicker}>Seu treino</div>
          <div style={styles.headerTitle}>
            Treino {dayLetter(viewSafe)} {viewingIsToday ? "• hoje" : ""}
          </div>
          <div style={styles.headerSub}>
            {plan ? (
              <>
                Método: <b>{base.style}</b> • foco:{" "}
                <b>{(split[viewSafe]?.[0]?.method || "Custom").split("•")[1] || "Personalizado"}</b>
              </>
            ) : (
              <>
                Método: <b>{base.style}</b>
              </>
            )}
          </div>
        </div>

        <button
          style={styles.settingsBtn}
          onClick={() => nav("/conta")}
          aria-label="Conta e configurações"
          type="button"
          className="settings-press"
        >
          <GearIcon />
        </button>
      </div>

      {/* PRÓXIMOS DIAS */}
      <div style={styles.stripWrap}>
        <div style={styles.stripTitle}>Próximos dias</div>
        <div style={styles.stripRow}>
          {strip.map((d) => {
            const isActive = d.idx === viewSafe;

            return (
              <button
                key={d.idx}
                style={{
                  ...styles.stripPill,
                  ...(isActive ? styles.stripPillOn : styles.stripPillOff),
                }}
                type="button"
                onClick={() => {
                  if (isActive) {
                    openExercises();
                    return;
                  }
                  setViewIdx(d.idx);
                }}
                className="apple-press"
              >
                {d.label}
                {d.isToday ? " • hoje" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* EXERCÍCIOS DO DIA */}
      <button style={styles.bigGo} onClick={openExercises} type="button" className="apple-press">
        <div style={styles.bigGoRow}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.bigGoTop}>Exercícios do dia</div>
            <div style={styles.bigGoSub}>
              Abrir treino {dayLetter(viewSafe)} • {workout.length} exercícios
            </div>
          </div>

          <div style={styles.bigGoIcon}>
            <ArrowIcon />
          </div>
        </div>

        <div style={styles.bubbles}>
          <span style={styles.bubble}>{viewingIsToday ? "Hoje" : `Dia ${dayLetter(viewSafe)}`}</span>
          <span style={styles.bubbleSoft}>
            {doneCount}/{workout.length} feitos
          </span>
          <span style={styles.bubbleSoft}>Toque pra abrir</span>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${Math.round(progressPct * 100)}%` }} />
        </div>

        <div style={styles.progressHint}>
          Progresso do dia: <b>{Math.round(progressPct * 100)}%</b>
        </div>
      </button>

      {/* CARD: METAS */}
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <div style={styles.cardTitle}>METAS</div>
            <div style={styles.cardSub}>Pronto para conquistar seus objetivos?</div>
          </div>
          <button style={styles.cardBtn} onClick={() => nav("/metas")} type="button" className="apple-press">
            Abrir
          </button>
        </div>
      </div>

      {/* CARDIO */}
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <div style={styles.cardTitle}>Hora do cardio</div>
            <div style={styles.cardSub}>Acelere seus ganhos.</div>
          </div>
          <button style={styles.cardBtn} onClick={() => nav("/cardio")} type="button" className="apple-press">
            Abrir
          </button>
        </div>
      </div>

      {/* RESUMO */}
      <div style={styles.card}>
        <div style={styles.summaryTitle}>Resumo</div>

        <div style={styles.summaryLine}>
          Exercícios hoje: <b>{workout.length}</b>
        </div>

        {paid ? (
          <>
            <div style={styles.summaryLine}>
              Séries/Reps/Descanso:{" "}
              <b>
                {workout[0]?.sets || 4} • {workout[0]?.reps || "6–12"} • {workout[0]?.rest || "75–120s"}
              </b>
            </div>

            <div style={styles.summaryActions}>
              <button
                style={styles.customBtn}
                onClick={() => nav("/treino/personalizar")}
                type="button"
                className="apple-press"
              >
                Personalizar
              </button>

              <button style={styles.cardBtnAlt} onClick={openExercises} type="button" className="apple-press">
                Abrir detalhes
              </button>
            </div>

            {!viewingIsToday ? (
              <div style={styles.viewHint}>
                Você está visualizando <b>Treino {dayLetter(viewSafe)}</b>. Para concluir e avançar o ciclo, volte para{" "}
                <b>Hoje</b>.
              </div>
            ) : null}
          </>
        ) : (
          <div style={styles.lockHint}>
            Você está no Modo Gratuito. Assine para liberar treino completo e personalização.
          </div>
        )}
      </div>

      {/* LISTA */}
      <div style={styles.sectionTitle}>Lista do treino - Resumido</div>

      <div style={styles.list}>
        {previewList.map((ex, i) => {
          const isDone = !!done[i];
          const loadKey = keyForLoad(viewSafe, ex.name);
          const curLoad = loads[loadKey] ?? 0;

          return (
            <div key={i} style={styles.exCard}>
              <div style={styles.exTop}>
                <div style={styles.num}>{i + 1}</div>

                <div style={{ minWidth: 0 }}>
                  <div style={styles.exName}>{ex.name}</div>
                  <div style={styles.exNote}>
                    {ex.group} • {ex.sets} séries • {ex.reps} • descanso {ex.rest}
                  </div>

                  <div style={styles.loadRow}>
                    <span style={styles.loadLabel}>Carga</span>

                    <div style={styles.loadPill}>
                      <button
                        type="button"
                        style={styles.loadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLoad(ex.name, -2.5);
                        }}
                        aria-label="Diminuir carga"
                        className="apple-press"
                      >
                        −
                      </button>

                      <div style={styles.loadValue}>
                        <b>{Number(curLoad || 0).toFixed(1)}</b> kg
                      </div>

                      <button
                        type="button"
                        style={styles.loadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLoad(ex.name, +2.5);
                        }}
                        aria-label="Aumentar carga"
                        className="apple-press"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      style={styles.loadMini}
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustLoad(ex.name, +1);
                      }}
                      title="Ajuste fino"
                      className="apple-press"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDone(i)}
                  aria-label={isDone ? "Desmarcar" : "Marcar como feito"}
                  style={{
                    ...styles.checkBtn,
                    ...(isDone ? styles.checkOn : styles.checkOff),
                    transform: tapId === i ? "scale(0.92)" : "scale(1)",
                  }}
                  className="apple-press"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M20 7L10 17l-5-5"
                      stroke={isDone ? "#111" : "#64748b"}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BLOQUEADO */}
      {!paid && lockedList.length > 0 ? (
        <>
          <div style={styles.lockTitle}>Parte do treino bloqueada</div>

          <div style={styles.lockWrap}>
            {lockedList.map((ex, j) => (
              <div key={`l_${j}`} style={styles.exCard}>
                <div style={styles.exTop}>
                  <div style={styles.numMuted}>{previewCount + j + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.exName}>{ex.name}</div>
                    <div style={styles.exNote}>{ex.group} • + dicas e execução</div>
                  </div>
                  <div style={styles.checkGhost} />
                </div>
              </div>
            ))}
          </div>

          <button style={styles.fab} onClick={() => nav("/planos")} type="button" className="apple-press">
            <span style={styles.fabIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h12" stroke="#111" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M13 6l6 6-6 6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span style={styles.fabText}>Começar agora</span>
          </button>
        </>
      ) : null}

      {/* CONCLUIR TREINO (premium) */}
      {paid ? (
        <button
          type="button"
          style={{
            ...styles.finishFab,
            opacity: viewingIsToday ? 1 : 0.55,
            pointerEvents: viewingIsToday ? "auto" : "none",
          }}
          onClick={finishWorkout}
          disabled={!viewingIsToday}
          title={!viewingIsToday ? "Volte para hoje para concluir o treino" : "Concluir treino"}
          className="apple-press"
        >
          <span style={styles.finishFabIcon} aria-hidden="true">
            <CheckRingIcon />
          </span>
          <span style={styles.finishFabText}>Concluir treino</span>
          <span style={styles.finishFabArrow} aria-hidden="true">
            <ArrowMiniIcon />
          </span>
        </button>
      ) : null}

      <div style={{ height: 140 }} />
    </div>
  );
}

/* ---------- icons ---------- */
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d="M19.8 12.8c.05-.27.07-.54.07-.8s-.02-.53-.07-.8l1.78-1.32a.7.7 0 0 0 .18-.9l-1.55-2.68a.7.7 0 0 0-.85-.3l-2.08.84c-.43-.34-.9-.62-1.4-.83l-.33-2.2a.7.7 0 0 0-.69-.58h-3.1a.7.7 0 0 0-.69.58l-.33 2.2c-.5.21-.97.49-1.4.83l-2.08-.84a.7.7 0 0 0-.85.3L2.3 8.96a.7.7 0 0 0 .18.9l1.78 1.32c-.05.27-.07.54-.07.8s.02.53.07.8L2.48 14.1a.7.7 0 0 0-.18.9l1.55 2.68c.18.3.55.42.85.3l2.08-.84c.43.34.9.62 1.4.83l.33 2.2c.05.34.35.58.69.58h3.1c.34 0 .64-.24.69-.58l.33-2.2c.5-.21.97-.49 1.4-.83l2.08.84c.3.12.67 0 .85-.3l1.55-2.68a.7.7 0 0 0-.18-.9l-1.78-1.32Z"
        stroke="white"
        strokeWidth="1.7"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowMiniIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckRingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="#111" strokeWidth="2.2" strokeOpacity="0.9" />
      <path d="M7.5 12.3l2.8 2.9L16.8 9" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const styles = {
  page: { padding: 18, paddingBottom: 190, background: BG },

  header: {
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.92), rgba(255,106,0,.62))",
    color: "#fff",
    boxShadow: "0 18px 55px rgba(15,23,42,.14)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerKicker: { fontSize: 12, fontWeight: 900, opacity: 0.95 },
  headerTitle: { marginTop: 6, fontSize: 24, fontWeight: 950, letterSpacing: -0.6, lineHeight: 1.05 },
  headerSub: { marginTop: 6, fontSize: 12, fontWeight: 850, opacity: 0.96, lineHeight: 1.3 },

  settingsBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.28)",
    background: "rgba(255,255,255,.18)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 18px 46px rgba(0,0,0,.14)",
    transition: "transform .14s ease, background .14s ease, border-color .14s ease",
  },

  stripWrap: { marginTop: 12 },
  stripTitle: { fontSize: 12, fontWeight: 900, color: MUTED, marginBottom: 8 },
  stripRow: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  stripPill: { border: "none", padding: "10px 12px", borderRadius: 999, fontWeight: 950, whiteSpace: "nowrap" },
  stripPillOn: { background: "rgba(255,106,0,.16)", color: TEXT, border: "1px solid rgba(255,106,0,.22)" },
  stripPillOff: { background: "rgba(15,23,42,.04)", color: "#334155", border: "1px solid rgba(15,23,42,.06)" },

  bigGo: {
    marginTop: 12,
    width: "100%",
    borderRadius: 26,
    padding: 18,
    border: "none",
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.95))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: "1px solid rgba(15,23,42,.06)",
    position: "relative",
  },
  bigGoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  bigGoTop: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  bigGoSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  bigGoIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 14px 34px rgba(255,106,0,.22)",
    flexShrink: 0,
  },

  bubbles: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  bubble: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.18)",
    border: "1px solid rgba(255,106,0,.22)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
  },
  bubbleSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 900,
    fontSize: 12,
    color: "#334155",
  },

  progressTrack: { marginTop: 12, height: 10, borderRadius: 999, background: "rgba(15,23,42,.08)", overflow: "hidden" },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transition: "width .25s ease",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
  },
  progressHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  card: { marginTop: 14, borderRadius: 24, padding: 16, background: "#fff", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.4 },

  cardBtn: { padding: "12px 14px", borderRadius: 16, border: "1px solid rgba(255,106,0,.28)", background: "rgba(255,106,0,.10)", color: TEXT, fontWeight: 950 },
  cardBtnAlt: { padding: 14, borderRadius: 18, border: "1px solid rgba(255,106,0,.28)", background: "rgba(255,106,0,.10)", color: TEXT, fontWeight: 950 },

  summaryTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  summaryLine: { marginTop: 8, fontSize: 13, fontWeight: 850, color: MUTED },
  summaryActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  customBtn: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "#fff", color: TEXT, fontWeight: 950 },

  viewHint: { marginTop: 10, padding: 12, borderRadius: 18, background: "rgba(15,23,42,.03)", border: "1px solid rgba(15,23,42,.06)", fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  lockHint: { marginTop: 12, padding: "12px 12px", borderRadius: 18, background: "rgba(255,106,0,.10)", border: "1px solid rgba(255,106,0,.18)", color: TEXT, fontWeight: 850, fontSize: 12, lineHeight: 1.35 },

  sectionTitle: { marginTop: 16, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  list: { marginTop: 12, display: "grid", gap: 12 },

  exCard: { borderRadius: 22, padding: 14, background: "#fff", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 12px 34px rgba(15,23,42,.05)" },
  exTop: { display: "flex", gap: 12, alignItems: "flex-start" },

  num: { width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))", color: "#fff", fontWeight: 950, fontSize: 15, flexShrink: 0, marginTop: 2 },
  numMuted: { width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, fontSize: 15, flexShrink: 0 },

  exName: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  exNote: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  loadRow: { marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  loadLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  loadPill: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 999, background: "rgba(15,23,42,.04)", border: "1px solid rgba(15,23,42,.06)" },
  loadBtn: { width: 30, height: 30, borderRadius: 999, border: "none", background: "rgba(255,106,0,.18)", fontWeight: 950, color: TEXT },
  loadValue: { minWidth: 96, textAlign: "center", fontSize: 12, fontWeight: 900, color: TEXT },
  loadMini: { padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(255,106,0,.25)", background: "rgba(255,106,0,.10)", fontWeight: 950, color: TEXT },

  checkBtn: { marginLeft: "auto", width: 44, height: 44, borderRadius: 16, border: "none", display: "grid", placeItems: "center", transition: "transform .12s ease", marginTop: 2 },
  checkOn: { background: "linear-gradient(135deg, #FF6A00, #FF8A3D)", boxShadow: "0 14px 34px rgba(255,106,0,.22)" },
  checkOff: { background: "rgba(15,23,42,.06)" },
  checkGhost: { marginLeft: "auto", width: 44, height: 44, borderRadius: 16, background: "rgba(15,23,42,.06)" },

  lockTitle: { marginTop: 14, fontSize: 14, fontWeight: 950, color: TEXT },
  lockWrap: { marginTop: 10, filter: "blur(2.8px)", opacity: 0.65, pointerEvents: "none", display: "grid", gap: 12 },

  fab: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 160,
    zIndex: 999,
    minHeight: 56,
    padding: "14px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.35)",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxShadow: "0 22px 70px rgba(255,106,0,.34), inset 0 1px 0 rgba(255,255,255,.28)",
  },
  fabIcon: { width: 38, height: 38, borderRadius: 999, flexShrink: 0, background: "rgba(255,255,255,.88)", border: "1px solid rgba(255,255,255,.55)", display: "grid", placeItems: "center" },
  fabText: { fontSize: 14, lineHeight: 1, whiteSpace: "nowrap" },

  finishFab: {
    position: "fixed",
    left: "50%",
    bottom: "calc(112px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    zIndex: 1100,
    minHeight: 58,
    padding: "14px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.40)",
    background: "linear-gradient(135deg, rgba(255,106,0,.98), rgba(255,138,61,.92))",
    color: "#111",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxShadow: "0 26px 90px rgba(255,106,0,.38), inset 0 1px 0 rgba(255,255,255,.30)",
  },
  finishFabIcon: { width: 40, height: 40, borderRadius: 999, flexShrink: 0, background: "rgba(255,255,255,.90)", border: "1px solid rgba(255,255,255,.60)", display: "grid", placeItems: "center", boxShadow: "0 14px 34px rgba(0,0,0,.14)" },
  finishFabText: { fontSize: 14, lineHeight: 1, whiteSpace: "nowrap" },
  finishFabArrow: { width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(255,255,255,.32)", border: "1px solid rgba(255,255,255,.35)" },
};

/* CSS de “press” */
if (typeof document !== "undefined") {
  const id = "fitdeal-press-css";
  if (!document.getElementById(id)) {
    const st = document.createElement("style");
    st.id = id;
    st.innerHTML = `
      .apple-press:active { transform: translateY(1px) scale(.98); }
      .settings-press:active { transform: translateY(1px) scale(.97); }
    `;
    document.head.appendChild(st);
  }
}
