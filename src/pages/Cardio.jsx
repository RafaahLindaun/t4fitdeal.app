import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const APP_ORANGE = "#FF6A00";
const APP_ACCENT = "#FFB26B";
const APP_BG = "#ffffff";
const APP_TEXT = "#0b1220";
const APP_MUTED = "#6b7280";
const APP_LINE = "rgba(11,18,32,0.08)";
const APP_SOFT = "#f8fafc";
const APP_GREEN = "#22c55e";

const WEEKLY_GOAL_MINUTES = 150;
const STORAGE_KEY = "cardio_sessions_v8";
const LIVE_KEY = "cardio_live_v8";

const WORKOUTS = [
  { id: "walk", name: "Caminhada", subtitle: "Leve e fácil de manter", mets: { low: 3.0, moderate: 4.8, high: 5.5 } },
  { id: "treadmill", name: "Esteira", subtitle: "Ritmo controlado", mets: { low: 4.0, moderate: 5.2, high: 6.3 } },
  { id: "bike", name: "Bike", subtitle: "Baixo impacto", mets: { low: 4.0, moderate: 6.8, high: 8.0 } },
  { id: "run", name: "Corrida leve", subtitle: "Mais gasto em menos tempo", mets: { low: 6.0, moderate: 8.3, high: 9.8 } },
  { id: "stairs", name: "Escada", subtitle: "Fôlego e pernas", mets: { low: 5.0, moderate: 8.8, high: 9.5 } },
  { id: "hiit", name: "HIIT", subtitle: "Curto e intenso", mets: { low: 6.0, moderate: 8.0, high: 10.0 } },
];

const INTENSITIES = {
  low: { label: "Leve", feel: "Consegue conversar", multiplier: 0.85 },
  moderate: { label: "Moderado", feel: "Respiração acelerada", multiplier: 1.0 },
  high: { label: "Intenso", feel: "Esforço alto", multiplier: 1.15 },
};

const DURATIONS = [10, 15, 20, 25, 30, 40, 45, 60];

function pad2(n) {
  return String(n).padStart(2, "0");
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
  const safe = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function vibrate(ms = 16) {
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

function computeLiveSeconds(live) {
  if (!live) return 0;
  if (!live.running) return Number(live.elapsedSec || 0);

  const startedAt = Number(live.startedAt || 0);
  const baseElapsed = Number(live.elapsedSec || 0);
  const extra = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  return baseElapsed + extra;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="cardio-toast-wrap" role="status" aria-live="polite">
      <div className="cardio-toast">
        <div className={`cardio-toast-dot ${toast.type === "success" ? "ok" : ""}`} />
        <div className="cardio-toast-copy">
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

function RingProgress({ progress = 0, size = 132, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-svg" aria-hidden>
        <defs>
          <linearGradient id="ringGradientWeek" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={APP_ORANGE} />
            <stop offset="100%" stopColor={APP_ACCENT} />
          </linearGradient>
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
          stroke="url(#ringGradientWeek)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 220ms ease" }}
        />
      </svg>

      <div className="ring-center">
        <div className="ring-value">{value}</div>
        <div className="ring-label">{label}</div>
        {sublabel ? <div className="ring-sub">{sublabel}</div> : null}
      </div>
    </div>
  );
}

function BigRing({ progress = 0, value = "00:00", top = "timer", bottom = "", running = false }) {
  const size = 252;
  const stroke = 18;
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`big-ring-wrap ${running ? "big-ring-running" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="big-ring-svg" aria-hidden>
        <defs>
          <linearGradient id="bigRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={APP_ORANGE} />
            <stop offset="100%" stopColor={APP_ACCENT} />
          </linearGradient>
          <filter id="bigRingGlow">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
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
          stroke="url(#bigRingGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#bigRingGlow)"
          style={{ transition: "stroke-dashoffset 220ms ease" }}
        />
      </svg>

      <div className="big-ring-center">
        <div className="big-ring-top">{top}</div>
        <div className="big-ring-value">{value}</div>
        {bottom ? <div className="big-ring-bottom">{bottom}</div> : null}
      </div>
    </div>
  );
}

function WeekTimeline({ sessions }) {
  const days = getLast7Days();

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3 className="section-title">Seu ritmo da semana</h3>
          <p className="section-sub">Constância sem poluição visual.</p>
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

export default function Cardio({ userWeightKg = 80 }) {
  const nav = useNavigate();
  const liveTickRef = useRef(null);

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

  const timerRemainingSec = Math.max(0, durationSec - elapsedSec);
  const timerProgress = durationSec > 0 ? clamp((elapsedSec / durationSec) * 100, 0, 100) : 0;
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
    setElapsedSec(computeLiveSeconds(live));
    setRunning(!!live.running);
  }, []);

  useEffect(() => {
    if (mode === "timer" && !running) {
      setDurationSec(minutes * 60);
    }
  }, [minutes, mode, running]);

  useEffect(() => {
    if (liveTickRef.current) {
      clearInterval(liveTickRef.current);
      liveTickRef.current = null;
    }

    const sync = () => {
      const live = getLiveState();
      if (!live) return;

      const elapsed = computeLiveSeconds(live);
      setElapsedSec(elapsed);
      setRunning(!!live.running);

      if (live.mode === "timer") {
        const total = Number(live.durationSec || 0);
        setDurationSec(total);

        if (elapsed >= total && live.running) {
          setElapsedSec(total);
          setRunning(false);
          setJustFinished(true);

          setLiveState({
            ...live,
            running: false,
            elapsedSec: total,
            startedAt: 0,
            finishedAt: Date.now(),
          });

          vibrate([40, 60, 40]);
          setToast({
            type: "success",
            title: "Timer concluído",
            text: "Seu cardio terminou. Agora é só salvar a sessão.",
          });
        }
      }
    };

    sync();
    liveTickRef.current = setInterval(sync, 250);

    return () => {
      if (liveTickRef.current) {
        clearInterval(liveTickRef.current);
        liveTickRef.current = null;
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

  function startTimer() {
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

  function startChrono() {
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
      finishedAt: 0,
    });
    setElapsedSec(0);
    setRunning(true);
    vibrate(10);
  }

  function pauseCurrent() {
    const live = getLiveState();
    if (!live) return;

    const elapsed = computeLiveSeconds(live);
    persistLive({
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
      finishedAt: 0,
    });
    setElapsedSec(0);
    setRunning(false);
    vibrate(8);
  }

  function saveSessionFromMinutes(mins, modeLabel) {
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

  function saveTimerSession() {
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

  function saveChronoSession() {
    const doneMinutes = Math.max(1, Math.round(elapsedSec / 60));
    saveSessionFromMinutes(doneMinutes, "chrono");
    persistLive({
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

  function startByCalories() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;

    const minutesNeeded = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    setMinutes(minutesNeeded);
    setMode("timer");
    setJustFinished(false);

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
    vibrate(10);
    setToast({
      type: "success",
      title: "Meta iniciada",
      text: `${minutesNeeded} min estimados para bater ${kcal} kcal.`,
    });
  }

  function changeMode(nextMode) {
    if (running) pauseCurrent();
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

  const bigTop =
    mode === "timer"
      ? running
        ? "timer ativo"
        : "timer"
      : mode === "chrono"
      ? running
        ? "cronômetro ativo"
        : "cronômetro"
      : "por calorias";

  const bigValue =
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

  const bigBottom =
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
          width: 100%;
          overflow-x: hidden;
          background: var(--app-bg);
        }

        .cardio-screen {
          width: 100%;
          min-height: 100dvh;
          padding:
            calc(12px + env(safe-area-inset-top))
            10px
            calc(118px + env(safe-area-inset-bottom))
            10px;
          background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
          color: var(--app-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          overflow-x: hidden;
        }

        .container {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .card {
          width: 100%;
          border-radius: 20px;
          padding: 16px;
          background: #fff;
          border: 1px solid var(--app-line);
          box-shadow:
            0 8px 24px rgba(11,18,32,0.04),
            0 1px 4px rgba(11,18,32,0.03);
        }

        .hero {
          display: grid;
          grid-template-columns: 132px minmax(0, 1fr);
          gap: 16px;
          align-items: center;
          margin-bottom: 14px;
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
          font-size: 12px;
          width: fit-content;
          max-width: 100%;
        }

        .title {
          margin: 10px 0 6px 0;
          font-size: clamp(26px, 7vw, 38px);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--app-text);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .hero-stats {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .stat {
          border: 1px solid var(--app-line);
          border-radius: 14px;
          padding: 12px;
          background: #fff;
        }

        .stat .label {
          font-size: 11px;
          line-height: 1.3;
          color: var(--app-muted);
          font-weight: 700;
        }

        .stat .value {
          margin-top: 6px;
          font-size: clamp(16px, 4vw, 18px);
          line-height: 1.1;
          font-weight: 800;
          color: var(--app-text);
          word-break: break-word;
        }

        .modes {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .mode-btn {
          min-height: 46px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--app-line);
          background: #fff;
          color: var(--app-text);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          white-space: normal;
          line-height: 1.2;
        }

        .mode-btn.active {
          border-color: transparent;
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          color: #111;
          box-shadow: 0 8px 24px rgba(255,106,0,0.10);
        }

        .content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 14px;
          align-items: start;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }

        .section-title {
          margin: 0;
          font-size: 19px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--app-text);
          word-break: break-word;
        }

        .section-sub {
          margin: 6px 0 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: var(--app-muted);
          word-break: break-word;
        }

        .workout-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .workout-card {
          min-height: 92px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid var(--app-line);
          background: #fff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .workout-card.active {
          border-color: rgba(255,106,0,0.18);
          background: linear-gradient(180deg, rgba(255,106,0,0.04), rgba(255,255,255,1));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .workout-name {
          font-size: 15px;
          line-height: 1.2;
          font-weight: 800;
          color: var(--app-text);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .workout-sub {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.4;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .control {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label {
          font-size: 13px;
          line-height: 1.3;
          color: var(--app-muted);
          font-weight: 700;
          word-break: break-word;
        }

        .durations {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .chip {
          min-height: 42px;
          padding: 10px 12px;
          border-radius: 13px;
          border: 1px solid var(--app-line);
          background: #fff;
          color: var(--app-text);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .chip.active {
          border-color: rgba(255,106,0,0.18);
          background: linear-gradient(90deg, rgba(255,106,0,0.12), rgba(255,178,107,0.06));
          color: #111;
        }

        .intensity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .intensity-card {
          min-height: 108px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--app-line);
          background: #fff;
          cursor: pointer;
          overflow: hidden;
        }

        .intensity-card.active {
          border-color: rgba(255,106,0,0.18);
          background: linear-gradient(180deg, rgba(255,106,0,0.04), rgba(255,255,255,1));
        }

        .intensity-title {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 800;
          color: var(--app-text);
          word-break: break-word;
        }

        .intensity-feel {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.4;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .timer-panel {
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--app-line);
          background: #fff;
          display: grid;
          justify-items: center;
          gap: 12px;
        }

        .big-ring-wrap {
          position: relative;
          width: min(100%, 252px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
        }

        .big-ring-running {
          animation: ringPulse 2s ease-in-out infinite;
        }

        .big-ring-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .big-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
        }

        .big-ring-top {
          font-size: 11px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--app-muted);
          word-break: break-word;
        }

        .big-ring-value {
          margin-top: 6px;
          font-size: clamp(40px, 12vw, 62px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.06em;
          color: var(--app-text);
          word-break: break-word;
        }

        .big-ring-bottom {
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 700;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .estimate {
          padding: 14px;
          border-radius: 16px;
          border: 1px solid var(--app-line);
          background: #fff;
        }

        .estimate .big {
          font-size: clamp(28px, 8vw, 40px);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--app-text);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .estimate-copy {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.45;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .finish-banner {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06));
          border: 1px solid rgba(34,197,94,0.18);
        }

        .finish-title {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 800;
          color: var(--app-text);
        }

        .finish-text {
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.4;
          color: var(--app-muted);
          word-break: break-word;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .primary,
        .ghost {
          min-height: 46px;
          padding: 12px 14px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          line-height: 1.2;
          word-break: break-word;
        }

        .primary {
          border: none;
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          color: #111;
        }

        .ghost {
          border: 1px solid var(--app-line);
          background: #fff;
          color: var(--app-text);
        }

        .primary:disabled,
        .ghost:disabled,
        .chip:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .full-input {
          width: 100%;
          margin-top: 8px;
          min-height: 46px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--app-line);
          background: #fff;
          color: var(--app-text);
          font-size: 16px;
          outline: none;
        }

        .full-input:focus {
          border-color: rgba(255,106,0,0.22);
          box-shadow: 0 0 0 4px rgba(255,106,0,0.08);
        }

        .ring-wrap {
          position: relative;
          width: 132px;
          height: 132px;
          margin-inline: auto;
          flex-shrink: 0;
        }

        .ring-svg {
          width: 100%;
          height: 100%;
        }

        .ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
        }

        .ring-value {
          font-size: 18px;
          line-height: 1;
          font-weight: 800;
          color: var(--app-text);
          letter-spacing: -0.03em;
        }

        .ring-label {
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.2;
          color: var(--app-muted);
          word-break: break-word;
        }

        .ring-sub {
          margin-top: 4px;
          font-size: 10px;
          line-height: 1.3;
          color: var(--app-muted);
          word-break: break-word;
        }

        .side-buttons {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .history-list {
          margin-top: 10px;
          display: grid;
          gap: 8px;
        }

        .history-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--app-line);
          background: #fff;
        }

        .history-title {
          font-size: 14px;
          line-height: 1.25;
          font-weight: 800;
          color: var(--app-text);
          word-break: break-word;
        }

        .history-meta {
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.35;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .history-kcal {
          font-size: 13px;
          line-height: 1.2;
          font-weight: 800;
          color: var(--app-text);
          flex-shrink: 0;
        }

        .empty {
          padding: 14px;
          border-radius: 12px;
          border: 1px dashed rgba(11,18,32,0.10);
          background: var(--app-soft);
          color: var(--app-muted);
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
        }

        .timeline-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
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
          background: rgba(11,18,32,0.08);
          box-shadow: 0 0 0 6px rgba(11,18,32,0.02);
        }

        .bubble-inner {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(11,18,32,0.34);
        }

        .bubble.done {
          background: linear-gradient(180deg, var(--app-orange), var(--app-accent));
          box-shadow: 0 0 0 6px rgba(255,106,0,0.08);
        }

        .bubble.done .bubble-inner {
          background: #fff;
        }

        .timeline-day {
          font-size: 11px;
          line-height: 1.2;
          font-weight: 700;
          color: var(--app-text);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timeline-min {
          margin-top: 4px;
          font-size: 10px;
          line-height: 1.25;
          color: var(--app-muted);
          word-break: break-word;
        }

        .cardio-toast-wrap {
          position: fixed;
          left: 10px;
          right: 10px;
          top: calc(10px + env(safe-area-inset-top));
          z-index: 99999;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .cardio-toast {
          width: min(520px, 100%);
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.94);
          border: 1px solid var(--app-line);
          box-shadow: 0 14px 34px rgba(11,18,32,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          pointer-events: auto;
        }

        .cardio-toast-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--app-orange);
          box-shadow: 0 0 0 6px rgba(255,106,0,0.08);
        }

        .cardio-toast-dot.ok {
          background: var(--app-green);
          box-shadow: 0 0 0 6px rgba(34,197,94,0.08);
        }

        .cardio-toast-copy {
          min-width: 0;
        }

        .cardio-toast-title {
          font-size: 13px;
          line-height: 1.2;
          font-weight: 800;
          color: var(--app-text);
          word-break: break-word;
        }

        .cardio-toast-text {
          margin-top: 2px;
          font-size: 12px;
          line-height: 1.35;
          color: var(--app-muted);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .cardio-toast-close {
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
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.012); }
        }

        @media (max-width: 980px) {
          .content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .hero {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: left;
          }

          .hero > div:last-child {
            width: 100%;
          }

          .hero-stats {
            grid-template-columns: 1fr;
          }

          .modes {
            grid-template-columns: 1fr;
          }

          .workout-grid {
            grid-template-columns: 1fr;
          }

          .intensity-grid {
            grid-template-columns: 1fr;
          }

          .side-buttons {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .actions .primary,
          .actions .ghost {
            width: 100%;
          }

          .big-ring-wrap {
            width: min(100%, 230px);
          }
        }

        @media (max-width: 430px) {
          .cardio-screen {
            padding:
              calc(10px + env(safe-area-inset-top))
              8px
              calc(112px + env(safe-area-inset-bottom))
              8px;
          }

          .card {
            padding: 14px;
            border-radius: 18px;
          }

          .title {
            font-size: clamp(24px, 8vw, 30px);
          }

          .subtitle {
            font-size: 13px;
          }

          .workout-card,
          .intensity-card {
            min-height: unset;
          }

          .big-ring-wrap {
            width: min(100%, 214px);
          }

          .timeline-row {
            gap: 5px;
          }
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="container">
        <section className="card hero">
          <RingProgress
            progress={weekProgress}
            value={`${weekMinutes}m`}
            label="meta semanal"
            sublabel={weekProgress >= 100 ? "fechou!" : `faltam ${minutesLeft} min`}
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

            <div className="modes">
              <button className={`mode-btn ${mode === "timer" ? "active" : ""}`} onClick={() => changeMode("timer")}>
                Timer
              </button>
              <button className={`mode-btn ${mode === "chrono" ? "active" : ""}`} onClick={() => changeMode("chrono")}>
                Cronômetro
              </button>
              <button className={`mode-btn ${mode === "calories" ? "active" : ""}`} onClick={() => changeMode("calories")}>
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
                <p className="section-sub">Opções limpas e fáceis de entender.</p>
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

            <div className="control">
              {(mode === "timer" || mode === "chrono") && (
                <div className="timer-panel">
                  <BigRing
                    progress={mode === "timer" ? timerProgress : 100}
                    value={mode === "timer" ? formatMMSS(timerRemainingSec) : formatMMSS(elapsedSec)}
                    top={mode === "timer" ? (running ? "timer ativo" : "timer") : running ? "cronômetro ativo" : "cronômetro"}
                    bottom={mode === "timer" ? `${Math.round((elapsedSec / 60) * kcalPerMin)} kcal` : `${liveEstimatedKcal} kcal`}
                    running={running}
                  />

                  {mode === "timer" && justFinished ? (
                    <div className="finish-banner">
                      <div className="finish-title">Cardio concluído</div>
                      <div className="finish-text">
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
                            if (!running) setDurationSec(d * 60);
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
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <div
                          key={key}
                          className={`intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="intensity-title">{info.label}</div>
                          <div className="intensity-feel">{info.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa</div>
                    <div className="big">~ {Math.round((elapsedSec / 60) * kcalPerMin)} kcal</div>
                    <div className="estimate-copy">
                      Em {formatMMSS(elapsedSec)} • {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div className="actions">
                    {!running ? (
                      <button className="primary" onClick={startTimer}>
                        {elapsedSec > 0 && !justFinished ? "Continuar timer" : "Iniciar timer"}
                      </button>
                    ) : (
                      <button className="primary" onClick={pauseCurrent}>
                        Pausar
                      </button>
                    )}

                    <button className="ghost" onClick={resetCurrent}>
                      Reset
                    </button>

                    <button className="ghost" onClick={saveTimerSession} disabled={elapsedSec < 30}>
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
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <div
                          key={key}
                          className={`intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="intensity-title">{info.label}</div>
                          <div className="intensity-feel">{info.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa atualmente</div>
                    <div className="big">~ {liveEstimatedKcal} kcal</div>
                    <div className="estimate-copy">
                      {Math.max(1, Math.round(elapsedSec / 60))} min • {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div className="actions">
                    {!running ? (
                      <button className="primary" onClick={startChrono}>
                        {elapsedSec > 0 ? "Continuar cronômetro" : "Iniciar cronômetro"}
                      </button>
                    ) : (
                      <button className="primary" onClick={pauseCurrent}>
                        Pausar
                      </button>
                    )}

                    <button className="ghost" onClick={resetCurrent}>
                      Reset
                    </button>

                    <button className="ghost" onClick={saveChronoSession} disabled={elapsedSec < 30}>
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
                    <div className="estimate-copy">
                      Baseado em {Math.round(kcalPerMin)} kcal/min • peso {userWeightKg}kg • MET {metNow}
                    </div>
                  </div>

                  <div>
                    <div className="label">Intensidade</div>
                    <div className="intensity-grid">
                      {Object.entries(INTENSITIES).map(([key, info]) => (
                        <div
                          key={key}
                          className={`intensity-card ${selectedIntensity === key ? "active" : ""}`}
                          onClick={() => setSelectedIntensity(key)}
                        >
                          <div className="intensity-title">{info.label}</div>
                          <div className="intensity-feel">{info.feel}</div>
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
                    <div className="estimate-copy">
                      {selectedWorkout.name} • {intensityInfo.label}
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="primary"
                      onClick={startByCalories}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div className="label">Hoje</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: APP_TEXT, lineHeight: 1.2, wordBreak: "break-word" }}>
                    {todayMinutes} min • {todayKcal} kcal
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="label">Semana</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: APP_TEXT, lineHeight: 1.2 }}>
                    {weekMinutes} min
                  </div>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", justifyContent: "center" }}>
                <RingProgress
                  progress={weekProgress}
                  value={`${weekMinutes}m`}
                  label="semana"
                  sublabel={`${weekKcal} kcal`}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="label">Histórico recente</div>

                <div className="history-list">
                  {recentSessions.length === 0 ? (
                    <div className="empty">Nenhuma sessão registrada ainda.</div>
                  ) : (
                    recentSessions.map((s) => (
                      <div key={s.id} className="history-item">
                        <div>
                          <div className="history-title">{s.workoutName}</div>
                          <div className="history-meta">
                            {s.minutes} min • {s.intensityLabel}
                          </div>
                        </div>
                        <div className="history-kcal">{s.calories} kcal</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="side-buttons">
                <button className="ghost" onClick={() => nav("/treino")}>
                  Treinos
                </button>
                <button className="ghost" onClick={() => nav("/nutricao")}>
                  Nutrição
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div style={{ height: 14 }} />
        <WeekTimeline sessions={sessions} />
      </div>
    </div>
  );
}

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

        setInfo({ minutes, kcal, liveRunning, liveTime });
      } catch {
        setInfo({ minutes: 0, kcal: 0, liveRunning: false, liveTime: "00:00" });
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
        left: 10,
        right: 10,
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
        gap: 10,
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
              color: "rgba(17,17,17,0.72)",
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

      <div style={{ fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
        {info.liveRunning ? "ao vivo" : `${info.minutes}m`}
      </div>
    </button>
  );
}
