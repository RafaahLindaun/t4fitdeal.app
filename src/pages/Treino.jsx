import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* ---------------- helpers ---------------- */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function mod(n, m) {
  if (!m) return 0;
  return ((n % m) + m) % m;
}
function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}
function calcDayIndex(email) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}
function bumpDayIndex(email, max) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  localStorage.setItem(key, String(next % Math.max(max, 1)));
}
function getWeekdaysStrip(splitLen, currentIdx) {
  const out = [];
  const len = Math.max(splitLen, 1);
  for (let k = 0; k < 5; k++) {
    const idx = (currentIdx + k) % len;
    out.push({ idx, label: `Treino ${dayLetter(idx)}`, isToday: k === 0 });
  }
  return out;
}

/* ---------------- banco de grupos musculares (custom) ---------------- */
const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps"],
    library: [
      { name: "Supino reto", group: "Peito" },
      { name: "Supino inclinado", group: "Peito" },
      { name: "Crucifixo / Peck-deck", group: "Peito" },
      { name: "Crossover", group: "Peito" },
      { name: "Paralelas (ou mergulho)", group: "Tríceps/Peito" },
      { name: "Tríceps corda", group: "Tríceps" },
      { name: "Tríceps francês", group: "Tríceps" },
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps"],
    library: [
      { name: "Puxada (barra/puxador)", group: "Costas" },
      { name: "Remada (máquina/curvada)", group: "Costas" },
      { name: "Remada unilateral", group: "Costas" },
      { name: "Pulldown braço reto", group: "Costas" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Rosca direta", group: "Bíceps" },
      { name: "Rosca martelo", group: "Bíceps" },
    ],
  },
  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    library: [
      { name: "Agachamento", group: "Pernas" },
      { name: "Leg press", group: "Pernas" },
      { name: "Cadeira extensora", group: "Quadríceps" },
      { name: "Afundo / passada", group: "Glúteo/Quadríceps" },
      { name: "Panturrilha", group: "Panturrilha" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
  {
    id: "posterior_gluteo",
    name: "Posterior + Glúteo",
    muscles: ["Posterior", "Glúteos", "Core"],
    library: [
      { name: "Terra romeno", group: "Posterior" },
      { name: "Mesa flexora", group: "Posterior" },
      { name: "Hip thrust", group: "Glúteo" },
      { name: "Abdução", group: "Glúteo médio" },
      { name: "Passada (foco glúteo)", group: "Glúteo" },
      { name: "Core (dead bug)", group: "Core" },
    ],
  },
  {
    id: "ombro_core",
    name: "Ombro + Core",
    muscles: ["Ombros", "Core"],
    library: [
      { name: "Desenvolvimento", group: "Ombros" },
      { name: "Elevação lateral", group: "Ombros" },
      { name: "Posterior (reverse fly)", group: "Ombro posterior" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Pallof press", group: "Core" },
      { name: "Abdominal", group: "Core" },
    ],
  },
  {
    id: "fullbody",
    name: "Full body (saúde / base)",
    muscles: ["Corpo todo"],
    library: [
      { name: "Agachamento (leve)", group: "Pernas" },
      { name: "Supino (leve)", group: "Peito" },
      { name: "Remada (leve)", group: "Costas" },
      { name: "Desenvolvimento (leve)", group: "Ombros" },
      { name: "Posterior (leve)", group: "Posterior" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
];

function groupById(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || MUSCLE_GROUPS[0];
}

/* ✅ garante volume: se vier pouco, completa com acessórios coerentes */
function ensureVolume(list, minCount = 7) {
  const base = Array.isArray(list) ? [...list] : [];
  if (base.length >= minCount) return base;

  const extras = [
    { name: "Aquecimento (5–8min)", group: "Preparação" },
    { name: "Alongamento curto", group: "Mobilidade" },
    { name: "Core (prancha)", group: "Core" },
    { name: "Elevação lateral (leve)", group: "Ombros" },
    { name: "Rosca direta (leve)", group: "Bíceps" },
    { name: "Tríceps corda (leve)", group: "Tríceps" },
    { name: "Panturrilha", group: "Panturrilha" },
  ];

  let i = 0;
  while (base.length < minCount && i < extras.length) {
    base.push(extras[i++]);
  }
  return base;
}

function buildCustomPlan(email) {
  const raw = localStorage.getItem(`custom_split_${email}`);
  const custom = safeJsonParse(raw, null);
  if (!custom || !Array.isArray(custom.dayGroups) || custom.dayGroups.length === 0) return null;

  const rawDays = Number(custom.days || custom.dayGroups.length || 3);
  const days = clamp(rawDays, 2, 6);

  const dayGroups = [];
  for (let i = 0; i < days; i++) {
    dayGroups.push(custom.dayGroups[i] || custom.dayGroups[i % custom.dayGroups.length] || "fullbody");
  }

  const prescriptions = custom.prescriptions || {};

  const split = dayGroups.map((gid, idx) => {
    const g = groupById(gid);
    const pres = prescriptions[idx] || { sets: 4, reps: "6–12", rest: "75–120s" };

    const baseList = ensureVolume((g.library || []).slice(0, 9), 7);

    return baseList.map((ex) => ({
      ...ex,
      sets: pres.sets,
      reps: pres.reps,
      rest: pres.rest,
      method: `Split ${custom.splitId || ""} • ${g.name}`,
    }));
  });

  const base = {
    sets: "custom",
    reps: "custom",
    rest: "custom",
    style: `Personalizado • ${custom.splitId || `${days}x/sem`}`,
  };

  return { base, split, meta: { days } };
}

/* ---------------- carga/progressão (localStorage) ---------------- */
function loadLoads(email) {
  return safeJsonParse(localStorage.getItem(`loads_${email}`), {});
}
function saveLoads(email, obj) {
  localStorage.setItem(`loads_${email}`, JSON.stringify(obj));
}
function keyForLoad(viewIdx, exName) {
  return `${viewIdx}__${String(exName || "").toLowerCase()}`;
}

export default function Treino() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = localStorage.getItem(`paid_${email}`) === "1";

  const plan = useMemo(() => buildCustomPlan(email), [email]);

  const fallbackSplit = useMemo(() => {
    const A = [
      { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
      { name: "Supino inclinado", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
      { name: "Tríceps corda", group: "Tríceps", sets: 4, reps: "8–12", rest: "60–90s", method: "Básico" },
      { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "10–15", rest: "60–90s", method: "Básico" },
      { name: "Crucifixo", group: "Peito", sets: 3, reps: "10–15", rest: "60–90s", method: "Básico" },
      { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
      { name: "Paralelas", group: "Tríceps/Peito", sets: 3, reps: "8–12", rest: "60–90s", method: "Básico" },
    ];
    const B = [
      { name: "Puxada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
      { name: "Remada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
      { name: "Remada unilateral", group: "Costas", sets: 3, reps: "10–12", rest: "75–120s", method: "Básico" },
      { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "8–12", rest: "60–90s", method: "Básico" },
      { name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "10–12", rest: "60–90s", method: "Básico" },
      { name: "Face pull", group: "Ombro/escápulas", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
      { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45–75s", method: "Básico" },
    ];
    const C = [
      { name: "Agachamento", group: "Pernas", sets: 4, reps: "6–12", rest: "90–150s", method: "Básico" },
      { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "75–120s", method: "Básico" },
      { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–12", rest: "90–150s", method: "Básico" },
      { name: "Cadeira extensora", group: "Quadríceps", sets: 3, reps: "12–15", rest: "60–90s", method: "Básico" },
      { name: "Panturrilha", group: "Panturrilha", sets: 4, reps: "10–15", rest: "45–75s", method: "Básico" },
      { name: "Afundo", group: "Pernas", sets: 3, reps: "10–12", rest: "60–90s", method: "Básico" },
      { name: "Abdominal", group: "Core", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
    ];
    return { base: { style: "Padrão", sets: 4, reps: "6–12", rest: "75–120s" }, split: [A, B, C] };
  }, []);

  const base = plan?.base || fallbackSplit.base;
  const split = plan?.split || fallbackSplit.split;

  const dayIndex = useMemo(() => calcDayIndex(email), [email]);

  const [viewIdx, setViewIdx] = useState(dayIndex);

  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);
  const viewingIsToday = viewSafe === mod(dayIndex, split.length);

  const workout = useMemo(() => split[viewSafe] || [], [split, viewSafe]);

  const doneKey = `done_ex_${email}_${viewSafe}`;
  const [done, setDone] = useState(() => safeJsonParse(localStorage.getItem(doneKey), {}));
  const [tapId, setTapId] = useState(null);

  const [loads, setLoads] = useState(() => loadLoads(email));

  function toggleDone(i) {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    localStorage.setItem(doneKey, JSON.stringify(next));
    setTapId(i);
    setTimeout(() => setTapId(null), 160);
  }

  function adjustLoad(exName, delta) {
    const k = keyForLoad(viewSafe, exName);
    const cur = Number(loads[k] || 0);
    const nextVal = Math.max(0, Math.round((cur + delta) * 2) / 2); // 0.5kg steps
    const next = { ...loads, [k]: nextVal };
    setLoads(next);
    saveLoads(email, next);
  }

  // ✅ CORRIGIDO: sem reload + navega para dashboard
  function finishWorkout() {
    if (!viewingIsToday) return;

    bumpDayIndex(email, split.length);

    // limpa progresso do dia atual
    localStorage.removeItem(doneKey);
    setDone({});

    // salva histórico (dias treinados)
    const wkKey = `workout_${email}`;
    const today = todayKey();
    const raw = localStorage.getItem(wkKey);
    const list = safeJsonParse(raw, []);
    const arr = Array.isArray(list) ? list : [];
    if (!arr.includes(today)) localStorage.setItem(wkKey, JSON.stringify([...arr, today]));

    // vai pro dashboard
    nav("/dashboard");
  }

  const previewCount = Math.max(2, Math.ceil(workout.length / 2));
  const previewList = workout.slice(0, previewCount);
  const lockedList = workout.slice(previewCount);

  const strip = useMemo(
    () => getWeekdaysStrip(split.length, mod(dayIndex, split.length)),
    [split.length, dayIndex]
  );

  function openExercises() {
    nav(`/treino/detalhe?d=${viewSafe}`, { state: { from: "/treino" } });
  }

  const doneCount = Object.values(done).filter(Boolean).length;
  const progressPct = workout.length ? clamp(doneCount / workout.length, 0, 1) : 0;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerKicker}>Seu treino</div>
          <div style={styles.headerTitle}>
            Treino {dayLetter(viewSafe)} {viewingIsToday ? "• hoje" : ""}
          </div>
          <div style={styles.headerSub}>
            {plan ? (
              <>
                Método: <b>{base.style}</b> • foco:{" "}
                <b>{(split[viewSafe]?.[0]?.method || "Custom").split("•")[1] || "Personalizado"}</b>
              </>
            ) : (
              <>
                Método: <b>{base.style}</b>
              </>
            )}
          </div>
        </div>

        <button style={styles.settingsBtn} onClick={() => nav("/conta")} aria-label="Conta e configurações" type="button">
          <GearIcon />
        </button>
      </div>

      {/* PRÓXIMOS DIAS */}
      <div style={styles.stripWrap}>
        <div style={styles.stripTitle}>Próximos dias</div>
        <div style={styles.stripRow}>
          {strip.map((d) => {
            const isActive = d.idx === viewSafe;

            return (
              <button
                key={d.idx}
                style={{
                  ...styles.stripPill,
                  ...(isActive ? styles.stripPillOn : styles.stripPillOff),
                }}
                type="button"
                onClick={() => {
                  if (isActive) {
                    openExercises();
                    return;
                  }

                  setViewIdx(d.idx);
                  const nextKey = `done_ex_${email}_${d.idx}`;
                  setDone(safeJsonParse(localStorage.getItem(nextKey), {}));
                }}
              >
                {d.label}
                {d.isToday ? " • hoje" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* EXERCÍCIOS DO DIA */}
      <button style={styles.bigGo} onClick={() => openExercises()} type="button">
        <div style={styles.bigGoRow}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.bigGoTop}>Exercícios do dia</div>
            <div style={styles.bigGoSub}>
              Abrir treino {dayLetter(viewSafe)} • {workout.length} exercícios
            </div>
          </div>

          <div style={styles.bigGoIcon}>
            <ArrowIcon />
          </div>
        </div>

        <div style={styles.bubbles}>
          <span style={styles.bubble}>{viewingIsToday ? "Hoje" : `Dia ${dayLetter(viewSafe)}`}</span>
          <span style={styles.bubbleSoft}>
            {doneCount}/{workout.length} feitos
          </span>
          <span style={styles.bubbleSoft}>Toque pra abrir</span>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${Math.round(progressPct * 100)}%` }} />
        </div>

        <div style={styles.progressHint}>
          Progresso do dia: <b>{Math.round(progressPct * 100)}%</b>
        </div>
      </button>

      {/* CARD: METAS */}
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <div style={styles.cardTitle}>METAS</div>
            <div style={styles.cardSub}>Pronto para conquistar seus objetivos?</div>
          </div>
          <button style={styles.cardBtn} onClick={() => nav("/metas")} type="button">
            Abrir
          </button>
        </div>
      </div>

      {/* CARDIO */}
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <div style={styles.cardTitle}>Hora do cardio</div>
            <div style={styles.cardSub}>Acelere seus ganhos.</div>
          </div>
          <button style={styles.cardBtn} onClick={() => nav("/cardio")} type="button">
            Abrir
          </button>
        </div>
      </div>

      {/* RESUMO */}
      <div style={styles.card}>
        <div style={styles.summaryTitle}>Resumo</div>

        <div style={styles.summaryLine}>
          Exercícios hoje: <b>{workout.length}</b>
        </div>

        {paid ? (
          <>
            <div style={styles.summaryLine}>
              Séries/Reps/Descanso:{" "}
              <b>
                {workout[0]?.sets || 4} • {workout[0]?.reps || "6–12"} • {workout[0]?.rest || "75–120s"}
              </b>
            </div>

            <div style={styles.summaryActions}>
              <button style={styles.customBtn} onClick={() => nav("/treino/personalizar")} type="button">
                Personalizar
              </button>

              <button style={styles.cardBtnAlt} onClick={() => openExercises()} type="button">
                Abrir detalhes
              </button>
            </div>

            {!viewingIsToday ? (
              <div style={styles.viewHint}>
                Você está visualizando <b>Treino {dayLetter(viewSafe)}</b>. Para concluir e avançar o ciclo, volte para{" "}
                <b>Hoje</b>.
              </div>
            ) : null}
          </>
        ) : (
          <div style={styles.lockHint}>Você está no Modo Gratuito. Assine para liberar treino completo e personalização.</div>
        )}
      </div>

      {/* LISTA */}
      <div style={styles.sectionTitle}>Lista do treino - Resumido</div>

      <div style={styles.list}>
        {previewList.map((ex, i) => {
          const isDone = !!done[i];
          const loadKey = keyForLoad(viewSafe, ex.name);
          const curLoad = loads[loadKey] ?? 0;

          return (
            <div key={i} style={styles.exCard}>
              <div style={styles.exTop}>
                <div style={styles.num}>{i + 1}</div>

                <div style={{ minWidth: 0 }}>
                  <div style={styles.exName}>{ex.name}</div>
                  <div style={styles.exNote}>
                    {ex.group} • {ex.sets} séries • {ex.reps} • descanso {ex.rest}
                  </div>

                  <div style={styles.loadRow}>
                    <span style={styles.loadLabel}>Carga</span>
                    <div style={styles.loadPill}>
                      <button
                        type="button"
                        style={styles.loadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLoad(ex.name, -2.5);
                        }}
                        aria-label="Diminuir carga"
                      >
                        −
                      </button>

                      <div style={styles.loadValue}>
                        <b>{Number(curLoad || 0).toFixed(1)}</b> kg
                      </div>

                      <button
                        type="button"
                        style={styles.loadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLoad(ex.name, +2.5);
                        }}
                        aria-label="Aumentar carga"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      style={styles.loadMini}
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustLoad(ex.name, +1);
                      }}
                      title="Ajuste fino"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDone(i)}
                  aria-label={isDone ? "Desmarcar" : "Marcar como feito"}
                  style={{
                    ...styles.checkBtn,
                    ...(isDone ? styles.checkOn : styles.checkOff),
                    transform: tapId === i ? "scale(0.92)" : "scale(1)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 7L10 17l-5-5"
                      stroke={isDone ? "#111" : "#64748b"}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BLOQUEADO */}
      {!paid && lockedList.length > 0 ? (
        <>
          <div style={styles.lockTitle}>Parte do treino bloqueada</div>

          <div style={styles.lockWrap}>
            {lockedList.map((ex, j) => (
              <div key={`l_${j}`} style={styles.exCard}>
                <div style={styles.exTop}>
                  <div style={styles.numMuted}>{previewCount + j + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.exName}>{ex.name}</div>
                    <div style={styles.exNote}>{ex.group} • + dicas e execução</div>
                  </div>
                  <div style={styles.checkGhost} />
                </div>
              </div>
            ))}
          </div>

          <button style={styles.fab} onClick={() => nav("/planos")} type="button">
            <span style={styles.fabIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h12" stroke="#111" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M13 6l6 6-6 6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span style={styles.fabText}>Começar agora</span>
          </button>
        </>
      ) : null}

      {/* ✅ BOTÃO FLUTUANTE “CONCLUIR TREINO” (premium + movimento) */}
      {paid ? (
        <button
          type="button"
          style={{
            ...styles.finishFab,
            opacity: viewingIsToday ? 1 : 0.55,
            pointerEvents: viewingIsToday ? "auto" : "none",
          }}
          onClick={finishWorkout}
          disabled={!viewingIsToday}
          title={!viewingIsToday ? "Volte para hoje para concluir o treino" : "Concluir treino"}
        >
          <span style={styles.finishFabIcon} aria-hidden="true">
            <CheckRingIcon />
          </span>
          <span style={styles.finishFabText}>Concluir treino</span>
          <span style={styles.finishFabArrow} aria-hidden="true">
            <ArrowMiniIcon />
          </span>
        </button>
      ) : null}

      <div style={{ height: 140 }} />
    </div>
  );
}

/* ---------- icons ---------- */
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.35a3.35 3.35 0 1 0 0-6.7 3.35 3.35 0 0 0 0 6.7Z" stroke="white" strokeWidth="2.1" />
      <path
        d="M19.4 13.2c.04-.4.06-.8.06-1.2s-.02-.8-.06-1.2l2-1.55a.6.6 0 0 0 .14-.76l-1.9-3.3a.6.6 0 0 0-.72-.26l-2.35.95a9.2 9.2 0 0 0-2.08-1.2l-.36-2.5A.6.6 0 0 0 11.5 1h-3a.6.6 0 0 0-.59.5l-.36 2.5c-.75.3-1.44.7-2.08 1.2l-2.35-.95a.6.6 0 0 0-.72.26l-1.9 3.3a.6.6 0 0 0 .14.76l2 1.55c-.04.4-.06.8-.06 1.2s.02.8.06 1.2l-2 1.55a.6.6 0 0 0-.14.76l1.9 3.3c.15.26.46.36.72.26l2.35-.95c.64.5 1.33.9 2.08 1.2l.36 2.5c.05.29.3.5.59.5h3c.29 0 .54-.21.59-.5l.36-2.5c.75-.3 1.44-.7 2.08-1.2l2.35.95c.26.1.57 0 .72-.26l1.9-3.3a.6.6 0 0 0-.14-.76l-2-1.55Z"
        stroke="white"
        strokeOpacity="0.92"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowMiniIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckRingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
        stroke="#111"
        strokeWidth="2.2"
        strokeOpacity="0.9"
      />
      <path
        d="M7.5 12.3l2.8 2.9L16.8 9"
        stroke="#111"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const styles = {
  page: { padding: 18, paddingBottom: 190, background: BG },

  header: {
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.92), rgba(255,106,0,.62))",
    color: "#fff",
    boxShadow: "0 18px 55px rgba(15,23,42,.14)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerKicker: { fontSize: 12, fontWeight: 900, opacity: 0.95 },
  headerTitle: { marginTop: 6, fontSize: 24, fontWeight: 950, letterSpacing: -0.6, lineHeight: 1.05 },
  headerSub: { marginTop: 6, fontSize: 12, fontWeight: 850, opacity: 0.96, lineHeight: 1.3 },

  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.22)",
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 14px 34px rgba(0,0,0,.10)",
  },

  stripWrap: { marginTop: 12 },
  stripTitle: { fontSize: 12, fontWeight: 900, color: MUTED, marginBottom: 8 },
  stripRow: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  stripPill: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
    transition: "transform .12s ease",
  },
  stripPillOn: { background: "rgba(255,106,0,.16)", color: TEXT, border: "1px solid rgba(255,106,0,.22)" },
  stripPillOff: { background: "rgba(15,23,42,.04)", color: "#334155", border: "1px solid rgba(15,23,42,.06)" },

  bigGo: {
    marginTop: 12,
    width: "100%",
    borderRadius: 26,
    padding: 18,
    border: "none",
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.95))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: "1px solid rgba(15,23,42,.06)",
    position: "relative",
    transition: "transform .12s ease",
    animation: "softFloat 3.6s ease-in-out infinite",
  },
  bigGoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  bigGoTop: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  bigGoSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  bigGoIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 14px 34px rgba(255,106,0,.22)",
    flexShrink: 0,
  },

  bubbles: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  bubble: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.18)",
    border: "1px solid rgba(255,106,0,.22)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
  },
  bubbleSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 900,
    fontSize: 12,
    color: "#334155",
  },

  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    transition: "width .25s ease",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
  },
  progressHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED },

  card: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.4 },

  cardBtn: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
  },
  cardBtnAlt: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
  },

  summaryTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  summaryLine: { marginTop: 8, fontSize: 13, fontWeight: 850, color: MUTED },
  summaryActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  customBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },

  viewHint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 18,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
  },

  lockHint: {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 18,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    color: TEXT,
    fontWeight: 850,
    fontSize: 12,
    lineHeight: 1.35,
  },

  sectionTitle: { marginTop: 16, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  list: { marginTop: 12, display: "grid", gap: 12 },

  exCard: {
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 34px rgba(15,23,42,.05)",
  },
  exTop: { display: "flex", gap: 12, alignItems: "flex-start" },

  num: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 15,
    flexShrink: 0,
    marginTop: 2,
  },
  numMuted: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 15,
    flexShrink: 0,
  },

  exName: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  exNote: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED },

  loadRow: { marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  loadLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  loadPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  loadBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,106,0,.18)",
    fontWeight: 950,
    color: TEXT,
  },
  loadValue: { minWidth: 96, textAlign: "center", fontSize: 12, fontWeight: 900, color: TEXT },
  loadMini: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,106,0,.25)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    color: TEXT,
  },

  checkBtn: {
    marginLeft: "auto",
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    display: "grid",
    placeItems: "center",
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
    marginTop: 2,
  },
  checkOn: { background: "linear-gradient(135deg, #FF6A00, #FF8A3D)", boxShadow: "0 14px 34px rgba(255,106,0,.22)" },
  checkOff: { background: "rgba(15,23,42,.06)", boxShadow: "none" },
  checkGhost: { marginLeft: "auto", width: 44, height: 44, borderRadius: 16, background: "rgba(15,23,42,.06)" },

  lockTitle: { marginTop: 14, fontSize: 14, fontWeight: 950, color: TEXT },
  lockWrap: { marginTop: 10, filter: "blur(2.8px)", opacity: 0.65, pointerEvents: "none", display: "grid", gap: 12 },

  fab: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 160,
    zIndex: 999,

    minHeight: 56,
    padding: "14px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.35)",

    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    letterSpacing: -0.2,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,

    boxShadow: "0 22px 70px rgba(255,106,0,.34), inset 0 1px 0 rgba(255,255,255,.28)",
    animation: "pulseGlow 1.8s ease-in-out infinite",
    willChange: "transform",
  },
  fabIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    flexShrink: 0,

    background: "rgba(255,255,255,.88)",
    border: "1px solid rgba(255,255,255,.55)",
    display: "grid",
    placeItems: "center",

    boxShadow: "0 12px 26px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.55)",
  },
  fabText: { fontSize: 14, lineHeight: 1, whiteSpace: "nowrap" },

  /* ✅ FINISH FLOATING (pago) */
  finishFab: {
    position: "fixed",
    left: "50%",
    bottom: 92,
    transform: "translateX(-50%)",
    zIndex: 1100,

    minHeight: 58,
    padding: "14px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.40)",

    background: "linear-gradient(135deg, rgba(255,106,0,.98), rgba(255,138,61,.92))",
    color: "#111",
    fontWeight: 950,
    letterSpacing: -0.2,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,

    boxShadow: "0 26px 90px rgba(255,106,0,.38), inset 0 1px 0 rgba(255,255,255,.30)",
    animation: "finishFloat 3.2s ease-in-out infinite",
    willChange: "transform",
  },
  finishFabIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    flexShrink: 0,

    background: "rgba(255,255,255,.90)",
    border: "1px solid rgba(255,255,255,.60)",
    display: "grid",
    placeItems: "center",

    boxShadow: "0 14px 34px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.55)",
  },
  finishFabText: { fontSize: 14, lineHeight: 1, whiteSpace: "nowrap" },
  finishFabArrow: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.32)",
    border: "1px solid rgba(255,255,255,.35)",
  },
};

// animações CSS inline
if (typeof document !== "undefined") {
  const id = "fitdeal-treino-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes pulseGlow {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.03); }
      }
      @keyframes softFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }
      /* finish: mantém translateX central e adiciona y/scale */
      @keyframes finishFloat {
        0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }
        50% { transform: translateX(-50%) translateY(-3px) scale(1.01); }
      }
      button:active { transform: translateX(-50%) translateY(-1px) scale(.99); }
    `;
    document.head.appendChild(style);
  }
}
