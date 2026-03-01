// src/pages/Cardio.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  low: { label: "Leve", feel: "Você consegue conversar normalmente", accent: "Bom para manter constância" },
  moderate: { label: "Moderado", feel: "Respiração acelerada, mas controlada", accent: "Melhor equilíbrio para a maioria" },
  high: { label: "Intenso", feel: "Puxado, com bastante esforço", accent: "Maior gasto em menos tempo" },
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

/* ---------- Ring Progress (visual) ---------- */
function RingProgress({ progress = 0, size = 170, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="cardio-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cardio-ring-svg" aria-hidden>
        <defs>
          <linearGradient id="cardioRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.86)" />
            <stop offset="55%" stopColor="rgba(255,166,110,0.95)" />
            <stop offset="100%" stopColor="rgba(255,106,0,0.98)" />
          </linearGradient>
        </defs>

        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
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

/* ---------- Week timeline ---------- */
function WeekTimeline({ sessions }) {
  const days = getLast7Days();
  return (
    <section className="cardio-card timeline-card">
      <div className="cardio-section-head">
        <div>
          <h3 className="cardio-section-title">Seu ritmo da semana</h3>
          <p className="cardio-section-subtitle">Visual simples para enxergar constância sem poluição.</p>
        </div>
      </div>

      <div className="timeline-row">
        {days.map((day) => {
          const key = getDateKey(day);
          const daySessions = sessions.filter((item) => item.date === key);
          const totalMinutes = daySessions.reduce((acc, item) => acc + item.minutes, 0);
          const done = daySessions.length > 0;

          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
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

/* ---------- Main component ---------- */
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

  const selectedWorkout = useMemo(() => WORKOUTS.find((item) => item.id === selectedWorkoutId) || WORKOUTS[0], [selectedWorkoutId]);
  const todayKey = getDateKey();
  const todaySessions = useMemo(() => sessions.filter((item) => item.date === todayKey), [sessions, todayKey]);
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

  const recentSessions = [...sessions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 4);

  const title = completedToday ? "Cardio de hoje concluído" : "Feche seu cardio de hoje";
  const subtitle = completedToday
    ? `Hoje você já fez ${todayMinutes} min e queimou cerca de ${todayCalories} kcal.`
    : `${minutes} min de ${selectedWorkout.name.toLowerCase()} em ritmo ${INTENSITIES[selectedIntensity].label.toLowerCase()} devem gastar cerca de ${estimatedCalories} kcal.`;

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

  function handlePrimaryAction() { saveSession("primary"); }
  function handleAddMore() { plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function handleOpenMeal() { navigate("/refeicao"); }

  return (
    <div className="cardio-screen">
      <style>{styles()}</style>

      <div className="cardio-container">
        <section className="cardio-card hero-card" aria-labelledby="hero-title">
          <RingProgress
            progress={weekProgress}
            value={`${weekMinutes} min`}
            label="meta semanal"
            sublabel={weekProgress >= 100 ? "semana fechada" : `faltam ${minutesLeft} min`}
            size={170}
            stroke={12}
          />

          <div>
            <div className="apple-kicker">Cardio · foco, clareza e constância</div>
            <h1 id="hero-title" className="hero-title">{title}</h1>
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
                <div className="stat-caption">{weekMinutes}/{WEEKLY_GOAL_MINUTES} min</div>
              </div>
            </div>

            <div className="hero-actions">
              {!completedToday ? (
                <button className="primary-button" onClick={handlePrimaryAction}>Concluir cardio de hoje</button>
              ) : (
                <>
                  <button className="primary-button" onClick={handleAddMore}>Fazer mais cardio</button>
                  <button className="ghost-button" onClick={handleOpenMeal}>Ver minha refeição</button>
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
                  Você fechou a meta de hoje. Se quiser, pode adicionar mais alguns minutos agora ou seguir para a alimentação.
                </p>
              </div>
            </div>

            <div className="success-actions" style={{ marginTop: 0 }}>
              <button className="secondary-button" onClick={handleAddMore}>Fazer mais cardio</button>
              <button className="ghost-button" onClick={handleOpenMeal}>Ver minha refeição</button>
            </div>
          </section>
        ) : null}

        <div className="content-grid" ref={plannerRef}>
          <section className="cardio-card planner-card">
            <div className="cardio-section-head">
              <div>
                <h3 className="cardio-section-title">Escolha seu cardio</h3>
                <p className="cardio-section-subtitle">Opções limpas, fáceis de bater o olho e entender.</p>
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
                <p className="cardio-section-subtitle">Tempo e esforço em linguagem simples.</p>
              </div>
            </div>

            <div>
              <div className="label-row">Quanto tempo?</div>
              <div className="duration-row">
                {DURATIONS.map((item) => (
                  <button key={item} className={`chip-button ${minutes === item ? "active" : ""}`} onClick={() => setMinutes(item)}>
                    {item} min
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="label-row">Qual intensidade?</div>
              <div className="intensity-grid">
                {Object.entries(INTENSITIES).map(([key, info]) => (
                  <button key={key} className={`intensity-button ${selectedIntensity === key ? "active" : ""}`} onClick={() => setSelectedIntensity(key)}>
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
                {minutes} min de <strong>{selectedWorkout.name.toLowerCase()}</strong> em ritmo <strong>{INTENSITIES[selectedIntensity].label.toLowerCase()}</strong>.
              </div>
              <div className="estimate-note">Estimativa baseada no seu peso ({userWeightKg} kg).</div>
            </div>

            <div className="planner-actions" style={{ marginTop: 12 }}>
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
              <p className="cardio-section-subtitle">Histórico direto para reforçar percepção de evolução.</p>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="empty-card">
              Sua primeira sessão vai aparecer aqui. Assim que você concluir o cardio de hoje, a timeline e o histórico começam a preencher.
            </div>
          ) : (
            <div className="history-list">
              {recentSessions.map((item) => (
                <div key={item.id} className="history-item">
                  <div>
                    <div className="history-item-title">{item.workoutName}</div>
                    <div className="history-item-meta">
                      {item.minutes} min • {item.intensityLabel} •{" "}
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${item.date}T12:00:00`))}
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

/* ---------- Styles (kept inline for single-file paste) ---------- */
function styles() {
  return `
  * { box-sizing: border-box; }
  .cardio-screen {
    min-height: 100%;
    padding: 18px 18px 140px;
    color: rgba(255,255,255,0.96);
    background:
      radial-gradient(circle at top center, rgba(255,166,110,0.06) 0%, transparent 24%),
      linear-gradient(180deg, #0b1017 0%, #0d121b 42%, #0a0e14 100%);
    -webkit-font-smoothing: antialiased;
  }
  .cardio-container {
    width: 100%;
    max-width: 980px; /* keep content centered and prevent edge clipping */
    margin: 0 auto;
  }

  .cardio-card {
    position: relative;
    overflow: visible;
    border-radius: 26px;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.028) 100%);
    backdrop-filter: blur(20px) saturate(120%);
    -webkit-backdrop-filter: blur(20px) saturate(120%);
    box-shadow:
      0 18px 50px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  /* hero */
  .hero-card {
    display: grid;
    grid-template-columns: 188px 1fr;
    gap: 18px;
    padding: 22px;
    margin-bottom: 16px;
    align-items: start;
  }
  .apple-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.76);
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .hero-title {
    margin: 0;
    font-size: clamp(28px, 4vw, 36px);
    line-height: 1.02;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .hero-subtitle {
    margin: 10px 0 0;
    max-width: 68ch;
    color: rgba(255,255,255,0.72);
    font-size: 15px;
    line-height: 1.45;
  }
  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }
  .stat-card {
    border-radius: 18px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    min-height: 74px;
  }
  .stat-label { font-size: 12px; color: rgba(255,255,255,0.62); margin-bottom: 6px; font-weight:700; }
  .stat-value { font-size: 22px; line-height:1; font-weight:800; }
  .stat-caption { margin-top:6px; font-size:12px; color: rgba(255,255,255,0.54); }

  .hero-actions { display:flex; gap:10px; margin-top: 16px; flex-wrap:wrap; }
  .primary-button {
    min-height: 52px;
    padding: 0 18px;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(255,166,110,0.98) 0%, rgba(255,106,0,1) 100%);
    color: #111;
    font-weight:800;
    border:none;
    box-shadow: 0 12px 26px rgba(255,106,0,0.12);
  }
  .ghost-button {
    min-height: 52px;
    padding: 0 16px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.96);
    font-weight:700;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
    gap: 16px;
    margin-top: 16px;
  }

  .cardio-section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom: 14px; }
  .cardio-section-title { margin:0; font-size:20px; font-weight:800; }
  .cardio-section-subtitle { margin:6px 0 0; font-size:13px; color: rgba(255,255,255,0.64); }

  .workout-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .workout-button {
    text-align:left; padding: 16px; border-radius: 18px;
    background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.96);
    min-height: 120px;
  }
  .workout-button.active {
    background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
    border-color: rgba(255,166,110,0.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  }
  .workout-name { font-size:16px; font-weight:800; }
  .workout-subtitle { margin-top:7px; font-size:13px; color: rgba(255,255,255,0.70); line-height:1.4; }

  .label-row { margin-bottom:8px; font-size:12px; color: rgba(255,255,255,0.60); font-weight:700; }
  .duration-row { display:flex; flex-wrap:wrap; gap:10px; }
  .chip-button {
    min-width:62px; min-height:44px; padding:0 14px; border-radius:14px; background: rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.96); font-weight:700;
  }
  .chip-button.active { background: rgba(255,166,110,0.12); border-color: rgba(255,166,110,0.18); color: #111; }

  .intensity-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; margin-top:14px; }
  .intensity-button { text-align:left; padding:14px; border-radius:16px; background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); min-height:110px; }
  .intensity-button.active { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); box-shadow: inset 0 1px 0 rgba(255,255,255,0.03); }
  .intensity-title { font-size:15px; font-weight:800; }
  .intensity-feel { font-size:12px; color: rgba(255,255,255,0.70); margin-top:6px; }
  .intensity-accent { margin-top:8px; font-size:11px; color: rgba(255,200,150,0.95); }

  .estimate-card {
    margin-top: 16px; padding: 18px; border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  }
  .estimate-label { font-size:12px; color: rgba(255,255,255,0.62); margin-bottom:6px; }
  .estimate-value { font-size: clamp(28px, 4.8vw, 44px); font-weight:800; margin:0; line-height:1; }
  .estimate-copy { margin-top:8px; font-size:14px; color: rgba(255,255,255,0.78); }

  .timeline-row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    align-items: start;
    margin-top: 16px;
  }
  .timeline-item { text-align:center; }
  .timeline-bubble { width:20px; height:20px; margin:0 auto 10px; border-radius:999px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.11); border:1px solid rgba(255,255,255,0.08); }
  .timeline-bubble.done { background: linear-gradient(180deg, rgba(255,166,110,0.95) 0%, rgba(255,106,0,0.98) 100%); border-color: rgba(255,166,110,0.18); box-shadow: 0 8px 20px rgba(255,106,0,0.12); }
  .timeline-day { text-transform: capitalize; font-size:12px; font-weight:700; color: rgba(255,255,255,0.92); }
  .timeline-minutes { margin-top:6px; font-size:11px; color: rgba(255,255,255,0.52); }

  .history-list { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
  .history-item { display:grid; grid-template-columns: 1fr auto; gap:10px; padding:14px; border-radius:18px; background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }
  .history-item-title { font-size:14px; font-weight:800; }
  .history-item-meta { margin-top:4px; font-size:12px; color: rgba(255,255,255,0.62); }
  .history-item-kcal { align-self:center; font-size:15px; font-weight:800; }

  .empty-card { padding:18px; border-radius:18px; background: rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.08); color: rgba(255,255,255,0.66); font-size:14px; }

  /* ring internal */
  .cardio-ring-wrap { position: relative; display:flex; align-items:center; justify-content:center; }
  .cardio-ring-center { position: absolute; inset: 0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:12px; }
  .cardio-ring-value { font-size: 22px; font-weight:800; }
  .cardio-ring-label { margin-top:6px; font-size:13px; color: rgba(255,255,255,0.72); }
  .cardio-ring-sublabel { margin-top:6px; font-size:11px; color: rgba(255,200,150,0.92); }

  /* success block */
  .success-card { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-top:16px; padding:18px; border-radius:18px; background: linear-gradient(180deg, rgba(82,186,129,0.08), rgba(255,255,255,0.02)); }
  .success-left { display:flex; align-items:center; gap:14px; }
  .success-mark { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: rgba(101,218,146,0.12); border:1px solid rgba(146,255,186,0.18); }
  .success-title { margin:0; font-size:18px; font-weight:800; }
  .success-copy { margin-top:6px; font-size:14px; color: rgba(255,255,255,0.72); }

  /* responsive: avoid squish on mobile -> stack columns and enlarge touch targets */
  @media (max-width: 860px) {
    .hero-card, .content-grid { grid-template-columns: 1fr; }
    .hero-stats { grid-template-columns: 1fr; }
    .workout-grid { grid-template-columns: 1fr; }
    .intensity-grid { grid-template-columns: 1fr; }
    .timeline-row { grid-template-columns: repeat(7, minmax(0, 1fr)); gap:8px; }
    .cardio-container { padding: 0 8px; }
  }

  @media (max-width: 640px) {
    .cardio-screen { padding: 14px 12px 160px; }
    .hero-card { gap: 12px; padding: 16px; }
    .hero-title { font-size: clamp(24px, 8vw, 30px); }
    .stat-value { font-size: 18px; }
    .workout-button { min-height: 140px; padding: 18px; border-radius:16px; }
    .intensity-button { min-height: 120px; padding: 16px; border-radius:16px; }
    .estimate-value { font-size: clamp(22px, 8vw, 36px); }
    .cardio-ring-wrap { width: 150px; height: 150px; }
    .primary-button { min-height:50px; padding: 0 14px; border-radius:12px; }
    .ghost-button { min-height:50px; border-radius:12px; }
  }

  @media (max-width: 420px) {
    .timeline-row { grid-template-columns: repeat(7, minmax(0, 1fr)); gap:6px; }
    .hero-title { font-size: 26px; }
    .cardio-container { max-width: 720px; } /* keep some margin so content never touches edge */
  }
  `;
}
