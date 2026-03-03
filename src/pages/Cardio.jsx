import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- THEME ---------------- */
const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const SUCCESS = "#22c55e";

const STORAGE_KEY = "cardio_sessions_fitdeal_v13";
const LIVE_KEY = "cardio_live_fitdeal_v13";
const WEEKLY_GOAL_MINUTES = 150;

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
    multiplier: 1,
  },
  high: {
    label: "Intenso",
    feel: "Esforço alto em menos tempo",
    multiplier: 1.15,
  },
};

const PRESET_MINUTES = [10, 15, 20, 25, 30, 40, 45, 60];

/* ---------------- HELPERS ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
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

function vibrate(ms = 18) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
}

function sessionsKey(email) {
  return `${STORAGE_KEY}_${email}`;
}
function liveKey(email) {
  return `${LIVE_KEY}_${email}`;
}

function readSessions(email) {
  return safeJsonParse(localStorage.getItem(sessionsKey(email)), []);
}

function writeSessions(email, sessions) {
  localStorage.setItem(sessionsKey(email), JSON.stringify(sessions));
}

function readLive(email) {
  return safeJsonParse(localStorage.getItem(liveKey(email)), null);
}

function writeLive(email, data) {
  localStorage.setItem(liveKey(email), JSON.stringify(data));
}

function clearLive(email) {
  localStorage.removeItem(liveKey(email));
}

function computeLiveElapsed(live) {
  if (!live) return 0;
  const base = Number(live.elapsedSec || 0) || 0;
  if (!live.running) return base;
  const startedAt = Number(live.startedAt || 0) || 0;
  const delta = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  return base + delta;
}

/* ---------------- ICONS ---------------- */
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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

function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 6v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
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

function IconSave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 20h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 4v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.8 10.8 12 14l3.2-3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function IconMinus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- UI ---------------- */
function Toast({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="cardio-toast-wrap" role="status" aria-live="polite">
      <div className="cardio-toast">
        <div
          className="cardio-toast-dot"
          style={{
            background: item.type === "success" ? SUCCESS : ORANGE,
            boxShadow:
              item.type === "success"
                ? "0 0 0 7px rgba(34,197,94,.14)"
                : "0 0 0 7px rgba(255,106,0,.12)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div className="cardio-toast-title">{item.title}</div>
          <div className="cardio-toast-text">{item.text}</div>
        </div>
        <button type="button" className="cardio-toast-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

function WeekRing({ progress = 0, value, label, sublabel }) {
  const size = 140;
  const stroke = 12;
  const clamped = clamp(progress, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="cardio-week-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="cardioWeekGradV13" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ORANGE} />
            <stop offset="100%" stopColor="#FFB26B" />
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
          stroke="url(#cardioWeekGradV13)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="cardio-week-ring-center">
        <div className="cardio-week-ring-value">{value}</div>
        <div className="cardio-week-ring-label">{label}</div>
        <div className="cardio-week-ring-sub">{sublabel}</div>
      </div>
    </div>
  );
}

function MainTimerRing({ progress, top, value, bottom, running }) {
  const size = 232;
  const stroke = 16;
  const clamped = clamp(progress, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`cardio-main-ring ${running ? "running" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="cardioMainGradV13" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ORANGE} />
            <stop offset="100%" stopColor="#FFB26B" />
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
          stroke="url(#cardioMainGradV13)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="cardio-main-ring-center">
        <div className="cardio-main-ring-top">{top}</div>
        <div className="cardio-main-ring-value">{value}</div>
        <div className="cardio-main-ring-bottom">{bottom}</div>
      </div>
    </div>
  );
}

function WeekTimeline({ sessions }) {
  const days = getLast7Days();

  return (
    <div className="cardio-card">
      <div className="cardio-section-head">
        <div>
          <h3 className="cardio-section-title">Seu ritmo da semana</h3>
          <p className="cardio-section-sub">Veja em quais dias você manteve o cardio.</p>
        </div>
      </div>

      <div className="cardio-timeline">
        {days.map((day) => {
          const key = getDateKey(day);
          const daySessions = sessions.filter((item) => item.date === key);
          const totalMin = daySessions.reduce((acc, item) => acc + (item.minutes || 0), 0);
          const done = daySessions.length > 0;

          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
            .format(day)
            .replace(".", "");

          return (
            <div key={key} className="cardio-timeline-item">
              <div className={`cardio-timeline-bubble ${done ? "done" : ""}`}>
                <span />
              </div>
              <div className="cardio-timeline-day">{weekday}</div>
              <div className="cardio-timeline-min">{done ? `${totalMin} min` : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();
  const paid = typeof window !== "undefined" ? localStorage.getItem(`paid_${email}`) === "1" : false;

  const [mode, setMode] = useState("timer"); // timer | chrono | calories
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("treadmill");
  const [selectedIntensity, setSelectedIntensity] = useState("moderate");
  const [minutes, setMinutes] = useState(20);
  const [minutesInput, setMinutesInput] = useState("20");
  const [calTarget, setCalTarget] = useState("");
  const [sessions, setSessions] = useState(() => readSessions(email));

  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [justFinished, setJustFinished] = useState(false);

  const [dockOpen, setDockOpen] = useState(() => {
    try {
      return localStorage.getItem(`cardio_dock_open_${email}`) === "1";
    } catch {
      return false;
    }
  });

  const tickRef = useRef(null);
  const dragStartY = useRef(null);
  const dragMoved = useRef(false);

  const weightKg = Number(user?.peso || user?.weight || 80) || 80;

  const selectedWorkout = useMemo(
    () => WORKOUTS.find((w) => w.id === selectedWorkoutId) || WORKOUTS[0],
    [selectedWorkoutId]
  );

  const intensityInfo = INTENSITIES[selectedIntensity] || INTENSITIES.moderate;

  const metNow = useMemo(() => {
    const raw = selectedWorkout?.mets?.[selectedIntensity] ?? selectedWorkout?.mets?.moderate ?? 5.5;
    return +(raw * intensityInfo.multiplier).toFixed(2);
  }, [selectedWorkout, selectedIntensity, intensityInfo]);

  const kcalPerMin = useMemo(() => (metNow * 3.5 * weightKg) / 200, [metNow, weightKg]);

  const todayKey = getDateKey();
  const todaySessions = useMemo(() => sessions.filter((item) => item.date === todayKey), [sessions, todayKey]);
  const todayMinutes = todaySessions.reduce((acc, item) => acc + (item.minutes || 0), 0);
  const todayKcal = todaySessions.reduce((acc, item) => acc + (item.calories || 0), 0);

  const last7Boundary = new Date();
  last7Boundary.setDate(last7Boundary.getDate() - 6);

  const weekSessions = sessions.filter((item) => new Date(`${item.date}T12:00:00`) >= last7Boundary);
  const weekMinutes = weekSessions.reduce((acc, item) => acc + (item.minutes || 0), 0);
  const weekKcal = weekSessions.reduce((acc, item) => acc + (item.calories || 0), 0);
  const weekProgress = Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100));
  const minutesLeft = Math.max(0, WEEKLY_GOAL_MINUTES - weekMinutes);

  const recentSessions = [...sessions]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const timerRemainingSec = Math.max(0, durationSec - elapsedSec);
  const timerProgress = durationSec > 0 ? clamp((elapsedSec / durationSec) * 100, 0, 100) : 0;
  const liveEstimatedKcal = Math.round((elapsedSec / 60) * kcalPerMin);

  const caloriesModeMinutes = useMemo(() => {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (!kcal) return 0;
    return Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
  }, [calTarget, kcalPerMin]);

  useEffect(() => {
    writeSessions(email, sessions);
  }, [email, sessions]);

  useEffect(() => {
    setMinutesInput(String(minutes));
  }, [minutes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const live = readLive(email);
    if (!live) {
      setMode("timer");
      setSelectedWorkoutId("treadmill");
      setSelectedIntensity("moderate");
      setMinutes(20);
      setMinutesInput("20");
      setDurationSec(20 * 60);
      setElapsedSec(0);
      setRunning(false);
      setJustFinished(false);
      return;
    }

    const safeMode = live.mode || "timer";
    const safeMinutes = clamp(Number(live.minutes || 20), 5, 240);

    setMode(safeMode);
    setSelectedWorkoutId(live.selectedWorkoutId || "treadmill");
    setSelectedIntensity(live.selectedIntensity || "moderate");
    setMinutes(safeMinutes);
    setMinutesInput(String(safeMinutes));
    setDurationSec(Number(live.durationSec || safeMinutes * 60));
    setElapsedSec(computeLiveElapsed(live));
    setRunning(!!live.running);
    setJustFinished(false);
  }, [email]);

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

    function syncLive() {
      const live = readLive(email);
      if (!live) return;

      const elapsed = computeLiveElapsed(live);
      setElapsedSec(elapsed);
      setRunning(!!live.running);

      if (live.mode === "timer") {
        const total = Number(live.durationSec || 0) || 0;
        setDurationSec(total);

        if (live.running && elapsed >= total && total > 0) {
          setElapsedSec(total);
          setRunning(false);
          setJustFinished(true);

          writeLive(email, {
            ...live,
            running: false,
            elapsedSec: total,
            startedAt: 0,
            finishedAt: Date.now(),
          });

          vibrate(40);
          setToast({
            type: "success",
            title: "Timer concluído",
            text: "Seu cardio terminou. Agora toque em salvar para registrar.",
          });
          persistDock(true);
        }
      }
    }

    syncLive();
    tickRef.current = setInterval(syncLive, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [email]);

  function persistDock(v) {
    setDockOpen(v);
    localStorage.setItem(`cardio_dock_open_${email}`, v ? "1" : "0");
  }

  function persistLive(next) {
    writeLive(email, {
      mode,
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec,
      ...next,
    });
  }

  function saveSessionFromMinutes(mins, modeLabel) {
    const safeMinutes = Math.max(1, Math.round(mins));
    const calories = Math.round(safeMinutes * kcalPerMin);

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      date: todayKey,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      intensity: selectedIntensity,
      intensityLabel: intensityInfo.label,
      minutes: safeMinutes,
      calories,
      weightKg,
      mode: modeLabel,
    };

    setSessions((prev) => [entry, ...prev].slice(0, 200));
  }

  function applyMinutesFromInput() {
    const parsed = Number(String(minutesInput || "").replace(/[^\d]/g, ""));
    const safe = clamp(Number.isFinite(parsed) && parsed > 0 ? parsed : minutes, 5, 240);
    setMinutes(safe);
    setMinutesInput(String(safe));
    if (!running && mode === "timer") {
      setDurationSec(safe * 60);
    }
  }

  function changeMinutes(next) {
    const safe = clamp(next, 5, 240);
    setMinutes(safe);
    setMinutesInput(String(safe));
    if (!running && mode === "timer") {
      setDurationSec(safe * 60);
    }
  }

  function startTimer() {
    setJustFinished(false);
    const total = clamp(minutes, 5, 240) * 60;
    const live = readLive(email);

    if (
      live &&
      live.mode === "timer" &&
      !live.running &&
      Number(live.elapsedSec || 0) > 0 &&
      Number(live.durationSec || 0) === total
    ) {
      writeLive(email, {
        ...live,
        running: true,
        startedAt: Date.now(),
      });
      setRunning(true);
      persistDock(true);
      vibrate(10);
      return;
    }

    writeLive(email, {
      mode: "timer",
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec: total,
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    });

    setDurationSec(total);
    setElapsedSec(0);
    setRunning(true);
    persistDock(true);
    vibrate(10);
  }

  function startChrono() {
    setJustFinished(false);
    const live = readLive(email);

    if (live && live.mode === "chrono" && !live.running && Number(live.elapsedSec || 0) > 0) {
      writeLive(email, {
        ...live,
        running: true,
        startedAt: Date.now(),
      });
      setRunning(true);
      persistDock(true);
      vibrate(10);
      return;
    }

    writeLive(email, {
      mode: "chrono",
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec: 0,
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    });

    setElapsedSec(0);
    setRunning(true);
    persistDock(true);
    vibrate(10);
  }

  function pauseCurrent() {
    const live = readLive(email);
    if (!live) return;

    const elapsed = computeLiveElapsed(live);

    writeLive(email, {
      ...live,
      running: false,
      elapsedSec: elapsed,
      startedAt: 0,
    });

    setElapsedSec(elapsed);
    setRunning(false);
    vibrate(8);
  }

  function resetCurrent() {
    setJustFinished(false);

    if (mode === "timer") {
      const total = clamp(minutes, 5, 240) * 60;
      writeLive(email, {
        mode: "timer",
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: total,
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setDurationSec(total);
      setRunning(false);
      vibrate(8);
      return;
    }

    if (mode === "chrono") {
      writeLive(email, {
        mode: "chrono",
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: 0,
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setRunning(false);
      vibrate(8);
    }
  }

  function saveTimerSession() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    saveSessionFromMinutes(doneMinutes, "timer");

    writeLive(email, {
      mode: "timer",
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec: minutes * 60,
      running: false,
      elapsedSec: 0,
      startedAt: 0,
      finishedAt: 0,
    });

    setElapsedSec(0);
    setDurationSec(minutes * 60);
    setRunning(false);
    setJustFinished(false);

    setToast({
      type: "success",
      title: "Sessão salva",
      text: `${doneMinutes} min registrados com sucesso.`,
    });
    vibrate(18);
  }

  function saveChronoSession() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    saveSessionFromMinutes(doneMinutes, "chrono");

    writeLive(email, {
      mode: "chrono",
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec: 0,
      running: false,
      elapsedSec: 0,
      startedAt: 0,
      finishedAt: 0,
    });

    setElapsedSec(0);
    setRunning(false);
    setJustFinished(false);

    setToast({
      type: "success",
      title: "Sessão salva",
      text: `${doneMinutes} min registrados com sucesso.`,
    });
    vibrate(18);
  }

  function startByCalories() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;

    const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    const safeMinutes = clamp(mins, 5, 240);

    setMode("timer");
    setMinutes(safeMinutes);
    setMinutesInput(String(safeMinutes));
    setDurationSec(safeMinutes * 60);
    setElapsedSec(0);
    setJustFinished(false);

    writeLive(email, {
      mode: "timer",
      selectedWorkoutId,
      selectedIntensity,
      minutes: safeMinutes,
      durationSec: safeMinutes * 60,
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    });

    setRunning(true);
    persistDock(true);
    vibrate(10);
    setToast({
      type: "success",
      title: "Meta iniciada",
      text: `${safeMinutes} min estimados para bater ${kcal} kcal.`,
    });
  }

  function changeMode(nextMode) {
    if (running) pauseCurrent();

    setMode(nextMode);
    setJustFinished(false);

    if (nextMode === "timer") {
      const total = clamp(minutes, 5, 240) * 60;
      writeLive(email, {
        mode: "timer",
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: total,
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setDurationSec(total);
      setRunning(false);
    }

    if (nextMode === "chrono") {
      writeLive(email, {
        mode: "chrono",
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: 0,
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setRunning(false);
    }

    if (nextMode === "calories") {
      setRunning(false);
      setElapsedSec(0);
    }
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

  const bigRingValue =
    mode === "timer"
      ? formatMMSS(timerRemainingSec)
      : mode === "chrono"
      ? formatMMSS(elapsedSec)
      : caloriesModeMinutes > 0
      ? `${pad2(caloriesModeMinutes)}:00`
      : "--:--";

  const bigRingTop =
    mode === "timer"
      ? running
        ? "timer ativo"
        : "timer"
      : mode === "chrono"
      ? running
        ? "cronômetro ativo"
        : "cronômetro"
      : "meta por kcal";

  const bigRingBottom =
    mode === "timer"
      ? `${liveEstimatedKcal} kcal estimadas`
      : mode === "chrono"
      ? `${liveEstimatedKcal} kcal estimadas`
      : calTarget
      ? `${calTarget} kcal alvo`
      : "defina sua meta";

  const heroSummaryText =
    mode === "timer"
      ? `Escolha o tempo e toque em iniciar timer.`
      : mode === "chrono"
      ? `Toque em iniciar cronômetro e salve quando terminar.`
      : `Digite a meta de calorias e toque em iniciar por kcal.`;

  if (!paid) {
    return (
      <div className="cardio-screen">
        <style>{styles}</style>
        <div className="cardio-lock-card">
          <div className="cardio-lock-title">Cardio premium</div>
          <div className="cardio-lock-text">
            Assine para liberar timer, cronômetro, meta por calorias, histórico e dock flutuante.
          </div>
          <button className="cardio-primary" onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
          <button className="cardio-secondary" onClick={() => nav("/treino")} type="button">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cardio-screen">
      <style>{styles}</style>

      <Toast item={toast} onClose={() => setToast(null)} />

      <div className="cardio-container">
        {/* HEADER */}
        <div className="cardio-card cardio-header">
          <button className="cardio-back-btn" onClick={() => nav("/treino")} type="button" aria-label="Voltar">
            <IconChevronLeft />
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cardio-kicker">Cardio detalhado</div>
            <div className="cardio-header-title">Seu cardio de hoje</div>

            <div className="cardio-badges">
              <span className="cardio-badge cardio-badge-strong">{selectedWorkout.name}</span>
              <span className="cardio-badge">{intensityInfo.label}</span>
              <span className="cardio-badge">
                {mode === "timer" ? "Timer" : mode === "chrono" ? "Cronômetro" : "Por calorias"}
              </span>
            </div>

            <div className="cardio-header-sub">
              {heroSummaryText}
            </div>
          </div>
        </div>

        {/* TOP CARDS */}
        <div className="cardio-top-grid">
          <div className="cardio-card">
            <div className="cardio-section-head">
              <div>
                <h3 className="cardio-section-title">Resumo da semana</h3>
                <p className="cardio-section-sub">Meta simples para manter consistência.</p>
              </div>
            </div>

            <div className="cardio-week-summary">
              <WeekRing
                progress={weekProgress}
                value={`${weekMinutes}m`}
                label="meta semanal"
                sublabel={weekProgress >= 100 ? "fechou!" : `faltam ${minutesLeft} min`}
              />

              <div className="cardio-stats-grid">
                <div className="cardio-stat-box">
                  <div className="cardio-stat-label">Hoje</div>
                  <div className="cardio-stat-value">{todayMinutes} min</div>
                </div>
                <div className="cardio-stat-box">
                  <div className="cardio-stat-label">Calorias hoje</div>
                  <div className="cardio-stat-value">{todayKcal} kcal</div>
                </div>
                <div className="cardio-stat-box">
                  <div className="cardio-stat-label">Semana</div>
                  <div className="cardio-stat-value">{weekKcal} kcal</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cardio-card">
            <div className="cardio-section-head">
              <div>
                <h3 className="cardio-section-title">Modo da sessão</h3>
                <p className="cardio-section-sub">Primeiro escolha como quer começar.</p>
              </div>
            </div>

            <div className="cardio-segmented">
              <button
                type="button"
                className={`cardio-segment-btn ${mode === "timer" ? "active" : ""}`}
                onClick={() => changeMode("timer")}
              >
                Timer
              </button>
              <button
                type="button"
                className={`cardio-segment-btn ${mode === "chrono" ? "active" : ""}`}
                onClick={() => changeMode("chrono")}
              >
                Cronômetro
              </button>
              <button
                type="button"
                className={`cardio-segment-btn ${mode === "calories" ? "active" : ""}`}
                onClick={() => changeMode("calories")}
              >
                Por kcal
              </button>
            </div>

            <div className="cardio-mode-help">
              {mode === "timer" && "Você escolhe quantos minutos quer fazer e inicia o contador regressivo."}
              {mode === "chrono" && "Você inicia, faz o cardio e salva o tempo real no final."}
              {mode === "calories" && "Você escolhe uma meta de calorias e o app calcula o tempo estimado."}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="cardio-main-grid">
          <div className="cardio-main-col">
            {/* SESSION CURRENT */}
            <div className="cardio-card">
              <div className="cardio-section-head">
                <div>
                  <h3 className="cardio-section-title">Sessão atual</h3>
                  <p className="cardio-section-sub">Aqui fica o centro da sessão e o botão principal para começar.</p>
                </div>
              </div>

              <div className="cardio-current-panel">
                <MainTimerRing
                  progress={mode === "timer" ? timerProgress : mode === "chrono" ? 100 : 0}
                  top={bigRingTop}
                  value={bigRingValue}
                  bottom={bigRingBottom}
                  running={running}
                />

                <div className="cardio-current-info">
                  <div className="cardio-current-line">
                    <strong>Cardio escolhido:</strong> {selectedWorkout.name}
                  </div>
                  <div className="cardio-current-line">
                    <strong>Intensidade:</strong> {intensityInfo.label}
                  </div>
                  <div className="cardio-current-line">
                    <strong>Gasto médio:</strong> ~{Math.round(kcalPerMin)} kcal/min
                  </div>
                </div>

                {justFinished && mode === "timer" ? (
                  <div className="cardio-finish-banner">
                    <div className="cardio-finish-title">Cardio concluído</div>
                    <div className="cardio-finish-text">
                      Seu timer terminou. Agora toque em <strong>Salvar sessão</strong>.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* WORKOUT */}
            <div className="cardio-card">
              <div className="cardio-section-head">
                <div>
                  <h3 className="cardio-section-title">Escolha seu cardio</h3>
                  <p className="cardio-section-sub">Toque em uma opção para selecionar o tipo de cardio.</p>
                </div>
              </div>

              <div className="cardio-workout-grid">
                {WORKOUTS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`cardio-workout-card ${selectedWorkoutId === w.id ? "active" : ""}`}
                    onClick={() => setSelectedWorkoutId(w.id)}
                  >
                    <div className="cardio-workout-name">{w.name}</div>
                    <div className="cardio-workout-sub">{w.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* SETTINGS */}
            <div className="cardio-card">
              <div className="cardio-section-head">
                <div>
                  <h3 className="cardio-section-title">Ajustes</h3>
                  <p className="cardio-section-sub">Aqui você configura o tempo, intensidade e salva a sessão.</p>
                </div>
              </div>

              {mode === "timer" && (
                <>
                  <div className="cardio-block">
                    <div className="cardio-block-title">1. Defina o tempo</div>

                    <div className="cardio-time-editor">
                      <button
                        type="button"
                        className="cardio-step-btn"
                        onClick={() => changeMinutes(minutes - 5)}
                        disabled={running}
                      >
                        <IconMinus />
                      </button>

                      <div className="cardio-time-input-wrap">
                        <input
                          className="cardio-time-input"
                          inputMode="numeric"
                          value={minutesInput}
                          disabled={running}
                          onChange={(e) => setMinutesInput(e.target.value.replace(/[^\d]/g, ""))}
                          onBlur={applyMinutesFromInput}
                        />
                        <span className="cardio-time-unit">min</span>
                      </div>

                      <button
                        type="button"
                        className="cardio-step-btn"
                        onClick={() => changeMinutes(minutes + 5)}
                        disabled={running}
                      >
                        <IconPlus />
                      </button>
                    </div>

                    <div className="cardio-presets">
                      {PRESET_MINUTES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`cardio-preset-btn ${minutes === d ? "active" : ""}`}
                          disabled={running}
                          onClick={() => changeMinutes(d)}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cardio-block">
                    <div className="cardio-block-title">2. Escolha a intensidade</div>

                    <div className="cardio-intensity-grid">
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          className={`cardio-intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="cardio-intensity-title">{info.label}</div>
                          <div className="cardio-intensity-feel">{info.feel}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cardio-estimate-box">
                    <div className="cardio-estimate-title">3. Revise a estimativa</div>
                    <div className="cardio-estimate-grid">
                      <div className="cardio-estimate-item">
                        <span>Tempo atual</span>
                        <strong>{minutes} min</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Tipo</span>
                        <strong>{selectedWorkout.name}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Intensidade</span>
                        <strong>{intensityInfo.label}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Estimativa</span>
                        <strong>~ {caloriesFromMET({ met: metNow, minutes, weightKg })} kcal</strong>
                      </div>
                    </div>
                  </div>

                  <div className="cardio-actions">
                    {!running ? (
                      <button type="button" className="cardio-primary-wide" onClick={startTimer}>
                        <span>{elapsedSec > 0 && !justFinished ? "Continuar timer" : "Iniciar timer"}</span>
                        <span className="cardio-btn-icon">
                          <IconPlay />
                        </span>
                      </button>
                    ) : (
                      <button type="button" className="cardio-primary-wide" onClick={pauseCurrent}>
                        <span>Pausar timer</span>
                        <span className="cardio-btn-icon">
                          <IconPause />
                        </span>
                      </button>
                    )}

                    <button type="button" className="cardio-secondary" onClick={resetCurrent}>
                      <IconReset />
                      Reset
                    </button>

                    <button
                      type="button"
                      className="cardio-secondary"
                      disabled={elapsedSec < 30}
                      onClick={saveTimerSession}
                    >
                      <IconSave />
                      Salvar sessão
                    </button>
                  </div>
                </>
              )}

              {mode === "chrono" && (
                <>
                  <div className="cardio-block">
                    <div className="cardio-block-title">1. Escolha a intensidade</div>

                    <div className="cardio-intensity-grid">
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          className={`cardio-intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="cardio-intensity-title">{info.label}</div>
                          <div className="cardio-intensity-feel">{info.feel}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cardio-estimate-box">
                    <div className="cardio-estimate-title">2. O que vai ser salvo</div>
                    <div className="cardio-estimate-grid">
                      <div className="cardio-estimate-item">
                        <span>Tempo rodado</span>
                        <strong>{formatMMSS(elapsedSec)}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Estimativa</span>
                        <strong>~ {liveEstimatedKcal} kcal</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Tipo</span>
                        <strong>{selectedWorkout.name}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Intensidade</span>
                        <strong>{intensityInfo.label}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="cardio-actions">
                    {!running ? (
                      <button type="button" className="cardio-primary-wide" onClick={startChrono}>
                        <span>{elapsedSec > 0 ? "Continuar cronômetro" : "Iniciar cronômetro"}</span>
                        <span className="cardio-btn-icon">
                          <IconPlay />
                        </span>
                      </button>
                    ) : (
                      <button type="button" className="cardio-primary-wide" onClick={pauseCurrent}>
                        <span>Pausar cronômetro</span>
                        <span className="cardio-btn-icon">
                          <IconPause />
                        </span>
                      </button>
                    )}

                    <button type="button" className="cardio-secondary" onClick={resetCurrent}>
                      <IconReset />
                      Reset
                    </button>

                    <button
                      type="button"
                      className="cardio-secondary"
                      disabled={elapsedSec < 30}
                      onClick={saveChronoSession}
                    >
                      <IconSave />
                      Salvar sessão
                    </button>
                  </div>
                </>
              )}

              {mode === "calories" && (
                <>
                  <div className="cardio-block">
                    <div className="cardio-block-title">1. Digite a meta de calorias</div>

                    <div className="cardio-kcal-input-wrap">
                      <input
                        className="cardio-kcal-input"
                        inputMode="numeric"
                        value={calTarget}
                        onChange={(e) => setCalTarget(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Ex.: 250"
                      />
                      <span className="cardio-kcal-unit">kcal</span>
                    </div>
                  </div>

                  <div className="cardio-block">
                    <div className="cardio-block-title">2. Escolha a intensidade</div>

                    <div className="cardio-intensity-grid">
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          className={`cardio-intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="cardio-intensity-title">{info.label}</div>
                          <div className="cardio-intensity-feel">{info.feel}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cardio-estimate-box">
                    <div className="cardio-estimate-title">3. Tempo estimado para bater a meta</div>
                    <div className="cardio-estimate-grid">
                      <div className="cardio-estimate-item">
                        <span>Meta</span>
                        <strong>{calTarget ? `${calTarget} kcal` : "—"}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Tempo</span>
                        <strong>{caloriesModeMinutes ? `${caloriesModeMinutes} min` : "—"}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Tipo</span>
                        <strong>{selectedWorkout.name}</strong>
                      </div>
                      <div className="cardio-estimate-item">
                        <span>Base</span>
                        <strong>{Math.round(kcalPerMin)} kcal/min</strong>
                      </div>
                    </div>
                  </div>

                  <div className="cardio-actions">
                    <button
                      type="button"
                      className="cardio-primary-wide"
                      disabled={!Number(calTarget) || Number(calTarget) <= 0}
                      onClick={startByCalories}
                    >
                      <span>Iniciar por kcal</span>
                      <span className="cardio-btn-icon">
                        <IconPlay />
                      </span>
                    </button>

                    <button type="button" className="cardio-secondary" onClick={() => setCalTarget("")}>
                      <IconReset />
                      Limpar
                    </button>
                  </div>
                </>
              )}
            </div>

            <WeekTimeline sessions={sessions} />
          </div>

          <div className="cardio-side-col">
            <div className="cardio-card">
              <div className="cardio-section-head">
                <div>
                  <h3 className="cardio-section-title">Histórico recente</h3>
                  <p className="cardio-section-sub">As últimas sessões que você salvou.</p>
                </div>
              </div>

              {recentSessions.length === 0 ? (
                <div className="cardio-empty">
                  Sua primeira sessão vai aparecer aqui quando você salvar o cardio.
                </div>
              ) : (
                <div className="cardio-history-list">
                  {recentSessions.map((s) => (
                    <div className="cardio-history-item" key={s.id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="cardio-history-title">{s.workoutName}</div>
                        <div className="cardio-history-meta">
                          {s.minutes} min • {s.intensityLabel}
                        </div>
                      </div>
                      <div className="cardio-history-kcal">{s.calories} kcal</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="cardio-side-buttons">
                <button type="button" className="cardio-secondary" onClick={() => nav("/treino")}>
                  Ver treino
                </button>
                <button type="button" className="cardio-secondary" onClick={() => nav("/nutricao")}>
                  Ver nutrição
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOCK */}
      <div
        className={`cardio-dock ${dockOpen ? "open" : "closed"}`}
        onMouseDown={onDockPointerDown}
        onMouseMove={onDockPointerMove}
        onMouseUp={onDockPointerUp}
        onTouchStart={onDockPointerDown}
        onTouchMove={onDockPointerMove}
        onTouchEnd={onDockPointerUp}
        onClick={onDockClick}
        role="button"
        aria-label="Controle da sessão"
      >
        <div className="cardio-dock-head">
          <div className="cardio-dock-pill">
            <span className="cardio-dock-icon">
              <IconClock />
            </span>
            <span className="cardio-dock-title">Sessão de cardio</span>
          </div>

          <div className="cardio-dock-mini">
            <div className="cardio-dock-mini-time">
              {mode === "timer" ? formatMMSS(timerRemainingSec) : formatMMSS(elapsedSec)}
            </div>
            <div className="cardio-dock-mini-state">{running ? "rodando" : "parado"}</div>
          </div>
        </div>

        {dockOpen ? (
          <div className="cardio-dock-body" onClick={(e) => e.stopPropagation()}>
            <div className="cardio-dock-big-time">
              {mode === "timer" ? formatMMSS(timerRemainingSec) : formatMMSS(elapsedSec)}
            </div>

            <div className="cardio-dock-sub">
              <strong>{selectedWorkout.name}</strong> • {intensityInfo.label} •{" "}
              {mode === "timer" ? "Timer" : mode === "chrono" ? "Cronômetro" : "Por calorias"}
            </div>

            <div className="cardio-dock-actions">
              {mode !== "calories" && !running ? (
                <button
                  type="button"
                  className="cardio-primary-wide"
                  onClick={mode === "timer" ? startTimer : startChrono}
                >
                  <span>{mode === "timer" ? "Começar timer" : "Começar cronômetro"}</span>
                  <span className="cardio-btn-icon">
                    <IconPlay />
                  </span>
                </button>
              ) : mode !== "calories" ? (
                <button type="button" className="cardio-primary-wide" onClick={pauseCurrent}>
                  <span>Pausar</span>
                  <span className="cardio-btn-icon">
                    <IconPause />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="cardio-primary-wide"
                  disabled={!Number(calTarget) || Number(calTarget) <= 0}
                  onClick={startByCalories}
                >
                  <span>Iniciar</span>
                  <span className="cardio-btn-icon">
                    <IconPlay />
                  </span>
                </button>
              )}

              <button
                type="button"
                className="cardio-secondary"
                onClick={mode === "calories" ? () => setCalTarget("") : resetCurrent}
              >
                <IconReset />
                {mode === "calories" ? "Limpar" : "Reset"}
              </button>

              <button
                type="button"
                className="cardio-secondary"
                disabled={mode === "calories" || elapsedSec < 30}
                onClick={mode === "timer" ? saveTimerSession : saveChronoSession}
              >
                <IconSave />
                Salvar
              </button>
            </div>

            <div className="cardio-dock-hint">Arraste para cima para abrir e para baixo para fechar.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- MINI DOCK ---------------- */
export function CardioMiniDock() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const email = (user?.email || "anon").toLowerCase();
  const [info, setInfo] = useState({
    liveRunning: false,
    liveTime: "00:00",
    title: "Cardio",
  });

  useEffect(() => {
    function pull() {
      const live = readLive(email);
      if (!live) {
        setInfo({ liveRunning: false, liveTime: "00:00", title: "Cardio" });
        return;
      }

      const elapsed = computeLiveElapsed(live);
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
    const t = setInterval(pull, 300);
    return () => clearInterval(t);
  }, [email]);

  if (!info.liveRunning) return null;

  return (
    <button type="button" onClick={() => navigate("/cardio")} className="cardio-mini-dock">
      <div className="cardio-mini-left">
        <div className="cardio-mini-dot" />
        <div style={{ minWidth: 0 }}>
          <div className="cardio-mini-top">Cardio em andamento</div>
          <div className="cardio-mini-sub">{info.title}</div>
        </div>
      </div>

      <div className="cardio-mini-time">{info.liveTime}</div>
    </button>
  );
}

/* ---------------- STYLES ---------------- */
const styles = `
  * { box-sizing: border-box; }

  .cardio-screen {
    min-height: 100vh;
    background: ${BG};
    padding: 18px;
    padding-bottom: calc(116px + env(safe-area-inset-bottom));
    color: ${TEXT};
  }

  .cardio-container {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
  }

  .cardio-card,
  .cardio-lock-card {
    position: relative;
    overflow: hidden;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,255,255,.94));
    border: 1px solid ${BORDER};
    box-shadow: 0 18px 70px rgba(15,23,42,.06);
    padding: 16px;
  }

  .cardio-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .cardio-back-btn {
    width: 46px;
    height: 46px;
    border-radius: 18px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.76);
    box-shadow: 0 14px 34px rgba(15,23,42,.06);
    color: ${TEXT};
    flex-shrink: 0;
  }

  .cardio-kicker {
    font-size: 11px;
    font-weight: 950;
    color: ${MUTED};
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .cardio-header-title {
    margin-top: 6px;
    font-size: 24px;
    line-height: 1.05;
    font-weight: 950;
    letter-spacing: -.04em;
  }

  .cardio-header-sub {
    margin-top: 10px;
    font-size: 13px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.4;
  }

  .cardio-badges {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cardio-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(15,23,42,.04);
    border: 1px solid ${BORDER};
    font-size: 12px;
    font-weight: 900;
  }

  .cardio-badge-strong {
    background: rgba(255,106,0,.10);
    border-color: rgba(255,106,0,.20);
  }

  .cardio-top-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1.08fr .92fr;
    gap: 14px;
  }

  .cardio-main-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 14px;
  }

  .cardio-main-col,
  .cardio-side-col {
    display: grid;
    gap: 14px;
    align-content: start;
  }

  .cardio-section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .cardio-section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 950;
    letter-spacing: -.03em;
  }

  .cardio-section-sub {
    margin: 6px 0 0;
    font-size: 13px;
    font-weight: 800;
    color: ${MUTED};
    line-height: 1.4;
  }

  .cardio-week-summary {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 14px;
    align-items: center;
  }

  .cardio-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .cardio-stat-box {
    min-height: 86px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .cardio-stat-label {
    font-size: 11px;
    color: ${MUTED};
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .cardio-stat-value {
    margin-top: 8px;
    font-size: 17px;
    font-weight: 950;
    line-height: 1.1;
  }

  .cardio-segmented {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .cardio-segment-btn {
    min-height: 52px;
    border-radius: 18px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    color: ${TEXT};
    font-size: 14px;
    font-weight: 950;
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
  }

  .cardio-segment-btn.active {
    background: #0B0B0C;
    color: #fff;
    border-color: rgba(255,255,255,.10);
  }

  .cardio-mode-help {
    margin-top: 12px;
    font-size: 13px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.4;
  }

  .cardio-current-panel {
    margin-top: 14px;
    display: grid;
    justify-items: center;
    gap: 14px;
  }

  .cardio-current-info {
    width: 100%;
    display: grid;
    gap: 8px;
  }

  .cardio-current-line {
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    font-size: 13px;
    font-weight: 800;
    color: ${MUTED};
    line-height: 1.4;
  }

  .cardio-current-line strong {
    color: ${TEXT};
  }

  .cardio-workout-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .cardio-workout-card {
    text-align: left;
    padding: 16px;
    min-height: 108px;
    border-radius: 22px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
  }

  .cardio-workout-card.active {
    background: linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,255,255,.96));
    border-color: rgba(255,106,0,.20);
  }

  .cardio-workout-name {
    font-size: 16px;
    font-weight: 950;
    line-height: 1.15;
    letter-spacing: -.02em;
  }

  .cardio-workout-sub {
    margin-top: 8px;
    font-size: 13px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.35;
  }

  .cardio-block {
    margin-top: 14px;
  }

  .cardio-block-title {
    font-size: 12px;
    color: ${MUTED};
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .cardio-time-editor {
    margin-top: 10px;
    display: grid;
    grid-template-columns: 52px 1fr 52px;
    gap: 10px;
    align-items: center;
  }

  .cardio-step-btn {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
    color: ${TEXT};
    display: grid;
    place-items: center;
  }

  .cardio-step-btn:disabled {
    opacity: .45;
  }

  .cardio-time-input-wrap,
  .cardio-kcal-input-wrap {
    min-height: 56px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border-radius: 20px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
  }

  .cardio-time-input,
  .cardio-kcal-input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${TEXT};
    font-size: 20px;
    font-weight: 950;
    letter-spacing: -.03em;
    min-width: 0;
  }

  .cardio-time-unit,
  .cardio-kcal-unit {
    white-space: nowrap;
    color: ${MUTED};
    font-size: 13px;
    font-weight: 900;
  }

  .cardio-presets {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .cardio-preset-btn {
    min-height: 46px;
    border-radius: 16px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    color: ${TEXT};
    font-size: 14px;
    font-weight: 950;
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
  }

  .cardio-preset-btn.active {
    background: rgba(255,106,0,.10);
    border-color: rgba(255,106,0,.20);
  }

  .cardio-preset-btn:disabled {
    opacity: .45;
  }

  .cardio-intensity-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .cardio-intensity-card {
    text-align: left;
    min-height: 108px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
  }

  .cardio-intensity-card.active {
    background: linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,255,255,.96));
    border-color: rgba(255,106,0,.20);
  }

  .cardio-intensity-title {
    font-size: 15px;
    font-weight: 950;
    line-height: 1.1;
  }

  .cardio-intensity-feel {
    margin-top: 8px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.35;
  }

  .cardio-estimate-box {
    margin-top: 14px;
    padding: 14px;
    border-radius: 22px;
    border: 1px solid rgba(255,106,0,.18);
    background: rgba(255,106,0,.06);
  }

  .cardio-estimate-title {
    font-size: 13px;
    font-weight: 950;
    color: ${TEXT};
  }

  .cardio-estimate-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .cardio-estimate-item {
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(15,23,42,.08);
    background: rgba(255,255,255,.82);
    display: grid;
    gap: 6px;
  }

  .cardio-estimate-item span {
    font-size: 11px;
    color: ${MUTED};
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .cardio-estimate-item strong {
    font-size: 15px;
    color: ${TEXT};
    font-weight: 950;
    line-height: 1.25;
    word-break: break-word;
  }

  .cardio-actions {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    align-items: stretch;
  }

  .cardio-primary-wide,
  .cardio-primary,
  .cardio-secondary {
    border-radius: 22px;
    font-weight: 950;
    font-size: 14px;
  }

  .cardio-primary-wide,
  .cardio-primary {
    border: none;
    background: #0B0B0C;
    color: #fff;
    box-shadow: 0 18px 44px rgba(0,0,0,.16);
  }

  .cardio-primary-wide {
    min-height: 58px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .cardio-btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 16px;
    background: rgba(255,255,255,.10);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .cardio-secondary {
    min-height: 58px;
    padding: 0 16px;
    border: 1px solid ${BORDER};
    background: rgba(255,255,255,.94);
    color: ${TEXT};
    box-shadow: 0 12px 30px rgba(15,23,42,.05);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .cardio-secondary:disabled,
  .cardio-primary-wide:disabled,
  .cardio-primary:disabled {
    opacity: .45;
  }

  .cardio-history-list {
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .cardio-history-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 14px;
    border-radius: 20px;
    background: rgba(255,255,255,.94);
    border: 1px solid ${BORDER};
  }

  .cardio-history-title {
    font-size: 14px;
    font-weight: 900;
    color: ${TEXT};
  }

  .cardio-history-meta {
    margin-top: 4px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.4;
  }

  .cardio-history-kcal {
    align-self: center;
    font-size: 14px;
    font-weight: 950;
    color: ${TEXT};
  }

  .cardio-empty {
    margin-top: 10px;
    padding: 16px;
    border-radius: 20px;
    border: 1px dashed rgba(15,23,42,.12);
    color: ${MUTED};
    font-size: 14px;
    line-height: 1.45;
    background: rgba(255,255,255,.84);
  }

  .cardio-side-buttons {
    margin-top: 14px;
    display: grid;
    gap: 10px;
  }

  .cardio-week-ring {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cardio-week-ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 18px;
  }

  .cardio-week-ring-value {
    font-size: 22px;
    font-weight: 950;
    line-height: 1;
  }

  .cardio-week-ring-label {
    margin-top: 8px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.25;
  }

  .cardio-week-ring-sub {
    margin-top: 6px;
    font-size: 11px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.25;
  }

  .cardio-main-ring {
    position: relative;
    width: 232px;
    height: 232px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cardio-main-ring.running {
    animation: cardioPulseV13 2.2s ease-in-out infinite;
  }

  .cardio-main-ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
  }

  .cardio-main-ring-top {
    font-size: 11px;
    color: ${MUTED};
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .cardio-main-ring-value {
    margin-top: 8px;
    font-size: 56px;
    line-height: .95;
    font-weight: 950;
    letter-spacing: -.06em;
    color: ${TEXT};
    font-variant-numeric: tabular-nums;
  }

  .cardio-main-ring-bottom {
    margin-top: 8px;
    font-size: 13px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.3;
  }

  .cardio-finish-banner {
    width: 100%;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid rgba(34,197,94,.18);
    background: rgba(34,197,94,.08);
  }

  .cardio-finish-title {
    font-size: 14px;
    font-weight: 950;
    color: ${TEXT};
  }

  .cardio-finish-text {
    margin-top: 6px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.4;
  }

  .cardio-timeline {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
  }

  .cardio-timeline-item {
    text-align: center;
  }

  .cardio-timeline-bubble {
    width: 18px;
    height: 18px;
    margin: 0 auto 8px;
    border-radius: 999px;
    background: rgba(15,23,42,.08);
    box-shadow: 0 0 0 6px rgba(15,23,42,.02);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cardio-timeline-bubble span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(15,23,42,.34);
  }

  .cardio-timeline-bubble.done {
    background: linear-gradient(180deg, rgba(255,106,0,.96), rgba(255,178,107,.96));
    box-shadow: 0 0 0 6px rgba(255,106,0,.08);
  }

  .cardio-timeline-bubble.done span {
    background: rgba(255,255,255,.94);
  }

  .cardio-timeline-day {
    font-size: 12px;
    color: ${TEXT};
    font-weight: 800;
    text-transform: capitalize;
  }

  .cardio-timeline-min {
    margin-top: 4px;
    font-size: 11px;
    color: ${MUTED};
    font-weight: 800;
  }

  .cardio-dock {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 999;
    border-radius: 26px;
    padding: 12px;
    background: rgba(255,255,255,.94);
    border: 1px solid rgba(255,255,255,.45);
    box-shadow: 0 28px 90px rgba(0,0,0,.18);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    overflow: hidden;
    cursor: pointer;
  }

  .cardio-dock-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .cardio-dock-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 999px;
    background: rgba(255,106,0,.10);
    border: 1px solid rgba(255,106,0,.18);
    min-width: 0;
  }

  .cardio-dock-icon {
    width: 34px;
    height: 34px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(255,255,255,.55);
    flex-shrink: 0;
  }

  .cardio-dock-title {
    font-size: 12px;
    font-weight: 950;
    color: ${TEXT};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cardio-dock-mini {
    display: grid;
    justify-items: end;
    gap: 2px;
    flex-shrink: 0;
  }

  .cardio-dock-mini-time {
    font-size: 14px;
    font-weight: 950;
    color: ${TEXT};
    font-variant-numeric: tabular-nums;
  }

  .cardio-dock-mini-state {
    font-size: 11px;
    font-weight: 900;
    color: ${MUTED};
  }

  .cardio-dock-body {
    margin-top: 12px;
    cursor: default;
  }

  .cardio-dock-big-time {
    font-size: 34px;
    font-weight: 950;
    letter-spacing: -.05em;
    font-variant-numeric: tabular-nums;
  }

  .cardio-dock-sub {
    margin-top: 6px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.4;
  }

  .cardio-dock-sub strong {
    color: ${TEXT};
  }

  .cardio-dock-actions {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    align-items: stretch;
  }

  .cardio-dock-hint {
    margin-top: 10px;
    font-size: 11px;
    color: ${MUTED};
    font-weight: 800;
  }

  .cardio-mini-dock {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(84px + env(safe-area-inset-bottom));
    z-index: 9999;
    border-radius: 22px;
    padding: 12px;
    background: rgba(255,255,255,.94);
    border: 1px solid rgba(255,255,255,.45);
    box-shadow: 0 22px 70px rgba(0,0,0,.18);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: ${TEXT};
  }

  .cardio-mini-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .cardio-mini-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${ORANGE};
    box-shadow: 0 0 0 6px rgba(255,106,0,.12);
    flex-shrink: 0;
  }

  .cardio-mini-top {
    font-size: 12px;
    font-weight: 950;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cardio-mini-sub {
    margin-top: 2px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cardio-mini-time {
    font-size: 14px;
    font-weight: 950;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .cardio-lock-card {
    max-width: 520px;
    margin: 32px auto 0;
    text-align: center;
  }

  .cardio-lock-title {
    font-size: 18px;
    font-weight: 950;
    color: ${TEXT};
  }

  .cardio-lock-text {
    margin-top: 8px;
    font-size: 14px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.5;
  }

  .cardio-primary {
    width: 100%;
    min-height: 56px;
    margin-top: 14px;
  }

  .cardio-toast-wrap {
    position: fixed;
    left: 12px;
    right: 12px;
    top: calc(12px + env(safe-area-inset-top));
    z-index: 99999;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .cardio-toast {
    width: min(520px, 100%);
    border-radius: 22px;
    padding: 12px;
    background: rgba(255,255,255,.94);
    border: 1px solid rgba(255,255,255,.45);
    box-shadow: 0 22px 70px rgba(0,0,0,.18);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
  }

  .cardio-toast-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .cardio-toast-title {
    font-size: 13px;
    font-weight: 950;
    color: ${TEXT};
  }

  .cardio-toast-text {
    margin-top: 2px;
    font-size: 12px;
    color: ${MUTED};
    font-weight: 800;
    line-height: 1.3;
  }

  .cardio-toast-close {
    margin-left: auto;
    width: 40px;
    height: 40px;
    border-radius: 16px;
    border: none;
    background: rgba(15,23,42,.06);
    color: ${TEXT};
    font-size: 20px;
    line-height: 1;
  }

  button {
    appearance: none;
    cursor: pointer;
    transition: transform .14s ease, opacity .14s ease, filter .14s ease;
  }

  button:active {
    transform: scale(.99);
  }

  input {
    appearance: none;
  }

  @keyframes cardioPulseV13 {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.015); }
  }

  @media (max-width: 980px) {
    .cardio-top-grid,
    .cardio-main-grid {
      grid-template-columns: 1fr;
    }

    .cardio-side-col {
      order: 3;
    }
  }

  @media (max-width: 720px) {
    .cardio-screen {
      padding: 14px;
      padding-bottom: calc(118px + env(safe-area-inset-bottom));
    }

    .cardio-header-title {
      font-size: 22px;
    }

    .cardio-week-summary {
      grid-template-columns: 1fr;
      justify-items: center;
    }

    .cardio-stats-grid {
      width: 100%;
      grid-template-columns: 1fr;
    }

    .cardio-workout-grid {
      grid-template-columns: 1fr;
    }

    .cardio-intensity-grid {
      grid-template-columns: 1fr;
    }

    .cardio-presets {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cardio-estimate-grid {
      grid-template-columns: 1fr;
    }

    .cardio-actions,
    .cardio-dock-actions {
      grid-template-columns: 1fr;
    }

    .cardio-segmented {
      grid-template-columns: 1fr;
    }

    .cardio-timeline {
      gap: 6px;
    }

    .cardio-main-ring {
      width: 206px;
      height: 206px;
    }

    .cardio-main-ring-value {
      font-size: 46px;
    }

    .cardio-dock-head {
      gap: 10px;
    }

    .cardio-dock-pill {
      min-width: 0;
      flex: 1 1 auto;
    }

    .cardio-dock-title {
      white-space: normal;
      line-height: 1.2;
    }
  }
`;
