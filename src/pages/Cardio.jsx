import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const WEEKLY_GOAL_MINUTES = 150;
const STORAGE_KEY = "cardio_sessions_v5";

const WORKOUTS = [
  {
    id: "walk",
    name: "Caminhada",
    subtitle: "Constante, leve e fácil de manter",
    mets: { low: 3.0, moderate: 4.8, high: 5.5 },
  },
  {
    id: "treadmill",
    name: "Esteira",
    subtitle: "Controle total de ritmo e tempo",
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
    subtitle: "Mais resultado em menos tempo",
    mets: { low: 6.0, moderate: 8.3, high: 9.8 },
  },
  {
    id: "stairs",
    name: "Escada",
    subtitle: "Puxa perna, fôlego e foco",
    mets: { low: 5.0, moderate: 8.8, high: 9.5 },
  },
  {
    id: "hiit",
    name: "HIIT",
    subtitle: "Curto, intenso e direto",
    mets: { low: 6.0, moderate: 8.0, high: 10.0 },
  },
];

const INTENSITIES = {
  low: {
    label: "Leve",
    feel: "Você consegue conversar normalmente",
    accent: "Bom para manter constância",
  },
  moderate: {
    label: "Moderado",
    feel: "Respiração acelerada, mas controlada",
    accent: "Melhor equilíbrio para a maioria",
  },
  high: {
    label: "Intenso",
    feel: "Puxado, com bastante esforço",
    accent: "Maior gasto em menos tempo",
  },
};

const DURATIONS = [10, 15, 20, 25, 30, 40, 45, 60];

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getLast7Days() {
  const base = new Date();
  const result = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    result.push(d);
  }

  return result;
}

function caloriesFromMET({ met, minutes, weightKg }) {
  return Math.round(minutes * ((met * 3.5 * weightKg) / 200));
}

function RingProgress({ progress = 0, size = 170, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="cardio-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cardio-ring-svg">
        <defs>
          <linearGradient id="cardioRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.86)" />
            <stop offset="55%" stopColor="rgba(152, 206, 255, 0.95)" />
            <stop offset="100%" stopColor="rgba(67, 156, 255, 0.98)" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cardioRingGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="cardio-ring-center">
        <div className="cardio-ring-value">{value}</div>
        <div className="cardio-ring-label">{label}</div>
        {sublabel ? <div className="cardio-ring-sublabel">{sublabel}</div> : null}
      </div>
    </div>
  );
}

function WeekTimeline({ sessions }) {
  const days = getLast7Days();

  return (
    <section className="cardio-card timeline-card">
      <div className="cardio-section-head">
        <div>
          <h3 className="cardio-section-title">Seu ritmo da semana</h3>
          <p className="cardio-section-subtitle">
            Visual simples para enxergar constância sem poluição.
          </p>
        </div>
      </div>

      <div className="timeline-row">
        {days.map((day) => {
          const key = getDateKey(day);
          const daySessions = sessions.filter((item) => item.date === key);
          const totalMinutes = daySessions.reduce((acc, item) => acc + item.minutes, 0);
          const done = daySessions.length > 0;

          const weekday = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
          })
            .format(day)
            .replace(".", "");

          return (
            <div key={key} className="timeline-item">
              <div className={`timeline-bubble ${done ? "done" : ""}`}>
                <span className="timeline-bubble-inner" />
              </div>
              <div className="timeline-day">{weekday}</div>
              <div className="timeline-minutes">{done ? `${totalMinutes} min` : "—"}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function CardioTab({ userWeightKg = 80 }) {
  const navigate = useNavigate();
  const plannerRef = useRef(null);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState("bike");
  const [selectedIntensity, setSelectedIntensity] = useState("moderate");
  const [minutes, setMinutes] = useState(25);
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  const selectedWorkout = useMemo(
    () => WORKOUTS.find((item) => item.id === selectedWorkoutId) || WORKOUTS[0],
    [selectedWorkoutId]
  );

  const todayKey = getDateKey();

  const todaySessions = useMemo(
    () => sessions.filter((item) => item.date === todayKey),
    [sessions, todayKey]
  );

  const completedToday = todaySessions.length > 0;

  const estimatedCalories = caloriesFromMET({
    met: selectedWorkout.mets[selectedIntensity],
    minutes,
    weightKg: userWeightKg,
  });

  const todayMinutes = todaySessions.reduce((acc, item) => acc + item.minutes, 0);
  const todayCalories = todaySessions.reduce((acc, item) => acc + item.calories, 0);

  const last7Boundary = new Date();
  last7Boundary.setDate(last7Boundary.getDate() - 6);

  const weekSessions = sessions.filter((item) => {
    const d = new Date(`${item.date}T12:00:00`);
    return d >= last7Boundary;
  });

  const weekMinutes = weekSessions.reduce((acc, item) => acc + item.minutes, 0);
  const weekCalories = weekSessions.reduce((acc, item) => acc + item.calories, 0);
  const weekProgress = Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100));
  const minutesLeft = Math.max(0, WEEKLY_GOAL_MINUTES - weekMinutes);

  const recentSessions = [...sessions]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 4);

  const title = completedToday
    ? "Cardio de hoje concluído"
    : "Feche seu cardio de hoje";

  const subtitle = completedToday
    ? `Hoje você já fez ${todayMinutes} min e queimou cerca de ${todayCalories} kcal.`
    : `${minutes} min de ${selectedWorkout.name.toLowerCase()} em ritmo ${INTENSITIES[
        selectedIntensity
      ].label.toLowerCase()} devem gastar cerca de ${estimatedCalories} kcal.`;

  function saveSession(mode = "primary") {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      date: todayKey,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      intensity: selectedIntensity,
      intensityLabel: INTENSITIES[selectedIntensity].label,
      minutes,
      calories: estimatedCalories,
      weightKg: userWeightKg,
      mode,
    };

    setSessions((prev) => [...prev, entry]);
  }

  function handlePrimaryAction() {
    saveSession("primary");
  }

  function handleAddMore() {
    plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOpenMeal() {
    navigate("/refeicao");
  }

  return (
    <div className="cardio-screen">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .cardio-screen {
          min-height: 100%;
          padding: 18px 14px 120px;
          color: rgba(255,255,255,0.96);
          background:
            radial-gradient(circle at top center, rgba(111, 182, 255, 0.18) 0%, transparent 30%),
            linear-gradient(180deg, #0b1017 0%, #0d121b 42%, #0a0e14 100%);
        }

        .cardio-container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
        }

        .cardio-card {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.09) 0%,
            rgba(255,255,255,0.055) 100%
          );
          backdrop-filter: blur(22px) saturate(140%);
          -webkit-backdrop-filter: blur(22px) saturate(140%);
          box-shadow:
            0 18px 50px rgba(0,0,0,0.26),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .hero-card {
          display: grid;
          grid-template-columns: 188px 1fr;
          gap: 18px;
          padding: 22px;
          margin-bottom: 16px;
        }

        .apple-kicker {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.76);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          margin-bottom: 10px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(30px, 4vw, 38px);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .hero-subtitle {
          margin: 10px 0 0;
          max-width: 58ch;
          color: rgba(255,255,255,0.72);
          font-size: 15px;
          line-height: 1.5;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .stat-card {
          border-radius: 24px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.045);
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.62);
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 24px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .stat-caption {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.54);
          line-height: 1.35;
        }

        .hero-actions,
        .planner-actions,
        .success-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .primary-button,
        .secondary-button,
        .ghost-button,
        .chip-button,
        .intensity-button,
        .workout-button {
          appearance: none;
          border: none;
          outline: none;
          cursor: pointer;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .ghost-button:hover,
        .chip-button:hover,
        .intensity-button:hover,
        .workout-button:hover {
          transform: translateY(-1px);
        }

        .primary-button {
          min-height: 52px;
          padding: 0 18px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(137,205,255,0.98) 0%, rgba(53,145,255,1) 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 12px 26px rgba(39, 124, 227, 0.28);
        }

        .secondary-button,
        .ghost-button {
          min-height: 52px;
          padding: 0 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.96);
          font-size: 15px;
          font-weight: 700;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
          gap: 16px;
          margin-top: 16px;
        }

        .planner-card,
        .controls-card,
        .history-card,
        .timeline-card,
        .success-card {
          padding: 18px;
        }

        .cardio-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .cardio-section-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .cardio-section-subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          color: rgba(255,255,255,0.64);
          line-height: 1.5;
        }

        .workout-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .workout-button {
          text-align: left;
          padding: 16px;
          border-radius: 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.96);
        }

        .workout-button.active {
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.12) 0%,
            rgba(117, 188, 255, 0.10) 100%
          );
          border-color: rgba(136, 202, 255, 0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .workout-name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .workout-subtitle {
          margin-top: 7px;
          font-size: 12px;
          color: rgba(255,255,255,0.62);
          line-height: 1.45;
        }

        .label-row {
          margin-bottom: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.60);
          font-weight: 700;
        }

        .duration-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip-button {
          min-width: 62px;
          min-height: 44px;
          padding: 0 14px;
          border-radius: 17px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.95);
          font-size: 14px;
          font-weight: 700;
        }

        .chip-button.active {
          background: rgba(116, 188, 255, 0.16);
          border-color: rgba(129, 198, 255, 0.28);
        }

        .intensity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .intensity-button {
          text-align: left;
          padding: 14px;
          border-radius: 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.96);
        }

        .intensity-button.active {
          background: rgba(255,255,255,0.08);
          border-color: rgba(128, 198, 255, 0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .intensity-title {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .intensity-feel {
          font-size: 12px;
          color: rgba(255,255,255,0.70);
          line-height: 1.45;
        }

        .intensity-accent {
          margin-top: 8px;
          font-size: 11px;
          color: rgba(165, 216, 255, 0.92);
          line-height: 1.4;
        }

        .estimate-card {
          margin-top: 16px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.065) 0%,
            rgba(255,255,255,0.035) 100%
          );
        }

        .estimate-label {
          font-size: 12px;
          color: rgba(255,255,255,0.62);
          margin-bottom: 6px;
        }

        .estimate-value {
          font-size: clamp(30px, 4.8vw, 44px);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.06em;
          margin: 0;
        }

        .estimate-copy {
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255,255,255,0.78);
        }

        .estimate-note {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.45;
          color: rgba(255,255,255,0.52);
        }

        .success-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 16px;
          background: linear-gradient(
            180deg,
            rgba(82, 186, 129, 0.14) 0%,
            rgba(255,255,255,0.05) 100%
          );
        }

        .success-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .success-mark {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(101, 218, 146, 0.14);
          border: 1px solid rgba(146, 255, 186, 0.20);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .success-mark::before {
          content: "";
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #9af0b9 0%, #35c06f 100%);
          box-shadow: 0 0 18px rgba(53, 192, 111, 0.45);
        }

        .success-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .success-copy {
          margin: 6px 0 0;
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          line-height: 1.5;
        }

        .timeline-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
          align-items: start;
        }

        .timeline-item {
          text-align: center;
        }

        .timeline-bubble {
          width: 20px;
          height: 20px;
          margin: 0 auto 10px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.11);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 0 6px rgba(255,255,255,0.02);
        }

        .timeline-bubble-inner {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.34);
        }

        .timeline-bubble.done {
          background: linear-gradient(180deg, rgba(141, 211, 255, 0.96) 0%, rgba(56, 149, 255, 0.96) 100%);
          border-color: rgba(185, 227, 255, 0.30);
          box-shadow:
            0 0 0 6px rgba(84, 166, 255, 0.06),
            0 10px 20px rgba(54, 138, 255, 0.22);
        }

        .timeline-bubble.done .timeline-bubble-inner {
          background: rgba(255,255,255,0.92);
        }

        .timeline-day {
          text-transform: capitalize;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.82);
        }

        .timeline-minutes {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.52);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }

        .history-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 14px;
          border-radius: 22px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .history-item-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .history-item-meta {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.62);
          line-height: 1.4;
        }

        .history-item-kcal {
          align-self: center;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .empty-card {
          padding: 18px;
          border-radius: 22px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.66);
          font-size: 14px;
          line-height: 1.5;
        }

        .cardio-ring-wrap {
          position: relative;
          width: 170px;
          height: 170px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cardio-ring-svg {
          filter: drop-shadow(0 10px 24px rgba(53, 145, 255, 0.18));
        }

        .cardio-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
        }

        .cardio-ring-value {
          font-size: 29px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .cardio-ring-label {
          margin-top: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.72);
          line-height: 1.3;
        }

        .cardio-ring-sublabel {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(170, 219, 255, 0.92);
          line-height: 1.35;
        }

        @media (max-width: 860px) {
          .hero-card,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .hero-card {
            gap: 10px;
          }
        }

        @media (max-width: 640px) {
          .cardio-screen {
            padding: 14px 12px 110px;
          }

          .cardio-card {
            border-radius: 28px;
          }

          .hero-stats,
          .intensity-grid,
          .workout-grid {
            grid-template-columns: 1fr;
          }

          .timeline-row {
            gap: 6px;
          }

          .hero-title {
            font-size: 30px;
          }
        }
      `}</style>

      <div className="cardio-container">
        <section className="cardio-card hero-card">
          <RingProgress
            progress={weekProgress}
            value={`${weekMinutes} min`}
            label="meta semanal"
            sublabel={weekProgress >= 100 ? "semana fechada" : `faltam ${minutesLeft} min`}
          />

          <div>
            <div className="apple-kicker">Cardio · foco, clareza e constância</div>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-subtitle">{subtitle}</p>

            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-label">Hoje</div>
                <div className="stat-value">{todayCalories} kcal</div>
                <div className="stat-caption">{todayMinutes} min acumulados</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Se fizer agora</div>
                <div className="stat-value">{estimatedCalories} kcal</div>
                <div className="stat-caption">estimativa da sessão atual</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Semana</div>
                <div className="stat-value">{weekCalories} kcal</div>
                <div className="stat-caption">
                  {weekMinutes}/{WEEKLY_GOAL_MINUTES} min
                </div>
              </div>
            </div>

            <div className="hero-actions">
              {!completedToday ? (
                <button className="primary-button" onClick={handlePrimaryAction}>
                  Concluir cardio de hoje
                </button>
              ) : (
                <>
                  <button className="primary-button" onClick={handleAddMore}>
                    Fazer mais cardio
                  </button>
                  <button className="ghost-button" onClick={handleOpenMeal}>
                    Ver minha refeição
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {completedToday ? (
          <section className="cardio-card success-card">
            <div className="success-left">
              <div className="success-mark" />
              <div>
                <h3 className="success-title">Seu cardio do dia já está marcado</h3>
                <p className="success-copy">
                  Você fechou a meta de hoje. Se quiser, pode adicionar mais alguns minutos
                  agora ou seguir para a alimentação.
                </p>
              </div>
            </div>

            <div className="success-actions" style={{ marginTop: 0 }}>
              <button className="secondary-button" onClick={handleAddMore}>
                Fazer mais cardio
              </button>
              <button className="ghost-button" onClick={handleOpenMeal}>
                Ver minha refeição
              </button>
            </div>
          </section>
        ) : null}

        <div className="content-grid" ref={plannerRef}>
          <section className="cardio-card planner-card">
            <div className="cardio-section-head">
              <div>
                <h3 className="cardio-section-title">Escolha seu cardio</h3>
                <p className="cardio-section-subtitle">
                  Opções limpas, fáceis de bater o olho e entender.
                </p>
              </div>
            </div>

            <div className="workout-grid">
              {WORKOUTS.map((workout) => (
                <button
                  key={workout.id}
                  className={`workout-button ${selectedWorkoutId === workout.id ? "active" : ""}`}
                  onClick={() => setSelectedWorkoutId(workout.id)}
                >
                  <div className="workout-name">{workout.name}</div>
                  <div className="workout-subtitle">{workout.subtitle}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="cardio-card controls-card">
            <div className="cardio-section-head">
              <div>
                <h3 className="cardio-section-title">Monte a sessão</h3>
                <p className="cardio-section-subtitle">
                  Tempo e esforço em linguagem simples.
                </p>
              </div>
            </div>

            <div>
              <div className="label-row">Quanto tempo?</div>
              <div className="duration-row">
                {DURATIONS.map((item) => (
                  <button
                    key={item}
                    className={`chip-button ${minutes === item ? "active" : ""}`}
                    onClick={() => setMinutes(item)}
                  >
                    {item} min
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="label-row">Qual intensidade?</div>
              <div className="intensity-grid">
                {Object.entries(INTENSITIES).map(([key, info]) => (
                  <button
                    key={key}
                    className={`intensity-button ${selectedIntensity === key ? "active" : ""}`}
                    onClick={() => setSelectedIntensity(key)}
                  >
                    <div className="intensity-title">{info.label}</div>
                    <div className="intensity-feel">{info.feel}</div>
                    <div className="intensity-accent">{info.accent}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="estimate-card">
              <div className="estimate-label">Estimativa da sessão</div>
              <p className="estimate-value">~ {estimatedCalories} kcal</p>
              <div className="estimate-copy">
                {minutes} min de <strong>{selectedWorkout.name.toLowerCase()}</strong> em ritmo{" "}
                <strong>{INTENSITIES[selectedIntensity].label.toLowerCase()}</strong>.
              </div>
              <div className="estimate-note">
                Estimativa baseada no seu peso ({userWeightKg} kg). Ela serve para acompanhar
                progresso e motivação, não para precisão clínica.
              </div>
            </div>

            <div className="planner-actions">
              <button className="primary-button" onClick={handlePrimaryAction}>
                {completedToday ? "Somar mais cardio" : "Concluir cardio de hoje"}
              </button>
            </div>
          </section>
        </div>

        <WeekTimeline sessions={sessions} />

        <section className="cardio-card history-card" style={{ marginTop: 16 }}>
          <div className="cardio-section-head">
            <div>
              <h3 className="cardio-section-title">Últimas sessões</h3>
              <p className="cardio-section-subtitle">
                Histórico direto para reforçar percepção de evolução.
              </p>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="empty-card">
              Sua primeira sessão vai aparecer aqui. Assim que você concluir o cardio de hoje,
              a timeline e o histórico começam a preencher.
            </div>
          ) : (
            <div className="history-list">
              {recentSessions.map((item) => (
                <div key={item.id} className="history-item">
                  <div>
                    <div className="history-item-title">{item.workoutName}</div>
                    <div className="history-item-meta">
                      {item.minutes} min • {item.intensityLabel} •{" "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      }).format(new Date(`${item.date}T12:00:00`))}
                    </div>
                  </div>
                  <div className="history-item-kcal">{item.calories} kcal</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
