import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Cardio.jsx
 * - Modos: timer | chrono | calories
 * - Fundo claro (white) e paleta do app
 * - Export default + named export CardioMiniDock
 */

const APP_ORANGE = "#FF6A00";
const APP_ACCENT = "#FFB26B";
const APP_BG = "#ffffff";
const APP_TEXT = "#0b1220";
const APP_MUTED = "#6b7280";

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

function caloriesFromMET({ met, minutes, weightKg = 80 }) {
  // kcal/min = MET * 3.5 * kg / 200
  const kcalPerMin = (met * 3.5 * weightKg) / 200;
  return Math.round(minutes * kcalPerMin);
}

function RingProgress({ progress = 0, size = 150, stroke = 12, value, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-svg" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(11,17,24,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradMain)`}
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
          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day).replace(".", "");
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

/* ---------------- Main component ---------------- */
export default function Cardio({ userWeightKg = 80 }) {
  const nav = useNavigate();
  const plannerRef = useRef(null);

  // UI state
  const [mode, setMode] = useState("timer"); // timer | chrono | calories
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

  // stopwatch (chrono)
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

  // MET used for estimates uses workout's moderate MET scaled by intensity multiplier
  const metNow = useMemo(() => {
    const base = selectedWorkout?.mets?.moderate || 5.5;
    return +(base * intensityInfo.multiplier).toFixed(2);
  }, [selectedWorkout, intensityInfo]);

  const kcalPerMin = useMemo(() => ((metNow * 3.5 * (userWeightKg || 80)) / 200), [metNow, userWeightKg]);

  // week / today stats
  const todayKey = getDateKey();
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === todayKey), [sessions]);
  const todayMinutes = todaySessions.reduce((a, b) => a + (b.minutes || 0), 0);
  const todayKcal = todaySessions.reduce((a, b) => a + (b.calories || 0), 0);

  const last7Boundary = new Date();
  last7Boundary.setDate(last7Boundary.getDate() - 6);
  const weekSessions = sessions.filter((s) => new Date(`${s.date}T12:00:00`) >= last7Boundary);
  const weekMinutes = weekSessions.reduce((a, b) => a + (b.minutes || 0), 0);
  const weekKcal = weekSessions.reduce((a, b) => a + (b.calories || 0), 0);
  const weekProgress = Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100));
  const minutesLeft = Math.max(0, WEEKLY_GOAL_MINUTES - weekMinutes);

  const recentSessions = [...sessions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  const completedToday = todaySessions.length > 0;

  // helpers
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

  // Timer mode: user picks minutes and clicks primary to "start" — here we simply save (could be extended with a live timer)
  function handleTimerSave() {
    saveSessionFromMinutes(minutes, "timer");
  }

  // Chrono mode: use chronoElapsedSec; save current elapsed time in minutes
  function handleChronoSave() {
    const mins = Math.max(1, Math.round(chronoElapsedSec / 60));
    saveSessionFromMinutes(mins, "chrono");
    // reset chrono for convenience
    setChronoElapsedSec(0);
    setChronoRunning(false);
  }

  // Calories mode: calculate required minutes from kcal target
  function handleCaloriesStartOrSave() {
    const kcal = Math.max(0, Math.round(Number(calTarget || 0)));
    if (kcal <= 0) return;
    const minutesNeeded = Math.max(1, Math.ceil(kcal / Math.max(0.1, kcalPerMin)));
    saveSessionFromMinutes(minutesNeeded, "calorie-target");
    setCalTarget("");
  }

  // Chrono controls
  function chronoToggle() {
    setChronoRunning((r) => !r);
  }
  function chronoReset() {
    setChronoRunning(false);
    setChronoElapsedSec(0);
  }

  // small helpers for display
  function formatMMSS(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="cardio-screen">
      <style>{`
        :root {
          --app-orange: ${APP_ORANGE};
          --app-accent: ${APP_ACCENT};
          --app-bg: ${APP_BG};
          --app-text: ${APP_TEXT};
          --app-muted: ${APP_MUTED};
        }

        * { box-sizing: border-box; }
        body, #root { background: var(--app-bg); }

        .cardio-screen {
          min-height: 100%;
          padding: 18px 14px 120px;
          color: var(--app-text);
          background: var(--app-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
        }

        .card {
          border-radius: 16px;
          padding: 18px;
          background: #fff;
          border: 1px solid rgba(11,17,24,0.06);
          box-shadow: 0 8px 30px rgba(11,17,24,0.04);
        }

        .hero {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 18px;
          align-items: start;
          margin-bottom: 14px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,106,0,0.08), rgba(255,178,107,0.05));
          color: var(--app-muted);
          font-weight: 700;
          font-size: 13px;
        }

        h1.title {
          margin: 0 0 6px 0;
          font-size: 28px;
          line-height: 1.03;
          color: var(--app-text);
          letter-spacing: -0.02em;
        }

        .subtitle {
          margin: 0;
          color: var(--app-muted);
          font-size: 14px;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .stat {
          background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,1));
          border-radius: 12px;
          padding: 12px;
          border: 1px solid rgba(11,17,24,0.04);
        }
        .stat .label { font-size: 12px; color: var(--app-muted); margin-bottom: 6px; }
        .stat .value { font-weight: 800; font-size: 18px; color: var(--app-text); }

        .modes {
          display:flex;
          gap:8px;
          margin-top: 12px;
        }
        .mode-btn {
          padding:10px 12px;
          border-radius:10px;
          border:1px solid rgba(11,17,24,0.06);
          background: #fff;
          font-weight:700;
          cursor:pointer;
        }
        .mode-btn.active {
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          color: #111;
          box-shadow: 0 8px 28px rgba(255,106,0,0.08);
        }

        .content {
          display:grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
          margin-top: 14px;
        }

        .workout-grid {
          display:grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .workout-card {
          padding: 14px;
          border-radius: 12px;
          border:1px solid rgba(11,17,24,0.04);
          background:#fff;
          text-align:left;
          cursor:pointer;
          min-height: 88px;
        }
        .workout-card.active {
          border-color: rgba(255,106,0,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
          background: linear-gradient(180deg, rgba(255,106,0,0.04), rgba(255,255,255,1));
        }
        .workout-name { font-weight:800; font-size:15px; color: var(--app-text); }
        .workout-sub { font-size:13px; color: var(--app-muted); margin-top:6px; }

        .control {
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .label { font-size:13px; color: var(--app-muted); font-weight:700; }
        .durations { display:flex; gap:8px; flex-wrap:wrap; }
        .chip {
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(11,17,24,0.06);
          background:#fff;
          cursor:pointer;
          font-weight:700;
        }
        .chip.active { background: linear-gradient(90deg, rgba(255,106,0,0.12), rgba(255,178,107,0.06)); color:#111; border-color: rgba(255,106,0,0.14); }

        .intensity-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
        .intensity-card { padding:12px; border-radius:12px; border:1px solid rgba(11,17,24,0.04); background:#fff; min-height:110px; cursor:pointer; }
        .intensity-card.active { border-color: rgba(255,106,0,0.12); box-shadow: inset 0 1px 0 rgba(255,255,255,0.8); }

        .estimate {
          margin-top:8px;
          padding:12px;
          border-radius:12px;
          border:1px solid rgba(11,17,24,0.04);
          background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,1));
        }
        .estimate .big { font-size: clamp(28px, 5vw, 40px); font-weight:800; color: var(--app-text); }

        .actions { margin-top:12px; display:flex; gap:10px; flex-wrap:wrap; }
        .primary {
          background: linear-gradient(90deg, var(--app-orange), var(--app-accent));
          border:none;
          padding:12px 16px;
          border-radius:12px;
          font-weight:800;
          cursor:pointer;
          color:#111;
        }
        .ghost {
          background:transparent;
          border:1px solid rgba(11,17,24,0.06);
          padding:12px 14px;
          border-radius:12px;
          font-weight:700;
          cursor:pointer;
        }

        .chrono-box {
          display:flex;
          gap:10px;
          align-items:center;
        }
        .chrono-time {
          font-weight:900;
          font-size:28px;
          letter-spacing: -0.02em;
        }

        .history { margin-top:14px; }
        .history-item { display:flex; justify-content:space-between; gap:10px; padding:10px; border-radius:10px; border:1px solid rgba(11,17,24,0.04); background:#fff; }
        .empty { padding:14px; border-radius:10px; border:1px dashed rgba(11,17,24,0.06); color: var(--app-muted); }

        /* ring styles */
        .ring-wrap { position:relative; width:150px; height:150px; display:flex; align-items:center; justify-content:center; }
        .ring-svg { max-width:100%; height:auto; }
        .ring-center { position:absolute; text-align:center; }
        .ring-value { font-weight:800; font-size:20px; }
        .ring-label { font-size:12px; color: var(--app-muted); }
        .ring-sub { font-size:11px; color: rgba(11,17,24,0.6); }

        @media (max-width: 920px) {
          .content { grid-template-columns: 1fr; }
          .hero { grid-template-columns: 120px 1fr; }
          .ring-wrap { width:128px; height:128px; }
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
            <h1 className="title">{completedToday ? "Cardio de hoje concluído" : "Feche seu cardio de hoje"}</h1>
            <p className="subtitle">
              {completedToday
                ? `Hoje: ${todayMinutes} min • ${todayKcal} kcal`
                : `${minutes} min de ${selectedWorkout.name.toLowerCase()} em ritmo ${INTENSITIES[selectedIntensity].label.toLowerCase()} — ~${Math.round(kcalPerMin)} kcal/min`}
            </p>

            <div className="modes" role="tablist" aria-label="Modos cardio">
              <button className={`mode-btn ${mode === "timer" ? "active" : ""}`} onClick={() => setMode("timer")}>Timer</button>
              <button className={`mode-btn ${mode === "chrono" ? "active" : ""}`} onClick={() => setMode("chrono")}>Cronômetro</button>
              <button className={`mode-btn ${mode === "calories" ? "active" : ""}`} onClick={() => setMode("calories")}>Por calorias</button>
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

            <div className="workout-grid" style={{ marginTop: 12 }}>
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

            <div style={{ height: 14 }} />

            <div className="section-head">
              <div>
                <h3 className="section-title">Ajustes</h3>
                <p className="section-sub">Tempo, intensidade e estimativas claras.</p>
              </div>
            </div>

            <div className="control">
              {mode === "timer" && (
                <>
                  <div>
                    <div className="label">Quanto tempo?</div>
                    <div className="durations" style={{ marginTop: 8 }}>
                      {DURATIONS.map((d) => (
                        <button key={d} className={`chip ${minutes === d ? "active" : ""}`} onClick={() => setMinutes(d)}>
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="label">Intensidade</div>
                    <div className="intensity-grid" style={{ marginTop: 8 }}>
                      {Object.entries(INTENSITIES).map(([k, v]) => (
                        <div key={k} className={`intensity-card ${selectedIntensity === k ? "active" : ""}`} onClick={() => setSelectedIntensity(k)}>
                          <div style={{ fontWeight: 800 }}>{v.label}</div>
                          <div style={{ marginTop: 6, color: APP_MUTED }}>{v.feel}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa</div>
                    <div className="big">~ {Math.round(minutes * kcalPerMin)} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6 }}>
                      {minutes} min • {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button className="primary" onClick={handleTimerSave}>Concluir sessão ({minutes} min)</button>
                    <button className="ghost" onClick={() => plannerRef.current?.scrollIntoView({ behavior: "smooth" })}>Fazer mais</button>
                  </div>
                </>
              )}

              {mode === "chrono" && (
                <>
                  <div>
                    <div className="label">Cronômetro</div>
                    <div className="chrono-box" style={{ marginTop: 8 }}>
                      <div className="chrono-time">{formatMMSS(chronoElapsedSec)}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="chip" onClick={chronoToggle}>{chronoRunning ? "Pausar" : "Iniciar"}</button>
                        <button className="chip" onClick={chronoReset}>Reset</button>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, color: APP_MUTED }}>
                      Ao salvar, o cronômetro grava os minutos completos (arredondados).
                    </div>
                  </div>

                  <div className="estimate">
                    <div className="label">Estimativa atualmente</div>
                    <div className="big">~ {Math.round((chronoElapsedSec / 60) * kcalPerMin)} kcal</div>
                    <div style={{ color: APP_MUTED, marginTop: 6 }}>
                      {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button className="primary" onClick={handleChronoSave} disabled={chronoElapsedSec < 30}>Salvar sessão</button>
                    <button className="ghost" onClick={() => { setChronoElapsedSec(0); setChronoRunning(false); }}>Cancelar</button>
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
                      style={{ marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid rgba(11,17,24,0.06)", width: "100%" }}
                    />
                    <div style={{ marginTop: 8, color: APP_MUTED }}>
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
                    <div style={{ color: APP_MUTED, marginTop: 6 }}>
                      {selectedWorkout.name} • {INTENSITIES[selectedIntensity].label}
                    </div>
                  </div>

                  <div className="actions">
                    <button className="primary" onClick={handleCaloriesStartOrSave} disabled={!Number(calTarget) || Number(calTarget) <= 0}>Salvar por kcal</button>
                    <button className="ghost" onClick={() => setCalTarget("")}>Limpar</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* right column */}
          <aside>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: APP_MUTED, fontWeight: 700 }}>Hoje</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{todayMinutes} min • {todayKcal} kcal</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: APP_MUTED }}>Semana</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{weekMinutes} min</div>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", justifyContent: "center" }}>
                <RingProgress progress={weekProgress} value={`${weekMinutes}m`} label="semana" sublabel={`${weekKcal} kcal`} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: APP_MUTED, fontWeight: 700 }}>Histórico recente</div>

                <div style={{ marginTop: 10 }}>
                  {recentSessions.length === 0 ? (
                    <div className="empty">Nenhuma sessão registrada ainda.</div>
                  ) : (
                    recentSessions.map((s) => (
                      <div key={s.id} className="history-item" style={{ marginTop: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800 }}>{s.workoutName}</div>
                          <div style={{ color: APP_MUTED, fontSize: 13 }}>{s.minutes} min • {s.intensityLabel}</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>{s.calories} kcal</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="ghost" onClick={() => nav("/treino")}>Treinos</button>
                <button className="ghost" onClick={() => nav("/nutricao")}>Nutrição</button>
              </div>
            </div>
          </aside>
        </div>

        <div ref={plannerRef} style={{ height: 40 }} />
      </div>
    </div>
  );
}

/* ---------------- CardioMiniDock ----------------
   Export named to satisfy App.tsx import.
   Most lightweight: aparece quando há alguma sessão hoje.
*/
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
        bottom: 84,
        zIndex: 9999,
        borderRadius: 14,
        padding: "10px 14px",
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
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#111" }} />
        <div style={{ minWidth: 0, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Cardio hoje</div>
          <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12 }}>{todayInfo.minutes} min • {todayInfo.kcal} kcal</div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 900 }}>{todayInfo.minutes}m</div>
    </button>
  );
}
