import React, { useMemo, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { supabase } from "../lib/supabase";

import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";

const TEXT = "#0f172a";

const MUTED = "#64748b";

const BORDER = "rgba(15,23,42,.08)";

const GREEN = "#22c55e";

const BLUE = "#1D9BF0";

function haptic() {

  if (navigator.vibrate) navigator.vibrate(8);

}

function todayKey() {

  return new Date().toISOString().slice(0, 10);

}

function clamp(n, a, b) {

  return Math.max(a, Math.min(b, n));

}

function calcWeeklyCount(list) {

  const now = new Date();

  return list.filter((k) => {

    const dt = new Date(k);

    const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);

    return diff >= 0 && diff < 7.0001;

  }).length;

}

function calcStreak(workoutDates) {

  let s = 0;

  const workoutSet = new Set(workoutDates || []);

  const d = new Date();

  d.setHours(0, 0, 0, 0);

  while (true) {

    const k = d.toISOString().slice(0, 10);

    if (workoutSet.has(k)) {

      s++;

      d.setDate(d.getDate() - 1);

    } else {

      break;

    }

  }

  return s;

}

function getGreeting() {

  const h = new Date().getHours();

  if (h < 12) return "Bom dia";

  if (h < 18) return "Boa tarde";

  return "Boa noite";

}

function labelFromGoal(g) {

  if (!g) return "";

  if (g.type === "freq") return `${g.value} dias de frequência`;

  if (g.type === "pr") return `${g.value}kg no ${g.exercise || "exercício"}`;

  if (g.type === "peso") return `${g.value}kg alvo`;

  return g.title || "Meta";

}

function momentumLabel(weekly, weekGoal, streak) {

  if (streak >= 7) return "Insano";

  if (weekly >= weekGoal) return "Excelente";

  if (weekly >= weekGoal - 1) return "Forte";

  return "Constante";

}

function momentumText(v) {

  if (v === "Insano") return "Seu ritmo está acima da média. Continue assim.";

  if (v === "Excelente") return "Você está mantendo uma consistência forte.";

  if (v === "Forte") return "Mais um treino e você fecha a meta semanal.";

  return "Seu progresso depende da repetição diária.";

}

function progressFromGoal(goal, weekly, streak) {

  if (!goal) return 0.4;

  if (goal.progress) return goal.progress;

  if (goal.type === "freq") {

    return clamp(weekly / Number(goal.value || 1), 0, 1);

  }

  return clamp(streak / 10, 0, 1);

}

function calcReadiness(lastWorkout) {

  if (!lastWorkout?.completed_at) {

    return {

      percent: 100,

      label: "Pronto",

      text: "Você está pronto para começar.",

      hoursText: "novo ciclo",

    };

  }

  const lastDate = new Date(lastWorkout.completed_at);

  const now = new Date();

  const diffHours = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60));

  const percent = clamp(Math.round((diffHours / 24) * 100), 0, 100);

  const hoursText = diffHours < 1 ? "menos de 1h" : `${Math.floor(diffHours)}h`;

  if (diffHours < 8) {

    return {

      percent,

      label: "Recuperando",

      text: "Treino concluído recentemente.",

      hoursText,

    };

  }

  if (diffHours < 18) {

    return {

      percent,

      label: "Quase pronto",

      text: "Seu corpo ainda está recuperando.",

      hoursText,

    };

  }

  return {

    percent,

    label: "Pronto",

    text: "Seu corpo já teve uma boa recuperação.",

    hoursText,

  };

}

function estimateKcal({ weightKg = 80, minutes = 45, met = 6 }) {

  return Math.round(((met * 3.5 * Number(weightKg || 80)) / 200) * Number(minutes || 0));

}

function buildWavePath(points = []) {

  if (!points.length) return "M2 30 C20 25, 30 25, 45 25 C60 25, 75 25, 118 25";

  const w = 120;

  const minY = 6;

  const maxY = 32;

  const mapped = points.map((v, i) => {

    const x = 2 + (i * (w - 4)) / Math.max(points.length - 1, 1);

    const y = maxY - clamp(Number(v) || 0, 0, 1) * (maxY - minY);

    return { x, y };

  });

  let d = `M${mapped[0].x} ${mapped[0].y}`;

  for (let i = 1; i < mapped.length; i++) {

    const prev = mapped[i - 1];

    const curr = mapped[i];

    const midX = (prev.x + curr.x) / 2;

    d += ` C${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;

  }

  return d;

}

function MotionWave({ points = [], color = ORANGE }) {

  const d = buildWavePath(points);

  const last = points.length ? clamp(points[points.length - 1], 0, 1) : 0.5;

  const cx = 118;

  const cy = 32 - last * 26;

  return (

    <svg width="100%" height="42" viewBox="0 0 120 42" fill="none">

      <path

        d={d}

        stroke="rgba(15,23,42,.08)"

        strokeWidth="7"

        strokeLinecap="round"

        fill="none"

      />

      <path

        d={d}

        stroke={color}

        strokeWidth="4"

        strokeLinecap="round"

        fill="none"

        style={{

          transition: "d .45s ease, stroke .25s ease",

          filter: "drop-shadow(0 8px 12px rgba(255,106,0,.18))",

        }}

      />

      <circle

        cx={cx}

        cy={cy}

        r="4"

        fill={color}

        style={{

          transition: "cx .45s ease, cy .45s ease",

          filter: "drop-shadow(0 6px 10px rgba(255,106,0,.24))",

        }}

      />

    </svg>

  );

}

function TinyLine({ color = ORANGE }) {

  return (

    <svg width="100%" height="38" viewBox="0 0 120 38" fill="none">

      <path

        d="M2 27 C14 35, 22 8, 36 20 C49 31, 56 9, 70 18 C83 27, 92 4, 118 10"

        stroke={color}

        strokeWidth="4"

        strokeLinecap="round"

        fill="none"

      />

      <circle cx="118" cy="10" r="4" fill={color} />

    </svg>

  );

}

function TypeLogo({ text = "fitdeal" }) {

  const [count, setCount] = useState(0);

  useEffect(() => {

    if (count >= text.length) return;

    const t = setTimeout(() => {

      setCount((v) => v + 1);

    }, count === 0 ? 250 : 115);

    return () => clearTimeout(t);

  }, [count, text]);

  return (

    <div style={styles.wordmark}>

      <span>{text.slice(0, count)}</span>

      <span style={styles.logoDot}>.</span>

      {count < text.length ? <span style={styles.cursor} /> : null}

    </div>

  );

}

function Icon({ name, size = 20, color = TEXT }) {

  const common = {

    width: size,

    height: size,

    stroke: color,

    fill: "none",

    strokeWidth: 2,

    strokeLinecap: "round",

    strokeLinejoin: "round",

  };

  switch (name) {

    case "fire":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-4 4-8 4-8Z" />

          <path d="M12 14a3 3 0 1 0 3 3" />

        </svg>

      );

    case "calendar":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <rect x="3" y="5" width="18" height="16" rx="3" />

          <path d="M16 3v4M8 3v4M3 10h18" />

        </svg>

      );

    case "dumbbell":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <path d="M3 10v4M6 8v8M18 8v8M21 10v4M8 12h8" />

        </svg>

      );

    case "drop":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <path d="M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z" />

        </svg>

      );

    case "lock":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <rect x="5" y="11" width="14" height="10" rx="2" />

          <path d="M8 11V8a4 4 0 1 1 8 0v3" />

        </svg>

      );

    case "bolt":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <path d="M13 2 4 14h6l-1 8 9-12h-6z" />

        </svg>

      );

    case "exercise":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <path d="M4 10v4M7 8v8M17 8v8M20 10v4M9 12h6" />

        </svg>

      );

    case "target":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <circle cx="12" cy="12" r="8" />

          <circle cx="12" cy="12" r="4" />

        </svg>

      );

    case "info":

      return (

        <svg viewBox="0 0 24 24" {...common}>

          <circle cx="12" cy="12" r="9" />

          <path d="M12 10v6M12 7h.01" />

        </svg>

      );

    default:

      return null;

  }

}

function StatCard({ icon, value, sub, children, locked, onClick }) {

  return (

    <button

      type="button"

      onClick={() => {

        haptic();

        if (onClick) onClick();

      }}

      style={styles.statCard}

    >

      {locked ? (

        <div style={styles.lockMini}>

          <Icon name="lock" size={14} />

        </div>

      ) : null}

      <div style={styles.statIcon}>

        <Icon name={icon} size={20} color={ORANGE} />

      </div>

      <div style={styles.statValue}>{value}</div>

      <div style={styles.statSub}>{sub}</div>

      <div style={styles.statVisual}>{children}</div>

    </button>

  );

}

function ActionButton({ icon, label, onClick }) {

  return (

    <button

      type="button"

      style={styles.actionBtn}

      onClick={() => {

        haptic();

        onClick();

      }}

    >

      <div style={styles.actionIconWrap}>

        <Icon name={icon} size={22} color={ORANGE} />

      </div>

      <span>{label}</span>

    </button>

  );

}

function GoalRow({ goal, progress, onClick }) {

  const pct = Math.round(progress * 100);

  return (

    <button

      type="button"

      style={styles.goalRow}

      onClick={() => {

        haptic();

        onClick();

      }}

    >

      <div style={styles.goalIcon}>

        <Icon name={goal?.type === "freq" ? "calendar" : "target"} size={18} color={MUTED} />

      </div>

      <div style={{ flex: 1, minWidth: 0 }}>

        <div style={styles.goalTitle}>{labelFromGoal(goal)}</div>

        <div style={styles.goalSub}>

          {goal?.type === "freq" ? "Meta anual" : "+12kg nas últimas semanas"}

        </div>

        <div style={styles.goalTrack}>

          <div style={{ ...styles.goalFill, width: `${pct}%` }} />

        </div>

      </div>

      <div style={styles.goalPct}>{pct}%</div>

    </button>

  );

}
async function loadPaidStatus(userId) {

  if (!userId) return false;

  try {

    const { data: subRows } = await supabase

      .from("subscriptions")

      .select("status, plan, plan_type")

      .eq("user_id", userId)

      .in("status", ["active", "trialing"]);

    const hasActiveSub = (subRows || []).some((row) => {

      const plan = String(row?.plan || "").toLowerCase();

      const planType = String(row?.plan_type || "").toLowerCase();

      return (

        planType === "basic" ||

        planType === "basico" ||

        planType === "premium" ||

        planType === "nutri_plus" ||

        planType === "nutri+" ||

        plan === "basic" ||

        plan === "basico" ||

        plan === "premium" ||

        plan === "nutri_plus" ||

        plan === "nutri+"

      );

    });

    if (hasActiveSub) return true;

    const { data: profile } = await supabase

      .from("profiles")

      .select("is_paid, plan, role, nutri_plus")

      .eq("id", userId)

      .maybeSingle();

    const profilePlan = String(profile?.plan || "").toLowerCase();

    const role = String(profile?.role || "").toLowerCase();

    if (profile?.is_paid === true) return true;

    if (profile?.nutri_plus === true) return true;

    if (profilePlan === "premium") return true;

    if (profilePlan === "basic") return true;

    if (profilePlan === "basico") return true;

    if (profilePlan === "nutri_plus") return true;

    if (profilePlan === "nutri+") return true;

    if (role === "nutri_plus") return true;

    if (role === "nutri+") return true;

    return false;

  } catch {

    return false;

  }

}

async function loadNutriStatus(userId) {

  if (!userId) return false;

  try {

    const { data: subRows } = await supabase

      .from("subscriptions")

      .select("status, plan, plan_type")

      .eq("user_id", userId)

      .in("status", ["active", "trialing"]);

    const hasNutriSub = (subRows || []).some((row) => {

      const plan = String(row?.plan || "").toLowerCase();

      const planType = String(row?.plan_type || "").toLowerCase();

      return (

        planType === "nutri_plus" ||

        planType === "nutri+" ||

        planType === "nutriplus" ||

        plan.includes("nutri") ||

        planType.includes("nutri")

      );

    });

    if (hasNutriSub) return true;

    const { data: profile } = await supabase

      .from("profiles")

      .select("nutri_plus, plan, role")

      .eq("id", userId)

      .maybeSingle();

    const profilePlan = String(profile?.plan || "").toLowerCase();

    const role = String(profile?.role || "").toLowerCase();

    if (profile?.nutri_plus === true) return true;

    if (profilePlan === "nutri_plus") return true;

    if (profilePlan === "nutri+") return true;

    if (profilePlan === "nutriplus") return true;

    if (role === "nutri_plus") return true;

    if (role === "nutri+") return true;

    if (role === "nutriplus") return true;

    return false;

  } catch {

    return false;

  }

}
function getPlanInfo({ paid, hasNutriPlus }) {

  if (hasNutriPlus) {

    return {

      key: "nutri_plus",

      topLabel: "Nutri+",

      cardTitle: "Nutri+ ativo • upgrade completo",

      cardSub: "Treinos, Nutrição, hidratação e recursos premium liberados.",

    };

  }

  if (paid) {

    return {

      key: "basic",

      topLabel: "Básico",

      cardTitle: "Básico ativo • R$12,99/mês",

      cardSub: "Treinos liberados. Nutri+ é upgrade.",

    };

  }

  return {

    key: "free",

    topLabel: "Free",

    cardTitle: "Plano gratuito",

    cardSub: "Assine para liberar treino completo.",

  };

}

async function loadCompletedWorkoutDates(userId) {

  if (!userId) return [];

  try {

    const { data } = await supabase

      .from("workout_sessions")

      .select("session_date")

      .eq("user_id", userId)

      .eq("completed", true)

      .order("session_date", { ascending: false });

    return (data || []).map((row) => row.session_date).filter(Boolean);

  } catch {

    return [];

  }

}

async function loadLastWorkout(userId) {

  if (!userId) return null;

  try {

    const { data, error } = await supabase

      .from("workout_sessions")

      .select("session_date, completed_at, created_at")

      .eq("user_id", userId)

      .eq("completed", true)

      .not("completed_at", "is", null)

      .order("completed_at", { ascending: false })

      .limit(1)

      .maybeSingle();

    if (error) return null;

    return data || null;

  } catch {

    return null;

  }

}

async function loadTodayCalories(userId, dateKey, weightKg = 80) {

  if (!userId || !dateKey) return 0;

  try {

    const [{ data: workoutRows }, { data: cardioRows }] = await Promise.all([

      supabase

        .from("workout_sessions")

        .select("calories_burned, duration_minutes, session_date, completed")

        .eq("user_id", userId)

        .eq("completed", true)

        .eq("session_date", dateKey),

      supabase

        .from("cardio_sessions")

        .select("calories_burned, duration_minutes, date_key")

        .eq("user_id", userId)

        .eq("date_key", dateKey),

    ]);

    const workoutKcal = (workoutRows || []).reduce((sum, row) => {

      const saved = Number(row.calories_burned || 0);

      if (saved > 0) return sum + saved;

      const minutes = Number(row.duration_minutes || 45);

      return sum + estimateKcal({ weightKg, minutes, met: 6 });

    }, 0);

    const cardioKcal = (cardioRows || []).reduce((sum, row) => {

      const saved = Number(row.calories_burned || 0);

      if (saved > 0) return sum + saved;

      const minutes = Number(row.duration_minutes || 0);

      if (!minutes) return sum;

      return sum + estimateKcal({ weightKg, minutes, met: 7 });

    }, 0);

    return workoutKcal + cardioKcal;

  } catch {

    return 0;

  }

}

async function loadGoals(userId) {

  if (!userId) return [];

  try {

    const { data } = await supabase

      .from("user_goals")

      .select("*")

      .eq("user_id", userId)

      .eq("is_active", true)

      .order("created_at", { ascending: false });

    return data || [];

  } catch {

    return [];

  }

}

async function loadHydration(userId, dateKey) {

  if (!userId || !dateKey) return 0;

  try {

    const { data } = await supabase

      .from("daily_hydration")

      .select("water_ml")

      .eq("user_id", userId)

      .eq("date_key", dateKey)

      .maybeSingle();

    return Number(data?.water_ml || 0);

  } catch {

    return 0;

  }

}

async function saveHydration(userId, dateKey, waterMl) {

  if (!userId || !dateKey) return;

  try {

    await supabase.from("daily_hydration").upsert(

      {

        user_id: userId,

        date_key: dateKey,

        water_ml: Math.max(0, Number(waterMl) || 0),

        updated_at: new Date().toISOString(),

      },

      { onConflict: "user_id,date_key" }

    );

  } catch {}

}

export default function Dashboard() {

  const nav = useNavigate();

  const { user } = useAuth();

  const today = useMemo(() => todayKey(), []);

  const [paid, setPaid] = useState(false);

  const [hasNutriPlus, setHasNutriPlus] = useState(false);

  const [workouts, setWorkouts] = useState([]);

  const [goals, setGoals] = useState([]);

  const [waterMl, setWaterMl] = useState(0);

  const [lastWorkout, setLastWorkout] = useState(null);

  const [todayCalories, setTodayCalories] = useState(0);

  const [consistencyOpen, setConsistencyOpen] = useState(false);

  const [hydrationOpen, setHydrationOpen] = useState(false);

  const [momentumOpen, setMomentumOpen] = useState(false);

  const name = user?.nome ? user.nome.split(" ")[0] : "Rafael";

  const peso = Number(user?.peso || 0) || 80;

  const weekGoal = Number(user?.frequencia || 4) || 4;

  const weekly = useMemo(() => calcWeeklyCount(workouts), [workouts]);

  const streak = useMemo(() => calcStreak(workouts), [workouts]);

  const goalMl = useMemo(() => clamp(Math.round(peso * 35), 1800, 5000), [peso]);

  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;

  const readiness = useMemo(() => calcReadiness(lastWorkout), [lastWorkout]);

  const planInfo = useMemo(

    () => getPlanInfo({ paid, hasNutriPlus }),

    [paid, hasNutriPlus]

  );

  const momentum = useMemo(

    () => momentumLabel(weekly, weekGoal, streak),

    [weekly, weekGoal, streak]

  );

  const adherence = useMemo(

    () => clamp(Math.round((weekly / Math.max(weekGoal, 1)) * 100), 0, 100),

    [weekly, weekGoal]

  );

  const volumeStatus = useMemo(() => {

    if (weekly >= weekGoal) return "Bom";

    if (weekly >= Math.max(1, weekGoal - 1)) return "Ok";

    return "Baixo";

  }, [weekly, weekGoal]);

  const progressStatus = useMemo(() => {

    if (weekly >= weekGoal && streak >= 3) {

      return {

        label: "Progresso certo",

        color: GREEN,

        text: "Seu volume está bom e sua consistência está ajudando na evolução.",

      };

    }

    if (weekly >= Math.max(1, weekGoal - 1)) {

      return {

        label: "Quase ideal",

        color: ORANGE,

        text: "Você está perto do volume ideal. Mais um treino melhora o ritmo da semana.",

      };

    }

    return {

      label: "Volume baixo",

      color: ORANGE,

      text: "Seu volume está abaixo do planejado. Priorize mais um treino para manter progresso.",

    };

  }, [weekly, weekGoal, streak]);

  const momentumWave = useMemo(() => {

    const base = [0.42, 0.48, 0.44, 0.55, 0.5, 0.62, 0.58];

    const weeklyBoost = clamp(weekly / Math.max(weekGoal, 1), 0, 1);

    const streakBoost = clamp(streak / 7, 0, 1);

    return base.map((v, i) => {

      const trainingImpact =

        i === base.length - 1 ? weeklyBoost * 0.34 + streakBoost * 0.18 : 0;

      const weeklyCurve = i * 0.025;

      return clamp(v + weeklyCurve + trainingImpact, 0.08, 0.96);

    });

  }, [weekly, weekGoal, streak]);

  const progressWave = useMemo(() => {

    const volume = clamp(weekly / Math.max(weekGoal, 1), 0, 1);

    const consistency = clamp(streak / 7, 0, 1);

    const adherenceScore = adherence / 100;

    return [

      0.3,

      clamp(0.34 + volume * 0.18, 0, 1),

      clamp(0.38 + consistency * 0.18, 0, 1),

      clamp(0.42 + adherenceScore * 0.22, 0, 1),

      clamp(0.46 + volume * 0.25, 0, 1),

      clamp(0.5 + consistency * 0.22, 0, 1),

      clamp(0.54 + adherenceScore * 0.3, 0, 1),

    ];

  }, [weekly, weekGoal, streak, adherence]);

  const mainGoals = useMemo(() => {

    if (goals.length) return goals.slice(0, 2);

    return [

      {

        id: "demo-pr",

        type: "pr",

        value: 80,

        exercise: "Agachamento",

        progress: 0.76,

      },

      {

        id: "demo-freq",

        type: "freq",

        value: 60,

        progress: 0.58,

      },

    ];

  }, [goals]);

  useEffect(() => {

    let active = true;

    async function bootstrap() {

      if (!user?.id) return;

      const [

        paidStatus,

        nutriStatus,

        workoutDates,

        activeGoals,

        hydration,

        lastWorkoutRow,

        todayKcal,

      ] = await Promise.all([

        loadPaidStatus(user.id),

        loadNutriStatus(user.id),

        loadCompletedWorkoutDates(user.id),

        loadGoals(user.id),

        loadHydration(user.id, today),

        loadLastWorkout(user.id),

        loadTodayCalories(user.id, today, peso),

      ]);

      if (!active) return;

      setPaid(paidStatus);

      setHasNutriPlus(nutriStatus);

      setWorkouts(workoutDates);

      setGoals(activeGoals);

      setWaterMl(hydration);

      setLastWorkout(lastWorkoutRow);

      setTodayCalories(todayKcal);

    }

    bootstrap();

    return () => {

      active = false;

    };

  }, [user?.id, today, peso]);

  useEffect(() => {

    if (!user?.id) return;

    const channel = supabase

      .channel(`dashboard-live-${user.id}`)

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "workout_sessions",

          filter: `user_id=eq.${user.id}`,

        },

        async () => {

          const [nextWorkouts, nextCalories, lastWorkoutRow] = await Promise.all([

            loadCompletedWorkoutDates(user.id),

            loadTodayCalories(user.id, today, peso),

            loadLastWorkout(user.id),

          ]);

          setWorkouts(nextWorkouts);

          setTodayCalories(nextCalories);

          setLastWorkout(lastWorkoutRow);

        }

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "cardio_sessions",

          filter: `user_id=eq.${user.id}`,

        },

        async () => {

          const nextCalories = await loadTodayCalories(user.id, today, peso);

          setTodayCalories(nextCalories);

        }

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "daily_hydration",

          filter: `user_id=eq.${user.id}`,

        },

        async () => {

          const nextWater = await loadHydration(user.id, today);

          setWaterMl(nextWater);

        }

      )

      .subscribe();

    return () => {

      supabase.removeChannel(channel);

    };

  }, [user?.id, today, peso]);

  async function addWaterQuick(amount = 300) {

    if (!user?.id || !hasNutriPlus) {

      nav("/planos");

      return;

    }

    const next = clamp(waterMl + amount, 0, goalMl * 2);

    setWaterMl(next);

    await saveHydration(user.id, today, next);

  }

  return (

    <div style={styles.page}>

      <style>{`

        @keyframes cursorBlink {

          0%,45% { opacity: 1; }

          46%,100% { opacity: .15; }

        }

        button {

          font-family: inherit;

          -webkit-tap-highlight-color: transparent;

          cursor: pointer;

        }

        button:active {

          transform: scale(.985);

        }

      `}</style>

      <div style={styles.bgOne} />

      <div style={styles.bgTwo} />

      <header style={styles.header}>

        <img

          src={LogoMark}

          alt="FitDeal"

          style={styles.logoBox}

          onClick={() => nav("/")}

          onError={(e) => {

            e.currentTarget.style.display = "none";

          }}

        />

        <div style={styles.logoCenter}>

          <TypeLogo />

          <div style={styles.slogan}>

            Seu melhor treino, <span style={styles.sloganOrange}>todo dia.</span>

          </div>

        </div>

        <button

          type="button"

          style={{

            ...styles.proPill,

            ...(hasNutriPlus ? styles.proPillNutri : null),

          }}

          onClick={() => nav("/planos")}

        >

          <span style={hasNutriPlus ? styles.proDotNutri : styles.proDot} />

          {planInfo.topLabel}

        </button>

      </header>

      <section style={styles.hero}>

        <div style={styles.heroText}>

          <h1 style={styles.heroTitle}>

            {getGreeting()}, {name}

          </h1>

          <p style={styles.heroParagraph}>

            {readiness.text}

            <br />

            Último treino: {readiness.hoursText}.

          </p>

          <button

            type="button"

            style={styles.recommendBtn}

            onClick={() => {

              haptic();

              nav("/treino-detalhe");

            }}

          >

            Ver recomendação <span>›</span>

          </button>

        </div>

        <button

          type="button"

          style={styles.ringWrap}

          onClick={() => {

            haptic();

            nav("/treino-detalhe");

          }}

        >

          <div

            style={{

              ...styles.ring,

              background: `conic-gradient(${ORANGE} 0 ${readiness.percent}%, rgba(255,106,0,.16) 0 100%)`,

            }}

          >

            <div style={styles.ringInner}>

              <strong style={styles.ringNumber}>{readiness.percent}</strong>

              <span style={styles.ringMin}>%</span>

            </div>

          </div>

          <div style={styles.ringLabel}>{readiness.label}</div>

        </button>

      </section>

      <section style={styles.statsGrid}>

        <StatCard

          icon="fire"

          value={todayCalories}

          sub="kcal hoje"

          onClick={() => nav("/treino-detalhe")}

        >

          <TinyLine />

        </StatCard>

        <StatCard

          icon="calendar"

          value={streak}

          sub="Consistência"

          onClick={() => setConsistencyOpen((v) => !v)}

        >

          <div style={styles.dotsLine}>

            <span style={styles.dotLineItem} />

            <span style={{ ...styles.dotLineItem, opacity: streak >= 2 ? 1 : 0.35 }} />

            <span style={{ ...styles.dotLineItem, opacity: streak >= 4 ? 1 : 0.35 }} />

          </div>

        </StatCard>

        <StatCard

          icon="dumbbell"

          value={`${weekly}/${weekGoal}`}

          sub="Semana"

          onClick={() => nav("/treino-detalhe")}

        >

          <div style={styles.bars}>

            {[0.28, 0.45, 0.68, 0.92].map((h, i) => (

              <span

                key={i}

                style={{

                  ...styles.barItem,

                  height: `${h * 30}px`,

                  opacity: weekly > i ? 1 : 0.35,

                }}

              />

            ))}

          </div>

        </StatCard>

        <StatCard

          icon="drop"

          value={`${Math.round(waterPct * 100)}%`}

          sub="Hidratação"

          locked={!hasNutriPlus}

          onClick={() => {

            if (!hasNutriPlus) return nav("/planos");

            setHydrationOpen((v) => !v);

          }}

        >

          <div style={styles.waterMiniTrack}>

            <div

              style={{

                ...styles.waterMiniFill,

                width: `${Math.round(waterPct * 100)}%`,

              }}

            />

          </div>

        </StatCard>

      </section>

      {consistencyOpen ? (

        <section style={styles.expandCard}>

          <div style={styles.expandTitle}>Consistência</div>

          <div style={styles.expandText}>

            Você está com {streak} dia(s) de sequência e {weekly}/{weekGoal} treinos nesta semana.

          </div>

          <button style={styles.expandBtn} onClick={() => nav("/treino-detalhe")} type="button">

            Ver histórico

          </button>

        </section>

      ) : null}

      {hydrationOpen ? (

        <section style={styles.expandCard}>

          <div style={styles.expandTitle}>Hidratação</div>

          <div style={styles.expandText}>

            {waterMl}ml consumidos hoje de {goalMl}ml.

          </div>

          <div style={styles.waterActions}>

            <button style={styles.waterBtn} onClick={() => addWaterQuick(100)} type="button">

              +100ml

            </button>

            <button style={styles.waterBtn} onClick={() => addWaterQuick(250)} type="button">

              +250ml

            </button>

          </div>

        </section>

      ) : null}

      <section

        style={{

          ...styles.planCard,

          ...(hasNutriPlus ? styles.planCardNutri : null),

        }}

      >

        <div>

          <div style={styles.planLabel}>Plano ativo</div>

          <div style={styles.planName}>{planInfo.cardTitle}</div>

          <div style={styles.planSub}>{planInfo.cardSub}</div>

        </div>

        <button

          type="button"

          style={styles.manageBtn}

          onClick={() => {

            haptic();

            nav("/planos");

          }}

        >

          Gerenciar

        </button>

      </section>

      <section style={styles.actions}>

        <ActionButton icon="bolt" label="Treino" onClick={() => nav("/treino-detalhe")} />

        <ActionButton

          icon="exercise"

          label="Exercícios"

          onClick={() => nav("/personalize")}

        />

      </section>

      <section style={styles.bottomGrid}>

        <div style={styles.goalsCard}>

          <div style={styles.cardTop}>

            <h2 style={styles.cardTitle}>Suas metas</h2>

            <button type="button" style={styles.cardLink} onClick={() => nav("/metas")}>

              Ver todas

            </button>

          </div>

          <div style={styles.goalsList}>

            {mainGoals.map((g) => (

              <GoalRow

                key={g.id}

                goal={g}

                progress={progressFromGoal(g, weekly, streak)}

                onClick={() => nav("/metas")}

              />

            ))}

          </div>

        </div>

        <button

          type="button"

          style={styles.momentumCard}

          onClick={() => {

            haptic();

            setMomentumOpen((v) => !v);

          }}

        >

          <div style={styles.momentumTop}>

            <h2 style={styles.cardTitle}>Momentum</h2>

            <Icon name="info" size={18} color={MUTED} />

          </div>

          <div style={styles.momentumLabel}>{momentum}</div>

          <p style={styles.momentumText}>{momentumText(momentum)}</p>

          <MotionWave points={momentumWave} color={ORANGE} />

          {momentumOpen ? (

            <div style={styles.momentumDetails}>

              <div style={styles.detailTitle}>Recomendação</div>

              <div style={styles.detailText}>

                Priorize exercícios compostos e mantenha o ritmo semanal. Para evoluir melhor,

                registre cargas no treino de peito, ombro, costas e pernas.

              </div>

            </div>

          ) : null}

        </button>

      </section>

      <section style={styles.progressCard}>

        <div style={styles.progressTop}>

          <h2 style={styles.cardTitle}>Registro de progresso</h2>

          <span style={styles.cardLink}>Análise</span>

        </div>

        <div style={styles.progressDiagnosis}>

          <div style={styles.diagnosisBadge}>{progressStatus.label}</div>

          <div style={styles.diagnosisText}>{progressStatus.text}</div>

        </div>

        <div style={styles.progressStats}>

          <div style={styles.progressStatBox}>

            <strong style={styles.progressStrong}>{weekly}</strong>

            <span style={styles.progressSpan}>treinos na semana</span>

          </div>

          <div style={styles.progressStatBox}>

            <strong style={styles.progressStrong}>{adherence}%</strong>

            <span style={styles.progressSpan}>adesão</span>

          </div>

          <div>

            <strong style={{ ...styles.progressStrong, color: GREEN }}>

              {volumeStatus}

            </strong>

            <span style={styles.progressSpan}>volume</span>

          </div>

          <div style={styles.progressMiniChart}>

            <MotionWave points={progressWave} color={progressStatus.color} />

          </div>

        </div>

      </section>

    </div>

  );

}

const styles = {

  page: {

    minHeight: "100dvh",

    width: "100%",

    boxSizing: "border-box",

    padding: "18px 14px 118px",

    background:

      "radial-gradient(620px 320px at 18% -8%, rgba(255,106,0,.12), rgba(255,255,255,0) 62%), linear-gradient(180deg, #fbfcff 0%, #f7f9fc 100%)",

    position: "relative",

    overflowX: "hidden",

    overflowY: "auto",

    color: TEXT,

  },

  bgOne: {

    position: "absolute",

    width: 280,

    height: 280,

    borderRadius: 999,

    background: "rgba(255,106,0,.08)",

    filter: "blur(60px)",

    top: -110,

    left: -110,

    pointerEvents: "none",

  },

  bgTwo: {

    position: "absolute",

    width: 220,

    height: 220,

    borderRadius: 999,

    background: "rgba(15,23,42,.045)",

    filter: "blur(60px)",

    top: 130,

    right: -120,

    pointerEvents: "none",

  },

  header: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "46px 1fr 64px",

    alignItems: "start",

    gap: 8,

    marginBottom: 16,

  },

  logoBox: {

    width: 42,

    height: 42,

    borderRadius: 15,

    objectFit: "contain",

    background: "rgba(255,106,0,.08)",

    border: "1px solid rgba(255,106,0,.12)",

    padding: 8,

    boxShadow: "0 12px 28px rgba(15,23,42,.06)",

    boxSizing: "border-box",

  },

  logoCenter: {

    textAlign: "center",

    minWidth: 0,

    overflow: "hidden",

  },

  wordmark: {

    minHeight: 42,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,

    fontSize: 32,

    fontWeight: 950,

    letterSpacing: -1.2,

    color: "#020617",

    whiteSpace: "nowrap",

    lineHeight: 1,

    maxWidth: "100%",

  },

  logoDot: {

    color: ORANGE,

  },

  cursor: {

    width: 2,

    height: 31,

    marginLeft: 3,

    background: ORANGE,

    display: "inline-block",

    animation: "cursorBlink .9s infinite",

  },

  slogan: {

    marginTop: 0,

    fontFamily: `"Inter", system-ui, sans-serif`,

    fontSize: 12,

    color: MUTED,

    letterSpacing: -0.2,

    whiteSpace: "nowrap",

  },

  sloganOrange: {

    color: ORANGE,

  },

  proPill: {

    justifySelf: "end",

    height: 32,

    padding: "0 10px",

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.06)",

    background: "rgba(255,255,255,.78)",

    backdropFilter: "blur(18px)",

    WebkitBackdropFilter: "blur(18px)",

    display: "inline-flex",

    alignItems: "center",

    gap: 7,

    fontSize: 12,

    fontWeight: 950,

    color: "#475569",

    boxShadow: "0 10px 24px rgba(15,23,42,.06)",

  },

  proPillNutri: {

    background: "#0B0B0C",

    color: "#fff",

    border: "1px solid rgba(255,106,0,.28)",

    boxShadow: "0 14px 34px rgba(15,23,42,.16)",

  },

  proDot: {

    width: 9,

    height: 9,

    borderRadius: 999,

    background: ORANGE,

    boxShadow: "0 0 0 5px rgba(255,106,0,.11)",

  },

  proDotNutri: {

    width: 9,

    height: 9,

    borderRadius: 999,

    background: ORANGE,

    boxShadow: "0 0 0 5px rgba(255,106,0,.18)",

  },

  hero: {

    position: "relative",

    zIndex: 2,

    minHeight: 162,

    borderRadius: 24,

    padding: 18,

    background: "linear-gradient(135deg, rgba(255,106,0,.13), rgba(255,255,255,.92) 58%)",

    border: "1px solid rgba(255,106,0,.16)",

    boxShadow: "0 18px 50px rgba(15,23,42,.08)",

    display: "grid",

    gridTemplateColumns: "1fr 104px",

    gap: 8,

    alignItems: "center",

    marginBottom: 14,

    boxSizing: "border-box",

  },

  heroText: {

    minWidth: 0,

  },

  heroTitle: {

    margin: 0,

    fontSize: 24,

    fontWeight: 950,

    letterSpacing: -0.8,

    color: TEXT,

    lineHeight: 1.08,

  },

  heroParagraph: {

    margin: "11px 0 0",

    fontSize: 14,

    lineHeight: 1.42,

    fontWeight: 750,

    color: MUTED,

  },

  recommendBtn: {

    marginTop: 14,

    height: 39,

    padding: "0 14px",

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.06)",

    background: "rgba(255,255,255,.86)",

    color: ORANGE,

    fontSize: 12,

    fontWeight: 950,

    boxShadow: "0 12px 28px rgba(15,23,42,.07)",

    display: "inline-flex",

    alignItems: "center",

    gap: 10,

  },

  ringWrap: {

    border: "none",

    background: "transparent",

    padding: 0,

    display: "grid",

    justifyItems: "center",

    gap: 8,

  },

  ring: {

    width: 96,

    height: 96,

    borderRadius: 999,

    padding: 10,

    boxShadow: "0 14px 34px rgba(255,106,0,.18)",

    boxSizing: "border-box",

  },

  ringInner: {

    width: "100%",

    height: "100%",

    borderRadius: 999,

    background: "rgba(255,255,255,.92)",

    display: "grid",

    placeItems: "center",

    alignContent: "center",

  },

  ringNumber: {

    fontSize: 34,

    fontWeight: 950,

    lineHeight: 0.9,

    color: TEXT,

  },

  ringMin: {

    fontSize: 15,

    fontWeight: 850,

    color: MUTED,

  },

  ringLabel: {

    fontSize: 11,

    fontWeight: 850,

    color: MUTED,

  },

  statsGrid: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: 8,

    marginBottom: 14,

  },

  statCard: {

    position: "relative",

    minHeight: 132,

    borderRadius: 20,

    border: `1px solid ${BORDER}`,

    background: "rgba(255,255,255,.88)",

    boxShadow: "0 14px 34px rgba(15,23,42,.07)",

    padding: "18px 11px 11px",

    textAlign: "center",

    overflow: "hidden",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

  },

  lockMini: {

    position: "absolute",

    top: 10,

    right: 10,

    width: 26,

    height: 26,

    borderRadius: 999,

    background: "rgba(255,255,255,.86)",

    border: "1px solid rgba(15,23,42,.08)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    zIndex: 2,

  },

  statIcon: {

    width: 42,

    height: 42,

    minWidth: 42,

    minHeight: 42,

    borderRadius: 999,

    background: "rgba(255,106,0,.10)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    margin: "0 auto 16px",

    boxSizing: "border-box",

  },

  statValue: {

    width: "100%",

    fontSize: 22,

    fontWeight: 950,

    color: TEXT,

    letterSpacing: -0.7,

    lineHeight: 1,

    textAlign: "center",

  },

  statSub: {

    width: "100%",

    marginTop: 5,

    fontSize: 11,

    fontWeight: 800,

    color: MUTED,

    lineHeight: 1.2,

    textAlign: "center",

  },

  statVisual: {

    width: "100%",

    marginTop: "auto",

    minHeight: 31,

    display: "flex",

    alignItems: "end",

    justifyContent: "center",

  },

  dotsLine: {

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 12,

    width: "100%",

  },

  dotLineItem: {

    width: 8,

    height: 8,

    borderRadius: 999,

    background: ORANGE,

  },

  bars: {

    display: "flex",

    alignItems: "end",

    justifyContent: "center",

    gap: 6,

    height: 31,

    width: "100%",

  },

  barItem: {

    width: 13,

    borderRadius: 4,

    background: "linear-gradient(180deg, #FF6A00, #FF8A3D)",

  },

  waterMiniTrack: {

    height: 6,

    width: "100%",

    borderRadius: 999,

    background: "rgba(29,155,240,.13)",

    overflow: "hidden",

  },

  waterMiniFill: {

    height: "100%",

    borderRadius: 999,

    background: BLUE,

  },

  expandCard: {

    position: "relative",

    zIndex: 2,

    borderRadius: 22,

    padding: 16,

    background: "rgba(255,255,255,.92)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 34px rgba(15,23,42,.06)",

    marginBottom: 14,

  },

  expandTitle: {

    fontSize: 15,

    fontWeight: 950,

    color: TEXT,

  },

  expandText: {

    marginTop: 6,

    fontSize: 13,

    fontWeight: 750,

    color: MUTED,

    lineHeight: 1.35,

  },

  expandBtn: {

    marginTop: 12,

    height: 38,

    padding: "0 14px",

    borderRadius: 999,

    border: "none",

    background: ORANGE,

    color: "#fff",

    fontWeight: 950,

  },

  waterActions: {

    marginTop: 12,

    display: "grid",

    gridTemplateColumns: "1fr 1fr",

    gap: 10,

  },

  waterBtn: {

    height: 40,

    borderRadius: 14,

    border: "1px solid rgba(255,106,0,.18)",

    background: "rgba(255,106,0,.10)",

    color: ORANGE,

    fontWeight: 950,

  },

  planCard: {

    position: "relative",

    zIndex: 2,

    borderRadius: 23,

    padding: 17,

    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.92))",

    border: "1px solid rgba(255,106,0,.14)",

    boxShadow: "0 18px 46px rgba(15,23,42,.07)",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 14,

    boxSizing: "border-box",

  },

  planCardNutri: {

    background:

      "radial-gradient(520px 180px at 90% 10%, rgba(255,106,0,.28), transparent 55%), linear-gradient(135deg, #0B0B0C, #151515)",

    border: "1px solid rgba(255,106,0,.22)",

    boxShadow: "0 22px 60px rgba(15,23,42,.18)",

    color: "#fff",

  },

  planLabel: {

    fontSize: 12,

    fontWeight: 850,

    color: "inherit",

    opacity: 0.82,

    marginBottom: 5,

  },

  planName: {

    fontSize: 15,

    fontWeight: 950,

    color: "inherit",

    letterSpacing: -0.3,

    whiteSpace: "normal",

  },

  planSub: {

    marginTop: 6,

    fontSize: 12,

    fontWeight: 800,

    color: "inherit",

    opacity: 0.78,

    lineHeight: 1.3,

  },

  manageBtn: {

    height: 42,

    padding: "0 15px",

    borderRadius: 16,

    border: "none",

    color: "#fff",

    background: "linear-gradient(135deg, #FF6A00, #FF7A22)",

    boxShadow: "0 14px 32px rgba(255,106,0,.25)",

    fontSize: 13,

    fontWeight: 950,

    whiteSpace: "nowrap",

    flexShrink: 0,

  },

  actions: {

    position: "relative",

    zIndex: 2,

    borderRadius: 22,

    background: "rgba(255,255,255,.88)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 34px rgba(15,23,42,.06)",

    display: "grid",

    gridTemplateColumns: "repeat(2, 1fr)",

    overflow: "hidden",

    marginBottom: 14,

  },

  actionBtn: {

    minHeight: 72,

    border: "none",

    background: "transparent",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    color: MUTED,

    fontSize: 12,

    fontWeight: 900,

    borderRight: "1px solid rgba(15,23,42,.06)",

    padding: "8px 3px",

    boxSizing: "border-box",

    textAlign: "center",

  },

  actionIconWrap: {

    width: 28,

    height: 28,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

  },

  bottomGrid: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "1fr",

    gap: 12,

    marginBottom: 14,

  },

  goalsCard: {

    borderRadius: 23,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 34px rgba(15,23,42,.06)",

    padding: 16,

    boxSizing: "border-box",

  },

  cardTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 14,

  },

  cardTitle: {

    margin: 0,

    fontSize: 14,

    fontWeight: 950,

    color: TEXT,

  },

  cardLink: {

    border: "none",

    background: "transparent",

    color: MUTED,

    fontSize: 12,

    fontWeight: 850,

    padding: 0,

    whiteSpace: "nowrap",

  },

  goalsList: {

    display: "grid",

    gap: 13,

  },

  goalRow: {

    width: "100%",

    border: "none",

    background: "transparent",

    display: "flex",

    alignItems: "center",

    gap: 11,

    padding: 0,

    textAlign: "left",

  },

  goalIcon: {

    width: 36,

    height: 36,

    minWidth: 36,

    minHeight: 36,

    borderRadius: 13,

    border: "1px solid rgba(15,23,42,.08)",

    background: "#fff",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

    boxSizing: "border-box",

  },

  goalTitle: {

    fontSize: 13,

    fontWeight: 950,

    color: TEXT,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",

  },

  goalSub: {

    marginTop: 3,

    fontSize: 11,

    fontWeight: 750,

    color: MUTED,

  },

  goalTrack: {

    marginTop: 8,

    height: 5,

    borderRadius: 999,

    background: "rgba(15,23,42,.09)",

    overflow: "hidden",

  },

  goalFill: {

    height: "100%",

    borderRadius: 999,

    background: ORANGE,

  },

  goalPct: {

    minWidth: 32,

    textAlign: "right",

    fontSize: 11,

    fontWeight: 850,

    color: MUTED,

  },

  momentumCard: {

    borderRadius: 23,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 34px rgba(15,23,42,.06)",

    padding: 16,

    textAlign: "left",

    boxSizing: "border-box",

  },

  momentumTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

  },

  momentumLabel: {

    marginTop: 16,

    fontSize: 27,

    fontWeight: 950,

    color: ORANGE,

    letterSpacing: -0.5,

  },

  momentumText: {

    margin: "6px 0 13px",

    fontSize: 12,

    lineHeight: 1.35,

    fontWeight: 750,

    color: MUTED,

  },

  momentumDetails: {

    marginTop: 12,

    paddingTop: 12,

    borderTop: "1px solid rgba(15,23,42,.08)",

  },

  detailTitle: {

    fontSize: 13,

    fontWeight: 950,

    color: TEXT,

  },

  detailText: {

    marginTop: 5,

    fontSize: 12,

    fontWeight: 750,

    color: MUTED,

    lineHeight: 1.35,

  },

  progressCard: {

    position: "relative",

    zIndex: 2,

    borderRadius: 23,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 34px rgba(15,23,42,.06)",

    padding: 16,

    marginBottom: 20,

    boxSizing: "border-box",

  },

  progressTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 12,

  },

  progressDiagnosis: {

    padding: 14,

    borderRadius: 18,

    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(255,255,255,.82))",

    border: "1px solid rgba(255,106,0,.14)",

    marginBottom: 14,

  },

  diagnosisBadge: {

    display: "inline-flex",

    padding: "7px 10px",

    borderRadius: 999,

    background: "rgba(255,106,0,.12)",

    color: ORANGE,

    fontSize: 12,

    fontWeight: 950,

  },

  diagnosisText: {

    marginTop: 8,

    fontSize: 13,

    fontWeight: 800,

    lineHeight: 1.35,

    color: MUTED,

  },

  progressStats: {

    display: "grid",

    gridTemplateColumns: "1fr 1fr 1fr",

    alignItems: "center",

    gap: 10,

  },

  progressStatBox: {

    borderRight: "1px solid rgba(15,23,42,.08)",

    minHeight: 42,

  },

  progressStrong: {

    display: "block",

    fontSize: 22,

    fontWeight: 950,

    color: TEXT,

    letterSpacing: -0.7,

  },

  progressSpan: {

    display: "block",

    marginTop: 2,

    fontSize: 9.5,

    fontWeight: 800,

    color: MUTED,

    lineHeight: 1.15,

  },

  progressMiniChart: {

    gridColumn: "1 / -1",

    marginTop: 6,

    minWidth: 0,

  },

};
