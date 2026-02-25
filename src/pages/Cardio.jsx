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
 * (estimativa padrão via MET)
 */
function calcKcalPerMin({ kg, met }) {
  const w = Number(kg || 0) || 70;
  return (Number(met || 1) * 3.5 * w) / 200;
}

/**
 * Opções “limpas” (padrão), com MET aproximado.
 * Ajuste leve por objetivo/nível (sem exagero).
 */
function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada rápida", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida leve", met: 7.0, mapQ: "pista corrida" },
    { id: "bike", title: "Bike moderada", met: 6.8, mapQ: "ciclovia" },
    { id: "ellip", title: "Elíptico", met: 5.0, mapQ: "academia" },
    { id: "row", title: "Remo ergômetro", met: 6.0, mapQ: "academia" },
    { id: "jump", title: "Corda", met: 8.8, mapQ: "quadra esportiva" },
    { id: "hiit", title: "HIIT curto", met: 9.5, mapQ: "academia" },
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
      ? "Boa. Você fez o básico bem feito — isso muda o corpo e a mente."
      : "Excelente. Rotina consistente é o que mantém você forte por anos.";
  if (goal === "condicionamento")
    return level === "iniciante"
      ? "Boa. Seu fôlego começa a mudar a partir de hoje."
      : "Monstro. Você subiu o nível — sua resistência tá ficando real.";
  if (goal === "powerlifting")
    return "Perfeito. Cardio na medida certa melhora recuperação sem roubar força.";
  if (goal === "bodybuilding")
    return "Excelente. Cardio inteligente ajuda definição e melhora o desempenho.";
  return "Parabéns. Consistência vence.";
}

function formatTime(s) {
  const sec = Math.max(0, Math.floor(Number(s || 0)));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* -------------------- UI: Modal “Medir por calorias” -------------------- */
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
            <div style={S.sheetSub}>Escolha a modalidade e diga quantas kcal você quer gastar.</div>
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
                    <div style={S.sheetOptSub}>Intensidade estimada (MET)</div>
                  </div>
                  <div style={{ ...S.sheetPill, ...(on ? S.sheetPillOn : null) }}>
                    {on ? "Selecionado" : "—"}
                  </div>
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

          <div style={S.sheetHint}>
            O tempo será calculado pelo seu peso e pela modalidade escolhida.
          </div>
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

/* -------------------- Página -------------------- */
export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  // paywall cardio (mantido)
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  // compatível com flags antigas e novas
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

  // modo: timer (countdown) ou cronometro (stopwatch)
  const [mode, setMode] = useState("timer"); // "timer" | "cronometro"

  // timer (countdown)
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20 * 60);

  // cronômetro (conta pra cima)
  const [elapsed, setElapsed] = useState(0);

  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  // sheet “medir por calorias”
  const [sheetOpen, setSheetOpen] = useState(false);
  const [kcalTarget, setKcalTarget] = useState("");

  // micro feedback
  const [pulsePick, setPulsePick] = useState(false);

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

  function resetAll() {
    stopTick();
    setRunning(false);
    setRemaining(minutes * 60);
    setElapsed(0);
  }

  function setPresetMin(v) {
    const m = clamp(Number(v || 0), 5, 240);
    stopTick();
    setRunning(false);
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

  function pause() {
    setRunning(false);
    stopTick();
  }

  function reset() {
    pause();
    if (mode === "timer") setRemaining(minutes * 60);
    else setElapsed(0);
  }

  function openMap() {
    const q = encodeURIComponent(`${opt?.mapQ || "academia"} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  // minutos “atuais” pro cálculo de kcal (depende do modo)
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
    if (mode !== "timer") return 0; // no cronômetro, não tem “fim”
    if (!minutes) return 0;
    return clamp(1 - remaining / (minutes * 60), 0, 1);
  }, [mode, minutes, remaining]);

  // barra “tempo ⇄ kcal” (lado do círculo)
  const refBlock = useMemo(() => {
    const refMin = mode === "timer" ? minutes : Math.max(1, Math.round(elapsed / 60));
    const kcal = Math.round(refMin * kcalPerMin);
    const kpm = Math.round(kcalPerMin);
    return { refMin, kcal, kpm };
  }, [mode, minutes, elapsed, kcalPerMin]);

  // iniciar por calorias: define minutos e começa
  function startByCalories() {
    const kcal = clamp(Number(kcalTarget || 0), 10, 5000);
    if (!kcal || !Number.isFinite(kcal)) return;

    // tempo = kcal / (kcal/min)
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

  // ✅ garante que o CTA flutuante NÃO cubra o menu inferior
  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 18;

  // ring positions
  const ringSize = 290;
  const radius = 118;
  const ringItems = useMemo(() => options.slice(0, 6), [options]); // mantém limpo

  function posFor(i, total) {
    const a = (Math.PI * 2 * i) / total - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    return { x, y };
  }

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
        <div style={{ minWidth: 0 }}>
          <div style={C.brand}>fitdeal</div>
          <div style={C.title}>Cardio</div>
          <div style={C.sub}>
            Meta: <b>{goal}</b> • Nível: <b>{level}</b> • Peso: <b>{weightKg} kg</b>
          </div>
        </div>

        <button style={C.backBtn} onClick={() => nav("/treino")} type="button">
          Voltar
        </button>
      </div>

      {/* CENTER RING */}
      <div style={C.centerCard}>
        <div style={C.centerTop}>
          <div>
            <div style={C.centerKicker}>Escolha a modalidade e comece</div>
            <div style={C.centerHint}>
              Estimativa por MET (peso + intensidade). Ajuste real varia por técnica e condicionamento.
            </div>
          </div>

          <button style={C.mapBtn} onClick={openMap} type="button">
            Ver mapa
          </button>
        </div>

        <div style={{ height: 14 }} />

        {/* toggle modo */}
        <div style={C.modeRow}>
          <div style={C.modePill} role="tablist" aria-label="Selecionar modo">
            <button
              type="button"
              onClick={() => {
                pause();
                setMode("timer");
                setRemaining(minutes * 60);
                setElapsed(0);
              }}
              style={{ ...C.modeBtn, ...(mode === "timer" ? C.modeBtnOn : C.modeBtnOff) }}
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
              style={{ ...C.modeBtn, ...(mode === "cronometro" ? C.modeBtnOn : C.modeBtnOff) }}
            >
              Cronômetro
            </button>
          </div>

          <button type="button" style={C.kcalBtn} onClick={() => setSheetOpen(true)}>
            Medir por calorias
          </button>
        </div>

        <div style={{ height: 16 }} />

        <div style={C.ringArea}>
          <div style={{ ...C.ringWrap, width: ringSize, height: ringSize }}>
            {/* itens ao redor */}
            {ringItems.map((o, i) => {
              const p = posFor(i, ringItems.length);
              const on = picked === o.id;

              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setPicked(o.id);
                    setPulsePick(true);
                    setTimeout(() => setPulsePick(false), 220);
                    reset();
                  }}
                  style={{
                    ...C.ringItem,
                    transform: `translate(calc(${ringSize / 2}px + ${p.x}px - 50%), calc(${ringSize / 2}px + ${p.y}px - 50%))`,
                    ...(on ? C.ringItemOn : C.ringItemOff),
                  }}
                  aria-label={o.title}
                  title={o.title}
                >
                  <div style={C.ringDot} />
                  <div style={C.ringLabel}>{o.title.split(" ")[0]}</div>
                </button>
              );
            })}

            {/* centro */}
            <div style={{ ...C.centerCircle, ...(pulsePick ? C.centerPulse : null) }}>
              <div style={C.circleTop}>
                <div style={C.circleMode}>{mode === "timer" ? "TIMER" : "CRONÔMETRO"}</div>
                <div style={C.circleName}>{opt?.title}</div>
              </div>

              <div style={C.circleTime}>{shownTime}</div>

              <div style={C.circleSub}>
                ~<b>{Math.round(kcalPerMin)}</b> kcal/min • total ~<b>{estKcal}</b> kcal
              </div>

              {/* progress bar no centro (apenas no timer) */}
              {mode === "timer" ? (
                <div style={C.circleBarTrack}>
                  <div style={{ ...C.circleBarFill, transform: `scaleX(${progress})` }} />
                </div>
              ) : (
                <div style={C.circleBarGhost}>Sem limite de tempo</div>
              )}
            </div>
          </div>

          {/* painel lateral (tempo x kcal) */}
          <div style={C.sidePanel}>
            <div style={C.sideTitle}>Relação tempo × calorias</div>

            <div style={C.sideRow}>
              <div style={C.sideK}>Ritmo</div>
              <div style={C.sideV}>
                ~{refBlock.kpm} kcal/min
              </div>
            </div>

            <div style={C.sideRow}>
              <div style={C.sideK}>Referência</div>
              <div style={C.sideV}>
                {mode === "timer" ? `${minutes} min` : `${Math.max(1, refBlock.refMin)} min`}
                {" "}
                → ~{refBlock.kcal} kcal
              </div>
            </div>

            <div style={C.sideMini}>
              *Estimativa. Pode variar por inclinação, velocidade real, técnica e pausas.
            </div>
          </div>
        </div>

        {/* presets só para timer */}
        {mode === "timer" ? (
          <>
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
          </>
        ) : null}

        {/* actions */}
        <div style={C.actions}>
          {!running ? (
            <button style={C.startBtn} onClick={start} type="button">
              Começar
            </button>
          ) : (
            <button style={C.pauseBtn} onClick={pause} type="button">
              Pausar
            </button>
          )}

          <button style={C.resetBtn} onClick={reset} type="button">
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
          Dica: conclua pelo menos <b>3 min</b> para registrar no dashboard.
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

      {/* Bottom sheet: medir por calorias */}
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

      <div style={{ height: 180 }} />
    </div>
  );
}

/* -------------------- styles -------------------- */
const C = {
  page: {
    padding: 18,
    paddingBottom: 170,
    background: BG,
  },

  /* LOCK */
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

  /* HEAD */
  head: {
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.74))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 26px 90px rgba(15,23,42,.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  brand: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
  title: { marginTop: 4, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.8, lineHeight: 1.05 },
  sub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  backBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
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

  centerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  centerKicker: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  centerHint: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  mapBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.85)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 26px rgba(15,23,42,.05)",
  },

  modeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  modePill: {
    display: "inline-flex",
    gap: 8,
    padding: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  modeBtn: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "none",
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  modeBtnOn: { background: "#0B0B0C", color: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.14)" },
  modeBtnOff: { background: "transparent", color: TEXT },

  kcalBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 34px rgba(255,106,0,.10)",
    whiteSpace: "nowrap",
  },

  ringArea: {
    display: "grid",
    gridTemplateColumns: "minmax(290px, 1fr) minmax(180px, 260px)",
    gap: 14,
    alignItems: "center",
  },

  ringWrap: { position: "relative", margin: "0 auto" },

  ringItem: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 78,
    height: 54,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.92)",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 6,
    boxShadow: "0 12px 30px rgba(15,23,42,.06)",
  },
  ringItemOn: {
    borderColor: "rgba(255,106,0,.22)",
    background: "linear-gradient(180deg, rgba(255,106,0,.12), rgba(255,106,0,.06))",
    boxShadow: "0 18px 55px rgba(255,106,0,.12)",
  },
  ringItemOff: {},
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.12)",
  },
  ringLabel: { fontSize: 11, fontWeight: 950, color: TEXT },

  centerCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 190,
    height: 190,
    transform: "translate(-50%,-50%)",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.08)",
    background:
      "radial-gradient(120px 120px at 30% 20%, rgba(255,106,0,.14), rgba(255,255,255,0) 65%), rgba(255,255,255,.94)",
    boxShadow: "0 22px 80px rgba(15,23,42,.10)",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    padding: 14,
    textAlign: "center",
  },
  centerPulse: { transform: "translate(-50%,-50%) scale(0.995)" },

  circleTop: { display: "grid", gap: 2, marginBottom: 8 },
  circleMode: { fontSize: 10, fontWeight: 950, color: MUTED, letterSpacing: 0.8 },
  circleName: { fontSize: 12, fontWeight: 950, color: TEXT, letterSpacing: -0.2, opacity: 0.9 },

  circleTime: { fontSize: 44, fontWeight: 950, color: TEXT, letterSpacing: -1.2, lineHeight: 1 },
  circleSub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.25 },

  circleBarTrack: {
    marginTop: 10,
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  circleBarFill: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transformOrigin: "left center",
    transition: "transform .25s ease",
  },
  circleBarGhost: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
    opacity: 0.85,
  },

  sidePanel: {
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.92))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  sideTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sideRow: { marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 },
  sideK: { fontSize: 12, fontWeight: 850, color: MUTED },
  sideV: { fontSize: 12, fontWeight: 950, color: TEXT, textAlign: "right" },
  sideMini: { marginTop: 10, fontSize: 11, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  presets: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 },
  presetBtn: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 10px 22px rgba(15,23,42,.04)",
  },
  presetOn: { background: ORANGE, border: "none", color: "#111", boxShadow: "0 16px 44px rgba(255,106,0,.16)" },
  presetOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  actions: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  startBtn: {
    padding: 16,
    borderRadius: 20,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.18)",
  },
  pauseBtn: {
    padding: 16,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.12)",
    background: "rgba(15,23,42,.92)",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 46px rgba(15,23,42,.16)",
  },
  resetBtn: {
    padding: 16,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
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

  /* FLOATING CTA */
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
};

/* -------------------- sheet styles -------------------- */
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

  sheetInputRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "center",
  },
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
  sheetGo: {
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 44px rgba(255,106,0,.18)",
  },
};

/* keyframes */
if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-keyframes-v2";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }
      button:active { transform: scale(.99); }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }
}
