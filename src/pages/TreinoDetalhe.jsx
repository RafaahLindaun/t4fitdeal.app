// ✅ COLE EM: src/pages/TreinoDetalhe.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* ---------------- helpers (iguais ao Treino) ---------------- */
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
function calcDayIndex(email) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

/* ---------------- banco (MESMO do Treino) ---------------- */
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

/**
 * ✅ garante volume: se vier pouco, completa com acessórios coerentes
 * (ainda pode inserir "Aquecimento" aqui, mas no TreinoDetalhe a gente filtra)
 */
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

function buildFallbackSplit() {
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
}

/* ---------------- cargas (MESMA do Treino) ---------------- */
function loadLoads(email) {
  return safeJsonParse(localStorage.getItem(`loads_${email}`), {});
}
function saveLoads(email, obj) {
  localStorage.setItem(`loads_${email}`, JSON.stringify(obj));
}
function keyForLoad(viewIdx, exName) {
  return `${viewIdx}__${String(exName || "").toLowerCase()}`;
}

/* ---------------- detalhes por nome (pra não divergir) ---------------- */
function detailFor(exName) {
  const n = String(exName || "").toLowerCase();

  // peito
  if (n.includes("supino"))
    return {
      area: "Peitoral, tríceps e deltoide anterior.",
      cue: "Escápulas firmes, pés no chão. Desça controlando e suba forte sem perder postura.",
    };
  if (n.includes("crucifixo") || n.includes("peck") || n.includes("crossover"))
    return {
      area: "Peitoral (isolamento).",
      cue: "Abra até alongar sem forçar articulação. Feche apertando o peito e controle na volta.",
    };

  // costas
  if (n.includes("puxada") || n.includes("pulldown"))
    return { area: "Dorsal e bíceps.", cue: "Peito alto. Cotovelos descem para o lado do corpo. Não puxe com pescoço." };
  if (n.includes("remada"))
    return { area: "Costas médias/dorsal e estabilização.", cue: "Coluna firme. Puxe com cotovelos e segure 1s no final. Volte controlando." };
  if (n.includes("face pull"))
    return { area: "Posterior de ombro + escápulas.", cue: "Puxe para o rosto abrindo cotovelos. Ombro baixo, sem jogar tronco." };

  // braços
  if (n.includes("rosca"))
    return { area: "Bíceps e antebraço.", cue: "Cotovelo fixo. Sem roubar com tronco. Suba e desça controlando." };
  if (n.includes("tríceps") || n.includes("triceps"))
    return { area: "Tríceps.", cue: "Cotovelo colado/fixo. Estenda até o final e retorne devagar." };
  if (n.includes("paralelas") || n.includes("mergulho"))
    return { area: "Tríceps e peito.", cue: "Desça controlando. Tronco levemente inclinado. Suba sem balançar." };

  // pernas
  if (n.includes("agacha"))
    return { area: "Quadríceps, glúteos e core.", cue: "Joelho acompanha ponta do pé. Tronco firme. Desça controlando e suba forte." };
  if (n.includes("leg press"))
    return { area: "Quadríceps e glúteos.", cue: "Amplitude segura. Não trave joelho. Controle na descida." };
  if (n.includes("terra") || n.includes("romeno"))
    return { area: "Posterior de coxa e glúteos.", cue: "Quadril para trás. Coluna neutra. Sinta alongar e suba mantendo a postura." };
  if (n.includes("extensora"))
    return { area: "Quadríceps (isolamento).", cue: "Segure 1s em cima. Volte lento sem bater o peso." };
  if (n.includes("flexora"))
    return { area: "Posterior de coxa (isolamento).", cue: "Controle total. Segure 1s contraindo sem roubar com quadril." };
  if (n.includes("panturrilha"))
    return { area: "Panturrilha.", cue: "Pausa em cima e embaixo. Sem quicar. Amplitude completa." };
  if (n.includes("afundo") || n.includes("passada"))
    return { area: "Glúteos e quadríceps.", cue: "Passo firme. Tronco estável. Desça controlando e suba sem tombar." };
  if (n.includes("abdu"))
    return { area: "Glúteo médio.", cue: "Movimento controlado, sem girar o tronco. Sinta o lado do glúteo." };
  if (n.includes("hip thrust"))
    return { area: "Glúteos.", cue: "Queixo levemente para baixo. Suba contraindo glúteo e segure 1s no topo." };

  // core
  if (n.includes("prancha"))
    return { area: "Core e estabilização.", cue: "Glúteo contraído, barriga firme. Não deixe quadril cair." };
  if (n.includes("abdominal"))
    return { area: "Core.", cue: "Exale subindo. Sem puxar pescoço. Controle a descida." };

  // (removemos aquecimento do detalhe; se aparecer por algum motivo, cai aqui)
  if (n.includes("aquecimento"))
    return { area: "Preparação geral.", cue: "Aqueça leve por 5–8 min. O objetivo é preparar, não cansar." };

  return { area: "Músculos relacionados ao movimento.", cue: "Postura firme, controle na descida e execução limpa sem roubar." };
}

function suggestLoadRange(exName, pesoKg, objetivo) {
  const kg = Number(pesoKg || 0) || 70;
  const n = String(exName || "").toLowerCase();
  let base = 0.35;

  if (n.includes("supino")) base = 0.55;
  if (n.includes("agacha")) base = 0.7;
  if (n.includes("leg press")) base = 0.8;
  if (n.includes("remada")) base = 0.5;
  if (n.includes("puxada")) base = 0.45;
  if (n.includes("terra") || n.includes("romeno")) base = 0.75;
  if (n.includes("desenvolvimento")) base = 0.35;
  if (n.includes("elevação lateral") || n.includes("elevacao lateral")) base = 0.12;
  if (n.includes("rosca")) base = 0.2;
  if (n.includes("tríceps") || n.includes("triceps")) base = 0.22;
  if (n.includes("panturrilha")) base = 0.35;

  const isForca = String(objetivo || "").toLowerCase().includes("forc");
  const isHip = String(objetivo || "").toLowerCase().includes("hip");
  const mult = isForca ? 1.12 : isHip ? 1.0 : 0.92;

  const mid = kg * base * mult;
  const low = Math.max(2, Math.round(mid * 0.85));
  const high = Math.max(low + 1, Math.round(mid * 1.05));
  return `${low}–${high}kg`;
}

/* ----------------- Page (consistente com Treino) ----------------- */
export default function TreinoDetalhe() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  // ✅ MESMA origem do Treino:
  const plan = useMemo(() => buildCustomPlan(email), [email]);
  const fallback = useMemo(() => buildFallbackSplit(), []);
  const base = plan?.base || fallback.base;
  const split = plan?.split || fallback.split;

  // dia real do ciclo
  const dayIndex = useMemo(() => calcDayIndex(email), [email]);

  // ✅ dia exibido: vem do ?d= (o mesmo que a aba Treino manda)
  const dParam = Number(sp.get("d"));
  const viewIdx = Number.isFinite(dParam) ? dParam : dayIndex;
  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);

  // ✅ lista do dia (filtra aquecimento no detalhe)
  const workoutRaw = useMemo(() => split[viewSafe] || [], [split, viewSafe]);
  const workout = useMemo(
    () => workoutRaw.filter((ex) => !String(ex?.name || "").toLowerCase().includes("aquecimento")),
    [workoutRaw]
  );

  const exCount = workout.length;

  // ✅ cargas: MESMA key do Treino
  const [loads, setLoads] = useState(() => loadLoads(email));
  function setLoad(exName, v) {
    const k = keyForLoad(viewSafe, exName);
    const next = { ...loads, [k]: v };
    setLoads(next);
    saveLoads(email, next);
  }

  // próximos dias (preview) baseado no viewSafe
  const upcoming = useMemo(() => {
    const arr = [];
    for (let k = 1; k <= 3; k++) {
      const idx = (viewSafe + k) % split.length;
      arr.push({ idx, title: `Treino ${dayLetter(idx)}`, count: (split[idx] || []).length });
    }
    return arr;
  }, [viewSafe, split]);

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Treino detalhado bloqueado</div>
          <div style={S.lockText}>Assine para liberar o detalhamento + cargas e execução.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")}>
            Ver planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* header */}
      <div style={S.head}>
        <button style={S.back} onClick={() => nav("/treino")} aria-label="Voltar">
          ←
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.hKicker}>Treino detalhado</div>
          <div style={S.hTitle}>
            Exercícios do Treino {dayLetter(viewSafe)}
            <span style={{ color: ORANGE }}>.</span>
          </div>

          <div style={S.hSub}>
            <span style={S.chip}>
              Método: <b>{base.style}</b>
            </span>
            <span style={S.chipSoft}>
              Volume: <b>{exCount} exercícios</b>
            </span>
          </div>

          <div style={S.hMeta}>
            Séries/Reps/Descanso:{" "}
            <b>
              {workout[0]?.sets || base.sets} • {workout[0]?.reps || base.reps} • {workout[0]?.rest || base.rest}
            </b>
          </div>
        </div>
      </div>

      {/* próximos dias */}
      <div style={S.nextCard}>
        <div style={S.nextTop}>
          <div style={S.nextTitle}>Próximos dias</div>
          <div style={S.nextNote}>Prévia do seu ciclo (mesma lógica da aba Treino).</div>
        </div>

        <div style={S.nextRow}>
          {upcoming.map((d, i) => (
            <div key={i} style={S.nextItem}>
              <div style={S.nextDay}>Dia +{i + 1}</div>
              <div style={S.nextName}>{d.title}</div>
              <div style={S.nextMini}>{d.count} exercícios</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.section}>Exercícios do dia</div>

      <div style={S.list}>
        {workout.map((ex, i) => {
          const det = detailFor(ex.name);
          const suggested = suggestLoadRange(ex.name, user?.peso, user?.objetivo);

          const k = keyForLoad(viewSafe, ex.name);
          const myLoad = loads[k] ?? "";

          return (
            <div key={i} style={S.card}>
              <div style={S.topRow}>
                <div style={S.num}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={S.name}>{ex.name}</div>
                  <div style={S.group}>
                    {ex.group} • {ex.sets} séries • {ex.reps} • descanso {ex.rest}
                  </div>
                </div>
              </div>

              <div style={S.box}>
                <div style={S.boxTitle}>Área trabalhada</div>
                <div style={S.boxText}>{det.area}</div>
              </div>

              <div style={S.box2}>
                <div style={S.boxTitle}>Execução</div>
                <div style={S.boxText}>{det.cue}</div>
              </div>

              <div style={S.loadRow}>
                <div style={{ minWidth: 0 }}>
                  <div style={S.loadLabel}>Carga sugerida</div>
                  <div style={S.loadVal}>{suggested}</div>
                </div>

                <div style={{ width: 170 }}>
                  <div style={S.loadLabel}>Sua carga</div>
                  <input
                    value={myLoad}
                    onChange={(e) => setLoad(ex.name, e.target.value)}
                    placeholder="ex: 40kg"
                    style={S.input}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ BOTÃO FINAL: CARDIO (grande, laranja, “balão” apple) */}
      <button style={S.cardioGo} onClick={() => nav("/cardio")}>
        <div style={S.cardioGoRow}>
          <div style={{ minWidth: 0 }}>
            <div style={S.cardioTop}>Hora do cardio</div>
            <div style={S.cardioSub}>Ir para Cardio • finalizar com gás</div>
          </div>

          <div style={S.cardioIcon}>
            <ArrowIcon />
          </div>
        </div>

        <div style={S.cardioBubbles}>
          <span style={S.bubble}>Pós-treino</span>
          <span style={S.bubbleSoft}>Rápido e eficiente</span>
          <span style={S.bubbleSoft}>Toque pra abrir</span>
        </div>

        <div style={S.progressTrack}>
          <div style={S.progressFill} />
        </div>
      </button>

      <div style={{ height: 140 }} />
    </div>
  );
}

/* ---------- icon ---------- */
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------- styles ----------------- */
const S = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  head: {
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.86))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 16px 55px rgba(15,23,42,.08)",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.10)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
  },
  hKicker: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.6, textTransform: "uppercase" },
  hTitle: { marginTop: 4, fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.5 },
  hSub: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    fontSize: 12,
    fontWeight: 850,
    color: TEXT,
  },
  chipSoft: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.05)",
    border: "1px solid rgba(15,23,42,.08)",
    fontSize: 12,
    fontWeight: 850,
    color: TEXT,
  },
  hMeta: { marginTop: 10, fontSize: 12, color: MUTED, fontWeight: 800, lineHeight: 1.35 },

  nextCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  nextTop: { display: "grid", gap: 4 },
  nextTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  nextNote: { fontSize: 12, fontWeight: 800, color: MUTED },

  nextRow: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  nextItem: {
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.02))",
    border: "1px solid rgba(255,106,0,.14)",
  },
  nextDay: { fontSize: 11, fontWeight: 950, color: MUTED, textTransform: "uppercase" },
  nextName: { marginTop: 6, fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  nextMini: { marginTop: 10, fontSize: 11, fontWeight: 900, color: ORANGE },

  section: { marginTop: 14, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },

  list: { marginTop: 12, display: "grid", gap: 14 },
  card: {
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  topRow: { display: "flex", gap: 12, alignItems: "center" },
  num: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    flexShrink: 0,
    boxShadow: "0 12px 28px rgba(255,106,0,.22)",
  },
  name: { fontSize: 17, fontWeight: 950, color: TEXT, letterSpacing: -0.35 },
  group: { marginTop: 2, fontSize: 12, fontWeight: 900, color: MUTED },

  box: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
  },
  box2: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  boxTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.95 },
  boxText: { marginTop: 6, fontSize: 13, fontWeight: 800, color: "#334155", lineHeight: 1.5 },

  loadRow: { marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end" },
  loadLabel: { fontSize: 12, fontWeight: 900, color: MUTED },
  loadVal: { marginTop: 4, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "#fff",
  },

  // ---- CTA CARDIO apple-style ----
  cardioGo: {
    marginTop: 14,
    width: "100%",
    borderRadius: 26,
    padding: 18,
    border: "none",
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.20), rgba(255,255,255,.95))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: "1px solid rgba(15,23,42,.06)",
    transition: "transform .12s ease",
    animation: "softFloatCardio 3.6s ease-in-out infinite",
  },
  cardioGoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  cardioTop: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  cardioSub: { marginTop: 6, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  cardioIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 14px 34px rgba(255,106,0,.22)",
    flexShrink: 0,
  },
  cardioBubbles: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
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
  // preenchimento “fake” só pra dar estética de CTA (não depende de progresso)
  progressFill: {
    height: "100%",
    width: "78%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
  },

  lockCard: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,106,0,.08))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 50px rgba(15,23,42,.10)",
  },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 6, fontSize: 13, color: MUTED, fontWeight: 800, lineHeight: 1.4 },
  lockBtn: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(255,106,0,.22)",
  },
};

// animação CSS inline (Apple float suave)
if (typeof document !== "undefined") {
  const id = "fitdeal-treino-detalhe-cardio-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes softFloatCardio {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }
    `;
    document.head.appendChild(style);
  }
}
