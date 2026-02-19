// treino.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

// ✅ agora mostra 01–60 (não repete A/B/C)
function dayLabel(i) {
  const n = Number(i) + 1;
  if (!Number.isFinite(n) || n <= 0) return "01";
  return String(n).padStart(2, "0");
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
    out.push({ idx, label: `Treino ${dayLabel(idx)}`, isToday: k === 0 });
  }
  return out;
}

/* ---------------- banco de grupos musculares (custom) ---------------- */
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
  while (base.length < minCount && i < extras.length) {
    base.push(extras[i++]);
  }
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

/* ---------------- ✅ 60 TREINOS (fixos no arquivo) ---------------- */
// helper curto (fica tudo “direto” no treino.jsx)
function ex(name, group, sets, reps, rest, method) {
  return { name, group, sets, reps, rest, method };
}

const PROGRAM_60 = {
  base: {
    style: "60 Treinos • Periodização (força + hipertrofia + condicionamento)",
    sets: "var",
    reps: "var",
    rest: "var",
  },

  // 60 dias, cada um com 10 exercícios (metade vai ficar “bloqueada” no free)
  split: [
    // 01 — Push (Hipertrofia)
    [
      ex("Supino reto barra", "Peito", 4, "6–10", "90–120s", "Hipertrofia • RPE 7–9"),
      ex("Supino inclinado halteres", "Peito", 4, "8–12", "75–90s", "Hipertrofia • controle"),
      ex("Crossover alto→baixo", "Peito", 3, "12–15", "60s", "Tensão contínua"),
      ex("Desenvolvimento militar", "Ombros", 4, "6–10", "90s", "Overhead base"),
      ex("Elevação lateral cabo", "Ombros", 3, "12–20", "45–60s", "Alta repetição"),
      ex("Tríceps testa barra W", "Tríceps", 3, "8–12", "60–75s", "Alongamento"),
      ex("Tríceps corda", "Tríceps", 3, "12–15", "45–60s", "Pump"),
      ex("Peck-deck (1s pico)", "Peito", 2, "15–20", "45s", "Pico de contração"),
      ex("Flexão pausada (2s)", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "35–50s", "45s", "Estabilidade"),
    ],

    // 02 — Pull (Hipertrofia)
    [
      ex("Puxada na barra (pronada)", "Costas", 4, "6–10", "90–120s", "Hipertrofia • RPE 7–9"),
      ex("Remada curvada barra", "Costas", 4, "6–10", "90–120s", "Base"),
      ex("Remada baixa neutra", "Costas", 3, "10–12", "75s", "Controle escápulas"),
      ex("Pulldown braço reto", "Costas", 3, "12–15", "60s", "Grande dorsal"),
      ex("Face pull", "Ombro/escápulas", 3, "12–20", "45–60s", "Saúde ombro"),
      ex("Rosca direta barra", "Bíceps", 3, "8–12", "60–75s", "Básico"),
      ex("Rosca martelo alternada", "Bíceps", 3, "10–12", "60s", "Braquiorradial"),
      ex("Rosca Scott máquina", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Hiperextensão lombar", "Posterior", 2, "12–15", "60s", "Lombar/Glúteo"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Anti-extensão"),
    ],

    // 03 — Pernas (Quad dominante)
    [
      ex("Agachamento livre", "Pernas", 5, "4–8", "120–180s", "Força técnica"),
      ex("Leg press", "Pernas", 4, "10–15", "90s", "Volume"),
      ex("Cadeira extensora", "Quadríceps", 3, "12–15", "60–75s", "Pico"),
      ex("Afundo búlgaro", "Glúteo/Quadríceps", 3, "8–12/lado", "75–90s", "Unilateral"),
      ex("Hack squat", "Pernas", 3, "8–12", "90s", "Amplitude"),
      ex("Sissy squat assistido", "Quadríceps", 2, "12–20", "60s", "Finalizador"),
      ex("Panturrilha em pé", "Panturrilha", 5, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "12–20", "45–60s", "Sóleo"),
      ex("Abdominal na polia", "Core", 3, "12–15", "45–60s", "Carga"),
      ex("Alongamento quadríceps curto", "Mobilidade", 1, "60–90s", "—", "Soltar"),
    ],

    // 04 — Posterior/Glúteo
    [
      ex("Terra romeno", "Posterior", 5, "4–8", "120–180s", "Força • hinge"),
      ex("Mesa flexora", "Posterior", 4, "8–12", "75–90s", "Controle"),
      ex("Hip thrust", "Glúteo", 4, "6–10", "90–120s", "Pico 1s"),
      ex("Good morning leve", "Posterior", 3, "10–12", "90s", "Técnica"),
      ex("Abdução máquina", "Glúteo médio", 3, "15–25", "45–60s", "Alto volume"),
      ex("Passada longa", "Glúteo", 3, "10–12/lado", "75–90s", "Unilateral"),
      ex("Glute bridge unilateral", "Glúteo", 2, "12–15/lado", "60s", "Finalizador"),
      ex("Nordic curl assistido", "Posterior", 2, "6–10", "90s", "Excêntrico"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45–60s", "Anti-rotação"),
      ex("Respiração 90/90", "Mobilidade", 1, "2–3min", "—", "Recuperação"),
    ],

    // 05 — Ombro/Core (saúde + shape)
    [
      ex("Desenvolvimento halteres sentado", "Ombros", 4, "6–10", "90s", "Base"),
      ex("Elevação lateral halteres", "Ombros", 4, "12–20", "45–60s", "Pump"),
      ex("Reverse fly (peck deck)", "Ombro posterior", 3, "12–20", "45–60s", "Postural"),
      ex("Encolhimento barra", "Trapézio", 4, "8–12", "75–90s", "Topo 1s"),
      ex("Elevação frontal cabo", "Ombros", 2, "12–15", "45–60s", "Complementar"),
      ex("Face pull alto", "Ombro/escápulas", 2, "15–25", "45s", "Manguito"),
      ex("Prancha lateral", "Core", 3, "25–40s/lado", "45s", "Oblíquos"),
      ex("Abdominal infra (reverse crunch)", "Core", 3, "10–15", "45–60s", "Controle"),
      ex("Farmer walk", "Core/Grip", 3, "30–45m", "60–90s", "Bracing"),
      ex("Alongamento peitoral curto", "Mobilidade", 1, "60–90s", "—", "Soltar"),
    ],

    // 06 — Full body (condicionamento + base)
    [
      ex("Agachamento goblet", "Pernas", 4, "10–15", "75s", "Base"),
      ex("Supino máquina", "Peito", 4, "10–15", "75s", "Controle"),
      ex("Remada máquina", "Costas", 4, "10–15", "75s", "Controle"),
      ex("Levantamento terra kettlebell", "Posterior", 3, "10–12", "90s", "Hinge leve"),
      ex("Desenvolvimento na máquina", "Ombros", 3, "10–12", "75s", "Seguro"),
      ex("Puxada neutra", "Costas", 3, "10–12", "75s", "Amplitude"),
      ex("Cadeira flexora", "Posterior", 3, "12–15", "60–75s", "Pump"),
      ex("Cadeira extensora", "Quadríceps", 3, "12–15", "60–75s", "Pump"),
      ex("Prancha com toque no ombro", "Core", 3, "16–24", "45s", "Estabilidade"),
      ex("Cardio Z2 (esteira/bike)", "Cardio", 1, "18–25min", "—", "Condicionamento"),
    ],

    // 07 — Push (força)
    [
      ex("Supino reto (pausa 1s)", "Peito", 6, "3–5", "150–210s", "Força"),
      ex("Supino inclinado barra", "Peito", 4, "5–8", "120s", "Força/hip"),
      ex("Dips (paralelas) com carga", "Tríceps/Peito", 4, "5–8", "120s", "Força"),
      ex("Desenvolvimento militar", "Ombros", 5, "3–6", "150s", "Força"),
      ex("Elevação lateral (rest-pause)", "Ombros", 3, "12–20", "45s", "Intensidade"),
      ex("Tríceps banco (pesado)", "Tríceps", 3, "6–10", "75–90s", "Básico"),
      ex("Tríceps barra V", "Tríceps", 3, "10–12", "60s", "Volume"),
      ex("Crucifixo inclinado cabo", "Peito", 2, "12–15", "60s", "Alongamento"),
      ex("Flexão diamante", "Tríceps", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Estabilidade"),
    ],

    // 08 — Pull (força)
    [
      ex("Barra fixa com carga", "Costas", 6, "3–5", "150–210s", "Força"),
      ex("Remada T-bar", "Costas", 5, "4–6", "150s", "Força"),
      ex("Remada unilateral halter (pesado)", "Costas", 4, "6–8/lado", "120s", "Força/controle"),
      ex("Puxada supinada", "Costas", 3, "6–10", "90s", "Dorsal"),
      ex("Face pull", "Ombro/escápulas", 3, "12–20", "60s", "Saúde"),
      ex("Rosca direta (pesada)", "Bíceps", 4, "5–8", "90s", "Força"),
      ex("Rosca martelo cruzada", "Bíceps", 3, "8–10", "75s", "Braquial"),
      ex("Rosca inversa barra", "Bíceps/Antebraço", 2, "12–15", "60s", "Antebraço"),
      ex("Pullover máquina", "Costas", 2, "12–15", "60s", "Alongamento"),
      ex("Hollow hold", "Core", 3, "20–35s", "45s", "Anti-extensão"),
    ],

    // 09 — Pernas (força — agacho variante)
    [
      ex("Agachamento frontal", "Pernas", 6, "3–5", "150–210s", "Força"),
      ex("Leg press (pesado)", "Pernas", 4, "6–10", "120s", "Força/volume"),
      ex("Cadeira extensora (myo-reps)", "Quadríceps", 3, "12–20", "45–60s", "Intensidade"),
      ex("Afundo no smith", "Glúteo/Quadríceps", 3, "8–12/lado", "90s", "Unilateral"),
      ex("Adutor máquina", "Adutores", 3, "12–20", "60s", "Base quadril"),
      ex("Panturrilha no leg press", "Panturrilha", 5, "10–15", "60s", "Pausas"),
      ex("Panturrilha em pé (dropset)", "Panturrilha", 2, "12–20", "45s", "Dropset"),
      ex("Abdominal declinado", "Core", 3, "10–15", "60s", "Carga"),
      ex("Prancha lateral", "Core", 2, "30–45s/lado", "45s", "Oblíquos"),
      ex("Mobilidade tornozelo", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 10 — Posterior/Glúteo (força — hinge variante)
    [
      ex("Terra sumô", "Posterior/Glúteo", 6, "3–5", "150–210s", "Força"),
      ex("RDL halteres", "Posterior", 4, "6–10", "120s", "Força/hip"),
      ex("Mesa flexora (excêntrico 3s)", "Posterior", 4, "8–12", "90s", "Tempo"),
      ex("Hip thrust (pesado)", "Glúteo", 5, "4–8", "120–150s", "Força"),
      ex("Back extension (glúteo)", "Glúteo", 3, "10–15", "75s", "Controle"),
      ex("Abdução cabo", "Glúteo médio", 3, "15–25", "45–60s", "Pump"),
      ex("Pull-through cabo", "Posterior/Glúteo", 3, "10–12", "75–90s", "Hinge"),
      ex("Flexora unilateral", "Posterior", 2, "12–15/lado", "60s", "Simetria"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45–60s", "Anti-rotação"),
      ex("Respiração + alongamento posterior", "Mobilidade", 1, "2–4min", "—", "Recuperação"),
    ],

    // 11 — Upper (volume) — peito/costas misto
    [
      ex("Supino inclinado halteres", "Peito", 4, "8–12", "75–90s", "Volume"),
      ex("Puxada neutra", "Costas", 4, "8–12", "75–90s", "Volume"),
      ex("Supino reto máquina", "Peito", 3, "10–15", "75s", "Controle"),
      ex("Remada baixa", "Costas", 3, "10–15", "75s", "Controle"),
      ex("Crucifixo cabo", "Peito", 3, "12–20", "60s", "Pump"),
      ex("Pulldown braço reto", "Costas", 3, "12–20", "60s", "Dorsal"),
      ex("Elevação lateral (alto volume)", "Ombros", 4, "15–25", "45s", "Shape"),
      ex("Tríceps francês halter", "Tríceps", 3, "10–12", "60s", "Alongamento"),
      ex("Rosca alternada", "Bíceps", 3, "10–12", "60s", "Pump"),
      ex("Abdominal polia", "Core", 3, "12–15", "45–60s", "Carga"),
    ],

    // 12 — Lower (volume) — pernas geral
    [
      ex("Leg press (amplitude)", "Pernas", 5, "10–15", "90s", "Volume"),
      ex("Agachamento no smith", "Pernas", 4, "8–12", "90s", "Controle"),
      ex("Cadeira extensora", "Quadríceps", 4, "12–20", "60s", "Pump"),
      ex("Mesa flexora", "Posterior", 4, "10–15", "75s", "Pump"),
      ex("Stiff leve", "Posterior", 3, "12–15", "90s", "Técnica"),
      ex("Hip thrust", "Glúteo", 4, "10–12", "90s", "Pico"),
      ex("Panturrilha sentado", "Panturrilha", 4, "12–20", "45–60s", "Sóleo"),
      ex("Panturrilha em pé", "Panturrilha", 3, "8–12", "60s", "Gastrocnêmio"),
      ex("Abductor machine", "Glúteo médio", 3, "20–30", "45s", "Pump"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Estabilidade"),
    ],

    // 13 — Push (técnicas: dropset/tempo)
    [
      ex("Supino reto (tempo 3-1-1)", "Peito", 4, "6–10", "120s", "Tempo"),
      ex("Supino inclinado máquina", "Peito", 3, "10–12", "90s", "Controle"),
      ex("Crossover (dropset)", "Peito", 2, "12–20", "45s", "Dropset"),
      ex("Desenvolvimento arnold", "Ombros", 4, "8–12", "90s", "Volume"),
      ex("Elevação lateral (myo-reps)", "Ombros", 3, "15–25", "45s", "Myo-reps"),
      ex("Tríceps corda (rest-pause)", "Tríceps", 3, "12–20", "45s", "Rest-pause"),
      ex("Tríceps testa cabo", "Tríceps", 2, "12–15", "60s", "Alongamento"),
      ex("Peito no cabo (press unilateral)", "Peito", 2, "12–15/lado", "60s", "Unilateral"),
      ex("Flexão inclinada", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha lateral", "Core", 3, "25–40s/lado", "45s", "Core"),
    ],

    // 14 — Pull (técnicas: cluster + pump)
    [
      ex("Remada curvada (cluster 2+2+2)", "Costas", 4, "6 total", "150s", "Cluster"),
      ex("Puxada alta pronada", "Costas", 4, "8–12", "90s", "Volume"),
      ex("Remada cavalinho", "Costas", 3, "10–12", "90s", "Controle"),
      ex("Pullover cabo", "Costas", 3, "12–15", "60s", "Alongamento"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45s", "Saúde"),
      ex("Rosca direta cabo", "Bíceps", 3, "10–12", "60s", "Tensão"),
      ex("Rosca martelo corda", "Bíceps", 3, "12–15", "60s", "Pump"),
      ex("Rosca concentrada", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Encolhimento halteres", "Trapézio", 3, "10–15", "75s", "Topo 1s"),
      ex("Hollow hold", "Core", 3, "20–35s", "45s", "Core"),
    ],

    // 15 — Lower (técnicas: pausa + unilateral)
    [
      ex("Agachamento (pausa 2s)", "Pernas", 5, "4–6", "150–210s", "Pausa"),
      ex("Leg press unilateral", "Pernas", 4, "8–12/lado", "90s", "Unilateral"),
      ex("Cadeira extensora unilateral", "Quadríceps", 3, "12–15/lado", "60s", "Simetria"),
      ex("Passada caminhando", "Glúteo/Quadríceps", 3, "12–16 passos", "90s", "Unilateral"),
      ex("Mesa flexora unilateral", "Posterior", 3, "10–12/lado", "75s", "Simetria"),
      ex("Hip thrust (pausa no topo)", "Glúteo", 4, "8–12", "90s", "Pico"),
      ex("Panturrilha donkey", "Panturrilha", 4, "10–15", "60s", "Amplitude"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–25", "45s", "Sóleo"),
      ex("Abdominal na bola", "Core", 3, "12–20", "45–60s", "Controle"),
      ex("Mobilidade quadril", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 16 — Deload ativo (corpo todo, leve)
    [
      ex("Agachamento leve (2–3 reps na reserva)", "Pernas", 3, "8–10", "90s", "Deload"),
      ex("Supino leve", "Peito", 3, "8–10", "90s", "Deload"),
      ex("Remada leve", "Costas", 3, "10–12", "75–90s", "Deload"),
      ex("Desenvolvimento leve", "Ombros", 2, "10–12", "75s", "Deload"),
      ex("Flexora leve", "Posterior", 2, "12–15", "60s", "Deload"),
      ex("Extensora leve", "Quadríceps", 2, "12–15", "60s", "Deload"),
      ex("Panturrilha leve", "Panturrilha", 3, "12–20", "45–60s", "Deload"),
      ex("Pallof press", "Core", 3, "10–12/lado", "45s", "Core"),
      ex("Caminhada inclinada", "Cardio", 1, "20–30min", "—", "Z2"),
      ex("Alongamento geral", "Mobilidade", 1, "6–10min", "—", "Recuperação"),
    ],

    // 17 — Push (hipertrofia 2)
    [
      ex("Supino inclinado barra", "Peito", 4, "6–10", "90–120s", "Hipertrofia • RPE 7–9"),
      ex("Supino reto halteres", "Peito", 4, "8–12", "75–90s", "Hipertrofia"),
      ex("Crucifixo inclinado", "Peito", 3, "12–15", "60s", "Alongamento"),
      ex("Desenvolvimento na máquina", "Ombros", 4, "8–12", "90s", "Seguro"),
      ex("Elevação lateral (cabo atrás)", "Ombros", 3, "12–20", "45–60s", "Tensão"),
      ex("Tríceps francês barra W", "Tríceps", 3, "8–12", "60–75s", "Alongamento"),
      ex("Tríceps coice cabo", "Tríceps", 3, "12–15", "45–60s", "Pico"),
      ex("Peck-deck", "Peito", 2, "15–20", "45s", "Pump"),
      ex("Flexão com elástico", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Core"),
    ],

    // 18 — Pull (hipertrofia 2)
    [
      ex("Puxada supinada", "Costas", 4, "6–10", "90–120s", "Hipertrofia"),
      ex("Remada máquina articulada", "Costas", 4, "8–12", "90s", "Controle"),
      ex("Remada unilateral cabo", "Costas", 3, "10–12/lado", "75s", "Unilateral"),
      ex("Pullover máquina", "Costas", 3, "12–15", "60s", "Alongamento"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45–60s", "Saúde"),
      ex("Rosca alternada (supinação)", "Bíceps", 3, "8–12", "60–75s", "Básico"),
      ex("Rosca spider", "Bíceps", 3, "10–12", "60s", "Pico"),
      ex("Rosca martelo banco inclinado", "Bíceps", 2, "12–15", "60s", "Alongamento"),
      ex("Encolhimento máquina", "Trapézio", 3, "10–15", "75s", "Topo"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Core"),
    ],

    // 19 — Quad (hipertrofia 2)
    [
      ex("Hack squat", "Pernas", 4, "6–10", "120s", "Hipertrofia"),
      ex("Agachamento no smith (calcanhar elevado)", "Quadríceps", 4, "8–12", "90s", "Quad foco"),
      ex("Leg press pés juntos", "Quadríceps", 4, "10–15", "90s", "Quad foco"),
      ex("Extensora (1.5 reps)", "Quadríceps", 3, "12–20", "60s", "Intensidade"),
      ex("Afundo búlgaro", "Glúteo/Quadríceps", 3, "10–12/lado", "90s", "Unilateral"),
      ex("Adutor máquina", "Adutores", 3, "15–25", "60s", "Quadril"),
      ex("Panturrilha em pé", "Panturrilha", 4, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "12–20", "45s", "Sóleo"),
      ex("Abdominal polia", "Core", 3, "12–15", "45–60s", "Carga"),
      ex("Mobilidade tornozelo", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 20 — Posterior/Glúteo (hipertrofia 2)
    [
      ex("Terra romeno halteres", "Posterior", 4, "8–12", "120s", "Hipertrofia"),
      ex("Mesa flexora", "Posterior", 4, "10–15", "90s", "Pump"),
      ex("Hip thrust", "Glúteo", 4, "8–12", "90–120s", "Pico 1s"),
      ex("Cadeira abdutora", "Glúteo médio", 4, "15–30", "45–60s", "Pump"),
      ex("Passada longa", "Glúteo", 3, "10–12/lado", "90s", "Unilateral"),
      ex("Pull-through", "Posterior/Glúteo", 3, "12–15", "75s", "Hinge"),
      ex("Flexora unilateral", "Posterior", 2, "12–15/lado", "60s", "Simetria"),
      ex("Glute bridge", "Glúteo", 2, "15–20", "60s", "Finalizador"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45s", "Core"),
      ex("Alongamento posterior", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 21 — Ombro/Braços (shape)
    [
      ex("Desenvolvimento halteres", "Ombros", 4, "8–12", "90s", "Shape"),
      ex("Elevação lateral (dropset)", "Ombros", 3, "12–25", "45s", "Dropset"),
      ex("Reverse fly cabo", "Ombro posterior", 3, "12–20", "45–60s", "Postural"),
      ex("Encolhimento halteres", "Trapézio", 3, "10–15", "75s", "Topo"),
      ex("Rosca direta barra W", "Bíceps", 4, "8–12", "75s", "Volume"),
      ex("Rosca martelo corda", "Bíceps", 3, "12–15", "60s", "Pump"),
      ex("Tríceps corda", "Tríceps", 4, "10–15", "60s", "Volume"),
      ex("Tríceps francês halter", "Tríceps", 3, "10–12", "60–75s", "Alongamento"),
      ex("Prancha lateral", "Core", 3, "30–45s/lado", "45s", "Core"),
      ex("Farmer walk", "Core/Grip", 2, "40–60m", "90s", "Bracing"),
    ],

    // 22 — Full body (metabólico)
    [
      ex("Agachamento goblet", "Pernas", 4, "12–15", "60–75s", "Metabólico"),
      ex("Supino halteres", "Peito", 4, "10–12", "60–75s", "Metabólico"),
      ex("Remada unilateral", "Costas", 4, "10–12/lado", "60–75s", "Metabólico"),
      ex("Desenvolvimento arnold", "Ombros", 3, "10–12", "60s", "Metabólico"),
      ex("Terra kettlebell", "Posterior", 3, "12–15", "75s", "Metabólico"),
      ex("Cadeira extensora", "Quadríceps", 3, "15–20", "45–60s", "Pump"),
      ex("Mesa flexora", "Posterior", 3, "15–20", "45–60s", "Pump"),
      ex("Panturrilha sentado", "Panturrilha", 4, "15–25", "45s", "Sóleo"),
      ex("Abdominal bicicleta", "Core", 3, "30–45", "45s", "Metabólico"),
      ex("Cardio intervalado leve", "Cardio", 1, "10–14min", "—", "1:1 leve"),
    ],

    // 23 — Push (ênfase peitoral superior)
    [
      ex("Supino inclinado barra", "Peito", 5, "4–8", "120–150s", "Ênfase superior"),
      ex("Supino inclinado halteres", "Peito", 4, "8–12", "90s", "Volume"),
      ex("Crossover baixo→alto", "Peito", 3, "12–15", "60s", "Clavicular"),
      ex("Crucifixo inclinado cabo", "Peito", 3, "12–20", "60s", "Alongamento"),
      ex("Desenvolvimento militar", "Ombros", 4, "6–10", "90–120s", "Base"),
      ex("Elevação lateral", "Ombros", 3, "12–20", "45–60s", "Pump"),
      ex("Tríceps testa", "Tríceps", 3, "8–12", "60–75s", "Alongamento"),
      ex("Tríceps na polia (barra)", "Tríceps", 2, "12–15", "60s", "Pump"),
      ex("Flexão declinada", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Core"),
    ],

    // 24 — Pull (ênfase dorsal)
    [
      ex("Puxada alta pegada aberta", "Costas", 5, "6–10", "120s", "Ênfase dorsal"),
      ex("Remada unilateral halter", "Costas", 4, "8–12/lado", "90s", "Controle"),
      ex("Remada baixa", "Costas", 4, "10–12", "75–90s", "Volume"),
      ex("Pulldown braço reto", "Costas", 3, "12–20", "60s", "Dorsal"),
      ex("Pullover cabo", "Costas", 2, "12–15", "60s", "Alongamento"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45–60s", "Saúde"),
      ex("Rosca direta", "Bíceps", 3, "8–12", "60–75s", "Volume"),
      ex("Rosca martelo", "Bíceps", 2, "12–15", "60s", "Pump"),
      ex("Rosca inversa", "Antebraço", 2, "12–15", "60s", "Antebraço"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Core"),
    ],

    // 25 — Lower (glúteo foco)
    [
      ex("Hip thrust", "Glúteo", 5, "6–10", "120–150s", "Ênfase glúteo"),
      ex("Agachamento sumô no smith", "Glúteo/Posterior", 4, "8–12", "90s", "Ênfase glúteo"),
      ex("Passada longa", "Glúteo", 4, "10–12/lado", "90s", "Unilateral"),
      ex("Abdução máquina", "Glúteo médio", 4, "15–30", "45–60s", "Pump"),
      ex("Pull-through cabo", "Glúteo/Posterior", 3, "12–15", "75s", "Hinge"),
      ex("Cadeira flexora", "Posterior", 3, "10–15", "75s", "Posterior"),
      ex("Extensora (leve)", "Quadríceps", 2, "15–20", "60s", "Equilíbrio"),
      ex("Panturrilha sentado", "Panturrilha", 4, "15–25", "45s", "Sóleo"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45s", "Core"),
      ex("Alongamento glúteo/piriforme", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 26 — Upper (braços foco)
    [
      ex("Supino máquina", "Peito", 3, "10–12", "75s", "Manutenção"),
      ex("Remada máquina", "Costas", 3, "10–12", "75s", "Manutenção"),
      ex("Elevação lateral", "Ombros", 3, "12–20", "45–60s", "Shape"),
      ex("Tríceps corda (rest-pause)", "Tríceps", 4, "12–20", "45s", "Intensidade"),
      ex("Tríceps francês", "Tríceps", 3, "10–12", "60–75s", "Alongamento"),
      ex("Rosca direta barra", "Bíceps", 4, "8–12", "75s", "Volume"),
      ex("Rosca alternada", "Bíceps", 3, "10–12", "60s", "Pump"),
      ex("Rosca concentrada", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Abdominal polia", "Core", 3, "12–15", "45–60s", "Carga"),
      ex("Farmer walk", "Core/Grip", 2, "40–60m", "90s", "Bracing"),
    ],

    // 27 — Lower (posterior foco)
    [
      ex("Terra romeno", "Posterior", 5, "4–8", "150s", "Ênfase posterior"),
      ex("Mesa flexora (tempo 3s)", "Posterior", 4, "8–12", "90s", "Tempo"),
      ex("Good morning", "Posterior", 3, "8–12", "120s", "Técnica"),
      ex("Hip thrust", "Glúteo", 4, "8–12", "90–120s", "Pico"),
      ex("Pull-through", "Posterior/Glúteo", 3, "12–15", "75s", "Hinge"),
      ex("Glute bridge unilateral", "Glúteo", 2, "12–15/lado", "60s", "Unilateral"),
      ex("Panturrilha em pé", "Panturrilha", 4, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–25", "45s", "Sóleo"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45s", "Core"),
      ex("Mobilidade posterior", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 28 — Full body (força moderada)
    [
      ex("Agachamento livre", "Pernas", 4, "4–6", "150s", "Força moderada"),
      ex("Supino reto", "Peito", 4, "4–6", "150s", "Força moderada"),
      ex("Remada curvada", "Costas", 4, "6–8", "120s", "Força moderada"),
      ex("Desenvolvimento militar", "Ombros", 3, "6–8", "120s", "Força moderada"),
      ex("Terra romeno", "Posterior", 3, "6–8", "150s", "Força moderada"),
      ex("Extensora", "Quadríceps", 2, "12–15", "60s", "Acessório"),
      ex("Flexora", "Posterior", 2, "12–15", "60s", "Acessório"),
      ex("Panturrilha em pé", "Panturrilha", 4, "10–15", "60s", "Volume"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Core"),
      ex("Cardio Z2", "Cardio", 1, "15–25min", "—", "Base"),
    ],

    // 29 — Push (peito + tríceps, volume alto)
    [
      ex("Supino reto halteres", "Peito", 4, "8–12", "90s", "Volume alto"),
      ex("Supino inclinado máquina", "Peito", 4, "10–15", "75–90s", "Volume"),
      ex("Crossover", "Peito", 4, "12–20", "60s", "Pump"),
      ex("Paralelas", "Tríceps/Peito", 3, "8–12", "90s", "Base"),
      ex("Tríceps corda", "Tríceps", 4, "12–15", "45–60s", "Pump"),
      ex("Tríceps francês", "Tríceps", 3, "10–12", "60–75s", "Alongamento"),
      ex("Elevação lateral", "Ombros", 3, "15–25", "45s", "Shape"),
      ex("Desenvolvimento máquina", "Ombros", 2, "10–12", "75s", "Seguro"),
      ex("Flexão", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Abdominal polia", "Core", 3, "12–15", "45s", "Core"),
    ],

    // 30 — Pull (costas + bíceps, volume alto)
    [
      ex("Puxada pronada", "Costas", 4, "8–12", "90s", "Volume alto"),
      ex("Remada baixa", "Costas", 4, "10–15", "75–90s", "Volume"),
      ex("Remada unilateral", "Costas", 3, "10–12/lado", "75s", "Unilateral"),
      ex("Pullover cabo", "Costas", 3, "12–15", "60s", "Alongamento"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45–60s", "Saúde"),
      ex("Rosca direta", "Bíceps", 4, "8–12", "75s", "Volume"),
      ex("Rosca martelo", "Bíceps", 3, "10–12", "60s", "Volume"),
      ex("Rosca Scott", "Bíceps", 2, "12–15", "60s", "Isolamento"),
      ex("Encolhimento", "Trapézio", 3, "10–15", "75s", "Topo"),
      ex("Hollow hold", "Core", 3, "20–35s", "45s", "Core"),
    ],

    // 31 — Pernas (quad + panturrilha, intensidade)
    [
      ex("Hack squat (pesado)", "Pernas", 5, "5–8", "150s", "Intensidade"),
      ex("Leg press (dropset)", "Pernas", 3, "8–15", "90s", "Dropset"),
      ex("Extensora (rest-pause)", "Quadríceps", 3, "12–20", "45–60s", "Rest-pause"),
      ex("Afundo búlgaro", "Glúteo/Quadríceps", 3, "8–12/lado", "90s", "Unilateral"),
      ex("Agachamento goblet", "Pernas", 2, "15–20", "60s", "Finalizador"),
      ex("Adutor máquina", "Adutores", 3, "15–25", "60s", "Quadril"),
      ex("Panturrilha em pé", "Panturrilha", 5, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–25", "45s", "Sóleo"),
      ex("Abdominal declinado", "Core", 3, "10–15", "60s", "Core"),
      ex("Mobilidade quadril", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 32 — Posterior/Glúteo (intensidade)
    [
      ex("Terra romeno (pesado)", "Posterior", 5, "5–8", "150s", "Intensidade"),
      ex("Mesa flexora (myo-reps)", "Posterior", 3, "12–20", "45–60s", "Myo-reps"),
      ex("Hip thrust (dropset)", "Glúteo", 3, "8–15", "90s", "Dropset"),
      ex("Pull-through", "Posterior/Glúteo", 3, "12–15", "75s", "Hinge"),
      ex("Abdução máquina", "Glúteo médio", 4, "15–30", "45s", "Pump"),
      ex("Back extension", "Posterior/Glúteo", 3, "12–15", "75s", "Controle"),
      ex("Flexora unilateral", "Posterior", 2, "12–15/lado", "60s", "Simetria"),
      ex("Glute bridge", "Glúteo", 2, "15–20", "60s", "Finalizador"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45s", "Core"),
      ex("Alongamento posterior", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 33 — Ombro/Core (intensidade)
    [
      ex("Desenvolvimento militar", "Ombros", 5, "4–8", "120–150s", "Intensidade"),
      ex("Elevação lateral (1.5 reps)", "Ombros", 4, "12–20", "45–60s", "Intensidade"),
      ex("Reverse fly", "Ombro posterior", 4, "12–20", "45–60s", "Postural"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45s", "Saúde"),
      ex("Encolhimento barra", "Trapézio", 4, "8–12", "75–90s", "Topo 1s"),
      ex("Farmer walk", "Core/Grip", 3, "30–50m", "90s", "Bracing"),
      ex("Prancha", "Core", 3, "45–70s", "45s", "Core"),
      ex("Prancha lateral", "Core", 3, "30–45s/lado", "45s", "Core"),
      ex("Abdominal infra", "Core", 3, "10–15", "45–60s", "Controle"),
      ex("Mobilidade torácica", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 34 — Full body (circuito)
    [
      ex("Agachamento goblet", "Pernas", 3, "12–15", "45s", "Circuito"),
      ex("Supino halteres", "Peito", 3, "10–12", "45s", "Circuito"),
      ex("Remada baixa", "Costas", 3, "10–12", "45s", "Circuito"),
      ex("Desenvolvimento halteres", "Ombros", 3, "10–12", "45s", "Circuito"),
      ex("Terra kettlebell", "Posterior", 3, "12–15", "45s", "Circuito"),
      ex("Extensora", "Quadríceps", 2, "15–20", "30–45s", "Circuito"),
      ex("Flexora", "Posterior", 2, "15–20", "30–45s", "Circuito"),
      ex("Panturrilha", "Panturrilha", 3, "15–25", "30–45s", "Circuito"),
      ex("Abdominal bicicleta", "Core", 3, "40–60", "30–45s", "Circuito"),
      ex("Cardio (leve)", "Cardio", 1, "12–18min", "—", "Z2"),
    ],

    // 35 — Push (força 2)
    [
      ex("Supino reto (pesado)", "Peito", 6, "3–5", "180s", "Força"),
      ex("Supino inclinado halteres (pesado)", "Peito", 4, "6–8", "120s", "Força/hip"),
      ex("Dips com carga", "Tríceps/Peito", 4, "5–8", "120s", "Força"),
      ex("Desenvolvimento militar", "Ombros", 5, "3–6", "150s", "Força"),
      ex("Elevação lateral", "Ombros", 3, "12–20", "45–60s", "Pump"),
      ex("Tríceps testa", "Tríceps", 3, "6–10", "90s", "Força"),
      ex("Tríceps corda", "Tríceps", 3, "12–15", "60s", "Pump"),
      ex("Crucifixo cabo", "Peito", 2, "12–15", "60s", "Alongamento"),
      ex("Flexão diamante", "Tríceps", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "45–70s", "45s", "Core"),
    ],

    // 36 — Pull (força 2)
    [
      ex("Barra fixa com carga", "Costas", 6, "3–5", "180s", "Força"),
      ex("Remada curvada (pesada)", "Costas", 5, "4–6", "150s", "Força"),
      ex("Remada unilateral (pesada)", "Costas", 4, "6–8/lado", "120s", "Força"),
      ex("Puxada supinada", "Costas", 3, "6–10", "90s", "Dorsal"),
      ex("Face pull", "Ombro/escápulas", 3, "12–20", "60s", "Saúde"),
      ex("Rosca direta (pesada)", "Bíceps", 4, "5–8", "90s", "Força"),
      ex("Rosca martelo", "Bíceps", 3, "8–10", "75s", "Braquial"),
      ex("Rosca inversa", "Antebraço", 2, "12–15", "60s", "Antebraço"),
      ex("Pullover máquina", "Costas", 2, "12–15", "60s", "Alongamento"),
      ex("Hollow hold", "Core", 3, "20–35s", "45s", "Core"),
    ],

    // 37 — Pernas (força 2)
    [
      ex("Agachamento frontal", "Pernas", 6, "3–5", "180s", "Força"),
      ex("Leg press (pesado)", "Pernas", 4, "6–10", "120s", "Força/volume"),
      ex("Extensora (pesada)", "Quadríceps", 3, "8–12", "75s", "Volume"),
      ex("Afundo no smith", "Glúteo/Quadríceps", 3, "8–12/lado", "90s", "Unilateral"),
      ex("Adutor máquina", "Adutores", 3, "12–20", "60s", "Quadril"),
      ex("Panturrilha em pé", "Panturrilha", 5, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "12–20", "45s", "Sóleo"),
      ex("Abdominal polia", "Core", 3, "10–15", "60s", "Carga"),
      ex("Prancha lateral", "Core", 2, "30–45s/lado", "45s", "Core"),
      ex("Mobilidade tornozelo", "Mobilidade", 1, "2–3min", "—", "Soltar"),
    ],

    // 38 — Posterior/Glúteo (força 2)
    [
      ex("Terra sumô", "Posterior/Glúteo", 6, "3–5", "180s", "Força"),
      ex("RDL barra", "Posterior", 4, "6–8", "150s", "Força/hip"),
      ex("Mesa flexora", "Posterior", 4, "8–12", "90s", "Volume"),
      ex("Hip thrust (pesado)", "Glúteo", 5, "4–8", "150s", "Força"),
      ex("Back extension", "Posterior/Glúteo", 3, "10–15", "75s", "Controle"),
      ex("Abdução máquina", "Glúteo médio", 3, "15–25", "45–60s", "Pump"),
      ex("Pull-through", "Posterior/Glúteo", 3, "10–12", "75–90s", "Hinge"),
      ex("Flexora unilateral", "Posterior", 2, "12–15/lado", "60s", "Simetria"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45–60s", "Core"),
      ex("Respiração + alongamento", "Mobilidade", 1, "2–4min", "—", "Recuperação"),
    ],

    // 39 — Upper (volume 2)
    [
      ex("Supino inclinado", "Peito", 4, "8–12", "90s", "Volume"),
      ex("Puxada neutra", "Costas", 4, "8–12", "90s", "Volume"),
      ex("Supino máquina", "Peito", 3, "10–15", "75s", "Controle"),
      ex("Remada máquina", "Costas", 3, "10–15", "75s", "Controle"),
      ex("Crucifixo", "Peito", 3, "12–20", "60s", "Pump"),
      ex("Pulldown braço reto", "Costas", 3, "12–20", "60s", "Dorsal"),
      ex("Elevação lateral", "Ombros", 4, "15–25", "45s", "Shape"),
      ex("Tríceps francês", "Tríceps", 3, "10–12", "60–75s", "Alongamento"),
      ex("Rosca alternada", "Bíceps", 3, "10–12", "60s", "Pump"),
      ex("Abdominal polia", "Core", 3, "12–15", "45–60s", "Core"),
    ],

    // 40 — Lower (volume 2)
    [
      ex("Leg press", "Pernas", 5, "10–15", "90s", "Volume"),
      ex("Agachamento smith", "Pernas", 4, "8–12", "90s", "Controle"),
      ex("Extensora", "Quadríceps", 4, "12–20", "60s", "Pump"),
      ex("Flexora", "Posterior", 4, "10–15", "75s", "Pump"),
      ex("Stiff leve", "Posterior", 3, "12–15", "90s", "Técnica"),
      ex("Hip thrust", "Glúteo", 4, "10–12", "90s", "Pico"),
      ex("Panturrilha sentado", "Panturrilha", 4, "12–20", "45–60s", "Sóleo"),
      ex("Panturrilha em pé", "Panturrilha", 3, "8–12", "60s", "Gastrocnêmio"),
      ex("Abdução", "Glúteo médio", 3, "20–30", "45s", "Pump"),
      ex("Prancha", "Core", 3, "45–70s", "45s", "Core"),
    ],

    // 41 — Push (técnicas 2)
    [
      ex("Supino reto (top set + back-off)", "Peito", 1, "4–6", "180s", "Top set"),
      ex("Supino reto (back-off)", "Peito", 3, "8–10", "120s", "Back-off"),
      ex("Supino inclinado halteres", "Peito", 3, "10–12", "90s", "Volume"),
      ex("Crossover (myo-reps)", "Peito", 3, "12–20", "45–60s", "Myo-reps"),
      ex("Desenvolvimento militar", "Ombros", 4, "6–10", "120s", "Base"),
      ex("Elevação lateral (dropset)", "Ombros", 3, "12–25", "45s", "Dropset"),
      ex("Tríceps corda (rest-pause)", "Tríceps", 3, "12–20", "45s", "Rest-pause"),
      ex("Tríceps testa", "Tríceps", 2, "10–12", "75s", "Alongamento"),
      ex("Flexão", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha lateral", "Core", 3, "30–45s/lado", "45s", "Core"),
    ],

    // 42 — Pull (técnicas 2)
    [
      ex("Barra fixa (cluster)", "Costas", 4, "6 total", "150–180s", "Cluster"),
      ex("Remada T-bar", "Costas", 4, "8–10", "120s", "Volume"),
      ex("Remada baixa", "Costas", 3, "10–12", "90s", "Controle"),
      ex("Pullover cabo", "Costas", 3, "12–15", "60s", "Alongamento"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45–60s", "Saúde"),
      ex("Rosca direta cabo", "Bíceps", 3, "10–12", "60s", "Tensão"),
      ex("Rosca martelo corda", "Bíceps", 3, "12–15", "60s", "Pump"),
      ex("Rosca concentrada", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Encolhimento", "Trapézio", 3, "10–15", "75s", "Topo"),
      ex("Hollow hold", "Core", 3, "20–35s", "45s", "Core"),
    ],

    // 43 — Lower (técnicas 2)
    [
      ex("Agachamento (pausa 2s)", "Pernas", 5, "4–6", "180s", "Pausa"),
      ex("Leg press unilateral", "Pernas", 4, "8–12/lado", "90s", "Unilateral"),
      ex("Extensora (myo-reps)", "Quadríceps", 3, "12–20", "45–60s", "Myo-reps"),
      ex("Passada caminhando", "Glúteo/Quadríceps", 3, "12–16 passos", "90s", "Unilateral"),
      ex("Flexora unilateral", "Posterior", 3, "10–12/lado", "75s", "Simetria"),
      ex("Hip thrust", "Glúteo", 4, "8–12", "90s", "Pico"),
      ex("Panturrilha donkey", "Panturrilha", 4, "10–15", "60s", "Amplitude"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–25", "45s", "Sóleo"),
      ex("Abdominal bola", "Core", 3, "12–20", "45–60s", "Controle"),
      ex("Mobilidade quadril", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 44 — Deload ativo 2
    [
      ex("Agachamento leve", "Pernas", 3, "8–10", "90s", "Deload"),
      ex("Supino leve", "Peito", 3, "8–10", "90s", "Deload"),
      ex("Remada leve", "Costas", 3, "10–12", "75–90s", "Deload"),
      ex("Desenvolvimento leve", "Ombros", 2, "10–12", "75s", "Deload"),
      ex("Flexora leve", "Posterior", 2, "12–15", "60s", "Deload"),
      ex("Extensora leve", "Quadríceps", 2, "12–15", "60s", "Deload"),
      ex("Panturrilha leve", "Panturrilha", 3, "12–20", "45–60s", "Deload"),
      ex("Pallof press", "Core", 3, "10–12/lado", "45s", "Core"),
      ex("Caminhada inclinada", "Cardio", 1, "20–30min", "—", "Z2"),
      ex("Alongamento geral", "Mobilidade", 1, "6–10min", "—", "Recuperação"),
    ],

    // 45 — Push (hipertrofia 3)
    [
      ex("Supino reto barra", "Peito", 4, "6–10", "90–120s", "Hipertrofia"),
      ex("Supino inclinado halteres", "Peito", 4, "8–12", "75–90s", "Hipertrofia"),
      ex("Crossover", "Peito", 3, "12–15", "60s", "Pump"),
      ex("Desenvolvimento militar", "Ombros", 4, "6–10", "90s", "Base"),
      ex("Elevação lateral", "Ombros", 3, "12–20", "45–60s", "Pump"),
      ex("Tríceps testa", "Tríceps", 3, "8–12", "60–75s", "Alongamento"),
      ex("Tríceps corda", "Tríceps", 3, "12–15", "45–60s", "Pump"),
      ex("Peck-deck", "Peito", 2, "15–20", "45s", "Pico"),
      ex("Flexão pausada", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "35–50s", "45s", "Core"),
    ],

    // 46 — Pull (hipertrofia 3)
    [
      ex("Puxada pronada", "Costas", 4, "6–10", "90–120s", "Hipertrofia"),
      ex("Remada curvada", "Costas", 4, "6–10", "90–120s", "Base"),
      ex("Remada baixa", "Costas", 3, "10–12", "75s", "Controle"),
      ex("Pulldown braço reto", "Costas", 3, "12–15", "60s", "Dorsal"),
      ex("Face pull", "Ombro/escápulas", 3, "12–20", "45–60s", "Saúde"),
      ex("Rosca direta", "Bíceps", 3, "8–12", "60–75s", "Básico"),
      ex("Rosca martelo", "Bíceps", 3, "10–12", "60s", "Braquial"),
      ex("Rosca Scott", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Hiperextensão lombar", "Posterior", 2, "12–15", "60s", "Lombar"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Core"),
    ],

    // 47 — Quad (hipertrofia 3)
    [
      ex("Agachamento livre", "Pernas", 5, "4–8", "120–180s", "Força técnica"),
      ex("Leg press", "Pernas", 4, "10–15", "90s", "Volume"),
      ex("Extensora", "Quadríceps", 3, "12–15", "60–75s", "Pico"),
      ex("Afundo búlgaro", "Glúteo/Quadríceps", 3, "8–12/lado", "90s", "Unilateral"),
      ex("Hack squat", "Pernas", 3, "8–12", "90s", "Amplitude"),
      ex("Sissy squat assistido", "Quadríceps", 2, "12–20", "60s", "Finalizador"),
      ex("Panturrilha em pé", "Panturrilha", 5, "8–12", "60s", "Pausas"),
      ex("Panturrilha sentado", "Panturrilha", 3, "12–20", "45–60s", "Sóleo"),
      ex("Abdominal polia", "Core", 3, "12–15", "45–60s", "Carga"),
      ex("Alongamento quadríceps", "Mobilidade", 1, "60–90s", "—", "Soltar"),
    ],

    // 48 — Posterior/Glúteo (hipertrofia 3)
    [
      ex("Terra romeno", "Posterior", 5, "4–8", "120–180s", "Força hinge"),
      ex("Mesa flexora", "Posterior", 4, "8–12", "75–90s", "Controle"),
      ex("Hip thrust", "Glúteo", 4, "6–10", "90–120s", "Pico 1s"),
      ex("Good morning leve", "Posterior", 3, "10–12", "90s", "Técnica"),
      ex("Abdução", "Glúteo médio", 3, "15–25", "45–60s", "Volume"),
      ex("Passada foco glúteo", "Glúteo", 3, "10–12/lado", "75–90s", "Unilateral"),
      ex("Glute bridge unilateral", "Glúteo", 2, "12–15/lado", "60s", "Finalizador"),
      ex("Nordic curl assistido", "Posterior", 2, "6–10", "90s", "Excêntrico"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45–60s", "Anti-rotação"),
      ex("Respiração 90/90", "Mobilidade", 1, "2–3min", "—", "Recuperação"),
    ],

    // 49 — Ombro/Core (hipertrofia 3)
    [
      ex("Desenvolvimento", "Ombros", 4, "6–10", "90s", "Base"),
      ex("Elevação lateral", "Ombros", 4, "12–20", "45–60s", "Pump"),
      ex("Reverse fly", "Ombro posterior", 3, "12–20", "45–60s", "Postural"),
      ex("Encolhimento", "Trapézio", 4, "8–12", "75–90s", "Topo 1s"),
      ex("Pallof press", "Core", 3, "10–14/lado", "45–60s", "Core"),
      ex("Abdominal", "Core", 3, "12–15", "45–60s", "Core"),
      ex("Prancha lateral", "Core", 3, "25–40s/lado", "45s", "Core"),
      ex("Farmer walk", "Core/Grip", 2, "40–60m", "90s", "Bracing"),
      ex("Face pull", "Ombro/escápulas", 2, "15–25", "45s", "Saúde"),
      ex("Alongamento peitoral", "Mobilidade", 1, "60–90s", "—", "Soltar"),
    ],

    // 50 — Full body (saúde/base 2)
    [
      ex("Agachamento (leve)", "Pernas", 4, "10–12", "75–90s", "Saúde/base"),
      ex("Supino (leve)", "Peito", 4, "10–12", "75–90s", "Saúde/base"),
      ex("Remada (leve)", "Costas", 4, "10–12", "75–90s", "Saúde/base"),
      ex("Desenvolvimento (leve)", "Ombros", 3, "10–12", "75s", "Saúde/base"),
      ex("Posterior (leve)", "Posterior", 3, "10–12", "90s", "Saúde/base"),
      ex("Core (prancha)", "Core", 3, "40–60s", "45s", "Base"),
      ex("Panturrilha", "Panturrilha", 4, "12–20", "45–60s", "Base"),
      ex("Mobilidade quadril", "Mobilidade", 1, "3–5min", "—", "Soltar"),
      ex("Mobilidade torácica", "Mobilidade", 1, "3–5min", "—", "Soltar"),
      ex("Cardio Z2", "Cardio", 1, "20–35min", "—", "Base"),
    ],

    // 51 — Push (final block: densidade)
    [
      ex("Supino reto", "Peito", 4, "6–10", "75–90s", "Densidade"),
      ex("Supino inclinado halteres", "Peito", 3, "8–12", "75–90s", "Densidade"),
      ex("Crossover", "Peito", 3, "12–15", "45–60s", "Densidade"),
      ex("Desenvolvimento", "Ombros", 3, "8–12", "75–90s", "Densidade"),
      ex("Elevação lateral", "Ombros", 4, "15–25", "30–45s", "Densidade"),
      ex("Tríceps corda", "Tríceps", 4, "10–15", "45–60s", "Densidade"),
      ex("Tríceps francês", "Tríceps", 2, "10–12", "60s", "Alongamento"),
      ex("Peck-deck", "Peito", 2, "15–20", "45s", "Pump"),
      ex("Flexão", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "40–60s", "45s", "Core"),
    ],

    // 52 — Pull (densidade)
    [
      ex("Puxada pronada", "Costas", 4, "8–12", "75–90s", "Densidade"),
      ex("Remada baixa", "Costas", 4, "10–12", "75–90s", "Densidade"),
      ex("Remada unilateral", "Costas", 3, "10–12/lado", "60–75s", "Densidade"),
      ex("Pulldown braço reto", "Costas", 3, "12–20", "45–60s", "Densidade"),
      ex("Face pull", "Ombro/escápulas", 3, "15–25", "45s", "Saúde"),
      ex("Rosca direta", "Bíceps", 4, "8–12", "60–75s", "Densidade"),
      ex("Rosca martelo", "Bíceps", 3, "12–15", "45–60s", "Pump"),
      ex("Rosca Scott", "Bíceps", 2, "12–15", "45–60s", "Isolamento"),
      ex("Encolhimento", "Trapézio", 3, "10–15", "60–75s", "Topo"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Core"),
    ],

    // 53 — Lower (densidade)
    [
      ex("Leg press", "Pernas", 5, "10–15", "75–90s", "Densidade"),
      ex("Hack squat", "Pernas", 4, "8–12", "90s", "Densidade"),
      ex("Extensora", "Quadríceps", 4, "12–20", "45–60s", "Pump"),
      ex("Flexora", "Posterior", 4, "12–20", "45–60s", "Pump"),
      ex("Hip thrust", "Glúteo", 4, "10–12", "90s", "Pico"),
      ex("Abdução", "Glúteo médio", 3, "20–30", "45s", "Pump"),
      ex("Panturrilha em pé", "Panturrilha", 5, "10–15", "45–60s", "Densidade"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–25", "45s", "Sóleo"),
      ex("Abdominal polia", "Core", 3, "12–15", "45s", "Core"),
      ex("Mobilidade quadril", "Mobilidade", 1, "2–4min", "—", "Soltar"),
    ],

    // 54 — Full body (intervalos)
    [
      ex("Agachamento goblet", "Pernas", 3, "12–15", "45s", "Intervalos"),
      ex("Supino halteres", "Peito", 3, "10–12", "45s", "Intervalos"),
      ex("Remada baixa", "Costas", 3, "10–12", "45s", "Intervalos"),
      ex("Desenvolvimento halteres", "Ombros", 3, "10–12", "45s", "Intervalos"),
      ex("Terra kettlebell", "Posterior", 3, "12–15", "45s", "Intervalos"),
      ex("Extensora", "Quadríceps", 2, "15–20", "30–45s", "Intervalos"),
      ex("Flexora", "Posterior", 2, "15–20", "30–45s", "Intervalos"),
      ex("Panturrilha", "Panturrilha", 3, "15–25", "30–45s", "Intervalos"),
      ex("Abdominal bicicleta", "Core", 3, "40–60", "30–45s", "Intervalos"),
      ex("Cardio intervalado", "Cardio", 1, "12–16min", "—", "1:1"),
    ],

    // 55 — Push (pump final)
    [
      ex("Supino máquina", "Peito", 4, "10–15", "60–75s", "Pump"),
      ex("Supino inclinado halteres", "Peito", 3, "12–15", "60s", "Pump"),
      ex("Crossover", "Peito", 4, "15–25", "45–60s", "Pump"),
      ex("Desenvolvimento máquina", "Ombros", 3, "10–12", "60–75s", "Pump"),
      ex("Elevação lateral", "Ombros", 5, "15–30", "30–45s", "Pump"),
      ex("Tríceps corda", "Tríceps", 4, "12–20", "45s", "Pump"),
      ex("Tríceps barra V", "Tríceps", 3, "12–15", "45–60s", "Pump"),
      ex("Peck-deck", "Peito", 2, "15–25", "45s", "Finalizador"),
      ex("Flexão", "Peito", 2, "AMRAP", "60s", "Finalizador"),
      ex("Prancha", "Core", 3, "45–70s", "45s", "Core"),
    ],

    // 56 — Pull (pump final)
    [
      ex("Puxada neutra", "Costas", 4, "10–15", "60–75s", "Pump"),
      ex("Remada máquina", "Costas", 4, "10–15", "60–75s", "Pump"),
      ex("Remada unilateral cabo", "Costas", 3, "12–15/lado", "60s", "Pump"),
      ex("Pulldown braço reto", "Costas", 4, "15–25", "45–60s", "Pump"),
      ex("Face pull", "Ombro/escápulas", 3, "15–30", "45s", "Saúde"),
      ex("Rosca direta", "Bíceps", 4, "10–15", "60s", "Pump"),
      ex("Rosca martelo", "Bíceps", 3, "12–15", "45–60s", "Pump"),
      ex("Rosca concentrada", "Bíceps", 2, "12–15", "45s", "Isolamento"),
      ex("Encolhimento", "Trapézio", 3, "12–20", "60s", "Topo"),
      ex("Dead bug", "Core", 3, "10–14/lado", "45s", "Core"),
    ],

    // 57 — Lower (pump final)
    [
      ex("Leg press", "Pernas", 4, "12–20", "60–75s", "Pump"),
      ex("Hack squat", "Pernas", 3, "10–15", "75s", "Pump"),
      ex("Extensora", "Quadríceps", 4, "15–25", "45–60s", "Pump"),
      ex("Flexora", "Posterior", 4, "15–25", "45–60s", "Pump"),
      ex("Hip thrust", "Glúteo", 4, "12–15", "75–90s", "Pico"),
      ex("Abdução", "Glúteo médio", 3, "20–35", "45s", "Pump"),
      ex("Panturrilha em pé", "Panturrilha", 5, "12–20", "45s", "Pump"),
      ex("Panturrilha sentado", "Panturrilha", 3, "15–30", "45s", "Sóleo"),
      ex("Abdominal polia", "Core", 3, "12–20", "45s", "Core"),
      ex("Mobilidade geral", "Mobilidade", 1, "4–8min", "—", "Soltar"),
    ],

    // 58 — Ombro/Braços (pump final)
    [
      ex("Desenvolvimento halteres", "Ombros", 3, "10–12", "60–75s", "Pump"),
      ex("Elevação lateral", "Ombros", 5, "15–30", "30–45s", "Pump"),
      ex("Reverse fly", "Ombro posterior", 4, "15–25", "45s", "Pump"),
      ex("Face pull", "Ombro/escápulas", 3, "20–30", "45s", "Saúde"),
      ex("Rosca direta", "Bíceps", 4, "10–15", "60s", "Pump"),
      ex("Rosca martelo", "Bíceps", 3, "12–15", "45–60s", "Pump"),
      ex("Tríceps corda", "Tríceps", 4, "12–20", "45s", "Pump"),
      ex("Tríceps francês", "Tríceps", 3, "10–12", "60s", "Alongamento"),
      ex("Prancha lateral", "Core", 3, "30–45s/lado", "45s", "Core"),
      ex("Farmer walk", "Core/Grip", 2, "40–60m", "90s", "Bracing"),
    ],

    // 59 — Full body (recuperação ativa)
    [
      ex("Agachamento leve", "Pernas", 3, "10–12", "75–90s", "Recuperação"),
      ex("Supino leve", "Peito", 3, "10–12", "75–90s", "Recuperação"),
      ex("Remada leve", "Costas", 3, "10–12", "75–90s", "Recuperação"),
      ex("Desenvolvimento leve", "Ombros", 2, "10–12", "75s", "Recuperação"),
      ex("Flexora leve", "Posterior", 2, "12–15", "60s", "Recuperação"),
      ex("Extensora leve", "Quadríceps", 2, "12–15", "60s", "Recuperação"),
      ex("Panturrilha leve", "Panturrilha", 3, "12–20", "45–60s", "Recuperação"),
      ex("Pallof press", "Core", 3, "10–12/lado", "45s", "Core"),
      ex("Caminhada", "Cardio", 1, "25–40min", "—", "Z2"),
      ex("Alongamento", "Mobilidade", 1, "8–12min", "—", "Soltar"),
    ],

    // 60 — Teste de performance (AMRAP controlado)
    [
      ex("Supino reto", "Peito", 3, "AMRAP (técnica)", "150s", "Teste • pare antes de falhar feio"),
      ex("Barra fixa", "Costas", 3, "AMRAP", "150s", "Teste"),
      ex("Agachamento", "Pernas", 3, "AMRAP (técnica)", "180s", "Teste"),
      ex("Terra romeno", "Posterior", 3, "8–12", "150s", "Controle"),
      ex("Desenvolvimento", "Ombros", 3, "8–12", "120s", "Controle"),
      ex("Extensora", "Quadríceps", 2, "15–20", "60s", "Pump"),
      ex("Flexora", "Posterior", 2, "15–20", "60s", "Pump"),
      ex("Panturrilha", "Panturrilha", 4, "12–20", "45–60s", "Pump"),
      ex("Prancha", "Core", 3, "45–75s", "45s", "Core"),
      ex("Cardio leve", "Cardio", 1, "12–20min", "—", "Z2"),
    ],
  ],
};

export default function Treino() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = localStorage.getItem(`paid_${email}`) === "1";

  // ✅ se existir plano custom, usa ele; se não, usa os 60 treinos fixos
  const plan = useMemo(() => buildCustomPlan(email), [email]);

  const fallbackSplit = useMemo(() => PROGRAM_60, []);

  const base = plan?.base || fallbackSplit.base;
  const split = plan?.split || fallbackSplit.split;

  const dayIndex = useMemo(() => calcDayIndex(email), [email]);
  const [viewIdx, setViewIdx] = useState(dayIndex);

  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);
  const viewingIsToday = viewSafe === mod(dayIndex, split.length);

  const workout = useMemo(() => split[viewSafe] || [], [split, viewSafe]);

  const doneKey = `done_ex_${email}_${viewSafe}`;
  const [done, setDone] = useState(() => safeJsonParse(localStorage.getItem(doneKey), {}));
  const [tapId, setTapId] = useState(null);

  const [loads, setLoads] = useState(() => loadLoads(email));

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
    const nextVal = Math.max(0, Math.round((cur + delta) * 2) / 2); // 0.5kg steps
    const next = { ...loads, [k]: nextVal };
    setLoads(next);
    saveLoads(email, next);
  }

  // ✅ sem reload + navega para dashboard
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

    // vai pro dashboard
    nav("/dashboard");
  }

  const previewCount = Math.max(2, Math.ceil(workout.length / 2));
  const previewList = workout.slice(0, previewCount);
  const lockedList = workout.slice(previewCount);

  const strip = useMemo(() => getWeekdaysStrip(split.length, mod(dayIndex, split.length)), [split.length, dayIndex]);

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
            Treino {dayLabel(viewSafe)} {viewingIsToday ? "• hoje" : ""}
          </div>
          <div style={styles.headerSub}>
            {plan ? (
              <>
                Método: <b>{base.style}</b> • foco:{" "}
                <b>{(split[viewSafe]?.[0]?.method || "Custom").split("•")[0] || "Personalizado"}</b>
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
                  const nextKey = `done_ex_${email}_${d.idx}`;
                  setDone(safeJsonParse(localStorage.getItem(nextKey), {}));
                }}
              >
                {d.label}
                {d.isToday ? " • hoje" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* EXERCÍCIOS DO DIA */}
      <button style={styles.bigGo} onClick={() => openExercises()} type="button">
        <div style={styles.bigGoRow}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.bigGoTop}>Exercícios do dia</div>
            <div style={styles.bigGoSub}>
              Abrir treino {dayLabel(viewSafe)} • {workout.length} exercícios
            </div>
          </div>

          <div style={styles.bigGoIcon}>
            <ArrowIcon />
          </div>
        </div>

        <div style={styles.bubbles}>
          <span style={styles.bubble}>{viewingIsToday ? "Hoje" : `Dia ${dayLabel(viewSafe)}`}</span>
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
          <button style={styles.cardBtn} onClick={() => nav("/metas")} type="button">
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
          <button style={styles.cardBtn} onClick={() => nav("/cardio")} type="button">
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
              <button style={styles.customBtn} onClick={() => nav("/treino/personalizar")} type="button">
                Personalizar
              </button>

              <button style={styles.cardBtnAlt} onClick={() => openExercises()} type="button">
                Abrir detalhes
              </button>
            </div>

            {!viewingIsToday ? (
              <div style={styles.viewHint}>
                Você está visualizando <b>Treino {dayLabel(viewSafe)}</b>. Para concluir e avançar o ciclo, volte para{" "}
                <b>Hoje</b>.
              </div>
            ) : null}
          </>
        ) : (
          <div style={styles.lockHint}>Você está no Modo Gratuito. Assine para liberar treino completo e personalização.</div>
        )}
      </div>

      {/* LISTA */}
      <div style={styles.sectionTitle}>Lista do treino - Resumido</div>

      <div style={styles.list}>
        {previewList.map((exItem, i) => {
          const isDone = !!done[i];
          const loadKey = keyForLoad(viewSafe, exItem.name);
          const curLoad = loads[loadKey] ?? 0;

          return (
            <div key={i} style={styles.exCard}>
              <div style={styles.exTop}>
                <div style={styles.num}>{i + 1}</div>

                <div style={{ minWidth: 0 }}>
                  <div style={styles.exName}>{exItem.name}</div>
                  <div style={styles.exNote}>
                    {exItem.group} • {exItem.sets} séries • {exItem.reps} • descanso {exItem.rest}
                  </div>

                  <div style={styles.loadRow}>
                    <span style={styles.loadLabel}>Carga</span>
                    <div style={styles.loadPill}>
                      <button
                        type="button"
                        style={styles.loadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLoad(exItem.name, -2.5);
                        }}
                        aria-label="Diminuir carga"
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
                          adjustLoad(exItem.name, +2.5);
                        }}
                        aria-label="Aumentar carga"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      style={styles.loadMini}
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustLoad(exItem.name, +1);
                      }}
                      title="Ajuste fino"
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
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            {lockedList.map((exItem, j) => (
              <div key={`l_${j}`} style={styles.exCard}>
                <div style={styles.exTop}>
                  <div style={styles.numMuted}>{previewCount + j + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.exName}>{exItem.name}</div>
                    <div style={styles.exNote}>{exItem.group} • + dicas e execução</div>
                  </div>
                  <div style={styles.checkGhost} />
                </div>
              </div>
            ))}
          </div>

          <button style={styles.fab} onClick={() => nav("/planos")} type="button">
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

      {/* ✅ BOTÃO FLUTUANTE “CONCLUIR TREINO” */}
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
  stripPill: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
    transition: "transform .12s ease",
  },
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
    transition: "transform .12s ease",
    animation: "softFloat 3.6s ease-in-out infinite",
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

  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transition: "width .25s ease",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
  },
  progressHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  card: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.4 },

  cardBtn: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
  },
  cardBtnAlt: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
  },

  summaryTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  summaryLine: { marginTop: 8, fontSize: 13, fontWeight: 850, color: MUTED },
  summaryActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  customBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },

  viewHint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 18,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
  },

  lockHint: {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 18,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    color: TEXT,
    fontWeight: 850,
    fontSize: 12,
    lineHeight: 1.35,
  },

  sectionTitle: { marginTop: 16, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  list: { marginTop: 12, display: "grid", gap: 12 },

  exCard: {
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 34px rgba(15,23,42,.05)",
  },
  exTop: { display: "flex", gap: 12, alignItems: "flex-start" },

  num: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 15,
    flexShrink: 0,
    marginTop: 2,
  },
  numMuted: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 15,
    flexShrink: 0,
  },

  exName: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  exNote: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  loadRow: { marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  loadLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  loadPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  loadBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,106,0,.18)",
    fontWeight: 950,
    color: TEXT,
  },
  loadValue: { minWidth: 96, textAlign: "center", fontSize: 12, fontWeight: 900, color: TEXT },
  loadMini: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,106,0,.25)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    color: TEXT,
  },

  checkBtn: {
    marginLeft: "auto",
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    display: "grid",
    placeItems: "center",
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
    marginTop: 2,
  },
  checkOn: { background: "linear-gradient(135deg, #FF6A00, #FF8A3D)", boxShadow: "0 14px 34px rgba(255,106,0,.22)" },
  checkOff: { background: "rgba(15,23,42,.06)", boxShadow: "none" },
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
    letterSpacing: -0.2,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,

    boxShadow: "0 22px 70px rgba(255,106,0,.34), inset 0 1px 0 rgba(255,255,255,.28)",
    animation: "pulseGlow 1.8s ease-in-out infinite",
    willChange: "transform",
  },
  fabIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    flexShrink: 0,

    background: "rgba(255,255,255,.88)",
    border: "1px solid rgba(255,255,255,.55)",
    display: "grid",
    placeItems: "center",

    boxShadow: "0 12px 26px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.55)",
  },
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
    letterSpacing: -0.2,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,

    boxShadow: "0 26px 90px rgba(255,106,0,.38), inset 0 1px 0 rgba(255,255,255,.30)",
    animation: "finishFloat 3.2s ease-in-out infinite",
    willChange: "transform",
  },
  finishFabIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    flexShrink: 0,

    background: "rgba(255,255,255,.90)",
    border: "1px solid rgba(255,255,255,.60)",
    display: "grid",
    placeItems: "center",

    boxShadow: "0 14px 34px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.55)",
  },
  finishFabText: { fontSize: 14, lineHeight: 1, whiteSpace: "nowrap" },
  finishFabArrow: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.32)",
    border: "1px solid rgba(255,255,255,.35)",
  },
};

// animações CSS inline
if (typeof document !== "undefined") {
  const id = "fitdeal-treino-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes pulseGlow {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.03); }
      }
      @keyframes softFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }
      @keyframes finishFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }
        50% { transform: translateX(-50%) translateY(-3px) scale(1.01); }
      }
      .apple-press:active { transform: translateY(1px) scale(.98); }
      .settings-press:active { transform: translateY(1px) scale(.97); }
    `;
    document.head.appendChild(style);
  }
}
