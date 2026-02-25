// ✅ COLE EM: src/pages/Cardio.jsx
// Ajustes pedidos:
// - CTA flutuante (Liberar Nutri+ / Ver minha refeição) MAIS PRA BAIXO
// - Timer/Cronômetro em “quadrado iOS” (não redondo)
// - Pausar/Reset/Concluir com visual único, Apple-like
// - “Mapa mental” corrigido: nada estoura pra fora (sem cards fora da tela)
// - Minutos (presets) viram grid responsivo, sem overflow
// - fitdeal. com ponto laranja (normal, não flutuante)
// - mantém cores do app

import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

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

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * kcal/min = MET * 3.5 * kg / 200
 */
function calcKcalPerMin({ kg, met }) {
  const w = Number(kg || 0) || 70;
  return (Number(met || 1) * 3.5 * w) / 200;
}

function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada rápida", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida (leve)", met: 7.0, mapQ: "pista corrida" },
    { id: "bike", title: "Bike (moderado)", met: 6.8, mapQ: "ciclovia" },
    { id: "ellip", title: "Elíptico", met: 5.0, mapQ: "academia" },
    { id: "row", title: "Remo", met: 6.0, mapQ: "academia" },
    { id: "jump", title: "Corda (leve)", met: 8.8, mapQ: "quadra esportiva" },
    { id: "hiit", title: "Circuit/HIIT", met: 9.5, mapQ: "academia" },
  ];

  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "hipertrofia") mult = 1.0;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "condicionamento") mult = 1.08;
  if (goal === "powerlifting") mult = 0.98;

  if (level === "iniciante") mult *= 0.92;
  if (level === "avancado") mult *= 1.06;

  return base.map((o) => ({ ...o, met: clamp(o.met * mult, 3.2, 11.5) }));
}

function getCongrats(goal, level) {
  if (goal === "saude")
    return level === "iniciante"
      ? "Boa. Fez o básico bem feito — isso conta muito."
      : "Excelente. Constância é o que mantém você forte por anos.";
  if (goal === "condicionamento")
    return level === "iniciante"
      ? "Boa. Seu fôlego começa a mudar a partir de hoje."
      : "Monstro. Resistência subindo de verdade.";
  if (goal === "powerlifting")
    return "Perfeito. Cardio na medida certa melhora recuperação sem roubar força.";
  if (goal === "bodybuilding")
    return "Boa. Cardio inteligente ajuda definição e melhora o desempenho.";
  return "Fechado. Consistência vence.";
}

function formatTime(s) {
  const sec = Math.max(0, Math.floor(Number(s || 0)));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* -------------------- Bottom Sheet: medir por calorias -------------------- */
function CalorieSheet({
  open,
  onClose,
  options,
  picked,
  onPick,
  kcalTarget,
  setKcalTarget,
  onStartByCalories,
}) {
  if (!open) return null;

  return (
    <div style={S.sheetOverlay} role="presentation" onClick={onClose}>
      <div style={S.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetGrab} />

        <div style={S.sheetHead}>
          <div>
            <div style={S.sheetTitle}>Medir por calorias</div>
            <div style={S.sheetSub}>Escolhe a modalidade e manda as kcal.</div>
          </div>

          <button type="button" style={S.sheetX} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div style={S.sheetBody}>
          <div style={S.sheetSectionTitle}>Modalidade</div>

          <div style={S.sheetOptList}>
            {options.map((o) => {
              const on = picked === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onPick(o.id)}
                  style={{ ...S.sheetOpt, ...(on ? S.sheetOptOn : S.sheetOptOff) }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={S.sheetOptTitle}>{o.title}</div>
                    <div style={S.sheetOptSub}>{Math.round(o.met)} MET</div>
                  </div>
                  <div style={{ ...S.sheetPill, ...(on ? S.sheetPillOn : null) }}>{on ? "OK" : "—"}</div>
                </button>
              );
            })}
          </div>

          <div style={{ height: 10 }} />

          <div style={S.sheetSectionTitle}>Calorias alvo</div>
          <div style={S.sheetInputRow}>
            <input
              value={kcalTarget}
              onChange={(e) => setKcalTarget(e.target.value)}
              placeholder="Ex.: 200"
              inputMode="numeric"
              style={S.sheetInput}
            />
            <div style={S.sheetUnit}>kcal</div>
          </div>

          <div style={S.sheetHint}>A gente calcula o tempo certinho pro seu peso + modalidade.</div>
        </div>

        <div style={S.sheetFooter}>
          <button type="button" style={S.sheetCancel} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" style={S.sheetGo} onClick={onStartByCalories}>
            Calcular e começar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = localStorage.getItem(`paid_${email}`) === "1";

  const nutriPlusNew = localStorage.getItem(`nutri_plus_${email}`) === "1";
  const nutriPlusOld = localStorage.getItem(`nutri_${email}`) === "1";
  const nutriPlus = nutriPlusNew || nutriPlusOld;

  const goal = useMemo(() => getGoal(user), [user]);
  const level = useMemo(() => getLevel(user), [user]);
  const weightKg = Number(user?.peso || 0) || 70;

  const options = useMemo(() => getCardioOptions(goal, level), [goal, level]);
  const [picked, setPicked] = useState(options[0]?.id || "walk");
  const opt = useMemo(() => options.find((o) => o.id === picked) || options[0], [options, picked]);

  const kcalPerMin = useMemo(
    () => calcKcalPerMin({ kg: weightKg, met: opt?.met || 4.3 }),
    [weightKg, opt]
  );

  // modo
  const [mode, setMode] = useState("timer"); // "timer" | "cronometro"

  // timer
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20 * 60);

  // cronometro
  const [elapsed, setElapsed] = useState(0);

  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  // sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [kcalTarget, setKcalTarget] = useState("");

  // viewport
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 390));
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const isPhone = vw < 430;

  // ✅ “mapa mental” sem estourar: usa grid wrap (não absoluto)
  const ringItems = useMemo(() => {
    // 6 itens fica sempre limpo no iPhone
    const list = options.slice(0, 6);
    if (list.find((x) => x.id === picked)) return list;
    const pickedObj = options.find((x) => x.id === picked);
    if (!pickedObj) return list;
    return [pickedObj, ...list.slice(0, 5)];
  }, [options, picked]);

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  function stopTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function pause() {
    setRunning(false);
    stopTick();
  }

  function reset() {
    pause();
    if (mode === "timer") setRemaining(minutes * 60);
    else setElapsed(0);
  }

  function setPresetMin(v) {
    const m = clamp(Number(v || 0), 5, 240);
    pause();
    setMode("timer");
    setMinutes(m);
    setRemaining(m * 60);
    setElapsed(0);
  }

  function start() {
    if (running) return;
    setRunning(true);

    stopTick();
    tickRef.current = setInterval(() => {
      if (mode === "timer") {
        setRemaining((r) => {
          if (r <= 1) {
            stopTick();
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      } else {
        setElapsed((e) => e + 1);
      }
    }, 1000);
  }

  function openMap() {
    const q = encodeURIComponent(`${opt?.mapQ || "academia"} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  const elapsedMin = useMemo(() => {
    if (mode === "timer") {
      const doneSec = Math.max(0, minutes * 60 - remaining);
      return Math.max(0, Math.round(doneSec / 60));
    }
    return Math.max(0, Math.round(elapsed / 60));
  }, [mode, minutes, remaining, elapsed]);

  const shownTime = mode === "timer" ? formatTime(remaining) : formatTime(elapsed);
  const estKcal = Math.round(elapsedMin * kcalPerMin);

  const progress = useMemo(() => {
    if (mode !== "timer") return 0;
    if (!minutes) return 0;
    return clamp(1 - remaining / (minutes * 60), 0, 1);
  }, [mode, minutes, remaining]);

  function startByCalories() {
    const kcal = clamp(Number(kcalTarget || 0), 10, 5000);
    if (!kcal || !Number.isFinite(kcal)) return;

    const min = clamp(Math.ceil(kcal / Math.max(0.1, kcalPerMin)), 5, 240);
    setMode("timer");
    setMinutes(min);
    setRemaining(min * 60);
    setElapsed(0);
    setSheetOpen(false);

    setTimeout(() => start(), 120);
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
      met: opt.met,
      mode,
      createdAt: Date.now(),
    };

    const raw = localStorage.getItem(sessionsKey);
    const list = raw ? JSON.parse(raw) : [];
    const nextList = [record, ...list].slice(0, 90);
    localStorage.setItem(sessionsKey, JSON.stringify(nextList));

    const prevTotal = Number(localStorage.getItem(totalKey) || 0) || 0;
    localStorage.setItem(totalKey, String(prevTotal + kcal));

    const weekRaw = localStorage.getItem(weekKey);
    const obj = weekRaw ? JSON.parse(weekRaw) : {};
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

    setTimeout(() => nav("/dashboard"), 500);
  }

  // ✅ CTA MAIS PRA BAIXO (quase encostando no menu, mas sem cobrir)
  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 18;

  if (!paid) {
    return (
      <div style={C.page}>
        <div style={C.lockCard}>
          <div style={C.lockTitle}>Cardio bloqueado</div>
          <div style={C.lockText}>Assine o plano para liberar o cardio guiado.</div>
          <button style={C.lockBtn} onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
        </div>

        {!nutriPlus ? (
          <button
            onClick={() => nav("/planos")}
            style={{ ...C.floatingNutri, bottom: FLOATING_BOTTOM }}
            type="button"
            aria-label="Abrir planos Nutri+"
          >
            <span style={C.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...C.floatingNutri, ...C.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
            type="button"
            aria-label="Ver minha refeição"
          >
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={C.page}>
      {/* HEAD */}
      <div style={C.head}>
        <div style={C.brandRow}>
          <div style={C.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>

          <div style={C.headBtns}>
            <button style={C.headBtn} onClick={openMap} type="button">
              Ver mapa
            </button>
            <button style={C.headBtn} onClick={() => nav("/treino")} type="button">
              Voltar
            </button>
          </div>
        </div>

        <div style={C.kicker}>CARDIO</div>
        <div style={C.heroTitle}>
          Bora pro cardio<span style={{ color: ORANGE }}>.</span>
        </div>

        <div style={C.subLine}>
          Modalidade: <b>{opt?.title}</b> • Meta: <b>{goal}</b> • Nível: <b>{level}</b>
        </div>
      </div>

      {/* MODE ROW (quadrado iOS) */}
      <div style={C.modeRow}>
        <div style={C.modeSquareWrap}>
          <button
            type="button"
            onClick={() => {
              pause();
              setMode("timer");
              setRemaining(minutes * 60);
              setElapsed(0);
            }}
            style={{ ...C.modeSquareBtn, ...(mode === "timer" ? C.modeSquareOn : C.modeSquareOff) }}
          >
            Timer
          </button>

          <button
            type="button"
            onClick={() => {
              pause();
              setMode("cronometro");
              setElapsed(0);
            }}
            style={{ ...C.modeSquareBtn, ...(mode === "cronometro" ? C.modeSquareOn : C.modeSquareOff) }}
          >
            Cronômetro
          </button>
        </div>

        <button type="button" style={C.kcalBtn} onClick={() => setSheetOpen(true)}>
          Medir por calorias
        </button>
      </div>

      {/* CARD CENTRAL (quadrado + mapa mental limpo) */}
      <div style={C.centerCard}>
        <div style={C.centerTop}>
          <div style={C.centerLeft}>
            <div style={C.centerMeta}>
              <span style={C.dot} />
              <span style={C.centerModeTxt}>{mode === "timer" ? "Timer" : "Cronômetro"}</span>
              <span style={C.sep}>•</span>
              <span style={C.centerModeTxt}>{Math.round(kcalPerMin)} kcal/min</span>
              <span style={C.sep}>•</span>
              <span style={C.centerModeTxt}>{Math.round(opt?.met || 0)} MET</span>
            </div>

            <div style={C.squareTimeBox}>
              <div style={C.squareTime}>{shownTime}</div>

              {mode === "timer" ? (
                <div style={C.squareTrack}>
                  <div style={{ ...C.squareFill, transform: `scaleX(${progress})` }} />
                </div>
              ) : (
                <div style={C.squareGhost}>Sem limite de tempo</div>
              )}

              <div style={C.squareSub}>
                Estimativa agora: <b>~{estKcal} kcal</b> • {elapsedMin} min
              </div>
            </div>
          </div>

          <div style={C.centerRight}>
            <div style={C.panelTitle}>Tempo ↔ Calorias</div>

            <div style={C.panelRow}>
              <div style={C.panelK}>Agora</div>
              <div style={C.panelV}>
                {elapsedMin} min → ~{estKcal} kcal
              </div>
            </div>

            <div style={C.panelRow}>
              <div style={C.panelK}>Se fizer 20 min</div>
              <div style={C.panelV}>~{Math.round(20 * kcalPerMin)} kcal</div>
            </div>

            <div style={C.panelRow}>
              <div style={C.panelK}>Se fizer 30 min</div>
              <div style={C.panelV}>~{Math.round(30 * kcalPerMin)} kcal</div>
            </div>

            <div style={C.panelMini}>Estimativa (MET). Varia pela intensidade real.</div>
          </div>
        </div>

        {/* MAPA MENTAL (grid, sem overflow) */}
        <div style={C.ringGrid}>
          {ringItems.map((o) => {
            const on = picked === o.id;
            const kpm = Math.round(calcKcalPerMin({ kg: weightKg, met: o.met }));
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setPicked(o.id);
                  reset();
                }}
                style={{ ...C.ringChip, ...(on ? C.ringChipOn : C.ringChipOff) }}
              >
                <div style={C.ringChipTop}>
                  <div style={{ ...C.ringChipDot, ...(on ? C.ringChipDotOn : null) }} />
                  <div style={C.ringChipTitle}>{o.title}</div>
                </div>
                <div style={C.ringChipSub}>
                  ~{kpm} kcal/min • {Math.round(o.met)} MET
                </div>
              </button>
            );
          })}
        </div>

        {/* PRESETS (sem estourar) */}
        {mode === "timer" ? (
          <div style={C.presets}>
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => setPresetMin(m)}
                style={{ ...C.presetBtn, ...(minutes === m ? C.presetOn : C.presetOff) }}
                type="button"
              >
                {m}min
              </button>
            ))}
          </div>
        ) : null}

        {/* ACTIONS (visual único / Apple) */}
        <div style={C.actionsRow}>
          <button
            type="button"
            onClick={!running ? start : pause}
            style={{ ...C.actionMain, ...(running ? C.actionMainPause : C.actionMainStart) }}
          >
            <span>{!running ? "Começar" : "Pausar"}</span>
            <span style={C.actionMini}>{!running ? "vai" : "segura"}</span>
          </button>

          <button type="button" onClick={reset} style={C.actionGhost}>
            Reset
          </button>
        </div>

        <button
          style={{ ...C.finishBtn, ...(elapsedMin < 3 ? C.finishDisabled : null) }}
          onClick={finish}
          disabled={elapsedMin < 3}
          type="button"
        >
          Concluir cardio
        </button>

        <div style={C.note}>
          Dica: conclui pelo menos <b>3 min</b> pra registrar.
        </div>
      </div>

      {!nutriPlus ? (
        <button onClick={() => nav("/planos")} style={{ ...C.floatingNutri, bottom: FLOATING_BOTTOM }} type="button">
          <span style={C.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...C.floatingNutri, ...C.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
        >
          Ver minha refeição
        </button>
      )}

      <CalorieSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        options={options}
        picked={picked}
        onPick={(id) => setPicked(id)}
        kcalTarget={kcalTarget}
        setKcalTarget={setKcalTarget}
        onStartByCalories={startByCalories}
      />

      <div style={{ height: 220 }} />
    </div>
  );
}

/* -------------------- styles -------------------- */
const C = {
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

  // ✅ quadrado iOS
  modeSquareWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "min(420px, 100%)",
    flex: "1 1 260px",
  },
  modeSquareBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    fontSize: 13,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },
  modeSquareOn: { background: "#0B0B0C", color: "#fff", borderColor: "rgba(255,255,255,.10)" },
  modeSquareOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  kcalBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 34px rgba(255,106,0,.10)",
    whiteSpace: "nowrap",
  },

  centerCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  centerTop: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  centerLeft: { minWidth: 0 },
  centerRight: {
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.92))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  centerMeta: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  dot: { width: 8, height: 8, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)" },
  sep: { color: "rgba(15,23,42,.25)", fontWeight: 950 },
  centerModeTxt: { fontSize: 12, fontWeight: 900, color: MUTED },

  // ✅ quadrado do tempo
  squareTimeBox: {
    marginTop: 12,
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(15,23,42,.02), rgba(255,255,255,.98))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
    overflow: "hidden",
  },
  squareTime: { fontSize: 56, fontWeight: 950, color: TEXT, letterSpacing: -1.8, lineHeight: 1 },
  squareTrack: {
    marginTop: 12,
    width: "100%",
    height: 12,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  squareFill: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transformOrigin: "left center",
    transition: "transform .25s ease",
  },
  squareGhost: { marginTop: 12, fontSize: 12, fontWeight: 900, color: MUTED },
  squareSub: { marginTop: 12, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  panelTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  panelRow: { marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 },
  panelK: { fontSize: 12, fontWeight: 850, color: MUTED },
  panelV: { fontSize: 12, fontWeight: 950, color: TEXT, textAlign: "right" },
  panelMini: { marginTop: 10, fontSize: 11, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  // ✅ mapa mental em grid: não sai da página
  ringGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  ringChip: {
    width: "100%",
    textAlign: "left",
    borderRadius: 22,
    padding: 14,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    overflow: "hidden",
  },
  ringChipOn: {
    borderColor: "rgba(255,106,0,.20)",
    background: "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,106,0,.06))",
    boxShadow: "0 18px 55px rgba(255,106,0,.10)",
  },
  ringChipOff: {},
  ringChipTop: { display: "flex", alignItems: "center", gap: 10 },
  ringChipDot: { width: 9, height: 9, borderRadius: 999, background: "rgba(15,23,42,.18)", boxShadow: "0 0 0 7px rgba(15,23,42,.06)" },
  ringChipDotOn: { background: ORANGE, boxShadow: "0 0 0 7px rgba(255,106,0,.12)" },
  ringChipTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2, lineHeight: 1.15 },
  ringChipSub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.3 },

  // ✅ presets sem overflow
  presets: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 },
  presetBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 10px 22px rgba(15,23,42,.04)",
  },
  presetOn: { background: ORANGE, border: "none", color: "#111", boxShadow: "0 16px 44px rgba(255,106,0,.16)" },
  presetOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  // ✅ ações “únicas” (apple)
  actionsRow: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionMain: {
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.14)",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    fontWeight: 950,
    boxShadow: "0 22px 70px rgba(2,6,23,.14)",
  },
  actionMainStart: { background: "linear-gradient(180deg, rgba(11,11,12,.98), rgba(11,11,12,.92))", color: "#fff" },
  actionMainPause: { background: "linear-gradient(180deg, rgba(255,106,0,.98), rgba(255,138,61,.92))", color: "#111" },
  actionMini: { fontSize: 12, fontWeight: 950, opacity: 0.75 },

  actionGhost: {
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },

  finishBtn: {
    marginTop: 12,
    width: "100%",
    padding: 18,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,23,42,.92))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 14,
    letterSpacing: 0.2,
    boxShadow: "0 22px 70px rgba(2,6,23,.22)",
  },
  finishDisabled: { opacity: 0.55, filter: "grayscale(0.2)" },
  note: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  // ✅ CTA flutuante mais pra baixo
  floatingNutri: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 999,
    padding: "14px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.20)",
    background: "linear-gradient(180deg, rgba(255,106,0,.98), rgba(255,138,61,.92))",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 22px 70px rgba(255,106,0,.20)",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    animation: "nutriFloat 3.2s ease-in-out infinite",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  floatingNutriPaid: {
    background: "linear-gradient(180deg, rgba(11,11,12,.98), rgba(11,11,12,.92))",
    color: "#fff",
    boxShadow: "0 22px 80px rgba(0,0,0,.18)",
    border: "1px solid rgba(255,255,255,.10)",
    animation: "nutriFloat 3.6s ease-in-out infinite",
  },
  floatDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.60)",
    boxShadow: "0 0 0 7px rgba(255,255,255,.12)",
  },

  lockCard: {
    borderRadius: 26,
    padding: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 70px rgba(15,23,42,.10)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  lockText: { marginTop: 6, fontSize: 13, color: MUTED, fontWeight: 800, lineHeight: 1.4 },
  lockBtn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(255,106,0,.20)",
  },
};

/* sheet styles */
const S = {
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
  sheetOpt: {
    width: "100%",
    textAlign: "left",
    borderRadius: 22,
    padding: 14,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.92)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  sheetOptOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,106,0,.06))",
    borderColor: "rgba(255,106,0,.20)",
    boxShadow: "0 18px 55px rgba(255,106,0,.10)",
  },
  sheetOptOff: {},
  sheetOptTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetOptSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  sheetPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
    whiteSpace: "nowrap",
    border: "1px solid rgba(15,23,42,.06)",
  },
  sheetPillOn: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.18)" },

  sheetInputRow: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" },
  sheetInput: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.96)",
    outline: "none",
    fontSize: 14,
    fontWeight: 900,
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
  },
  sheetUnit: { fontSize: 12, fontWeight: 950, color: MUTED },
  sheetHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  sheetFooter: {
    padding: "12px 14px",
    borderTop: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.90)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  sheetCancel: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
  },
  sheetGo: { padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 16px 44px rgba(255,106,0,.18)" },
};

if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-fixes-v4";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }
      button:active { transform: scale(.99); }
      @media (min-width: 860px){
        /* desktop: painel lateral */
        .centerTopGridFix { grid-template-columns: 1.2fr .8fr !important; }
      }
    `;
    document.head.appendChild(style);
  }
}
