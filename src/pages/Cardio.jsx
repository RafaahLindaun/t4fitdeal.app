import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/* ---------------- THEME ---------------- */
const ORANGE = "#FF6A00";
const ORANGE_2 = "#FFB26B";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";
const SUCCESS = "#22c55e";

/* ---------------- CONFIG ---------------- */
const WEEKLY_GOAL_MINUTES = 150;
const MAX_SESSIONS = 200;

/* ---------------- DATA ---------------- */
const WORKOUTS = [
  {
    id: "walk",
    name: "Caminhada",
    subtitle: "Leve, constante e fácil de manter",
    mets: { low: 3.0, moderate: 4.8, high: 5.5 },
  },
  {
    id: "treadmill",
    name: "Esteira",
    subtitle: "Ritmo controlado e confortável",
    mets: { low: 4.0, moderate: 5.2, high: 6.3 },
  },
  {
    id: "bike",
    name: "Bike",
    subtitle: "Baixo impacto e boa queima",
    mets: { low: 4.0, moderate: 6.8, high: 8.0 },
  },
  {
    id: "run",
    name: "Corrida leve",
    subtitle: "Mais gasto em menos tempo",
    mets: { low: 6.0, moderate: 8.3, high: 9.8 },
  },
  {
    id: "stairs",
    name: "Escada",
    subtitle: "Fôlego e pernas",
    mets: { low: 5.0, moderate: 8.8, high: 9.5 },
  },
  {
    id: "hiit",
    name: "HIIT",
    subtitle: "Curto, forte e direto",
    mets: { low: 6.0, moderate: 8.0, high: 10.0 },
  },
];

const INTENSITIES = {
  low: {
    label: "Leve",
    feel: "Consegue conversar normalmente",
    multiplier: 0.85,
  },
  moderate: {
    label: "Moderado",
    feel: "Respiração acelerada, mas controlada",
    multiplier: 1.0,
  },
  high: {
    label: "Intenso",
    feel: "Esforço alto em menos tempo",
    multiplier: 1.15,
  },
};

const DURATIONS = [10, 15, 20, 25, 30, 40, 45, 60];

/* ---------------- HELPERS ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getLast7Days() {
  const base = new Date();
  const res = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    res.push(d);
  }

  return res;
}

function formatMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function vibrate(ms = 18) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
}

function caloriesFromMET({ met, minutes, weightKg }) {
  return Math.round(minutes * ((met * 3.5 * weightKg) / 200));
}

function computeLiveElapsed(live) {
  if (!live) return 0;
  if (!live.running) return Number(live.elapsed_sec || 0);

  const base = Number(live.elapsed_sec || 0);
  const startedAt = Number(live.started_at_ms || 0);
  const extra = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

  return base + extra;
}

function toCardioStateRow(userId, payload) {
  return {
    user_id: userId,
    selected_workout_id: payload.selectedWorkoutId ?? "treadmill",
    selected_intensity: payload.selectedIntensity ?? "moderate",
    minutes: Number(payload.minutes || 20),
    duration_sec: Number(payload.durationSec || 0),
    mode: payload.mode || "timer",
    running: !!payload.running,
    elapsed_sec: Number(payload.elapsedSec || 0),
    started_at_ms: Number(payload.startedAt || 0),
    finished_at_ms: Number(payload.finishedAt || 0),
    dock_open: !!payload.dockOpen,
  };
}

function fromCardioStateRow(row) {
  if (!row) return null;

  return {
    selectedWorkoutId: row.selected_workout_id || "treadmill",
    selectedIntensity: row.selected_intensity || "moderate",
    minutes: Number(row.minutes || 20),
    durationSec: Number(row.duration_sec || 0),
    mode: row.mode || "timer",
    running: !!row.running,
    elapsedSec: Number(row.elapsed_sec || 0),
    startedAt: Number(row.started_at_ms || 0),
    finishedAt: Number(row.finished_at_ms || 0),
    dockOpen: !!row.dock_open,
  };
}

async function loadPaidStatus(userId) {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("plan_key, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (error) {
      console.error("loadPaidStatus error:", error);
      return false;
    }

    return ["basico", "nutri"].includes(String(data?.plan_key || "").toLowerCase());
  } catch (err) {
    console.error("loadPaidStatus catch:", err);
    return false;
  }
}

async function fetchCardioSessions(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("cardio_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_SESSIONS);

  if (error) {
    console.error("fetchCardioSessions error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    date: row.date_key,
    workoutId: row.workout_id,
    workoutName: row.workout_name,
    intensity: row.intensity,
    intensityLabel: row.intensity_label,
    minutes: Number(row.minutes || 0),
    calories: Number(row.calories || 0),
    weightKg: Number(row.weight_kg || 0),
    mode: row.mode,
  }));
}

async function insertCardioSession(userId, entry) {
  if (!userId) return { ok: false };

  const payload = {
    user_id: userId,
    date_key: entry.date,
    workout_id: entry.workoutId,
    workout_name: entry.workoutName,
    intensity: entry.intensity,
    intensity_label: entry.intensityLabel,
    minutes: Number(entry.minutes || 0),
    calories: Number(entry.calories || 0),
    weight_kg: Number(entry.weightKg || 0),
    mode: entry.mode || "timer",
  };

  const { data, error } = await supabase
    .from("cardio_sessions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("insertCardioSession error:", error);
    return { ok: false, error };
  }

  return {
    ok: true,
    row: {
      id: data.id,
      createdAt: data.created_at,
      date: data.date_key,
      workoutId: data.workout_id,
      workoutName: data.workout_name,
      intensity: data.intensity,
      intensityLabel: data.intensity_label,
      minutes: Number(data.minutes || 0),
      calories: Number(data.calories || 0),
      weightKg: Number(data.weight_kg || 0),
      mode: data.mode,
    },
  };
}

async function fetchLiveState(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("cardio_live_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("fetchLiveState error:", error);
    return null;
  }

  return fromCardioStateRow(data);
}

async function saveLiveState(userId, payload) {
  if (!userId) return;

  const row = toCardioStateRow(userId, payload);

  const { error } = await supabase
    .from("cardio_live_state")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.error("saveLiveState error:", error);
  }
}

/* ---------------- ICONS ---------------- */
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 6v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7l10 5-10 5V7Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7.2v5.2l3.2 1.7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20.2a8.2 8.2 0 1 1 8.2-8.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3c1.3 2 1.7 3.2 1.2 4.8-.3.9-1 1.7-1 2.8 0 1.2.9 2.2 2.1 2.2 1.6 0 2.9-1.6 2.9-3.8 2.2 1.8 3.8 4.6 3.8 7.5 0 4.1-3.4 7.5-8 7.5s-8-3.4-8-7.5c0-3.2 1.8-6 4.4-7.8-.1.5-.2.9-.2 1.4 0 1.5 1.1 2.7 2.5 2.7 1.6 0 2.9-1.3 2.9-3 .1-2.4-1.7-4.2-2.6-6.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- UI BITS ---------------- */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div style={S.toastWrap} role="status" aria-live="polite">
      <div style={S.toastCard}>
        <div style={{ ...S.toastDot, ...(toast.type === "success" ? S.toastDotOk : null) }} />
        <div style={{ minWidth: 0 }}>
          <div style={S.toastTitle}>{toast.title}</div>
          <div style={S.toastText}>{toast.text}</div>
        </div>
        <button type="button" style={S.toastClose} onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <div style={S.chip}>
      <div style={S.chipLabel}>{label}</div>
      <div style={S.chipValue}>{value}</div>
    </div>
  );
}

function RingProgress({ progress = 0, size = 140, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={S.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={S.ringSvg}>
        <defs>
          <linearGradient id="cardioWeekGradientGlassV13" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ORANGE} />
            <stop offset="100%" stopColor={ORANGE_2} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cardioWeekGradientGlassV13)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .25s ease" }}
        />
      </svg>

      <div style={S.ringCenter}>
        <div style={S.ringValue}>{value}</div>
        <div style={S.ringLabel}>{label}</div>
        {sublabel ? <div style={S.ringSub}>{sublabel}</div> : null}
      </div>
    </div>
  );
}

function BigRing({ progress = 0, value = "00:00", top = "timer", bottom = "", running = false }) {
  const size = 220;
  const stroke = 15;
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ ...S.bigRingWrap, ...(running ? S.bigRingRunning : null) }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={S.bigRingSvg}>
        <defs>
          <linearGradient id="cardioBigGradientGlassV13" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ORANGE} />
            <stop offset="100%" stopColor={ORANGE_2} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cardioBigGradientGlassV13)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .22s ease" }}
        />
      </svg>

      <div style={S.bigRingCenter}>
        <div style={S.bigRingTop}>{top}</div>
        <div style={S.bigRingValue}>{value}</div>
        {bottom ? <div style={S.bigRingBottom}>{bottom}</div> : null}
      </div>
    </div>
  );
}

function WeekTimeline({ sessions }) {
  const days = getLast7Days();

  return (
    <section style={S.timelineCard}>
      <div style={S.sectionHead}>
        <div>
          <h3 style={S.sectionTitle}>Seu ritmo da semana</h3>
          <p style={S.sectionSub}>Constância sem poluição visual.</p>
        </div>
      </div>

      <div style={S.timelineRow} data-cardio-timeline-row>
        {days.map((day) => {
          const key = getDateKey(day);
          const daySessions = sessions.filter((s) => s.date === key);
          const totalMin = daySessions.reduce((a, b) => a + (b.minutes || 0), 0);
          const done = daySessions.length > 0;
          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
            .format(day)
            .replace(".", "");

          return (
            <div style={S.timelineItem} key={key}>
              <div style={{ ...S.bubble, ...(done ? S.bubbleDone : null) }}>
                <span style={{ ...S.bubbleInner, ...(done ? S.bubbleInnerDone : null) }} />
              </div>
              <div style={S.timelineDay}>{weekday}</div>
              <div style={S.timelineMin}>{done ? `${totalMin} min` : "—"}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CardioPremiumPreview() {
  return (
    <div style={S.previewCard}>
      <div style={S.previewRing}>
        <div style={S.previewRingInner}>
          <div style={S.previewTime}>28:34</div>
          <div style={S.previewSub}>de 45:00</div>
        </div>
      </div>

      <div style={S.previewSide}>
        <div style={S.previewWeekTitle}>Progresso</div>
        <div style={S.previewBars}>
          {[32, 62, 74, 42, 60, 92, 48].map((h, i) => (
            <span
              key={i}
              style={{
                ...S.previewBar,
                height: h,
                background: i === 5 ? "linear-gradient(180deg, #FF6A00, #FFB26B)" : "rgba(255,255,255,.20)",
              }}
            />
          ))}
        </div>

        <div style={S.previewMiniGrid}>
          <div style={S.previewMini}>
            <IconFlame />
            <b>1.248</b>
            <span>kcal</span>
          </div>

          <div style={S.previewMini}>
            <IconClock />
            <b>4h32</b>
            <span>total</span>
          </div>
        </div>
      </div>

      <div style={S.previewLock}>
        <span>🔒</span>
        Recurso Premium
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();

  const userId = user?.id || null;

  const [paid, setPaid] = useState(false);
  const [loadingPaid, setLoadingPaid] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [mode, setMode] = useState("timer");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("treadmill");
  const [selectedIntensity, setSelectedIntensity] = useState("moderate");
  const [minutes, setMinutes] = useState(20);
  const [minutesInput, setMinutesInput] = useState("20");
  const [calTarget, setCalTarget] = useState("");
  const [toast, setToast] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(20 * 60);
  const [justFinished, setJustFinished] = useState(false);

  const [dockOpen, setDockOpen] = useState(false);
  const dragStartY = useRef(null);
  const dragMoved = useRef(false);
  const tickRef = useRef(null);

  const selectedWorkout = useMemo(
    () => WORKOUTS.find((w) => w.id === selectedWorkoutId) || WORKOUTS[0],
    [selectedWorkoutId]
  );

  const intensityInfo = INTENSITIES[selectedIntensity] || INTENSITIES.moderate;
  const weightKg = Number(user?.peso || user?.weight || 80) || 80;

  const metNow = useMemo(() => {
    const metBase = selectedWorkout?.mets?.[selectedIntensity] ?? selectedWorkout?.mets?.moderate ?? 5.5;
    return +(metBase * intensityInfo.multiplier).toFixed(2);
  }, [selectedWorkout, selectedIntensity, intensityInfo]);

  const kcalPerMin = useMemo(() => (metNow * 3.5 * weightKg) / 200, [metNow, weightKg]);

  const todayKey = getDateKey();
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === todayKey), [sessions, todayKey]);
  const todayMinutes = todaySessions.reduce((a, b) => a + (b.minutes || 0), 0);
  const todayKcal = todaySessions.reduce((a, b) => a + (b.calories || 0), 0);

  const last7Boundary = new Date();
  last7Boundary.setDate(last7Boundary.getDate() - 6);

  const weekSessions = sessions.filter((s) => new Date(`${s.date}T12:00:00`) >= last7Boundary);
  const weekMinutes = weekSessions.reduce((a, b) => a + (b.minutes || 0), 0);
  const weekKcal = weekSessions.reduce((a, b) => a + (b.calories || 0), 0);
  const weekProgress = Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100));
  const minutesLeft = Math.max(0, WEEKLY_GOAL_MINUTES - weekMinutes);

  const recentSessions = [...sessions]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const timerRemainingSec = Math.max(0, durationSec - elapsedSec);
  const timerProgress = durationSec > 0 ? clamp((elapsedSec / durationSec) * 100, 0, 100) : 0;
  const liveEstimatedKcal = Math.round((elapsedSec / 60) * kcalPerMin);

  const nextActionLabel = useMemo(() => {
    if (mode === "calories") {
      if (!Number(calTarget) || Number(calTarget) <= 0) return "Defina uma meta de kcal";
      return "Toque em iniciar meta";
    }
    if (running) return "Sessão em andamento";
    if (elapsedSec > 0 && !justFinished) return "Toque em continuar";
    if (justFinished) return "Toque em salvar sessão";
    return mode === "timer" ? "Toque em iniciar timer" : "Toque em iniciar cronômetro";
  }, [mode, calTarget, running, elapsedSec, justFinished]);

  async function persistDock(v) {
    setDockOpen(v);

    if (!userId) return;

    await saveLiveState(userId, {
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec,
      mode,
      running,
      elapsedSec,
      startedAt: running ? Date.now() : 0,
      finishedAt: justFinished ? Date.now() : 0,
      dockOpen: v,
    });
  }

  async function persistLive(next) {
    if (!userId) return;

    await saveLiveState(userId, {
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec,
      mode,
      running,
      elapsedSec,
      dockOpen,
      ...next,
    });
  }

  async function saveSessionFromMinutes(mins, modeLabel) {
    const safeMinutes = Math.max(1, Math.round(mins));
    const kcal = caloriesFromMET({
      met: metNow,
      minutes: safeMinutes,
      weightKg,
    });

    const entry = {
      date: todayKey,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      intensity: selectedIntensity,
      intensityLabel: intensityInfo.label,
      minutes: safeMinutes,
      calories: kcal,
      weightKg,
      mode: modeLabel,
    };

    const result = await insertCardioSession(userId, entry);
    if (!result?.ok) {
      setToast({
        title: "Erro ao salvar",
        text: "Não foi possível salvar a sessão agora.",
      });
      return false;
    }

    setSessions((prev) => [result.row, ...prev].slice(0, MAX_SESSIONS));
    return true;
  }

  useEffect(() => {
    document.body.classList.add("fitdeal-hide-bottom-menu");

    return () => {
      document.body.classList.remove("fitdeal-hide-bottom-menu");
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!userId) {
        if (!active) return;
        setPaid(false);
        setLoadingPaid(false);
        setLoadingData(false);
        return;
      }

      setLoadingPaid(true);
      setLoadingData(true);

      const [paidNow, sessionsNow, liveNow] = await Promise.all([
        loadPaidStatus(userId),
        fetchCardioSessions(userId),
        fetchLiveState(userId),
      ]);

      if (!active) return;

      setPaid(!!paidNow);
      setLoadingPaid(false);
      setSessions(Array.isArray(sessionsNow) ? sessionsNow : []);

      if (liveNow) {
        setMode(liveNow.mode || "timer");
        setSelectedWorkoutId(liveNow.selectedWorkoutId || "treadmill");
        setSelectedIntensity(liveNow.selectedIntensity || "moderate");

        const mins = Number(liveNow.minutes || 20);
        setMinutes(clamp(mins, 1, 240));
        setMinutesInput(String(clamp(mins, 1, 240)));

        const total = Number(liveNow.durationSec || mins * 60);
        const elapsed = computeLiveElapsed({
          elapsed_sec: liveNow.elapsedSec,
          running: liveNow.running,
          started_at_ms: liveNow.startedAt,
        });

        if (liveNow.mode === "timer" && total > 0 && elapsed >= total && liveNow.running) {
          setDurationSec(total);
          setElapsedSec(total);
          setRunning(false);
          setJustFinished(true);
          setDockOpen(true);

          await saveLiveState(userId, {
            selectedWorkoutId: liveNow.selectedWorkoutId,
            selectedIntensity: liveNow.selectedIntensity,
            minutes: liveNow.minutes,
            durationSec: total,
            mode: "timer",
            running: false,
            elapsedSec: total,
            startedAt: 0,
            finishedAt: Date.now(),
            dockOpen: true,
          });
        } else {
          setDurationSec(total);
          setElapsedSec(elapsed);
          setRunning(!!liveNow.running);
          setDockOpen(!!liveNow.dockOpen);
        }
      } else {
        setDurationSec(20 * 60);
      }

      setLoadingData(false);
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (mode === "timer" && !running) {
      setDurationSec(minutes * 60);
    }
  }, [minutes, mode, running]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!running) return;

    tickRef.current = setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;

        if (mode === "timer" && next >= durationSec) {
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }

          setRunning(false);
          setJustFinished(true);
          setDockOpen(true);

          if (userId) {
            saveLiveState(userId, {
              selectedWorkoutId,
              selectedIntensity,
              minutes,
              durationSec,
              mode: "timer",
              running: false,
              elapsedSec: durationSec,
              startedAt: 0,
              finishedAt: Date.now(),
              dockOpen: true,
            });
          }

          vibrate([40, 60, 40]);

          setToast({
            type: "success",
            title: "Timer concluído",
            text: "Seu cardio terminou. Agora salve a sessão.",
          });

          return durationSec;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [running, mode, durationSec, userId, selectedWorkoutId, selectedIntensity, minutes]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "cardio-apple-glass-ui-v14";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes cdSheen {
        0%,35% { transform: translateX(-70%); opacity:.18; }
        55%,100% { transform: translateX(140%); opacity:.18; }
      }

      @keyframes cdPop {
        0%,100% { transform: scale(1); }
        50% { transform: scale(1.015); }
      }

      .cd-press { transition: transform .12s ease, filter .12s ease; }
      .cd-press:active { transform: translateY(1px) scale(.99); filter: brightness(.985); }

      input:focus {
        border-color: rgba(255,106,0,.38) !important;
        box-shadow: 0 0 0 4px rgba(255,106,0,.10), inset 0 1px 0 rgba(255,255,255,.7) !important;
      }

      body.fitdeal-hide-bottom-menu [data-bottom-menu],
      body.fitdeal-hide-bottom-menu [data-testid="bottom-menu"],
      body.fitdeal-hide-bottom-menu .bottom-menu,
      body.fitdeal-hide-bottom-menu .bottomMenu,
      body.fitdeal-hide-bottom-menu .BottomMenu,
      body.fitdeal-hide-bottom-menu .bottom-nav,
      body.fitdeal-hide-bottom-menu .bottomNav {
        display: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  async function startTimer() {
    setJustFinished(false);

    const total = clamp(minutes, 1, 240) * 60;
    const currentElapsed = elapsedSec > 0 && elapsedSec < total ? elapsedSec : 0;

    setMode("timer");
    setDurationSec(total);
    setElapsedSec(currentElapsed);
    setRunning(true);
    setDockOpen(true);

    vibrate(10);

    await persistLive({
      mode: "timer",
      durationSec: total,
      running: true,
      elapsedSec: currentElapsed,
      startedAt: Date.now(),
      finishedAt: 0,
      dockOpen: true,
    });
  }

  async function startChrono() {
    setJustFinished(false);

    setMode("chrono");
    setRunning(true);
    setDockOpen(true);

    vibrate(10);

    await persistLive({
      mode: "chrono",
      durationSec: 0,
      running: true,
      elapsedSec,
      startedAt: Date.now(),
      finishedAt: 0,
      dockOpen: true,
    });
  }

  async function pauseCurrent() {
    const safeElapsed = elapsedSec;

    setRunning(false);

    await persistLive({
      mode,
      running: false,
      elapsedSec: safeElapsed,
      startedAt: 0,
      finishedAt: 0,
      dockOpen,
    });

    vibrate(8);
  }

  async function resetCurrent() {
    setJustFinished(false);

    if (mode === "timer") {
      setElapsedSec(0);
      setDurationSec(minutes * 60);
      setRunning(false);

      await persistLive({
        mode: "timer",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        durationSec: minutes * 60,
        finishedAt: 0,
      });

      vibrate(8);
      return;
    }

    if (mode === "chrono") {
      setElapsedSec(0);
      setRunning(false);

      await persistLive({
        mode: "chrono",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });

      vibrate(8);
    }
  }

  async function saveTimerSession() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    const ok = await saveSessionFromMinutes(doneMinutes, "timer");
    if (!ok) return;

    await persistLive({
      mode: "timer",
      running: false,
      elapsedSec: 0,
      startedAt: 0,
      durationSec: minutes * 60,
      finishedAt: 0,
    });

    setElapsedSec(0);
    setRunning(false);
    setJustFinished(false);
    vibrate(20);

    setToast({
      type: "success",
      title: "Sessão salva",
      text: `${doneMinutes} min registrados com sucesso.`,
    });
  }

  async function saveChronoSession() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    const ok = await saveSessionFromMinutes(doneMinutes, "chrono");
    if (!ok) return;

    await persistLive({
      mode: "chrono",
      running: false,
      elapsedSec: 0,
      startedAt: 0,
      finishedAt: 0,
    });

    setElapsedSec(0);
    setRunning(false);
    setJustFinished(false);
    vibrate(20);

    setToast({
      type: "success",
      title: "Sessão salva",
      text: `${doneMinutes} min registrados com sucesso.`,
    });
  }

  async function startByCalories() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;

    const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    setMinutes(mins);
    setMinutesInput(String(mins));
    setMode("timer");
    setJustFinished(false);

    await saveLiveState(userId, {
      selectedWorkoutId,
      selectedIntensity,
      minutes: mins,
      durationSec: mins * 60,
      mode: "timer",
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
      dockOpen: true,
    });

    setDurationSec(mins * 60);
    setElapsedSec(0);
    setRunning(true);
    vibrate(10);
    setDockOpen(true);

    setToast({
      type: "success",
      title: "Meta iniciada",
      text: `${mins} min estimados para bater ${kcal} kcal.`,
    });
  }

  async function changeMode(nextMode) {
    if (running) await pauseCurrent();

    setMode(nextMode);
    setJustFinished(false);

    if (nextMode === "timer") {
      await saveLiveState(userId, {
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: minutes * 60,
        mode: "timer",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
        dockOpen,
      });

      setElapsedSec(0);
      setDurationSec(minutes * 60);
      setRunning(false);
    }

    if (nextMode === "chrono") {
      await saveLiveState(userId, {
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: 0,
        mode: "chrono",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
        dockOpen,
      });

      setElapsedSec(0);
      setRunning(false);
    }

    if (nextMode === "calories") {
      setRunning(false);
      setElapsedSec(0);
    }
  }

  function applyMinutesValue(rawValue) {
    const num = clamp(Number(rawValue || 1), 1, 240);
    setMinutes(num);
    setMinutesInput(String(num));

    if (!running && mode === "timer") {
      setDurationSec(num * 60);
    }
  }

  function onMinutesInputChange(value) {
    if (/^\d*$/.test(value)) {
      setMinutesInput(value);
    }
  }

  function onMinutesInputBlur() {
    applyMinutesValue(minutesInput || String(minutes));
  }

  function onDockPointerDown(e) {
    dragStartY.current = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
    dragMoved.current = false;
  }

  function onDockPointerMove(e) {
    if (dragStartY.current == null) return;

    const y = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
    if (y == null) return;

    const dy = y - dragStartY.current;
    if (Math.abs(dy) > 10) dragMoved.current = true;

    if (dy < -26) {
      dragStartY.current = null;
      persistDock(true);
    }

    if (dy > 26) {
      dragStartY.current = null;
      persistDock(false);
    }
  }

  function onDockPointerUp() {
    dragStartY.current = null;
  }

  function onDockClick() {
    if (dragMoved.current) return;
    persistDock(!dockOpen);
  }

  if (loadingPaid || loadingData) {
    return <div style={S.page} />;
  }

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.cardioPaywall}>
          <div style={S.paywallGlow} aria-hidden="true" />

          <div style={S.paywallTop}>
            <button
              style={S.back}
              onClick={() => nav("/treino")}
              aria-label="Voltar"
              type="button"
              className="cd-press"
            >
              <IconChevronLeft />
            </button>

            <div style={S.paywallBadge}>
              <span style={S.paywallBadgeDot} />
              Premium
            </div>
          </div>

          <div style={S.paywallLogo}>
            Fit<span style={{ color: ORANGE }}>Deal</span>
          </div>

          <div style={S.paywallTitle}>
            Cardio <span style={{ color: ORANGE }}>Premium</span>
          </div>

          <div style={S.paywallText}>
            Mais controle, mais consistência, mais resultado.
          </div>

          <CardioPremiumPreview />

          <div style={S.paywallCards}>
            <div style={S.paywallFeature}>
              <div style={S.paywallFeatureIcon}>
                <IconClock />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.paywallFeatureTitle}>Timer inteligente</div>
                <div style={S.paywallFeatureText}>
                  Controle tempo, ritmo e descanso com leveza.
                </div>
              </div>

              <div style={S.paywallMiniPreviewDark}>
                <div style={S.paywallMiniSmall}>Aquecimento</div>
                <div style={S.paywallMiniTime}>01:30</div>
              </div>
            </div>

            <div style={S.paywallFeature}>
              <div style={S.paywallFeatureIcon}>
                <IconFlame />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.paywallFeatureTitle}>Meta por calorias</div>
                <div style={S.paywallFeatureText}>
                  Descubra quanto tempo precisa para bater sua meta.
                </div>
              </div>

              <div style={S.paywallMiniPreviewLight}>
                <div style={S.paywallMiniSmallOrange}>Meta: 600 kcal</div>
                <div style={S.paywallMiniBig}>600</div>
              </div>
            </div>

            <div style={S.paywallFeature}>
              <div style={S.paywallFeatureIcon}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>▮</span>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.paywallFeatureTitle}>Evolução semanal</div>
                <div style={S.paywallFeatureText}>
                  Veja seu histórico e mantenha constância no cardio.
                </div>
              </div>

              <div style={S.paywallDots}>
                {[1, 1, 1, 1, 1, 0, 0].map((on, i) => (
                  <span key={i} style={{ ...S.paywallDot, ...(on ? S.paywallDotOn : null) }} />
                ))}
              </div>
            </div>
          </div>

          <div style={S.paywallActions}>
            <button style={S.paywallMainBtn} onClick={() => nav("/planos")} type="button" className="cd-press">
              <span style={S.paywallCrown}>♛</span>
              Ver planos
              <span style={S.paywallMainIcon}>
                <IconArrowRight />
              </span>
            </button>

            <button style={S.paywallGhostBtn} onClick={() => nav("/treino")} type="button" className="cd-press">
              ← Voltar ao treino
            </button>

            <div style={S.paywallFoot}>
              🔒 Recurso exclusivo para assinantes Premium
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={S.head}>
        <div style={S.headGlow} aria-hidden="true" />

        <button style={S.back} onClick={() => nav("/treino")} aria-label="Voltar" type="button" className="cd-press">
          <IconChevronLeft />
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={S.hKicker}>Cardio detalhado</div>
          <div style={S.hTitle}>Seu cardio de hoje</div>

          <div style={S.hLine}>
            <span style={S.tagStrong}>{selectedWorkout.name}</span>
            <span style={S.tagSoft}>{intensityInfo.label}</span>
            <span style={S.tagSoft}>
              {mode === "timer" ? "Timer" : mode === "chrono" ? "Cronômetro" : "Meta por calorias"}
            </span>
          </div>

          <div style={S.hMeta}>
            Escolha o modo, ajuste o ritmo e toque no botão principal para começar.
          </div>
        </div>
      </div>

      <div style={S.heroGrid} data-cardio-hero>
        <div style={S.heroCard}>
          <div style={S.cardGlow} aria-hidden="true" />
          <div style={S.cardSheen} aria-hidden="true" />

          <div style={S.sectionHead}>
            <div>
              <h3 style={S.sectionTitle}>Resumo da semana</h3>
              <p style={S.sectionSub}>Meta simples para manter consistência.</p>
            </div>
          </div>

          <div style={S.heroSplit} data-cardio-hero-split>
            <RingProgress
              progress={weekProgress}
              value={`${weekMinutes}m`}
              label="meta semanal"
              sublabel={weekProgress >= 100 ? "fechou!" : `faltam ${minutesLeft} min`}
            />

            <div style={S.heroStats} data-cardio-hero-stats>
              <Chip label="Hoje" value={`${todayMinutes} min`} />
              <Chip label="Calorias hoje" value={`${todayKcal} kcal`} />
              <Chip label="Semana" value={`${weekKcal} kcal`} />
            </div>
          </div>
        </div>

        <div style={{ ...S.heroCard, ...S.heroCardBlack }}>
          <div style={S.sectionHead}>
            <div>
              <h3 style={{ ...S.sectionTitle, color: "#fff" }}>Como usar</h3>
              <p style={{ ...S.sectionSub, color: "rgba(255,255,255,.72)" }}>
                Fluxo claro para não deixar dúvida.
              </p>
            </div>
          </div>

          <div style={S.howList}>
            <div style={{ ...S.howItem, ...S.howItemBlack }}>
              <div style={{ ...S.howStep, ...S.howStepBlack }}>1</div>
              <div style={{ ...S.howText, color: "#fff" }}>Escolha o tipo de cardio.</div>
            </div>

            <div style={{ ...S.howItem, ...S.howItemBlack }}>
              <div style={{ ...S.howStep, ...S.howStepBlack }}>2</div>
              <div style={{ ...S.howText, color: "#fff" }}>
                Selecione o modo: timer, cronômetro ou calorias.
              </div>
            </div>

            <div style={{ ...S.howItem, ...S.howItemBlack }}>
              <div style={{ ...S.howStep, ...S.howStepBlack }}>3</div>
              <div style={{ ...S.howText, color: "#fff" }}>
                Ajuste o tempo ou a meta e toque no botão principal para começar.
              </div>
            </div>

            <div style={{ ...S.howItem, ...S.howItemBlack }}>
              <div style={{ ...S.howStep, ...S.howStepBlack }}>4</div>
              <div style={{ ...S.howText, color: "#fff" }}>
                Quando terminar, toque em salvar sessão.
              </div>
            </div>
          </div>

          <div style={{ ...S.nextActionBox, ...S.nextActionBoxBlack }}>
            <div style={{ ...S.nextActionLabel, color: "rgba(255,255,255,.68)" }}>
              Próximo passo
            </div>
            <div style={{ ...S.nextActionValue, color: "#fff" }}>{nextActionLabel}</div>
          </div>
        </div>
      </div>

      <div style={S.contentGrid} data-cardio-layout>
        <div style={S.mainCol}>
          <div style={S.cardPage}>
            <div style={S.cardGlow} aria-hidden="true" />
            <div style={S.cardSheen} aria-hidden="true" />

            <div style={S.sectionHead}>
              <div>
                <h3 style={S.sectionTitle}>Escolha seu cardio</h3>
                <p style={S.sectionSub}>Toque em uma opção para definir a atividade.</p>
              </div>
            </div>

            <div style={S.workoutGrid} data-cardio-workout-grid>
              {WORKOUTS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkoutId(w.id)}
                  style={{ ...S.workoutCard, ...(selectedWorkoutId === w.id ? S.workoutCardOn : S.workoutCardOff) }}
                  className="cd-press"
                >
                  <div style={S.workoutName}>{w.name}</div>
                  <div style={S.workoutSub}>{w.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.cardPage}>
            <div style={S.cardGlow} aria-hidden="true" />
            <div style={S.cardSheen} aria-hidden="true" />

            <div style={S.sectionHead}>
              <div>
                <h3 style={S.sectionTitle}>Sessão atual</h3>
                <p style={S.sectionSub}>Tudo que importa aparece aqui no centro.</p>
              </div>
            </div>

            <div style={S.modeGrid} data-cardio-mode-grid>
              <button
                type="button"
                onClick={() => changeMode("timer")}
                style={{ ...S.modeBtn, ...(mode === "timer" ? S.modeBtnOn : S.modeBtnOff) }}
                className="cd-press"
              >
                Timer
              </button>

              <button
                type="button"
                onClick={() => changeMode("chrono")}
                style={{ ...S.modeBtn, ...(mode === "chrono" ? S.modeBtnOn : S.modeBtnOff) }}
                className="cd-press"
              >
                Cronômetro
              </button>

              <button
                type="button"
                onClick={() => changeMode("calories")}
                style={{ ...S.modeBtn, ...(mode === "calories" ? S.modeBtnOn : S.modeBtnOff) }}
                className="cd-press"
              >
                Por calorias
              </button>
            </div>

            <div style={S.ringPanel}>
              <BigRing
                progress={mode === "timer" ? timerProgress : mode === "chrono" ? 100 : 0}
                value={
                  mode === "timer"
                    ? formatMMSS(timerRemainingSec)
                    : mode === "chrono"
                    ? formatMMSS(elapsedSec)
                    : (() => {
                        const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
                        if (!kcal) return "--:--";
                        const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
                        return `${pad2(mins)}:00`;
                      })()
                }
                top={
                  mode === "timer"
                    ? running
                      ? "timer ativo"
                      : "timer"
                    : mode === "chrono"
                    ? running
                      ? "cronômetro ativo"
                      : "cronômetro"
                    : "meta por calorias"
                }
                bottom={
                  mode === "timer"
                    ? `${liveEstimatedKcal} kcal estimadas`
                    : mode === "chrono"
                    ? `${liveEstimatedKcal} kcal estimadas`
                    : calTarget
                    ? `${calTarget} kcal alvo`
                    : "defina sua meta"
                }
                running={running}
              />

              {mode === "timer" && justFinished ? (
                <div style={S.finishBanner}>
                  <div style={S.finishTitle}>Cardio concluído</div>
                  <div style={S.finishText}>Seu timer terminou. Agora toque em salvar sessão.</div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={S.cardPage}>
            <div style={S.cardGlow} aria-hidden="true" />
            <div style={S.cardSheen} aria-hidden="true" />

            <div style={S.sectionHead}>
              <div>
                <h3 style={S.sectionTitle}>Configuração</h3>
                <p style={S.sectionSub}>Aqui você ajusta o que precisa antes de começar.</p>
              </div>
            </div>

            {mode === "timer" && (
              <>
                <div style={S.block}>
                  <div style={S.blockLabel}>Quanto tempo?</div>

                  <div style={S.minuteEditor}>
                    <button
                      type="button"
                      onClick={() => applyMinutesValue(Math.max(1, minutes - 1))}
                      disabled={running}
                      style={{ ...S.stepBtn, ...(running ? S.stepBtnDisabled : null) }}
                      className="cd-press"
                    >
                      −
                    </button>

                    <input
                      value={minutesInput}
                      onChange={(e) => onMinutesInputChange(e.target.value)}
                      onBlur={onMinutesInputBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          applyMinutesValue(minutesInput || String(minutes));
                          e.currentTarget.blur();
                        }
                      }}
                      disabled={running}
                      inputMode="numeric"
                      style={{ ...S.minuteInput, ...(running ? S.minuteInputDisabled : null) }}
                    />

                    <div style={S.minuteSuffix}>min</div>

                    <button
                      type="button"
                      onClick={() => applyMinutesValue(Math.min(240, minutes + 1))}
                      disabled={running}
                      style={{ ...S.stepBtn, ...(running ? S.stepBtnDisabled : null) }}
                      className="cd-press"
                    >
                      +
                    </button>
                  </div>

                  <div style={S.quickMinutesWrap}>
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => applyMinutesValue(d)}
                        disabled={running}
                        style={{
                          ...S.durationBtn,
                          ...(minutes === d ? S.durationBtnOn : S.durationBtnOff),
                          ...(running ? S.durationBtnDisabled : null),
                        }}
                        className="cd-press"
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.block}>
                  <div style={S.blockLabel}>Intensidade</div>
                  <div style={S.intensityGrid} data-cardio-intensity-grid>
                    {Object.entries(INTENSITIES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIntensity(key)}
                        style={{ ...S.intensityCard, ...(selectedIntensity === key ? S.intensityCardOn : S.intensityCardOff) }}
                        className="cd-press"
                      >
                        <div style={S.intensityTitle}>{info.label}</div>
                        <div style={S.intensityFeel}>{info.feel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.loadBox} data-cardio-load-box>
                  <div style={S.loadLeft}>
                    <div style={S.loadLabel}>Estimativa atual</div>
                    <div style={S.loadVal}>~ {liveEstimatedKcal} kcal</div>
                    <div style={S.loadHint}>
                      {formatMMSS(elapsedSec)} feitos • {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div style={S.loadRight}>
                    <div style={S.loadLabel}>kcal/min</div>
                    <div style={S.loadVal}>{Math.round(kcalPerMin)}</div>
                    <div style={S.loadHint}>Baseado no seu peso e intensidade.</div>
                  </div>
                </div>

                <div style={S.ctaGuide}>
                  <div style={S.ctaGuideTitle}>Botão para começar</div>
                  <div style={S.ctaGuideText}>Use o botão preto abaixo para iniciar ou continuar o timer.</div>
                </div>

                <div style={S.actionRow} data-cardio-action-row>
                  {!running ? (
                    <button type="button" onClick={startTimer} style={S.bigStart} className="cd-press">
                      {elapsedSec > 0 && !justFinished ? "Continuar timer" : "Iniciar timer"}
                      <span style={S.bigStartIcon} aria-hidden="true">
                        <IconPlay />
                      </span>
                    </button>
                  ) : (
                    <button type="button" onClick={pauseCurrent} style={S.bigStart} className="cd-press">
                      Pausar
                      <span style={S.bigStartIcon} aria-hidden="true">
                        <IconPause />
                      </span>
                    </button>
                  )}

                  <button type="button" onClick={resetCurrent} style={S.smallPause} className="cd-press">
                    <IconReset />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={saveTimerSession}
                    disabled={elapsedSec < 30}
                    style={{ ...S.smallPause, ...(elapsedSec < 30 ? S.smallPauseDisabled : null) }}
                    className="cd-press"
                  >
                    <IconFlame />
                    Salvar
                  </button>
                </div>
              </>
            )}

            {mode === "chrono" && (
              <>
                <div style={S.block}>
                  <div style={S.blockLabel}>Intensidade</div>
                  <div style={S.intensityGrid} data-cardio-intensity-grid>
                    {Object.entries(INTENSITIES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIntensity(key)}
                        style={{ ...S.intensityCard, ...(selectedIntensity === key ? S.intensityCardOn : S.intensityCardOff) }}
                        className="cd-press"
                      >
                        <div style={S.intensityTitle}>{info.label}</div>
                        <div style={S.intensityFeel}>{info.feel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.loadBox} data-cardio-load-box>
                  <div style={S.loadLeft}>
                    <div style={S.loadLabel}>Estimativa atual</div>
                    <div style={S.loadVal}>~ {liveEstimatedKcal} kcal</div>
                    <div style={S.loadHint}>
                      {Math.max(1, Math.round(elapsedSec / 60))} min • {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div style={S.loadRight}>
                    <div style={S.loadLabel}>kcal/min</div>
                    <div style={S.loadVal}>{Math.round(kcalPerMin)}</div>
                    <div style={S.loadHint}>Leitura rápida e limpa.</div>
                  </div>
                </div>

                <div style={S.ctaGuide}>
                  <div style={S.ctaGuideTitle}>Botão para começar</div>
                  <div style={S.ctaGuideText}>Use o botão preto abaixo para iniciar ou continuar o cronômetro.</div>
                </div>

                <div style={S.actionRow} data-cardio-action-row>
                  {!running ? (
                    <button type="button" onClick={startChrono} style={S.bigStart} className="cd-press">
                      {elapsedSec > 0 ? "Continuar cronômetro" : "Iniciar cronômetro"}
                      <span style={S.bigStartIcon} aria-hidden="true">
                        <IconPlay />
                      </span>
                    </button>
                  ) : (
                    <button type="button" onClick={pauseCurrent} style={S.bigStart} className="cd-press">
                      Pausar
                      <span style={S.bigStartIcon} aria-hidden="true">
                        <IconPause />
                      </span>
                    </button>
                  )}

                  <button type="button" onClick={resetCurrent} style={S.smallPause} className="cd-press">
                    <IconReset />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={saveChronoSession}
                    disabled={elapsedSec < 30}
                    style={{ ...S.smallPause, ...(elapsedSec < 30 ? S.smallPauseDisabled : null) }}
                    className="cd-press"
                  >
                    <IconFlame />
                    Salvar
                  </button>
                </div>
              </>
            )}

            {mode === "calories" && (
              <>
                <div style={S.block}>
                  <div style={S.blockLabel}>Meta de calorias</div>
                  <input
                    value={calTarget}
                    onChange={(e) => setCalTarget(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Ex.: 250"
                    inputMode="numeric"
                    style={S.input}
                  />
                </div>

                <div style={S.block}>
                  <div style={S.blockLabel}>Intensidade</div>
                  <div style={S.intensityGrid} data-cardio-intensity-grid>
                    {Object.entries(INTENSITIES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIntensity(key)}
                        style={{ ...S.intensityCard, ...(selectedIntensity === key ? S.intensityCardOn : S.intensityCardOff) }}
                        className="cd-press"
                      >
                        <div style={S.intensityTitle}>{info.label}</div>
                        <div style={S.intensityFeel}>{info.feel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.loadBox} data-cardio-load-box>
                  <div style={S.loadLeft}>
                    <div style={S.loadLabel}>Tempo necessário</div>
                    <div style={S.loadVal}>
                      {(() => {
                        const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
                        if (!kcal) return "—";
                        const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
                        return `${mins} min`;
                      })()}
                    </div>
                    <div style={S.loadHint}>
                      {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div style={S.loadRight}>
                    <div style={S.loadLabel}>Base</div>
                    <div style={S.loadVal}>{Math.round(kcalPerMin)} kcal/min</div>
                    <div style={S.loadHint}>Peso {weightKg}kg • MET {metNow}</div>
                  </div>
                </div>

                <div style={S.ctaGuide}>
                  <div style={S.ctaGuideTitle}>Botão para começar</div>
                  <div style={S.ctaGuideText}>Defina a meta e use o botão preto abaixo para iniciar automaticamente.</div>
                </div>

                <div style={S.actionRowSingle} data-cardio-action-row-single>
                  <button
                    type="button"
                    onClick={startByCalories}
                    disabled={!Number(calTarget) || Number(calTarget) <= 0}
                    style={{
                      ...S.bigStart,
                      ...((!Number(calTarget) || Number(calTarget) <= 0) ? S.bigStartDisabled : null),
                    }}
                    className="cd-press"
                  >
                    Iniciar meta
                    <span style={S.bigStartIcon} aria-hidden="true">
                      <IconArrowRight />
                    </span>
                  </button>

                  <button type="button" onClick={() => setCalTarget("")} style={S.smallPause} className="cd-press">
                    <IconReset />
                    Limpar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={S.sideCol}>
          <div style={S.cardPage}>
            <div style={S.cardGlow} aria-hidden="true" />
            <div style={S.cardSheen} aria-hidden="true" />

            <div style={S.sectionHead}>
              <div>
                <h3 style={S.sectionTitle}>Histórico recente</h3>
                <p style={S.sectionSub}>Feedback visual rápido da sua evolução.</p>
              </div>
            </div>

            {recentSessions.length === 0 ? (
              <div style={S.emptyCard}>
                Sua primeira sessão vai aparecer aqui assim que você salvar um cardio.
              </div>
            ) : (
              <div style={S.historyList}>
                {recentSessions.map((s) => (
                  <div key={s.id} style={S.historyItem}>
                    <div style={{ minWidth: 0 }}>
                      <div style={S.historyTitle}>{s.workoutName}</div>
                      <div style={S.historyMeta}>
                        {s.minutes} min • {s.intensityLabel}
                      </div>
                    </div>
                    <div style={S.historyKcal}>{s.calories} kcal</div>
                  </div>
                ))}
              </div>
            )}

            <div style={S.sideBtns}>
              <button type="button" onClick={() => nav("/treino")} style={S.endGhost} className="cd-press">
                Ver treino
              </button>
              <button type="button" onClick={() => nav("/nutricao")} style={S.endGhost} className="cd-press">
                Ver nutrição
              </button>
            </div>
          </div>
        </div>
      </div>

      <WeekTimeline sessions={sessions} />

      <div
        style={{ ...S.dock, ...(dockOpen ? S.dockOpen : S.dockClosed) }}
        onMouseDown={onDockPointerDown}
        onMouseMove={onDockPointerMove}
        onMouseUp={onDockPointerUp}
        onTouchStart={onDockPointerDown}
        onTouchMove={onDockPointerMove}
        onTouchEnd={onDockPointerUp}
        onClick={onDockClick}
        role="button"
        aria-label="Controle do cardio"
      >
        <div style={S.dockHeader}>
          <div style={S.dockPill}>
            <span style={S.dockIcon} aria-hidden="true">
              <IconClock />
            </span>
            <span style={S.dockTitle}>Sessão de cardio</span>
          </div>

          <div style={S.dockMini}>
            <span style={S.dockMiniTime}>
              {mode === "timer" ? formatMMSS(timerRemainingSec) : formatMMSS(elapsedSec)}
            </span>
            <span style={S.dockMiniState}>{running ? "rodando" : "parado"}</span>
          </div>
        </div>

        {dockOpen && (
          <div style={S.dockBody} onClick={(e) => e.stopPropagation()}>
            <div style={S.dockBigTime}>
              {mode === "timer" ? formatMMSS(timerRemainingSec) : formatMMSS(elapsedSec)}
            </div>
            <div style={S.dockSub}>
              <b style={{ color: TEXT }}>{selectedWorkout.name}</b> • {intensityInfo.label} •{" "}
              {mode === "timer" ? "Timer" : mode === "chrono" ? "Cronômetro" : "Meta por calorias"}
            </div>

            <div style={S.dockBtns} data-cardio-dock-btns>
              {mode !== "calories" && !running ? (
                <button
                  type="button"
                  onClick={mode === "timer" ? startTimer : startChrono}
                  style={S.bigStart}
                  className="cd-press"
                >
                  {mode === "timer"
                    ? elapsedSec > 0 && !justFinished
                      ? "Continuar"
                      : "Começar"
                    : elapsedSec > 0
                    ? "Continuar"
                    : "Começar"}
                  <span style={S.bigStartIcon} aria-hidden="true">
                    <IconPlay />
                  </span>
                </button>
              ) : mode !== "calories" ? (
                <button type="button" onClick={pauseCurrent} style={S.bigStart} className="cd-press">
                  Pausar
                  <span style={S.bigStartIcon} aria-hidden="true">
                    <IconPause />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startByCalories}
                  disabled={!Number(calTarget) || Number(calTarget) <= 0}
                  style={{
                    ...S.bigStart,
                    ...((!Number(calTarget) || Number(calTarget) <= 0) ? S.bigStartDisabled : null),
                  }}
                  className="cd-press"
                >
                  Iniciar
                  <span style={S.bigStartIcon} aria-hidden="true">
                    <IconArrowRight />
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={mode === "timer" || mode === "chrono" ? resetCurrent : () => setCalTarget("")}
                style={S.smallPause}
                className="cd-press"
              >
                <IconReset />
                {mode === "calories" ? "Limpar" : "Reset"}
              </button>

              <button
                type="button"
                onClick={mode === "timer" ? saveTimerSession : saveChronoSession}
                disabled={mode === "calories" || elapsedSec < 30}
                style={{
                  ...S.smallPause,
                  ...(mode === "calories" || elapsedSec < 30 ? S.smallPauseDisabled : null),
                }}
                className="cd-press"
              >
                <IconFlame />
                Salvar
              </button>
            </div>

            <div style={S.dockHint}>Arraste pra cima pra abrir, pra baixo pra fechar.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MINI DOCK EXPORT ---------------- */
export function CardioMiniDock() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = user?.id || null;
  const [info, setInfo] = useState({
    liveRunning: false,
    liveTime: "00:00",
    title: "Cardio",
  });

  useEffect(() => {
    let active = true;

    async function pull() {
      if (!userId) {
        if (!active) return;
        setInfo({
          liveRunning: false,
          liveTime: "00:00",
          title: "Cardio",
        });
        return;
      }

      const live = await fetchLiveState(userId);
      if (!active) return;

      if (!live) {
        setInfo({
          liveRunning: false,
          liveTime: "00:00",
          title: "Cardio",
        });
        return;
      }

      const elapsed = computeLiveElapsed({
        elapsed_sec: live.elapsedSec,
        running: live.running,
        started_at_ms: live.startedAt,
      });

      let liveTime = "00:00";

      if (live.mode === "timer") {
        const total = Number(live.durationSec || 0);
        liveTime = formatMMSS(Math.max(0, total - elapsed));
      } else {
        liveTime = formatMMSS(elapsed);
      }

      const workout = WORKOUTS.find((w) => w.id === live.selectedWorkoutId);

      setInfo({
        liveRunning: !!live.running,
        liveTime,
        title: workout?.name || "Cardio",
      });
    }

    pull();
    const t = setInterval(pull, 1000);

    return () => {
      active = false;
      clearInterval(t);
    };
  }, [userId]);

  if (!info.liveRunning) return null;
  if (typeof window !== "undefined" && window.location.pathname === "/cardio") return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/cardio")}
      aria-label="Abrir Cardio"
      style={MD.wrap}
    >
      <div style={MD.left}>
        <div style={MD.dot} />
        <div style={{ minWidth: 0 }}>
          <div style={MD.top}>Cardio em andamento</div>
          <div style={MD.sub}>{info.title}</div>
        </div>
      </div>

      <div style={MD.right}>
        <div style={MD.time}>{info.liveTime}</div>
      </div>
    </button>
  );
}

/* ---------------- STYLES ---------------- */
const S = {
  page: {
    padding: 16,
    paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
    background: BG,
    minHeight: "100vh",
  },

  head: {
    borderRadius: 26,
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
    color: TEXT,
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
    lineHeight: 1.1,
  },
  hLine: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
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
  hMeta: {
    marginTop: 10,
    fontSize: 12,
    color: MUTED,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  cardioPaywall: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 32,
    padding: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,247,237,.96))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 28px 90px rgba(15,23,42,.12)",
    minHeight: "calc(100vh - 142px)",
    display: "flex",
    flexDirection: "column",
  },
  paywallGlow: {
    position: "absolute",
    inset: -50,
    background:
      "radial-gradient(620px 260px at 20% 0%, rgba(255,106,0,.25), transparent 58%), radial-gradient(520px 260px at 95% 0%, rgba(15,23,42,.10), transparent 62%)",
    pointerEvents: "none",
  },
  paywallTop: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paywallBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(11,11,12,.92)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.1,
    boxShadow: "0 14px 34px rgba(0,0,0,.16)",
  },
  paywallBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.16)",
  },
  paywallLogo: {
    position: "relative",
    marginTop: 22,
    textAlign: "center",
    color: "#111",
    fontSize: 25,
    fontWeight: 980,
    letterSpacing: -0.8,
    fontStyle: "italic",
  },
  paywallTitle: {
    position: "relative",
    marginTop: 22,
    fontSize: 38,
    lineHeight: 1,
    fontWeight: 980,
    color: TEXT,
    letterSpacing: -1.45,
    textAlign: "center",
  },
  paywallText: {
    position: "relative",
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.5,
    color: "#475569",
    fontWeight: 800,
    textAlign: "center",
  },

  previewCard: {
    position: "relative",
    marginTop: 24,
    borderRadius: 28,
    padding: 18,
    minHeight: 220,
    background: "linear-gradient(135deg, #0B0B0C, #1f2937)",
    border: "1px solid rgba(255,255,255,.14)",
    boxShadow: "0 24px 70px rgba(0,0,0,.24)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  previewRing: {
    width: 132,
    height: 132,
    borderRadius: 999,
    background: `conic-gradient(${ORANGE} 0deg, ${ORANGE_2} 260deg, rgba(255,255,255,.10) 260deg)`,
    display: "grid",
    placeItems: "center",
    margin: "0 auto",
    boxShadow: "0 0 0 10px rgba(255,255,255,.04)",
  },
  previewRingInner: {
    width: 100,
    height: 100,
    borderRadius: 999,
    background: "#0B0B0C",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
  },
  previewTime: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 980,
    letterSpacing: -1,
  },
  previewSub: {
    marginTop: 3,
    color: "rgba(255,255,255,.65)",
    fontSize: 12,
    fontWeight: 850,
  },
  previewSide: {
    minWidth: 0,
    display: "grid",
    gap: 10,
  },
  previewWeekTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
  },
  previewBars: {
    height: 84,
    display: "flex",
    alignItems: "end",
    gap: 10,
  },
  previewBar: {
    width: 13,
    borderRadius: 999,
    display: "block",
  },
  previewMiniGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  previewMini: {
    minHeight: 58,
    borderRadius: 16,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.10)",
    color: "#fff",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 2,
    fontSize: 11,
  },
  previewLock: {
    position: "absolute",
    left: "50%",
    bottom: 12,
    transform: "translateX(-50%)",
    padding: "10px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,.22)",
    border: "1px solid rgba(255,255,255,.20)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 14px 34px rgba(0,0,0,.22)",
    whiteSpace: "nowrap",
  },

  paywallCards: {
    position: "relative",
    marginTop: 18,
    display: "grid",
    gap: 10,
  },
  paywallFeature: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    borderRadius: 24,
    padding: 14,
    background: "rgba(255,255,255,.84)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 36px rgba(15,23,42,.06)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  paywallFeatureIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.08)",
    color: ORANGE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 26px rgba(15,23,42,.04)",
  },
  paywallFeatureTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },
  paywallFeatureText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 1.42,
    color: "#475569",
    fontWeight: 800,
  },
  paywallMiniPreviewDark: {
    width: 96,
    minHeight: 58,
    borderRadius: 16,
    background: "#0B0B0C",
    color: "#fff",
    display: "grid",
    alignContent: "center",
    padding: 10,
    flexShrink: 0,
  },
  paywallMiniSmall: {
    fontSize: 10,
    fontWeight: 800,
    color: "rgba(255,255,255,.65)",
  },
  paywallMiniSmallOrange: {
    fontSize: 10,
    fontWeight: 900,
    color: ORANGE,
  },
  paywallMiniTime: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 980,
    letterSpacing: -0.7,
  },
  paywallMiniPreviewLight: {
    width: 96,
    minHeight: 58,
    borderRadius: 16,
    background: "#fff",
    color: TEXT,
    display: "grid",
    alignContent: "center",
    padding: 10,
    flexShrink: 0,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 26px rgba(15,23,42,.05)",
  },
  paywallMiniBig: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: 980,
    letterSpacing: -0.8,
  },
  paywallDots: {
    width: 96,
    minHeight: 58,
    borderRadius: 16,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 26px rgba(15,23,42,.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
  },
  paywallDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.14)",
  },
  paywallDotOn: {
    background: ORANGE,
  },
  paywallActions: {
    position: "relative",
    marginTop: "auto",
    paddingTop: 22,
    display: "grid",
    gap: 10,
  },
  paywallMainBtn: {
    width: "100%",
    minHeight: 62,
    border: "none",
    borderRadius: 22,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#fff",
    fontSize: 22,
    fontWeight: 980,
    boxShadow: "0 18px 50px rgba(255,106,0,.30)",
    display: "grid",
    gridTemplateColumns: "44px 1fr 40px",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
  },
  paywallCrown: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "#0B0B0C",
    color: ORANGE_2,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
  },
  paywallMainIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.22)",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    flexShrink: 0,
  },
  paywallGhostBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.18)",
    background: "rgba(255,255,255,.70)",
    color: TEXT,
    fontSize: 16,
    fontWeight: 950,
    boxShadow: "0 14px 34px rgba(15,23,42,.05)",
  },
  paywallFoot: {
    textAlign: "center",
    color: "rgba(15,23,42,.42)",
    fontSize: 12,
    fontWeight: 800,
  },

  heroGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  heroCard: {
    borderRadius: 26,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,.94))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 70px rgba(15,23,42,.06)",
    position: "relative",
    overflow: "hidden",
  },
  heroCardBlack: {
    background: "#0B0B0C",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 24px 80px rgba(0,0,0,.22)",
  },
  heroSplit: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 14,
    alignItems: "center",
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  howList: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },
  howItem: {
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    gap: 10,
    alignItems: "center",
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,255,255,.78)",
    border: `1px solid ${BORDER}`,
  },
  howItemBlack: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
  },
  howStep: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.12)",
    border: "1px solid rgba(255,106,0,.18)",
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
  },
  howStepBlack: {
    background: "rgba(255,106,0,.18)",
    border: "1px solid rgba(255,106,0,.28)",
    color: "#fff",
  },
  howText: {
    fontSize: 13,
    fontWeight: 850,
    color: TEXT,
    lineHeight: 1.35,
  },
  nextActionBox: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,106,0,.16)",
  },
  nextActionBoxBlack: {
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.06))",
    border: "1px solid rgba(255,255,255,.08)",
  },
  nextActionLabel: { fontSize: 12, fontWeight: 900, color: MUTED },
  nextActionValue: { marginTop: 6, fontSize: 15, fontWeight: 950, color: TEXT, lineHeight: 1.3 },

  contentGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  mainCol: {
    display: "grid",
    gap: 14,
  },
  sideCol: {
    display: "grid",
    gap: 14,
    alignContent: "start",
  },

  cardPage: {
    borderRadius: 26,
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
      "radial-gradient(620px 260px at 18% 0%, rgba(255,106,0,.14), transparent 60%), radial-gradient(520px 240px at 95% 0%, rgba(15,23,42,.10), transparent 62%)",
    pointerEvents: "none",
  },
  cardSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.22) 22%, transparent 50%)",
    transform: "translateX(-70%)",
    animation: "cdSheen 6.2s ease-in-out infinite",
    pointerEvents: "none",
  },

  sectionHead: { position: "relative", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4, lineHeight: 1.15 },
  sectionSub: { margin: "6px 0 0", fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.4 },

  modeGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    position: "relative",
  },
  modeBtn: {
    minHeight: 52,
    borderRadius: 16,
    fontWeight: 950,
    fontSize: 13,
    border: "1px solid rgba(15,23,42,.10)",
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
    whiteSpace: "nowrap",
  },
  modeBtnOn: {
    background: "#0B0B0C",
    color: "#fff",
    borderColor: "rgba(255,255,255,.10)",
  },
  modeBtnOff: {
    background: "rgba(255,255,255,.92)",
    color: TEXT,
  },

  workoutGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    position: "relative",
  },
  workoutCard: {
    minHeight: 98,
    borderRadius: 20,
    padding: 14,
    textAlign: "left",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    overflow: "hidden",
  },
  workoutCardOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,106,0,.05))",
    borderColor: "rgba(255,106,0,.18)",
  },
  workoutCardOff: {
    background: "rgba(255,255,255,.92)",
  },
  workoutName: { fontSize: 15, fontWeight: 950, color: TEXT, letterSpacing: -0.25, lineHeight: 1.15 },
  workoutSub: { marginTop: 7, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  ringPanel: {
    marginTop: 16,
    display: "grid",
    justifyItems: "center",
    gap: 14,
    position: "relative",
  },

  block: { marginTop: 14, position: "relative" },
  blockLabel: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.6, textTransform: "uppercase" },

  minuteEditor: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 110px) auto 44px",
    gap: 8,
    alignItems: "center",
  },
  stepBtn: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
    fontSize: 22,
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
  },
  stepBtnDisabled: { opacity: 0.45 },
  minuteInput: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    textAlign: "center",
    fontSize: 24,
    fontWeight: 950,
    color: TEXT,
    boxShadow: "0 12px 26px rgba(15,23,42,.05)",
  },
  minuteInputDisabled: { opacity: 0.65 },
  minuteSuffix: {
    fontSize: 13,
    fontWeight: 950,
    color: MUTED,
    whiteSpace: "nowrap",
  },

  quickMinutesWrap: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  durationBtn: {
    minHeight: 42,
    padding: "0 12px",
    borderRadius: 14,
    fontWeight: 950,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
    whiteSpace: "nowrap",
  },
  durationBtnOn: {
    background: "rgba(255,106,0,.10)",
    borderColor: "rgba(255,106,0,.20)",
    color: TEXT,
  },
  durationBtnOff: {
    background: "rgba(255,255,255,.92)",
    color: TEXT,
  },
  durationBtnDisabled: { opacity: 0.45 },

  intensityGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  intensityCard: {
    borderRadius: 18,
    padding: 14,
    textAlign: "left",
    minHeight: 102,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
    overflow: "hidden",
  },
  intensityCardOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,255,255,.92))",
    borderColor: "rgba(255,106,0,.18)",
  },
  intensityCardOff: {
    background: "rgba(255,255,255,.92)",
  },
  intensityTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  intensityFeel: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  chip: {
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.98))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 34px rgba(15,23,42,.05)",
    minHeight: 70,
  },
  chipLabel: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
  chipValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.45,
    lineHeight: 1.1,
    wordBreak: "break-word",
  },

  loadBox: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "start",
    position: "relative",
  },
  loadLeft: { minWidth: 0 },
  loadRight: { minWidth: 0 },
  loadLabel: { fontSize: 12, fontWeight: 900, color: MUTED },
  loadVal: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.4,
    lineHeight: 1.1,
    wordBreak: "break-word",
  },
  loadHint: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "#475569", lineHeight: 1.35 },
  input: {
    width: "100%",
    marginTop: 8,
    padding: "14px 12px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    outline: "none",
    fontSize: 16,
    fontWeight: 850,
    background: "rgba(255,255,255,.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 12px 26px rgba(15,23,42,.05)",
  },

  ctaGuide: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: `1px solid ${BORDER}`,
  },
  ctaGuideTitle: { fontSize: 12, fontWeight: 950, color: TEXT },
  ctaGuideText: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.4 },

  actionRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 10,
    alignItems: "center",
    position: "relative",
  },
  actionRowSingle: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "center",
    position: "relative",
  },

  bigStart: {
    width: "100%",
    minHeight: 56,
    padding: 16,
    borderRadius: 20,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxShadow: "0 18px 55px rgba(0,0,0,.18)",
    overflow: "hidden",
  },
  bigStartDisabled: { opacity: 0.5 },
  bigStartIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.10)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  smallPause: {
    minHeight: 54,
    padding: "14px 14px",
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
    whiteSpace: "nowrap",
  },
  smallPauseDisabled: { opacity: 0.45 },

  finishBanner: {
    width: "100%",
    borderRadius: 20,
    padding: 14,
    background: "linear-gradient(135deg, rgba(34,197,94,.12), rgba(255,255,255,.96))",
    border: "1px solid rgba(34,197,94,.16)",
  },
  finishTitle: { fontSize: 14, fontWeight: 950, color: TEXT },
  finishText: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.4 },

  timelineCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,.94))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 70px rgba(15,23,42,.06)",
    position: "relative",
    overflow: "hidden",
  },
  timelineRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },
  timelineItem: { textAlign: "center", minWidth: 0 },
  bubble: {
    width: 18,
    height: 18,
    margin: "0 auto 8px",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(15,23,42,.08)",
    boxShadow: "0 0 0 6px rgba(15,23,42,.02)",
  },
  bubbleInner: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,.34)",
  },
  bubbleDone: {
    background: "linear-gradient(180deg, rgba(255,106,0,.96), rgba(255,178,107,.96))",
    boxShadow: "0 0 0 6px rgba(255,106,0,.08)",
  },
  bubbleInnerDone: { background: "rgba(255,255,255,.94)" },
  timelineDay: { fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis" },
  timelineMin: { marginTop: 4, fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  historyList: { marginTop: 12, display: "grid", gap: 10 },
  historyItem: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    padding: 14,
    borderRadius: 20,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  historyTitle: { fontSize: 14, fontWeight: 800, letterSpacing: -0.02, color: TEXT, lineHeight: 1.2 },
  historyMeta: { marginTop: 4, fontSize: 12, color: MUTED, lineHeight: 1.4 },
  historyKcal: { alignSelf: "center", fontSize: 15, fontWeight: 800, letterSpacing: -0.02, color: TEXT, whiteSpace: "nowrap" },
  emptyCard: {
    padding: 18,
    borderRadius: 20,
    background: "rgba(255,255,255,.04)",
    border: "1px dashed rgba(15,23,42,.12)",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.5,
    marginTop: 10,
  },
  sideBtns: { marginTop: 14, display: "grid", gap: 10 },

  ringWrap: {
    position: "relative",
    width: 140,
    height: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
  },
  ringSvg: {
    filter: "drop-shadow(0 10px 24px rgba(255,106,0,.12))",
  },
  ringCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 20,
  },
  ringValue: { fontSize: 22, lineHeight: 1, fontWeight: 800, letterSpacing: -0.05, color: TEXT },
  ringLabel: { marginTop: 8, fontSize: 12, color: MUTED, lineHeight: 1.3 },
  ringSub: { marginTop: 6, fontSize: 11, color: "#64748b", lineHeight: 1.35 },

  bigRingWrap: {
    position: "relative",
    width: 220,
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
  },
  bigRingRunning: { animation: "cdPop 2.2s ease-in-out infinite" },
  bigRingSvg: { filter: "drop-shadow(0 16px 34px rgba(255,106,0,.12))", maxWidth: "100%", height: "auto" },
  bigRingCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 26,
  },
  bigRingTop: {
    fontSize: 11,
    color: MUTED,
    fontWeight: 900,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  bigRingValue: {
    marginTop: 8,
    fontSize: 50,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: -1.4,
    color: TEXT,
  },
  bigRingBottom: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
  },

  dock: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(12px + env(safe-area-inset-bottom))",
    zIndex: 999,
    borderRadius: 24,
    padding: 12,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.20)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    cursor: "pointer",
    animation: "cdPop 6s ease-in-out infinite",
  },
  dockOpen: { paddingBottom: 14 },
  dockClosed: { paddingBottom: 10 },

  dockHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  dockPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 14px 34px rgba(255,106,0,.10)",
    minWidth: 0,
  },
  dockIcon: {
    width: 34,
    height: 34,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.70)",
    border: "1px solid rgba(255,255,255,.55)",
    color: TEXT,
    flexShrink: 0,
  },
  dockTitle: { fontSize: 12, fontWeight: 950, color: TEXT, whiteSpace: "nowrap" },

  dockMini: { display: "grid", justifyItems: "end", gap: 2, flexShrink: 0 },
  dockMiniTime: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  dockMiniState: { fontSize: 11, fontWeight: 900, color: MUTED },

  dockBody: { marginTop: 12, cursor: "default" },
  dockBigTime: { fontSize: 32, fontWeight: 950, color: TEXT, letterSpacing: -1.0, lineHeight: 1 },
  dockSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  dockBtns: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 10,
    alignItems: "center",
  },
  dockHint: { marginTop: 10, fontSize: 11, fontWeight: 900, color: MUTED },

  endGhost: {
    width: "100%",
    padding: 14,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
  },

  toastWrap: {
    position: "fixed",
    left: 12,
    right: 12,
    top: "calc(12px + env(safe-area-inset-top))",
    zIndex: 99999,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  },
  toastCard: {
    width: "min(520px, 100%)",
    borderRadius: 22,
    padding: 12,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 22px 70px rgba(0,0,0,.18)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    pointerEvents: "auto",
  },
  toastDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 7px rgba(255,106,0,.12)",
    flexShrink: 0,
  },
  toastDotOk: {
    background: SUCCESS,
    boxShadow: "0 0 0 7px rgba(34,197,94,.14)",
  },
  toastTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  toastText: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.25 },
  toastClose: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    display: "grid",
    placeItems: "center",
  },
};

const MD = {
  wrap: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(84px + env(safe-area-inset-bottom))",
    zIndex: 9999,
    borderRadius: 22,
    padding: 12,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 22px 70px rgba(0,0,0,.18)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    textAlign: "left",
  },
  left: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.12)",
  },
  top: {
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  right: { display: "grid", justifyItems: "end", gap: 6, flexShrink: 0 },
  time: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: 0.4 },
};

/* ---------------- RESPONSIVE ---------------- */
if (typeof document !== "undefined") {
  const id = "cardio-v14-responsive";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @media (min-width: 980px) {
        [data-cardio-layout] {
          grid-template-columns: 1fr 360px !important;
        }
        [data-cardio-hero] {
          grid-template-columns: 1.1fr .9fr !important;
        }
      }

      @media (max-width: 860px) {
        [data-cardio-hero-split] {
          grid-template-columns: 1fr !important;
          justify-items: center;
        }
        [data-cardio-hero-stats] {
          grid-template-columns: 1fr !important;
          width: 100%;
        }
      }

      @media (max-width: 720px) {
        [data-cardio-mode-grid],
        [data-cardio-intensity-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-cardio-workout-grid] {
          grid-template-columns: 1fr 1fr !important;
        }
        [data-cardio-load-box] {
          grid-template-columns: 1fr !important;
        }
        [data-cardio-action-row] {
          grid-template-columns: 1fr !important;
        }
        [data-cardio-action-row-single] {
          grid-template-columns: 1fr !important;
        }
        [data-cardio-dock-btns] {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 560px) {
        [data-cardio-workout-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-cardio-timeline-row] {
          gap: 6px !important;
        }
      }

      @media (max-width: 430px) {
        .fitdeal-hide-bottom-menu .cardio-premium-force-mobile {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
