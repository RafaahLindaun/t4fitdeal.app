import React, { useMemo, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { supabase } from "../lib/supabase";

import LogoMark from "../assets/IMG_5692.png";

const ORANGE = "#FF6A00";

const ORANGE_2 = "#FF8A3D";

const TEXT = "#0f172a";

const MUTED = "#64748b";

const SOFT = "#f8fafc";

const BORDER = "rgba(15,23,42,.07)";

const BLUE = "#1D9BF0";

const GREEN = "#22c55e";

function todayKey() {

  return new Date().toISOString().slice(0, 10);

}

function clamp(n, a, b) {

  return Math.max(a, Math.min(b, n));

}

function haptic() {

  try {

    if (navigator.vibrate) navigator.vibrate(8);

  } catch {}

}

function estimateWorkoutKcal(weightKg) {

  const kg = Number(weightKg || 0);

  if (!kg) return 320;

  return Math.round(((6 * 3.5 * kg) / 200) * 45);

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

function startOfWeek(date = new Date()) {

  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  const day = d.getDay();

  d.setDate(d.getDate() - day);

  return d;

}

function buildWeekDays(workoutDates = []) {

  const workoutSet = new Set(workoutDates || []);

  const start = startOfWeek(new Date());

  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return Array.from({ length: 7 }).map((_, i) => {

    const d = new Date(start);

    d.setDate(start.getDate() + i);

    const key = d.toISOString().slice(0, 10);

    return {

      key,

      label: labels[i],

      dayNum: d.getDate(),

      done: workoutSet.has(key),

      isToday: key === todayKey(),

    };

  });

}

function labelFromGoal(g) {

  if (!g) return "";

  if (g.type === "freq") return `${g.value} dias de frequência`;

  if (g.type === "pr") return `${g.value} kg no ${g.exercise || "exercício"}`;

  if (g.type === "peso") return `${g.value} kg de peso-alvo`;

  if (g.type === "cardio") return `${g.value} sessões de cardio/sem`;

  return g.title || "Meta";

}

function progressFromGoal(g, weekly, streak) {

  if (!g) return 0;

  const target = Number(g.value || 0);

  if (g.type === "freq") return clamp(streak / Math.max(target, 1), 0, 1);

  if (g.type === "cardio") return clamp(weekly / Math.max(target, 1), 0, 1);

  return Number(g.progress || g.percent || 0) > 1

    ? clamp(Number(g.progress || g.percent || 0) / 100, 0, 1)

    : clamp(Number(g.progress || g.percent || 0) || 0.58, 0, 1);

}

function momentumLabel(weekly, weekGoal, streak) {

  const score = weekly / Math.max(weekGoal, 1) + streak / 7;

  if (score >= 1.25) return "ALTO";

  if (score >= 0.72) return "BOM";

  return "BAIXO";

}

function momentumText(label) {

  if (label === "ALTO") return "Você está em uma sequência forte.";

  if (label === "BOM") return "Seu ritmo está consistente esta semana.";

  return "Volte hoje para recuperar o ritmo.";

}

function TypeLogo({ text = "fitdeal." }) {

  const [count, setCount] = useState(0);

  const [done, setDone] = useState(false);

  useEffect(() => {

    if (done) return;

    const t = setTimeout(() => {

      const next = count + 1;

      setCount(next);

      if (next >= text.length) setDone(true);

    }, count === 0 ? 250 : 115);

    return () => clearTimeout(t);

  }, [count, done, text]);

  return (

    <div style={styles.wordmark}>

      <span>{text.slice(0, count)}</span>

      <span style={styles.cursor} />

    </div>

  );

}

function Icon({ name, size = 24, color = ORANGE, stroke = 2.2 }) {

  const common = {

    width: size,

    height: size,

    viewBox: "0 0 24 24",

    fill: "none",

    stroke: color,

    strokeWidth: stroke,

    strokeLinecap: "round",

    strokeLinejoin: "round",

  };

  if (name === "home")

    return (

      <svg {...common}>

        <path d="M3 10.8 12 3l9 7.8" />

        <path d="M5 10v10h14V10" />

        <path d="M9 20v-6h6v6" />

      </svg>

    );

  if (name === "food")

    return (

      <svg {...common}>

        <path d="M7 3v18" />

        <path d="M4 3v5a3 3 0 0 0 6 0V3" />

        <path d="M17 3v18" />

        <path d="M17 3c2.2 1.8 3.3 4 3.3 6.6 0 2.4-1.2 4.2-3.3 5" />

      </svg>

    );

  if (name === "dumbbell")

    return (

      <svg {...common}>

        <path d="m6.5 6.5 11 11" />

        <path d="m21 14-2 2" />

        <path d="m16 19 2-2" />

        <path d="m8 3-2 2" />

        <path d="m5 8 2-2" />

        <path d="m3 10 3-3" />

        <path d="m14 21 3-3" />

      </svg>

    );

  if (name === "card")

    return (

      <svg {...common}>

        <rect x="3" y="5" width="18" height="14" rx="3" />

        <path d="M3 10h18" />

        <path d="M7 15h4" />

      </svg>

    );

  if (name === "user")

    return (

      <svg {...common}>

        <circle cx="12" cy="8" r="4" />

        <path d="M4 21a8 8 0 0 1 16 0" />

      </svg>

    );

  if (name === "fire")

    return (

      <svg {...common} fill="none">

        <path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.5-6.2-4.7-8.5-.5 2.8-1.8 4.3-3.5 5.5.2-3.5-1.4-6.3-4-8.2.2 3.8-2 5.8-3.2 8.1C2.4 14.6 3 22 12 22Z" />

      </svg>

    );

  if (name === "calendar")

    return (

      <svg {...common}>

        <rect x="3" y="5" width="18" height="16" rx="3" />

        <path d="M16 3v4" />

        <path d="M8 3v4" />

        <path d="M3 10h18" />

        <path d="M8 14h.01" />

        <path d="M12 14h.01" />

        <path d="M16 14h.01" />

        <path d="M8 18h.01" />

        <path d="M12 18h.01" />

      </svg>

    );

  if (name === "drop")

    return (

      <svg {...common} stroke={BLUE}>

        <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />

      </svg>

    );

  if (name === "bolt")

    return (

      <svg {...common}>

        <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />

      </svg>

    );

  if (name === "exercise")

    return (

      <svg {...common}>

        <path d="M6 20v-5" />

        <path d="M18 20v-5" />

        <path d="M8 12 6 8l3-3 3 4 3-4 3 3-2 4" />

        <path d="M12 9v8" />

        <circle cx="12" cy="4" r="2" />

      </svg>

    );

  if (name === "stretch")

    return (

      <svg {...common}>

        <circle cx="15" cy="5" r="2" />

        <path d="M14 8c-2 1-3 3-3 6" />

        <path d="M11 14 7 20" />

        <path d="M11 14h7" />

        <path d="M13 10 6 9" />

      </svg>

    );

  if (name === "clipboard")

    return (

      <svg {...common}>

        <path d="M9 4h6" />

        <path d="M9 4a3 3 0 0 0 6 0" />

        <rect x="5" y="3" width="14" height="18" rx="3" />

        <path d="M8 11h8" />

        <path d="M8 15h8" />

      </svg>

    );

  if (name === "lock")

    return (

      <svg {...common} stroke="#0f172a">

        <rect x="5" y="11" width="14" height="10" rx="3" />

        <path d="M8 11V8a4 4 0 0 1 8 0v3" />

      </svg>

    );

  if (name === "info")

    return (

      <svg {...common} stroke={MUTED}>

        <circle cx="12" cy="12" r="9" />

        <path d="M12 11v5" />

        <path d="M12 8h.01" />

      </svg>

    );

  if (name === "target")

    return (

      <svg {...common} stroke={MUTED}>

        <circle cx="12" cy="12" r="8" />

        <circle cx="12" cy="12" r="3" />

        <path d="M12 2v3" />

        <path d="M12 19v3" />

        <path d="M2 12h3" />

        <path d="M19 12h3" />

      </svg>

    );

  return null;

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

          <Icon name="lock" size={15} />

        </div>

      ) : null}

      <div style={styles.statIcon}>

        <Icon name={icon} size={24} />

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

        if (onClick) onClick();

      }}

    >

      <Icon name={icon} size={27} />

      <span>{label}</span>

    </button>

  );

}

function NavItem({ icon, label, active, onClick, center }) {

  return (

    <button

      type="button"

      onClick={() => {

        haptic();

        if (onClick) onClick();

      }}

      style={{

        ...styles.navItem,

        ...(active ? styles.navActive : null),

        ...(center ? styles.navCenter : null),

      }}

    >

      <div style={center ? styles.navCenterIcon : styles.navIcon}>

        <Icon name={icon} size={center ? 30 : 25} color={active || center ? "#fff" : MUTED} />

      </div>

      <span style={{ color: active ? "#fff" : MUTED }}>{label}</span>

    </button>

  );

}

function GoalRow({ goal, progress, onClick }) {

  const pct = clamp(Math.round((Number(progress) || 0) * 100), 0, 100);

  return (

    <button

      type="button"

      style={styles.goalRow}

      onClick={() => {

        haptic();

        if (onClick) onClick();

      }}

    >

      <div style={styles.goalIcon}>

        <Icon name={goal?.type === "freq" ? "calendar" : "target"} size={19} color={MUTED} />

      </div>

      <div style={{ flex: 1, minWidth: 0 }}>

        <div style={styles.goalTitle}>{labelFromGoal(goal)}</div>

        <div style={styles.goalSub}>

          {goal?.type === "freq" ? "Meta anual" : "+12 kg nas últimas 6 semanas"}

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

    const { data: subRows, error: subError } = await supabase

      .from("subscriptions")

      .select("status")

      .eq("user_id", userId)

      .in("status", ["active", "trialing"])

      .limit(1);

    if (!subError && Array.isArray(subRows) && subRows.length > 0) return true;

    const { data: profile, error: profileError } = await supabase

      .from("profiles")

      .select("is_paid, plan, role")

      .eq("id", userId)

      .maybeSingle();

    if (!profileError) {

      if (profile?.is_paid === true) return true;

      if (String(profile?.plan || "").toLowerCase() === "premium") return true;

      if (String(profile?.role || "").toLowerCase() === "premium") return true;

      if (String(profile?.plan || "").toLowerCase() === "basic") return true;

      if (String(profile?.plan || "").toLowerCase() === "basico") return true;

    }

    return false;

  } catch (err) {

    console.error("loadPaidStatus:", err);

    return false;

  }

}

async function loadNutriStatus(userId) {

  if (!userId) return false;

  try {

    const { data: profile, error } = await supabase

      .from("profiles")

      .select("nutri_plus, plan, role")

      .eq("id", userId)

      .maybeSingle();

    if (error) return false;

    if (profile?.nutri_plus === true) return true;

    if (String(profile?.plan || "").toLowerCase() === "nutri+") return true;

    if (String(profile?.plan || "").toLowerCase() === "nutri_plus") return true;

    if (String(profile?.role || "").toLowerCase() === "nutri+") return true;

    if (String(profile?.role || "").toLowerCase() === "nutri_plus") return true;

    return false;

  } catch (err) {

    console.error("loadNutriStatus:", err);

    return false;

  }

}

async function loadCompletedWorkoutDates(userId) {

  if (!userId) return [];

  try {

    const { data, error } = await supabase

      .from("workout_sessions")

      .select("session_date")

      .eq("user_id", userId)

      .eq("completed", true)

      .order("session_date", { ascending: false });

    if (error) {

      console.error("loadCompletedWorkoutDates:", error);

      return [];

    }

    return (data || []).map((row) => row.session_date).filter(Boolean);

  } catch (err) {

    console.error("loadCompletedWorkoutDates:", err);

    return [];

  }

}

async function loadGoals(userId) {

  if (!userId) return [];

  try {

    const { data, error } = await supabase

      .from("user_goals")

      .select("*")

      .eq("user_id", userId)

      .eq("is_active", true)

      .order("created_at", { ascending: false });

    if (error) {

      console.error("loadGoals:", error);

      return [];

    }

    return data || [];

  } catch (err) {

    console.error("loadGoals:", err);

    return [];

  }

}

async function loadHydration(userId, dateKey) {

  if (!userId || !dateKey) return 0;

  try {

    const { data, error } = await supabase

      .from("daily_hydration")

      .select("water_ml")

      .eq("user_id", userId)

      .eq("date_key", dateKey)

      .maybeSingle();

    if (error) return 0;

    return Number(data?.water_ml || 0);

  } catch (err) {

    console.error("loadHydration:", err);

    return 0;

  }

}

async function saveHydration(userId, dateKey, waterMl) {

  if (!userId || !dateKey) return;

  try {

    const { error } = await supabase.from("daily_hydration").upsert(

      {

        user_id: userId,

        date_key: dateKey,

        water_ml: Math.max(0, Number(waterMl) || 0),

        updated_at: new Date().toISOString(),

      },

      { onConflict: "user_id,date_key" }

    );

    if (error) console.error("saveHydration:", error);

  } catch (err) {

    console.error("saveHydration:", err);

  }

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

  const name = user?.nome ? user.nome.split(" ")[0] : "Rafael";

  const peso = Number(user?.peso || 0) || 80;

  const weekGoal = Number(user?.frequencia || 4) || 4;

  const weekly = useMemo(() => calcWeeklyCount(workouts), [workouts]);

  const streak = useMemo(() => calcStreak(workouts), [workouts]);

  const kcalPerWorkout = useMemo(() => estimateWorkoutKcal(user?.peso), [user?.peso]);

  const kcalThisWeek = useMemo(() => weekly * kcalPerWorkout, [weekly, kcalPerWorkout]);

  const goalMl = useMemo(() => clamp(Math.round(peso * 35), 1800, 5000), [peso]);

  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;

  const recovery = useMemo(() => {

    const base = 82 - Math.max(0, streak - 3) * 3 + Math.min(weekly, weekGoal) * 2;

    return clamp(base, 48, 96);

  }, [weekly, streak, weekGoal]);

  const momentum = useMemo(

    () => momentumLabel(weekly, weekGoal, streak),

    [weekly, weekGoal, streak]

  );

  const adherence = useMemo(

    () => clamp(Math.round((weekly / Math.max(weekGoal, 1)) * 100), 0, 100),

    [weekly, weekGoal]

  );

  const loadEvolution = useMemo(() => clamp(weekly * 2 + streak, 0, 18), [weekly, streak]);

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

      const [paidStatus, nutriStatus, workoutDates, activeGoals, hydration] = await Promise.all([

        loadPaidStatus(user.id),

        loadNutriStatus(user.id),

        loadCompletedWorkoutDates(user.id),

        loadGoals(user.id),

        loadHydration(user.id, today),

      ]);

      if (!active) return;

      setPaid(paidStatus);

      setHasNutriPlus(nutriStatus);

      setWorkouts(workoutDates);

      setGoals(activeGoals);

      setWaterMl(hydration);

    }

    bootstrap();

    return () => {

      active = false;

    };

  }, [user?.id, today]);

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

          const next = await loadCompletedWorkoutDates(user.id);

          setWorkouts(next);

        }

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "user_goals",

          filter: `user_id=eq.${user.id}`,

        },

        async () => {

          const next = await loadGoals(user.id);

          setGoals(next);

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

          const next = await loadHydration(user.id, today);

          setWaterMl(next);

        }

      )

      .subscribe();

    return () => {

      supabase.removeChannel(channel);

    };

  }, [user?.id, today]);

  async function addWaterQuick() {

    if (!user?.id || !hasNutriPlus) {

      nav("/planos");

      return;

    }

    const next = clamp(waterMl + 300, 0, goalMl * 2);

    setWaterMl(next);

    await saveHydration(user.id, today, next);

  }

  return (

    <div style={styles.page}>

      <style>{`

        @keyframes cursorBlink {

          0%, 45% { opacity: 1; }

          46%, 100% { opacity: .15; }

        }

        @keyframes enterUp {

          from { opacity: 0; transform: translateY(14px) scale(.985); }

          to { opacity: 1; transform: translateY(0) scale(1); }

        }

        @keyframes pulseLive {

          0%,100% { transform: scale(1); opacity: 1; }

          50% { transform: scale(1.18); opacity: .72; }

        }

        button {

          font-family: inherit;

          -webkit-tap-highlight-color: transparent;

          cursor: pointer;

        }

        button:active {

          transform: scale(.985);

        }

        .dash-card {

          animation: enterUp .48s cubic-bezier(.2,.8,.2,1) both;

        }

        @media (max-width: 430px) {

          .statsGrid {

            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;

            gap: 10px !important;

          }

          .bottomGrid {

            grid-template-columns: 1fr 1fr !important;

          }

        }

        @media (max-width: 380px) {

          .statsGrid {

            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

          }

          .bottomGrid {

            grid-template-columns: 1fr !important;

          }

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

        <button type="button" style={styles.proPill} onClick={() => nav("/planos")}>

          <span style={styles.proDot} />

          {paid ? "Pro" : "Free"}

        </button>

      </header>

      <button

        type="button"

        style={styles.liveBar}

        onClick={() => {

          haptic();

          nav("/treino");

        }}

      >

        <div style={styles.liveLeft}>

          <span style={styles.liveDot} />

          <b>Ao vivo</b>

        </div>

        <div style={styles.liveDivider} />

        <div style={styles.liveWave}>

          <span style={{ ...styles.liveWaveBar, height: 9 }} />

          <span style={{ ...styles.liveWaveBar, height: 18 }} />

          <span style={{ ...styles.liveWaveBar, height: 13 }} />

          <span style={{ ...styles.liveWaveBar, height: 22 }} />

        </div>

        <div style={styles.liveText}>

          {weekly}/{weekGoal} treinos nesta semana

        </div>

        <div style={styles.liveDivider} />

        <div style={styles.liveAction}>Manter ritmo</div>

        <div style={styles.chev}>›</div>

      </button>

      <section className="dash-card" style={styles.hero}>

        <div style={styles.heroText}>

          <h1 style={styles.heroTitle}>

            {getGreeting()}, {name}

          </h1>

          <p style={styles.heroParagraph}>

            Seu corpo está {recovery}% recuperado.

            <br />

            Ótimo momento para treinar.

          </p>

          <button

            type="button"

            style={styles.recommendBtn}

            onClick={() => {

              haptic();

              nav("/treino");

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

            nav("/treino");

          }}

        >

          <div

            style={{

              ...styles.ring,

              background: `conic-gradient(${ORANGE} 0 ${Math.min(

                100,

                (25 / 30) * 100

              )}%, rgba(255,106,0,.16) 0 100%)`,

            }}

          >

            <div style={styles.ringInner}>

              <strong style={styles.ringNumber}>25</strong>

              <span style={styles.ringMin}>min</span>

            </div>

          </div>

          <div style={styles.ringLabel}>Meta diária</div>

        </button>

      </section>

      <section className="statsGrid" style={styles.statsGrid}>

        <StatCard

          icon="fire"

          value={kcalThisWeek || 766}

          sub="Queimadas"

          onClick={() => nav("/treino")}

        >

          <TinyLine />

        </StatCard>

        <StatCard icon="calendar" value={streak} sub="Consistência" onClick={() => nav("/treino")}>

          <div style={styles.dotsLine}>

            <span style={{ ...styles.dotLineItem, opacity: 1 }} />

            <span style={{ ...styles.dotLineItem, opacity: streak >= 2 ? 1 : 0.35 }} />

            <span style={{ ...styles.dotLineItem, opacity: streak >= 4 ? 1 : 0.35 }} />

          </div>

        </StatCard>

        <StatCard

          icon="dumbbell"

          value={`${weekly}/${weekGoal}`}

          sub="Esta semana"

          onClick={() => nav("/treino")}

        >

          <div style={styles.bars}>

            {[0.28, 0.45, 0.68, 0.92].map((h, i) => (

              <span

                key={i}

                style={{

                  ...styles.barItem,

                  height: `${h * 34}px`,

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

          onClick={addWaterQuick}

        >

          <div style={styles.waterMiniTrack}>

            <div style={{ ...styles.waterMiniFill, width: `${Math.round(waterPct * 100)}%` }} />

          </div>

        </StatCard>

      </section>

      <section className="dash-card" style={styles.planCard}>

        <div style={{ minWidth: 0 }}>

          <div style={styles.planLabel}>Plano ativo</div>

          <div style={styles.planName}>

            {paid ? "Básico ativo • R$ 12,99/mês" : "Plano gratuito"}

          </div>

          <div style={styles.planSub}>

            {paid ? "Treinos liberados. Nutri+ é upgrade." : "Assine para liberar treino completo."}

          </div>

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

      <section className="dash-card" style={styles.actions}>

        <ActionButton icon="bolt" label="Treino rápido" onClick={() => nav("/treino")} />

        <ActionButton icon="exercise" label="Exercícios" onClick={() => nav("/montagem-treino")} />

        <ActionButton icon="stretch" label="Alongamento" onClick={() => nav("/treino")} />

        <ActionButton icon="clipboard" label="Avaliação" onClick={() => nav("/conta")} />

      </section>

      <section className="bottomGrid" style={styles.bottomGrid}>

        <div className="dash-card" style={styles.goalsCard}>

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

          className="dash-card"

          style={styles.momentumCard}

          onClick={() => {

            haptic();

            nav("/treino");

          }}

        >

          <div style={styles.momentumTop}>

            <h2 style={styles.cardTitle}>Momentum</h2>

            <Icon name="info" size={20} />

          </div>

          <div style={styles.momentumLabel}>{momentum}</div>

          <p style={styles.momentumText}>{momentumText(momentum)}</p>

          <TinyLine />

        </button>

      </section>

      <section className="dash-card" style={styles.progressCard}>

        <div style={styles.progressTop}>

          <h2 style={styles.cardTitle}>Registro de progresso</h2>

          <button type="button" style={styles.cardLink} onClick={() => nav("/treino")}>

            Ver histórico

          </button>

        </div>

        <div style={styles.progressStats}>

          <div style={styles.progressStatBox}>

            <strong style={styles.progressStrong}>{weekly}</strong>

            <span style={styles.progressSpan}>treinos esta semana</span>

          </div>

          <div style={styles.progressStatBox}>

            <strong style={styles.progressStrong}>{adherence}%</strong>

            <span style={styles.progressSpan}>adesão semanal</span>

          </div>

          <div style={styles.progressStatBox}>

            <strong style={{ ...styles.progressStrong, color: GREEN }}>+{loadEvolution}%</strong>

            <span style={styles.progressSpan}>evolução nas cargas</span>

          </div>

          <div style={styles.progressMiniChart}>

            <TinyLine />

          </div>

        </div>

      </section>

      <nav style={styles.bottomNav}>

        <NavItem icon="home" label="Início" active onClick={() => nav("/")} />

        <NavItem icon="food" label="Nutrição" onClick={() => nav("/nutricao")} />

        <NavItem icon="dumbbell" label="Treino" center onClick={() => nav("/treino")} />

        <NavItem icon="card" label="Planos" onClick={() => nav("/planos")} />

        <NavItem icon="user" label="Conta" onClick={() => nav("/conta")} />

      </nav>

    </div>

  );

}

const styles = {

  page: {

    minHeight: "100dvh",

    padding: "30px 16px 126px",

    background:

      "radial-gradient(760px 380px at 18% -8%, rgba(255,106,0,.12), rgba(255,255,255,0) 62%), linear-gradient(180deg, #fbfcff 0%, #f7f9fc 100%)",

    position: "relative",

    overflow: "hidden",

    color: TEXT,

  },

  bgOne: {

    position: "absolute",

    width: 340,

    height: 340,

    borderRadius: 999,

    background: "rgba(255,106,0,.08)",

    filter: "blur(70px)",

    top: -120,

    left: -120,

    pointerEvents: "none",

  },

  bgTwo: {

    position: "absolute",

    width: 260,

    height: 260,

    borderRadius: 999,

    background: "rgba(15,23,42,.045)",

    filter: "blur(70px)",

    top: 140,

    right: -110,

    pointerEvents: "none",

  },

  header: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "56px 1fr 74px",

    alignItems: "start",

    gap: 10,

    marginBottom: 20,

  },

  logoBox: {

    width: 48,

    height: 48,

    borderRadius: 18,

    objectFit: "contain",

    background: "rgba(255,106,0,.08)",

    border: "1px solid rgba(255,106,0,.12)",

    padding: 9,

    boxShadow: "0 16px 35px rgba(15,23,42,.06)",

  },

  logoCenter: {

    textAlign: "center",

    minWidth: 0,

  },

  wordmark: {

    minHeight: 48,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    fontFamily: `"Courier New", monospace`,

    fontSize: 38,

    fontWeight: 500,

    letterSpacing: 7,

    color: "#020617",

    whiteSpace: "nowrap",

    lineHeight: 1,

  },

  cursor: {

    width: 3,

    height: 42,

    marginLeft: 3,

    background: ORANGE,

    display: "inline-block",

    animation: "cursorBlink .9s infinite",

  },

  slogan: {

    marginTop: 2,

    fontFamily: `"Courier New", monospace`,

    fontSize: 14,

    color: MUTED,

    letterSpacing: -0.1,

  },

  sloganOrange: {

    color: ORANGE,

  },

  proPill: {

    justifySelf: "end",

    height: 36,

    padding: "0 13px",

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.06)",

    background: "rgba(255,255,255,.76)",

    backdropFilter: "blur(18px)",

    WebkitBackdropFilter: "blur(18px)",

    display: "inline-flex",

    alignItems: "center",

    gap: 8,

    fontSize: 14,

    fontWeight: 950,

    color: "#475569",

    boxShadow: "0 12px 28px rgba(15,23,42,.06)",

  },

  proDot: {

    width: 10,

    height: 10,

    borderRadius: 999,

    background: ORANGE,

    boxShadow: "0 0 0 6px rgba(255,106,0,.11)",

  },

  liveBar: {

    position: "relative",

    zIndex: 2,

    width: "100%",

    minHeight: 54,

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.055)",

    background: "rgba(255,255,255,.82)",

    backdropFilter: "blur(20px)",

    WebkitBackdropFilter: "blur(20px)",

    boxShadow: "0 18px 46px rgba(15,23,42,.055)",

    display: "flex",

    alignItems: "center",

    gap: 10,

    padding: "0 16px",

    marginBottom: 18,

    textAlign: "left",

  },

  liveLeft: {

    display: "inline-flex",

    alignItems: "center",

    gap: 8,

    color: GREEN,

    fontSize: 13,

    fontWeight: 950,

    whiteSpace: "nowrap",

  },

  liveDot: {

    width: 10,

    height: 10,

    borderRadius: 999,

    background: GREEN,

    animation: "pulseLive 1.4s infinite",

  },

  liveDivider: {

    width: 1,

    height: 24,

    background: "rgba(15,23,42,.08)",

  },

  liveWave: {

    display: "inline-flex",

    alignItems: "center",

    gap: 3,

    height: 22,

  },

  liveWaveBar: {

    width: 3,

    borderRadius: 999,

    background: ORANGE,

    display: "block",

  },

  liveText: {

    flex: 1,

    minWidth: 0,

    fontSize: 13,

    fontWeight: 850,

    color: MUTED,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",

  },

  liveAction: {

    fontSize: 13,

    fontWeight: 950,

    color: ORANGE,

    whiteSpace: "nowrap",

  },

  chev: {

    fontSize: 27,

    lineHeight: 1,

    color: MUTED,

    marginLeft: -4,

  },

  hero: {

    position: "relative",

    zIndex: 2,

    minHeight: 190,

    borderRadius: 28,

    padding: 22,

    background: "linear-gradient(135deg, rgba(255,106,0,.13), rgba(255,255,255,.92) 58%)",

    border: "1px solid rgba(255,106,0,.16)",

    boxShadow: "0 24px 70px rgba(15,23,42,.08)",

    display: "grid",

    gridTemplateColumns: "1fr 128px",

    gap: 10,

    alignItems: "center",

    marginBottom: 18,

  },

  heroText: {

    minWidth: 0,

  },

  heroTitle: {

    margin: 0,

    fontSize: 29,

    fontWeight: 950,

    letterSpacing: -0.9,

    color: TEXT,

    lineHeight: 1.08,

  },

  heroParagraph: {

    margin: "14px 0 0",

    fontSize: 17,

    lineHeight: 1.45,

    fontWeight: 750,

    color: MUTED,

  },

  recommendBtn: {

    marginTop: 18,

    height: 45,

    padding: "0 18px",

    borderRadius: 999,

    border: "1px solid rgba(15,23,42,.06)",

    background: "rgba(255,255,255,.86)",

    color: ORANGE,

    fontSize: 14,

    fontWeight: 950,

    boxShadow: "0 16px 36px rgba(15,23,42,.07)",

    display: "inline-flex",

    alignItems: "center",

    gap: 14,

  },

  ringWrap: {

    border: "none",

    background: "transparent",

    padding: 0,

    display: "grid",

    justifyItems: "center",

    gap: 12,

  },

  ring: {

    width: 116,

    height: 116,

    borderRadius: 999,

    padding: 12,

    boxShadow: "0 18px 44px rgba(255,106,0,.18)",

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

    fontSize: 43,

    fontWeight: 950,

    lineHeight: 0.9,

    color: TEXT,

  },

  ringMin: {

    fontSize: 18,

    fontWeight: 850,

    color: MUTED,

  },

  ringLabel: {

    fontSize: 13,

    fontWeight: 850,

    color: MUTED,

  },

  statsGrid: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: 12,

    marginBottom: 18,

  },

  statCard: {

    position: "relative",

    minHeight: 160,

    borderRadius: 24,

    border: `1px solid ${BORDER}`,

    background: "rgba(255,255,255,.88)",

    boxShadow: "0 18px 46px rgba(15,23,42,.07)",

    padding: 16,

    textAlign: "left",

    overflow: "hidden",

  },

  lockMini: {

    position: "absolute",

    top: 10,

    right: 10,

    width: 31,

    height: 31,

    borderRadius: 999,

    background: "rgba(255,255,255,.86)",

    border: "1px solid rgba(15,23,42,.08)",

    display: "grid",

    placeItems: "center",

    zIndex: 2,

  },

  statIcon: {

    width: 45,

    height: 45,

    borderRadius: 999,

    background: "rgba(255,106,0,.10)",

    display: "grid",

    placeItems: "center",

    marginBottom: 18,

  },

  statValue: {

    fontSize: 26,

    fontWeight: 950,

    color: TEXT,

    letterSpacing: -0.8,

    lineHeight: 1,

  },

  statSub: {

    marginTop: 6,

    fontSize: 13,

    fontWeight: 800,

    color: MUTED,

    lineHeight: 1.25,

  },

  statVisual: {

    marginTop: 15,

  },

  dotsLine: {

    display: "flex",

    alignItems: "center",

    gap: 16,

    marginTop: 20,

  },

  dotLineItem: {

    width: 10,

    height: 10,

    borderRadius: 999,

    background: ORANGE,

  },

  bars: {

    display: "flex",

    alignItems: "end",

    gap: 8,

    height: 36,

  },

  barItem: {

    width: 17,

    borderRadius: 5,

    background: "linear-gradient(180deg, #FF6A00, #FF8A3D)",

  },

  waterMiniTrack: {

    height: 7,

    borderRadius: 999,

    background: "rgba(29,155,240,.13)",

    overflow: "hidden",

    marginTop: 25,

  },

  waterMiniFill: {

    height: "100%",

    borderRadius: 999,

    background: BLUE,

  },

  planCard: {

    position: "relative",

    zIndex: 2,

    borderRadius: 26,

    padding: 20,

    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.92))",

    border: "1px solid rgba(255,106,0,.14)",

    boxShadow: "0 22px 60px rgba(15,23,42,.07)",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 16,

    marginBottom: 18,

  },

  planLabel: {

    fontSize: 13,

    fontWeight: 850,

    color: TEXT,

    marginBottom: 7,

  },

  planName: {

    fontSize: 18,

    fontWeight: 950,

    color: TEXT,

    letterSpacing: -0.35,

  },

  planSub: {

    marginTop: 8,

    fontSize: 13,

    fontWeight: 800,

    color: MUTED,

    lineHeight: 1.35,

  },

  manageBtn: {

    height: 48,

    padding: "0 20px",

    borderRadius: 18,

    border: "none",

    color: "#fff",

    background: "linear-gradient(135deg, #FF6A00, #FF7A22)",

    boxShadow: "0 18px 42px rgba(255,106,0,.25)",

    fontSize: 15,

    fontWeight: 950,

    whiteSpace: "nowrap",

  },

  actions: {

    position: "relative",

    zIndex: 2,

    borderRadius: 25,

    background: "rgba(255,255,255,.88)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 18px 46px rgba(15,23,42,.06)",

    display: "grid",

    gridTemplateColumns: "repeat(4, 1fr)",

    overflow: "hidden",

    marginBottom: 18,

  },

  actionBtn: {

    minHeight: 84,

    border: "none",

    background: "transparent",

    display: "grid",

    justifyItems: "center",

    alignContent: "center",

    gap: 8,

    color: MUTED,

    fontSize: 12,

    fontWeight: 850,

    borderRight: "1px solid rgba(15,23,42,.06)",

  },

  bottomGrid: {

    position: "relative",

    zIndex: 2,

    display: "grid",

    gridTemplateColumns: "1fr 1fr",

    gap: 12,

    marginBottom: 18,

  },

  goalsCard: {

    minHeight: 196,

    borderRadius: 25,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 18px 46px rgba(15,23,42,.06)",

    padding: 18,

  },

  cardTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 16,

  },

  cardTitle: {

    margin: 0,

    fontSize: 15,

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

    gap: 14,

  },

  goalRow: {

    width: "100%",

    border: "none",

    background: "transparent",

    display: "flex",

    alignItems: "center",

    gap: 12,

    padding: 0,

    textAlign: "left",

  },

  goalIcon: {

    width: 38,

    height: 38,

    borderRadius: 13,

    border: "1px solid rgba(15,23,42,.08)",

    background: "#fff",

    display: "grid",

    placeItems: "center",

    flexShrink: 0,

  },

  goalTitle: {

    fontSize: 14,

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

    marginTop: 9,

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

    minWidth: 34,

    textAlign: "right",

    fontSize: 12,

    fontWeight: 850,

    color: MUTED,

  },

  momentumCard: {

    minHeight: 196,

    borderRadius: 25,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 18px 46px rgba(15,23,42,.06)",

    padding: 18,

    textAlign: "left",

  },

  momentumTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

  },

  momentumLabel: {

    marginTop: 22,

    fontSize: 30,

    fontWeight: 950,

    color: ORANGE,

    letterSpacing: -0.5,

  },

  momentumText: {

    margin: "7px 0 17px",

    fontSize: 13,

    lineHeight: 1.35,

    fontWeight: 750,

    color: MUTED,

  },

  progressCard: {

    position: "relative",

    zIndex: 2,

    borderRadius: 25,

    background: "rgba(255,255,255,.90)",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 18px 46px rgba(15,23,42,.06)",

    padding: 18,

    marginBottom: 20,

  },

  progressTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 14,

  },

  progressStats: {

    display: "grid",

    gridTemplateColumns: "1fr 1fr 1fr 1.3fr",

    alignItems: "center",

    gap: 12,

  },

  progressStatBox: {

    borderRight: "1px solid rgba(15,23,42,.08)",

    minHeight: 43,

  },

  progressStrong: {

    display: "block",

    fontSize: 25,

    fontWeight: 950,

    color: TEXT,

    letterSpacing: -0.7,

  },

  progressSpan: {

    display: "block",

    marginTop: 2,

    fontSize: 10,

    fontWeight: 800,

    color: MUTED,

    lineHeight: 1.15,

  },

  progressMiniChart: {

    minWidth: 95,

  },

  bottomNav: {

    position: "fixed",

    left: 16,

    right: 16,

    bottom: 18,

    zIndex: 20,

    height: 83,

    borderRadius: 999,

    background: "rgba(255,255,255,.90)",

    border: "1px solid rgba(15,23,42,.06)",

    backdropFilter: "blur(24px)",

    WebkitBackdropFilter: "blur(24px)",

    boxShadow: "0 24px 70px rgba(15,23,42,.16)",

    display: "grid",

    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",

    alignItems: "center",

    padding: "8px 10px",

  },

  navItem: {

    height: 67,

    border: "none",

    background: "transparent",

    display: "grid",

    justifyItems: "center",

    alignContent: "center",

    gap: 4,

    borderRadius: 999,

    fontSize: 11,

    fontWeight: 950,

    letterSpacing: 0.5,

    textTransform: "capitalize",

  },

  navActive: {

    background: "linear-gradient(135deg, #FF6A00, #FF7A22)",

    boxShadow: "0 18px 40px rgba(255,106,0,.32)",

  },

  navCenter: {

    transform: "translateY(-22px)",

    background: "#fff",

    width: 76,

    height: 76,

    justifySelf: "center",

    boxShadow: "0 18px 46px rgba(255,106,0,.16)",

    border: "7px solid rgba(255,106,0,.08)",

  },

  navIcon: {

    display: "grid",

    placeItems: "center",

  },

  navCenterIcon: {

    width: 56,

    height: 56,

    borderRadius: 999,

    display: "grid",

    placeItems: "center",

    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",

  },

};
