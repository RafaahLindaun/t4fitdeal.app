// ✅ COLE EM: src/pages/Onboarding.jsx
// Inclui: gerador determinístico (seed) + plano congelado em localStorage
// Mantém as 3 perguntas (meta/dias/nível) e esconde bottom tabs durante onboarding.

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

/* ---------------- split/intensidade (seu original) ---------------- */
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

/* =========================================================
   ✅ MOTOR DE TREINO (determinístico, sem IA)
   - Biblioteca (catalogada)
   - Templates por frequência/objetivo
   - Gerador com seed (congela o plano)
========================================================= */

/** hash simples → int 32 bits */
function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG determinístico (mulberry32) */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne(rng, arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function pickUnique(rng, arr, count, avoidNames = new Set()) {
  const pool = (arr || []).filter((x) => x && !avoidNames.has(x.name));
  const out = [];
  const used = new Set();
  while (out.length < count && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    const cand = pool[i];
    if (!cand || used.has(cand.name)) {
      pool.splice(i, 1);
      continue;
    }
    used.add(cand.name);
    out.push(cand);
    pool.splice(i, 1);
  }
  return out;
}

/** tags helpers */
function hasAnyTag(ex, tags) {
  const t = new Set(ex?.tags || []);
  return (tags || []).some((x) => t.has(x));
}

function eqIgnoreCase(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

/** Biblioteca base (você pode expandir depois sem mudar o motor) */
const EXERCISES = [
  // PEITO (push horizontal)
  { name: "Supino reto com barra", muscle: "peito", pattern: "push", equipment: "barra", level: "intermediario", tags: ["forca", "basico"], kneeFriendly: true },
  { name: "Supino reto com halteres", muscle: "peito", pattern: "push", equipment: "halter", level: "iniciante", tags: ["estetica"], kneeFriendly: true },
  { name: "Supino inclinado com halteres", muscle: "peito", pattern: "push", equipment: "halter", level: "iniciante", tags: ["upper"], kneeFriendly: true },
  { name: "Supino inclinado máquina", muscle: "peito", pattern: "push", equipment: "maquina", level: "iniciante", tags: ["seguro"], kneeFriendly: true },
  { name: "Crucifixo (halter)", muscle: "peito", pattern: "push", equipment: "halter", level: "iniciante", tags: ["isolamento"], kneeFriendly: true },
  { name: "Peck-deck", muscle: "peito", pattern: "push", equipment: "maquina", level: "iniciante", tags: ["isolamento", "seguro"], kneeFriendly: true },
  { name: "Crossover na polia", muscle: "peito", pattern: "push", equipment: "cabo", level: "iniciante", tags: ["isolamento"], kneeFriendly: true },
  { name: "Flexão de braço", muscle: "peito", pattern: "push", equipment: "peso_corpo", level: "iniciante", tags: ["casa"], kneeFriendly: true },

  // COSTAS (pull)
  { name: "Puxada na barra/puxador", muscle: "costas", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["lats", "seguro"], posture: true },
  { name: "Puxada neutra (triângulo)", muscle: "costas", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["lats"], posture: true },
  { name: "Remada baixa (cabo)", muscle: "costas", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["seguro"], posture: true },
  { name: "Remada unilateral com halter", muscle: "costas", pattern: "pull", equipment: "halter", level: "iniciante", tags: ["lats"], posture: true },
  { name: "Remada curvada com barra", muscle: "costas", pattern: "pull", equipment: "barra", level: "intermediario", tags: ["basico", "forca"], posture: true },
  { name: "Pulldown braço reto", muscle: "costas", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["lats", "isolamento"], posture: true },

  // OMBRO
  { name: "Desenvolvimento com halteres", muscle: "ombro", pattern: "push", equipment: "halter", level: "iniciante", tags: ["upper"], posture: true },
  { name: "Desenvolvimento máquina", muscle: "ombro", pattern: "push", equipment: "maquina", level: "iniciante", tags: ["seguro"], posture: true },
  { name: "Elevação lateral", muscle: "ombro", pattern: "isolamento", equipment: "halter", level: "iniciante", tags: ["estetica"], posture: true },
  { name: "Reverse fly (posterior)", muscle: "ombro", pattern: "pull", equipment: "halter", level: "iniciante", tags: ["postura"], posture: true },
  { name: "Face pull", muscle: "ombro", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["postura"], posture: true },

  // TRÍCEPS
  { name: "Tríceps corda", muscle: "triceps", pattern: "push", equipment: "cabo", level: "iniciante", tags: ["isolamento"] },
  { name: "Tríceps francês (halter)", muscle: "triceps", pattern: "push", equipment: "halter", level: "iniciante", tags: ["isolamento"] },
  { name: "Tríceps testa (barra W)", muscle: "triceps", pattern: "push", equipment: "barra", level: "intermediario", tags: ["isolamento"] },
  { name: "Mergulho nas paralelas (assistido)", muscle: "triceps", pattern: "push", equipment: "maquina", level: "iniciante", tags: ["composto"] },

  // BÍCEPS
  { name: "Rosca direta", muscle: "biceps", pattern: "pull", equipment: "barra", level: "iniciante", tags: ["isolamento"] },
  { name: "Rosca alternada", muscle: "biceps", pattern: "pull", equipment: "halter", level: "iniciante", tags: ["isolamento"] },
  { name: "Rosca martelo", muscle: "biceps", pattern: "pull", equipment: "halter", level: "iniciante", tags: ["braquial"] },
  { name: "Rosca na polia", muscle: "biceps", pattern: "pull", equipment: "cabo", level: "iniciante", tags: ["seguro"] },

  // PERNAS - QUAD / GLÚTEO
  { name: "Agachamento livre", muscle: "pernas", pattern: "squat", equipment: "barra", level: "intermediario", tags: ["basico", "forca"], kneeFriendly: false },
  { name: "Agachamento no smith", muscle: "pernas", pattern: "squat", equipment: "maquina", level: "iniciante", tags: ["seguro"], kneeFriendly: true },
  { name: "Leg press", muscle: "pernas", pattern: "squat", equipment: "maquina", level: "iniciante", tags: ["volume"], kneeFriendly: true },
  { name: "Hack squat", muscle: "pernas", pattern: "squat", equipment: "maquina", level: "intermediario", tags: ["volume"], kneeFriendly: true },
  { name: "Cadeira extensora", muscle: "quadriceps", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["isolamento"], kneeFriendly: true },
  { name: "Afundo / passada", muscle: "pernas", pattern: "lunge", equipment: "halter", level: "iniciante", tags: ["gluteo_focus"], kneeFriendly: true },
  { name: "Bulgarian split squat", muscle: "pernas", pattern: "lunge", equipment: "halter", level: "intermediario", tags: ["gluteo_focus"], kneeFriendly: true },
  { name: "Cadeira abdutora", muscle: "gluteo", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["gluteo_focus", "gluteo_medio"], kneeFriendly: true },
  { name: "Glute bridge", muscle: "gluteo", pattern: "hinge", equipment: "peso_corpo", level: "iniciante", tags: ["gluteo_focus", "casa"], kneeFriendly: true },
  { name: "Hip thrust (barra)", muscle: "gluteo", pattern: "hinge", equipment: "barra", level: "intermediario", tags: ["gluteo_focus"], kneeFriendly: true },
  { name: "Hip thrust (máquina)", muscle: "gluteo", pattern: "hinge", equipment: "maquina", level: "iniciante", tags: ["gluteo_focus", "seguro"], kneeFriendly: true },

  // POSTERIOR
  { name: "Terra romeno", muscle: "posterior", pattern: "hinge", equipment: "barra", level: "intermediario", tags: ["forca"], kneeFriendly: true },
  { name: "Stiff com halter", muscle: "posterior", pattern: "hinge", equipment: "halter", level: "iniciante", tags: ["seguro"], kneeFriendly: true },
  { name: "Mesa flexora", muscle: "posterior", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["isolamento"], kneeFriendly: true },
  { name: "Cadeira flexora", muscle: "posterior", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["isolamento"], kneeFriendly: true },

  // PANTURRILHA
  { name: "Panturrilha em pé", muscle: "panturrilha", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["volume"], kneeFriendly: true },
  { name: "Panturrilha sentado", muscle: "panturrilha", pattern: "isolamento", equipment: "maquina", level: "iniciante", tags: ["volume"], kneeFriendly: true },

  // CORE
  { name: "Prancha", muscle: "core", pattern: "core", equipment: "peso_corpo", level: "iniciante", tags: ["postura", "casa"], kneeFriendly: true },
  { name: "Dead bug", muscle: "core", pattern: "core", equipment: "peso_corpo", level: "iniciante", tags: ["postura", "casa"], kneeFriendly: true },
  { name: "Pallof press", muscle: "core", pattern: "core", equipment: "cabo", level: "iniciante", tags: ["postura"], kneeFriendly: true },
  { name: "Abdominal na polia", muscle: "core", pattern: "core", equipment: "cabo", level: "iniciante", tags: ["volume"], kneeFriendly: true },

  // CONDICIONAMENTO (força metabólica / cardio curto)
  { name: "Bike (intervalos)", muscle: "cardio", pattern: "cond", equipment: "cardio", level: "iniciante", tags: ["condicionamento", "baixo_impacto"], kneeFriendly: true },
  { name: "Esteira (inclinação)", muscle: "cardio", pattern: "cond", equipment: "cardio", level: "iniciante", tags: ["condicionamento"], kneeFriendly: true },
  { name: "Remo ergômetro", muscle: "cardio", pattern: "cond", equipment: "cardio", level: "intermediario", tags: ["condicionamento", "postura"], kneeFriendly: true },
];

/** Cria substitutos coerentes (mesmo músculo/padrão/equipamento parecido) */
function buildSubstitutes(ex) {
  const sameMuscle = EXERCISES.filter((e) => e.name !== ex.name && e.muscle === ex.muscle);
  const samePattern = EXERCISES.filter((e) => e.name !== ex.name && e.pattern === ex.pattern);
  const sameEquip = EXERCISES.filter((e) => e.name !== ex.name && e.equipment === ex.equipment);

  const ranked = [...new Set([...sameMuscle, ...samePattern, ...sameEquip])];

  // prioridade: mesmo músculo + padrão
  ranked.sort((a, b) => {
    const aScore = (a.muscle === ex.muscle ? 3 : 0) + (a.pattern === ex.pattern ? 2 : 0) + (a.equipment === ex.equipment ? 1 : 0);
    const bScore = (b.muscle === ex.muscle ? 3 : 0) + (b.pattern === ex.pattern ? 2 : 0) + (b.equipment === ex.equipment ? 1 : 0);
    return bScore - aScore;
  });

  return ranked.slice(0, 4).map((x) => x.name);
}

/** Prescrição por objetivo/nível (simples, mas boa) */
function prescription(goal, level, intensity) {
  // defaults
  let setsBase = 3;
  let reps = "8–12";
  let rest = "60–90s";

  if (goal === "powerlifting") {
    reps = level === "iniciante" ? "4–6" : "3–5";
    rest = "120–180s";
    setsBase = level === "iniciante" ? 3 : 4;
  } else if (goal === "condicionamento") {
    reps = "10–15";
    rest = "30–60s";
    setsBase = intensity === "alta" ? 4 : 3;
  } else if (goal === "bodybuilding") {
    reps = "8–15";
    rest = "60–90s";
    setsBase = 4;
  } else if (goal === "saude") {
    reps = "10–15";
    rest = "45–75s";
    setsBase = level === "iniciante" ? 2 : 3;
  } else {
    // hipertrofia
    reps = level === "iniciante" ? "8–12" : "6–12";
    rest = "75–120s";
    setsBase = level === "iniciante" ? 3 : 4;
  }

  return { setsBase, reps, rest };
}

/**
 * Templates → convertem para seus dayGroups do Treino atual
 * (assim você já ganha variação sem precisar mexer no Treino.jsx agora)
 */
function dayGroupsTemplate(goal, days) {
  const d = Number(days || 3);

  // ids compatíveis com teu Treino.jsx (MUSCLE_GROUPS)
  const G = {
    PUSH: "peito_triceps",
    PULL: "costas_biceps",
    QUAD: "pernas",
    POST: "posterior_gluteo",
    SHOULDER_CORE: "ombro_core",
    FULL: "fullbody",
  };

  if (goal === "powerlifting") {
    if (d === 2) return [G.FULL, G.FULL];
    if (d === 3) return [G.QUAD, G.PUSH, G.PULL];
    if (d === 4) return [G.QUAD, G.PUSH, G.POST, G.PULL];
    return [G.QUAD, G.PUSH, G.POST, G.PULL, G.SHOULDER_CORE];
  }

  if (goal === "condicionamento") {
    if (d === 2) return [G.FULL, G.FULL];
    if (d === 3) return [G.FULL, G.PUSH, G.PULL];
    if (d === 4) return [G.PUSH, G.QUAD, G.PULL, G.FULL];
    return [G.PUSH, G.QUAD, G.PULL, G.POST, G.FULL];
  }

  if (goal === "saude") {
    if (d === 2) return [G.FULL, G.FULL];
    if (d === 3) return [G.FULL, G.PUSH, G.PULL];
    if (d === 4) return [G.PUSH, G.QUAD, G.PULL, G.SHOULDER_CORE];
    return [G.PUSH, G.QUAD, G.PULL, G.POST, G.SHOULDER_CORE];
  }

  // hipertrofia/bodybuilding
  if (d === 2) return [G.FULL, G.FULL];
  if (d === 3) return [G.PUSH, G.PULL, G.QUAD];
  if (d === 4) return [G.PUSH, G.PULL, G.QUAD, G.POST];
  return [G.PUSH, G.PULL, G.QUAD, G.POST, G.SHOULDER_CORE];
}

/**
 * Plano completo (exercícios) — congelado e único
 * - usa seed do usuário + respostas do onboarding
 * - cria substitutos coerentes
 * - ajusta um pouco o volume/ênfase se houver info no perfil (ex: genero)
 */
function generatePlan({ email, goal, days, level, intensity, splitLabel, userProfile }) {
  const seedStr = `${String(email || "anon").toLowerCase()}|${goal}|${days}|${level}|v1`;
  const seed = hashStringToInt(seedStr);
  const rng = mulberry32(seed);

  const { setsBase, reps, rest } = prescription(goal, level, intensity);
  const dayGroups = dayGroupsTemplate(goal, days);

  // Ênfase opcional por perfil (sem perguntar no onboarding):
  // se existir user.genero === "feminino", damos 1 bloco extra de pernas/glúteo por semana
  const genero = String(userProfile?.genero || userProfile?.sexo || "").toLowerCase();
  const wantsLegFocus = genero.includes("fem") || genero.includes("mulher");

  // Constrói dias com foco -> converte dayGroup em alvos (muscle/pattern)
  function targetsForGroup(gid) {
    switch (gid) {
      case "peito_triceps":
        return { primary: ["peito"], secondary: ["triceps", "ombro"], patterns: ["push"] };
      case "costas_biceps":
        return { primary: ["costas"], secondary: ["biceps", "ombro"], patterns: ["pull"] };
      case "pernas":
        return { primary: ["pernas", "quadriceps"], secondary: ["gluteo", "panturrilha", "core"], patterns: ["squat", "lunge"] };
      case "posterior_gluteo":
        return { primary: ["posterior", "gluteo"], secondary: ["core", "panturrilha"], patterns: ["hinge"] };
      case "ombro_core":
        return { primary: ["ombro"], secondary: ["core"], patterns: ["push", "pull", "core"] };
      case "fullbody":
      default:
        return { primary: ["pernas", "peito", "costas"], secondary: ["ombro", "core"], patterns: ["squat", "push", "pull", "hinge", "core"] };
    }
  }

  // filtro por nível (iniciante pode pegar tudo "iniciante"; intermediário pega iniciante+intermediario; avançado pega tudo)
  function allowByLevel(ex) {
    if (!ex?.level) return true;
    if (level === "iniciante") return ex.level === "iniciante";
    if (level === "intermediario") return ex.level === "iniciante" || ex.level === "intermediario";
    return true;
  }

  // escolhe exercícios por dia de forma controlada
  const daysOut = [];
  const globalAvoid = new Set(); // evita repetir tudo sempre (ainda pode repetir básicos dependendo do objetivo)

  for (let i = 0; i < dayGroups.length; i++) {
    const gid = dayGroups[i];
    const t = targetsForGroup(gid);

    // tamanho do dia (condicionamento/saúde costuma ser um pouco menor)
    let count = 7;
    if (goal === "saude") count = 6;
    if (goal === "condicionamento") count = 6;
    if (goal === "bodybuilding") count = 8;
    if (goal === "powerlifting") count = 7;

    // pool primária
    const poolPrimary = EXERCISES.filter((e) => allowByLevel(e) && t.primary.includes(e.muscle));
    const poolSecondary = EXERCISES.filter((e) => allowByLevel(e) && t.secondary.includes(e.muscle));
    const poolPattern = EXERCISES.filter((e) => allowByLevel(e) && t.patterns.includes(e.pattern));

    // para powerlifting: tentar colocar "básicos" mais frequentemente
    const wantsBasics = goal === "powerlifting";
    const basics = EXERCISES.filter((e) => allowByLevel(e) && hasAnyTag(e, ["basico", "forca"]));

    const chosen = [];
    const avoidLocal = new Set();

    // 1) escolha 3–4 primários
    chosen.push(...pickUnique(rng, poolPrimary, Math.min(4, Math.max(2, Math.floor(count * 0.55))), avoidLocal));
    chosen.forEach((x) => avoidLocal.add(x.name));

    // 2) se powerlifting, tenta 1 básico extra (se ainda não veio)
    if (wantsBasics) {
      const hasBasic = chosen.some((x) => hasAnyTag(x, ["basico", "forca"]));
      if (!hasBasic) {
        const pick = pickUnique(rng, basics, 1, avoidLocal)[0];
        if (pick) {
          chosen.unshift(pick);
          avoidLocal.add(pick.name);
        }
      }
    }

    // 3) completa com pattern (push/pull/squat/hinge/core)
    while (chosen.length < Math.floor(count * 0.8)) {
      const cand = pickUnique(rng, poolPattern, 1, avoidLocal)[0];
      if (!cand) break;
      chosen.push(cand);
      avoidLocal.add(cand.name);
    }

    // 4) completa com secundários
    while (chosen.length < count) {
      const cand = pickUnique(rng, poolSecondary, 1, avoidLocal)[0];
      if (!cand) break;
      chosen.push(cand);
      avoidLocal.add(cand.name);
    }

    // 5) fallback: qualquer coisa do nível que não repita demais
    if (chosen.length < count) {
      const any = EXERCISES.filter((e) => allowByLevel(e));
      chosen.push(...pickUnique(rng, any, count - chosen.length, avoidLocal));
    }

    // 6) evita repetição global exagerada (mantendo básicos quando objetivo pede)
    const filtered = [];
    for (const ex of chosen) {
      const isBasic = hasAnyTag(ex, ["basico", "forca"]);
      if (!isBasic && globalAvoid.has(ex.name) && rng() < 0.65) continue;
      filtered.push(ex);
      globalAvoid.add(ex.name);
    }
    while (filtered.length < Math.min(count, 6)) {
      // garante mínimo
      const any = EXERCISES.filter((e) => allowByLevel(e) && !filtered.some((x) => x.name === e.name));
      const cand = pickOne(rng, any);
      if (!cand) break;
      filtered.push(cand);
    }

    // 7) prescrição por tipo de exercício (compostos um pouco mais pesados)
    const items = filtered.slice(0, count).map((ex) => {
      const isCompound = ["push", "pull", "squat", "hinge", "lunge"].includes(ex.pattern);
      const sets = goal === "saude"
        ? Math.max(2, setsBase - (isCompound ? 0 : 1))
        : setsBase + (isCompound ? 0 : 0);

      // ajustes de powerlifting
      let exReps = reps;
      let exRest = rest;
      if (goal === "powerlifting" && isCompound) {
        exReps = level === "iniciante" ? "4–6" : "3–5";
        exRest = "150–210s";
      }

      // condicionamento: descanso menor
      if (goal === "condicionamento" && (ex.muscle === "cardio" || ex.pattern === "cond")) {
        exReps = "8–12min";
        exRest = "—";
      }

      return {
        name: ex.name,
        muscle: ex.muscle,
        pattern: ex.pattern,
        equipment: ex.equipment,
        sets,
        reps: exReps,
        rest: exRest,
        tags: ex.tags || [],
        substitutes: buildSubstitutes(ex),
      };
    });

    daysOut.push({
      idx: i,
      label: String.fromCharCode(65 + (i % 6)), // A,B,C...
      groupId: gid,
      splitLabel,
      goal,
      level,
      intensity,
      exercises: items,
    });
  }

  // ✅ Ênfase pernas/glúteo se perfil indicar feminino (sem mudar onboarding)
  // regra simples: se tem 4–5 dias, aumenta 1–2 exercícios de glúteo/posterior em um dia de perna
  if (wantsLegFocus && daysOut.length >= 4) {
    const legDay = daysOut.find((d) => d.groupId === "pernas") || daysOut.find((d) => d.groupId === "posterior_gluteo");
    if (legDay) {
      const glutePool = EXERCISES.filter((e) => allowByLevel(e) && (e.muscle === "gluteo" || hasAnyTag(e, ["gluteo_focus"])));
      const add = pickUnique(rng, glutePool, 1, new Set(legDay.exercises.map((x) => x.name)))[0];
      if (add) {
        legDay.exercises.splice(2, 0, {
          name: add.name,
          muscle: add.muscle,
          pattern: add.pattern,
          equipment: add.equipment,
          sets: Math.max(3, setsBase),
          reps: goal === "powerlifting" ? "6–10" : "8–15",
          rest: goal === "condicionamento" ? "45–60s" : rest,
          tags: add.tags || [],
          substitutes: buildSubstitutes(add),
        });
      }
    }
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    seed,
    seedStr,
    goal,
    days: Number(days),
    level,
    intensity,
    splitLabel,
    dayGroups,
    planDays: daysOut,
  };
}

/** localStorage helpers */
function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** cria também o custom_split compatível com teu Treino.jsx atual */
function buildCustomSplitCompat(plan) {
  const prescriptions = {};
  for (let i = 0; i < (plan?.dayGroups?.length || 0); i++) {
    // usa o primeiro exercício como base e “resuma” sets/reps/rest
    const first = plan?.planDays?.[i]?.exercises?.[0];
    prescriptions[i] = {
      sets: first?.sets || 4,
      reps: first?.reps || "6–12",
      rest: first?.rest || "75–120s",
    };
  }
  return {
    splitId: plan?.splitLabel || `${plan?.days || 3}x/sem`,
    days: plan?.days || 3,
    dayGroups: plan?.dayGroups || ["fullbody", "fullbody", "fullbody"],
    prescriptions,
    // meta extra (não quebra nada)
    meta: {
      planVersion: plan?.version || 1,
      seed: plan?.seed,
      createdAt: plan?.createdAt,
      goal: plan?.goal,
      level: plan?.level,
      intensity: plan?.intensity,
    },
  };
}

/* ---------------- Component ---------------- */
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

    const email = String(user?.email || "anon").toLowerCase();

    // ✅ gera plano único e congelado (determinístico)
    const plan = generatePlan({
      email,
      goal,
      days: Number(days),
      level,
      intensity,
      splitLabel: split,
      userProfile: user || {},
    });

    // salva plano completo
    localStorage.setItem(`generated_plan_${email}`, JSON.stringify(plan));

    // salva também compatível com o Treino atual (dayGroups + prescriptions)
    const compat = buildCustomSplitCompat(plan);
    localStorage.setItem(`custom_split_${email}`, JSON.stringify(compat));

    // marca que o plano foi criado (pra você usar depois no premium “recalcular”)
    localStorage.setItem(`plan_seed_${email}`, String(plan.seed));
    localStorage.setItem(`plan_version_${email}`, String(plan.version));
    localStorage.setItem(`plan_created_${email}`, plan.createdAt);

    updateUser({
      objetivo: goal,
      frequencia: Number(days),
      nivel: level,
      split,
      intensidade: intensity,
      onboarded: true,

      // ✅ meta do plano (não precisa salvar o plano inteiro no user agora)
      planSeed: plan.seed,
      planVersion: plan.version,
      planCreatedAt: plan.createdAt,
    });

    nav("/treino", { replace: true });
  }

  const stepTitle =
    step === 1 ? "1) Qual é sua meta?" : step === 2 ? "2) Quantos dias por semana?" : "3) Seu nível atual?";

  return (
    <div className="page" style={styles.page}>
      <div style={styles.bgGlow} />

      <div style={styles.container}>
        <div style={styles.top}>
          <div style={styles.kicker}>Configuração rápida</div>

          <div style={styles.titleWrap}>
            <div style={styles.title}>Defina seu caminho</div>
          </div>

          <div style={styles.sub}>3 perguntas para montar seu treino</div>

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

      <div style={styles.actionsWrap}>
        <div style={styles.actions}>
          <button type="button" onClick={back} style={{ ...styles.btn, ...styles.btnGhost }} disabled={step === 1}>
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
