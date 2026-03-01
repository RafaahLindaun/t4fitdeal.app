// ✅ COLE EM: src/pages/Cardio.jsx
// Cardio — versão final ajustada pra evitar conteúdo "esmagado" no mobile
// - 1 coluna real no mobile (cards maiores, menos quebras)
// - Timer responsivo (clamp) e fonte 7-seg support
// - Persistência LIVE em localStorage
// - Mini dock integrado
// OBS: arquivo assume /fonts/SevenSegment.ttf disponível em public/fonts

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- theme ---------------- */
const ORANGE = "#FF6A00";
const ORANGE_SOFT = "#FFB26B";
const BG_DARK = "#0B1118";
const TEXT = "#F8FAFC";
const MUTED = "rgba(226,232,240,0.72)";
const MUTED_2 = "rgba(226,232,240,0.50)";

/* ---------------- helpers ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function safeJsonParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function nowTs() { return Date.now(); }
function msToHumanAgo(ms) {
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s%60;
  if (m <= 0) return `${r}s`;
  if (m < 60) return `${m}min`;
  const h = Math.floor(m/60);
  const mm = m%60;
  return `${h}h ${mm}min`;
}
function vibrate(ms=24){ try{ if(typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms); }catch{} }
function yyyyMmDd(d = new Date()){
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  const day = String(dt.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function formatTime(s){
  const sec = Math.max(0, Math.floor(Number(s||0)));
  const mm = String(Math.floor(sec/60)).padStart(2,"0");
  const ss = String(sec%60).padStart(2,"0");
  return `${mm}:${ss}`;
}

/* ---------------- cardio options + calc ---------------- */
function getGoal(user){
  const raw = String(user?.objetivo || "hipertrofia").toLowerCase();
  if (raw.includes("power")) return "powerlifting";
  if (raw.includes("body")) return "bodybuilding";
  if (raw.includes("cond")) return "condicionamento";
  if (raw.includes("saud") || raw.includes("bem")) return "saude";
  return "hipertrofia";
}
function getLevel(user){
  const raw = String(user?.nivel || "iniciante").toLowerCase();
  if (raw.includes("avan")) return "avancado";
  if (raw.includes("inter")) return "intermediario";
  return "iniciante";
}
function calcKcalPerMin({ kg, met }){
  const w = Number(kg||0) || 70;
  const m = Number(met||1) || 1;
  return (m * 3.5 * w) / 200;
}
function getCardioOptions(goal, level){
  const base = [
    { id: "walk", title: "Caminhada", subtitle: "Leve, constante e fácil de manter", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida leve", subtitle: "Queima alta em menos tempo", met: 7.0, mapQ: "pista corrida" },
    { id: "bike", title: "Bike", subtitle: "Baixo impacto e boa eficiência", met: 6.8, mapQ: "ciclovia" },
    { id: "ellip", title: "Elíptico", subtitle: "Cardio controlado e confortável", met: 5.0, mapQ: "academia" },
    { id: "row", title: "Remo", subtitle: "Puxa cardio e corpo inteiro", met: 6.0, mapQ: "academia" },
    { id: "stair", title: "Escada", subtitle: "Pernas, pulmão e foco", met: 8.8, mapQ: "academia" },
    { id: "hiit", title: "HIIT", subtitle: "Curto, intenso e direto", met: 9.5, mapQ: "academia" },
  ];
  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "condicionamento") mult = 1.06;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "powerlifting") mult = 0.98;
  if (level === "iniciante") mult *= 0.92;
  if (level === "avancado") mult *= 1.06;
  return base.map(o => ({ ...o, met: clamp(o.met * mult, 3.2, 11.5) }));
}

/* ---------------- live persistence ---------------- */
function liveKey(email){ return `cardio_live_${email}`; }
function readLive(email){ if (typeof window === "undefined") return null; return safeJsonParse(localStorage.getItem(liveKey(email)), null); }
function writeLive(email, obj){ if (typeof window === "undefined") return; try{ localStorage.setItem(liveKey(email), JSON.stringify(obj)); }catch{} }
function clearLive(email){ if (typeof window === "undefined") return; try{ localStorage.removeItem(liveKey(email)); }catch{} }

function computeElapsedTotalSec(live, tsNow){
  if (!live) return 0;
  const base = Number(live.elapsedSecBase || 0) || 0;
  if (!live.running) return base;
  const last = Number(live.lastStartTs || 0) || tsNow;
  return base + Math.max(0, Math.floor((tsNow - last)/1000));
}
function computeShownSecondsFromLive(live, tsNow){
  const elapsed = computeElapsedTotalSec(live, tsNow);
  const isTimer = live?.mode === "timer";
  const dur = Number(live?.durationSec || 0) || 0;
  if (isTimer) return Math.max(0, dur - elapsed);
  return elapsed;
}

/* ---------------- Small components ---------------- */
function Sheet({ open, onClose, title, children }){
  if (!open) return null;
  return (
    <div className="cardio-sheet-overlay" role="presentation" onClick={onClose}>
      <div className="cardio-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="cardio-sheet-grab" />
        <div className="cardio-sheet-head">
          <div style={{ minWidth: 0 }}>
            <div className="cardio-sheet-title">{title}</div>
          </div>
          <button className="cardio-sheet-x" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="cardio-sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function Cardio(){
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
  const [picked, setPicked] = useState(options[0]?.id || "walk");
  const opt = useMemo(() => options.find(o => o.id === picked) || options[0], [options, picked]);

  const [mode, setMode] = useState("timer"); // timer | chrono
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20*60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  const [intensity, setIntensity] = useState(100);
  const intensityMult = useMemo(() => clamp(intensity/100, 0.7, 1.15), [intensity]);
  const metNow = useMemo(() => clamp((opt?.met || 4.3) * intensityMult, 3.0, 12.5), [opt, intensityMult]);
  const kcalPerMin = useMemo(() => calcKcalPerMin({ kg: weightKg, met: metNow }), [weightKg, metNow]);

  const [intervalId, setIntervalId] = useState("off");
  const [intOn, setIntOn] = useState(0);
  const [intOff, setIntOff] = useState(0);
  const [phase, setPhase] = useState("steady");
  const [phaseLeft, setPhaseLeft] = useState(0);

  const [calSheet, setCalSheet] = useState(false);
  const [kcalTarget, setKcalTarget] = useState("");
  const [intSheet, setIntSheet] = useState(false);

  const [toast, setToast] = useState(null);

  // quick sync on mount: restore live
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

    if (live.mode === "timer"){
      const totalMin = clamp(Math.round(dur/60) || 20, 5, 240);
      setMinutes(totalMin);
      setRemaining(Math.max(0, dur - elapsedTotal));
      setElapsed(0);
    } else {
      setElapsed(elapsedTotal);
      setRemaining(0);
    }

    if (live.intervalId && live.intervalId !== "off"){
      setPhase(live.phase === "easy" ? "easy" : "strong");
      setPhaseLeft(clamp(Number(live.phaseLeft||0), 0, 9999));
    } else {
      setPhase("steady");
      setPhaseLeft(0);
    }

    setRunning(!!live.running);

    if (live.running){
      stopTick();
      tickRef.current = setInterval(() => tickOneSecond(false), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const live = readLive(email);
      if (!live) return;
      if (live.finishedAt && !live.finishedShown){
        const ago = msToHumanAgo(nowTs() - Number(live.finishedAt || 0));
        setToast({ title: "Sessão finalizada", text: `Terminou há ${ago}.`, ts: nowTs() });
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

  function stopTick(){
    if (tickRef.current){ clearInterval(tickRef.current); tickRef.current = null; }
  }

  function syncLiveStopped(extra = {}){
    const durationSec = mode === "timer" ? clamp(Number(minutes||0),1,999)*60 : 0;
    writeLive(email, {
      running: false,
      mode,
      durationSec,
      elapsedSecBase: mode==="timer" ? Math.max(0, durationSec - remaining) : elapsed,
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

  function pause(){
    setRunning(false);
    stopTick();
    const live = readLive(email);
    const tsNow = nowTs();
    const elapsedTotal = computeElapsedTotalSec(live, tsNow);

    if (mode === "timer"){
      const durationSec = clamp(Number(minutes||0),1,999)*60;
      setRemaining(Math.max(0, durationSec - elapsedTotal));
      writeLive(email, {
        ...(live||{}),
        running: false,
        elapsedSecBase: elapsedTotal,
        lastStartTs: 0,
        durationSec,
        updatedAt: tsNow,
      });
    } else {
      setElapsed(elapsedTotal);
      writeLive(email, {
        ...(live||{}),
        running: false,
        elapsedSecBase: elapsedTotal,
        lastStartTs: 0,
        durationSec: 0,
        updatedAt: tsNow,
      });
    }
  }

  function resetAll(){
    pause();
    if (mode === "timer"){ setRemaining(minutes*60); setElapsed(0); } else { setElapsed(0); setRemaining(0); }
    setPhase(intervalId === "off" ? "steady" : "strong");
    setPhaseLeft(intervalId === "off" ? 0 : intOn);
    clearLive(email);
    syncLiveStopped({ cleared: true });
  }

  function setPresetMin(v){
    const m = clamp(Number(v||0),5,240);
    vibrate(10);
    pause();
    setMode("timer");
    setMinutes(m);
    setRemaining(m*60);
    setElapsed(0);
    syncLiveStopped({ mode: "timer", durationSec: m*60, elapsedSecBase: 0 });
  }

  function start(){
    if (running) return;
    vibrate(14);
    setRunning(true);
    const tsNow = nowTs();
    const current = readLive(email);
    let elapsedBase = 0;
    if (current) elapsedBase = computeElapsedTotalSec(current, tsNow);
    else elapsedBase = mode==="timer" ? Math.max(0, minutes*60 - remaining) : elapsed;
    const durationSec = mode==="timer" ? clamp(Number(minutes||0),1,999)*60 : 0;

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

  function tickOneSecond(fromRestore){
    const live = readLive(email);
    if (!live || !live.running) return;
    const tsNow = nowTs();
    const elapsedTotal = computeElapsedTotalSec(live, tsNow);

    const intervalOn = live.intervalId !== "off" && Number(live.intOn) > 0 && Number(live.intOff) > 0;

    if (live.mode === "timer"){
      const dur = Number(live.durationSec || 0) || 0;
      const rem = Math.max(0, dur - elapsedTotal);
      setRemaining(rem);
      setElapsed(0);

      if (rem <= 0){
        setRunning(false);
        stopTick();
        const finishedAt = tsNow;
        writeLive(email, { ...live, running: false, elapsedSecBase: dur, lastStartTs: 0, finishedAt, finishedShown: false, updatedAt: tsNow });
        vibrate(45);
        setToast({ title: "Acabou.", text: "Sessão concluída.", ts: finishedAt });
        window.setTimeout(() => setToast(null), 3200);
        return;
      }
    } else {
      setElapsed(elapsedTotal);
      setRemaining(0);
    }

    if (intervalOn){
      let p = live.phase === "easy" ? "easy" : "strong";
      let left = Number(live.phaseLeft || 0) || 0;
      if (!fromRestore) left = Math.max(0, left - 1);
      if (left <= 0){
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

  function toggleRun(){ if (running) pause(); else start(); }

  function startByCalories(){
    const kcal = clamp(Number(kcalTarget||0),10,5000);
    if (!Number.isFinite(kcal) || kcal <= 0) return;
    const min = clamp(Math.ceil(kcal / Math.max(0.1, kcalPerMin)), 5, 240);
    pause();
    setMode("timer");
    setMinutes(min);
    setRemaining(min*60);
    setElapsed(0);
    setCalSheet(false);
    setTimeout(() => start(), 140);
  }

  function applyIntervals(id, onS, offS){
    setIntervalId(id);
    setIntOn(onS);
    setIntOff(offS);
    setPhase(id === "off" ? "steady" : "strong");
    setPhaseLeft(id === "off" ? 0 : onS);
    vibrate(10);
    setIntSheet(false);
    const live = readLive(email);
    if (live){
      writeLive(email, { ...live, intervalId: id, intOn: onS, intOff: offS, phase: id==="off"? "steady": "strong", phaseLeft: id==="off"?0:onS, updatedAt: nowTs() });
    }
  }

  function finish(){
    pause();
    const doneMin = Math.max(0, Math.round((mode==="timer"? (minutes*60 - remaining) : elapsed)/60));
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
    const nextList = [record, ...(Array.isArray(list) ? list : [])].slice(0,90);
    localStorage.setItem(sessionsKey, JSON.stringify(nextList));

    const prevTotal = Number(localStorage.getItem(totalKey) || 0) || 0;
    localStorage.setItem(totalKey, String(prevTotal + kcal));

    const weekRaw = localStorage.getItem(weekKey);
    const obj = weekRaw ? safeJsonParse(weekRaw, {}) : {};
    obj[day] = (obj[day] || 0) + kcal;
    localStorage.setItem(weekKey, JSON.stringify(obj));

    localStorage.setItem(`cardio_lastmsg_${email}`, JSON.stringify({
      day, kcal, minutes: doneMin, title: opt.title, goal, level, text: "Boa sessão!", ts: Date.now()
    }));

    clearLive(email);
    setTimeout(() => nav("/dashboard"), 500);
  }

  function openMap(){
    const q = encodeURIComponent(`${opt?.mapQ || "academia"} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  const shownTime = mode === "timer" ? formatTime(remaining) : formatTime(elapsed);
  const elapsedMin = useMemo(() => { if (mode === "timer"){ const doneSec = Math.max(0, minutes*60 - remaining); return Math.max(0, Math.round(doneSec/60)); } return Math.max(0, Math.round(elapsed/60)); }, [mode, minutes, remaining, elapsed]);
  const estKcal = Math.round(elapsedMin * kcalPerMin);
  const sessionEstimate = Math.round(minutes * kcalPerMin);
  const progress = useMemo(() => { if (mode!=="timer") return 0; if (!minutes) return 0; return clamp(1 - remaining/(minutes*60), 0, 1); }, [mode, minutes, remaining]);
  const kpmNow = Math.round(kcalPerMin);
  const phaseLabel = intervalId === "off" ? "Ritmo livre" : phase === "strong" ? `Forte • ${phaseLeft}s` : `Leve • ${phaseLeft}s`;

  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 60;

  if (!paid){
    return (
      <div className="cardio-page">
        <style>{injectedStyle()}</style>
        <div className="cardio-bg" />
        <section className="cardio-card">
          <div className="lock-title">Cardio bloqueado</div>
          <div className="lock-text">Assine o plano para liberar o cardio guiado com progresso e acompanhamento.</div>
          <button className="lock-btn primary-btn" onClick={() => nav("/planos")}>Ver planos</button>
        </section>

        {!nutriPlus ? (
          <button className="floating-nutri" style={{ bottom: FLOATING_BOTTOM }} onClick={() => nav("/planos")}>
            <span className="floating-dot" /> Liberar Nutri+
          </button>
        ) : (
          <button className="floating-nutri floating-nutri-paid" style={{ bottom: FLOATING_BOTTOM }} onClick={() => nav("/nutricao")}>
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="cardio-page">
      <style>{injectedStyle()}</style>

      {/* background */}
      <div className="cardio-bg" />

      {/* toast */}
      {toast ? (
        <div className="toast-wrap" role="status" aria-live="polite">
          <div className="toast-card">
            <div className="toast-dot" />
            <div style={{ minWidth: 0 }}>
              <div className="toast-title">{toast.title}</div>
              <div className="toast-text">{toast.text}</div>
            </div>
            <button className="toast-x" onClick={() => setToast(null)} aria-label="Fechar">✕</button>
          </div>
        </div>
      ) : null}

      {/* top hero */}
      <section className="cardio-card hero-card" aria-label="Cardio">
        <div>
          <div className="kicker">CARDIO</div>
          <h1 className="hero-title">Bora pro cardio<span style={{ color: ORANGE }}>.</span></h1>
          <p className="hero-sub">Opções simples e comparáveis — escolha o que faz sentido pra você e começe.</p>

          <div className="hero-stats" style={{ marginTop: 12 }}>
            <div className="stat-card">
              <div className="stat-label">Modalidade</div>
              <div className="stat-value">{opt.title}</div>
              <div className="stat-sub">{opt.subtitle}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Intensidade</div>
              <div className="stat-value">{intensity}%</div>
              <div className="stat-sub">~{Math.round(metNow)} MET • {kpmNow} kcal/min</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Meta / modo</div>
              <div className="stat-value">{mode === "timer" ? `${minutes} min` : "Cronômetro"}</div>
              <div className="stat-sub">{phaseLabel}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
            <button className={`mode-btn ${mode === "timer" ? "on" : ""}`} onClick={() => { vibrate(10); pause(); setMode("timer"); setRemaining(minutes*60); syncLiveStopped({mode:"timer"}); }}>Timer</button>
            <button className={`mode-btn ${mode === "chrono" ? "on" : ""}`} onClick={() => { vibrate(10); pause(); setMode("chrono"); setElapsed(0); syncLiveStopped({mode:"chrono", durationSec:0, elapsedSecBase:0}); }}>Cronômetro</button>
            <button className="secondary-btn" onClick={() => setCalSheet(true)}>Por calorias</button>
          </div>

          <div className="session-meta-row" style={{ marginTop: 6 }}>
            <div className="session-badge-row">
              <div className="live-dot" />
              <div className="session-badge-text">{kpmNow} kcal/min • {Math.round(metNow)} MET</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="mini-ghost-btn" onClick={() => setIntSheet(true)}>Intervalos</button>
              <button className="mini-ghost-btn" onClick={resetAll}>Limpar</button>
            </div>
          </div>
        </div>
      </section>

      {/* main grid */}
      <div className="cardio-card main-grid" style={{ marginTop: 16 }}>
        {/* left column: modalities & presets */}
        <div>
          <div className="section-head">
            <div>
              <div className="section-title">Modalidades</div>
              <div className="section-sub">Opções fáceis de comparar. Toque pra selecionar.</div>
            </div>
            <div style={{ alignSelf: "center" }} />
          </div>

          <div className="workout-grid">
            {options.map(o => {
              const on = picked === o.id;
              const kpm = Math.round(calcKcalPerMin({ kg: weightKg, met: o.met * intensityMult }));
              return (
                <button
                  key={o.id}
                  className={`workout-card-btn ${on ? 'on' : ''}`}
                  onClick={() => { setPicked(o.id); vibrate(10); resetAll(); }}
                >
                  <div className="workout-title">{o.title}</div>
                  <div className="workout-sub">{o.subtitle}</div>
                  <div className="workout-meta">~{kpm} kcal/min • {Math.round(o.met)} MET</div>
                </button>
              );
            })}
          </div>

          <div className="label-line">Presets rápidos</div>
          <div className="preset-grid" style={{ marginTop: 10 }}>
            {[10,15,20,30,45,60].map(m => (
              <button key={m} className={`preset-btn ${minutes === m ? 'on' : ''}`} onClick={() => setPresetMin(m)}>{m} min</button>
            ))}
          </div>

          <div className="label-line" style={{ marginTop: 12 }}>Histórico recente</div>
          <div className="history-list">
            {/* lightweight history: show last 3 from localStorage */}
            <RecentSessions email={email} />
          </div>
        </div>

        {/* right column: timer / estimate */}
        <div>
          <div className="timer-hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="timer-number fitdeal-digital-time">{shownTime}</div>
                <div className="timer-sub">Estimativa atual: ~{kpmNow} kcal • {elapsedMin} min</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 110 }}>
                <button className={`primary-btn`} onClick={toggleRun} aria-pressed={running} style={{ minHeight: 54 }}>
                  {running ? 'Pausar' : 'Começar'}
                </button>
                <button className="secondary-btn" onClick={finish} style={{ minHeight: 48 }}>Concluir</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="timer-track" aria-hidden>
                <div className="timer-fill" style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>
          </div>

          <div className="estimate-card" style={{ marginTop: 12 }}>
            <div className="estimate-label">Previsão da configuração atual</div>
            <div className="estimate-value">~{sessionEstimate} kcal</div>
            <div className="estimate-copy">Ex.: {minutes} min de {opt.title.toLowerCase()} em ritmo atual → ~{sessionEstimate} kcal</div>
            <div className="estimate-note" style={{ marginTop: 8 }}>{opt.subtitle}</div>
          </div>

          <div className="intensity-card" style={{ marginTop: 12 }}>
            <div className="intensity-top">
              <div>
                <div className="intensity-title">Intensidade</div>
                <div className="intensity-sub">{Math.round(intensity)}% — ajuste o ritmo</div>
              </div>
              <div className="intensity-pill">{Math.round(intensity)}%</div>
            </div>

            <input className="slider" type="range" min={70} max={115} value={intensity} onChange={(e) => {
              const v = Number(e.target.value);
              setIntensity(v);
              const live = readLive(email);
              if (live) writeLive(email, { ...live, intensity: v, updatedAt: nowTs() });
            }} />
            <div className="intensity-bottom" style={{ marginTop: 8 }}>
              <div className="intensity-mini">Leve</div>
              <div className="intensity-mini">Padrão</div>
              <div className="intensity-mini">Forte</div>
            </div>
          </div>

          <div style={{ height: 8 }} />
          <div className="note">Dica: conclua pelo menos <b>3 min</b> pra registrar no dashboard.</div>
        </div>
      </div>

      {/* sheets */}
      <Sheet open={calSheet} onClose={() => setCalSheet(false)} title="Por calorias">
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 8, color: MUTED }}>Insira a meta de calorias — a gente calcula o tempo.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={kcalTarget} onChange={e => setKcalTarget(e.target.value)} placeholder="Ex.: 250" inputMode="numeric" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.03)", color: TEXT, fontWeight: 800 }} />
            <button className="sheet-go" onClick={startByCalories}>Calcular</button>
          </div>
        </div>
      </Sheet>

      <Sheet open={intSheet} onClose={() => setIntSheet(false)} title="Intervalos">
        <div style={{ padding: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { id: "off", name: "Desligado", on: 0, off: 0 },
              { id: "30_30", name: "30s / 30s", on: 30, off: 30 },
              { id: "40_20", name: "40s / 20s", on: 40, off: 20 },
              { id: "60_30", name: "60s / 30s", on: 60, off: 30 },
            ].map(p => (
              <button key={p.id} className="sheet-option" onClick={() => applyIntervals(p.id, p.on, p.off)} style={{ padding: 12, borderRadius: 12, textAlign: "left", background: p.id === intervalId ? "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,255,255,.02))" : "rgba(255,255,255,.02)" }}>
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <div style={{ marginTop: 6, color: MUTED }}>{p.id === "off" ? "Sem ciclos" : `Ciclo: ${p.on}s / ${p.off}s`}</div>
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      {/* floating CTA (nutri) */}
      {!nutriPlus ? (
        <button className="floating-nutri" style={{ bottom: FLOATING_BOTTOM }} onClick={() => nav("/planos")}>
          <span className="floating-dot" /> Liberar Nutri+
        </button>
      ) : (
        <button className="floating-nutri floating-nutri-paid" style={{ bottom: FLOATING_BOTTOM }} onClick={() => nav("/nutricao")}>
          Ver minha refeição
        </button>
      )}

      {/* mini dock */}
      <CardioMiniDock nav={nav} />

      {/* bottom spacing */}
      <div style={{ height: 220 }} />
    </div>
  );
}

/* ---------------- RecentSessions component (small) ---------------- */
function RecentSessions({ email }){
  if (typeof window === "undefined") return null;
  const sessionsKey = `cardio_sessions_${email}`;
  const raw = localStorage.getItem(sessionsKey);
  const list = raw ? safeJsonParse(raw, []) : [];
  const recent = Array.isArray(list) ? [...list].sort((a,b)=> (a.createdAt<b.createdAt?1:-1)).slice(0,3) : [];
  return (
    <>
      {recent.length === 0 ? (
        <div className="empty-card">Sem sessões registradas ainda — começa um cardio e vemos aqui.</div>
      ) : recent.map(s => (
        <div key={s.id} className="history-row">
          <div>
            <div className="history-title">{s.title}</div>
            <div className="history-sub">{s.minutes} min • {s.kcal} kcal • {s.day}</div>
          </div>
          <div className="history-kcal">{s.kcal} kcal</div>
        </div>
      ))}
    </>
  );
}

/* ---------------- CardioMiniDock (global mini player) ---------------- */
export function CardioMiniDock({ nav }){
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();
  const [live, setLive] = useState(null);
  const [tsNow, setTsNow] = useState(nowTs());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pull = () => { setTsNow(nowTs()); setLive(readLive(email)); };
    pull();
    const t = setInterval(pull, 450);
    return () => clearInterval(t);
  }, [email]);

  if (!live) return null;
  const shownSec = computeShownSecondsFromLive(live, tsNow);
  const isTimer = live.mode === "timer";
  const dur = Number(live.durationSec || 0) || 0;
  const elapsedTotal = computeElapsedTotalSec(live, tsNow);
  const progress = isTimer && dur>0 ? clamp(elapsedTotal/dur,0,1) : 0;
  const hasAnyTime = isTimer ? dur>0 && shownSec<dur : shownSec>0;
  if (!live.running && !hasAnyTime) return null;

  const bottomSafe = 102 + 10;

  return (
    <button type="button" onClick={() => nav("/cardio")} className="mini-dock" style={{ bottom: `calc(${bottomSafe}px + env(safe-area-inset-bottom))` }} aria-label="Abrir cardio (mini player)">
      <div className="mini-left">
        <div className="mini-dot" style={{ background: live.running ? ORANGE : "rgba(255,255,255,.2)" }} />
        <div style={{ minWidth: 0 }}>
          <div className="mini-top">{live.running ? "Cardio rodando" : "Cardio pausado"}</div>
          <div className="mini-sub">{String(live.title || "Cardio")} • {Math.round(Number(live.kcalPerMin || 0) || 0)} kcal/min</div>
        </div>
      </div>

      <div className="mini-right">
        <div className="mini-time fitdeal-digital-time">{formatTime(shownSec)}</div>
        <div className="mini-track">
          <div className="mini-fill" style={{ transform: `scaleX(${isTimer ? progress : live.running ? 0.35 : 0.18})` }} />
        </div>
      </div>
    </button>
  );
}

/* ---------------- styles injection ---------------- */
function injectedStyle(){
  return `
    @font-face{
      font-family: "FitdealSevenSeg";
      src: url("/fonts/SevenSegment.ttf") format("truetype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    * { box-sizing: border-box; }
    .fitdeal-digital-time { font-family: "FitdealSevenSeg", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace !important; font-variant-numeric: tabular-nums; text-rendering: geometricPrecision; }

    .cardio-page {
      min-height: 100%;
      padding: 14px 12px 220px;
      position: relative;
      overflow: auto;
      background: ${BG_DARK};
      color: ${TEXT};
      -webkit-font-smoothing: antialiased;
    }
    .cardio-bg {
      position: fixed; inset: 0; pointer-events: none;
      background:
        radial-gradient(circle at top center, rgba(255,106,0,.12) 0%, transparent 28%),
        radial-gradient(circle at 80% 10%, rgba(99,183,255,.06) 0%, transparent 22%),
        linear-gradient(180deg, #0B1118 0%, #0D141D 42%, #091017 100%);
      z-index: 0;
    }
    .cardio-card {
      position: relative;
      z-index: 1;
      border-radius: 20px;
      padding: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      border: 1px solid rgba(255,255,255,.04);
      box-shadow: 0 18px 60px rgba(0,0,0,.3);
      backdrop-filter: blur(14px) saturate(120%);
      margin-bottom: 12px;
    }

    /* HERO */
    .hero-card { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
    .kicker { display:inline-flex; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.03); color:${MUTED}; font-weight:900; font-size:12px; letter-spacing:.6px; }
    .hero-title { margin:8px 0 0; font-size: clamp(26px, 5vw, 34px); font-weight:950; line-height:1.03; }
    .hero-sub { margin:10px 0 0; color:${MUTED}; font-weight:700; font-size:14px; max-width:520px; }

    .hero-stats { display:flex; gap:10px; margin-top:12px; }
    .stat-card { flex:1; border-radius:16px; padding:10px; background: rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.03); }
    .stat-label { color:${MUTED}; font-weight:900; font-size:12px; margin-bottom:6px; }
    .stat-value { font-weight:950; font-size:18px; }
    .stat-sub { color:${MUTED_2}; font-weight:800; font-size:12px; margin-top:6px; }

    /* MAIN GRID */
    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; z-index:1; }

    .section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px; }
    .section-title { font-size:18px; font-weight:950; }
    .section-sub { color:${MUTED}; font-weight:800; font-size:13px; margin-top:6px; }

    .workout-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    .workout-card-btn { text-align:left; padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,.03); background: rgba(255,255,255,.02); color:${TEXT}; box-shadow: 0 12px 34px rgba(0,0,0,.2); min-height:120px; display:flex; flex-direction:column; justify-content:space-between; }
    .workout-card-btn.on { background: linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,106,0,.06)); border-color: rgba(255,106,0,.18); }

    .workout-title { font-size:16px; font-weight:950; }
    .workout-sub { margin-top:8px; color:${MUTED}; font-weight:800; font-size:13px; line-height:1.35; }
    .workout-meta { margin-top:10px; color:${ORANGE_SOFT}; font-weight:900; }

    .preset-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin-top:8px; }
    .preset-btn { padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.03); background: rgba(255,255,255,.02); font-weight:900; }
    .preset-btn.on { background: linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE}); color:#111; border:none; }

    .history-list { margin-top:8px; display:flex; flex-direction:column; gap:10px; }

    .history-row { display:grid; grid-template-columns: 1fr auto; gap:12px; padding:12px; border-radius:12px; background: rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.03); }
    .history-title { font-weight:950; }
    .history-sub { color:${MUTED}; font-weight:800; font-size:13px; }
    .history-kcal { font-weight:950; align-self:center; }

    .empty-card { padding:12px; border-radius:12px; background: rgba(255,255,255,.01); border:1px dashed rgba(255,255,255,.03); color:${MUTED}; font-weight:800; }

    /* timer / estimate */
    .timer-hero { border-radius:14px; padding:12px; background: rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.03); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
    .timer-number { font-weight:950; font-size: clamp(36px, 12vw, 72px); line-height:1; white-space:nowrap; overflow:hidden; }
    .timer-sub { color:${MUTED}; font-weight:800; margin-top:8px; }

    .timer-track { width:100%; height:10px; background: rgba(255,255,255,.03); border-radius:999px; margin-top:12px; border:1px solid rgba(255,255,255,.02); overflow:hidden; }
    .timer-fill { height:100%; background: linear-gradient(90deg, ${ORANGE}, ${ORANGE_SOFT}); transform-origin:left center; transition: transform .25s ease; }

    .estimate-card { margin-top:12px; padding:12px; border-radius:14px; background: rgba(255,255,255,.01); border:1px solid rgba(255,255,255,.03); }
    .estimate-label { color:${MUTED_2}; font-weight:900; font-size:13px; }
    .estimate-value { font-weight:950; font-size: clamp(28px, 9vw, 56px); margin-top:6px; line-height:0.95; }
    .estimate-copy { color:${MUTED}; font-weight:800; margin-top:8px; }

    .intensity-card { margin-top:12px; padding:12px; border-radius:12px; background: linear-gradient(180deg, rgba(255,106,0,.06), rgba(255,255,255,.01)); border:1px solid rgba(255,106,0,.08); }
    .intensity-title { font-weight:950; font-size:15px; }
    .intensity-sub { color:${MUTED}; font-weight:800; font-size:13px; margin-top:6px; }
    .intensity-pill { padding:6px 8px; border-radius:999px; background: rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.03); font-weight:950; }

    .slider { width:100%; margin-top:10px; accent-color: ${ORANGE}; }

    .label-line { margin-top:12px; color:${MUTED_2}; font-weight:900; font-size:12px; letter-spacing:.3px; }

    .note { color:${MUTED}; font-weight:800; margin-top:10px; }

    /* sheet */
    .cardio-sheet-overlay { position: fixed; inset:0; z-index:9999; background: rgba(2,6,23,.48); display:grid; align-items:end; padding:12px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
    .cardio-sheet { width:100%; max-width:520px; margin:0 auto; border-radius:20px; background: rgba(10,14,18,.96); border:1px solid rgba(255,255,255,.04); box-shadow: 0 28px 90px rgba(0,0,0,.5); overflow:hidden; }
    .cardio-sheet-grab { width:52px; height:6px; border-radius:999px; background: rgba(255,255,255,.08); margin:8px auto 0; }
    .cardio-sheet-head { padding:12px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .cardio-sheet-title { font-weight:950; }
    .cardio-sheet-body { padding:12px; max-height: 60vh; overflow:auto; }

    .cardio-sheet-x { width:36px; height:36px; border-radius:12px; border:1px solid rgba(255,255,255,.04); background: rgba(255,255,255,.02); }

    /* buttons */
    .primary-btn { min-height:48px; padding:10px 14px; border-radius:12px; background: linear-gradient(180deg, ${ORANGE_SOFT}, ${ORANGE}); color:#111; font-weight:950; border:none; }
    .secondary-btn { min-height:44px; padding:10px 12px; border-radius:12px; background: rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.03); color:${TEXT}; font-weight:900; }
    .mini-ghost-btn { padding:8px 10px; border-radius:10px; background: rgba(255,255,255,.01); border:1px solid rgba(255,255,255,.03); font-weight:900; }

    /* floating CTA */
    .floating-nutri { position: fixed; left: 50%; transform: translateX(-50%); z-index: 998; min-height:52px; padding:0 16px; border-radius:999px; display:inline-flex; align-items:center; gap:10px; border:1px solid rgba(255,255,255,.12); color:#111; font-weight:950; }
    .floating-nutri-paid { background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.84)); color:#111; box-shadow: 0 22px 70px rgba(255,255,255,.08); }
    .floating-dot { width:8px; height:8px; border-radius:999px; background: rgba(255,255,255,.7); box-shadow:0 0 0 7px rgba(255,255,255,.12); }

    /* mini dock */
    .mini-dock { position: fixed; left: 12px; right: 12px; z-index: 9999; border-radius: 18px; padding: 12px; background: rgba(0,0,0,.6); display:flex; align-items:center; justify-content:space-between; gap:12px; border:1px solid rgba(255,255,255,.04); box-shadow: 0 18px 60px rgba(0,0,0,.4); }
    .mini-left { display:flex; gap:10px; align-items:center; min-width:0; }
    .mini-dot { width:10px; height:10px; border-radius:999px; box-shadow:0 0 0 8px rgba(255,106,0,.08); flex-shrink:0; }
    .mini-top { font-weight:950; font-size:14px; }
    .mini-sub { color:${MUTED}; font-size:13px; font-weight:800; }
    .mini-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; min-width:80px; }
    .mini-time { font-weight:950; font-size:14px; }
    .mini-track { width:92px; height:8px; border-radius:999px; background: rgba(255,255,255,.03); overflow:hidden; border:1px solid rgba(255,255,255,.02); }
    .mini-fill { height:100%; background: linear-gradient(90deg, ${ORANGE}, ${ORANGE_SOFT}); transform-origin:left center; transition: transform .25s ease; }

    /* toast */
    .toast-wrap { position: fixed; left:12px; right:12px; top: calc(12px + env(safe-area-inset-top)); z-index:99999; display:flex; justify-content:center; pointer-events:none; }
    .toast-card { width:min(520px,100%); display:flex; gap:10px; padding:10px 12px; border-radius:12px; background: rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.04); align-items:center; pointer-events:auto; }
    .toast-dot { width:10px; height:10px; border-radius:999px; background: ${ORANGE}; box-shadow:0 0 0 8px rgba(255,106,0,.08); flex-shrink:0; }
    .toast-title { font-weight:950; }
    .toast-text { color:${MUTED}; font-weight:800; margin-top:2px; }
    .toast-x { margin-left:auto; width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,.04); background: rgba(255,255,255,.02); }

    /* responsive adjustments: MOBILE - single column, larger controls */
    @media (max-width: 820px){
      .hero-card { grid-template-columns: 1fr; }
      .hero-stats { flex-direction: column; }
      .main-grid { grid-template-columns: 1fr; }
      .workout-grid { grid-template-columns: 1fr; }
      .preset-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
      .timer-number { font-size: clamp(34px, 14vw, 56px); }
      .workout-card-btn { min-height: 140px; padding:16px; border-radius:16px; }
      .cardio-page { padding-bottom: 260px; }
      .mini-dock { left: 10px; right: 10px; border-radius:16px; padding:10px; }
      .floating-nutri { min-height:50px; padding:0 14px; }
    }

    @media (max-width: 420px){
      .preset-grid { grid-template-columns: repeat(3, 1fr); gap:8px; }
      .timer-number { font-size: clamp(28px, 16vw, 48px); }
      .workout-card-btn { min-height: 150px; padding:18px; }
      .hero-sub { font-size:13px; }
      .stat-value { font-size:16px; }
      .mini-right { min-width:72px; }
    }

    button { cursor: pointer; }
    button:active { transform: scale(.99); }
    input[type="range"] { accent-color: ${ORANGE}; }

  `;
}
