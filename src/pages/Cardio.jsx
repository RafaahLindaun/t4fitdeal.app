// ✅ COLE EM: src/pages/Cardio.jsx
// Cardio — estilo Apple + cores do app + "mini play" global (sem libs)
// - Persistência LIVE em localStorage (continua contando ao trocar de tela)
// - Toast Apple-like quando termina (e ao voltar do fundo mostra "terminou há X")
// - Export: CardioMiniDock (mini player global) — renderize DENTRO do Router

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

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
      // @ts-ignore
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

function formatTime(s) {
  const sec = Math.max(0, Math.floor(Number(s || 0)));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* -------- Modalidades (base MET) -------- */
function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada (rápida)", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida (leve)", met: 7.0, mapQ: "pista corrida" },
    { id: "bike", title: "Bike (moderado)", met: 6.8, mapQ: "ciclovia" },
    { id: "ellip", title: "Elíptico", met: 5.0, mapQ: "academia" },
    { id: "row", title: "Remo", met: 6.0, mapQ: "academia" },
    { id: "stair", title: "Escada", met: 8.8, mapQ: "academia" },
    { id: "hiit", title: "Circuit/HIIT", met: 9.5, mapQ: "academia" },
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

/* ---------------- LIVE persistence ---------------- */
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

/* ---------------- Bottom sheets ---------------- */
function CaloriesSheet({ open, onClose, options, picked, onPick, kcalTarget, setKcalTarget, intensity, onStart }) {
  if (!open) return null;

  return (
    <div style={Sx.sheetOverlay} role="presentation" onClick={onClose}>
      <div style={Sx.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={Sx.sheetGrab} />
        <div style={Sx.sheetHead}>
          <div style={{ minWidth: 0 }}>
            <div style={Sx.sheetTitle}>Por calorias</div>
            <div style={Sx.sheetSub}>Escolhe a modalidade e manda as kcal. A gente calcula o tempo.</div>
          </div>
          <button style={Sx.sheetX} type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div style={Sx.sheetBody}>
          <div style={Sx.sheetSectionTitle}>Modalidade</div>
          <div style={Sx.sheetOptList}>
            {options.map((o) => {
              const on = picked === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onPick(o.id)}
                  style={{ ...Sx.sheetOpt, ...(on ? Sx.sheetOptOn : Sx.sheetOptOff) }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={Sx.sheetOptTitle}>{o.title}</div>
                    <div style={Sx.sheetOptSub}>{Math.round(o.met)} MET • intensidade {intensity}%</div>
                  </div>
                  <div style={{ ...Sx.sheetPill, ...(on ? Sx.sheetPillOn : null) }}>{on ? "OK" : "—"}</div>
                </button>
              );
            })}
          </div>

          <div style={{ height: 12 }} />

          <div style={Sx.sheetSectionTitle}>Calorias alvo</div>
          <div style={Sx.sheetInputRow}>
            <input
              value={kcalTarget}
              onChange={(e) => setKcalTarget(e.target.value)}
              placeholder="Ex.: 250"
              inputMode="numeric"
              style={Sx.sheetInput}
            />
            <div style={Sx.sheetUnit}>kcal</div>
          </div>

          <div style={Sx.sheetHint}>Dica: 150–350 kcal é um alvo “bom e real” pra maioria.</div>
        </div>

        <div style={Sx.sheetFooter}>
          <button type="button" style={Sx.sheetCancel} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" style={Sx.sheetGo} onClick={onStart}>
            Calcular e começar
          </button>
        </div>
      </div>
    </div>
  );
}

function IntervalsSheet({ open, onClose, current, onSelect }) {
  if (!open) return null;

  const presets = [
    { id: "off", name: "Desligado", on: 0, off: 0 },
    { id: "30_30", name: "30s forte / 30s leve", on: 30, off: 30 },
    { id: "40_20", name: "40s forte / 20s leve", on: 40, off: 20 },
    { id: "60_30", name: "60s forte / 30s leve", on: 60, off: 30 },
  ];

  return (
    <div style={Sx.sheetOverlay} role="presentation" onClick={onClose}>
      <div style={Sx.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={Sx.sheetGrab} />
        <div style={Sx.sheetHead}>
          <div style={{ minWidth: 0 }}>
            <div style={Sx.sheetTitle}>Intervalos (opcional)</div>
            <div style={Sx.sheetSub}>Pra quem curte ritmo: alterna forte/levezinho automaticamente.</div>
          </div>
          <button style={Sx.sheetX} type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div style={Sx.sheetBody}>
          <div style={Sx.sheetOptList}>
            {presets.map((p) => {
              const on = current === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id, p.on, p.off)}
                  style={{ ...Sx.sheetOpt, ...(on ? Sx.sheetOptOn : Sx.sheetOptOff) }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={Sx.sheetOptTitle}>{p.name}</div>
                    <div style={Sx.sheetOptSub}>{p.id === "off" ? "Sem ciclos" : `Ciclo: ${p.on}s / ${p.off}s`}</div>
                  </div>
                  <div style={{ ...Sx.sheetPill, ...(on ? Sx.sheetPillOn : null) }}>{on ? "OK" : "—"}</div>
                </button>
              );
            })}
          </div>

          <div style={{ height: 6 }} />
          <div style={Sx.sheetHint}>Se for iniciante, começa com 30/30. Simples e eficiente.</div>
        </div>

        <div style={Sx.sheetFooterSingle}>
          <button type="button" style={Sx.sheetBack} onClick={onClose}>
            Voltar
          </button>
        </div>
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

  const [toast, setToast] = useState(null);
  // toast: { title: string, text: string, ts: number }

  // compatível com flags antigas e novas
  const nutriPlusNew = typeof window !== "undefined" ? localStorage.getItem(`nutri_plus_${email}`) === "1" : false;
  const nutriPlusOld = typeof window !== "undefined" ? localStorage.getItem(`nutri_${email}`) === "1" : false;
  const nutriPlus = nutriPlusNew || nutriPlusOld;

  const goal = useMemo(() => getGoal(user), [user]);
  const level = useMemo(() => getLevel(user), [user]);
  const weightKg = Number(user?.peso || 0) || 70;

  const options = useMemo(() => getCardioOptions(goal, level), [goal, level]);
  const [picked, setPicked] = useState(options[0]?.id || "walk");
  const opt = useMemo(() => options.find((o) => o.id === picked) || options[0], [options, picked]);

  // intensidade
  const [intensity, setIntensity] = useState(100);
  const intensityMult = useMemo(() => clamp(intensity / 100, 0.7, 1.15), [intensity]);
  const metNow = useMemo(() => clamp((opt?.met || 4.3) * intensityMult, 3.0, 12.5), [opt, intensityMult]);
  const kcalPerMin = useMemo(() => calcKcalPerMin({ kg: weightKg, met: metNow }), [weightKg, metNow]);

  // modos
  const [mode, setMode] = useState("timer"); // timer | chrono

  // timer/chrono
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  // intervalos
  const [intervalId, setIntervalId] = useState("off");
  const [intOn, setIntOn] = useState(0);
  const [intOff, setIntOff] = useState(0);
  const [phase, setPhase] = useState("steady"); // strong | easy | steady
  const [phaseLeft, setPhaseLeft] = useState(0);

  // sheets
  const [calSheet, setCalSheet] = useState(false);
  const [kcalTarget, setKcalTarget] = useState("");
  const [intSheet, setIntSheet] = useState(false);

  // “press”
  const [pulsePick, setPulsePick] = useState(false);

  function stopTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  // escreve live “parado”
  function syncLiveStopped(extra = {}) {
    const durationSec = mode === "timer" ? clamp(Number(minutes || 0), 1, 999) * 60 : 0;

    writeLive(email, {
      running: false,
      mode,
      durationSec,
      elapsedSecBase: mode === "timer" ? Math.max(0, durationSec - remaining) : elapsed,
      lastStartTs: 0,
      title: opt?.title || "Cardio",
      type: opt?.id || "walk",
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

  // ✅ ao voltar do fundo (ou foco), se terminou, mostra toast “terminou há X”
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVis = () => {
      if (document.visibilityState !== "visible") return;

      const live = readLive(email);
      if (!live) return;

      if (live.finishedAt && !live.finishedShown) {
        const ago = msToHumanAgo(nowTs() - Number(live.finishedAt || 0));

        setToast({
          title: "Seu cardio acabou.",
          text: `Terminou há ${ago}.`,
          ts: nowTs(),
        });

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

  // ✅ restaura live quando entra na página Cardio
  useEffect(() => {
    const live = readLive(email);
    if (!live) return;

    if (live.type) setPicked(live.type);
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
      title: opt?.title || "Cardio",
      type: opt?.id || "walk",
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
        setToast({
          title: "Acabou.",
          text: "Boa. Tempo fechado — bora continuar.",
          ts: finishedAt,
        });
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

  const shownTime = mode === "timer" ? formatTime(remaining) : formatTime(elapsed);

  const elapsedMin = useMemo(() => {
    if (mode === "timer") {
      const doneSec = Math.max(0, minutes * 60 - remaining);
      return Math.max(0, Math.round(doneSec / 60));
    }
    return Math.max(0, Math.round(elapsed / 60));
  }, [mode, minutes, remaining, elapsed]);

  const estKcal = Math.round(elapsedMin * kcalPerMin);

  const progress = useMemo(() => {
    if (mode !== "timer") return 0;
    if (!minutes) return 0;
    return clamp(1 - remaining / (minutes * 60), 0, 1);
  }, [mode, minutes, remaining]);

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
    const sessionsKey = `cardio_sessions_${email}`;
    const totalKey = `cardio_total_${email}`;
    const weekKey = `cardio_week_${email}`;

    const record = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      day,
      minutes: doneMin,
      kcal,
      type: opt.id,
      title: opt.title,
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
        title: opt.title,
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
    const q = encodeURIComponent(`${opt?.mapQ || "academia"} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 12;

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Cardio bloqueado</div>
          <div style={S.lockText}>Assine o plano para liberar o cardio guiado.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
        </div>

        {!nutriPlus ? (
          <button onClick={() => nav("/planos")} style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }} type="button">
            <span style={S.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
            type="button"
          >
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  const ringItems = options.slice(0, 6);
  const kpmNow = Math.round(kcalPerMin);
  const phaseLabel =
    intervalId === "off"
      ? "Ritmo livre"
      : phase === "strong"
      ? `Forte • ${phaseLeft}s`
      : `Leve • ${phaseLeft}s`;

  return (
    <div style={S.page}>
      {/* TOAST */}
      {toast ? (
        <div style={T.wrap} role="status" aria-live="polite">
          <div style={T.card}>
            <div style={T.dot} />
            <div style={{ minWidth: 0 }}>
              <div style={T.title}>{toast.title}</div>
              <div style={T.text}>{toast.text}</div>
            </div>
            <button type="button" style={T.x} onClick={() => setToast(null)} aria-label="Fechar">
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* HEADER */}
      <div style={S.head}>
        <div style={S.brandRow}>
          <div style={S.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>

          <div style={S.headBtns}>
            <button style={S.headBtn} onClick={openMap} type="button">
              Ver mapa
            </button>
            <button style={S.headBtn} onClick={() => nav("/treino")} type="button">
              Voltar
            </button>
          </div>
        </div>

        <div style={S.kicker}>CARDIO</div>
        <div style={S.heroTitle}>
          Bora pro cardio<span style={{ color: ORANGE }}>.</span>
        </div>

        <div style={S.subLine}>
          Modalidade: <b>{opt?.title}</b> • Meta: <b>{goal}</b> • Nível: <b>{level}</b>
        </div>
      </div>

      {/* MODOS */}
      <div style={S.modeRow}>
        <div style={S.modeSquareWrap}>
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
            style={{ ...S.modeSquareBtn, ...(mode === "timer" ? S.modeSquareOn : S.modeSquareOff) }}
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
            style={{ ...S.modeSquareBtn, ...(mode === "chrono" ? S.modeSquareOn : S.modeSquareOff) }}
          >
            Cronômetro
          </button>
        </div>

        <button
          type="button"
          style={S.kcalBtn}
          onClick={() => {
            vibrate(10);
            setCalSheet(true);
          }}
        >
          Por calorias
        </button>
      </div>

      {/* CARD CENTRAL */}
      <div style={{ ...S.centerCard, ...(pulsePick ? S.centerPulse : null) }}>
        <div style={S.centerMetaRow}>
          <div style={S.centerMeta}>
            <span style={S.dot} />
            <span style={S.centerMetaTxt}>{kpmNow} kcal/min</span>
            <span style={S.sep}>•</span>
            <span style={S.centerMetaTxt}>{Math.round(metNow)} MET</span>
            <span style={S.sep}>•</span>
            <span style={S.centerMetaTxt}>{phaseLabel}</span>
          </div>

          <div style={S.miniActions}>
            <button type="button" style={S.miniBtn} onClick={() => setIntSheet(true)}>
              Intervalos
            </button>
            <button
              type="button"
              style={S.miniBtn}
              onClick={() => {
                vibrate(10);
                resetAll();
              }}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* TIMER QUADRADO */}
        <div style={S.squareTimeBox}>
          <div style={S.squareTime} className="fitdeal-digital-time">{shownTime}</div>

          {mode === "timer" ? (
            <div style={S.squareTrack}>
              <div style={{ ...S.squareFill, transform: `scaleX(${progress})` }} />
            </div>
          ) : (
            <div style={S.squareGhost}>Sem limite de tempo</div>
          )}

          <div style={S.squareSub}>
            Estimativa: <b>~{estKcal} kcal</b> • {elapsedMin} min
          </div>
        </div>

        {/* INTENSIDADE */}
        <div style={S.intensityCard}>
          <div style={S.intTop}>
            <div>
              <div style={S.intTitle}>Intensidade</div>
              <div style={S.intSub}>Ajusta o ritmo (leve → forte). Isso muda as kcal/min.</div>
            </div>
            <div style={S.intPill}>{intensity}%</div>
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
            style={S.slider}
          />

          <div style={S.intBottom}>
            <span style={S.intMini}>Leve</span>
            <span style={S.intMini}>Padrão</span>
            <span style={S.intMini}>Forte</span>
          </div>
        </div>

        {/* MODALIDADES */}
        <div style={S.ringGrid}>
          {ringItems.map((o) => {
            const on = picked === o.id;
            const kpm = Math.round(calcKcalPerMin({ kg: weightKg, met: o.met * intensityMult }));
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setPicked(o.id);
                  setPulsePick(true);
                  setTimeout(() => setPulsePick(false), 180);
                  resetAll();
                  vibrate(10);
                }}
                style={{ ...S.ringChip, ...(on ? S.ringChipOn : S.ringChipOff) }}
              >
                <div style={S.ringChipTop}>
                  <div style={{ ...S.ringChipDot, ...(on ? S.ringChipDotOn : null) }} />
                  <div style={S.ringChipTitle}>{o.title}</div>
                </div>
                <div style={S.ringChipSub}>~{kpm} kcal/min • {Math.round(o.met)} MET</div>
              </button>
            );
          })}
        </div>

        {/* PRESETS */}
        {mode === "timer" ? (
          <div style={S.presets}>
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => setPresetMin(m)}
                style={{ ...S.presetBtn, ...(minutes === m ? S.presetOn : S.presetOff) }}
                type="button"
              >
                {m}min
              </button>
            ))}
          </div>
        ) : null}

        {/* CONTROLES */}
        <div style={S.actionsRow}>
          <button
            type="button"
            onClick={toggleRun}
            style={{ ...S.actionMain, ...(running ? S.actionMainPause : S.actionMainStart) }}
          >
            <span>{running ? "Pausar" : "Começar"}</span>
            <span style={S.actionMini}>{running ? "segura" : "vai"}</span>
          </button>

          <button type="button" onClick={resetAll} style={S.actionGhost}>
            Reset
          </button>
        </div>

        <button
          type="button"
          onClick={finish}
          disabled={elapsedMin < 3}
          style={{ ...S.finishBtn, ...(elapsedMin < 3 ? S.finishDisabled : null) }}
        >
          Concluir cardio
        </button>

        <div style={S.note}>
          Dica: conclui pelo menos <b>3 min</b> pra registrar no dashboard.
        </div>
      </div>

      {/* CTA flutuante */}
      {!nutriPlus ? (
        <button onClick={() => nav("/planos")} style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }} type="button">
          <span style={S.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
        >
          Ver minha refeição
        </button>
      )}

      {/* Sheets */}
      <CaloriesSheet
        open={calSheet}
        onClose={() => setCalSheet(false)}
        options={options}
        picked={picked}
        onPick={(id) => setPicked(id)}
        kcalTarget={kcalTarget}
        setKcalTarget={setKcalTarget}
        intensity={intensity}
        onStart={startByCalories}
      />

      <IntervalsSheet
        open={intSheet}
        onClose={() => setIntSheet(false)}
        current={intervalId}
        onSelect={(id, onS, offS) => applyIntervals(id, onS, offS)}
      />

      <div style={{ height: 220 }} />
    </div>
  );
}

/* ---------------- MINI DOCK (GLOBAL) ----------------
   ✅ Renderize DENTRO do Router (ex.: dentro de <BrowserRouter>).
*/
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
          <div style={MD.top}>{live.running ? "Cardio rodando" : "Cardio pausado"}</div>
          <div style={MD.sub}>
            {String(live.title || "Cardio")} • {Math.round(Number(live.kcalPerMin || 0) || 0)} kcal/min
          </div>
        </div>
      </div>

      <div style={MD.right}>
        <div style={MD.time}>{formatTime(shownSec)}</div>
        <div style={MD.track}>
          <div style={{ ...MD.fill, transform: `scaleX(${isTimer ? progress : live.running ? 0.35 : 0.18})` }} />
        </div>
      </div>
    </button>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: { padding: 18, paddingBottom: 170, background: BG },

  head: {
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.74))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 26px 90px rgba(15,23,42,.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  brandRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  brand: { fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.7 },
  headBtns: { display: "inline-flex", gap: 10, flexShrink: 0 },
  headBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
  },

  kicker: { marginTop: 14, fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.7 },
  heroTitle: { marginTop: 6, fontSize: 34, fontWeight: 950, color: TEXT, letterSpacing: -1.0, lineHeight: 1.05 },
  subLine: { marginTop: 10, fontSize: 13, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  modeRow: { marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" },
  modeSquareWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "min(420px, 100%)", flex: "1 1 260px" },
  modeSquareBtn: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.08)", fontWeight: 950, fontSize: 13, boxShadow: "0 12px 34px rgba(15,23,42,.06)" },
  modeSquareOn: { background: "#0B0B0C", color: "#fff", borderColor: "rgba(255,255,255,.10)" },
  modeSquareOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  kcalBtn: { padding: "12px 14px", borderRadius: 18, border: "1px solid rgba(255,106,0,.22)", background: "rgba(255,106,0,.10)", color: TEXT, fontWeight: 950, boxShadow: "0 12px 34px rgba(255,106,0,.10)", whiteSpace: "nowrap" },

  centerCard: { marginTop: 14, borderRadius: 28, padding: 18, background: "rgba(255,255,255,.92)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 22px 75px rgba(15,23,42,.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transition: "transform .18s ease" },
  centerPulse: { transform: "scale(0.996)" },

  centerMetaRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" },
  centerMeta: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  dot: { width: 8, height: 8, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)" },
  sep: { color: "rgba(15,23,42,.25)", fontWeight: 950 },
  centerMetaTxt: { fontSize: 12, fontWeight: 900, color: MUTED },

  miniActions: { display: "inline-flex", gap: 10 },
  miniBtn: { padding: "10px 12px", borderRadius: 16, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.92)", color: TEXT, fontWeight: 950, boxShadow: "0 10px 24px rgba(15,23,42,.05)" },

  squareTimeBox: { marginTop: 14, borderRadius: 24, padding: 16, background: "linear-gradient(135deg, rgba(15,23,42,.02), rgba(255,255,255,.98))", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 18px 60px rgba(15,23,42,.08)", overflow: "hidden" },
  squareTime: { fontSize: 56, fontWeight: 950, color: TEXT, letterSpacing: -1.8, lineHeight: 1 },
  squareTrack: { marginTop: 12, width: "100%", height: 12, borderRadius: 999, background: "rgba(15,23,42,.06)", overflow: "hidden", border: "1px solid rgba(15,23,42,.06)" },
  squareFill: { height: "100%", width: "100%", background: "linear-gradient(90deg, #FF6A00, #FFB26B)", transformOrigin: "left center", transition: "transform .25s ease" },
  squareGhost: { marginTop: 12, fontSize: 12, fontWeight: 900, color: MUTED },
  squareSub: { marginTop: 12, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  intensityCard: { marginTop: 14, borderRadius: 24, padding: 14, background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.02))", border: "1px solid rgba(255,106,0,.16)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  intTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  intTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  intSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  intPill: { padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.06)", fontWeight: 950, color: TEXT, whiteSpace: "nowrap" },
  slider: { width: "100%", marginTop: 12 },
  intBottom: { marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10 },
  intMini: { fontSize: 11, fontWeight: 900, color: MUTED },

  ringGrid: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  ringChip: { width: "100%", textAlign: "left", borderRadius: 22, padding: 14, border: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.92)", boxShadow: "0 14px 40px rgba(15,23,42,.06)", overflow: "hidden" },
  ringChipOn: { borderColor: "rgba(255,106,0,.20)", background: "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,106,0,.06))", boxShadow: "0 18px 55px rgba(255,106,0,.10)" },
  ringChipOff: {},
  ringChipTop: { display: "flex", alignItems: "center", gap: 10 },
  ringChipDot: { width: 9, height: 9, borderRadius: 999, background: "rgba(15,23,42,.18)", boxShadow: "0 0 0 7px rgba(15,23,42,.06)" },
  ringChipDotOn: { background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)" },
  ringChipTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2, lineHeight: 1.15 },
  ringChipSub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.3 },

  presets: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 },
  presetBtn: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.08)", fontWeight: 950, background: "rgba(255,255,255,.92)", boxShadow: "0 10px 22px rgba(15,23,42,.04)" },
  presetOn: { background: ORANGE, border: "none", color: "#111", boxShadow: "0 16px 44px rgba(255,106,0,.16)" },
  presetOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  actionsRow: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionMain: { padding: 16, borderRadius: 22, border: "1px solid rgba(255,255,255,.14)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, fontWeight: 950, boxShadow: "0 22px 70px rgba(2,6,23,.14)" },
  actionMainStart: { background: "linear-gradient(180deg, rgba(11,11,12,.98), rgba(11,11,12,.92))", color: "#fff" },
  actionMainPause: { background: "linear-gradient(180deg, rgba(255,106,0,.98), rgba(255,138,61,.92))", color: "#111" },
  actionMini: { fontSize: 12, fontWeight: 950, opacity: 0.75 },

  actionGhost: { padding: 16, borderRadius: 22, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.92)", color: TEXT, fontWeight: 950, boxShadow: "0 14px 34px rgba(15,23,42,.06)" },

  finishBtn: { marginTop: 12, width: "100%", padding: 18, borderRadius: 22, border: "1px solid rgba(255,255,255,.10)", background: "linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,23,42,.92))", color: "#fff", fontWeight: 950, fontSize: 14, letterSpacing: 0.2, boxShadow: "0 22px 70px rgba(2,6,23,.22)" },
  finishDisabled: { opacity: 0.55, filter: "grayscale(0.2)" },
  note: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  lockCard: { borderRadius: 26, padding: 18, background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78))", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 22px 70px rgba(15,23,42,.10)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  lockText: { marginTop: 6, fontSize: 13, color: MUTED, fontWeight: 800, lineHeight: 1.4 },
  lockBtn: { marginTop: 12, width: "100%", padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 16px 40px rgba(255,106,0,.20)" },

  floatingNutri: { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 999, padding: "14px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.20)", background: "linear-gradient(180deg, rgba(255,106,0,.98), rgba(255,138,61,.92))", color: "#111", fontWeight: 950, boxShadow: "0 22px 70px rgba(255,106,0,.20)", display: "inline-flex", alignItems: "center", gap: 10, animation: "nutriFloat 3.2s ease-in-out infinite", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" },
  floatingNutriPaid: { background: "linear-gradient(180deg, rgba(11,11,12,.98), rgba(11,11,12,.92))", color: "#fff", boxShadow: "0 22px 80px rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.10)", animation: "nutriFloat 3.6s ease-in-out infinite" },
  floatDot: { width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,.60)", boxShadow: "0 0 0 7px rgba(255,255,255,.12)" },
};

const Sx = {
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2,6,23,.44)",
    display: "grid",
    alignItems: "end",
    padding: "12px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 26,
    background: "rgba(255,255,255,.94)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.28)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    maxHeight: "calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
  },
  sheetGrab: { width: 52, height: 6, borderRadius: 999, background: "rgba(15,23,42,.12)", margin: "10px auto 0" },
  sheetHead: { padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35, maxWidth: 360 },
  sheetX: { width: 40, height: 40, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, flexShrink: 0 },

  sheetBody: { padding: "0 14px 12px", overflowY: "auto", WebkitOverflowScrolling: "touch" },
  sheetSectionTitle: { marginTop: 10, fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },

  sheetOptList: { marginTop: 10, display: "grid", gap: 10 },
  sheetOpt: { width: "100%", textAlign: "left", borderRadius: 22, padding: 14, border: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.92)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  sheetOptOn: { background: "linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,106,0,.06))", borderColor: "rgba(255,106,0,.20)", boxShadow: "0 18px 55px rgba(255,106,0,.10)" },
  sheetOptOff: {},
  sheetOptTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetOptSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  sheetPill: { padding: "8px 10px", borderRadius: 999, background: "rgba(15,23,42,.06)", fontWeight: 950, fontSize: 12, color: TEXT, whiteSpace: "nowrap", border: "1px solid rgba(15,23,42,.06)" },
  sheetPillOn: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.18)" },

  sheetInputRow: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" },
  sheetInput: { width: "100%", padding: "14px 14px", borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.96)", outline: "none", fontSize: 14, fontWeight: 900, boxShadow: "0 12px 30px rgba(15,23,42,.06)" },
  sheetUnit: { fontSize: 12, fontWeight: 950, color: MUTED },
  sheetHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  sheetFooter: { padding: "12px 14px", borderTop: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.90)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  sheetCancel: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.92)", color: TEXT, fontWeight: 950 },
  sheetGo: { padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 16px 44px rgba(255,106,0,.18)" },

  sheetFooterSingle: { padding: "12px 14px", borderTop: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.90)" },
  sheetBack: { width: "100%", padding: 14, borderRadius: 18, border: "none", background: "#0B0B0C", color: "#fff", fontWeight: 950, boxShadow: "0 16px 40px rgba(0,0,0,.18)" },
};

const MD = {
  wrap: {
    position: "fixed",
    left: 12,
    right: 12,
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
  dot: { width: 10, height: 10, borderRadius: 999, boxShadow: "0 0 0 6px rgba(255,106,0,.12)" },
  dotOn: { background: ORANGE },
  dotOff: { background: "rgba(15,23,42,.25)" },
  top: { fontSize: 12, fontWeight: 950, color: TEXT, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  right: { display: "grid", justifyItems: "end", gap: 6, flexShrink: 0 },
  time: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  track: { width: 92, height: 8, borderRadius: 999, background: "rgba(15,23,42,.08)", overflow: "hidden", border: "1px solid rgba(15,23,42,.08)" },
  fill: { width: "100%", height: "100%", background: "linear-gradient(90deg, #FF6A00, #FFB26B)", transformOrigin: "left center", transition: "transform .25s ease" },
};

const T = {
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
  dot: { width: 10, height: 10, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)", flexShrink: 0 },
  title: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  text: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.25 },
  x: { marginLeft: "auto", width: 40, height: 40, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, display: "grid", placeItems: "center" },
};

if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-pro-ui";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }
      button:active { transform: scale(.99); }
      input[type="range"] { accent-color: ${ORANGE}; }
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

