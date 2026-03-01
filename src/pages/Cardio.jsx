import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Cardio.jsx
 * - Modos: timer | chrono | calories
 * - Fundo claro (white) e paleta do app
 * - Layout encaixado no tamanho da página
 * - Export default + named export CardioMiniDock
 */

const APP_ORANGE = "#FF6A00";
const APP_ACCENT = "#FFB26B";
const APP_BG = "#ffffff";
const APP_TEXT = "#0b1220";
const APP_MUTED = "#6b7280";
const APP_LINE = "rgba(11,18,32,0.08)";
const APP_SOFT = "#f8fafc";

const WEEKLY_GOAL_MINUTES = 150;
const STORAGE_KEY = "cardio_sessions_v5";

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

function RingProgress({ progress = 0, size = 150, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="ring-wrap">
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

export default function Cardio({ userWeightKg = 80 }) {
  const nav = useNavigate();
  const plannerRef = useRef(null);

  const [mode, setMode] = useState("timer");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("bike");
  const [selectedIntensity, setSelectedIntensity] = useState("moderate");
  const [minutes, setMinutes] = useState(25);
  const [calTarget, setCalTarget] = useState("");
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const chronoRef = useRef(null);
  const [chronoRunning, setChronoRunning] = useState(false);
  const [chronoElapsedSec, setChronoElapsedSec] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    if (!chronoRunning) {
      if (chronoRef.current) {
        clearInterval(chronoRef.current);
        chronoRef.current = null;
      }
      return;
    }

    chronoRef.current = setInterval(() => {
      setChronoElapsedSec((s) => s + 1);
    }, 1000);

    return () => {
      if (chronoRef.current) {
        clearInterval(chronoRef.current);
        chronoRef.current = null;
      }
    };
  }, [chronoRunning]);

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

  function saveSessionFromMinutes(mins, modeLabel = "manual") {
    const kcal = Math.round(mins * kcalPerMin);

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      date: todayKey,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      intensity: selectedIntensity,
      intensityLabel: intensityInfo.label,
      minutes: Math.round(mins),
      calories: kcal,
      weightKg: userWeightKg,
      mode: modeLabel,
    };

    setSessions((prev) => [entry, ...prev].slice(0, 200));
  }

  function handleTimerSave() {
    saveSessionFromMinutes(minutes, "timer");
  }

  function handleChronoSave() {
    const mins = Math.max(1, Math.round(chronoElapsedSec / 60));
    saveSessionFromMinutes(mins, "chrono");
    setChronoElapsedSec(0);
    setChronoRunning(false);
  }

  function handleCaloriesStartOrSave() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;
    const minutesNeeded = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    saveSessionFromMinutes(minutesNeeded, "calorie-target");
    setCalTarget("");
  }

  function chronoToggle() {
    setChronoRunning((r) => !r);
  }

  function chronoReset() {
    setChronoRunning(false);
    setChronoElapsedSec(0);
  }

  function formatMMSS(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

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

        .chrono-box {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .chrono-time {
          font-weight: 900;
          font-size: clamp(28px, 5vw, 34px);
          letter-spacing: -0.03em;
          color: var(--app-text);
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

          .timeline-row {
            grid-template-columns: repeat(7, minmax(38px, 1fr));
            gap: 6px;
          }

          .chrono-box {
            flex-direction: column;
            align-items: flex-start;
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

      <div className="container">
        <section className="card hero">
          <RingProgress
            progress={weekProgress}
            value={`${weekMinutes} min`}
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

            <div className="modes" role="tablist" aria-label="Modos cardio">
              <button className={`mode-btn ${mode === "timer" ? "active" : ""}`} onClick={() => setMode("timer")}>
                Timer
              </button>
              <button className={`mode-btn ${mode === "chrono" ? "active" : ""}`} onClick={() => setMode("chrono")}>
                Cronômetro
              </button>
              <button className={`mode-btn ${mode === "calories" ? "active" : ""}`} onClick={() => setMode("calories")}>
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
              {mode === "timer" && (
                <>
                  <div>
                    <div className="label">Quanto tempo?</div>
                    <div className="durations">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          className={`chip ${minutes === d ? "active" : ""}`}
                          onClick={() => setMinutes(d)}
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
                    <div className="big">~ {Math.round(minutes * kcalPerMin)} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6, lineHeight: 1.45 }}>
                      {minutes} min • {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button className="primary" onClick={handleTimerSave}>
                      Concluir sessão ({minutes} min)
                    </button>
                    <button
                      className="ghost"
                      onClick={() => plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      Fazer mais
                    </button>
                  </div>
                </>
              )}

              {mode === "chrono" && (
                <>
                  <div>
                    <div className="label">Cronômetro</div>
                    <div className="chrono-box">
                      <div className="chrono-time">{formatMMSS(chronoElapsedSec)}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="chip" onClick={chronoToggle}>
                          {chronoRunning ? "Pausar" : "Iniciar"}
                        </button>
                        <button className="chip" onClick={chronoReset}>
                          Reset
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, color: APP_MUTED, lineHeight: 1.5 }}>
                      Ao salvar, o cronômetro grava os minutos completos.
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa atualmente</div>
                    <div className="big">~ {Math.round((chronoElapsedSec / 60) * kcalPerMin)} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6, lineHeight: 1.45 }}>
                      {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button className="primary" onClick={handleChronoSave} disabled={chronoElapsedSec < 30}>
                      Salvar sessão
                    </button>
                    <button
                      className="ghost"
                      onClick={() => {
                        setChronoElapsedSec(0);
                        setChronoRunning(false);
                      }}
                    >
                      Cancelar
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
                      Salvar por kcal
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
  const [todayInfo, setTodayInfo] = useState({ minutes: 0, kcal: 0 });

  useEffect(() => {
    function pull() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const todayKey = getDateKey();
        const todaySessions = all.filter((s) => s.date === todayKey);
        const minutes = todaySessions.reduce((a, b) => a + (b.minutes || 0), 0);
        const kcal = todaySessions.reduce((a, b) => a + (b.calories || 0), 0);
        setTodayInfo({ minutes, kcal });
      } catch {
        setTodayInfo({ minutes: 0, kcal: 0 });
      }
    }

    pull();
    const t = setInterval(pull, 1500);
    return () => clearInterval(t);
  }, []);

  if (!todayInfo || (todayInfo.minutes || 0) <= 0) return null;

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
          <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Cardio hoje
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
            {todayInfo.minutes} min • {todayInfo.kcal} kcal
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{todayInfo.minutes}m</div>
    </button>
  );
}
