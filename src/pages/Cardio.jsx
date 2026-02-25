import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const APP = "fitdeal";
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
 * (Fórmula padrão baseada em MET).
 */
function calcKcalPerMin({ kg, met }) {
  const w = Number(kg || 0) || 70;
  return (Number(met || 0) * 3.5 * w) / 200;
}

/**
 * METs de referência (Compendium of Physical Activities):
 * - Walking 3.5 mph ~ 4.3 MET  [oai_citation:1‡SEES](https://safeexerciseateverystage2.squarespace.com/s/2011_Compendium_of_Physical_Activities_.pdf)
 * - Running 6 mph ~ 9.8 MET  [oai_citation:2‡SEES](https://safeexerciseateverystage2.squarespace.com/s/2011_Compendium_of_Physical_Activities_.pdf)
 * - Stationary bike moderate ~ 6.8 MET  [oai_citation:3‡SEES](https://safeexerciseateverystage2.squarespace.com/s/2011_Compendium_of_Physical_Activities_.pdf)
 * - Jump rope (slow/moderate) ~ 8.8 MET  [oai_citation:4‡SEES](https://safeexerciseateverystage2.squarespace.com/s/2011_Compendium_of_Physical_Activities_.pdf)
 * - Circuit training (kettlebells/aerobic movement) ~ 8.0 MET  [oai_citation:5‡SEES](https://safeexerciseateverystage2.squarespace.com/s/2011_Compendium_of_Physical_Activities_.pdf)
 */
function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada (rápida)", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida (leve)", met: 9.8, mapQ: "pista corrida" },
    { id: "bike", title: "Bike (moderado)", met: 6.8, mapQ: "ciclovia" },
    { id: "jump", title: "Corda (leve)", met: 8.8, mapQ: "quadra esportiva" },
    { id: "hiit", title: "Circuit/HIIT (curto)", met: 8.0, mapQ: "academia" },
  ];

  // ajuste leve por objetivo/nível (sem exagero)
  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "hipertrofia") mult = 1.0;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "condicionamento") mult = 1.06;
  if (goal === "powerlifting") mult = 0.98;

  if (level === "iniciante") mult *= 0.94;
  if (level === "avancado") mult *= 1.05;

  return base.map((o) => ({ ...o, met: clamp(o.met * mult, 3.6, 10.5) }));
}

function getCongrats(goal, level) {
  if (goal === "saude")
    return level === "iniciante"
      ? "Você fez o básico bem feito — isso muda o corpo e a mente."
      : "Rotina consistente é o que mantém você forte por anos.";
  if (goal === "condicionamento")
    return level === "iniciante"
      ? "Boa! Seu fôlego começa a mudar a partir de hoje."
      : "Você subiu o nível — sua resistência tá ficando real.";
  if (goal === "powerlifting")
    return "Cardio na medida certa melhora recuperação sem roubar força.";
  if (goal === "bodybuilding")
    return "Cardio inteligente ajuda definição e melhora o desempenho.";
  return "Você fez o que precisava — consistência vence.";
}

function formatTime(s) {
  const ss = Math.max(0, Math.floor(Number(s || 0)));
  const mm = String(Math.floor(ss / 60)).padStart(2, "0");
  const rr = String(Math.floor(ss % 60)).padStart(2, "0");
  return `${mm}:${rr}`;
}

function vibrate(ms = 14) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      // @ts-ignore
      navigator.vibrate(ms);
    }
  } catch {}
}

/* ---------------- UI small bits ---------------- */

function Pill({ on, label }) {
  return (
    <div style={{ ...S.pill, ...(on ? S.pillOn : S.pillOff) }}>
      <span style={{ ...S.pillDot, ...(on ? S.pillDotOn : S.pillDotOff) }} />
      {label}
    </div>
  );
}

function MiniToggle({ left, right, value, onChange }) {
  return (
    <div style={S.miniToggle} role="tablist" aria-label="Modo">
      <button
        type="button"
        onClick={() => onChange(left.value)}
        style={{ ...S.miniTab, ...(value === left.value ? S.miniTabOn : S.miniTabOff) }}
        className="tap"
      >
        {left.label}
      </button>
      <button
        type="button"
        onClick={() => onChange(right.value)}
        style={{ ...S.miniTab, ...(value === right.value ? S.miniTabOn : S.miniTabOff) }}
        className="tap"
      >
        {right.label}
      </button>
    </div>
  );
}

function ProgressBar({ pct }) {
  const p = clamp(Number(pct || 0), 0, 1);
  return (
    <div style={S.barTrack}>
      <div style={{ ...S.barFill, width: `${Math.round(p * 100)}%` }} />
    </div>
  );
}

function OrbitalPicker({ options, picked, onPick }) {
  // raio responsivo, sem “quebrar” em telas pequenas
  const radius = 118; // base
  const n = Math.max(1, options.length);

  return (
    <div style={S.orbitWrap} aria-label="Modalidades">
      {options.map((o, i) => {
        const on = picked === o.id;
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <button
            key={o.id}
            type="button"
            className="tap"
            onClick={() => onPick(o.id)}
            style={{
              ...S.orbitBtn,
              ...(on ? S.orbitBtnOn : S.orbitBtnOff),
              transform: `translate(${x}px, ${y}px)`,
            }}
            aria-label={o.title}
          >
            <div style={S.orbitTitle}>{o.title}</div>
            <div style={S.orbitSub}>{Math.round(o.met * 10) / 10} MET</div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function Cardio() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  // paywall cardio (mantido)
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  // flags Nutri+ (mantido)
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

  // modo de contagem
  const [clockMode, setClockMode] = useState("timer"); // "timer" | "stopwatch"
  // modo de meta
  const [measureMode, setMeasureMode] = useState("tempo"); // "tempo" | "calorias"

  // timer / cronômetro
  const [minutes, setMinutes] = useState(20);
  const [running, setRunning] = useState(false);

  // countdown
  const [remaining, setRemaining] = useState(20 * 60);
  // countup
  const [elapsed, setElapsed] = useState(0);

  const tickRef = useRef(null);

  // calorias alvo (modo “por calorias”)
  const [targetKcal, setTargetKcal] = useState("");
  const targetMin = useMemo(() => {
    const kcal = Number(String(targetKcal).replace(",", "."));
    if (!Number.isFinite(kcal) || kcal <= 0) return 0;
    const m = kcalPerMin > 0 ? kcal / kcalPerMin : 0;
    return clamp(Math.round(m), 1, 240);
  }, [targetKcal, kcalPerMin]);

  // reset ao trocar modalidade (suave)
  useEffect(() => {
    // não “zera” agressivo no modo calorias se estiver rodando
    if (running) return;
    setRemaining(minutes * 60);
    setElapsed(0);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  // cleanup interval
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

  function applyMinutes(m) {
    const mm = clamp(Number(m || 0), 1, 240);
    setMinutes(mm);
    setRemaining(mm * 60);
    setElapsed(0);
  }

  function start() {
    if (running) return;

    // se estiver em TIMER e já chegou a zero, reinicia
    if (clockMode === "timer" && remaining <= 0) setRemaining(minutes * 60);

    setRunning(true);
    stopTick();

    tickRef.current = setInterval(() => {
      if (clockMode === "timer") {
        setRemaining((r) => {
          const next = Math.max(0, r - 1);
          if (next <= 0) {
            stopTick();
            setRunning(false);
          }
          return next;
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
    setRemaining(minutes * 60);
    setElapsed(0);
  }

  // kcal estimados
  const elapsedMin = useMemo(() => {
    if (clockMode === "timer") {
      const done = Math.max(0, minutes * 60 - remaining);
      return Math.max(0, Math.round(done / 60));
    }
    return Math.max(0, Math.round(elapsed / 60));
  }, [clockMode, minutes, remaining, elapsed]);

  const estKcal = useMemo(() => Math.round(elapsedMin * kcalPerMin), [elapsedMin, kcalPerMin]);

  // progresso
  const progress = useMemo(() => {
    if (clockMode === "timer") {
      return minutes ? clamp(1 - remaining / (minutes * 60), 0, 1) : 0;
    }
    // stopwatch: se tiver targetKcal válido, vira progresso; senão, zero
    const kcal = Number(String(targetKcal).replace(",", "."));
    if (!Number.isFinite(kcal) || kcal <= 0) return 0;
    return clamp(estKcal / kcal, 0, 1);
  }, [clockMode, minutes, remaining, estKcal, targetKcal]);

  function finish() {
    pause();

    const doneMin = Math.max(0, elapsedMin);
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

    setTimeout(() => nav("/dashboard"), 520);
  }

  function openMap() {
    const q = encodeURIComponent(`${opt.mapQ} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  function pickOption(id) {
    setPicked(id);
    vibrate(12);
    if (!running) reset();
  }

  function startByCalories() {
    // exige kcal alvo
    const kcal = Number(String(targetKcal).replace(",", "."));
    if (!Number.isFinite(kcal) || kcal <= 0) return;

    const m = targetMin || 0;
    if (clockMode === "timer") {
      applyMinutes(m);
      setMeasureMode("tempo"); // volta pro painel principal (mais simples)
      setTimeout(() => start(), 60);
      return;
    }

    // stopwatch: zera e começa contando até atingir kcal (visual de progresso)
    setElapsed(0);
    setMeasureMode("tempo");
    setTimeout(() => start(), 60);
  }

  // CTA flutuante não colidir com BottomMenu
  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 18;

  // injeta micro animações + taps
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-cardio-v2-ui";
    if (document.getElementById(id)) return;

    const st = document.createElement("style");
    st.id = id;
    st.innerHTML = `
      .tap { transition: transform .12s ease, filter .12s ease; }
      .tap:active { transform: scale(.99); filter: brightness(.985); }
      @media (prefers-reduced-motion: reduce) {
        .tap { transition: none !important; }
      }
    `;
    document.head.appendChild(st);
  }, []);

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Cardio bloqueado</div>
          <div style={S.lockText}>Assine um plano para liberar o cardio guiado.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")} type="button" className="tap">
            Ver planos
          </button>
        </div>

        {!nutriPlus ? (
          <button
            onClick={() => nav("/planos")}
            style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }}
            type="button"
            className="tap"
          >
            <span style={S.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
            type="button"
            className="tap"
          >
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* HEAD */}
      <div style={S.head}>
        <div style={{ minWidth: 0 }}>
          <div style={S.brandRow}>
            <div style={S.brandName}>
              {APP}
              <span style={{ color: ORANGE }}>.</span>
            </div>
            <button style={S.mapBtn} onClick={openMap} type="button" className="tap">
              Ver mapa
            </button>
          </div>

          <div style={S.kicker}>Cardio</div>
          <div style={S.title}>Leve, direto e guiado</div>
          <div style={S.sub}>
            Modalidade: <b>{opt?.title}</b> • Meta: <b>{goal}</b> • Nível: <b>{level}</b>
          </div>
        </div>

        <button style={S.backBtn} onClick={() => nav("/treino")} type="button" className="tap">
          Voltar
        </button>
      </div>

      {/* CONTROL BAR */}
      <div style={S.controlRow}>
        <MiniToggle
          left={{ label: "Timer", value: "timer" }}
          right={{ label: "Cronômetro", value: "stopwatch" }}
          value={clockMode}
          onChange={(v) => {
            setClockMode(v);
            reset();
          }}
        />

        <button
          type="button"
          className="tap"
          style={S.calModeBtn}
          onClick={() => setMeasureMode((m) => (m === "tempo" ? "calorias" : "tempo"))}
        >
          {measureMode === "tempo" ? "Medir por calorias" : "Voltar ao tempo"}
        </button>
      </div>

      {/* ORBIT + CENTER */}
      <div style={S.stage}>
        {/* Orbital buttons */}
        <OrbitalPicker options={options} picked={picked} onPick={pickOption} />

        {/* Center clock */}
        <div style={S.center}>
          <div style={S.centerGlass} />

          <div style={S.centerTop}>
            <Pill on label={opt?.title} />
            <div style={S.centerMeta}>
              ~<b>{Math.round(kcalPerMin)}</b> kcal/min • {Math.round(opt?.met * 10) / 10} MET
            </div>
          </div>

          <div style={S.centerClock}>
            {clockMode === "timer" ? formatTime(remaining) : formatTime(elapsed)}
          </div>

          <div style={S.centerKcalRow}>
            <div style={S.centerKcalLeft}>
              <div style={S.centerKcalLabel}>
                {measureMode === "calorias" ? "Alvo" : "Estimativa"}
              </div>
              <div style={S.centerKcalValue}>
                {measureMode === "calorias" && targetMin > 0 ? (
                  <>
                    <b>{targetMin}</b> min ≈ <b>{Math.round(targetMin * kcalPerMin)}</b> kcal
                  </>
                ) : (
                  <>
                    <b>{estKcal}</b> kcal
                  </>
                )}
              </div>
            </div>

            <div style={S.centerKcalRight}>
              <div style={S.smallNum}>
                <b>{elapsedMin}</b> min
              </div>
              <ProgressBar pct={progress} />
              <div style={S.smallHint}>
                {clockMode === "timer"
                  ? `${Math.round(progress * 100)}%`
                  : targetKcal
                  ? `${Math.round(progress * 100)}% do alvo`
                  : "—"}
              </div>
            </div>
          </div>

          {/* MAIN ACTIONS */}
          <div style={S.actions}>
            {!running ? (
              <button style={S.startBtn} onClick={start} type="button" className="tap">
                Começar
              </button>
            ) : (
              <button style={S.pauseBtn} onClick={pause} type="button" className="tap">
                Pausar
              </button>
            )}

            <button style={S.resetBtn} onClick={reset} type="button" className="tap">
              Reset
            </button>
          </div>

          {/* presets: apenas no modo tempo */}
          {measureMode === "tempo" && clockMode === "timer" ? (
            <div style={S.presets}>
              {[10, 15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => applyMinutes(m)}
                  style={{ ...S.presetBtn, ...(minutes === m ? S.presetOn : S.presetOff) }}
                  type="button"
                  className="tap"
                >
                  {m}min
                </button>
              ))}
            </div>
          ) : null}

          <button
            style={{
              ...S.finishBtn,
              ...(elapsedMin < 3 ? S.finishDisabled : null),
            }}
            onClick={finish}
            disabled={elapsedMin < 3}
            type="button"
            className="tap"
          >
            Concluir cardio
          </button>

          <div style={S.note}>
            Dica: conclua pelo menos <b>3 min</b> para registrar no dashboard.
          </div>
        </div>
      </div>

      {/* CALORIES MODE (sheet) */}
      {measureMode === "calorias" ? (
        <div style={S.calSheet}>
          <div style={S.calTitle}>Medir por calorias</div>
          <div style={S.calSub}>
            Escolha a modalidade acima e digite quantas calorias você quer gastar. O app calcula o tempo e inicia.
          </div>

          <div style={S.calRow}>
            <div style={S.calBox}>
              <div style={S.calLabel}>Modalidade</div>
              <div style={S.calVal}>{opt?.title}</div>
              <div style={S.calMini}>
                ~{Math.round(kcalPerMin)} kcal/min • {Math.round(opt?.met * 10) / 10} MET
              </div>
            </div>

            <div style={S.calBox}>
              <div style={S.calLabel}>Calorias alvo</div>
              <input
                value={targetKcal}
                onChange={(e) => setTargetKcal(e.target.value)}
                placeholder="Ex.: 180"
                style={S.calInput}
                inputMode="decimal"
              />
              <div style={S.calMini}>
                {targetMin > 0 ? (
                  <>
                    Tempo estimado: <b>{targetMin} min</b>
                  </>
                ) : (
                  "Digite um número para calcular."
                )}
              </div>
            </div>
          </div>

          <button
            style={{ ...S.calStart, ...(targetMin > 0 ? null : S.calStartDisabled) }}
            type="button"
            className="tap"
            onClick={startByCalories}
            disabled={targetMin <= 0}
          >
            Começar por calorias
          </button>

          <div style={S.calFoot}>
            Estimativa baseada em MET. Ajuste real varia com intensidade, inclinação, técnica e pausas.
          </div>
        </div>
      ) : null}

      {!nutriPlus ? (
        <button
          onClick={() => nav("/planos")}
          style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }}
          type="button"
          className="tap"
        >
          <span style={S.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
          className="tap"
        >
          Ver minha refeição
        </button>
      )}

      <div style={{ height: 190 }} />
    </div>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: {
    padding: 18,
    paddingBottom: 170,
    background: BG,
  },

  head: {
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.74))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 26px 90px rgba(15,23,42,.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  brandRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  brandName: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },

  kicker: { marginTop: 10, fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
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
    flexShrink: 0,
  },

  mapBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.88)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 26px rgba(15,23,42,.05)",
    flexShrink: 0,
  },

  controlRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "center",
  },

  miniToggle: {
    borderRadius: 18,
    padding: 6,
    background: "rgba(255,255,255,.86)",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  miniTab: { border: "none", borderRadius: 14, padding: "10px 10px", fontWeight: 950, fontSize: 12 },
  miniTabOn: { background: "rgba(15,23,42,.92)", color: "#fff" },
  miniTabOff: { background: "rgba(255,255,255,.86)", color: TEXT },

  calModeBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    whiteSpace: "nowrap",
  },

  stage: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "relative",
    overflow: "hidden",
    minHeight: 520,
  },

  orbitWrap: {
    position: "absolute",
    left: "50%",
    top: 240,
    transform: "translate(-50%, -50%)",
    width: 1,
    height: 1,
    pointerEvents: "none",
  },
  orbitBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 138,
    padding: 12,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.08)",
    textAlign: "left",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    pointerEvents: "auto",
  },
  orbitBtnOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.14), rgba(255,106,0,.08))",
    borderColor: "rgba(255,106,0,.22)",
    boxShadow: "0 18px 55px rgba(255,106,0,.14)",
  },
  orbitBtnOff: { background: "rgba(255,255,255,.92)" },
  orbitTitle: { fontSize: 12, fontWeight: 950, color: TEXT, letterSpacing: -0.2, lineHeight: 1.2 },
  orbitSub: { marginTop: 5, fontSize: 11, fontWeight: 850, color: MUTED },

  center: {
    position: "relative",
    zIndex: 2,
    borderRadius: 28,
    padding: 18,
    marginTop: 190,
    background: "linear-gradient(135deg, rgba(255,255,255,.96), rgba(255,255,255,.86))",
    border: "1px solid rgba(15,23,42,.07)",
    boxShadow: "0 26px 90px rgba(15,23,42,.10)",
    overflow: "hidden",
  },
  centerGlass: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(520px 260px at 25% 0%, rgba(255,106,0,.12), transparent 60%), radial-gradient(520px 260px at 95% 0%, rgba(15,23,42,.10), transparent 65%)",
    pointerEvents: "none",
  },
  centerTop: { position: "relative" },
  centerMeta: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED },

  centerClock: {
    position: "relative",
    marginTop: 12,
    fontSize: 54,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -1.6,
    lineHeight: 1,
    textAlign: "center",
  },

  centerKcalRow: {
    position: "relative",
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "end",
  },
  centerKcalLeft: { minWidth: 0 },
  centerKcalLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  centerKcalValue: { marginTop: 6, fontSize: 13, fontWeight: 900, color: TEXT, lineHeight: 1.35 },

  centerKcalRight: { display: "grid", gap: 8, justifyItems: "end" },
  smallNum: { fontSize: 12, fontWeight: 900, color: TEXT, opacity: 0.9 },
  smallHint: { fontSize: 11, fontWeight: 900, color: MUTED },

  barTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transition: "width .25s ease",
  },

  actions: { position: "relative", marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  startBtn: {
    padding: 16,
    borderRadius: 22,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.18)",
  },
  pauseBtn: {
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.12)",
    background: "rgba(15,23,42,.92)",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 46px rgba(15,23,42,.16)",
  },
  resetBtn: {
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
  },

  presets: { position: "relative", marginTop: 12, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 },
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

  finishBtn: {
    position: "relative",
    marginTop: 12,
    width: "100%",
    padding: 18,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,23,42,.92))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 14,
    letterSpacing: 0.2,
    boxShadow: "0 22px 70px rgba(2,6,23,.22)",
  },
  finishDisabled: { opacity: 0.55, filter: "grayscale(0.2)" },
  note: { position: "relative", marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,106,0,.18)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
  },
  pillOn: {},
  pillOff: {},
  pillDot: { width: 8, height: 8, borderRadius: 999 },
  pillDotOn: { background: ORANGE, boxShadow: "0 0 0 6px rgba(255,106,0,.12)" },
  pillDotOff: { background: "rgba(15,23,42,.16)" },

  /* CALORIES SHEET */
  calSheet: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  calTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  calSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  calRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  calBox: {
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.96))",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  calLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  calVal: { marginTop: 6, fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  calMini: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.25 },
  calInput: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "rgba(255,255,255,.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 12px 26px rgba(15,23,42,.05)",
  },
  calStart: {
    marginTop: 12,
    width: "100%",
    padding: 16,
    borderRadius: 22,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(255,106,0,.22)",
  },
  calStartDisabled: { opacity: 0.55, boxShadow: "none" },
  calFoot: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

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
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  floatingNutriPaid: {
    background: "linear-gradient(180deg, rgba(11,11,12,.98), rgba(11,11,12,.92))",
    color: "#fff",
    boxShadow: "0 22px 80px rgba(0,0,0,.18)",
    border: "1px solid rgba(255,255,255,.10)",
  },
  floatDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.60)",
    boxShadow: "0 0 0 7px rgba(255,255,255,.12)",
  },
};
