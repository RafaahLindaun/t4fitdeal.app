import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/* ---------------- THEME ---------------- */
const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const INK = "rgba(15,23,42,.86)";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";

/* ---------------- helpers ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function mod(n, m) {
  if (!m) return 0;
  return ((n % m) + m) % m;
}
function stripAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function normalizeName(s) {
  return stripAccents(String(s || ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}
function slugifyExercise(name) {
  const base = stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");
  return base || "exercicio";
}
function gifCandidates(name) {
  const slug = slugifyExercise(name);
  return [`/gifs/${slug}.GIF`, `/gifs/${slug}.gif`];
}
function parseRestToSeconds(restText) {
  const raw = String(restText || "").toLowerCase().trim();
  if (!raw) return 90;

  const minMatch = raw.match(/(\d+)\s*min/);
  if (minMatch) return clamp(Number(minMatch[1]) * 60, 15, 600);

  const sMatch = raw.match(/(\d+)\s*s/);
  if (sMatch) return clamp(Number(sMatch[1]), 10, 600);

  const range = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return clamp(Number(range[1]), 10, 600);

  const n = raw.match(/(\d+)/);
  if (n) return clamp(Number(n[1]), 10, 600);

  return 90;
}
function fmtMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function keyForLoad(planDayKey, exName) {
  return `${String(planDayKey)}__${String(exName || "").toLowerCase()}`;
}
function keyForSetProg(planDayKey, exName) {
  return `${String(planDayKey)}__${String(exName || "").toLowerCase()}`;
}

/* -------- parse do formato salvo pelo TreinoPersonalize -------- */
function parsePackedExerciseMeta(rawReps, rawMethod, rawNotes) {
  const text = String(rawReps || "").trim();

  let sets = null;
  let reps = null;
  let rest = null;

  const setsMatch = text.match(/(\d+)\s*s[ée]ries?/i);
  if (setsMatch) sets = Number(setsMatch[1]);

  const restMatch = text.match(/descanso\s*([0-9]+(?:\s*[-–]\s*[0-9]+)?\s*(?:s|min))/i);
  if (restMatch) rest = restMatch[1].replace(/\s+/g, " ").trim();

  const parts = text.split("•").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const repCandidate = parts.find(
      (p) =>
        !/s[ée]ries?/i.test(p) &&
        !/descanso/i.test(p)
    );
    if (repCandidate) reps = repCandidate;
  }

  if (!reps) {
    const rangeMatch = text.match(/(\d+\s*[-–]\s*\d+|\d+\s*(?:a|até)\s*\d+)/i);
    if (rangeMatch) reps = rangeMatch[1].replace(/\s+/g, " ").trim();
  }

  return {
    sets: Number(sets || 4),
    reps: reps || "6–12",
    rest: rest || "75–120s",
    method: String(rawMethod || rawNotes || "Personalizado"),
  };
}

/* ---------------- fallback database helpers ---------------- */
const EXERCISE_CATALOG = {
  peito: ["Supino reto com barra", "Supino inclinado com halteres", "Crucifixo inclinado com halteres", "Peck-deck", "Crossover na polia (alto)", "Flexão de braço tradicional"],
  triceps: ["Tríceps corda", "Tríceps barra reta", "Tríceps francês (halter)", "Tríceps testa (barra W)", "Mergulho nas paralelas (assistido)"],
  costas: ["Puxada frente (puxador)", "Barra fixa pronada", "Remada baixa no cabo", "Remada unilateral com halter", "Face pull"],
  biceps: ["Rosca direta (barra)", "Rosca alternada (halter)", "Rosca martelo (halter)", "Rosca Scott (máquina)"],
  quadriceps: ["Agachamento livre", "Leg press 45°", "Hack squat", "Cadeira extensora", "Afundo com halteres"],
  posterior: ["Terra romeno (barra)", "Mesa flexora", "Cadeira flexora", "Hiperextensão"],
  gluteo: ["Hip thrust (barra)", "Abdução na máquina", "Kickback no cabo", "Glute bridge"],
  panturrilha: ["Panturrilha em pé na máquina", "Panturrilha sentado", "Panturrilha no leg press"],
  ombro: ["Desenvolvimento com halteres", "Elevação lateral", "Reverse fly (posterior)", "Arnold press"],
  core: ["Prancha", "Dead bug", "Crunch", "Pallof press"],
};

const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    library: [
      ...EXERCISE_CATALOG.peito.map((name) => ({ name, group: "Peito" })),
      ...EXERCISE_CATALOG.triceps.map((name) => ({ name, group: "Tríceps" })),
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    library: [
      ...EXERCISE_CATALOG.costas.map((name) => ({ name, group: "Costas" })),
      ...EXERCISE_CATALOG.biceps.map((name) => ({ name, group: "Bíceps" })),
    ],
  },
  {
    id: "pernas",
    name: "Pernas",
    library: [
      ...EXERCISE_CATALOG.quadriceps.map((name) => ({ name, group: "Quadríceps" })),
      ...EXERCISE_CATALOG.posterior.map((name) => ({ name, group: "Posterior" })),
      ...EXERCISE_CATALOG.gluteo.map((name) => ({ name, group: "Glúteos" })),
      ...EXERCISE_CATALOG.panturrilha.map((name) => ({ name, group: "Panturrilha" })),
      ...EXERCISE_CATALOG.core.map((name) => ({ name, group: "Core" })),
    ],
  },
  {
    id: "ombro_core",
    name: "Ombro + Core",
    library: [
      ...EXERCISE_CATALOG.ombro.map((name) => ({ name, group: "Ombros" })),
      ...EXERCISE_CATALOG.core.map((name) => ({ name, group: "Core" })),
    ],
  },
];

function groupById(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || MUSCLE_GROUPS[0];
}

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
  while (base.length < minCount && i < extras.length) base.push(extras[i++]);
  return base;
}

function buildFallbackSplit() {
  const A = [
    { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
    { name: "Supino inclinado", group: "Peito", sets: 4, reps: "6–12", rest: "75–120s", method: "Básico" },
    { name: "Tríceps corda", group: "Tríceps", sets: 4, reps: "8–12", rest: "60–90s", method: "Básico" },
    { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "10–15", rest: "60–90s", method: "Básico" },
  ];
  const B = [
    { name: "Puxada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
    { name: "Remada", group: "Costas", sets: 4, reps: "8–12", rest: "75–120s", method: "Básico" },
    { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "8–12", rest: "60–90s", method: "Básico" },
    { name: "Face pull", group: "Ombro/escápulas", sets: 3, reps: "12–15", rest: "45–75s", method: "Básico" },
  ];
  const C = [
    { name: "Agachamento", group: "Pernas", sets: 4, reps: "6–12", rest: "90–150s", method: "Básico" },
    { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "75–120s", method: "Básico" },
    { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–12", rest: "90–150s", method: "Básico" },
    { name: "Panturrilha", group: "Panturrilha", sets: 4, reps: "10–15", rest: "45–75s", method: "Básico" },
  ];
  return { base: { style: "Padrão", sets: 4, reps: "6–12", rest: "75–120s" }, split: [A, B, C] };
}

/* ---------------- details by name ---------------- */
function detailFor(exName) {
  const n = String(exName || "").toLowerCase();
  if (n.includes("supino")) return { area: "Peitoral, tríceps e deltoide anterior.", cue: "Escápulas firmes. Pés no chão. Desça controlando e suba forte sem perder postura." };
  if (n.includes("crucifixo") || n.includes("peck") || n.includes("crossover")) return { area: "Peitoral (isolamento).", cue: "Abra até alongar com segurança. Feche apertando o peito. Controle total na volta." };
  if (n.includes("puxada") || n.includes("pulldown")) return { area: "Dorsal e bíceps.", cue: "Peito alto. Cotovelos descem para o lado do corpo. Evite puxar com pescoço." };
  if (n.includes("remada")) return { area: "Costas médias/dorsal e estabilização.", cue: "Coluna firme. Puxe com cotovelos. Segure 1s no final. Volte controlando." };
  if (n.includes("face pull")) return { area: "Posterior de ombro + escápulas.", cue: "Puxe para o rosto abrindo cotovelos. Ombros baixos. Sem jogar o tronco." };
  if (n.includes("rosca")) return { area: "Bíceps e antebraço.", cue: "Cotovelo fixo. Sem roubar com tronco. Suba e desça com controle." };
  if (n.includes("tríceps") || n.includes("triceps")) return { area: "Tríceps.", cue: "Cotovelo firme e alinhado. Estenda até o final. Retorne devagar." };
  if (n.includes("agacha")) return { area: "Quadríceps, glúteos e core.", cue: "Joelho acompanha o pé. Tronco firme. Desça controlando e suba forte." };
  if (n.includes("leg press")) return { area: "Quadríceps e glúteos.", cue: "Amplitude segura. Não trave joelho. Controle na descida." };
  if (n.includes("terra") || n.includes("romeno")) return { area: "Posterior e glúteos.", cue: "Quadril para trás. Coluna neutra. Alongue com controle e suba mantendo postura." };
  if (n.includes("panturrilha")) return { area: "Panturrilha.", cue: "Pausa em cima e embaixo. Sem quicar. Amplitude completa." };
  if (n.includes("prancha")) return { area: "Core e estabilização.", cue: "Glúteo contraído. Barriga firme. Não deixe quadril cair." };
  if (n.includes("abdominal")) return { area: "Core.", cue: "Exale subindo. Sem puxar pescoço. Controle a descida." };
  return { area: "Músculos relacionados ao movimento.", cue: "Postura firme. Controle na descida. Execução limpa sem roubar." };
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
  const goal = String(objetivo || "").toLowerCase();
  const isForca = goal.includes("forc");
  const isHip = goal.includes("hip");
  const mult = isForca ? 1.12 : isHip ? 1.0 : 0.92;
  const mid = kg * base * mult;
  const low = Math.max(2, Math.round(mid * 0.85));
  const high = Math.max(low + 1, Math.round(mid * 1.05));
  return `${low}–${high}kg`;
}

/* ---------------- icons ---------------- */
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6v12" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 6v12" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7l10 5-10 5V7Z" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v6h-6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7.2v5.2l3.2 1.7" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20.2a8.2 8.2 0 1 1 8.2-8.2" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- UI bits ---------------- */
function ExerciseGif({ name, style }) {
  const [idx, setIdx] = useState(0);
  const sources = useMemo(() => gifCandidates(name), [name]);
  const src = sources[idx] || sources[0];

  return (
    <img
      src={src}
      alt={`${name} (gif)`}
      style={style || S.gif}
      onError={(e) => {
        if (idx < sources.length - 1) {
          setIdx((p) => p + 1);
          return;
        }
        e.currentTarget.style.display = "none";
        const parent = e.currentTarget.parentElement;
        if (parent) parent.setAttribute("data-gif-missing", "1");
      }}
    />
  );
}

function Chip({ label, value }) {
  return (
    <div style={S.chip}>
      <div style={S.chipLabel}>{label}</div>
      <div style={S.chipValue}>{value}</div>
      <div style={S.chipSheen} aria-hidden="true" />
    </div>
  );
}

function SetDots({ total, done, onToggle }) {
  const n = clamp(Number(total || 0) || 0, 1, 12);
  const d = clamp(Number(done || 0) || 0, 0, n);
  return (
    <div style={S.dotsBox}>
      <div style={S.dotsTitle}>Séries feitas</div>
      <div style={S.dotsRowInner}>
        {Array.from({ length: n }).map((_, i) => {
          const filled = i < d;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              style={{ ...S.dotBtn, ...(filled ? S.dotBtnOn : S.dotBtnOff) }}
              className="td-press"
              aria-label={`Marcar série ${i + 1} de ${n}`}
            />
          );
        })}
      </div>
      <div style={S.dotsMini}>{d}/{n}</div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function TreinoDetalhe() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { user } = useAuth();

  const userId = user?.id || null;

  const [paid, setPaid] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [planDays, setPlanDays] = useState([]);
  const [runtime, setRuntime] = useState({
    current_day_index: 0,
    timer_open: false,
    swipe_hint_seen: false,
  });
  const [loads, setLoads] = useState({});
  const [setsProg, setSetsProg] = useState({});
  const [bootLoading, setBootLoading] = useState(true);

  const [gifOpen, setGifOpen] = useState(false);
  const [gifName, setGifName] = useState("");
  const gifPressTimer = useRef(null);
  const gifDidLongPress = useRef(false);

  const [timerOpen, setTimerOpen] = useState(false);
  const [restTotal, setRestTotal] = useState(90);
  const [restLeft, setRestLeft] = useState(90);
  const [running, setRunning] = useState(false);

  const [doneFlash, setDoneFlash] = useState(false);
  const [doneFlashKey, setDoneFlashKey] = useState("");

  const scrollerRef = useRef(null);
  const dragStartY = useRef(null);
  const dragMoved = useRef(false);

  function openGifFull(name) {
    setGifName(name);
    setGifOpen(true);
  }
  function closeGifFull() {
    setGifOpen(false);
  }
  function startGifPress(name) {
    gifDidLongPress.current = false;
    if (gifPressTimer.current) window.clearTimeout(gifPressTimer.current);
    gifPressTimer.current = window.setTimeout(() => {
      gifDidLongPress.current = true;
      openGifFull(name);
    }, 360);
  }
  function endGifPress() {
    if (gifPressTimer.current) window.clearTimeout(gifPressTimer.current);
    gifPressTimer.current = null;
  }
  function onGifClick(name, e) {
    if (gifDidLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      gifDidLongPress.current = false;
      return;
    }
    openGifFull(name);
  }
  function triggerDoneFlash(key) {
    setDoneFlashKey(key);
    setDoneFlash(true);
    window.setTimeout(() => {
      setDoneFlash(false);
      setDoneFlashKey("");
    }, 720);
  }

  useEffect(() => {
    if (!gifOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeGifFull();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [gifOpen]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!userId) {
        setBootLoading(false);
        return;
      }

      try {
        const [subRes, runtimeRes, planRes] = await Promise.all([
          supabase
            .from("user_subscriptions")
            .select("plan_key, status")
            .eq("user_id", userId)
            .in("status", ["active", "trialing"])
            .maybeSingle(),
          supabase
            .from("workout_runtime")
            .select("current_day_index, timer_open, swipe_hint_seen")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
  .from("workout_plan_exercises")
  .select("plan_day_id, exercise_order, name, group_name, reps, notes")
  .in("plan_day_id", days.map((d) => d.id))
  .order("exercise_order", { ascending: true }),
          supabase
            .from("workout_plans")
            .select("id, title, split_label, split_len, source, created_at, updated_at")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        if (!active) return;

        const hasWorkoutAccess =
          ["active", "trialing"].includes(String(subRes.data?.status || "").toLowerCase()) &&
          ["basico", "nutri"].includes(String(subRes.data?.plan_key || "").toLowerCase());

        setPaid(!!hasWorkoutAccess);

        if (runtimeRes.data) {
          setRuntime({
            current_day_index: runtimeRes.data.current_day_index ?? 0,
            timer_open: !!runtimeRes.data.timer_open,
            swipe_hint_seen: !!runtimeRes.data.swipe_hint_seen,
          });
          setTimerOpen(!!runtimeRes.data.timer_open);
        } else {
          setTimerOpen(false);
        }

        const activePlan = Array.isArray(planRes.data) ? planRes.data[0] : null;

        if (activePlan?.id) {
          const [daysRes, exRes, loadRes, progRes] = await Promise.all([
            supabase
              .from("workout_plan_days")
              .select("id, day_index, day_key, title, group_id, group_name")
              .eq("plan_id", activePlan.id)
              .order("day_index", { ascending: true }),
            supabase
              .from("workout_plan_exercises")
              .select("plan_day_id, exercise_order, name, group_name, reps, notes, method, sets, rest")
              .eq("plan_id", activePlan.id)
              .order("exercise_order", { ascending: true }),
            supabase
              .from("workout_exercise_loads")
              .select("day_index, exercise_name, load_value")
              .eq("user_id", userId),
            supabase
              .from("workout_set_progress")
              .select("day_index, exercise_name, done_sets")
              .eq("user_id", userId),
          ]);

          const days = daysRes.data || [];
          const exercises = exRes.data || [];
          setPlanDays(days);

          const split = days.map((day) => {
            const savedForDay = exercises
              .filter((ex) => ex.plan_day_id === day.id)
              .sort((a, b) => Number(a.exercise_order || 0) - Number(b.exercise_order || 0))
              .map((ex) => {
                const unpacked = parsePackedExerciseMeta(
                  ex.reps,
                  ex.method,
                  ex.notes
                );

                return {
                  name: ex.name,
                  group: ex.group_name || day.group_name || "Exercício",
                  sets: Number(ex.sets || unpacked.sets || 4),
                  reps:
                    ex.sets && ex.reps && !String(ex.reps).includes("séries")
                      ? ex.reps
                      : unpacked.reps,
                  rest: ex.rest || unpacked.rest || "75–120s",
                  method:
                    ex.method ||
                    unpacked.method ||
                    activePlan.split_label ||
                    "Personalizado",
                };
              });

            if (savedForDay.length > 0) {
              return savedForDay;
            }

            const groupFallback = (groupById(day.group_id)?.library || []).map((ex) => ({
              name: ex.name,
              group: ex.group || day.group_name || "Exercício",
              sets: 4,
              reps: "6–12",
              rest: "75–120s",
              method: activePlan.split_label || "Personalizado",
            }));

            const fullbodyFallback = (groupById("fullbody")?.library || []).map((ex) => ({
              name: ex.name,
              group: ex.group || day.group_name || "Exercício",
              sets: 4,
              reps: "6–12",
              rest: "75–120s",
              method: activePlan.split_label || "Personalizado",
            }));

            const preferredFallback = groupFallback.length > 0 ? groupFallback : fullbodyFallback;
            return ensureVolume(preferredFallback.slice(0, 9), 7);
          });

          setPlanData({
            base: {
              style: activePlan.split_label || "Personalizado",
              sets: 4,
              reps: "6–12",
              rest: "75–120s",
            },
            split,
          });

          const loadMap = {};
          for (const row of loadRes.data || []) {
            const matchedDay = days.find((d) => Number(d.day_index) === Number(row.day_index));
            const storageKey = keyForLoad(matchedDay?.id || row.day_index, row.exercise_name);
            loadMap[storageKey] = row.load_value || "";
          }
          setLoads(loadMap);

          const progMap = {};
          for (const row of progRes.data || []) {
            const matchedDay = days.find((d) => Number(d.day_index) === Number(row.day_index));
            const storageKey = keyForSetProg(matchedDay?.id || row.day_index, row.exercise_name);
            progMap[storageKey] = Number(row.done_sets || 0);
          }
          setSetsProg(progMap);
        }
      } catch (err) {
        console.error("TreinoDetalhe bootstrap error:", err);
      } finally {
        if (active) setBootLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [userId]);

  const fallback = useMemo(() => buildFallbackSplit(), []);
  const base = planData?.base || fallback.base;
  const split = planData?.split || fallback.split;

  const dParam = Number(sp.get("d"));
  const runtimeDayIndex = runtime.current_day_index || 0;
  const viewIdx = Number.isFinite(dParam) ? dParam : runtimeDayIndex;
  const viewSafe = useMemo(() => mod(viewIdx, split.length), [viewIdx, split.length]);
  const currentPlanDay = useMemo(() => planDays?.[viewSafe] || null, [planDays, viewSafe]);
  const currentDayStorageKey = currentPlanDay?.id || currentPlanDay?.day_index || viewSafe;

  const workoutRaw = useMemo(() => split[viewSafe] || [], [split, viewSafe]);
  const workout = useMemo(
    () => workoutRaw.filter((ex) => !String(ex?.name || "").toLowerCase().includes("aquecimento")),
    [workoutRaw]
  );

  const pages = useMemo(() => {
    const exPages = workout.map((ex, i) => ({
      type: "exercise",
      key: `${i}_${ex.name}`,
      ex,
      index: i,
    }));
    return [...exPages, { type: "cardio", key: "end_cardio" }];
  }, [workout]);

  const [page, setPage] = useState(0);
  const showHint = !runtime.swipe_hint_seen;

  useEffect(() => {
    const p = pages[page];
    if (!p || p.type !== "exercise") {
      setRunning(false);
      setRestTotal(90);
      setRestLeft(90);
      return;
    }
    const ex = p.ex;
    const rest = ex?.rest ?? base.rest ?? "90s";
    const sec = parseRestToSeconds(rest);
    setRunning(false);
    setRestTotal(sec);
    setRestLeft(sec);
  }, [page, pages, base.rest]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRestLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (restLeft === 0 && running) setRunning(false);
  }, [restLeft, running]);

  async function upsertRuntime(updates) {
    if (!userId) return;
    const next = {
      user_id: userId,
      current_day_index: updates.current_day_index ?? runtime.current_day_index ?? 0,
      timer_open: updates.timer_open ?? runtime.timer_open ?? false,
      swipe_hint_seen: updates.swipe_hint_seen ?? runtime.swipe_hint_seen ?? false,
      updated_at: new Date().toISOString(),
    };

    setRuntime({
      current_day_index: next.current_day_index,
      timer_open: next.timer_open,
      swipe_hint_seen: next.swipe_hint_seen,
    });

    const { error } = await supabase
      .from("workout_runtime")
      .upsert(next, { onConflict: "user_id" });

    if (error) console.error("upsertRuntime error:", error);
  }

  function startTimer() {
    if (restLeft <= 0) setRestLeft(restTotal);
    setRunning(true);
  }
  function pauseTimer() {
    setRunning(false);
  }
  function resetTimer() {
    setRunning(false);
    setRestLeft(restTotal);
  }

  async function setTimerOpenPersist(v) {
    setTimerOpen(v);
    await upsertRuntime({ timer_open: v });
  }

  async function markHintSeen() {
    if (runtime.swipe_hint_seen) return;
    await upsertRuntime({ swipe_hint_seen: true });
  }

  function softPingTimer() {
    if (timerOpen) return;
    setTimerOpen(true);
    window.setTimeout(() => setTimerOpen(false), 1200);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / w);
      const safe = clamp(idx, 0, pages.length - 1);
      setPage(safe);

      if (showHint && Math.abs(el.scrollLeft) > 20) {
        markHintSeen();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pages.length, showHint, runtime.swipe_hint_seen]);

  function goTo(i) {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    el.scrollTo({ left: w * i, behavior: "smooth" });
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "treino-detalhe-book-ui-v4";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes tdSheen {
        0%, 35%   { transform: translateX(-70%); opacity: .18; }
        55%, 100% { transform: translateX(140%); opacity: .18; }
      }
      @keyframes tdPop {
        0%,100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      @keyframes tdDoneBurst {
        0% { opacity: 0; transform: scale(.72); }
        18% { opacity: 1; transform: scale(1.04); }
        72% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.1); }
      }
      @keyframes tdDoneBg {
        0% { opacity: 0; }
        18% { opacity: 1; }
        100% { opacity: 0; }
      }
      .td-press { transition: transform .12s ease, filter .12s ease; }
      .td-press:active { transform: translateY(1px) scale(.99); filter: brightness(.985); }
      input:focus {
        border-color: rgba(255,106,0,.38) !important;
        box-shadow: 0 0 0 4px rgba(255,106,0,.10), inset 0 1px 0 rgba(255,255,255,.7) !important;
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  async function setLoad(exName, v) {
    const k = keyForLoad(currentDayStorageKey, exName);
    const next = { ...loads, [k]: v };
    setLoads(next);

    if (!userId) return;

    const persistedDayIndex =
      Number.isFinite(Number(currentPlanDay?.day_index))
        ? Number(currentPlanDay.day_index)
        : Number(viewSafe);

    const { error } = await supabase.from("workout_exercise_loads").upsert(
      {
        user_id: userId,
        day_index: persistedDayIndex,
        exercise_name: exName,
        load_value: v,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day_index,exercise_name" }
    );

    if (error) console.error("setLoad error:", error);
  }

  function getDone(exName, setsTotal) {
    const key = keyForSetProg(currentDayStorageKey, exName);
    const val = setsProg[key];
    const n = clamp(Number(setsTotal || 0) || 0, 1, 12);
    return clamp(Number(val || 0) || 0, 0, n);
  }

  async function setDone(exName, nextDone) {
    const key = keyForSetProg(currentDayStorageKey, exName);
    const next = { ...setsProg, [key]: nextDone };
    setSetsProg(next);

    if (!userId) return;

    const persistedDayIndex =
      Number.isFinite(Number(currentPlanDay?.day_index))
        ? Number(currentPlanDay.day_index)
        : Number(viewSafe);

    const { error } = await supabase.from("workout_set_progress").upsert(
      {
        user_id: userId,
        day_index: persistedDayIndex,
        exercise_name: exName,
        done_sets: nextDone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day_index,exercise_name" }
    );

    if (error) console.error("setDone error:", error);
  }

  function onDockPointerDown(e) {
    dragStartY.current = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
    dragMoved.current = false;
  }
  function onDockPointerMove(e) {
    if (dragStartY.current == null) return;
    const y = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
    if (y == null) return;

    const dy = y - dragStartY.current;
    if (Math.abs(dy) > 10) dragMoved.current = true;

    if (dy < -26) {
      dragStartY.current = null;
      setTimerOpenPersist(true);
    }
    if (dy > 26) {
      dragStartY.current = null;
      setTimerOpenPersist(false);
    }
  }
  function onDockPointerUp() {
    dragStartY.current = null;
  }
  function onDockClick() {
    if (dragMoved.current) return;
    setTimerOpenPersist(!timerOpen);
  }

  if (bootLoading) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>fitdeal<span style={{ color: ORANGE }}>.</span></div>
          <div style={S.lockText}>Carregando treino...</div>
        </div>
      </div>
    );
  }

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Treino em modo “livro”</div>
          <div style={S.lockText}>Assine para liberar páginas, GIFs, marcação de séries e cronômetro opcional.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")} type="button" className="td-press">
            Ver planos
          </button>
          <button style={S.lockGhost} onClick={() => nav("/treino")} type="button" className="td-press">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const pNow = pages[page];
  const isExercise = pNow?.type === "exercise";
  const exNow = isExercise ? pNow.ex : null;

  const exCount = workout.length;
  const totalPages = pages.length;
  const progressText = `${page + 1}/${totalPages}`;

  return (
    <div style={S.page}>
      {gifOpen ? (
        <div style={S.gifOverlay} role="presentation" onClick={closeGifFull}>
          <div style={S.gifSheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={S.gifSheetTop}>
              <div style={S.gifSheetTitle}>{gifName}</div>
              <div style={S.gifSheetSub}>Toque fora para fechar</div>
            </div>

            <div style={S.gifFullWrap}>
              <ExerciseGif name={gifName} style={S.gifFull} />
              <div style={S.gifFallbackFull} aria-hidden="true">
                <div style={S.gifFallbackBadge}>GIF</div>
                <div style={S.gifFallbackText}>Adicione: /public/gifs/{slugifyExercise(gifName)}.gif</div>
              </div>
            </div>

            <button type="button" style={S.gifBackBtn} className="td-press" onClick={closeGifFull}>
              Voltar
            </button>
          </div>
        </div>
      ) : null}

      <div style={S.head}>
        <div style={S.headGlow} aria-hidden="true" />

        <button style={S.back} onClick={() => nav("/treino")} aria-label="Voltar" type="button" className="td-press">
          <IconChevronLeft />
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={S.hKicker}>Treino detalhado</div>
          <div style={S.hTitle}>Treino {dayLetter(viewSafe)}</div>

          <div style={S.hLine}>
            <span style={S.tagStrong}>{base.style}</span>
            <span style={S.tagSoft}>{exCount} exercícios</span>
            <span style={S.tagSoft}>{progressText}</span>
          </div>

          <div style={S.hMeta}>
            {showHint ? "Arraste para o lado (estilo livro)." : "Toque nas bolinhas para marcar séries e iniciar descanso."}
          </div>
        </div>
      </div>

      <div style={S.dotsNav}>
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            style={{ ...S.dotNav, ...(i === page ? S.dotNavOn : S.dotNavOff) }}
            aria-label={`Ir para página ${i + 1}`}
            className="td-press"
          />
        ))}
      </div>

      <div ref={scrollerRef} style={S.pager} aria-label="Treino em páginas">
        {pages.map((p, idx) => {
          if (p.type === "cardio") {
            return (
              <div key={p.key} style={S.pageItem}>
                <div style={S.cardPage}>
                  <div style={S.cardGlow} aria-hidden="true" />

                  <div style={S.endKicker}>Final do treino</div>
                  <div style={S.endTitle}>Bora pro cardio?</div>
                  <div style={S.endSub}>Um cardio leve/moderado (10–20min) fecha bem o dia e ajuda consistência.</div>

                  <button type="button" onClick={() => nav("/cardio")} style={S.endCta} className="td-press">
                    Ir para Cardio
                    <span style={S.endCtaIcon} aria-hidden="true">
                      <IconArrowRight />
                    </span>
                  </button>

                  <button type="button" onClick={() => nav("/treino")} style={S.endGhost} className="td-press">
                    Voltar ao Treino
                  </button>

                  <div style={S.endNote}>Dica: sem tempo? 10 min leve {">"} nada.</div>
                </div>
              </div>
            );
          }

          const ex = p.ex;
          const det = detailFor(ex.name);
          const peso = user?.peso ?? user?.weight ?? 70;
          const objetivo = user?.objetivo ?? user?.goal ?? "";
          const suggested = suggestLoadRange(ex.name, peso, objetivo);

          const k = keyForLoad(currentDayStorageKey, ex.name);
          const myLoad = loads[k] ?? "";

          const sets = ex.sets ?? base.sets;
          const reps = ex.reps ?? base.reps;
          const rest = ex.rest ?? base.rest;

          const done = getDone(ex.name, sets);
          const totalSets = clamp(Number(sets) || 4, 1, 12);

          async function toggleSet(i) {
            let nextDone = 0;
            if (i < done) nextDone = i;
            else nextDone = i + 1;

            await setDone(ex.name, nextDone);

            if (nextDone > done) {
              const sec = parseRestToSeconds(rest);
              setRestTotal(sec);
              setRestLeft(sec);
              setRunning(true);
              softPingTimer();
              triggerDoneFlash(p.key);
            }
          }

          return (
            <div key={p.key} style={S.pageItem}>
              <div style={S.cardPage}>
                {doneFlash && doneFlashKey === p.key ? (
                  <div style={S.doneOverlay} aria-hidden="true">
                    <div style={S.doneGlow} />
                    <div style={S.doneMarkWrap}>
                      <div style={S.doneMark}>✓</div>
                      <div style={S.doneText}>Série feita</div>
                    </div>
                  </div>
                ) : null}

                <div style={S.cardGlow} aria-hidden="true" />
                <div style={S.cardSheen} aria-hidden="true" />

                <div style={S.exerciseTop}>
                  <div style={S.exerciseIndex}>{idx + 1}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={S.exerciseName}>{ex.name}</div>
                    <div style={S.exerciseGroup}>{ex.group}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`exec_${idx}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    style={S.execBtn}
                    className="td-press"
                  >
                    Execução
                  </button>
                </div>

                <div
                  style={S.gifWrap}
                  role="button"
                  aria-label="Ver GIF completo"
                  className="td-press"
                  onMouseDown={() => startGifPress(ex.name)}
                  onMouseUp={endGifPress}
                  onMouseLeave={endGifPress}
                  onTouchStart={() => startGifPress(ex.name)}
                  onTouchEnd={endGifPress}
                  onTouchCancel={endGifPress}
                  onClick={(e) => onGifClick(ex.name, e)}
                >
                  <ExerciseGif name={ex.name} />
                  <div style={S.gifHintBadge} aria-hidden="true">
                    Toque para ver
                  </div>

                  <div style={S.gifFallback} aria-hidden="true">
                    <div style={S.gifFallbackBadge}>GIF</div>
                    <div style={S.gifFallbackText}>Adicione: /public/gifs/{slugifyExercise(ex.name)}.gif</div>
                  </div>
                </div>

                <div style={S.bigChips}>
                  <Chip label="Séries" value={String(sets)} />
                  <Chip label="Repetições" value={String(reps)} />
                  <Chip label="Descanso" value={String(rest)} />
                </div>

                <SetDots total={totalSets} done={done} onToggle={toggleSet} />

                <div style={S.loadBox}>
                  <div style={S.loadLeft}>
                    <div style={S.loadLabel}>Carga sugerida</div>
                    <div style={S.loadVal}>{suggested}</div>
                    <div style={S.loadHint}>Boa = mantém forma e controle.</div>
                  </div>

                  <div style={S.loadRight}>
                    <div style={S.loadLabel}>Sua carga</div>
                    <input
                      value={myLoad}
                      onChange={(e) => setLoad(ex.name, e.target.value)}
                      placeholder="Ex.: 40kg"
                      style={S.input}
                      inputMode="text"
                    />
                  </div>
                </div>

                <div id={`exec_${idx}`} style={S.execPanel}>
                  <div style={S.execTitle}>Execução — o que focar</div>
                  <div style={S.execArea}>
                    <div style={S.execLabel}>Área trabalhada</div>
                    <div style={S.execText}>{det.area}</div>
                  </div>
                  <div style={S.execCue}>
                    <div style={S.execLabel}>Dica prática</div>
                    <div style={S.execText}>{det.cue}</div>
                  </div>
                </div>

                <div style={S.navRow}>
                  <button
                    type="button"
                    onClick={() => goTo(Math.max(0, idx - 1))}
                    style={{ ...S.navBtn, ...(idx === 0 ? S.navBtnDisabled : null) }}
                    className="td-press"
                    disabled={idx === 0}
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(Math.min(pages.length - 1, idx + 1))}
                    style={S.navBtn}
                    className="td-press"
                  >
                    Próximo →
                  </button>
                </div>

                <div style={{ height: 120 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{ ...S.dock, ...(timerOpen ? S.dockOpen : S.dockClosed) }}
        onMouseDown={onDockPointerDown}
        onMouseMove={onDockPointerMove}
        onMouseUp={onDockPointerUp}
        onTouchStart={onDockPointerDown}
        onTouchMove={onDockPointerMove}
        onTouchEnd={onDockPointerUp}
        onClick={onDockClick}
        role="button"
        aria-label="Cronômetro de descanso"
      >
        <div style={S.dockHeader}>
          <div style={S.dockPill}>
            <span style={S.dockIcon} aria-hidden="true">
              <IconClock />
            </span>
            <span style={S.dockTitle}>Cronômetro de descanso</span>
          </div>

          <div style={S.dockMini}>
            <span style={S.dockMiniTime}>{fmtMMSS(restLeft)}</span>
            <span style={S.dockMiniState}>{running ? "rodando" : "parado"}</span>
          </div>
        </div>

        {timerOpen ? (
          <div style={S.dockBody} onClick={(e) => e.stopPropagation()}>
            <div style={S.dockBigTime}>{fmtMMSS(restLeft)}</div>
            <div style={S.dockSub}>
              {isExercise ? (
                <>
                  Exercício atual: <b style={{ color: TEXT }}>{exNow?.name}</b>
                </>
              ) : (
                <>Final — bora pro cardio.</>
              )}
            </div>

            <div style={S.dockBtns}>
              <button type="button" onClick={startTimer} style={S.bigStart} className="td-press" disabled={!isExercise}>
                {running ? "Rodando..." : restLeft === 0 ? "Recomeçar" : "Começar"}
                <span style={S.bigStartIcon} aria-hidden="true">
                  <IconPlay />
                </span>
              </button>

              <button type="button" onClick={pauseTimer} style={S.smallPause} className="td-press" disabled={!running}>
                <IconPause />
                Pausar
              </button>

              <button type="button" onClick={resetTimer} style={S.resetBtn} className="td-press">
                <IconReset />
              </button>
            </div>

            <div style={S.dockHint}>Dica: arraste pra cima pra abrir, pra baixo pra fechar.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: {
    padding: 18,
    paddingBottom: "calc(44px + env(safe-area-inset-bottom))",
    background: BG,
  },

  head: {
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.88))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 20px 80px rgba(15,23,42,.10)",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  headGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(600px 260px at 20% 10%, rgba(255,106,0,.18), transparent 55%), radial-gradient(520px 260px at 92% 0%, rgba(15,23,42,.10), transparent 58%)",
    pointerEvents: "none",
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.72)",
    boxShadow: "0 16px 44px rgba(15,23,42,.08)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  hKicker: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.8, textTransform: "uppercase" },
  hTitle: { marginTop: 6, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.7 },
  hLine: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  tagStrong: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.20)",
    fontSize: 12,
    fontWeight: 900,
    color: TEXT,
  },
  tagSoft: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: 999,
    background: SOFT,
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 900,
    color: TEXT,
  },
  hMeta: { marginTop: 10, fontSize: 12, color: MUTED, fontWeight: 800, lineHeight: 1.35 },

  dotsNav: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  dotNav: { width: 10, height: 10, borderRadius: 999, border: "none" },
  dotNavOn: { background: ORANGE, boxShadow: "0 0 0 6px rgba(255,106,0,.14)" },
  dotNavOff: { background: "rgba(15,23,42,.14)" },

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

  cardPage: {
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,.94))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 70px rgba(15,23,42,.06)",
    position: "relative",
    overflow: "hidden",
    minHeight: "calc(100vh - 290px)",
  },
  cardGlow: {
    position: "absolute",
    inset: -40,
    background:
      "radial-gradient(620px 260px at 18% 0%, rgba(255,106,0,.14), transparent 60%), radial-gradient(520px 240px at 95% 0%, rgba(15,23,42,.10), transparent 62%)",
    pointerEvents: "none",
  },
  cardSheen: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,.22) 22%, transparent 50%)",
    transform: "translateX(-70%)",
    animation: "tdSheen 6.2s ease-in-out infinite",
    pointerEvents: "none",
  },

  doneOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 12,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    animation: "tdDoneBg .72s ease forwards",
  },
  doneGlow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(420px 240px at 50% 45%, rgba(255,106,0,.18), rgba(255,255,255,0) 65%)",
  },
  doneMarkWrap: {
    position: "relative",
    display: "grid",
    justifyItems: "center",
    gap: 10,
    animation: "tdDoneBurst .72s ease forwards",
  },
  doneMark: {
    width: 116,
    height: 116,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    color: "#fff",
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 1,
    boxShadow: "0 22px 80px rgba(255,106,0,.34), 0 0 0 10px rgba(255,106,0,.12)",
  },
  doneText: {
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.35,
    textShadow: "0 2px 12px rgba(255,255,255,.55)",
  },

  exerciseTop: { position: "relative", display: "flex", gap: 12, alignItems: "center" },
  exerciseIndex: {
    width: 44,
    height: 44,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.98), rgba(255,106,0,.58))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 16px 42px rgba(255,106,0,.22)",
    flexShrink: 0,
  },
  exerciseName: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.35, lineHeight: 1.15 },
  exerciseGroup: { marginTop: 5, fontSize: 12, fontWeight: 850, color: MUTED },
  execBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    color: TEXT,
    flexShrink: 0,
  },

  gifWrap: {
    marginTop: 14,
    borderRadius: 22,
    border: `1px solid ${BORDER}`,
    background: "rgba(15,23,42,.03)",
    overflow: "hidden",
    position: "relative",
    minHeight: 180,
  },
  gif: { width: "100%", height: 220, objectFit: "cover", display: "block" },

  gifHintBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(11,11,12,.86)",
    color: "rgba(255,255,255,.92)",
    fontSize: 11,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "0 14px 34px rgba(0,0,0,.18)",
    pointerEvents: "none",
  },

  gifFallback: {
    position: "absolute",
    inset: 0,
    padding: 14,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    background:
      "radial-gradient(520px 220px at 20% 0%, rgba(255,106,0,.10), transparent 60%), linear-gradient(135deg, rgba(255,255,255,.88), rgba(15,23,42,.03))",
    opacity: 0,
  },
  gifFallbackBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(11,11,12,.92)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 950,
    marginBottom: 8,
  },
  gifFallbackText: {
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
    maxWidth: 320,
  },

  bigChips: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    position: "relative",
  },
  chip: {
    borderRadius: 20,
    padding: 12,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.98))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 34px rgba(15,23,42,.05)",
    position: "relative",
    overflow: "hidden",
    minHeight: 72,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: 950,
    color: MUTED,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  chipValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.45,
  },
  chipSheen: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(110deg, rgba(255,255,255,.45) 0%, transparent 25%, transparent 70%, rgba(255,255,255,.18) 100%)",
    opacity: 0.42,
    pointerEvents: "none",
  },

  dotsBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.02))",
    border: "1px solid rgba(255,106,0,.16)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    position: "relative",
  },
  dotsTitle: {
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
  },
  dotsRowInner: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  dotBtn: {
    width: 16,
    height: 16,
    borderRadius: 999,
    border: "none",
  },
  dotBtnOn: {
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
  },
  dotBtnOff: {
    background: "rgba(15,23,42,.14)",
  },
  dotsMini: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
  },

  loadBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "grid",
    gridTemplateColumns: "1fr minmax(160px, 220px)",
    gap: 12,
    alignItems: "end",
    position: "relative",
  },
  loadLeft: { minWidth: 0 },
  loadRight: { minWidth: 0 },
  loadLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
  },
  loadVal: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.4,
  },
  loadHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    lineHeight: 1.35,
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "rgba(255,255,255,.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 12px 26px rgba(15,23,42,.05)",
  },

  execPanel: {
    marginTop: 14,
    borderRadius: 22,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    position: "relative",
  },
  execTitle: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
  },
  execArea: { marginTop: 10 },
  execCue: { marginTop: 10 },
  execLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
  },
  execText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 850,
    color: "#334155",
    lineHeight: 1.45,
  },

  navRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    position: "relative",
  },
  navBtn: {
    padding: 14,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },
  navBtnDisabled: { opacity: 0.55 },

  endKicker: {
    fontSize: 11,
    fontWeight: 950,
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    position: "relative",
  },
  endTitle: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.7,
    position: "relative",
  },
  endSub: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 850,
    color: "#334155",
    lineHeight: 1.5,
    position: "relative",
  },
  endCta: {
    marginTop: 16,
    width: "100%",
    padding: 16,
    borderRadius: 22,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(0,0,0,.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    position: "relative",
  },
  endCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.10)",
    display: "grid",
    placeItems: "center",
  },
  endGhost: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
  },
  endNote: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
    position: "relative",
  },

  lockCard: {
    borderRadius: 26,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,106,0,.08))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: TEXT,
  },
  lockText: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  lockBtn: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 20,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(255,106,0,.22)",
  },
  lockGhost: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.90)",
    color: TEXT,
    fontWeight: 950,
  },

  dock: {
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
    animation: "tdPop 6s ease-in-out infinite",
  },
  dockOpen: { paddingBottom: 14 },
  dockClosed: { paddingBottom: 10 },

  dockHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dockPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 14px 34px rgba(255,106,0,.10)",
  },
  dockIcon: {
    width: 34,
    height: 34,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.70)",
    border: "1px solid rgba(255,255,255,.55)",
  },
  dockTitle: {
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
  },

  dockMini: {
    display: "grid",
    justifyItems: "end",
    gap: 2,
  },
  dockMiniTime: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
  },
  dockMiniState: {
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
  },

  dockBody: {
    marginTop: 12,
    cursor: "default",
  },
  dockBigTime: {
    fontSize: 34,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -1,
  },
  dockSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
  },

  dockBtns: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 10,
    alignItems: "center",
  },

  bigStart: {
    width: "100%",
    padding: 16,
    borderRadius: 22,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxShadow: "0 18px 55px rgba(0,0,0,.18)",
  },
  bigStartIcon: {
    width: 42,
    height: 42,
    borderRadius: 18,
    background: "rgba(255,255,255,.10)",
    display: "grid",
    placeItems: "center",
  },

  smallPause: {
    padding: "14px 14px",
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },
  resetBtn: {
    width: 50,
    height: 50,
    borderRadius: 22,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(15,23,42,.04)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
  },
  dockHint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
  },

  gifOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    background: "rgba(2,6,23,.52)",
    display: "grid",
    alignItems: "end",
    padding: 12,
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  gifSheet: {
    width: "100%",
    maxWidth: 640,
    margin: "0 auto",
    borderRadius: 26,
    background: "rgba(255,255,255,.94)",
    border: "1px solid rgba(255,255,255,.38)",
    boxShadow: "0 28px 100px rgba(0,0,0,.32)",
    overflow: "hidden",
    padding: 14,
  },
  gifSheetTop: { padding: "6px 6px 10px" },
  gifSheetTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
  },
  gifSheetSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
  },

  gifFullWrap: {
    borderRadius: 22,
    overflow: "hidden",
    border: `1px solid ${BORDER}`,
    background: "rgba(15,23,42,.03)",
    position: "relative",
  },
  gifFull: {
    width: "100%",
    height: "min(72vh, 560px)",
    objectFit: "contain",
    display: "block",
    background: "rgba(15,23,42,.03)",
  },

  gifFallbackFull: {
    position: "absolute",
    inset: 0,
    padding: 14,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    background:
      "radial-gradient(520px 220px at 20% 0%, rgba(255,106,0,.10), transparent 60%), linear-gradient(135deg, rgba(255,255,255,.88), rgba(15,23,42,.03))",
    opacity: 0,
  },

  gifBackBtn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 22,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(0,0,0,.18)",
  },
};

if (typeof window !== "undefined") {
  const id = "td-gif-missing-style";
  if (!document.getElementById(id)) {
    const st = document.createElement("style");
    st.id = id;
    st.innerHTML = `
      [data-gif-missing="1"] img { display: none !important; }
      [data-gif-missing="1"] > div { opacity: 1 !important; }
    `;
    document.head.appendChild(st);
  }
}
