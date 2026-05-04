import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { supabase } from "../lib/supabase";

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

function getWeekdaysStrip(splitLen, currentIdx) {

  const out = [];

  const len = Math.max(splitLen, 1);

  for (let k = 0; k < len; k++) {

    const idx = (currentIdx + k) % len;

    out.push({ idx, label: `Treino ${dayLetter(idx)}`, isToday: k === 0 });

  }

  return out;

}

function normalizeName(s) {

  return String(s || "")

    .trim()

    .toLowerCase()

    .normalize("NFD")

    .replace(/\p{Diacritic}/gu, "");

}

function keyForLoad(viewIdx, exName) {

  return `${viewIdx}__${String(exName || "").toLowerCase()}`;

}

function formatKg(value) {

  const n = Number(value || 0);

  if (!Number.isFinite(n)) return "0";

  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");

}

function parseKg(raw) {

  const n = Number(String(raw || "").replace(",", "."));

  if (!Number.isFinite(n) || n < 0) return 0;

  return Math.round(n * 2) / 2;

}

/* ---------------- banco de grupos musculares ---------------- */

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

function buildProfileFallback(profile) {

  const objetivo = String(profile?.objetivo || "Hipertrofia").trim() || "Hipertrofia";

  const splitName = String(profile?.split || "").trim();

  const intensidade = String(profile?.intensidade || "moderada").trim() || "moderada";

  const freq = clamp(Number(profile?.frequencia || 3), 2, 5);

  const method = `${objetivo} • ${intensidade}`;

  const A = [

    { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method },

    { name: "Supino inclinado", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method },

    { name: "Tríceps corda", group: "Tríceps", sets: 4, reps: "8–12", rest: "60–90s", method },

    { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "10–15", rest: "60–90s", method },

    { name: "Crucifixo", group: "Peito", sets: 3, reps: "10–15", rest: "60–90s", method },

    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method },

    { name: "Paralelas", group: "Tríceps/Peito", sets: 3, reps: "8–12", rest: "60–90s", method },

  ];

  const B = [

    { name: "Puxada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method },

    { name: "Remada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method },

    { name: "Remada unilateral", group: "Costas", sets: 3, reps: "10–12", rest: "75–120s", method },

    { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "8–12", rest: "60–90s", method },

    { name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Face pull", group: "Ombro/escápulas", sets: 3, reps: "12–15", rest: "45–75s", method },

    { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45–75s", method },

  ];

  const C = [

    { name: "Agachamento", group: "Pernas", sets: 4, reps: "6–12", rest: "90–150s", method },

    { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "75–120s", method },

    { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–12", rest: "90–150s", method },

    { name: "Cadeira extensora", group: "Quadríceps", sets: 3, reps: "12–15", rest: "60–90s", method },

    { name: "Panturrilha", group: "Panturrilha", sets: 4, reps: "10–15", rest: "45–75s", method },

    { name: "Afundo", group: "Pernas", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method },

  ];

  const D = [

    { name: "Desenvolvimento", group: "Ombros", sets: 4, reps: "8–12", rest: "60–90s", method },

    { name: "Elevação lateral", group: "Ombros", sets: 4, reps: "12–15", rest: "45–75s", method },

    { name: "Posterior (reverse fly)", group: "Ombro posterior", sets: 3, reps: "12–15", rest: "45–75s", method },

    { name: "Encolhimento", group: "Trapézio", sets: 3, reps: "10–15", rest: "45–75s", method },

    { name: "Pallof press", group: "Core", sets: 3, reps: "10–12", rest: "45–60s", method },

    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–60s", method },

    { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45–60s", method },

  ];

  const FB1 = [

    { name: "Agachamento", group: "Pernas", sets: 4, reps: "6–12", rest: "90–120s", method },

    { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method },

    { name: "Remada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method },

    { name: "Desenvolvimento", group: "Ombros", sets: 3, reps: "8–12", rest: "60–90s", method },

    { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45–60s", method },

  ];

  const FB2 = [

    { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "75–120s", method },

    { name: "Supino inclinado", group: "Peito", sets: 4, reps: "8–12", rest: "75–120s", method },

    { name: "Puxada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method },

    { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "12–15", rest: "45–75s", method },

    { name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Paralelas", group: "Tríceps/Peito", sets: 3, reps: "8–12", rest: "60–90s", method },

    { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–60s", method },

  ];

  const FB3 = [

    { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–12", rest: "90–120s", method },

    { name: "Afundo", group: "Pernas", sets: 3, reps: "10–12", rest: "60–90s", method },

    { name: "Crucifixo", group: "Peito", sets: 3, reps: "10–15", rest: "60–90s", method },

    { name: "Remada unilateral", group: "Costas", sets: 3, reps: "10–12", rest: "75–120s", method },

    { name: "Face pull", group: "Ombro/escápulas", sets: 3, reps: "12–15", rest: "45–75s", method },

    { name: "Panturrilha", group: "Panturrilha", sets: 4, reps: "10–15", rest: "45–75s", method },

    { name: "Pallof press", group: "Core", sets: 3, reps: "10–12", rest: "45–60s", method },

  ];

  const splitKey = normalizeName(splitName);

  let split = [];

  if (splitKey.includes("full")) {

    const seq = [FB1, FB2, FB3, FB1, FB2];

    split = seq.slice(0, freq);

  } else if (splitKey === "abcd") {

    const seq = [A, B, C, D, A];

    split = seq.slice(0, freq);

  } else {

    const seq = [A, B, C, A, B];

    split = seq.slice(0, freq);

  }

  return {

    base: {

      style: `${objetivo} • ${splitName || `${freq}x/sem`}`,

      sets: 4,

      reps: "6–12",

      rest: intensidade === "alta" ? "60–90s" : "75–120s",

    },

    split,

  };

}

/* ---------------- supabase helpers ---------------- */

async function loadPaidStatus(userId) {

  if (!userId) return false;

  try {

    const { data, error } = await supabase

      .from("subscriptions")

      .select("status")

      .eq("user_id", userId)

      .in("status", ["active", "trialing"])

      .limit(1);

    if (error) {

      console.error("loadPaidStatus error:", error);

      return false;

    }

    return Array.isArray(data) && data.length > 0;

  } catch (err) {

    console.error("loadPaidStatus catch:", err);

    return false;

  }

}

async function getOrCreateUserState(userId) {

  const { data, error } = await supabase

    .from("workout_user_state")

    .select("*")

    .eq("user_id", userId)

    .maybeSingle();

  if (error) {

    console.error("getOrCreateUserState select error:", error);

  }

  if (data) return data;

  const { data: inserted, error: insertError } = await supabase

    .from("workout_user_state")

    .upsert({ user_id: userId, current_day_index: 0 }, { onConflict: "user_id" })

    .select("*")

    .maybeSingle();

  if (insertError) {

    console.error("getOrCreateUserState insert error:", insertError);

    return { user_id: userId, current_day_index: 0 };

  }

  return inserted || { user_id: userId, current_day_index: 0 };

}

async function createPlanFromFallback(userId, fallback) {

  const split = Array.isArray(fallback?.split) ? fallback.split : [];

  const base = fallback?.base || {};

  const { data: planRow, error: planError } = await supabase

    .from("workout_plans")

    .insert({

      user_id: userId,

      title: "Plano atual",

      split_label: base.style || "Plano atual",

      split_len: split.length || 1,

      is_active: true,

      source: "fallback",

    })

    .select("*")

    .single();

  if (planError) throw planError;

  for (let dayIdx = 0; dayIdx < split.length; dayIdx += 1) {

    const dayExercises = split[dayIdx] || [];

    const { data: dayRow, error: dayError } = await supabase

      .from("workout_plan_days")

      .insert({

        plan_id: planRow.id,

        day_index: dayIdx,

        day_key: dayLetter(dayIdx),

        title: `Treino ${dayLetter(dayIdx)}`,

        group_id: `fallback_${dayIdx}`,

        group_name: dayExercises[0]?.group || `Treino ${dayLetter(dayIdx)}`,

      })

      .select("*")

      .single();

    if (dayError) throw dayError;

    if (dayExercises.length) {

      const rows = dayExercises.map((ex, order) => ({

        plan_day_id: dayRow.id,

        exercise_order: order,

        name: ex.name,

        group_name: ex.group || "",

        reps: `${ex.sets || 4} séries • ${ex.reps || "6–12"} • descanso ${ex.rest || "75–120s"}`,

        notes: ex.method || "",

      }));

      const { error: exError } = await supabase.from("workout_plan_exercises").insert(rows);

      if (exError) throw exError;

    }

  }

  return planRow;

}

async function getOrCreateActivePlan(userId, fallback) {

  let { data: activePlan, error: activeError } = await supabase

    .from("workout_plans")

    .select("*")

    .eq("user_id", userId)

    .eq("is_active", true)

    .maybeSingle();

  if (activeError) {

    console.error("getOrCreateActivePlan select error:", activeError);

  }

  if (!activePlan) {

    activePlan = await createPlanFromFallback(userId, fallback);

  }

  const { data: days, error: daysError } = await supabase

    .from("workout_plan_days")

    .select("*")

    .eq("plan_id", activePlan.id)

    .order("day_index", { ascending: true });

  if (daysError) throw daysError;

  const dayIds = (days || []).map((d) => d.id);

  let exercises = [];

  if (dayIds.length) {

    const { data: exRows, error: exError } = await supabase

      .from("workout_plan_exercises")

      .select("*")

      .in("plan_day_id", dayIds)

      .order("exercise_order", { ascending: true });

    if (exError) throw exError;

    exercises = exRows || [];

  }

  const split = (days || []).map((day) => {

    const exs = exercises

      .filter((ex) => ex.plan_day_id === day.id)

      .sort((a, b) => a.exercise_order - b.exercise_order)

      .map((ex) => {

        const info = String(ex.reps || "");

        let sets = 4;

        let reps = "6–12";

        let rest = "75–120s";

        const match = info.match(/^(.+?) séries • (.+?) • descanso (.+)$/i);

        if (match) {

          sets = Number(match[1]) || 4;

          reps = match[2] || "6–12";

          rest = match[3] || "75–120s";

        }

        return {

          id: ex.id,

          name: ex.name,

          group: ex.group_name || day.group_name || "",

          sets,

          reps,

          rest,

          method: ex.notes || activePlan.split_label || "",

        };

      });

    return exs.length

      ? exs

      : ensureVolume(groupById("fullbody").library, 7).map((ex) => ({

          ...ex,

          sets: 4,

          reps: "6–12",

          rest: "75–120s",

          method: activePlan.split_label || "",

        }));

  });

  return {

    plan: activePlan,

    days: days || [],

    split,

    base: {

      style: activePlan.split_label || fallback?.base?.style || "Plano atual",

      sets: fallback?.base?.sets || 4,

      reps: fallback?.base?.reps || "6–12",

      rest: fallback?.base?.rest || "75–120s",

    },

  };

}

async function getOrCreateTodaySession(userId, planId, planDayId, dayIndex, workout) {

  const today = todayKey();

  let { data: sessionRow, error: sessionError } = await supabase

    .from("workout_sessions")

    .select("*")

    .eq("user_id", userId)

    .eq("session_date", today)

    .maybeSingle();

  if (sessionError) {

    console.error("getOrCreateTodaySession select error:", sessionError);

  }

  if (!sessionRow) {

    const { data: inserted, error: insertError } = await supabase

      .from("workout_sessions")

      .insert({

        user_id: userId,

        plan_id: planId,

        plan_day_id: planDayId,

        day_index: dayIndex,

        session_date: today,

        completed: false,

      })

      .select("*")

      .single();

    if (insertError) throw insertError;

    sessionRow = inserted;

  } else if (

    sessionRow.plan_day_id !== planDayId ||

    Number(sessionRow.day_index) !== Number(dayIndex)

  ) {

    const { data: updated, error: updateError } = await supabase

      .from("workout_sessions")

      .update({

        plan_id: planId,

        plan_day_id: planDayId,

        day_index: dayIndex,

      })

      .eq("id", sessionRow.id)

      .select("*")

      .single();

    if (updateError) throw updateError;

    sessionRow = updated;

  }

  const { data: existingExs, error: exSelectError } = await supabase

    .from("workout_session_exercises")

    .select("*")

    .eq("session_id", sessionRow.id)

    .order("exercise_order", { ascending: true });

  if (exSelectError) throw exSelectError;

  const exRows = existingExs || [];

  if (!exRows.length && Array.isArray(workout) && workout.length) {

    const seedRows = workout.map((ex, idx) => ({

      session_id: sessionRow.id,

      plan_exercise_id: ex.id || null,

      exercise_order: idx,

      name: ex.name,

      checked: false,

    }));

    const { error: seedError } = await supabase.from("workout_session_exercises").insert(seedRows);

    if (seedError) throw seedError;

    const { data: afterSeed, error: afterSeedError } = await supabase

      .from("workout_session_exercises")

      .select("*")

      .eq("session_id", sessionRow.id)

      .order("exercise_order", { ascending: true });

    if (afterSeedError) throw afterSeedError;

    return { session: sessionRow, sessionExercises: afterSeed || [] };

  }

  return { session: sessionRow, sessionExercises: exRows };

}

async function loadExerciseLoads(userId, planDayId) {

  if (!userId || !planDayId) return {};

  try {

    const { data, error } = await supabase

      .from("workout_exercise_loads")

      .select("*")

      .eq("user_id", userId)

      .eq("plan_day_id", planDayId);

    if (error) {

      console.error("loadExerciseLoads error:", error);

      return {};

    }

    const next = {};

    (data || []).forEach((row) => {

      next[keyForLoad(planDayId, row.exercise_name)] = Number(row.load || 0);

    });

    return next;

  } catch (err) {

    console.error("loadExerciseLoads catch:", err);

    return {};

  }

}

export default function Treino() {

  const nav = useNavigate();

  const { user } = useAuth();

  const autoPreviewFinishRef = useRef(false);

  const [profile, setProfile] = useState(null);

  const [paid, setPaid] = useState(false);

  const [base, setBase] = useState({

    style: "",

    sets: 4,

    reps: "6–12",

    rest: "75–120s",

  });

  const [split, setSplit] = useState([]);

  const [planDays, setPlanDays] = useState([]);

  const [planId, setPlanId] = useState(null);

  const [dayIndex, setDayIndex] = useState(0);

  const [viewIdx, setViewIdx] = useState(0);

  const [done, setDone] = useState({});

  const [tapId, setTapId] = useState(null);

  const [loads, setLoads] = useState({});

  const [todaySessionId, setTodaySessionId] = useState(null);

  const [latestMontage, setLatestMontage] = useState(null);

  const [weightEditor, setWeightEditor] = useState(null);

  useEffect(() => {

    if (typeof document === "undefined") return;

    if (weightEditor) {

      document.body.classList.add("fitdeal-weight-editor-open");

    } else {

      document.body.classList.remove("fitdeal-weight-editor-open");

    }

    return () => {

      document.body.classList.remove("fitdeal-weight-editor-open");

    };

  }, [weightEditor]);

  useEffect(() => {

    let active = true;

    async function loadProfile() {

      if (!user?.id) return;

      const { data } = await supabase

        .from("profiles")

        .select("objetivo, nivel, split, intensidade, frequencia")

        .eq("id", user.id)

        .maybeSingle();

      if (!active) return;

      setProfile(data || null);

    }

    loadProfile();

    return () => {

      active = false;

    };

  }, [user?.id]);

  useEffect(() => {

    let active = true;

    async function loadPaid() {

      if (!user?.id) {

        if (active) setPaid(false);

        return;

      }

      const status = await loadPaidStatus(user.id);

      if (active) setPaid(status);

    }

    loadPaid();

    return () => {

      active = false;

    };

  }, [user?.id]);

  useEffect(() => {

    let active = true;

    async function loadLatestMontage() {

      if (!user?.id) {

        if (active) setLatestMontage(null);

        return;

      }

      try {

        const { data, error } = await supabase

          .from("user_workout_montages")

          .select("id, focus_key, title, selected_level, selected_days, payload, created_at")

          .eq("user_id", user.id)

          .eq("is_active", true)

          .order("created_at", { ascending: false })

          .limit(1)

          .maybeSingle();

        if (!active) return;

        if (error) {

          console.error("Treino latest montage error:", error);

          setLatestMontage(null);

          return;

        }

        setLatestMontage(data || null);

      } catch (err) {

        console.error("Treino latest montage catch:", err);

        if (active) setLatestMontage(null);

      }

    }

    loadLatestMontage();

    return () => {

      active = false;

    };

  }, [user?.id]);

  const fallbackSplit = useMemo(() => buildProfileFallback(profile), [profile]);

  useEffect(() => {

    let active = true;

    async function bootstrapWorkout() {

      if (!user?.id || !fallbackSplit?.split?.length) return;

      try {

        const state = await getOrCreateUserState(user.id);

        if (!active) return;

        const currentIdx = Number(state?.current_day_index || 0);

        setDayIndex(currentIdx);

        setViewIdx(currentIdx);

        const hydrated = await getOrCreateActivePlan(user.id, fallbackSplit);

        if (!active) return;

        setPlanId(hydrated.plan.id);

        setPlanDays(hydrated.days || []);

        setSplit(hydrated.split || []);

        setBase(hydrated.base || fallbackSplit.base);

      } catch (err) {

        console.error("bootstrapWorkout error:", err);

        if (!active) return;

        setSplit(fallbackSplit.split || []);

        setBase(fallbackSplit.base || {});

        setPlanDays([]);

        setPlanId(null);

      }

    }

    bootstrapWorkout();

    return () => {

      active = false;

    };

  }, [user?.id, fallbackSplit]);

  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);

  const viewingIsToday = viewSafe === mod(dayIndex, split.length);

  const workout = useMemo(() => split[viewSafe] || [], [split, viewSafe]);

  const currentPlanDay = useMemo(() => {

    return planDays.find((d) => Number(d.day_index) === Number(viewSafe)) || null;

  }, [planDays, viewSafe]);

  useEffect(() => {

    autoPreviewFinishRef.current = false;

  }, [viewSafe, paid]);

  useEffect(() => {

    let active = true;

    async function hydrateTodayState() {

      if (!user?.id || !planId || !currentPlanDay?.id || !workout.length) {

        if (active) {

          setDone({});

          setTodaySessionId(null);

          setLoads({});

        }

        return;

      }

      try {

        const { session, sessionExercises } = await getOrCreateTodaySession(

          user.id,

          planId,

          currentPlanDay.id,

          viewSafe,

          workout

        );

        if (!active) return;

        setTodaySessionId(session?.id || null);

        const doneMap = {};

        (sessionExercises || []).forEach((row) => {

          doneMap[row.exercise_order] = !!row.checked;

        });

        setDone(doneMap);

        const loadMap = await loadExerciseLoads(user.id, currentPlanDay.id);

        if (!active) return;

        setLoads(loadMap);

      } catch (err) {

        console.error("hydrateTodayState error:", err);

        if (!active) return;

        setDone({});

        setTodaySessionId(null);

        setLoads({});

      }

    }

    hydrateTodayState();

    return () => {

      active = false;

    };

  }, [user?.id, planId, currentPlanDay?.id, viewSafe, workout]);

  async function toggleDone(i) {

    if (!todaySessionId || !viewingIsToday) return;

    const nextChecked = !done[i];

    setDone((prev) => ({ ...prev, [i]: nextChecked }));

    setTapId(i);

    setTimeout(() => setTapId(null), 160);

    try {

      const { error } = await supabase

        .from("workout_session_exercises")

        .update({

          checked: nextChecked,

          checked_at: nextChecked ? new Date().toISOString() : null,

        })

        .eq("session_id", todaySessionId)

        .eq("exercise_order", i);

      if (error) {

        console.error("toggleDone error:", error);

        setDone((prev) => ({ ...prev, [i]: !nextChecked }));

      }

    } catch (err) {

      console.error("toggleDone catch:", err);

      setDone((prev) => ({ ...prev, [i]: !nextChecked }));

    }

  }

  async function adjustLoad(exName, delta) {

    if (!user?.id || !currentPlanDay?.id) return;

    const k = keyForLoad(currentPlanDay.id, exName);

    const cur = Number(loads[k] || 0);

    const nextVal = Math.max(0, Math.round((cur + delta) * 2) / 2);

    setLoads((prev) => ({

      ...prev,

      [k]: nextVal,

    }));

    try {

      const { error } = await supabase

        .from("workout_exercise_loads")

        .upsert(

          {

            user_id: user.id,

            plan_day_id: currentPlanDay.id,

            exercise_name: exName,

            load: nextVal,

            updated_at: new Date().toISOString(),

          },

          { onConflict: "user_id,plan_day_id,exercise_name" }

        );

      if (error) {

        console.error("adjustLoad error:", error);

        setLoads((prev) => ({

          ...prev,

          [k]: cur,

        }));

      }

    } catch (err) {

      console.error("adjustLoad catch:", err);

      setLoads((prev) => ({

        ...prev,

        [k]: cur,

      }));

    }

  }

  function openWeightEditor(exName, fallbackLoad) {

    const k = keyForLoad(currentPlanDay?.id || viewSafe, exName);

    const saved = Number(loads[k] || 0);

    const start = saved > 0 ? saved : Number(fallbackLoad || 0);

    setWeightEditor({

      exName,

      value: String(formatKg(start)),

      fallbackLoad,

    });

  }

  function closeWeightEditor() {

    setWeightEditor(null);

  }

  function bumpWeightEditor(delta) {

    setWeightEditor((prev) => {

      if (!prev) return prev;

      const current = parseKg(prev.value);

      const next = Math.max(0, Math.round((current + delta) * 2) / 2);

      return { ...prev, value: formatKg(next) };

    });

  }

  async function saveWeightEditor() {

    if (!weightEditor?.exName || !currentPlanDay?.id) {

      closeWeightEditor();

      return;

    }

    const next = parseKg(weightEditor.value);

    const k = keyForLoad(currentPlanDay.id, weightEditor.exName);

    const cur = Number(loads[k] || 0);

    await adjustLoad(weightEditor.exName, next - cur);

    closeWeightEditor();

  }

  async function finishWorkout() {

    if (!viewingIsToday || !user?.id || !split.length) return;

    try {

      if (todaySessionId) {

        const { error: sessionError } = await supabase

          .from("workout_sessions")

          .update({

            completed: true,

            finished_at: new Date().toISOString(),

          })

          .eq("id", todaySessionId);

        if (sessionError) {

          console.error("finishWorkout session error:", sessionError);

        }

      }

      const nextDayIndex = (dayIndex + 1) % Math.max(split.length, 1);

      const { error: stateError } = await supabase

        .from("workout_user_state")

        .upsert(

          {

            user_id: user.id,

            current_day_index: nextDayIndex,

            updated_at: new Date().toISOString(),

          },

          { onConflict: "user_id" }

        );

      if (stateError) {

        console.error("finishWorkout state error:", stateError);

      }

      setDayIndex(nextDayIndex);

      setViewIdx(nextDayIndex);

      setDone({});

      nav("/dashboard");

    } catch (err) {

      console.error("finishWorkout catch:", err);

      nav("/dashboard");

    }

  }

  const previewCount = paid ? Math.max(2, Math.ceil(workout.length / 2)) : Math.min(2, workout.length);

  const previewList = workout.slice(0, previewCount);

  const lockedList = paid ? [] : workout.slice(previewCount);

  useEffect(() => {

    if (paid) return;

    if (!viewingIsToday) return;

    if (!todaySessionId) return;

    if (!previewList.length) return;

    if (autoPreviewFinishRef.current) return;

    const allPreviewDone = previewList.every((_, i) => !!done[i]);

    if (!allPreviewDone) return;

    autoPreviewFinishRef.current = true;

    const t = setTimeout(() => {

      finishWorkout();

    }, 350);

    return () => clearTimeout(t);

  }, [paid, viewingIsToday, todaySessionId, previewList, done]);

  const strip = useMemo(

    () => getWeekdaysStrip(split.length, mod(dayIndex, split.length)),

    [split.length, dayIndex]

  );

  function openExercises() {

    nav(`/treino/detalhe?d=${viewSafe}`, { state: { from: "/treino" } });

  }

  function openLatestMontageOrCreate() {

    if (latestMontage?.id) {

      nav(`/treino/detalhe?source=montagem&id=${latestMontage.id}`, {

        state: { from: "/treino" },

      });

      return;

    }

    nav("/montagem-treino");

  }

  const doneCount = Object.values(done).filter(Boolean).length;

  const progressPct = workout.length ? clamp(doneCount / workout.length, 0, 1) : 0;

  const freePct = workout.length ? clamp(previewList.length / workout.length, 0, 1) : 0;

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

            <>

              Método: <b>{base.style}</b>

            </>

          </div>

        </div>

        <button

          className="settings-press"

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

                className="apple-press"

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

              >

                {d.label}

                {d.isToday ? " • hoje" : ""}

              </button>

            );

          })}

        </div>

      </div>

      {/* EXERCÍCIOS DO DIA */}

      <button className="apple-press" style={styles.bigGo} onClick={() => openExercises()} type="button">

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

      {/* MONTAGEM DE TREINO */}

      <button

        className="apple-press"

        type="button"

        style={styles.quickMountCard}

        onClick={openLatestMontageOrCreate}

        aria-label="Abrir montagem de treino"

      >

        <span style={styles.quickMountTail} />

        <span style={styles.quickMountGlow} />

        <span style={styles.quickMountIconBox}>

          <span style={styles.quickMountMiniBadge}>✦</span>

          <span style={styles.quickMountDumbbell} aria-hidden="true">

            <svg width="38" height="38" viewBox="0 0 48 48" fill="none">

              <path d="M13 17v14M18 14v20M30 14v20M35 17v14" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />

              <path d="M18 24h12" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" />

              <path

                d="M25.5 15.5 20.8 25H27l-4.5 7.5"

                stroke="#FF6A00"

                strokeWidth="3"

                strokeLinecap="round"

                strokeLinejoin="round"

              />

            </svg>

          </span>

        </span>

        <span style={styles.quickMountContent}>

          <span style={styles.quickMountTop}>

            <span style={styles.quickMountBadge}>Novo</span>

          </span>

          <span style={styles.quickMountTitle}>Montagem de treino</span>

          <span style={styles.quickMountSub}>

            {latestMontage?.id ? "Abrir sua montagem pronta" : "Seu treino pronto em poucos toques"}

          </span>

        </span>

        <span style={styles.quickMountArrow} aria-hidden="true">

          <svg width="21" height="21" viewBox="0 0 24 24" fill="none">

            <path d="M5 12h13" stroke="#FF6A00" strokeWidth="2.7" strokeLinecap="round" />

            <path d="M13 6l6 6-6 6" stroke="#FF6A00" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />

          </svg>

        </span>

      </button>

      {/* CARD: METAS */}

      <div style={styles.card}>

        <div style={styles.cardTop}>

          <div>

            <div style={styles.cardTitle}>METAS</div>

            <div style={styles.cardSub}>Pronto para conquistar seus objetivos?</div>

          </div>

          <button className="apple-press" style={styles.cardBtn} onClick={() => nav("/metas")} type="button">

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

          <button className="apple-press" style={styles.cardBtn} onClick={() => nav("/cardio")} type="button">

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

                className="apple-press"

                style={styles.customBtn}

                onClick={() => nav("/treino/personalizar")}

                type="button"

              >

                Personalizar

              </button>

              <button className="apple-press" style={styles.cardBtnAlt} onClick={() => openExercises()} type="button">

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

          <div style={styles.lockHint}>Você está no Modo Gratuito. Assine para liberar treino completo e personalização.</div>

        )}

      </div>

      {/* LISTA */}

      {!paid ? (

        <>

          <div style={styles.previewHeader}>

            <div style={styles.sectionTitle}>Lista do treino - Prévia</div>

            <div style={styles.previewSub}>

              {String(profile?.objetivo || "Hipertrofia").trim() || "Hipertrofia"} •{" "}

              {String(profile?.frequencia || "3").trim() || "3"}x/sem • {previewList.length} de {workout.length} liberados

            </div>

          </div>

          <div style={styles.previewProgressCard}>

            <div style={styles.previewGiftIcon}>

              <GiftIcon />

            </div>

            <div style={styles.previewProgressText}>Prévia gratuita</div>

            <div style={styles.previewProgressTrack}>

              <div style={{ ...styles.previewProgressFill, width: `${Math.round(freePct * 100)}%` }} />

            </div>

            <div style={styles.previewProgressPill}>

              {previewList.length}/{workout.length} liberados

            </div>

          </div>

          <div style={styles.previewList}>

            {previewList.map((ex, i) => {

              const loadKey = keyForLoad(currentPlanDay?.id || viewSafe, ex.name);

              const curLoad = loads[loadKey] ?? 0;

              const fallbackLoad = i === 0 ? 20 : 18;

              const shownLoad = Number(curLoad || 0) > 0 ? formatKg(curLoad) : String(fallbackLoad);

              const isDone = !!done[i];

              return (

                <div key={i} style={styles.previewExCard}>

                  <div style={styles.previewNumber}>{i + 1}</div>

                  <div style={styles.previewExBody}>

                    <div style={styles.previewExName}>{ex.name}</div>

                    <div style={styles.previewExNote}>

                      {ex.group} • {ex.sets} séries • {ex.reps} reps

                    </div>

                    <div style={styles.previewChips}>

                      <button

                        type="button"

                        className="apple-press"

                        style={styles.previewChipButton}

                        onClick={() => openWeightEditor(ex.name, fallbackLoad)}

                        aria-label={`Alterar carga de ${ex.name}`}

                      >

                        <DumbbellMiniIcon />

                        {shownLoad} kg

                      </button>

                      <span style={styles.previewChip}>

                        <ClockMiniIcon />

                        {ex.rest}

                      </span>

                      <button

                        type="button"

                        className="apple-press"

                        onClick={() => toggleDone(i)}

                        disabled={!viewingIsToday}

                        aria-label={isDone ? "Desmarcar exercício" : "Concluir exercício"}

                        style={{

                          ...styles.previewCheckBtn,

                          ...(isDone ? styles.previewCheckBtnOn : styles.previewCheckBtnOff),

                          opacity: viewingIsToday ? 1 : 0.55,

                          transform: tapId === i ? "scale(.94)" : "scale(1)",

                        }}

                      >

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">

                          <path

                            d="M20 7L10 17l-5-5"

                            stroke={isDone ? "#111" : "#64748b"}

                            strokeWidth="2.7"

                            strokeLinecap="round"

                            strokeLinejoin="round"

                          />

                        </svg>

                      </button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

          {lockedList.length > 0 ? (

            <div style={styles.previewLockedCard}>

              <div style={styles.lockSparkOne}>✦</div>

              <div style={styles.lockSparkTwo}>✦</div>

              <div style={styles.previewLockIcon}>

                <LockIcon />

              </div>

              <div style={styles.previewBrandPill}>FitDeal</div>

              <div style={styles.previewLockTitle}>Mais {lockedList.length} exercícios bloqueados</div>

              <div style={styles.previewLockSub}>Libere execução, cargas, descanso e progressão.</div>

              <div style={styles.previewBenefits}>

                <div style={styles.previewBenefit}>

                  <CoachIcon />

                  <span>Execução guiada</span>

                </div>

                <div style={styles.previewBenefit}>

                  <ProgressIcon />

                  <span>Progressão de carga</span>

                </div>

                <div style={styles.previewBenefit}>

                  <HistoryIcon />

                  <span>Histórico do treino</span>

                </div>

              </div>

              <button type="button" className="apple-press" style={styles.previewPremiumBtn} onClick={() => nav("/planos")}>

                <span>Liberar treino completo</span>

                <span style={styles.previewPremiumArrow}>›</span>

              </button>

              <div style={styles.previewAccess}>

                <SmallLockIcon />

                Acesso imediato

              </div>

            </div>

          ) : null}

        </>

      ) : (

        <>

          <div style={styles.sectionTitle}>Lista do treino - Resumido</div>

          <div style={styles.list}>

            {previewList.map((ex, i) => {

              const isDone = !!done[i];

              const loadKey = keyForLoad(currentPlanDay?.id || viewSafe, ex.name);

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

                            className="apple-press"

                            style={styles.loadBtn}

                            onClick={(e) => {

                              e.stopPropagation();

                              adjustLoad(ex.name, -2.5);

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

                            className="apple-press"

                            style={styles.loadBtn}

                            onClick={(e) => {

                              e.stopPropagation();

                              adjustLoad(ex.name, +2.5);

                            }}

                            aria-label="Aumentar carga"

                          >

                            +

                          </button>

                        </div>

                        <button

                          type="button"

                          className="apple-press"

                          style={styles.loadMini}

                          onClick={(e) => {

                            e.stopPropagation();

                            adjustLoad(ex.name, +1);

                          }}

                          title="Ajuste fino"

                        >

                          +1

                        </button>

                      </div>

                    </div>

                    <button

                      type="button"

                      className="apple-press"

                      onClick={() => toggleDone(i)}

                      aria-label={isDone ? "Desmarcar" : "Marcar como feito"}

                      style={{

                        ...styles.checkBtn,

                        ...(isDone ? styles.checkOn : styles.checkOff),

                        transform: tapId === i ? "scale(0.92)" : "scale(1)",

                        opacity: viewingIsToday ? 1 : 0.7,

                      }}

                      disabled={!viewingIsToday}

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

        </>

      )}

      {/* BOTÃO FLUTUANTE “CONCLUIR TREINO” */}

      {paid ? (

        <button

          type="button"

          className="apple-press"

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

      {/* EDITOR DE PESO */}

      {weightEditor ? (

        <div style={styles.weightOverlay} onClick={closeWeightEditor}>

          <div style={styles.weightSheet} onClick={(e) => e.stopPropagation()}>

            <div style={styles.weightHandle} />

            <div style={styles.weightTop}>

              <div>

                <div style={styles.weightKicker}>Carga do exercício</div>

                <div style={styles.weightTitle}>{weightEditor.exName}</div>

              </div>

              <button type="button" style={styles.weightClose} onClick={closeWeightEditor} aria-label="Fechar">

                ×

              </button>

            </div>

            <div style={styles.weightControl}>

              <button type="button" className="apple-press" style={styles.weightRoundBtn} onClick={() => bumpWeightEditor(-2.5)}>

                −

              </button>

              <div style={styles.weightValueBox}>

                <input

                  style={styles.weightInput}

                  value={weightEditor.value}

                  inputMode="decimal"

                  onChange={(e) =>

                    setWeightEditor((prev) =>

                      prev ? { ...prev, value: e.target.value.replace(/[^\d,.]/g, "") } : prev

                    )

                  }

                />

                <div style={styles.weightUnit}>kg</div>

              </div>

              <button type="button" className="apple-press" style={styles.weightRoundBtn} onClick={() => bumpWeightEditor(2.5)}>

                +

              </button>

            </div>

            <div style={styles.weightQuickRow}>

              <button type="button" className="apple-press" style={styles.weightQuickBtn} onClick={() => bumpWeightEditor(-1)}>

                -1 kg

              </button>

              <button type="button" className="apple-press" style={styles.weightQuickBtn} onClick={() => bumpWeightEditor(1)}>

                +1 kg

              </button>

            </div>

            <button type="button" className="apple-press" style={styles.weightSaveBtn} onClick={saveWeightEditor}>

              Salvar carga

            </button>

          </div>

        </div>

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

function GiftIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M20 12v8H4v-8" stroke="#FF6A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M2.8 8h18.4v4H2.8V8Z" stroke="#FF6A00" strokeWidth="2.2" strokeLinejoin="round" />

      <path d="M12 8v12" stroke="#FF6A00" strokeWidth="2.2" strokeLinecap="round" />

      <path d="M12 8H8.8a2.2 2.2 0 1 1 2.2-2.2V8Z" stroke="#FF6A00" strokeWidth="2.2" strokeLinejoin="round" />

      <path d="M12 8h3.2a2.2 2.2 0 1 0-2.2-2.2V8Z" stroke="#FF6A00" strokeWidth="2.2" strokeLinejoin="round" />

    </svg>

  );

}

function DumbbellMiniIcon() {

  return (

    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" stroke="#0f172a" strokeWidth="2.1" strokeLinecap="round" />

    </svg>

  );

}

function ClockMiniIcon() {

  return (

    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="#0f172a" strokeWidth="2.1" />

      <path d="M12 6.8v5.5l3.7 2.2" stroke="#0f172a" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />

    </svg>

  );

}

function LockIcon() {

  return (

    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M7.5 10V7.8a4.5 4.5 0 0 1 9 0V10" stroke="#FF6A00" strokeWidth="2.2" strokeLinecap="round" />

      <path

        d="M6.5 10h11a1.4 1.4 0 0 1 1.4 1.4v7.2a1.4 1.4 0 0 1-1.4 1.4h-11a1.4 1.4 0 0 1-1.4-1.4v-7.2A1.4 1.4 0 0 1 6.5 10Z"

        stroke="#FF6A00"

        strokeWidth="2.2"

        strokeLinejoin="round"

      />

    </svg>

  );

}

function SmallLockIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M8 10V7.8a4 4 0 0 1 8 0V10" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />

      <path d="M6.7 10h10.6a1.3 1.3 0 0 1 1.3 1.3v7.1a1.3 1.3 0 0 1-1.3 1.3H6.7a1.3 1.3 0 0 1-1.3-1.3v-7.1A1.3 1.3 0 0 1 6.7 10Z" stroke="#64748b" strokeWidth="2.2" />

    </svg>

  );

}

function CoachIcon() {

  return (

    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#FF6A00" strokeWidth="2.1" />

      <path d="M4.5 20c.9-3.4 3.6-5.2 7.5-5.2s6.6 1.8 7.5 5.2" stroke="#FF6A00" strokeWidth="2.1" strokeLinecap="round" />

      <path d="M9.3 8.2h5.4" stroke="#FF6A00" strokeWidth="2.1" strokeLinecap="round" />

    </svg>

  );

}

function ProgressIcon() {

  return (

    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M4 17l5-5 4 4 7-8" stroke="#FF6A00" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M15 8h5v5" stroke="#FF6A00" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />

    </svg>

  );

}

function HistoryIcon() {

  return (

    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path d="M8 5h8" stroke="#FF6A00" strokeWidth="2.1" strokeLinecap="round" />

      <path d="M9 3h6v4H9V3Z" stroke="#FF6A00" strokeWidth="2.1" strokeLinejoin="round" />

      <path d="M6.5 6h11A1.5 1.5 0 0 1 19 7.5v12A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-12A1.5 1.5 0 0 1 6.5 6Z" stroke="#FF6A00" strokeWidth="2.1" />

      <path d="M8.5 12h7M8.5 16h5" stroke="#FF6A00" strokeWidth="2.1" strokeLinecap="round" />

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

  quickMountCard: {

    marginTop: 18,

    width: "100%",

    minHeight: 108,

    border: "1px solid rgba(255,199,160,.42)",

    borderRadius: "28px 28px 28px 9px",

    padding: "14px 14px 14px 15px",

    background: "linear-gradient(135deg, rgba(255,255,255,.99), rgba(255,250,246,.98))",

    color: TEXT,

    boxShadow: "0 18px 48px rgba(15,23,42,.08), 0 10px 28px rgba(255,106,0,.08), inset 0 1px 0 rgba(255,255,255,.95)",

    display: "grid",

    gridTemplateColumns: "68px 1fr 44px",

    alignItems: "center",

    gap: 13,

    textAlign: "left",

    position: "relative",

    overflow: "visible",

    animation: "messageFloat 4s ease-in-out infinite",

  },

  quickMountTail: {

    position: "absolute",

    left: -1,

    bottom: -1,

    width: 24,

    height: 24,

    background: "rgba(255,255,255,.99)",

    borderLeft: "1px solid rgba(255,199,160,.34)",

    borderBottom: "1px solid rgba(255,199,160,.34)",

    borderBottomLeftRadius: 20,

    clipPath: "polygon(0 32%, 100% 0, 100% 100%, 0 100%)",

    boxShadow: "-8px 10px 18px rgba(15,23,42,.04)",

  },

  quickMountGlow: {

    position: "absolute",

    right: -18,

    bottom: -26,

    width: 100,

    height: 100,

    borderRadius: 999,

    background: "rgba(255,106,0,.08)",

    filter: "blur(20px)",

    pointerEvents: "none",

  },

  quickMountIconBox: {

    width: 68,

    height: 68,

    borderRadius: 24,

    background: "linear-gradient(135deg, rgba(255,246,239,.96), rgba(255,255,255,.96))",

    border: "1px solid rgba(255,106,0,.14)",

    display: "grid",

    placeItems: "center",

    position: "relative",

    boxShadow: "inset 0 1px 0 rgba(255,255,255,.92), 0 12px 26px rgba(255,106,0,.07)",

    flexShrink: 0,

  },

  quickMountMiniBadge: {

    position: "absolute",

    left: -5,

    top: -6,

    width: 28,

    height: 28,

    borderRadius: 999,

    background: "linear-gradient(135deg, #FF6A00, #FF944D)",

    color: "#fff",

    display: "grid",

    placeItems: "center",

    fontSize: 13,

    fontWeight: 950,

    boxShadow: "0 10px 20px rgba(255,106,0,.20)",

  },

  quickMountDumbbell: {

    display: "grid",

    placeItems: "center",

    filter: "drop-shadow(0 8px 12px rgba(255,106,0,.12))",

  },

  quickMountContent: {

    minWidth: 0,

    display: "grid",

    gap: 5,

    position: "relative",

    zIndex: 1,

  },

  quickMountTop: {

    display: "flex",

    alignItems: "center",

    gap: 8,

    minWidth: 0,

  },

  quickMountBadge: {

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    width: "fit-content",

    borderRadius: 999,

    padding: "5px 8px",

    background: "rgba(255,106,0,.08)",

    color: ORANGE,

    border: "1px solid rgba(255,106,0,.16)",

    fontSize: 10,

    fontWeight: 950,

    textTransform: "uppercase",

    letterSpacing: 1,

    flexShrink: 0,

  },

  quickMountTitle: {

    display: "block",

    fontSize: 19,

    lineHeight: 1.08,

    fontWeight: 980,

    letterSpacing: -0.7,

    color: "#111827",

  },

  quickMountSub: {

    display: "block",

    color: "#64748b",

    fontSize: 12.5,

    lineHeight: 1.3,

    fontWeight: 800,

  },

  quickMountArrow: {

    width: 42,

    height: 42,

    borderRadius: 999,

    background: "rgba(255,255,255,.86)",

    border: "1px solid rgba(255,106,0,.14)",

    display: "grid",

    placeItems: "center",

    position: "relative",

    zIndex: 1,

    boxShadow: "0 12px 26px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.96)",

  },

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

  previewHeader: { marginTop: 16 },

  previewSub: {

    marginTop: 6,

    fontSize: 15,

    fontWeight: 850,

    color: MUTED,

    letterSpacing: -0.2,

  },

  previewProgressCard: {

    marginTop: 14,

    borderRadius: 20,

    padding: "14px 16px",

    background: "#fff",

    border: "1px solid rgba(15,23,42,.06)",

    boxShadow: "0 12px 34px rgba(15,23,42,.05)",

    display: "grid",

    gridTemplateColumns: "34px auto 1fr auto",

    alignItems: "center",

    gap: 12,

  },

  previewGiftIcon: {

    width: 34,

    height: 34,

    borderRadius: 999,

    display: "grid",

    placeItems: "center",

    background: "rgba(255,106,0,.07)",

    border: "1px solid rgba(255,106,0,.18)",

  },

  previewProgressText: {

    fontSize: 13,

    fontWeight: 900,

    color: "#64748b",

    whiteSpace: "nowrap",

  },

  previewProgressTrack: {

    height: 9,

    borderRadius: 999,

    background: "rgba(15,23,42,.06)",

    overflow: "hidden",

  },

  previewProgressFill: {

    height: "100%",

    borderRadius: 999,

    background: "linear-gradient(90deg, #FF6A00, #FF8A3D)",

    boxShadow: "0 8px 18px rgba(255,106,0,.16)",

  },

  previewProgressPill: {

    padding: "8px 11px",

    borderRadius: 999,

    background: "rgba(15,23,42,.04)",

    border: "1px solid rgba(15,23,42,.05)",

    color: "#334155",

    fontSize: 12,

    fontWeight: 950,

    whiteSpace: "nowrap",

  },

  previewList: {

    marginTop: 14,

    display: "grid",

    gap: 14,

  },

  previewExCard: {

    borderRadius: 24,

    padding: 16,

    background: "#fff",

    border: "1px solid rgba(15,23,42,.055)",

    boxShadow: "0 14px 38px rgba(15,23,42,.055)",

    display: "grid",

    gridTemplateColumns: "70px 1fr",

    gap: 14,

    alignItems: "center",

  },

  previewNumber: {

    width: 58,

    height: 58,

    borderRadius: 18,

    display: "grid",

    placeItems: "center",

    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",

    color: "#fff",

    fontSize: 23,

    fontWeight: 980,

    boxShadow: "0 14px 30px rgba(255,106,0,.18)",

  },

  previewExBody: { minWidth: 0 },

  previewExName: {

    fontSize: 20,

    fontWeight: 980,

    color: TEXT,

    letterSpacing: -0.55,

    lineHeight: 1.05,

  },

  previewExNote: {

    marginTop: 6,

    fontSize: 13.5,

    fontWeight: 850,

    color: MUTED,

    lineHeight: 1.25,

  },

  previewChips: {

    marginTop: 12,

    display: "flex",

    gap: 10,

    flexWrap: "wrap",

    alignItems: "center",

  },

  previewChip: {

    minHeight: 36,

    padding: "8px 13px",

    borderRadius: 999,

    background: "rgba(255,106,0,.065)",

    border: "1px solid rgba(255,106,0,.13)",

    color: TEXT,

    fontSize: 13,

    fontWeight: 950,

    display: "inline-flex",

    alignItems: "center",

    gap: 8,

    boxShadow: "inset 0 1px 0 rgba(255,255,255,.70)",

  },

  previewChipButton: {

    minHeight: 36,

    padding: "8px 13px",

    borderRadius: 999,

    background: "rgba(255,106,0,.065)",

    border: "1px solid rgba(255,106,0,.13)",

    color: TEXT,

    fontSize: 13,

    fontWeight: 950,

    display: "inline-flex",

    alignItems: "center",

    gap: 8,

    boxShadow: "inset 0 1px 0 rgba(255,255,255,.70)",

  },

  previewCheckBtn: {

    width: 36,

    height: 36,

    borderRadius: 999,

    display: "grid",

    placeItems: "center",

    border: "1px solid rgba(15,23,42,.07)",

    transition: "transform .12s ease, background .12s ease, box-shadow .12s ease",

  },

  previewCheckBtnOff: {

    background: "rgba(15,23,42,.045)",

    boxShadow: "none",

  },

  previewCheckBtnOn: {

    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",

    boxShadow: "0 12px 28px rgba(255,106,0,.20)",

  },

  previewLockedCard: {

    marginTop: 16,

    borderRadius: 28,

    padding: "24px 18px 20px",

    background:

      "radial-gradient(circle at 50% 0%, rgba(255,106,0,.12), rgba(255,106,0,0) 38%), linear-gradient(135deg, rgba(255,248,243,.98), rgba(255,255,255,.98))",

    border: "1px dashed rgba(255,106,0,.22)",

    boxShadow: "0 18px 48px rgba(255,106,0,.08), 0 12px 32px rgba(15,23,42,.055)",

    textAlign: "center",

    position: "relative",

    overflow: "hidden",

  },

  lockSparkOne: {

    position: "absolute",

    top: 48,

    left: "36%",

    color: "rgba(255,106,0,.34)",

    fontSize: 18,

    fontWeight: 900,

  },

  lockSparkTwo: {

    position: "absolute",

    top: 54,

    right: "35%",

    color: "rgba(255,106,0,.28)",

    fontSize: 15,

    fontWeight: 900,

  },

  previewLockIcon: {

    width: 72,

    height: 72,

    borderRadius: 24,

    margin: "0 auto",

    display: "grid",

    placeItems: "center",

    background: "rgba(255,255,255,.78)",

    border: "1px solid rgba(255,255,255,.88)",

    boxShadow: "0 16px 34px rgba(15,23,42,.07), inset 0 1px 0 rgba(255,255,255,.95)",

  },

  previewBrandPill: {

    margin: "12px auto 0",

    width: "fit-content",

    padding: "6px 12px",

    borderRadius: 999,

    background: "rgba(255,106,0,.10)",

    border: "1px solid rgba(255,106,0,.10)",

    color: ORANGE,

    fontSize: 13,

    fontWeight: 980,

  },

  previewLockTitle: {

    marginTop: 18,

    color: TEXT,

    fontSize: 22,

    fontWeight: 980,

    letterSpacing: -0.65,

    lineHeight: 1.08,

  },

  previewLockSub: {

    marginTop: 8,

    color: MUTED,

    fontSize: 13.5,

    fontWeight: 800,

    lineHeight: 1.35,

  },

  previewBenefits: {

    marginTop: 16,

    display: "grid",

    gridTemplateColumns: "1fr",

    gap: 9,

  },

  previewBenefit: {

    minHeight: 42,

    padding: "10px 12px",

    borderRadius: 999,

    background: "rgba(255,255,255,.66)",

    border: "1px solid rgba(255,106,0,.12)",

    color: "#334155",

    fontSize: 12.5,

    fontWeight: 900,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

  },

  previewPremiumBtn: {

    marginTop: 16,

    width: "100%",

    minHeight: 58,

    border: "none",

    borderRadius: 999,

    background: "linear-gradient(135deg, #FF6A00, #FF7A1A)",

    color: "#fff",

    fontSize: 16,

    fontWeight: 980,

    letterSpacing: -0.25,

    boxShadow: "0 18px 42px rgba(255,106,0,.26), inset 0 1px 0 rgba(255,255,255,.22)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,

  },

  previewPremiumArrow: {

    fontSize: 26,

    lineHeight: 1,

    transform: "translateY(-1px)",

  },

  previewAccess: {

    marginTop: 12,

    color: MUTED,

    fontSize: 13,

    fontWeight: 900,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

  },

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

  weightOverlay: {

    position: "fixed",

    inset: 0,

    zIndex: 999999,

    background: "rgba(15,23,42,.28)",

    backdropFilter: "blur(8px)",

    WebkitBackdropFilter: "blur(8px)",

    display: "flex",

    alignItems: "flex-end",

    justifyContent: "center",

    padding: 14,

  },

  weightSheet: {

    width: "100%",

    maxWidth: 520,

    borderRadius: "28px 28px 24px 24px",

    background: "#fff",

    border: "1px solid rgba(255,255,255,.80)",

    boxShadow: "0 -24px 80px rgba(15,23,42,.22)",

    padding: "10px 16px calc(18px + env(safe-area-inset-bottom))",

    animation: "sheetUp .18s ease-out",

    position: "relative",

    zIndex: 1000000,

  },

  weightHandle: {

    width: 44,

    height: 5,

    borderRadius: 999,

    background: "rgba(15,23,42,.16)",

    margin: "2px auto 14px",

  },

  weightTop: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "flex-start",

    gap: 12,

  },

  weightKicker: {

    fontSize: 12,

    fontWeight: 950,

    color: ORANGE,

    textTransform: "uppercase",

    letterSpacing: 0.7,

  },

  weightTitle: {

    marginTop: 5,

    fontSize: 20,

    fontWeight: 980,

    color: TEXT,

    letterSpacing: -0.5,

  },

  weightClose: {

    width: 38,

    height: 38,

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.07)",

    background: "rgba(15,23,42,.04)",

    color: TEXT,

    fontSize: 28,

    lineHeight: "32px",

    fontWeight: 700,

  },

  weightControl: {

    marginTop: 18,

    display: "grid",

    gridTemplateColumns: "54px 1fr 54px",

    gap: 12,

    alignItems: "center",

  },

  weightRoundBtn: {

    width: 54,

    height: 54,

    borderRadius: 18,

    border: "none",

    background: "rgba(255,106,0,.13)",

    color: TEXT,

    fontSize: 28,

    fontWeight: 950,

  },

  weightValueBox: {

    minHeight: 64,

    borderRadius: 22,

    background: "rgba(15,23,42,.035)",

    border: "1px solid rgba(15,23,42,.07)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    padding: "0 14px",

  },

  weightInput: {

    width: 92,

    border: "none",

    outline: "none",

    background: "transparent",

    color: TEXT,

    fontSize: 28,

    fontWeight: 980,

    textAlign: "center",

  },

  weightUnit: {

    color: MUTED,

    fontSize: 16,

    fontWeight: 950,

  },

  weightQuickRow: {

    marginTop: 12,

    display: "grid",

    gridTemplateColumns: "1fr 1fr",

    gap: 10,

  },

  weightQuickBtn: {

    minHeight: 46,

    borderRadius: 16,

    border: "1px solid rgba(255,106,0,.18)",

    background: "rgba(255,106,0,.07)",

    color: TEXT,

    fontWeight: 950,

  },

  weightSaveBtn: {

    marginTop: 12,

    width: "100%",

    minHeight: 56,

    border: "none",

    borderRadius: 18,

    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",

    color: "#111",

    fontSize: 15,

    fontWeight: 980,

    boxShadow: "0 18px 42px rgba(255,106,0,.22)",

  },

};

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

      @keyframes messageFloat {

        0%, 100% { transform: translateY(0px); }

        50% { transform: translateY(-2px); }

      }

      @keyframes finishFloat {

        0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }

        50% { transform: translateX(-50%) translateY(-3px) scale(1.01); }

      }

      @keyframes sheetUp {

        from { transform: translateY(18px); opacity: .75; }

        to { transform: translateY(0); opacity: 1; }

      }

      .apple-press:active { transform: translateY(1px) scale(.98); }

      .settings-press:active { transform: translateY(1px) scale(.97); }

      body.fitdeal-weight-editor-open .bottom-menu,

      body.fitdeal-weight-editor-open .bottomMenu,

      body.fitdeal-weight-editor-open .BottomMenu,

      body.fitdeal-weight-editor-open [data-bottom-menu="true"],

      body.fitdeal-weight-editor-open nav[class*="bottom"],

      body.fitdeal-weight-editor-open div[class*="bottom-menu"],

      body.fitdeal-weight-editor-open div[class*="BottomMenu"] {

        opacity: 0 !important;

        pointer-events: none !important;

        transform: translateY(24px) !important;

      }

    `;

    document.head.appendChild(style);

  }

}
