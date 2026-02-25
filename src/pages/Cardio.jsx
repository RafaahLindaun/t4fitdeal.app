// ✅ COLE EM: src/pages/Cardio.jsx
// Cardio — mais dinâmico, fluido, premium (Apple/Jony Ive)
// ✅ inclui:
// - Muitas opções (páginas) + swipe horizontal (estilo “cards”)
// - Cronômetro em “balão” flutuante (persistente ao trocar páginas)
// - Cronômetro central (no card) + o balão acompanha quando você inicia
// - Logo do app no topo (fitdeal.)
// - Mantém o botão “Ver minha refeição” (CTA flutuante) e NÃO cobre o BottomMenu
// - Mantém paywall cardio
// - Sem libs

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

/* ✅ mais opções + “page cards” */
function getCardioOptions(goal, level) {
  const base = [
    { id: "walk", title: "Caminhada rápida", met: 4.3, mapQ: "parque caminhada", icon: "🚶‍♂️", vibe: "Leve e constante" },
    { id: "incline_walk", title: "Esteira inclinada", met: 6.0, mapQ: "academia esteira", icon: "⛰️", vibe: "Queima forte, impacto baixo" },
    { id: "run", title: "Corrida leve", met: 7.0, mapQ: "pista corrida", icon: "🏃‍♂️", vibe: "Ritmo contínuo" },
    { id: "bike", title: "Bike (moderado)", met: 6.8, mapQ: "ciclovia", icon: "🚴‍♂️", vibe: "Joelho agradece" },
    { id: "spin", title: "Bike intensa (intervalos)", met: 8.8, mapQ: "bike spinning", icon: "⚡️", vibe: "Potência + suor" },
    { id: "row", title: "Remo (ergômetro)", met: 7.5, mapQ: "academia remo ergometro", icon: "🚣‍♂️", vibe: "Corpo todo" },
    { id: "elliptical", title: "Elíptico", met: 5.8, mapQ: "academia eliptico", icon: "🫧", vibe: "Fluido, impacto baixo" },
    { id: "stairs", title: "Escada (stepmill)", met: 8.0, mapQ: "academia escada", icon: "🧗‍♂️", vibe: "Glúteo on" },
    { id: "jump", title: "Corda (leve)", met: 8.8, mapQ: "quadra esportiva", icon: "🪢", vibe: "Curto e intenso" },
    { id: "hiit", title: "HIIT (curto)", met: 9.5, mapQ: "academia", icon: "🔥", vibe: "Explosivo (curto)" },
    { id: "zone2", title: "Zona 2 (base)", met: 4.8, mapQ: "parque", icon: "💨", vibe: "Resistência premium" },
    { id: "walk_outdoor", title: "Caminhada ao ar livre", met: 4.0, mapQ: "parque perto de mim", icon: "🌿", vibe: "Mente leve" },
  ];

  let mult = 1.0;
  if (goal === "saude") mult = 0.92;
  if (goal === "hipertrofia") mult = 1.0;
  if (goal === "bodybuilding") mult = 1.02;
  if (goal === "condicionamento") mult = 1.08;
  if (goal === "powerlifting") mult = 0.98;

  if (level === "iniciante") mult *= 0.92;
  if (level === "avancado") mult *= 1.06;

  return base.map((o) => ({ ...o, met: clamp(o.met * mult, 3.6, 10.8) }));
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

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
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

  // pager
  const scrollerRef = useRef(null);
  const [page, setPage] = useState(0);

  // escolha atual baseada na página
  const opt = options[page] || options[0];

  // timer (persistente ao trocar páginas)
  const [minutes, setMinutes] = useState(20);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(20 * 60);
  const tickRef = useRef(null);

  // cronômetro “balão” (persistente) — fica visível quando você inicia
  const [bubbleOn, setBubbleOn] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);

  // salva o tipo escolhido no momento que apertou “Começar”
  const [activeSession, setActiveSession] = useState(null); // { id, title, met, mapQ }

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / w);
      setPage(clamp(idx, 0, options.length - 1));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [options.length]);

  const kcalPerMin = useMemo(() => calcKcalPerMin({ kg: weightKg, met: opt?.met || 4.3 }), [weightKg, opt]);
  const elapsedMin = Math.max(0, Math.round((minutes * 60 - remaining) / 60));
  const estKcal = Math.round(elapsedMin * kcalPerMin);
  const progress = minutes ? clamp(1 - remaining / (minutes * 60), 0, 1) : 0;

  function setPresetMin(v) {
    const m = clamp(Number(v || 0), 5, 120);
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    // se o cara já tinha “bolha”, mantém, mas fecha
    if (bubbleOn) setBubbleOpen(false);
  }

  function start() {
    if (running) return;

    // fixa a sessão no “opt” atual (não muda ao trocar páginas)
    setActiveSession({
      id: opt.id,
      title: opt.title,
      met: opt.met,
      mapQ: opt.mapQ,
      icon: opt.icon,
    });

    setBubbleOn(true);
    setBubbleOpen(false);

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

  function finish() {
    pause();
    const doneMin = Math.max(0, Math.round((minutes * 60 - remaining) / 60));

    const metUse = activeSession?.met ?? opt?.met ?? 4.3;
    const kcalPerMinUse = calcKcalPerMin({ kg: weightKg, met: metUse });
    const kcal = Math.round(doneMin * kcalPerMinUse);

    const day = yyyyMmDd(new Date());
    const sessionsKey = `cardio_sessions_${email}`;
    const totalKey = `cardio_total_${email}`;
    const weekKey = `cardio_week_${email}`;

    const record = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      day,
      minutes: doneMin,
      kcal,
      type: activeSession?.id ?? opt.id,
      title: activeSession?.title ?? opt.title,
      met: metUse,
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
        title: record.title,
        goal,
        level,
        text: getCongrats(goal, level),
        ts: Date.now(),
      })
    );

    // limpa bolha pós-registro
    setBubbleOn(false);
    setBubbleOpen(false);
    setActiveSession(null);

    setTimeout(() => nav("/dashboard"), 520);
  }

  function openMap() {
    const use = activeSession?.mapQ ?? opt.mapQ;
    const q = encodeURIComponent(`${use} perto de mim`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  function goTo(i) {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    el.scrollTo({ left: w * i, behavior: "smooth" });
  }

  // ✅ garante que o CTA flutuante NÃO cubra o menu inferior
  const BOTTOM_MENU_SAFE = 102;
  const FLOATING_BOTTOM = BOTTOM_MENU_SAFE + 18;

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Cardio bloqueado</div>
          <div style={S.lockText}>Assine o plano para liberar o cardio guiado (timer + registro).</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")} type="button" className="c-press">
            Ver planos
          </button>
        </div>

        {!nutriPlus ? (
          <button
            onClick={() => nav("/planos")}
            style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }}
            type="button"
            aria-label="Abrir planos Nutri+"
            className="c-press"
          >
            <span style={S.floatDot} />
            Liberar Nutri+
          </button>
        ) : (
          <button
            onClick={() => nav("/nutricao")}
            style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
            type="button"
            aria-label="Ver minha refeição"
            className="c-press"
          >
            Ver minha refeição
          </button>
        )}
      </div>
    );
  }

  const pillTitle = activeSession?.title ?? opt.title;
  const pillIcon = activeSession?.icon ?? opt.icon;

  return (
    <div style={S.page}>
      {/* BRAND / HEADER */}
      <div style={S.head}>
        <div style={S.brandRow}>
          <div style={S.brandLeft}>
            <div style={S.brandDot} />
            <div style={S.brandName}>
              fitdeal<span style={{ color: ORANGE }}>.</span>
            </div>
          </div>

          <button style={S.backBtn} onClick={() => nav("/treino")} type="button" className="c-press">
            Voltar
          </button>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Cardio guiado</div>
          <div style={S.title}>Leve, fluido, premium</div>
          <div style={S.sub}>
            Meta: <b>{goal}</b> • Nível: <b>{level}</b> • Peso: <b>{weightKg}kg</b>
          </div>
        </div>

        <div style={S.headActions}>
          <button style={S.softBtn} onClick={openMap} type="button" className="c-press">
            Mapa
          </button>
          <button style={S.softBtn} onClick={() => setBubbleOpen((v) => !v)} type="button" className="c-press">
            Timer
          </button>
        </div>
      </div>

      {/* PAGE DOTS */}
      <div style={S.pageDots} aria-label="Opções de cardio">
        {options.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            style={{ ...S.dot, ...(i === page ? S.dotOn : S.dotOff) }}
            className="c-press"
            aria-label={`Ir para opção ${i + 1}`}
          />
        ))}
      </div>

      {/* PAGER (cards) */}
      <div ref={scrollerRef} style={S.pager} aria-label="Cards de cardio">
        {options.map((o) => {
          const kpm = calcKcalPerMin({ kg: weightKg, met: o.met });
          const selected = opt?.id === o.id;

          return (
            <div key={o.id} style={S.pageItem}>
              <div style={{ ...S.card, ...(selected ? S.cardOn : null) }}>
                <div style={S.cardGlow} aria-hidden="true" />

                <div style={S.cardTop}>
                  <div style={S.cardIcon}>{o.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.cardTitle}>{o.title}</div>
                    <div style={S.cardSub}>{o.vibe} • ~{Math.round(kpm)} kcal/min</div>
                  </div>

                  <div style={{ ...S.selPill, ...(selected ? S.selPillOn : S.selPillOff) }}>
                    {selected ? "Agora" : "—"}
                  </div>
                </div>

                {/* TIMER CENTRAL (visual) */}
                <div style={S.centerTimerWrap}>
                  <div style={S.centerTimerLabel}>Cronômetro</div>
                  <div style={S.centerTimerBig}>{formatTime(remaining)}</div>

                  <div style={S.centerTimerMeta}>
                    <span style={S.metaPill}>
                      <span style={S.metaDot} />
                      {running ? "Rodando" : "Pronto"}
                    </span>
                    <span style={S.metaPillSoft}>~{estKcal} kcal</span>
                    <span style={S.metaPillSoft}>{elapsedMin} min</span>
                  </div>

                  <div style={S.track}>
                    <div style={{ ...S.fill, transform: `scaleX(${progress})` }} />
                  </div>
                </div>

                {/* PRESETS */}
                <div style={S.presets}>
                  {[10, 15, 20, 30, 45].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPresetMin(m)}
                      style={{ ...S.presetBtn, ...(minutes === m ? S.presetOn : S.presetOff) }}
                      type="button"
                      className="c-press"
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                {/* ACTIONS */}
                <div style={S.actions}>
                  {!running ? (
                    <button style={S.startBtn} onClick={start} type="button" className="c-press">
                      Começar agora
                    </button>
                  ) : (
                    <button style={S.pauseBtn} onClick={pause} type="button" className="c-press">
                      Pausar
                    </button>
                  )}

                  <button style={S.resetBtn} onClick={reset} type="button" className="c-press">
                    Reset
                  </button>
                </div>

                <button
                  style={{ ...S.finishBtn, ...(elapsedMin < 3 ? S.finishDisabled : null) }}
                  onClick={finish}
                  disabled={elapsedMin < 3}
                  type="button"
                  className="c-press"
                >
                  Concluir e registrar
                </button>

                <div style={S.note}>
                  Registre com pelo menos <b>3 min</b>. Cardio “inteligente” melhora recuperação e consistência.
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ TIMER BUBBLE (persistente ao trocar páginas) */}
      {bubbleOn && (
        <div
          style={{ ...S.bubble, ...(bubbleOpen ? S.bubbleOpen : S.bubbleClosed) }}
          onClick={() => setBubbleOpen((v) => !v)}
          role="button"
          aria-label="Cronômetro flutuante"
        >
          <div style={S.bubbleTop}>
            <div style={S.bubblePill}>
              <span style={S.bubbleIcon}>{pillIcon}</span>
              <span style={S.bubbleTitle}>{pillTitle}</span>
            </div>
            <div style={S.bubbleTime}>{formatTime(remaining)}</div>
          </div>

          {bubbleOpen && (
            <div style={S.bubbleBody} onClick={(e) => e.stopPropagation()}>
              <div style={S.bubbleBig}>{formatTime(remaining)}</div>
              <div style={S.bubbleSub}>
                Ritmo ~<b>{Math.round(calcKcalPerMin({ kg: weightKg, met: activeSession?.met ?? opt.met }))}</b> kcal/min •{" "}
                <b>{elapsedMin}</b> min • ~<b>{Math.round(elapsedMin * calcKcalPerMin({ kg: weightKg, met: activeSession?.met ?? opt.met }))}</b>{" "}
                kcal
              </div>

              <div style={S.bubbleBtns}>
                <button style={S.bubbleBtnMain} onClick={running ? pause : start} type="button" className="c-press">
                  {running ? "Pausar" : "Continuar"}
                </button>
                <button style={S.bubbleBtnSoft} onClick={reset} type="button" className="c-press">
                  Reset
                </button>
                <button
                  style={{ ...S.bubbleBtnFinish, ...(elapsedMin < 3 ? S.bubbleBtnFinishDisabled : null) }}
                  onClick={finish}
                  disabled={elapsedMin < 3}
                  type="button"
                  className="c-press"
                >
                  Concluir
                </button>
              </div>

              <div style={S.bubbleHint}>O timer acompanha as páginas. Troque de opção sem perder o progresso.</div>
            </div>
          )}
        </div>
      )}

      {/* ✅ mantém o botão que leva pra refeição */}
      {!nutriPlus ? (
        <button
          onClick={() => nav("/planos")}
          style={{ ...S.floatingNutri, bottom: FLOATING_BOTTOM }}
          type="button"
          className="c-press"
        >
          <span style={S.floatDot} />
          Liberar Nutri+
        </button>
      ) : (
        <button
          onClick={() => nav("/nutricao")}
          style={{ ...S.floatingNutri, ...S.floatingNutriPaid, bottom: FLOATING_BOTTOM }}
          type="button"
          className="c-press"
        >
          Ver minha refeição
        </button>
      )}

      <div style={{ height: 200 }} />
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

  /* Head */
  head: {
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.74))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 26px 90px rgba(15,23,42,.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    position: "relative",
    overflow: "hidden",
  },
  brandRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brandLeft: { display: "inline-flex", alignItems: "center", gap: 10 },
  brandDot: { width: 10, height: 10, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 6px rgba(255,106,0,.12)" },
  brandName: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  kicker: { marginTop: 10, fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
  title: { marginTop: 4, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.8, lineHeight: 1.05 },
  sub: { marginTop: 8, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  headActions: { marginTop: 12, display: "flex", gap: 10 },
  backBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
  },
  softBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 10px 26px rgba(15,23,42,.05)",
  },

  /* Dots */
  pageDots: { marginTop: 12, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  dot: { width: 10, height: 10, borderRadius: 999, border: "none" },
  dotOn: { background: ORANGE, boxShadow: "0 0 0 6px rgba(255,106,0,.14)" },
  dotOff: { background: "rgba(15,23,42,.14)" },

  /* Pager */
  pager: {
    marginTop: 12,
    borderRadius: 28,
    overflowX: "auto",
    overflowY: "hidden",
    display: "flex",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
    gap: 12,
    paddingBottom: 2,
  },
  pageItem: { scrollSnapAlign: "start", flex: "0 0 100%" },

  /* Card */
  card: {
    borderRadius: 28,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 22px 75px rgba(15,23,42,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "relative",
    overflow: "hidden",
  },
  cardOn: { borderColor: "rgba(255,106,0,.18)", boxShadow: "0 26px 90px rgba(255,106,0,.10)" },
  cardGlow: {
    position: "absolute",
    inset: -80,
    background: "radial-gradient(520px 240px at 18% 0%, rgba(255,106,0,.12), transparent 60%), radial-gradient(520px 240px at 92% 0%, rgba(15,23,42,.08), transparent 62%)",
    pointerEvents: "none",
  },
  cardTop: { position: "relative", display: "flex", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    background: "rgba(255,255,255,.86)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    flexShrink: 0,
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  cardSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.3 },
  selPill: { marginLeft: "auto", padding: "8px 10px", borderRadius: 999, fontWeight: 950, fontSize: 12, border: "1px solid rgba(15,23,42,.08)" },
  selPillOn: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.18)", color: TEXT },
  selPillOff: { background: "rgba(15,23,42,.04)", color: MUTED },

  /* Center timer */
  centerTimerWrap: { marginTop: 14, position: "relative", borderRadius: 24, padding: 16, background: "rgba(15,23,42,.03)", border: "1px solid rgba(15,23,42,.06)" },
  centerTimerLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  centerTimerBig: { marginTop: 6, fontSize: 46, fontWeight: 950, color: TEXT, letterSpacing: -1.5, lineHeight: 1 },
  centerTimerMeta: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  metaPill: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 999, background: "rgba(255,106,0,.10)", border: "1px solid rgba(255,106,0,.18)", fontSize: 12, fontWeight: 950, color: TEXT },
  metaDot: { width: 8, height: 8, borderRadius: 999, background: ORANGE, boxShadow: "0 0 0 6px rgba(255,106,0,.12)" },
  metaPillSoft: { padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.08)", fontSize: 12, fontWeight: 950, color: TEXT },

  track: { marginTop: 12, height: 10, borderRadius: 999, background: "rgba(15,23,42,.06)", overflow: "hidden", border: "1px solid rgba(15,23,42,.06)" },
  fill: { height: "100%", width: "100%", background: "linear-gradient(90deg, #FF6A00, #FFB26B)", transformOrigin: "left center", transition: "transform .25s ease" },

  /* Presets */
  presets: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 },
  presetBtn: { padding: 12, borderRadius: 18, border: "1px solid rgba(15,23,42,.08)", fontWeight: 950, background: "rgba(255,255,255,.92)", boxShadow: "0 10px 22px rgba(15,23,42,.04)" },
  presetOn: { background: ORANGE, border: "none", color: "#111", boxShadow: "0 16px 44px rgba(255,106,0,.16)" },
  presetOff: { background: "rgba(255,255,255,.92)", color: TEXT },

  /* Actions */
  actions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  startBtn: { padding: 16, borderRadius: 20, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 18px 50px rgba(255,106,0,.18)" },
  pauseBtn: { padding: 16, borderRadius: 20, border: "1px solid rgba(15,23,42,.12)", background: "rgba(15,23,42,.92)", color: "#fff", fontWeight: 950, boxShadow: "0 16px 46px rgba(15,23,42,.16)" },
  resetBtn: { padding: 16, borderRadius: 20, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.92)", color: TEXT, fontWeight: 950, boxShadow: "0 12px 30px rgba(15,23,42,.05)" },

  finishBtn: { marginTop: 12, width: "100%", padding: 18, borderRadius: 22, border: "1px solid rgba(255,255,255,.10)", background: "linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,23,42,.92))", color: "#fff", fontWeight: 950, fontSize: 14, letterSpacing: 0.2, boxShadow: "0 22px 70px rgba(2,6,23,.22)" },
  finishDisabled: { opacity: 0.55, filter: "grayscale(0.2)" },
  note: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  /* Bubble (timer) */
  bubble: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(12px + env(safe-area-inset-bottom))",
    zIndex: 999,
    borderRadius: 26,
    padding: 12,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.20)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    cursor: "pointer",
  },
  bubbleOpen: { paddingBottom: 14 },
  bubbleClosed: { paddingBottom: 10 },

  bubbleTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bubblePill: { display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 999, background: "rgba(255,106,0,.10)", border: "1px solid rgba(255,106,0,.18)" },
  bubbleIcon: { width: 34, height: 34, borderRadius: 16, display: "grid", placeItems: "center", background: "rgba(255,255,255,.70)", border: "1px solid rgba(255,255,255,.55)" },
  bubbleTitle: { fontSize: 12, fontWeight: 950, color: TEXT },
  bubbleTime: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },

  bubbleBody: { marginTop: 12, cursor: "default" },
  bubbleBig: { fontSize: 34, fontWeight: 950, color: TEXT, letterSpacing: -1.0 },
  bubbleSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  bubbleBtns: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "center" },
  bubbleBtnMain: { padding: 14, borderRadius: 20, border: "none", background: "#0B0B0C", color: "#fff", fontWeight: 950, boxShadow: "0 18px 55px rgba(0,0,0,.18)" },
  bubbleBtnSoft: { padding: 14, borderRadius: 20, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.92)", color: TEXT, fontWeight: 950, boxShadow: "0 14px 34px rgba(15,23,42,.06)" },
  bubbleBtnFinish: { padding: 14, borderRadius: 20, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 18px 55px rgba(255,106,0,.18)" },
  bubbleBtnFinishDisabled: { opacity: 0.55 },

  bubbleHint: { marginTop: 10, fontSize: 11, fontWeight: 900, color: MUTED },

  /* Lock */
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
  lockBtn: { marginTop: 12, width: "100%", padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 16px 40px rgba(255,106,0,.20)" },

  /* Floating CTA (nutri) */
  floatingNutri: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 998, // abaixo do bubble (999)
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
  const id = "fitdeal-cardio-premium-ui";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes nutriFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }
      .c-press { transition: transform .12s ease, filter .12s ease; }
      .c-press:active { transform: scale(.99); filter: brightness(.99); }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }
}
