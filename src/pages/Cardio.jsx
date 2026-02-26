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
  return (met * 3.5 * w) / 200;
}

function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada rápida", met: 4.3, mapQ: "parque caminhada" },
    { id: "run", title: "Corrida leve", met: 7.0, mapQ: "pista corrida" },
    { id: "bike", title: "Bike (moderado)", met: 6.8, mapQ: "ciclovia" },
    { id: "jump", title: "Corda (leve)", met: 8.8, mapQ: "quadra esportiva" },
    { id: "hiit", title: "HIIT (curto)", met: 9.5, mapQ: "academia" },
  ];

  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "hipertrofia") mult = 1.0;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "condicionamento") mult = 1.08;
  if (goal === "powerlifting") mult = 0.98;

  if (level === "iniciante") mult *= 0.92;
  if (level === "avancado") mult *= 1.06;

  return base.map((o) => ({ ...o, met: clamp(o.met * mult, 3.6, 10.5) }));
}

function getCongrats(goal, level) {
  if (goal === "saude")
    return level === "iniciante"
      ? "Parabéns! Você fez o básico bem feito — isso muda o corpo e a mente."
      : "Excelente! Rotina consistente é o que mantém você forte por anos.";
  if (goal === "condicionamento")
    return level === "iniciante"
      ? "Boa! Seu fôlego começa a mudar a partir de hoje."
      : "Monstro! Você subiu o nível — sua resistência tá ficando real.";
  if (goal === "powerlifting")
    return "Perfeito. Cardio na medida certa melhora recuperação sem roubar força.";
  if (goal === "bodybuilding")
    return "Excelente! Cardio inteligente ajuda definição e melhora o desempenho.";
  return "Parabéns! Você fez o que precisava — consistência vence.";
}

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

  const [pulsePick, setPulsePick] = useState(false);

  const opt = useMemo(
    () => options.find((o) => o.id === picked) || options[0],
    [options, picked]
  );

  const kcalPerMin = useMemo(
    () => calcKcalPerMin({ kg: weightKg, met: opt?.met || 4.3 }),
    [weightKg, opt]
  );

  // timer
  const [minutes, setMinutes] = useState(20);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(20 * 60);

  const tickRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  function setPresetMin(v) {
    const m = clamp(Number(v || 0), 5, 120);
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function start() {
    if (running) return;
    setRunning(true);
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tickRef.current);
          tickRef.current = null;
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function pause() {
    setRunning(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function reset() {
    pause();
    setRemaining(minutes * 60);
  }

  function formatTime(s) {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function finish() {
    pause();
    const doneMin = Math.max(0, Math.round((minutes * 60 - remaining) / 60));
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

    setTimeout(() => nav("/dashboard"), 600);
  }

  function openMap() {
    const q = encodeURIComponent(`${opt.mapQ} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  const elapsedMin = Math.max(0, Math.round((minutes * 60 - remaining) / 60));
  const estKcal = Math.round(elapsedMin * kcalPerMin);
  const progress = minutes ? clamp(1 - remaining / (minutes * 60), 0, 1) : 0;

  // ✅ garante que o CTA flutuante NÃO cubra o menu inferior
  // Ajuste aqui se seu BottomMenu for maior/menor:
  const BOTTOM_MENU_SAFE = 102; // px de “área segura” do menu + margem
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 18;

  if (!paid) {
    return (
      <div style={styles.page}>
        <div style={styles.lockCard}>
          <div style={styles.lockTitle}>Cardio bloqueado</div>
          <div style={styles.lockText}>Assine o plano para liberar o cardio guiado.</div>
          <button style={styles.lockBtn} onClick={() => nav("/planos")} type="button">
            Ver planos (recorrente e automático)
          </button>
        </div>

        {!nutriPlus ? (
          <button
            onClick={() => nav("/planos")}
            style={{ ...styles.floatingNutri, bottom: FLOATING_BOTTOM }}
            type="button"
            aria-label="Abrir planos Nutri+"
          >
            <span style={styles.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...styles.floatingNutri, ...styles.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
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
    <div style={styles.page}>
      <div style={styles.head}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.kicker}>Hora do cardio</div>
          <div style={styles.title}>Escolha e faça agora</div>
          <div style={styles.sub}>
            Meta: <b>{goal}</b> • Nível: <b>{level}</b>
          </div>
        </div>

        <button style={styles.backBtn} onClick={() => nav("/treino")} type="button">
          Voltar
        </button>
      </div>

      <div style={styles.pickCard}>
        <div style={styles.pickTop}>
          <div>
            <div style={styles.pickTitle}>Melhores opções</div>
            <div style={styles.pickHint}>Escolha uma e deixe o timer guiar.</div>
          </div>

          <button style={styles.mapBtn} onClick={openMap} type="button">
            Ver mapa
          </button>
        </div>

        <div style={styles.optList}>
          {options.map((o) => {
            const kpm = calcKcalPerMin({ kg: weightKg, met: o.met });
            const isOn = picked === o.id;
            return (
              <button
                key={o.id}
                onClick={() => {
                  setPicked(o.id);
                  setPulsePick(true);
                  setTimeout(() => setPulsePick(false), 220);
                  reset();
                }}
                style={{
                  ...styles.optBtn,
                  ...(isOn ? styles.optOn : styles.optOff),
                }}
                type="button"
              >
                <div style={{ minWidth: 0 }}>
                  <div style={styles.optTitle}>{o.title}</div>
                  <div style={styles.optSub}>
                    ~{Math.round(kpm)} kcal/min • ~{Math.round(kpm * 20)} kcal em 20min
                  </div>
                </div>

                <div style={{ ...styles.pill, ...(isOn ? styles.pillOn : null) }}>
                  {isOn ? "Selecionado" : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...styles.timerCard, ...(pulsePick ? styles.timerPulse : null) }}>
        <div style={styles.timerTop}>
          <div>
            <div style={styles.timerLabel}>Timer</div>
            <div style={styles.timerBig}>{formatTime(remaining)}</div>
            <div style={styles.timerSub}>
              Estimativa: <b>~{estKcal} kcal</b> • ritmo: <b>~{Math.round(kcalPerMin)} kcal/min</b>
            </div>
          </div>

          <div style={styles.timerSide}>
            <div style={styles.ringWrap}>
              <div style={styles.ringTrack}>
                <div style={{ ...styles.ringFill, transform: `scaleX(${progress})` }} />
              </div>
              <div style={styles.ringTxt}>{Math.round(progress * 100)}%</div>
            </div>
            <div style={styles.sideSmall}>
              <b>{elapsedMin}</b> min
            </div>
          </div>
        </div>

        <div style={styles.presets}>
          {[10, 15, 20, 30, 45].map((m) => (
            <button
              key={m}
              onClick={() => setPresetMin(m)}
              style={{
                ...styles.presetBtn,
                ...(minutes === m ? styles.presetOn : styles.presetOff),
              }}
              type="button"
            >
              {m}min
            </button>
          ))}
        </div>

        <div style={styles.timerActions}>
          {!running ? (
            <button style={styles.startBtn} onClick={start} type="button">
              Começar
            </button>
          ) : (
            <button style={styles.pauseBtn} onClick={pause} type="button">
              Pausar
            </button>
          )}

          <button style={styles.resetBtn} onClick={reset} type="button">
            Reset
          </button>
        </div>

        <button
          style={{
            ...styles.finishBtn,
            ...(elapsedMin < 3 ? styles.finishDisabled : null),
          }}
          onClick={finish}
          disabled={elapsedMin < 3}
          type="button"
        >
          Concluir cardio
        </button>

        <div style={styles.note}>
          Dica: conclua pelo menos <b>3 min</b> para registrar no dashboard.
        </div>
      </div>

      {!nutriPlus ? (
        <button
          onClick={() => nav("/planos")}
          style={{ ...styles.floatingNutri, bottom: FLOATING_BOTTOM }}
          type="button"
        >
          <span style={styles.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...styles.floatingNutri, ...styles.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
        >
          Ver minha refeição
        </button>
      )}

      {/* Espaço extra pra scroll e pra não “encostar” no menu */}
      <div style={{ height: 180 }} />
    </div>
  );
}

const styles = {
  page: {
    padding: 18,
    paddingBottom: 170, // mais respiro “iOS/Apple-like” e evita colisão visual com o BottomMenu
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
    transition: "transform .12s ease, filter .12s ease",
  },

  /* HEAD (mais “Jony Ive”: leve, ar e vidro) */
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
  kicker: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
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
    transition: "transform .12s ease",
  },

  /* PICK */
  pickCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  pickTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  pickTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.5 },
  pickHint: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  mapBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.85)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 26px rgba(15,23,42,.05)",
    transition: "transform .12s ease, filter .12s ease",
  },

  optList: { marginTop: 12, display: "grid", gap: 10 },
  optBtn: {
    width: "100%",
    textAlign: "left",
    borderRadius: 22,
    padding: 14,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.90)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease",
  },
  optOn: {
    background: "linear-gradient(180deg, rgba(255,106,0,.10), rgba(255,106,0,.06))",
    borderColor: "rgba(255,106,0,.20)",
    transform: "scale(0.992)",
    boxShadow: "0 18px 55px rgba(255,106,0,.10)",
  },
  optOff: { background: "rgba(255,255,255,.90)" },
  optTitle: { fontSize: 15, fontWeight: 950, color: TEXT, letterSpacing: -0.25 },
  optSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  pill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
    whiteSpace: "nowrap",
    border: "1px solid rgba(15,23,42,.06)",
  },
  pillOn: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.18)" },

  /* TIMER */
  timerCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "transform .18s ease",
  },
  timerPulse: { transform: "scale(0.995)" },
  timerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  timerLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  timerBig: { marginTop: 6, fontSize: 44, fontWeight: 950, color: TEXT, letterSpacing: -1.4, lineHeight: 1 },
  timerSub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  timerSide: { display: "grid", gap: 8, justifyItems: "end" },
  ringWrap: { width: 94, display: "grid", justifyItems: "end", gap: 8 },
  ringTrack: {
    width: 94,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  ringFill: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transformOrigin: "left center",
    transition: "transform .25s ease",
  },
  ringTxt: { fontSize: 12, fontWeight: 900, color: MUTED },
  sideSmall: { fontSize: 12, fontWeight: 900, color: TEXT, opacity: 0.9 },

  presets: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 },
  presetBtn: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 950,
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 10px 22px rgba(15,23,42,.04)",
    transition: "transform .12s ease, filter .12s ease",
  },
  presetOn: { background: ORANGE, border: "none", color: "#111", boxShadow: "0 16px 44px rgba(255,106,0,.16)" },
  presetOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  timerActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  startBtn: {
    padding: 16,
    borderRadius: 20,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.18)",
    transition: "transform .12s ease, filter .12s ease",
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
    transition: "transform .12s ease, opacity .12s ease, filter .12s ease",
  },
  finishDisabled: { opacity: 0.55, filter: "grayscale(0.2)" },
  note: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  /* FLOATING CTA — sofisticado e mais “discreto”, e NÃO cobre o menu */
  floatingNutri: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    // bottom é setado inline (FLOATING_BOTTOM) pra respeitar o menu
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

if (typeof document !== "undefined") {
  const id = "fitdeal-cardio-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }
      button:active { transform: scale(.99); }
    `;
    document.head.appendChild(style);
  }
}
