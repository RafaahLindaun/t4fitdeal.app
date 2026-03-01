// ✅ COLE EM: src/pages/Cardio.jsx
// Cardio — versão nova, estilo mais Apple iOS 26 / Liquid Glass, mantendo:
// - Persistência LIVE em localStorage
// - Mini dock global
// - Timer / Cronômetro
// - Concluir cardio e salvar no dashboard
// - CTA Nutri+ / refeição
// - Fonte 7 segmentos no tempo
//
// Mecânica e estética refeitas:
// - Hero com progresso semanal
// - Cardio de hoje concluído
// - Sessão guiada com estimativa clara de calorias
// - Timeline semanal
// - Histórico recente
// - Modalidade + intensidade mais fáceis de entender
// - Sem poluição visual de MET como foco principal

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- tema base do app ---------------- */
const ORANGE = "#FF6A00";
const ORANGE_SOFT = "#FFB26B";
const BG_DARK = "#0B1118";
const BG_CARD = "rgba(255,255,255,0.08)";
const BG_CARD_STRONG = "rgba(255,255,255,0.12)";
const TEXT = "#F8FAFC";
const MUTED = "rgba(226,232,240,0.68)";
const MUTED_2 = "rgba(226,232,240,0.48)";
const SUCCESS = "#38D67A";
const BLUE = "#63B7FF";

/* ---------------- helpers ---------------- */
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

function nowTs() {
  return Date.now();
}

function msToHumanAgo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}min`;
}

function vibrate(ms = 24) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {}
}

function yyyyMmDd(d = new Date()) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(s) {
  const sec = Math.max(0, Math.floor(Number(s || 0)));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function getGoal(user) {
  const raw = String(user?.objetivo || "hipertrofia").toLowerCase();
  if (raw.includes("power")) return "powerlifting";
  if (raw.includes("body")) return "bodybuilding";
  if (raw.includes("cond")) return "condicionamento";
  if (raw.includes("saud") || raw.includes("bem")) return "saude";
  return "hipertrofia";
}

function getLevel(user) {
  const raw = String(user?.nivel || "iniciante").toLowerCase();
  if (raw.includes("avan")) return "avancado";
  if (raw.includes("inter")) return "intermediario";
  return "iniciante";
}

// kcal/min = MET * 3.5 * kg / 200
function calcKcalPerMin({ kg, met }) {
  const w = Number(kg || 0) || 70;
  const m = Number(met || 1) || 1;
  return (m * 3.5 * w) / 200;
}

function getLast7Days() {
  const base = new Date();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(d);
  }
  return days;
}

function prettyWeekday(d) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d).replace(".", "");
}

function prettyShortDate(dateStr) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateStr}T12:00:00`));
}

/* -------- modalidades -------- */
function getCardioOptions(goal, level) {
  const base = [
    {
      id: "walk",
      title: "Caminhada",
      subtitle: "Leve, constante e fácil de manter",
      met: 4.3,
      mapQ: "parque caminhada",
    },
    {
      id: "run",
      title: "Corrida leve",
      subtitle: "Queima alta em menos tempo",
      met: 7.0,
      mapQ: "pista corrida",
    },
    {
      id: "bike",
      title: "Bike",
      subtitle: "Baixo impacto e boa eficiência",
      met: 6.8,
      mapQ: "ciclovia",
    },
    {
      id: "ellip",
      title: "Elíptico",
      subtitle: "Cardio controlado e confortável",
      met: 5.0,
      mapQ: "academia",
    },
    {
      id: "row",
      title: "Remo",
      subtitle: "Puxa cardio e corpo inteiro",
      met: 6.0,
      mapQ: "academia",
    },
    {
      id: "stair",
      title: "Escada",
      subtitle: "Pernas, pulmão e foco",
      met: 8.8,
      mapQ: "academia",
    },
    {
      id: "hiit",
      title: "HIIT",
      subtitle: "Curto, intenso e direto",
      met: 9.5,
      mapQ: "academia",
    },
  ];

  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "condicionamento") mult = 1.06;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "powerlifting") mult = 0.98;

  if (level === "iniciante") mult *= 0.92;
  if (level === "avancado") mult *= 1.06;

  return base.map((o) => ({ ...o, met: clamp(o.met * mult, 3.2, 11.5) }));
}

function getCongrats(goal, level) {
  if (goal === "saude")
    return level === "iniciante"
      ? "Boa. Fez o básico bem feito — isso já conta."
      : "Perfeito. Mantém a rotina que o corpo responde.";
  if (goal === "condicionamento")
    return level === "iniciante"
      ? "Boa. Seu fôlego começa a virar."
      : "Monstro. Resistência subindo de verdade.";
  if (goal === "powerlifting") return "Cardio na medida certa. Recuperação melhor, força intacta.";
  if (goal === "bodybuilding") return "Cardio inteligente. Ajuda definição e melhora performance.";
  return "Fechado. Consistência vence.";
}

function getIntensityLabel(v) {
  if (v <= 84) return "Leve";
  if (v <= 102) return "Moderado";
  return "Intenso";
}

function getIntensityCopy(v) {
  if (v <= 84) return "Respiração controlada, ritmo confortável";
  if (v <= 102) return "Bom equilíbrio entre esforço e constância";
  return "Mais puxado, maior gasto por minuto";
}

/* ---------------- live persistence ---------------- */
function liveKey(email) {
  return `cardio_live_${email}`;
}
function readLive(email) {
  if (typeof window === "undefined") return null;
  return safeJsonParse(localStorage.getItem(liveKey(email)), null);
}
function writeLive(email, obj) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(liveKey(email), JSON.stringify(obj));
  } catch {}
}
function clearLive(email) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(liveKey(email));
  } catch {}
}

function computeElapsedTotalSec(live, tsNow) {
  if (!live) return 0;
  const base = Number(live.elapsedSecBase || 0) || 0;
  if (!live.running) return base;
  const last = Number(live.lastStartTs || 0) || tsNow;
  return base + Math.max(0, Math.floor((tsNow - last) / 1000));
}

function computeShownSecondsFromLive(live, tsNow) {
  const elapsed = computeElapsedTotalSec(live, tsNow);
  const isTimer = live?.mode === "timer";
  const dur = Number(live?.durationSec || 0) || 0;
  if (isTimer) return Math.max(0, dur - elapsed);
  return elapsed;
}

/* ---------------- visual helpers ---------------- */
function RingProgress({ progress = 0, size = 168, stroke = 12, value, label, sublabel }) {
  const p = clamp(progress, 0, 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - p * circumference;

  return (
    <div style={UI.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={UI.ringSvg}>
        <defs>
          <linearGradient id="cardioRingGradientOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ORANGE_SOFT} />
            <stop offset="100%" stopColor={ORANGE} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cardioRingGradientOrange)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div style={UI.ringCenter}>
        <div style={UI.ringValue}>{value}</div>
        <div style={UI.ringLabel}>{label}</div>
        {sublabel ? <div style={UI.ringSub}>{sublabel}</div> : null}
      </div>
    </div>
  );
}

function AppleSheet({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;

  return (
    <div style={SX.overlay} role="presentation" onClick={onClose}>
      <div style={SX.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={SX.grab} />
        <div style={SX.head}>
          <div style={{ minWidth: 0 }}>
            <div style={SX.title}>{title}</div>
            {subtitle ? <div style={SX.subtitle}>{subtitle}</div> : null}
          </div>
          <button type="button" onClick={onClose} style={SX.x}>
            ✕
          </button>
        </div>

        <div style={SX.body}>{children}</div>

        {footer ? <div style={SX.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = typeof window !== "undefined" ? localStorage.getItem(`paid_${email}`) === "1" : false;
  const nutriPlusNew = typeof window !== "undefined" ? localStorage.getItem(`nutri_plus_${email}`) === "1" : false;
  const nutriPlusOld = typeof window !== "undefined" ? localStorage.getItem(`nutri_${email}`) === "1" : false;
  const nutriPlus = nutriPlusNew || nutriPlusOld;

  const goal = useMemo(() => getGoal(user), [user]);
  const level = useMemo(() => getLevel(user), [user]);
  const weightKg = Number(user?.peso || 0) || 70;

  const options = useMemo(() => getCardioOptions(goal, level), [goal, level]);

  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(options[0]?.id || "walk");
  const selected = useMemo(() => options.find((o) => o.id === selectedId) || options[0], [options, selectedId]);

  const [mode, setMode] = useState("timer"); // timer | chrono
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  const [intensity, setIntensity] = useState(100);

  const [intervalId, setIntervalId] = useState("off");
  const [intOn, setIntOn] = useState(0);
  const [intOff, setIntOff] = useState(0);
  const [phase, setPhase] = useState("steady");
  const [phaseLeft, setPhaseLeft] = useState(0);

  const [calSheet, setCalSheet] = useState(false);
  const [kcalTarget, setKcalTarget] = useState("");
  const [intSheet, setIntSheet] = useState(false);
  const plannerRef = useRef(null);

  const intensityMult = useMemo(() => clamp(intensity / 100, 0.7, 1.15), [intensity]);
  const metNow = useMemo(() => clamp((selected?.met || 4.3) * intensityMult, 3.0, 12.5), [selected, intensityMult]);
  const kcalPerMin = useMemo(() => calcKcalPerMin({ kg: weightKg, met: metNow }), [weightKg, metNow]);

  const today = yyyyMmDd(new Date());
  const sessionsKey = `cardio_sessions_${email}`;
  const totalKey = `cardio_total_${email}`;
  const weekKey = `cardio_week_${email}`;

  const savedSessions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return safeJsonParse(localStorage.getItem(sessionsKey), []);
  }, [sessionsKey]);

  const todaySessions = useMemo(
    () => (Array.isArray(savedSessions) ? savedSessions.filter((item) => item.day === today) : []),
    [savedSessions, today]
  );

  const completedToday = todaySessions.length > 0;
  const todayMinutes = todaySessions.reduce((acc, item) => acc + Number(item.minutes || 0), 0);
  const todayKcal = todaySessions.reduce((acc, item) => acc + Number(item.kcal || 0), 0);

  const weekDays = getLast7Days();
  const weekMap = useMemo(() => {
    if (typeof window === "undefined") return {};
    return safeJsonParse(localStorage.getItem(weekKey), {});
  }, [weekKey]);

  const weekMinutes = useMemo(() => {
    if (!Array.isArray(savedSessions)) return 0;
    const daySet = new Set(weekDays.map((d) => yyyyMmDd(d)));
    return savedSessions.reduce((acc, item) => {
      if (daySet.has(item.day)) return acc + Number(item.minutes || 0);
      return acc;
    }, 0);
  }, [savedSessions]);

  const weekKcal = useMemo(() => {
    return weekDays.reduce((acc, d) => acc + Number(weekMap[yyyyMmDd(d)] || 0), 0);
  }, [weekDays, weekMap]);

  const weeklyGoalMinutes = 150;
  const weeklyProgress = clamp(weekMinutes / weeklyGoalMinutes, 0, 1);
  const weeklyRemaining = Math.max(0, weeklyGoalMinutes - weekMinutes);

  const recentSessions = useMemo(() => {
    if (!Array.isArray(savedSessions)) return [];
    return [...savedSessions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 4);
  }, [savedSessions]);

  const shownTime = mode === "timer" ? formatTime(remaining) : formatTime(elapsed);

  const elapsedMin = useMemo(() => {
    if (mode === "timer") {
      const doneSec = Math.max(0, minutes * 60 - remaining);
      return Math.max(0, Math.round(doneSec / 60));
    }
    return Math.max(0, Math.round(elapsed / 60));
  }, [mode, minutes, remaining, elapsed]);

  const estKcal = Math.round(elapsedMin * kcalPerMin);
  const sessionEstimate = Math.round(minutes * kcalPerMin);
  const progress = useMemo(() => {
    if (mode !== "timer") return 0;
    if (!minutes) return 0;
    return clamp(1 - remaining / (minutes * 60), 0, 1);
  }, [mode, minutes, remaining]);

  const kpmNow = Math.round(kcalPerMin);
  const phaseLabel =
    intervalId === "off" ? "Ritmo livre" : phase === "strong" ? `Forte • ${phaseLeft}s` : `Leve • ${phaseLeft}s`;

  function stopTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function syncLiveStopped(extra = {}) {
    const durationSec = mode === "timer" ? clamp(Number(minutes || 0), 1, 999) * 60 : 0;

    writeLive(email, {
      running: false,
      mode,
      durationSec,
      elapsedSecBase: mode === "timer" ? Math.max(0, durationSec - remaining) : elapsed,
      lastStartTs: 0,
      title: selected?.title || "Cardio",
      type: selected?.id || "walk",
      met: metNow,
      intensity,
      kcalPerMin,
      intervalId,
      intOn,
      intOff,
      phase: intervalId === "off" ? "steady" : phase,
      phaseLeft: intervalId === "off" ? 0 : phaseLeft,
      updatedAt: nowTs(),
      ...extra,
    });
  }

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const live = readLive(email);
      if (!live) return;

      if (live.finishedAt && !live.finishedShown) {
        const ago = msToHumanAgo(nowTs() - Number(live.finishedAt || 0));
        setToast({ title: "Seu cardio terminou.", text: `Finalizado há ${ago}.`, ts: nowTs() });

        writeLive(email, { ...live, finishedShown: true, updatedAt: nowTs() });
        vibrate(25);
        window.setTimeout(() => setToast(null), 4200);
      }
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    onVis();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [email]);

  useEffect(() => {
    const live = readLive(email);
    if (!live) return;

    if (live.type) setSelectedId(live.type);
    if (typeof live.intensity === "number") setIntensity(clamp(live.intensity, 70, 115));
    if (live.mode === "chrono" || live.mode === "timer") setMode(live.mode);

    if (live.intervalId) setIntervalId(live.intervalId);
    if (typeof live.intOn === "number") setIntOn(live.intOn);
    if (typeof live.intOff === "number") setIntOff(live.intOff);

    const tsNow = nowTs();
    const elapsedTotal = computeElapsedTotalSec(live, tsNow);
    const dur = Number(live.durationSec || 0) || 0;

    if (live.mode === "timer") {
      const totalMin = clamp(Math.round(dur / 60) || 20, 5, 240);
      setMinutes(totalMin);
      setRemaining(Math.max(0, dur - elapsedTotal));
      setElapsed(0);
    } else {
      setElapsed(elapsedTotal);
      setRemaining(0);
    }

    if (live.intervalId && live.intervalId !== "off") {
      setPhase(live.phase === "easy" ? "easy" : "strong");
      setPhaseLeft(clamp(Number(live.phaseLeft || 0), 0, 9999));
    } else {
      setPhase("steady");
      setPhaseLeft(0);
    }

    setRunning(!!live.running);

    if (live.running) {
      stopTick();
      tickRef.current = setInterval(() => tickOneSecond(false), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  function pause() {
    setRunning(false);
    stopTick();

    const live = readLive(email);
    const tsNow = nowTs();
    const elapsedTotal = computeElapsedTotalSec(live, tsNow);

    if (mode === "timer") {
      const durationSec = clamp(Number(minutes || 0), 1, 999) * 60;
      setRemaining(Math.max(0, durationSec - elapsedTotal));

      writeLive(email, {
        ...(live || {}),
        running: false,
        elapsedSecBase: elapsedTotal,
        lastStartTs: 0,
        durationSec,
        updatedAt: tsNow,
      });
    } else {
      setElapsed(elapsedTotal);
      writeLive(email, {
        ...(live || {}),
        running: false,
        elapsedSecBase: elapsedTotal,
        lastStartTs: 0,
        durationSec: 0,
        updatedAt: tsNow,
      });
    }
  }

  function resetAll() {
    pause();

    if (mode === "timer") {
      setRemaining(minutes * 60);
      setElapsed(0);
    } else {
      setElapsed(0);
      setRemaining(0);
    }

    setPhase(intervalId === "off" ? "steady" : "strong");
    setPhaseLeft(intervalId === "off" ? 0 : intOn);

    clearLive(email);
    syncLiveStopped({ cleared: true });
  }

  function setPresetMin(v) {
    const m = clamp(Number(v || 0), 5, 240);
    vibrate(10);
    pause();
    setMode("timer");
    setMinutes(m);
    setRemaining(m * 60);
    setElapsed(0);
    syncLiveStopped({ mode: "timer", durationSec: m * 60, elapsedSecBase: 0 });
  }

  function start() {
    if (running) return;
    vibrate(14);
    setRunning(true);

    const tsNow = nowTs();
    const current = readLive(email);

    let elapsedBase = 0;
    if (current) elapsedBase = computeElapsedTotalSec(current, tsNow);
    else elapsedBase = mode === "timer" ? Math.max(0, minutes * 60 - remaining) : elapsed;

    const durationSec = mode === "timer" ? clamp(Number(minutes || 0), 1, 999) * 60 : 0;

    writeLive(email, {
      running: true,
      mode,
      durationSec,
      elapsedSecBase: elapsedBase,
      lastStartTs: tsNow,
      title: selected?.title || "Cardio",
      type: selected?.id || "walk",
      met: metNow,
      intensity,
      kcalPerMin,
      intervalId,
      intOn,
      intOff,
      phase: intervalId === "off" ? "steady" : phase,
      phaseLeft: intervalId === "off" ? 0 : phaseLeft || (phase === "easy" ? intOff : intOn),
      finishedAt: 0,
      finishedShown: true,
      updatedAt: tsNow,
    });

    stopTick();
    tickRef.current = setInterval(() => tickOneSecond(false), 1000);
  }

  function tickOneSecond(fromRestore) {
    const live = readLive(email);
    if (!live || !live.running) return;

    const tsNow = nowTs();
    const elapsedTotal = computeElapsedTotalSec(live, tsNow);

    const intervalOn = live.intervalId !== "off" && Number(live.intOn) > 0 && Number(live.intOff) > 0;

    if (live.mode === "timer") {
      const dur = Number(live.durationSec || 0) || 0;
      const rem = Math.max(0, dur - elapsedTotal);
      setRemaining(rem);
      setElapsed(0);

      if (rem <= 0) {
        setRunning(false);
        stopTick();

        const finishedAt = tsNow;

        writeLive(email, {
          ...live,
          running: false,
          elapsedSecBase: dur,
          lastStartTs: 0,
          finishedAt,
          finishedShown: false,
          updatedAt: tsNow,
        });

        vibrate(45);
        setToast({ title: "Acabou.", text: "Sessão fechada. Boa.", ts: finishedAt });
        window.setTimeout(() => setToast(null), 3200);
        return;
      }
    } else {
      setElapsed(elapsedTotal);
      setRemaining(0);
    }

    if (intervalOn) {
      let p = live.phase === "easy" ? "easy" : "strong";
      let left = Number(live.phaseLeft || 0) || 0;

      if (!fromRestore) left = Math.max(0, left - 1);

      if (left <= 0) {
        const next = p === "strong" ? "easy" : "strong";
        p = next;
        left = next === "strong" ? Number(live.intOn || 0) : Number(live.intOff || 0);
        vibrate(10);
      }

      setPhase(p);
      setPhaseLeft(left);

      writeLive(email, { ...live, phase: p, phaseLeft: left, updatedAt: tsNow });
    } else {
      writeLive(email, { ...live, updatedAt: tsNow });
    }
  }

  function toggleRun() {
    if (running) pause();
    else start();
  }

  function startByCalories() {
    const kcal = clamp(Number(kcalTarget || 0), 10, 5000);
    if (!Number.isFinite(kcal) || kcal <= 0) return;

    const min = clamp(Math.ceil(kcal / Math.max(0.1, kcalPerMin)), 5, 240);

    pause();
    setMode("timer");
    setMinutes(min);
    setRemaining(min * 60);
    setElapsed(0);

    setCalSheet(false);
    setTimeout(() => start(), 140);
  }

  function applyIntervals(id, onS, offS) {
    setIntervalId(id);
    setIntOn(onS);
    setIntOff(offS);

    setPhase(id === "off" ? "steady" : "strong");
    setPhaseLeft(id === "off" ? 0 : onS);

    vibrate(10);
    setIntSheet(false);

    const live = readLive(email);
    if (live) {
      writeLive(email, {
        ...live,
        intervalId: id,
        intOn: onS,
        intOff: offS,
        phase: id === "off" ? "steady" : "strong",
        phaseLeft: id === "off" ? 0 : onS,
        updatedAt: nowTs(),
      });
    }
  }

  function finish() {
    pause();

    const doneMin = elapsedMin;
    const kcal = Math.round(doneMin * kcalPerMin);

    const day = yyyyMmDd(new Date());
    const record = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      day,
      minutes: doneMin,
      kcal,
      type: selected.id,
      title: selected.title,
      met: metNow,
      intensity,
      mode,
      intervalId,
      createdAt: Date.now(),
    };

    const raw = localStorage.getItem(sessionsKey);
    const list = raw ? safeJsonParse(raw, []) : [];
    const nextList = [record, ...(Array.isArray(list) ? list : [])].slice(0, 90);
    localStorage.setItem(sessionsKey, JSON.stringify(nextList));

    const prevTotal = Number(localStorage.getItem(totalKey) || 0) || 0;
    localStorage.setItem(totalKey, String(prevTotal + kcal));

    const weekRaw = localStorage.getItem(weekKey);
    const obj = weekRaw ? safeJsonParse(weekRaw, {}) : {};
    obj[day] = (obj[day] || 0) + kcal;
    localStorage.setItem(weekKey, JSON.stringify(obj));

    localStorage.setItem(
      `cardio_lastmsg_${email}`,
      JSON.stringify({
        day,
        kcal,
        minutes: doneMin,
        title: selected.title,
        goal,
        level,
        text: getCongrats(goal, level),
        ts: Date.now(),
      })
    );

    clearLive(email);
    setTimeout(() => nav("/dashboard"), 500);
  }

  function openMap() {
    const q = encodeURIComponent(`${selected?.mapQ || "academia"} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 12;

  if (!paid) {
    return (
      <div style={UI.page}>
        <div style={UI.pageBg} />

        <div style={UI.lockCard}>
          <div style={UI.lockTitle}>Cardio bloqueado</div>
          <div style={UI.lockText}>Assine o plano para liberar o cardio guiado com progresso e acompanhamento.</div>
          <button style={UI.lockBtn} onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
        </div>

        {!nutriPlus ? (
          <button onClick={() => nav("/planos")} style={{ ...UI.floatingNutri, bottom: FLOATING_BOTTOM }} type="button">
            <span style={UI.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...UI.floatingNutri, ...UI.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
            type="button"
          >
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={UI.page}>
      <div style={UI.pageBg} />

      {toast ? (
        <div style={TOAST.wrap} role="status" aria-live="polite">
          <div style={TOAST.card}>
            <div style={TOAST.dot} />
            <div style={{ minWidth: 0 }}>
              <div style={TOAST.title}>{toast.title}</div>
              <div style={TOAST.text}>{toast.text}</div>
            </div>
            <button type="button" style={TOAST.x} onClick={() => setToast(null)} aria-label="Fechar">
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* HERO */}
      <section style={UI.heroCard}>
        <RingProgress
          progress={weeklyProgress}
          value={`${weekMinutes} min`}
          label="meta semanal"
          sublabel={weeklyProgress >= 1 ? "semana fechada" : `faltam ${weeklyRemaining} min`}
        />

        <div>
          <div style={UI.kicker}>CARDIO</div>
          <h1 style={UI.heroTitle}>
            {completedToday ? "Cardio de hoje concluído" : "Feche seu cardio de hoje"}
          </h1>
          <p style={UI.heroSub}>
            {completedToday
              ? `Hoje você já fez ${todayMinutes} min e queimou cerca de ${todayKcal} kcal.`
              : `${minutes} min de ${selected.title.toLowerCase()} em ritmo ${getIntensityLabel(intensity).toLowerCase()} devem gastar cerca de ${sessionEstimate} kcal.`}
          </p>

          <div style={UI.heroStats}>
            <div style={UI.statCard}>
              <div style={UI.statLabel}>Hoje</div>
              <div style={UI.statValue}>{todayKcal} kcal</div>
              <div style={UI.statSub}>{todayMinutes} min acumulados</div>
            </div>

            <div style={UI.statCard}>
              <div style={UI.statLabel}>Sessão atual</div>
              <div style={UI.statValue}>{sessionEstimate} kcal</div>
              <div style={UI.statSub}>estimativa da configuração</div>
            </div>

            <div style={UI.statCard}>
              <div style={UI.statLabel}>Semana</div>
              <div style={UI.statValue}>{weekKcal} kcal</div>
              <div style={UI.statSub}>{weekMinutes}/{weeklyGoalMinutes} min</div>
            </div>
          </div>

          <div style={UI.heroActions}>
            {!completedToday ? (
              <button type="button" onClick={toggleRun} style={{ ...UI.primaryBtn, ...(running ? UI.primaryPause : null) }}>
                {running ? "Pausar sessão" : "Começar agora"}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} style={UI.primaryBtn}>
                  Fazer mais cardio
                </button>
                <button type="button" onClick={() => nav("/nutricao")} style={UI.ghostBtn}>
                  Ver minha refeição
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {completedToday ? (
        <section style={UI.successCard}>
          <div style={UI.successLeft}>
            <div style={UI.successMark} />
            <div>
              <div style={UI.successTitle}>Seu cardio do dia já foi marcado</div>
              <div style={UI.successText}>
                Se quiser, dá para somar mais alguns minutos agora ou seguir para a parte da refeição.
              </div>
            </div>
          </div>

          <div style={UI.successActions}>
            <button type="button" onClick={() => plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} style={UI.secondaryBtn}>
              Fazer mais cardio
            </button>
            <button type="button" onClick={() => nav("/nutricao")} style={UI.ghostBtn}>
              Ver minha refeição
            </button>
          </div>
        </section>
      ) : null}

      {/* TOP ACTIONS */}
      <section style={UI.topActionsRow}>
        <div style={UI.modeWrap}>
          <button
            type="button"
            onClick={() => {
              vibrate(10);
              pause();
              setMode("timer");
              setRemaining(minutes * 60);
              setElapsed(0);
              syncLiveStopped({ mode: "timer" });
            }}
            style={{ ...UI.modeBtn, ...(mode === "timer" ? UI.modeBtnOn : UI.modeBtnOff) }}
          >
            Timer
          </button>

          <button
            type="button"
            onClick={() => {
              vibrate(10);
              pause();
              setMode("chrono");
              setElapsed(0);
              syncLiveStopped({ mode: "chrono", durationSec: 0, elapsedSecBase: 0 });
            }}
            style={{ ...UI.modeBtn, ...(mode === "chrono" ? UI.modeBtnOn : UI.modeBtnOff) }}
          >
            Cronômetro
          </button>
        </div>

        <div style={UI.topActionButtons}>
          <button type="button" onClick={() => setCalSheet(true)} style={UI.softBtn}>
            Por calorias
          </button>
          <button type="button" onClick={() => setIntSheet(true)} style={UI.softBtn}>
            Intervalos
          </button>
          <button type="button" onClick={openMap} style={UI.softBtn}>
            Ver mapa
          </button>
          <button type="button" onClick={() => nav("/treino")} style={UI.softBtn}>
            Voltar
          </button>
        </div>
      </section>

      {/* MAIN GRID */}
      <div style={UI.mainGrid} ref={plannerRef}>
        {/* PLANNER */}
        <section style={UI.card}>
          <div style={UI.sectionHead}>
            <div>
              <div style={UI.sectionTitle}>Escolha seu cardio</div>
              <div style={UI.sectionSub}>Opções mais fáceis de entender e comparar.</div>
            </div>
          </div>

          <div style={UI.workoutGrid}>
            {options.map((o) => {
              const on = selectedId === o.id;
              const previewKpm = Math.round(calcKcalPerMin({ kg: weightKg, met: o.met * intensityMult }));
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(o.id);
                    resetAll();
                    vibrate(10);
                  }}
                  style={{ ...UI.workoutCard, ...(on ? UI.workoutCardOn : UI.workoutCardOff) }}
                >
                  <div style={UI.workoutTitle}>{o.title}</div>
                  <div style={UI.workoutSub}>{o.subtitle}</div>
                  <div style={UI.workoutMeta}>~{previewKpm} kcal/min</div>
                </button>
              );
            })}
          </div>

          <div style={UI.blockSpace} />

          <div style={UI.labelLine}>Quanto tempo?</div>
          <div style={UI.presetGrid}>
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPresetMin(m)}
                style={{ ...UI.presetBtn, ...(minutes === m ? UI.presetOn : UI.presetOff) }}
              >
                {m} min
              </button>
            ))}
          </div>

          <div style={UI.blockSpace} />

          <div style={UI.labelLine}>Intensidade</div>
          <div style={UI.intensityCard}>
            <div style={UI.intensityTop}>
              <div>
                <div style={UI.intensityTitle}>{getIntensityLabel(intensity)}</div>
                <div style={UI.intensitySub}>{getIntensityCopy(intensity)}</div>
              </div>
              <div style={UI.intensityPill}>{intensity}%</div>
            </div>

            <input
              type="range"
              min={70}
              max={115}
              value={intensity}
              onChange={(e) => {
                const v = Number(e.target.value);
                setIntensity(v);
                const live = readLive(email);
                if (live) writeLive(email, { ...live, intensity: v, updatedAt: nowTs() });
              }}
              style={UI.slider}
            />

            <div style={UI.intensityBottom}>
              <span style={UI.intensityMini}>Leve</span>
              <span style={UI.intensityMini}>Moderado</span>
              <span style={UI.intensityMini}>Intenso</span>
            </div>
          </div>
        </section>

        {/* SESSION */}
        <section style={UI.card}>
          <div style={UI.sectionHead}>
            <div>
              <div style={UI.sectionTitle}>Sessão de agora</div>
              <div style={UI.sectionSub}>Tudo o que importa, sem excesso de ruído.</div>
            </div>
          </div>

          <div style={UI.sessionMetaRow}>
            <div style={UI.sessionBadgeRow}>
              <div style={UI.liveDot} />
              <span style={UI.sessionBadgeText}>{kpmNow} kcal/min</span>
              <span style={UI.sessionSep}>•</span>
              <span style={UI.sessionBadgeText}>{Math.round(metNow)} MET</span>
              <span style={UI.sessionSep}>•</span>
              <span style={UI.sessionBadgeText}>{phaseLabel}</span>
            </div>
            <button type="button" onClick={resetAll} style={UI.miniGhostBtn}>
              Limpar
            </button>
          </div>

          <div style={UI.timerHero}>
            <div style={UI.timerNumber} className="fitdeal-digital-time">
              {shownTime}
            </div>

            {mode === "timer" ? (
              <div style={UI.timerTrack}>
                <div style={{ ...UI.timerFill, transform: `scaleX(${progress})` }} />
              </div>
            ) : (
              <div style={UI.timerGhost}>Sem limite de tempo</div>
            )}

            <div style={UI.timerSub}>
              Estimativa atual: <b>~{estKcal} kcal</b> • {elapsedMin} min concluídos
            </div>
          </div>

          <div style={UI.estimateCard}>
            <div style={UI.estimateLabel}>Previsão da configuração atual</div>
            <div style={UI.estimateValue}>~ {sessionEstimate} kcal</div>
            <div style={UI.estimateCopy}>
              {minutes} min de <b>{selected.title.toLowerCase()}</b> em ritmo{" "}
              <b>{getIntensityLabel(intensity).toLowerCase()}</b>.
            </div>
            <div style={UI.estimateNote}>
              Baseado no seu peso ({weightKg} kg). Serve para motivar e acompanhar tendência.
            </div>
          </div>

          <div style={UI.controlsRow}>
            <button
              type="button"
              onClick={toggleRun}
              style={{ ...UI.primaryBtnWide, ...(running ? UI.primaryPause : null) }}
            >
              {running ? "Pausar" : "Começar"}
            </button>

            <button
              type="button"
              onClick={finish}
              disabled={elapsedMin < 3}
              style={{ ...UI.finishBtn, ...(elapsedMin < 3 ? UI.finishDisabled : null) }}
            >
              Concluir cardio
            </button>
          </div>

          <div style={UI.note}>Registre pelo menos 3 min para salvar no dashboard.</div>
        </section>
      </div>

      {/* TIMELINE */}
      <section style={UI.card}>
        <div style={UI.sectionHead}>
          <div>
            <div style={UI.sectionTitle}>Seu ritmo da semana</div>
            <div style={UI.sectionSub}>Constância visível sem poluição visual.</div>
          </div>
        </div>

        <div style={UI.timelineRow}>
          {weekDays.map((d) => {
            const key = yyyyMmDd(d);
            const kcal = Number(weekMap[key] || 0);
            const mins = Array.isArray(savedSessions)
              ? savedSessions
                  .filter((item) => item.day === key)
                  .reduce((acc, item) => acc + Number(item.minutes || 0), 0)
              : 0;
            const done = mins > 0;

            return (
              <div key={key} style={UI.timelineItem}>
                <div style={{ ...UI.timelineBubble, ...(done ? UI.timelineBubbleOn : UI.timelineBubbleOff) }}>
                  <span style={{ ...UI.timelineBubbleInner, ...(done ? UI.timelineBubbleInnerOn : null) }} />
                </div>
                <div style={UI.timelineDay}>{prettyWeekday(d)}</div>
                <div style={UI.timelineMini}>{done ? `${mins} min` : "—"}</div>
                <div style={UI.timelineMini2}>{done ? `${kcal} kcal` : ""}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HISTORY */}
      <section style={{ ...UI.card, marginTop: 16 }}>
        <div style={UI.sectionHead}>
          <div>
            <div style={UI.sectionTitle}>Últimas sessões</div>
            <div style={UI.sectionSub}>Histórico direto para sentir progresso rápido.</div>
          </div>
        </div>

        {recentSessions.length === 0 ? (
          <div style={UI.emptyCard}>
            Sua primeira sessão vai aparecer aqui assim que você concluir o cardio.
          </div>
        ) : (
          <div style={UI.historyList}>
            {recentSessions.map((item) => (
              <div key={item.id} style={UI.historyRow}>
                <div>
                  <div style={UI.historyTitle}>{item.title}</div>
                  <div style={UI.historySub}>
                    {item.minutes} min • {getIntensityLabel(item.intensity)} • {prettyShortDate(item.day)}
                  </div>
                </div>
                <div style={UI.historyKcal}>{item.kcal} kcal</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA flutuante */}
      {!nutriPlus ? (
        <button onClick={() => nav("/planos")} style={{ ...UI.floatingNutri, bottom: FLOATING_BOTTOM }} type="button">
          <span style={UI.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...UI.floatingNutri, ...UI.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
        >
          Ver minha refeição
        </button>
      )}

      {/* Sheets */}
      <AppleSheet
        open={calSheet}
        onClose={() => setCalSheet(false)}
        title="Por calorias"
        subtitle="Escolha um alvo de calorias e eu converto para tempo."
        footer={
          <div style={SX.footerGrid}>
            <button type="button" onClick={() => setCalSheet(false)} style={SX.cancel}>
              Cancelar
            </button>
            <button type="button" onClick={startByCalories} style={SX.go}>
              Calcular e começar
            </button>
          </div>
        }
      >
        <div style={SX.label}>Modalidade</div>
        <div style={SX.optionList}>
          {options.map((o) => {
            const on = selectedId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedId(o.id)}
                style={{ ...SX.option, ...(on ? SX.optionOn : SX.optionOff) }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={SX.optionTitle}>{o.title}</div>
                  <div style={SX.optionSub}>~{Math.round(calcKcalPerMin({ kg: weightKg, met: o.met * intensityMult }))} kcal/min</div>
                </div>
                <div style={{ ...SX.optionPill, ...(on ? SX.optionPillOn : null) }}>{on ? "OK" : "—"}</div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        <div style={SX.label}>Calorias alvo</div>
        <div style={SX.inputRow}>
          <input
            value={kcalTarget}
            onChange={(e) => setKcalTarget(e.target.value)}
            placeholder="Ex.: 250"
            inputMode="numeric"
            style={SX.input}
          />
          <div style={SX.unit}>kcal</div>
        </div>

        <div style={SX.hint}>Dica: 150–350 kcal é um alvo realista para a maioria.</div>
      </AppleSheet>

      <AppleSheet
        open={intSheet}
        onClose={() => setIntSheet(false)}
        title="Intervalos"
        subtitle="Alterna automaticamente entre esforço forte e leve."
        footer={
          <button type="button" onClick={() => setIntSheet(false)} style={SX.back}>
            Voltar
          </button>
        }
      >
        <div style={SX.optionList}>
          {[
            { id: "off", name: "Desligado", on: 0, off: 0, copy: "Sem alternância" },
            { id: "30_30", name: "30s forte / 30s leve", on: 30, off: 30, copy: "Bom para começar" },
            { id: "40_20", name: "40s forte / 20s leve", on: 40, off: 20, copy: "Mais agressivo" },
            { id: "60_30", name: "60s forte / 30s leve", on: 60, off: 30, copy: "Sessão intensa" },
          ].map((p) => {
            const on = intervalId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyIntervals(p.id, p.on, p.off)}
                style={{ ...SX.option, ...(on ? SX.optionOn : SX.optionOff) }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={SX.optionTitle}>{p.name}</div>
                  <div style={SX.optionSub}>{p.copy}</div>
                </div>
                <div style={{ ...SX.optionPill, ...(on ? SX.optionPillOn : null) }}>{on ? "OK" : "—"}</div>
              </button>
            );
          })}
        </div>
      </AppleSheet>

      <div style={{ height: 220 }} />
    </div>
  );
}

/* ---------------- MINI DOCK (GLOBAL) ---------------- */
export function CardioMiniDock() {
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();
  const nav = useNavigate();

  const [live, setLive] = useState(null);
  const [tsNow, setTsNow] = useState(nowTs());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pull = () => {
      setTsNow(nowTs());
      setLive(readLive(email));
    };

    pull();
    const t = setInterval(pull, 450);
    return () => clearInterval(t);
  }, [email]);

  if (!live) return null;

  const shownSec = computeShownSecondsFromLive(live, tsNow);
  const isTimer = live.mode === "timer";
  const dur = Number(live.durationSec || 0) || 0;
  const elapsedTotal = computeElapsedTotalSec(live, tsNow);
  const progress = isTimer && dur > 0 ? clamp(elapsedTotal / dur, 0, 1) : 0;

  const hasAnyTime = isTimer ? dur > 0 && shownSec < dur : shownSec > 0;
  if (!live.running && !hasAnyTime) return null;

  const bottomSafe = 102 + 10;

  return (
    <button
      type="button"
      onClick={() => nav("/cardio")}
      style={{ ...MD.wrap, bottom: `calc(${bottomSafe}px + env(safe-area-inset-bottom))` }}
      aria-label="Abrir cardio (mini player)"
    >
      <div style={MD.left}>
        <div style={{ ...MD.dot, ...(live.running ? MD.dotOn : MD.dotOff) }} />
        <div style={{ minWidth: 0 }}>
          <div style={MD.top}>{live.running ? "Cardio em andamento" : "Cardio pausado"}</div>
          <div style={MD.sub}>
            {String(live.title || "Cardio")} • {Math.round(Number(live.kcalPerMin || 0) || 0)} kcal/min
          </div>
        </div>
      </div>

      <div style={MD.right}>
        <div style={MD.time} className="fitdeal-digital-time">
          {formatTime(shownSec)}
        </div>
        <div style={MD.track}>
          <div style={{ ...MD.fill, transform: `scaleX(${isTimer ? progress : live.running ? 0.35 : 0.18})` }} />
        </div>
      </div>
    </button>
  );
}

/* ---------------- styles ---------------- */
const UI = {
  page: {
    minHeight: "100%",
    padding: 14,
    paddingBottom: 170,
    position: "relative",
    overflow: "hidden",
    background: BG_DARK,
    color: TEXT,
  },

  pageBg: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    background: `
      radial-gradient(circle at top center, rgba(255,106,0,.18) 0%, transparent 28%),
      radial-gradient(circle at 80% 10%, rgba(99,183,255,.10) 0%, transparent 22%),
      linear-gradient(180deg, #0B1118 0%, #0D141D 42%, #091017 100%)
    `,
  },

  heroCard: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 18,
    padding: 20,
    borderRadius: 30,
    background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 22px 70px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.05)",
    backdropFilter: "blur(22px) saturate(140%)",
    WebkitBackdropFilter: "blur(22px) saturate(140%)",
  },

  kicker: {
    display: "inline-flex",
    minHeight: 30,
    alignItems: "center",
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(255,255,255,.08)",
    color: MUTED,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  heroTitle: {
    margin: 0,
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1.02,
    letterSpacing: -1.1,
    color: TEXT,
  },

  heroSub: {
    marginTop: 10,
    marginBottom: 0,
    fontSize: 15,
    lineHeight: 1.5,
    color: MUTED,
    maxWidth: 620,
    fontWeight: 700,
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 12,
    marginTop: 18,
  },

  statCard: {
    borderRadius: 24,
    padding: 14,
    background: "rgba(255,255,255,.045)",
    border: "1px solid rgba(255,255,255,.07)",
  },

  statLabel: { fontSize: 12, color: MUTED_2, fontWeight: 900, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 950, lineHeight: 1, letterSpacing: -0.8, color: TEXT },
  statSub: { marginTop: 6, fontSize: 12, color: MUTED_2, fontWeight: 800 },

  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },

  primaryBtn: {
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 42px rgba(255,106,0,.24)",
  },

  primaryPause: {
    background: "linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.82))",
    color: "#111",
    boxShadow: "0 16px 42px rgba(255,255,255,.10)",
  },

  secondaryBtn: {
    minHeight: 52,
    padding: "0 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.10)",
    color: TEXT,
    fontWeight: 900,
  },

  ghostBtn: {
    minHeight: 52,
    padding: "0 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 900,
  },

  successCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 16,
    padding: 18,
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(56,214,122,.14), rgba(255,255,255,.05))",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,.20)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  successLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  successMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "rgba(56,214,122,.14)",
    border: "1px solid rgba(146,255,186,.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
    position: "relative",
  },

  successTitle: { fontSize: 20, fontWeight: 950, letterSpacing: -0.5, color: TEXT },
  successText: { marginTop: 6, fontSize: 14, fontWeight: 800, color: MUTED, lineHeight: 1.5 },
  successActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  topActionsRow: {
    position: "relative",
    zIndex: 1,
    marginTop: 16,
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  modeWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "min(420px, 100%)",
    flex: "1 1 260px",
  },

  modeBtn: {
    minHeight: 50,
    borderRadius: 18,
    fontWeight: 950,
    fontSize: 13,
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 12px 34px rgba(0,0,0,.14)",
  },

  modeBtnOn: {
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.84))",
    color: "#111",
  },

  modeBtnOff: {
    background: "rgba(255,255,255,.06)",
    color: TEXT,
  },

  topActionButtons: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 10,
  },

  softBtn: {
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 17,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 900,
    boxShadow: "0 12px 34px rgba(0,0,0,.10)",
  },

  mainGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0,1.06fr) minmax(0,.94fr)",
    gap: 16,
    marginTop: 16,
  },

  card: {
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.055))",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 22px 70px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.04)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
  },

  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  sectionSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },

  workoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 12,
  },

  workoutCard: {
    textAlign: "left",
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.07)",
    boxShadow: "0 14px 34px rgba(0,0,0,.12)",
  },

  workoutCardOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.16), rgba(255,106,0,.08))",
    borderColor: "rgba(255,106,0,.20)",
  },

  workoutCardOff: {
    background: "rgba(255,255,255,.045)",
  },

  workoutTitle: { fontSize: 15, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  workoutSub: { marginTop: 7, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.45 },
  workoutMeta: { marginTop: 10, fontSize: 12, fontWeight: 900, color: ORANGE_SOFT },

  blockSpace: { height: 16 },

  labelLine: { marginBottom: 8, fontSize: 12, fontWeight: 900, color: MUTED_2, letterSpacing: 0.3 },

  presetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 10,
  },

  presetBtn: {
    minHeight: 48,
    borderRadius: 17,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 10px 28px rgba(0,0,0,.12)",
  },

  presetOn: {
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
  },

  presetOff: {
    background: "rgba(255,255,255,.05)",
    color: TEXT,
  },

  intensityCard: {
    marginTop: 2,
    borderRadius: 24,
    padding: 14,
    background: "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,255,255,.04))",
    border: "1px solid rgba(255,106,0,.16)",
  },

  intensityTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  intensityTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  intensitySub: { marginTop: 5, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.4 },
  intensityPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.12)",
    border: "1px solid rgba(255,255,255,.08)",
    color: TEXT,
    fontWeight: 950,
  },

  slider: { width: "100%", marginTop: 12 },
  intensityBottom: { marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10 },
  intensityMini: { fontSize: 11, fontWeight: 900, color: MUTED_2 },

  sessionMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  sessionBadgeRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  liveDot: { width: 8, height: 8, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)" },
  sessionBadgeText: { fontSize: 12, fontWeight: 900, color: MUTED },
  sessionSep: { fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,.26)" },

  miniGhostBtn: {
    minHeight: 42,
    padding: "0 12px",
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 900,
  },

  timerHero: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
    border: "1px solid rgba(255,255,255,.07)",
    boxShadow: "0 18px 56px rgba(0,0,0,.16)",
  },

  timerNumber: {
    fontSize: 58,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 1,
    color: TEXT,
  },

  timerTrack: {
    marginTop: 12,
    width: "100%",
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(255,255,255,.10)",
    border: "1px solid rgba(255,255,255,.08)",
  },

  timerFill: {
    width: "100%",
    height: "100%",
    background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_SOFT})`,
    transformOrigin: "left center",
    transition: "transform .25s ease",
  },

  timerGhost: { marginTop: 12, fontSize: 12, fontWeight: 900, color: MUTED },
  timerSub: { marginTop: 12, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.4 },

  estimateCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
    border: "1px solid rgba(255,255,255,.08)",
  },

  estimateLabel: { fontSize: 12, fontWeight: 900, color: MUTED_2 },
  estimateValue: { marginTop: 6, fontSize: 38, fontWeight: 950, lineHeight: 1, letterSpacing: -1.2, color: TEXT },
  estimateCopy: { marginTop: 8, fontSize: 14, fontWeight: 800, color: MUTED, lineHeight: 1.5 },
  estimateNote: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED_2, lineHeight: 1.45 },

  controlsRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  primaryBtnWide: {
    minHeight: 54,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,.08)",
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 42px rgba(255,106,0,.22)",
  },

  finishBtn: {
    minHeight: 54,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.82))",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 42px rgba(255,255,255,.10)",
  },

  finishDisabled: {
    opacity: 0.5,
    filter: "grayscale(.18)",
  },

  note: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  timelineRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0,1fr))",
    gap: 10,
    alignItems: "start",
  },

  timelineItem: { textAlign: "center" },
  timelineBubble: {
    width: 20,
    height: 20,
    borderRadius: 999,
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 6px rgba(255,255,255,.02)",
  },

  timelineBubbleOn: {
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    border: "1px solid rgba(255,178,107,.24)",
  },

  timelineBubbleOff: {
    background: "rgba(255,255,255,.10)",
    border: "1px solid rgba(255,255,255,.08)",
  },

  timelineBubbleInner: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,.34)",
  },

  timelineBubbleInnerOn: { background: "rgba(255,255,255,.94)" },
  timelineDay: { fontSize: 12, fontWeight: 900, color: TEXT, textTransform: "capitalize" },
  timelineMini: { marginTop: 6, fontSize: 11, fontWeight: 800, color: MUTED },
  timelineMini2: { marginTop: 2, fontSize: 10, fontWeight: 800, color: MUTED_2 },

  historyList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 },
  historyRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    padding: 14,
    borderRadius: 22,
    background: "rgba(255,255,255,.045)",
    border: "1px solid rgba(255,255,255,.07)",
  },

  historyTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  historySub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.4 },
  historyKcal: { alignSelf: "center", fontSize: 15, fontWeight: 950, color: TEXT },

  emptyCard: {
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,.04)",
    border: "1px dashed rgba(255,255,255,.12)",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 800,
  },

  ringWrap: {
    position: "relative",
    width: 168,
    height: 168,
    margin: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  ringSvg: { filter: "drop-shadow(0 10px 24px rgba(255,106,0,.18))" },
  ringCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
  },

  ringValue: { fontSize: 28, lineHeight: 1, fontWeight: 950, letterSpacing: -1, color: TEXT },
  ringLabel: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.3 },
  ringSub: { marginTop: 6, fontSize: 11, fontWeight: 850, color: ORANGE_SOFT, lineHeight: 1.35 },

  lockCard: {
    position: "relative",
    zIndex: 1,
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 22px 70px rgba(0,0,0,.24)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },

  lockTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  lockText: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },
  lockBtn: {
    marginTop: 12,
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    border: "none",
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(255,106,0,.20)",
  },

  floatingNutri: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 999,
    minHeight: 54,
    padding: "0 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.18)",
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 22px 70px rgba(255,106,0,.22)",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    animation: "nutriFloat 3.2s ease-in-out infinite",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  floatingNutriPaid: {
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.84))",
    color: "#111",
    boxShadow: "0 22px 70px rgba(255,255,255,.10)",
    animation: "nutriFloat 3.6s ease-in-out infinite",
  },

  floatDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.70)",
    boxShadow: "0 0 0 7px rgba(255,255,255,.12)",
  },
};

const SX = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2,6,23,.48)",
    display: "grid",
    alignItems: "end",
    padding: 12,
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
  },

  sheet: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 28,
    background: "rgba(18,24,34,.88)",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "0 28px 90px rgba(0,0,0,.34)",
    backdropFilter: "blur(20px) saturate(140%)",
    WebkitBackdropFilter: "blur(20px) saturate(140%)",
    overflow: "hidden",
    maxHeight: "calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
  },

  grab: { width: 52, height: 6, borderRadius: 999, background: "rgba(255,255,255,.14)", margin: "10px auto 0" },
  head: { padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 17, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  subtitle: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.4, maxWidth: 360 },
  x: {
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },

  body: { padding: "0 14px 12px", overflowY: "auto", WebkitOverflowScrolling: "touch" },
  footer: { padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" },
  footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  cancel: {
    minHeight: 50,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 950,
  },

  go: {
    minHeight: 50,
    borderRadius: 18,
    border: "none",
    background: `linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE})`,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 44px rgba(255,106,0,.18)",
  },

  back: {
    width: "100%",
    minHeight: 50,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.94)",
    color: "#111",
    fontWeight: 950,
  },

  label: { marginTop: 10, fontSize: 12, fontWeight: 950, color: MUTED_2, letterSpacing: 0.6, textTransform: "uppercase" },

  optionList: { marginTop: 10, display: "grid", gap: 10 },
  option: {
    width: "100%",
    textAlign: "left",
    borderRadius: 22,
    padding: 14,
    border: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  optionOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.18), rgba(255,106,0,.08))",
    borderColor: "rgba(255,106,0,.20)",
  },

  optionOff: {
    background: "rgba(255,255,255,.05)",
  },

  optionTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  optionSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },
  optionPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.08)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
    whiteSpace: "nowrap",
  },
  optionPillOn: { background: "rgba(255,106,0,.16)", borderColor: "rgba(255,106,0,.18)" },

  inputRow: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" },
  input: {
    width: "100%",
    minHeight: 52,
    padding: "0 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.08)",
    outline: "none",
    color: TEXT,
    fontSize: 14,
    fontWeight: 900,
    boxShadow: "0 12px 30px rgba(0,0,0,.10)",
  },

  unit: { fontSize: 12, fontWeight: 950, color: MUTED },
  hint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
};

const MD = {
  wrap: {
    position: "fixed",
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 22,
    padding: 12,
    background: "rgba(18,24,34,.88)",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "0 22px 70px rgba(0,0,0,.24)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    textAlign: "left",
  },

  left: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  dot: { width: 10, height: 10, borderRadius: 999, boxShadow: "0 0 0 6px rgba(255,106,0,.12)" },
  dotOn: { background: ORANGE },
  dotOff: { background: "rgba(255,255,255,.28)" },

  top: { fontSize: 12, fontWeight: 950, color: TEXT, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  right: { display: "grid", justifyItems: "end", gap: 6, flexShrink: 0 },
  time: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: 1 },
  track: { width: 92, height: 8, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" },
  fill: { width: "100%", height: "100%", background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_SOFT})`, transformOrigin: "left center", transition: "transform .25s ease" },
};

const TOAST = {
  wrap: {
    position: "fixed",
    left: 12,
    right: 12,
    top: "calc(12px + env(safe-area-inset-top))",
    zIndex: 99999,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  },

  card: {
    width: "min(520px, 100%)",
    borderRadius: 22,
    padding: 12,
    background: "rgba(18,24,34,.88)",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "0 22px 70px rgba(0,0,0,.24)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    pointerEvents: "auto",
  },

  dot: { width: 10, height: 10, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)", flexShrink: 0 },
  title: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  text: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.25 },
  x: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.06)",
    color: TEXT,
    fontWeight: 950,
    display: "grid",
    placeItems: "center",
  },
};

/* ---- inject styles (1x) ---- */
if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-apple-26";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }

      button {
        appearance: none;
        outline: none;
        cursor: pointer;
        transition: transform .16s ease, opacity .16s ease, filter .16s ease, background .16s ease, border-color .16s ease;
      }

      button:active {
        transform: scale(.99);
      }

      input[type="range"] {
        accent-color: ${ORANGE};
      }

      @media (max-width: 860px) {
        .fitdeal-responsive-grid-cardio {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-fonts";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @font-face{
        font-family: "FitdealSevenSeg";
        src: url("/fonts/SevenSegment.ttf") format("truetype");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      .fitdeal-digital-time{
        font-family: "FitdealSevenSeg", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        letter-spacing: 1px;
        font-variant-numeric: tabular-nums;
        text-rendering: geometricPrecision;
      }
    `;
    document.head.appendChild(style);
  }
}

/* responsive patch via inline mutation safe */
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const applyResponsive = () => {
    const all = document.querySelectorAll("[data-cardio-main-grid]");
    all.forEach((el) => {
      if (window.innerWidth <= 860) el.style.gridTemplateColumns = "1fr";
      else el.style.gridTemplateColumns = "minmax(0,1.06fr) minmax(0,.94fr)";
    });

    const hero = document.querySelectorAll("[data-cardio-hero-grid]");
    hero.forEach((el) => {
      if (window.innerWidth <= 860) el.style.gridTemplateColumns = "1fr";
      else el.style.gridTemplateColumns = "180px 1fr";
    });

    const stats = document.querySelectorAll("[data-cardio-hero-stats]");
    stats.forEach((el) => {
      if (window.innerWidth <= 640) el.style.gridTemplateColumns = "1fr";
      else el.style.gridTemplateColumns = "repeat(3, minmax(0,1fr))";
    });

    const workouts = document.querySelectorAll("[data-cardio-workouts]");
    workouts.forEach((el) => {
      if (window.innerWidth <= 640) el.style.gridTemplateColumns = "1fr";
      else el.style.gridTemplateColumns = "repeat(2, minmax(0,1fr))";
    });

    const presets = document.querySelectorAll("[data-cardio-presets]");
    presets.forEach((el) => {
      if (window.innerWidth <= 640) el.style.gridTemplateColumns = "repeat(2, minmax(0,1fr))";
      else el.style.gridTemplateColumns = "repeat(3, minmax(0,1fr))";
    });

    const controlRows = document.querySelectorAll("[data-cardio-controls]");
    controlRows.forEach((el) => {
      if (window.innerWidth <= 640) el.style.gridTemplateColumns = "1fr";
      else el.style.gridTemplateColumns = "1fr 1fr";
    });
  };

  window.requestAnimationFrame(() => {
    applyResponsive();

    if (!window.__fitdealCardioResponsiveBound) {
      window.__fitdealCardioResponsiveBound = true;
      window.addEventListener("resize", applyResponsive);
    }
  });
}
