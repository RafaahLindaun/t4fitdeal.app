import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Cardio.jsx
 * - Timer real com contagem regressiva
 * - Cronômetro real
 * - Modo por calorias
 * - Persistência live em localStorage
 * - MiniDock global
 * - Vibração ao concluir
 * - Toaster leve
 * - Ring principal animado no estilo Apple Fitness
 * - Layout encaixado e responsivo
 */

const APP_ORANGE = "#FF6A00";
const APP_ACCENT = "#FFB26B";
const APP_BG = "#ffffff";
const APP_TEXT = "#0b1220";
const APP_MUTED = "#6b7280";
const APP_LINE = "rgba(11,18,32,0.08)";
const APP_SOFT = "#f8fafc";
const APP_GREEN = "#22c55e";

const WEEKLY_GOAL_MINUTES = 150;
const STORAGE_KEY = "cardio_sessions_v7";
const LIVE_KEY = "cardio_live_v7";

const WORKOUTS = [
  { id: "walk", name: "Caminhada", subtitle: "Constante, leve e fácil de manter", mets: { low: 3.0, moderate: 4.8, high: 5.5 } },
  { id: "treadmill", name: "Esteira", subtitle: "Controle total de ritmo e tempo", mets: { low: 4.0, moderate: 5.2, high: 6.3 } },
  { id: "bike", name: "Bike", subtitle: "Baixo impacto e boa queima", mets: { low: 4.0, moderate: 6.8, high: 8.0 } },
  { id: "run", name: "Corrida leve", subtitle: "Mais resultado em menos tempo", mets: { low: 6.0, moderate: 8.3, high: 9.8 } },
  { id: "stairs", name: "Escada", subtitle: "Puxa perna, fôlego e foco", mets: { low: 5.0, moderate: 8.8, high: 9.5 } },
  { id: "hiit", name: "HIIT", subtitle: "Curto, intenso e direto", mets: { low: 6.0, moderate: 8.0, high: 10.0 } },
];

const INTENSITIES = {
  low: { label: "Leve", multiplier: 0.85, feel: "Você conversa normalmente" },
  moderate: { label: "Moderado", multiplier: 1.0, feel: "Respiração acelerada, controlada" },
  high: { label: "Intenso", multiplier: 1.15, feel: "Esforço alto, curta duração" },
};

const DURATIONS = [10, 15, 20, 25, 30, 40, 45, 60];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getLast7Days() {
  const base = new Date();
  const res = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    res.push(d);
  }
  return res;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatMMSS(sec) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function vibrate(ms = 18) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {}
}

function getLiveState() {
  if (typeof window === "undefined") return null;
  return safeParse(localStorage.getItem(LIVE_KEY), null);
}

function setLiveState(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIVE_KEY, JSON.stringify(data));
  } catch {}
}

function clearLiveState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LIVE_KEY);
  } catch {}
}

function computeLiveSeconds(live) {
  if (!live) return 0;

  if (!live.running) {
    return Number(live.elapsedSec || 0);
  }

  const startedAt = Number(live.startedAt || 0);
  const baseElapsed = Number(live.elapsedSec || 0);
  const now = Date.now();
  const extra = Math.max(0, Math.floor((now - startedAt) / 1000));
  return baseElapsed + extra;
}

function RingProgress({ progress = 0, size = 150, stroke = 12, value, label, sublabel, glow = false }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`ring-wrap ${glow ? "ring-glow" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-svg" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(11,17,24,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradMain)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 240ms ease" }}
        />
        <defs>
          <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={APP_ORANGE} />
            <stop offset="100%" stopColor={APP_ACCENT} />
          </linearGradient>
        </defs>
      </svg>

      <div className="ring-center">
        <div className="ring-value">{value}</div>
        <div className="ring-label">{label}</div>
        {sublabel ? <div className="ring-sub">{sublabel}</div> : null}
      </div>
    </div>
  );
}

function BigActivityRing({
  progress = 0,
  value = "00:00",
  top = "timer",
  bottom = "",
  size = 268,
  stroke = 18,
  animated = false,
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`activity-ring ${animated ? "activity-ring-animated" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="activity-ring-svg" aria-hidden>
        <defs>
          <linearGradient id="activityGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={APP_ORANGE} />
            <stop offset="100%" stopColor={APP_ACCENT} />
          </linearGradient>
          <filter id="activityGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(11,18,32,0.06)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#activityGradientMain)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#activityGlow)"
          style={{ transition: "stroke-dashoffset 220ms ease" }}
        />
      </svg>

      <div className="activity-ring-center">
        <div className="activity-top">{top}</div>
        <div className="activity-value">{value}</div>
        {bottom ? <div className="activity-bottom">{bottom}</div> : null}
      </div>
    </div>
  );
}

function WeekTimeline({ sessions }) {
  const days = getLast7Days();

  return (
    <section className="card timeline-card">
      <div className="section-head">
        <div>
          <h3 className="section-title">Seu ritmo da semana</h3>
          <p className="section-sub">Visual simples para enxergar constância.</p>
        </div>
      </div>

      <div className="timeline-row">
        {days.map((day) => {
          const key = getDateKey(day);
          const daySessions = sessions.filter((s) => s.date === key);
          const totalMin = daySessions.reduce((a, b) => a + (b.minutes || 0), 0);
          const done = daySessions.length > 0;
          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
            .format(day)
            .replace(".", "");

          return (
            <div className="timeline-item" key={key}>
              <div className={`bubble ${done ? "done" : ""}`}>
                <span className="bubble-inner" />
              </div>
              <div className="timeline-day">{weekday}</div>
              <div className="timeline-min">{done ? `${totalMin} min` : "—"}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="cardio-toast-wrap" role="status" aria-live="polite">
      <div className="cardio-toast">
        <div className={`cardio-toast-dot ${toast.type === "success" ? "ok" : ""}`} />
        <div style={{ minWidth: 0 }}>
          <div className="cardio-toast-title">{toast.title}</div>
          <div className="cardio-toast-text">{toast.text}</div>
        </div>
        <button type="button" className="cardio-toast-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  );
}

export default function Cardio({ userWeightKg = 80 }) {
  const nav = useNavigate();
  const plannerRef = useRef(null);
  const liveTimerRef = useRef(null);

  const [mode, setMode] = useState("timer");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("bike");
  const [selectedIntensity, setSelectedIntensity] = useState("moderate");
  const [minutes, setMinutes] = useState(25);
  const [calTarget, setCalTarget] = useState("");
  const [toast, setToast] = useState(null);

  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(25 * 60);
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedWorkout = useMemo(
    () => WORKOUTS.find((w) => w.id === selectedWorkoutId) || WORKOUTS[0],
    [selectedWorkoutId]
  );

  const intensityInfo = INTENSITIES[selectedIntensity] || INTENSITIES.moderate;

  const metNow = useMemo(() => {
    const base = selectedWorkout?.mets?.moderate || 5.5;
    return +(base * intensityInfo.multiplier).toFixed(2);
  }, [selectedWorkout, intensityInfo]);

  const kcalPerMin = useMemo(
    () => (metNow * 3.5 * (userWeightKg || 80)) / 200,
    [metNow, userWeightKg]
  );

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

  const completedToday = todaySessions.length > 0;

  const displayDurationSec = mode === "timer" ? durationSec : 0;
  const timerRemainingSec = Math.max(0, displayDurationSec - elapsedSec);
  const timerProgress = displayDurationSec > 0 ? clamp((elapsedSec / displayDurationSec) * 100, 0, 100) : 0;

  const chronoMinutes = Math.max(1, Math.round(elapsedSec / 60));
  const liveEstimatedKcal = Math.round((elapsedSec / 60) * kcalPerMin);

  useEffect(() => {
    const live = getLiveState();
    if (!live) {
      setDurationSec(minutes * 60);
      return;
    }

    setMode(live.mode || "timer");
    setSelectedWorkoutId(live.selectedWorkoutId || "bike");
    setSelectedIntensity(live.selectedIntensity || "moderate");
    setMinutes(Number(live.minutes || 25));
    setDurationSec(Number(live.durationSec || 25 * 60));

    const computedElapsed = computeLiveSeconds(live);
    setElapsedSec(computedElapsed);
    setRunning(!!live.running);
  }, []);

  useEffect(() => {
    if (mode === "timer" && !running) {
      setDurationSec(minutes * 60);
    }
  }, [minutes, mode, running]);

  useEffect(() => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }

    const sync = () => {
      const live = getLiveState();
      if (!live) return;

      const computedElapsed = computeLiveSeconds(live);
      setElapsedSec(computedElapsed);
      setRunning(!!live.running);

      if (live.mode === "timer") {
        const total = Number(live.durationSec || 0);
        setDurationSec(total);

        if (computedElapsed >= total && live.running) {
          const finalElapsed = total;
          setElapsedSec(finalElapsed);
          setRunning(false);
          setJustFinished(true);

          setLiveState({
            ...live,
            running: false,
            elapsedSec: finalElapsed,
            startedAt: 0,
            finishedAt: Date.now(),
          });

          vibrate([40, 60, 40]);
          setToast({
            type: "success",
            title: "Timer concluído",
            text: "Seu cardio terminou. Você pode salvar a sessão agora.",
          });
        }
      }
    };

    sync();
    liveTimerRef.current = setInterval(sync, 250);

    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
        liveTimerRef.current = null;
      }
    };
  }, []);

  function persistLive(next) {
    setLiveState({
      selectedWorkoutId,
      selectedIntensity,
      minutes,
      durationSec,
      mode,
      ...next,
    });
  }

  function startTimerMode() {
    setJustFinished(false);
    const total = minutes * 60;
    const live = getLiveState();

    if (live && live.mode === "timer" && !live.running && Number(live.elapsedSec || 0) > 0 && Number(live.durationSec || 0) === total) {
      persistLive({
        mode: "timer",
        durationSec: total,
        running: true,
        elapsedSec: Number(live.elapsedSec || 0),
        startedAt: Date.now(),
      });
      setRunning(true);
      vibrate(10);
      return;
    }

    persistLive({
      mode: "timer",
      durationSec: total,
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    });
    setElapsedSec(0);
    setDurationSec(total);
    setRunning(true);
    vibrate(10);
  }

  function startChronoMode() {
    setJustFinished(false);
    const live = getLiveState();

    if (live && live.mode === "chrono" && !live.running && Number(live.elapsedSec || 0) > 0) {
      persistLive({
        mode: "chrono",
        running: true,
        elapsedSec: Number(live.elapsedSec || 0),
        startedAt: Date.now(),
      });
      setRunning(true);
      vibrate(10);
      return;
    }

    persistLive({
      mode: "chrono",
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
    });
    setElapsedSec(0);
    setRunning(true);
    vibrate(10);
  }

  function pauseLive() {
    const live = getLiveState();
    if (!live) return;

    const computedElapsed = computeLiveSeconds(live);

    persistLive({
      ...live,
      running: false,
      elapsedSec: computedElapsed,
      startedAt: 0,
    });

    setElapsedSec(computedElapsed);
    setRunning(false);
    vibrate(8);
  }

  function resetLive() {
    setJustFinished(false);

    if (mode === "timer") {
      persistLive({
        mode: "timer",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        durationSec: minutes * 60,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setDurationSec(minutes * 60);
      setRunning(false);
      vibrate(8);
      return;
    }

    persistLive({
      mode: "chrono",
      running: false,
      elapsedSec: 0,
      startedAt: 0,
    });
    setElapsedSec(0);
    setRunning(false);
    vibrate(8);
  }

  function saveSessionFromMinutes(mins, modeLabel = "manual") {
    const safeMinutes = Math.max(1, Math.round(mins));
    const kcal = Math.round(safeMinutes * kcalPerMin);

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      date: todayKey,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      intensity: selectedIntensity,
      intensityLabel: intensityInfo.label,
      minutes: safeMinutes,
      calories: kcal,
      weightKg: userWeightKg,
      mode: modeLabel,
    };

    setSessions((prev) => [entry, ...prev].slice(0, 200));
  }

  function handleTimerSave() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    saveSessionFromMinutes(doneMinutes, "timer");
    persistLive({
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

  function handleChronoSave() {
    const mins = Math.max(1, Math.round(elapsedSec / 60));
    saveSessionFromMinutes(mins, "chrono");
    persistLive({
      mode: "chrono",
      running: false,
      elapsedSec: 0,
      startedAt: 0,
    });
    setElapsedSec(0);
    setRunning(false);
    setJustFinished(false);
    vibrate(20);
    setToast({
      type: "success",
      title: "Sessão salva",
      text: `${mins} min registrados com sucesso.`,
    });
  }

  function handleCaloriesStartOrSave() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;

    const minutesNeeded = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    setMinutes(minutesNeeded);
    setMode("timer");

    setLiveState({
      selectedWorkoutId,
      selectedIntensity,
      minutes: minutesNeeded,
      durationSec: minutesNeeded * 60,
      mode: "timer",
      running: true,
      elapsedSec: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    });

    setDurationSec(minutesNeeded * 60);
    setElapsedSec(0);
    setRunning(true);
    setJustFinished(false);
    vibrate(10);
    setToast({
      type: "success",
      title: "Meta iniciada",
      text: `${minutesNeeded} min estimados para bater ${kcal} kcal.`,
    });
  }

  function switchMode(nextMode) {
    if (running) pauseLive();
    setMode(nextMode);
    setJustFinished(false);

    if (nextMode === "timer") {
      setLiveState({
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: minutes * 60,
        mode: "timer",
        running: false,
        elapsedSec: 0,
        startedAt: 0,
        finishedAt: 0,
      });
      setElapsedSec(0);
      setDurationSec(minutes * 60);
      setRunning(false);
    }

    if (nextMode === "chrono") {
      setLiveState({
        selectedWorkoutId,
        selectedIntensity,
        minutes,
        durationSec: 0,
        mode: "chrono",
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

  const activityValue =
    mode === "timer"
      ? formatMMSS(timerRemainingSec)
      : mode === "chrono"
      ? formatMMSS(elapsedSec)
      : (() => {
          const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
          if (!kcal) return "--:--";
          const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
          return `${pad2(mins)}:00`;
        })();

  const activityTop =
    mode === "timer"
      ? running
        ? "timer em andamento"
        : "timer"
      : mode === "chrono"
      ? running
        ? "cronômetro em andamento"
        : "cronômetro"
      : "por calorias";

  const activityBottom =
    mode === "timer"
      ? `${Math.round((elapsedSec / 60) * kcalPerMin)} kcal`
      : mode === "chrono"
      ? `${liveEstimatedKcal} kcal`
      : calTarget
      ? `${calTarget} kcal alvo`
      : "defina sua meta";

  return (
    <div className="cardio-screen">
      <style>{`
        :root {
          --app-orange: ${APP_ORANGE};
          --app-accent: ${APP_ACCENT};
          --app-bg: ${APP_BG};
          --app-text: ${APP_TEXT};
          --app-muted: ${APP_MUTED};
          --app-line: ${APP_LINE};
          --app-soft: ${APP_SOFT};
          --app-green: ${APP_GREEN};
        }

        * {
          box-sizing: border-box;
          min-width: 0;
        }

        html, body, #root {
          background: var(--app-bg);
          width: 100%;
          overflow-x: hidden;
        }

        .cardio-screen {
          width: 100%;
          min-height: 100dvh;
          padding:
            calc(14px + env(safe-area-inset-top))
            12px
            calc(120px + env(safe-area-inset-bottom))
            12px;
          color: var(--app-text);
          background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          overflow-x: hidden;
        }

        .container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .card {
          width: 100%;
          border-radius: 22px;
          padding: 20px;
          background: #fff;
          border: 1px solid var(--app-line);
          box-shadow:
            0 8px 30px rgba(11, 17, 24, 0.04),
            0 2px 8px rgba(11, 17, 24, 0.03);
        }

        .hero {
          display: grid;
          grid-template-columns: 148px minmax(0, 1fr);
          gap: 20px;
          align-items: center;
          margin-bottom: 16px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,106,0,0.08), rgba(255,178,107,0.05));
          color: var(--app-muted);
          font-weight: 700;
          font-size: 13px;
          width: fit-content;
        }

        h1.title {
          margin: 10px 0 6px 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.02;
          color: var(--app-text);
          letter-spacing: -0.04em;
          font-weight: 800;
        }

        .subtitle {
          margin: 0;
          color: var(--app-muted);
          font-size: 14px;
          line-height: 1.55;
          max-width: 72ch;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .stat {
          background: linear-gradient(180deg, #ffffff, #ffffff);
          border-radius: 16px;
          padding: 14px;
          border: 1px solid var(--app-line);
        }

        .stat .label {
          font-size: 12px;
          color: var(--app-muted);
          margin-bottom: 6px;
          font-weight: 700;
        }

        .stat .value {
          font-weight: 800;
          font-size: 18px;
          color: var(--app-text);
          letter-spacing: -0.02em;
        }

        .modes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .mode-btn {
          width: 100%;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1px solid var(--app-line);
          background: #fff;
          font-weight: 700;
          cursor: pointer;
          color: var(--app-text);
        }

        .mode-btn.active {
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          color: #111;
          box-shadow: 0 8px 28px rgba(255,106,0,0.08);
          border-color: transparent;
        }

        .content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
          gap: 16px;
          margin-top: 16px;
          align-items: start;
        }

        .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .section-title {
          margin: 0;
          font-size: 20px;
          line-height: 1.1;
          font-weight: 800;
          color: var(--app-text);
          letter-spacing: -0.03em;
        }

        .section-sub {
          margin: 6px 0 0 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--app-muted);
        }

        .workout-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .workout-card {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--app-line);
          background: #fff;
          text-align: left;
          cursor: pointer;
          min-height: 104px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .workout-card.active {
          border-color: rgba(255,106,0,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
          background: linear-gradient(180deg, rgba(255,106,0,0.04), rgba(255,255,255,1));
        }

        .workout-name {
          font-weight: 800;
          font-size: 15px;
          color: var(--app-text);
          letter-spacing: -0.02em;
        }

        .workout-sub {
          font-size: 13px;
          color: var(--app-muted);
          margin-top: 6px;
          line-height: 1.45;
        }

        .control {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .label {
          font-size: 13px;
          color: var(--app-muted);
          font-weight: 700;
        }

        .durations {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .chip {
          padding: 11px 13px;
          border-radius: 13px;
          border: 1px solid var(--app-line);
          background: #fff;
          cursor: pointer;
          font-weight: 700;
          color: var(--app-text);
        }

        .chip.active {
          background: linear-gradient(90deg, rgba(255,106,0,0.12), rgba(255,178,107,0.06));
          color: #111;
          border-color: rgba(255,106,0,0.14);
        }

        .intensity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .intensity-card {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid var(--app-line);
          background: #fff;
          min-height: 112px;
          cursor: pointer;
        }

        .intensity-card.active {
          border-color: rgba(255,106,0,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
          background: linear-gradient(180deg, rgba(255,106,0,0.04), rgba(255,255,255,1));
        }

        .estimate {
          margin-top: 8px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid var(--app-line);
          background: linear-gradient(180deg, #ffffff, #ffffff);
        }

        .estimate .big {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 800;
          color: var(--app-text);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .timer-panel {
          border-radius: 20px;
          border: 1px solid var(--app-line);
          background: linear-gradient(180deg, #fff, #fff);
          padding: 18px;
          display: grid;
          justify-items: center;
          gap: 12px;
        }

        .actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .primary {
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          border: none;
          padding: 13px 16px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          color: #111;
          min-height: 48px;
        }

        .ghost {
          background: transparent;
          border: 1px solid var(--app-line);
          padding: 13px 14px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          color: var(--app-text);
          min-height: 48px;
        }

        .primary:disabled,
        .ghost:disabled,
        .chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--app-line);
          background: #fff;
          align-items: center;
        }

        .empty {
          padding: 14px;
          border-radius: 12px;
          border: 1px dashed rgba(11,17,24,0.10);
          color: var(--app-muted);
          background: var(--app-soft);
        }

        .timeline-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
          margin-top: 6px;
        }

        .timeline-item {
          text-align: center;
          min-width: 0;
        }

        .bubble {
          width: 18px;
          height: 18px;
          margin: 0 auto 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(11,17,24,0.08);
          box-shadow: 0 0 0 6px rgba(11,17,24,0.02);
        }

        .bubble-inner {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(11,17,24,0.30);
        }

        .bubble.done {
          background: linear-gradient(180deg, var(--app-orange), var(--app-accent));
          box-shadow: 0 0 0 6px rgba(255,106,0,0.08);
        }

        .bubble.done .bubble-inner {
          background: #fff;
        }

        .timeline-day {
          font-size: 12px;
          font-weight: 700;
          color: var(--app-text);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timeline-min {
          font-size: 11px;
          color: var(--app-muted);
          margin-top: 4px;
          line-height: 1.3;
        }

        .ring-wrap {
          position: relative;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-inline: auto;
        }

        .ring-svg {
          max-width: 100%;
          height: auto;
          overflow: visible;
        }

        .ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
        }

        .ring-value {
          font-weight: 800;
          font-size: 20px;
          color: var(--app-text);
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .ring-label {
          font-size: 12px;
          color: var(--app-muted);
          margin-top: 6px;
        }

        .ring-sub {
          font-size: 11px;
          color: rgba(11,17,24,0.6);
          margin-top: 4px;
          line-height: 1.35;
        }

        .ring-glow {
          animation: ringPulse 1.8s ease-in-out infinite;
        }

        .activity-ring {
          position: relative;
          width: min(100%, 268px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
        }

        .activity-ring-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .activity-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px;
        }

        .activity-top {
          font-size: 12px;
          color: var(--app-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .activity-value {
          font-size: clamp(42px, 10vw, 64px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.06em;
          color: var(--app-text);
          margin-top: 6px;
        }

        .activity-bottom {
          margin-top: 8px;
          font-size: 13px;
          color: var(--app-muted);
          line-height: 1.4;
          font-weight: 700;
        }

        .activity-ring-animated {
          animation: ringPulse 2.1s ease-in-out infinite;
        }

        .finish-banner {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06));
          border: 1px solid rgba(34,197,94,0.18);
          color: var(--app-text);
        }

        .side-buttons {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .full-input {
          margin-top: 8px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--app-line);
          width: 100%;
          font-size: 15px;
          color: var(--app-text);
          background: #fff;
          outline: none;
        }

        .full-input:focus {
          border-color: rgba(255,106,0,0.28);
          box-shadow: 0 0 0 4px rgba(255,106,0,0.08);
        }

        .cardio-toast-wrap {
          position: fixed;
          left: 12px;
          right: 12px;
          top: calc(10px + env(safe-area-inset-top));
          z-index: 99999;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .cardio-toast {
          width: min(520px, 100%);
          border-radius: 18px;
          padding: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(11,18,32,0.08);
          box-shadow: 0 16px 40px rgba(11,18,32,0.12);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          pointer-events: auto;
        }

        .cardio-toast-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--app-orange);
          box-shadow: 0 0 0 6px rgba(255,106,0,0.08);
          flex-shrink: 0;
        }

        .cardio-toast-dot.ok {
          background: var(--app-green);
          box-shadow: 0 0 0 6px rgba(34,197,94,0.08);
        }

        .cardio-toast-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--app-text);
        }

        .cardio-toast-text {
          margin-top: 2px;
          font-size: 12px;
          color: var(--app-muted);
          line-height: 1.35;
        }

        .cardio-toast-close {
          margin-left: auto;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--app-line);
          background: #fff;
          color: var(--app-text);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          flex-shrink: 0;
        }

        @keyframes ringPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.012);
          }
        }

        @media (max-width: 1100px) {
          .content {
            grid-template-columns: 1fr 320px;
          }
        }

        @media (max-width: 920px) {
          .content {
            grid-template-columns: 1fr;
          }

          .hero {
            grid-template-columns: 128px minmax(0, 1fr);
            gap: 16px;
          }

          .ring-wrap {
            width: 128px;
            height: 128px;
          }
        }

        @media (max-width: 720px) {
          .cardio-screen {
            padding:
              calc(12px + env(safe-area-inset-top))
              10px
              calc(110px + env(safe-area-inset-bottom))
              10px;
          }

          .card {
            padding: 16px;
            border-radius: 18px;
          }

          .hero {
            grid-template-columns: 1fr;
            justify-items: center;
          }

          .hero > div:last-child {
            width: 100%;
          }

          .hero-stats,
          .modes,
          .workout-grid,
          .intensity-grid {
            grid-template-columns: 1fr;
          }

          .timeline-row {
            grid-template-columns: repeat(7, minmax(38px, 1fr));
            gap: 6px;
          }

          .actions {
            flex-direction: column;
          }

          .actions .primary,
          .actions .ghost {
            width: 100%;
          }

          .side-buttons {
            grid-template-columns: 1fr;
          }

          h1.title {
            font-size: clamp(26px, 8vw, 34px);
          }

          .activity-ring {
            width: min(100%, 246px);
          }
        }

        @media (max-width: 420px) {
          .ring-wrap {
            width: 120px;
            height: 120px;
          }

          .ring-value {
            font-size: 18px;
          }

          .timeline-day {
            font-size: 11px;
          }

          .timeline-min {
            font-size: 10px;
          }

          .workout-card,
          .intensity-card {
            min-height: auto;
          }
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="container">
        <section className="card hero">
          <RingProgress
            progress={weekProgress}
            value={`${weekMinutes} min`}
            label="meta semanal"
            sublabel={weekProgress >= 100 ? "fechou!" : `faltam ${minutesLeft} min`}
            glow
          />

          <div>
            <div className="kicker">Cardio · foco e constância</div>
            <h1 className="title">
              {completedToday ? "Cardio de hoje concluído" : "Feche seu cardio de hoje"}
            </h1>
            <p className="subtitle">
              {completedToday
                ? `Hoje: ${todayMinutes} min • ${todayKcal} kcal`
                : `${minutes} min de ${selectedWorkout.name.toLowerCase()} em ritmo ${INTENSITIES[selectedIntensity].label.toLowerCase()} — ~${Math.round(kcalPerMin)} kcal/min`}
            </p>

            <div className="hero-stats">
              <div className="stat">
                <div className="label">Hoje</div>
                <div className="value">{todayMinutes} min</div>
              </div>
              <div className="stat">
                <div className="label">Calorias hoje</div>
                <div className="value">{todayKcal} kcal</div>
              </div>
              <div className="stat">
                <div className="label">Semana</div>
                <div className="value">{weekMinutes}/{WEEKLY_GOAL_MINUTES} min</div>
              </div>
            </div>

            <div className="modes" role="tablist" aria-label="Modos cardio">
              <button className={`mode-btn ${mode === "timer" ? "active" : ""}`} onClick={() => switchMode("timer")}>
                Timer
              </button>
              <button className={`mode-btn ${mode === "chrono" ? "active" : ""}`} onClick={() => switchMode("chrono")}>
                Cronômetro
              </button>
              <button className={`mode-btn ${mode === "calories" ? "active" : ""}`} onClick={() => switchMode("calories")}>
                Por calorias
              </button>
            </div>
          </div>
        </section>

        <div className="content">
          <div className="card">
            <div className="section-head">
              <div>
                <h3 className="section-title">Escolha seu cardio</h3>
                <p className="section-sub">Opções limpas e diretas.</p>
              </div>
            </div>

            <div className="workout-grid">
              {WORKOUTS.map((w) => (
                <div
                  key={w.id}
                  className={`workout-card ${selectedWorkoutId === w.id ? "active" : ""}`}
                  onClick={() => setSelectedWorkoutId(w.id)}
                >
                  <div className="workout-name">{w.name}</div>
                  <div className="workout-sub">{w.subtitle}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 16 }} />

            <div className="section-head">
              <div>
                <h3 className="section-title">Ajustes</h3>
                <p className="section-sub">Tempo, intensidade e estimativas claras.</p>
              </div>
            </div>

            <div className="control" ref={plannerRef}>
              {(mode === "timer" || mode === "chrono") && (
                <div className="timer-panel">
                  <BigActivityRing
                    progress={mode === "timer" ? timerProgress : 100}
                    value={activityValue}
                    top={activityTop}
                    bottom={activityBottom}
                    animated={running}
                  />

                  {mode === "timer" && justFinished ? (
                    <div className="finish-banner">
                      <div style={{ fontWeight: 800, color: APP_TEXT }}>Cardio concluído</div>
                      <div style={{ color: APP_MUTED, fontSize: 13, marginTop: 4 }}>
                        Seu timer terminou. Toque em <strong>Salvar sessão</strong> para registrar.
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {mode === "timer" && (
                <>
                  <div>
                    <div className="label">Quanto tempo?</div>
                    <div className="durations">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          className={`chip ${minutes === d ? "active" : ""}`}
                          onClick={() => {
                            setMinutes(d);
                            if (!running) {
                              setDurationSec(d * 60);
                            }
                          }}
                          disabled={running}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="label">Intensidade</div>
                    <div className="intensity-grid">
                      {Object.entries(INTENSITIES).map(([k, v]) => (
                        <div
                          key={k}
                          className={`intensity-card ${selectedIntensity === k ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(k)}
                        >
                          <div style={{ fontWeight: 800, color: APP_TEXT }}>{v.label}</div>
                          <div style={{ marginTop: 6, color: APP_MUTED, lineHeight: 1.45 }}>{v.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa</div>
                    <div className="big">~ {Math.round((elapsedSec / 60) * kcalPerMin)} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6, lineHeight: 1.45 }}>
                      Em {formatMMSS(elapsedSec)} • {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    {!running ? (
                      <button className="primary" onClick={startTimerMode}>
                        {elapsedSec > 0 && !justFinished ? "Continuar timer" : "Iniciar timer"}
                      </button>
                    ) : (
                      <button className="primary" onClick={pauseLive}>
                        Pausar
                      </button>
                    )}
                    <button className="ghost" onClick={resetLive}>
                      Reset
                    </button>
                    <button className="ghost" onClick={handleTimerSave} disabled={elapsedSec < 30}>
                      Salvar sessão
                    </button>
                  </div>
                </>
              )}

              {mode === "chrono" && (
                <>
                  <div>
                    <div className="label">Intensidade</div>
                    <div className="intensity-grid">
                      {Object.entries(INTENSITIES).map(([k, v]) => (
                        <div
                          key={k}
                          className={`intensity-card ${selectedIntensity === k ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(k)}
                        >
                          <div style={{ fontWeight: 800, color: APP_TEXT }}>{v.label}</div>
                          <div style={{ marginTop: 6, color: APP_MUTED, lineHeight: 1.45 }}>{v.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa atualmente</div>
                    <div className="big">~ {liveEstimatedKcal} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6, lineHeight: 1.45 }}>
                      {chronoMinutes} min • {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    {!running ? (
                      <button className="primary" onClick={startChronoMode}>
                        {elapsedSec > 0 ? "Continuar cronômetro" : "Iniciar cronômetro"}
                      </button>
                    ) : (
                      <button className="primary" onClick={pauseLive}>
                        Pausar
                      </button>
                    )}
                    <button className="ghost" onClick={resetLive}>
                      Reset
                    </button>
                    <button className="ghost" onClick={handleChronoSave} disabled={elapsedSec < 30}>
                      Salvar sessão
                    </button>
                  </div>
                </>
              )}

              {mode === "calories" && (
                <>
                  <div>
                    <div className="label">Meta de calorias</div>
                    <input
                      type="number"
                      value={calTarget}
                      onChange={(e) => setCalTarget(e.target.value)}
                      placeholder="Ex.: 250"
                      className="full-input"
                    />
                    <div style={{ marginTop: 8, color: APP_MUTED, lineHeight: 1.5 }}>
                      Estimativa baseada em {Math.round(kcalPerMin)} kcal/min (peso: {userWeightKg}kg, MET: {metNow}).
                    </div>
                  </div>

                  <div>
                    <div className="label">Intensidade</div>
                    <div className="intensity-grid">
                      {Object.entries(INTENSITIES).map(([k, v]) => (
                        <div
                          key={k}
                          className={`intensity-card ${selectedIntensity === k ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(k)}
                        >
                          <div style={{ fontWeight: 800, color: APP_TEXT }}>{v.label}</div>
                          <div style={{ marginTop: 6, color: APP_MUTED, lineHeight: 1.45 }}>{v.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Tempo necessário</div>
                    <div className="big">
                      {(() => {
                        const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
                        if (!kcal) return "—";
                        const mins = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
                        return `${mins} min`;
                      })()}
                    </div>
                    <div style={{ color: APP_MUTED, marginTop: 6, lineHeight: 1.45 }}>
                      {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="primary"
                      onClick={handleCaloriesStartOrSave}
                      disabled={!Number(calTarget) || Number(calTarget) <= 0}
                    >
                      Iniciar por kcal
                    </button>
                    <button className="ghost" onClick={() => setCalTarget("")}>
                      Limpar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, color: APP_MUTED, fontWeight: 700 }}>Hoje</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: APP_TEXT }}>
                    {todayMinutes} min • {todayKcal} kcal
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: APP_MUTED }}>Semana</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: APP_TEXT }}>{weekMinutes} min</div>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", justifyContent: "center" }}>
                <RingProgress
                  progress={weekProgress}
                  value={`${weekMinutes}m`}
                  label="semana"
                  sublabel={`${weekKcal} kcal`}
                  glow
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, color: APP_MUTED, fontWeight: 700 }}>Histórico recente</div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {recentSessions.length === 0 ? (
                    <div className="empty">Nenhuma sessão registrada ainda.</div>
                  ) : (
                    recentSessions.map((s) => (
                      <div key={s.id} className="history-item">
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: APP_TEXT }}>{s.workoutName}</div>
                          <div style={{ color: APP_MUTED, fontSize: 13, lineHeight: 1.4 }}>
                            {s.minutes} min • {s.intensityLabel}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: APP_TEXT, flexShrink: 0 }}>{s.calories} kcal</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="side-buttons">
                <button className="ghost" onClick={() => nav("/treino")}>Treinos</button>
                <button className="ghost" onClick={() => nav("/nutricao")}>Nutrição</button>
              </div>
            </div>
          </aside>
        </div>

        <div style={{ height: 18 }} />
        <WeekTimeline sessions={sessions} />
      </div>
    </div>
  );
}

/* ---------------- CardioMiniDock ---------------- */
export function CardioMiniDock() {
  const navigate = useNavigate();
  const [info, setInfo] = useState({
    minutes: 0,
    kcal: 0,
    liveRunning: false,
    liveTime: "00:00",
  });

  useEffect(() => {
    function pull() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const todayKey = getDateKey();
        const todaySessions = all.filter((s) => s.date === todayKey);
        const minutes = todaySessions.reduce((a, b) => a + (b.minutes || 0), 0);
        const kcal = todaySessions.reduce((a, b) => a + (b.calories || 0), 0);

        const live = getLiveState();
        const liveElapsed = computeLiveSeconds(live);
        const liveRunning = !!live?.running;

        let liveTime = "00:00";
        if (live) {
          if (live.mode === "timer") {
            const total = Number(live.durationSec || 0);
            liveTime = formatMMSS(Math.max(0, total - liveElapsed));
          } else {
            liveTime = formatMMSS(liveElapsed);
          }
        }

        setInfo({
          minutes,
          kcal,
          liveRunning,
          liveTime,
        });
      } catch {
        setInfo({
          minutes: 0,
          kcal: 0,
          liveRunning: false,
          liveTime: "00:00",
        });
      }
    }

    pull();
    const t = setInterval(pull, 300);
    return () => clearInterval(t);
  }, []);

  if (!info.liveRunning && info.minutes <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/cardio")}
      aria-label="Abrir Cardio"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: `calc(84px + env(safe-area-inset-bottom))`,
        zIndex: 9999,
        borderRadius: 16,
        padding: "12px 14px",
        background: `linear-gradient(90deg, ${APP_ORANGE}, ${APP_ACCENT})`,
        color: "#111",
        fontWeight: 800,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 12px 34px rgba(255,106,0,0.12)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#111",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, textAlign: "left" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {info.liveRunning ? "Cardio em andamento" : "Cardio hoje"}
          </div>
          <div
            style={{
              color: "rgba(17,17,17,0.7)",
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {info.liveRunning ? info.liveTime : `${info.minutes} min • ${info.kcal} kcal`}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
        {info.liveRunning ? "ao vivo" : `${info.minutes}m`}
      </div>
    </button>
  );
}
