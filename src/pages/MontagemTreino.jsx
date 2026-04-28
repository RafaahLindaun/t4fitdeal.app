import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const BLACK = "#0B0B0C";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function slugify(v) {
  return normalizeText(v)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function normalizePlanKey(row) {
  return String(row?.plan_key || row?.plan || row?.name || "")
    .trim()
    .toLowerCase();
}

function hasActiveSubscription(row) {
  const status = String(row?.status || "").trim().toLowerCase();
  return ["active", "trialing"].includes(status);
}

function numberFrom(value, fallback = 0) {
  const n = Number(String(value || "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function makeEditableExercise(ex) {
  return {
    id: uid(),
    name: ex.name || "",
    group: ex.group || "",
    sets: ex.sets ?? 3,
    reps: ex.reps || "10–12",
    rest: ex.rest || "60s",
    method: ex.method || "",
    gif: ex.gif || `/gifs/exercises/${slugify(ex.name || "exercicio")}.gif`,
  };
}

function getApplyWindow(scope) {
  const start = new Date();
  const days = scope === "semana" ? 7 : scope === "mes" ? 30 : 1;
  const end = addDays(start, days - 1);

  return {
    scope,
    startsOn: dateKey(start),
    endsOn: dateKey(end),
    days,
    label: scope === "hoje" ? "Hoje" : scope === "semana" ? "1 semana" : "1 mês",
  };
}

function EmphasisIcon({ type, color = ORANGE }) {
  if (type === "gluteo") {
    return (
      <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
        <path d="M22 39c0-12 8-22 19-22s19 10 19 22c0 14-8 27-19 27S22 53 22 39Z" fill={color} opacity="0.16" />
        <path d="M41 18c-7 7-10 15-10 24 0 10 4 18 10 24" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M41 18c7 7 10 15 10 24 0 10-4 18-10 24" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M25 39c4-6 9-9 16-9s12 3 16 9" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "lombar") {
    return (
      <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
        <path d="M41 10c10 8 16 19 16 32S51 66 41 72C31 66 25 55 25 42S31 18 41 10Z" fill={color} opacity="0.14" />
        <path d="M41 16v50" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M31 28h20" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M29 41h24" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M32 54h18" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "emagrecer") {
    return (
      <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
        <path d="M46 10c4 14 18 19 18 36 0 15-10 26-23 26S18 61 18 46c0-13 7-22 17-33 0 10 3 16 11 21 3-6 3-14 0-24Z" fill={color} opacity="0.16" />
        <path d="M46 10c4 14 18 19 18 36 0 15-10 26-23 26S18 61 18 46c0-13 7-22 17-33 0 10 3 16 11 21 3-6 3-14 0-24Z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
        <path d="M41 58c6-3 9-8 9-14" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "trocar_hoje") {
    return (
      <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
        <circle cx="41" cy="41" r="27" fill={color} opacity="0.13" />
        <path d="M58 31c-4-8-12-13-21-11-6 1-11 5-14 10" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M23 20v10h10" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 51c4 8 12 13 21 11 6-1 11-5 14-10" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M59 62V52H49" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "leve") {
    return (
      <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
        <path d="M55 17c-3 2-6 3-10 3-14 0-25 11-25 25s11 25 25 25c10 0 19-6 23-15-4 2-8 3-13 3-14 0-25-11-25-25 0-7 3-13 8-18 5-4 11-6 17-6Z" fill={color} opacity="0.16" />
        <path d="M55 17c-3 2-6 3-10 3-14 0-25 11-25 25s11 25 25 25c10 0 19-6 23-15-4 2-8 3-13 3-14 0-25-11-25-25 0-7 3-13 8-18 5-4 11-6 17-6Z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="118" height="118" viewBox="0 0 82 82" fill="none" aria-hidden="true">
      <path d="M43 8 18 45h21l-4 29 29-40H43l7-26Z" fill={color} opacity="0.16" />
      <path d="M43 8 18 45h21l-4 29 29-40H43l7-26Z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

function ExerciseMedia({ ex, color }) {
  const [failed, setFailed] = useState(false);

  if (!failed && ex.gif) {
    return (
      <div style={S.exerciseMedia}>
        <img
          src={ex.gif}
          alt={ex.name}
          onError={() => setFailed(true)}
          style={S.exerciseGif}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...S.exerciseMedia,
        background: `radial-gradient(circle at 70% 18%, ${color}33, transparent 36%), linear-gradient(135deg, #ffffff, #f8fafc)`,
      }}
    >
      <div style={{ ...S.exerciseFallbackIcon, background: color }}>
        {String(ex.name || "?").slice(0, 1).toUpperCase()}
      </div>
    </div>
  );
}

const EMPHASES = [
  {
    id: "gluteo",
    chapter: "01",
    title: "Glúteo",
    fullTitle: "Ênfase em glúteo",
    subtitle: "Ativação e posterior",
    why: "Boa para melhorar conexão mente-músculo, ativar glúteos e deixar o treino de pernas mais direcionado.",
    color: "#FF6A00",
    soft: "rgba(255,106,0,.12)",
    bg: "radial-gradient(circle at 72% 15%, rgba(255,106,0,.34), rgba(255,106,0,0) 36%), linear-gradient(145deg, #FFF7ED, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Use quando quiser sentir mais glúteo no treino sem desmontar seu plano. A prioridade é pausa, quadril e controle.",
    keywords: ["pausa no topo", "quadril", "amplitude", "controle"],
    exercises: [
      { name: "Hip thrust", group: "Glúteos", sets: 4, reps: "8–12", rest: "90–120s", method: "Pausa de 1 segundo no topo. Não hiperestenda a lombar." },
      { name: "Terra romeno", group: "Posterior/Glúteos", sets: 4, reps: "8–12", rest: "90–120s", method: "Desça com quadril para trás e coluna neutra." },
      { name: "Agachamento sumô", group: "Glúteos/Pernas", sets: 4, reps: "10–12", rest: "90s", method: "Pés mais abertos, joelhos acompanhando a ponta dos pés." },
      { name: "Cadeira abdutora", group: "Glúteo médio", sets: 4, reps: "12–20", rest: "60s", method: "Controle a volta. Não deixe o peso despencar." },
      { name: "Kickback no cabo", group: "Glúteos", sets: 3, reps: "12–15", rest: "60s", method: "Movimento curto e limpo, sem girar o tronco." },
    ],
  },
  {
    id: "lombar",
    chapter: "02",
    title: "Lombar",
    fullTitle: "Ênfase em lombar",
    subtitle: "Controle e postura",
    why: "Boa para dias em que você quer proteger a coluna, fortalecer core e fazer uma sessão mais controlada.",
    color: "#34C759",
    soft: "rgba(52,199,89,.13)",
    bg: "radial-gradient(circle at 72% 15%, rgba(52,199,89,.30), rgba(52,199,89,0) 36%), linear-gradient(145deg, #F0FDF4, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Use quando quiser um treino mais seguro para lombar, com core, postura e menos agressão. Dor forte ou irradiando precisa avaliação profissional.",
    keywords: ["coluna neutra", "core", "controle", "sem dor"],
    exercises: [
      { name: "Dead bug", group: "Core", sets: 3, reps: "10–12", rest: "45–60s", method: "Controle a respiração e mantenha lombar estável." },
      { name: "Prancha", group: "Core", sets: 4, reps: "30–45s", rest: "45–60s", method: "Abdômen travado, sem deixar o quadril cair." },
      { name: "Hiperextensão lombar leve", group: "Lombar", sets: 3, reps: "12–15", rest: "60–75s", method: "Suba só até alinhar o corpo. Sem jogar para trás." },
      { name: "Remada baixa", group: "Costas/Postura", sets: 4, reps: "10–12", rest: "75–90s", method: "Peito aberto, escápulas firmes e tronco estável." },
      { name: "Alongamento de posterior", group: "Mobilidade", sets: 3, reps: "30s", rest: "30s", method: "Alongue sem forçar dor. Respire devagar." },
    ],
  },
  {
    id: "emagrecer",
    chapter: "03",
    title: "Emagrecer",
    fullTitle: "Ênfase em emagrecimento",
    subtitle: "Treino + cardio",
    why: "Boa para aumentar gasto calórico sem transformar o treino em bagunça. Combina musculação e cardio com constância.",
    color: "#0A84FF",
    soft: "rgba(10,132,255,.13)",
    bg: "radial-gradient(circle at 72% 15%, rgba(10,132,255,.30), rgba(10,132,255,0) 36%), linear-gradient(145deg, #EFF6FF, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Combina musculação com cardio progressivo. O objetivo é constância, gasto calórico e treino sustentável.",
    keywords: ["cardio", "constância", "gasto calórico", "ritmo"],
    exercises: [
      { name: "Agachamento livre", group: "Pernas", sets: 4, reps: "12–15", rest: "60–75s", method: "Ritmo constante, sem descanso longo demais." },
      { name: "Remada baixa", group: "Costas", sets: 4, reps: "10–12", rest: "60–75s", method: "Movimento firme e controlado." },
      { name: "Supino inclinado", group: "Peito", sets: 3, reps: "10–12", rest: "60s", method: "Controle a descida e mantenha ritmo." },
      { name: "Cadeira extensora", group: "Quadríceps", sets: 3, reps: "12–15", rest: "45–60s", method: "Queima controlada, sem roubar." },
      { name: "Cardio moderado", group: "Cardio", sets: 1, reps: "25–35min", rest: "—", method: "Esteira, bike ou elíptico em ritmo que dê para sustentar." },
    ],
    cardioPlan: [
      "Semana 1: 3 cardios moderados de 25 minutos.",
      "Semana 2: 3 cardios de 30 minutos + 1 curto de 15 minutos.",
      "Semana 3: 4 cardios de 30 minutos.",
      "Semana 4: 3 cardios moderados + 1 intervalado leve.",
    ],
  },
  {
    id: "trocar_hoje",
    chapter: "04",
    title: "Trocar hoje",
    fullTitle: "Ênfase alternativa",
    subtitle: "Sem bagunçar o plano",
    why: "Boa para quando você está sem tempo, cansado ou sem aparelho. Troca o estímulo sem perder a lógica da semana.",
    color: "#AF52DE",
    soft: "rgba(175,82,222,.13)",
    bg: "radial-gradient(circle at 72% 15%, rgba(175,82,222,.30), rgba(175,82,222,0) 36%), linear-gradient(145deg, #FAF5FF, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Use quando estiver sem tempo, cansado ou sem aparelho. Mantém a estrutura da semana sem travar seu treino.",
    keywords: ["troca rápida", "sem bagunçar", "adaptação", "praticidade"],
    exercises: [
      { name: "Leg press", group: "Pernas", sets: 3, reps: "12", rest: "75s", method: "Opção segura para substituir agachamento pesado." },
      { name: "Puxada frente", group: "Costas", sets: 3, reps: "12", rest: "75s", method: "Boa base para manter treino completo." },
      { name: "Supino máquina", group: "Peito", sets: 3, reps: "12", rest: "75s", method: "Mais simples que livre em dias corridos." },
      { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "12–15", rest: "60s", method: "Carga leve e execução limpa." },
      { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45s", method: "Finalização rápida." },
    ],
  },
  {
    id: "leve",
    chapter: "05",
    title: "Leve",
    fullTitle: "Ênfase leve",
    subtitle: "Recuperar ritmo",
    why: "Boa para dias de cansaço. Mantém constância, reduz carga e ajuda você a não abandonar o plano.",
    color: "#64D2FF",
    soft: "rgba(100,210,255,.15)",
    bg: "radial-gradient(circle at 72% 15%, rgba(100,210,255,.32), rgba(100,210,255,0) 36%), linear-gradient(145deg, #F0FDFF, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Melhor fazer um treino leve bem feito do que faltar. Reduza carga e mantenha controle.",
    keywords: ["controle", "leve", "recuperação", "constância"],
    exercises: [
      { name: "Bike leve", group: "Cardio", sets: 1, reps: "8–10min", rest: "—", method: "Aquecimento sem cansar demais." },
      { name: "Agachamento goblet leve", group: "Pernas", sets: 3, reps: "12", rest: "60s", method: "Carga confortável e amplitude segura." },
      { name: "Remada máquina", group: "Costas", sets: 3, reps: "12", rest: "60s", method: "Controle total, sem roubar." },
      { name: "Supino máquina", group: "Peito", sets: 3, reps: "12", rest: "60s", method: "Movimento limpo e carga moderada." },
      { name: "Alongamento curto", group: "Mobilidade", sets: 1, reps: "5min", rest: "—", method: "Finalize soltando quadril, posterior e costas." },
    ],
  },
  {
    id: "forte",
    chapter: "06",
    title: "Forte",
    fullTitle: "Ênfase forte",
    subtitle: "Carga e progressão",
    why: "Boa para dias em que você quer evoluir carga e intensidade, mantendo técnica e descanso bem definidos.",
    color: "#FF375F",
    soft: "rgba(255,55,95,.13)",
    bg: "radial-gradient(circle at 72% 15%, rgba(255,55,95,.32), rgba(255,55,95,0) 36%), linear-gradient(145deg, #FFF1F2, #FFFFFF)",
    guideTitle: "Por que fazer",
    guideText: "Mais carga, técnica e descanso. Treino forte não é fazer tudo até falhar.",
    keywords: ["carga", "progressão", "descanso", "técnica"],
    exercises: [
      { name: "Agachamento", group: "Pernas", sets: 5, reps: "5–8", rest: "120s", method: "Priorize técnica e carga progressiva." },
      { name: "Supino reto", group: "Peito", sets: 5, reps: "5–8", rest: "120s", method: "Controle a descida e suba com força." },
      { name: "Remada curvada", group: "Costas", sets: 4, reps: "6–10", rest: "90–120s", method: "Tronco firme e puxada forte." },
      { name: "Terra romeno", group: "Posterior", sets: 4, reps: "8–10", rest: "120s", method: "Quadril para trás e coluna neutra." },
      { name: "Desenvolvimento", group: "Ombros", sets: 4, reps: "6–10", rest: "90s", method: "Sem roubar com lombar." },
    ],
  },
];

export default function MontagemTreino() {
  const nav = useNavigate();
  const { user } = useAuth();

  const scrollerRef = useRef(null);
  const scrollTimerRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedId, setSelectedId] = useState("gluteo");
  const [scope, setScope] = useState("hoje");
  const [targetDays, setTargetDays] = useState("30");
  const [exercises, setExercises] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openKeyword, setOpenKeyword] = useState(null);

  const selected = useMemo(() => EMPHASES.find((x) => x.id === selectedId) || EMPHASES[0], [selectedId]);
  const applyWindow = useMemo(() => getApplyWindow(scope), [scope]);

  useEffect(() => {
    setExercises((selected.exercises || []).map(makeEditableExercise));
    setEditingId(null);
    setOpenKeyword(null);
  }, [selectedId]);

  useEffect(() => {
    let alive = true;

    async function loadUserData() {
      if (!user?.id) return;

      try {
        const [profileRes, subRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!alive) return;

        if (profileRes.error) console.error("MontagemTreino profile error:", profileRes.error);
        if (subRes.error) console.error("MontagemTreino subscription error:", subRes.error);

        setProfile(profileRes.data || null);
        setSubscription(subRes.data || null);
      } catch (err) {
        console.error("MontagemTreino load catch:", err);
      }
    }

    loadUserData();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const objetivo = normalizeText(profile?.objetivo);

    if (objetivo.includes("emagrec") || objetivo.includes("perda")) {
      setSelectedId("emagrecer");
      return;
    }

    if (objetivo.includes("forca") || objetivo.includes("performance")) {
      setSelectedId("forte");
      return;
    }

    if (objetivo.includes("glute")) setSelectedId("gluteo");
  }, [profile?.objetivo]);

  function selectNearestCard() {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.querySelectorAll("[data-emphasis-id]"));
    if (!cards.length) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const centerX = scrollerRect.left + scrollerRect.width / 2;

    let nearest = null;
    let nearestDistance = Infinity;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - centerX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = card;
      }
    });

    const id = nearest?.getAttribute("data-emphasis-id");
    if (id && id !== selectedId) setSelectedId(id);
  }

  function handleScroll() {
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(selectNearestCard, 80);
  }

  const isPaid = hasActiveSubscription(subscription);
  const planKey = normalizePlanKey(subscription);

  const keywordHelp = useMemo(() => {
    if (!openKeyword) return null;

    const map = {
      "pausa no topo": "Segure a contração por 1 segundo no ponto mais forte do movimento.",
      quadril: "Pense em mover o quadril, não a lombar. Isso melhora a ativação de glúteos e posterior.",
      amplitude: "Use uma amplitude segura, sem perder postura ou sentir dor articular.",
      controle: "Controle a ida e a volta do movimento. Evite jogar o peso.",
      "coluna neutra": "Mantenha a coluna alinhada, sem arredondar ou hiperestender.",
      core: "Trave abdômen e respire com controle. O core protege a lombar.",
      "sem dor": "Dor forte, pontada ou irradiação não deve ser ignorada. Reduza carga ou pare.",
      cardio: "Use cardio como ferramenta de constância, não punição.",
      constância: "Resultado vem da repetição semanal, não de um treino perfeito isolado.",
      "gasto calórico": "Musculação + cardio + alimentação organizada melhoram o déficit calórico.",
      ritmo: "Descanse o suficiente para continuar bem, mas evite pausas longas demais.",
      "troca rápida": "Troque o treino do dia sem perder a lógica da semana.",
      "sem bagunçar": "A montagem altera o treino atual, mas mantém estrutura, volume e foco.",
      adaptação: "Use quando está cansado, sem tempo ou sem acesso a alguns aparelhos.",
      praticidade: "Menos configuração, mais execução.",
      leve: "Reduza carga, mantenha técnica e use o treino para recuperar ritmo.",
      recuperação: "Treino leve ajuda circulação, mobilidade e consistência.",
      carga: "Carga boa é aquela que desafia sem destruir sua execução.",
      progressão: "Tente melhorar pouco a pouco: mais carga, mais reps ou mais controle.",
      descanso: "Descanso certo ajuda força, técnica e segurança.",
      técnica: "Técnica vem antes de peso. Movimento bonito evolui mais.",
    };

    return map[openKeyword] || "Use essa palavra como guia para executar melhor o treino.";
  }, [openKeyword]);

  const payload = useMemo(() => {
    return {
      source: "montagem",
      intent: selected.id,
      emphasisId: selected.id,
      focusId: selected.id,
      focusTitle: selected.fullTitle,
      focusSubtitle: selected.subtitle,
      apply: applyWindow,
      duration: scope,
      targetDays: selected.id === "emagrecer" ? Number(targetDays || 30) : null,
      guide: {
        chapter: selected.chapter,
        title: selected.guideTitle,
        text: selected.guideText,
        why: selected.why,
        keywords: selected.keywords,
        color: selected.color,
      },
      profile: {
        objetivo: profile?.objetivo || null,
        nivel: profile?.nivel || null,
        split: profile?.split || null,
        intensidade: profile?.intensidade || null,
        frequencia: profile?.frequencia || null,
      },
      subscription: {
        active: isPaid,
        planKey,
        status: subscription?.status || null,
      },
      cardioPlan: selected.cardioPlan || [],
      exercises: exercises.map((ex, index) => ({
        ...ex,
        order: index + 1,
        sets: numberFrom(ex.sets, 3),
      })),
      createdAt: new Date().toISOString(),
    };
  }, [selected, applyWindow, scope, targetDays, profile, subscription, isPaid, planKey, exercises]);

  function updateExercise(id, patch) {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)));
  }

  function addExercise() {
    const ex = makeEditableExercise({
      name: "Novo exercício",
      group: "Grupo muscular",
      sets: 3,
      reps: "10–12",
      rest: "60s",
      method: "Descreva a execução.",
    });

    setExercises((prev) => [...prev, ex]);
    setEditingId(ex.id);
  }

  function removeExercise(id) {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }

  function moveExercise(id, dir) {
    setExercises((prev) => {
      const index = prev.findIndex((ex) => ex.id === id);
      if (index < 0) return prev;

      const nextIndex = clamp(index + dir, 0, prev.length - 1);
      if (nextIndex === index) return prev;

      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);

      return copy;
    });
  }

  async function saveMontage(customScope = scope) {
    if (!user?.id || saving) return;

    const nextApply = getApplyWindow(customScope);
    const finalPayload = {
      ...payload,
      duration: customScope,
      apply: nextApply,
    };

    setSaving(true);

    try {
      localStorage.setItem("fitdeal_quick_workout", JSON.stringify(finalPayload));

      await supabase
        .from("user_workout_montages")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data, error } = await supabase
        .from("user_workout_montages")
        .insert({
          user_id: user.id,
          focus_key: finalPayload.focusId,
          title: finalPayload.focusTitle,
          selected_level: String(profile?.nivel || ""),
          selected_days: finalPayload.apply.label,
          payload: finalPayload,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("saveMontage error:", error);
        nav("/treino/detalhe?source=montagem");
        return;
      }

      nav(`/treino/detalhe?source=montagem&id=${data.id}`);
    } catch (err) {
      console.error("saveMontage catch:", err);
      nav("/treino/detalhe?source=montagem");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <section style={S.topBar}>
          <button type="button" style={S.backBtn} onClick={() => nav("/treino")}>
            ←
          </button>

          <div style={S.topText}>
            <div style={S.kicker}>Montagem inteligente</div>
            <h1 style={S.title}>Vamos alterar seu foco hoje</h1>
            <p style={S.sub}>Arraste leve para o lado. Ao parar, a ênfase aparece completa abaixo.</p>
          </div>
        </section>

        <section style={S.railSection}>
          <div ref={scrollerRef} style={S.deckScroller} onScroll={handleScroll}>
            {EMPHASES.map((item, index) => {
              const active = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-emphasis-id={item.id}
                  className="montagem-card-press"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    ...S.bigCard,
                    background: item.bg,
                    borderColor: active ? item.color : "rgba(15,23,42,.08)",
                    opacity: active ? 1 : 0.86,
                    boxShadow: active
                      ? `0 34px 86px ${item.soft}, 0 18px 44px rgba(15,23,42,.11)`
                      : "0 14px 32px rgba(15,23,42,.06)",
                    transform: active
                      ? "perspective(1000px) rotateY(0deg) scale(1)"
                      : index % 2 === 0
                        ? "perspective(1000px) rotateY(-4deg) scale(.94)"
                        : "perspective(1000px) rotateY(4deg) scale(.94)",
                  }}
                >
                  <div style={S.bigCardTop}>
                    <span>Ênfase {item.chapter}</span>
                    <i style={{ background: item.color }} />
                  </div>

                  <div style={S.bigIconArea}>
                    <EmphasisIcon type={item.id} color={item.color} />
                  </div>

                  <div style={S.bigCardBottom}>
                    <div style={S.bigCardTitle}>{item.fullTitle}</div>
                    <div style={S.bigCardSub}>{item.subtitle}</div>

                    <div style={S.bigKeywords}>
                      {item.keywords.slice(0, 3).map((word) => (
                        <span key={word}>{word}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={S.selectedContent}>
          <div style={S.selectedTop}>
            <div style={{ ...S.selectedIcon, background: selected.soft }}>
              <EmphasisIcon type={selected.id} color={selected.color} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={S.selectedKicker}>Ênfase {selected.chapter}</div>
              <div style={S.selectedTitle}>{selected.fullTitle}</div>
              <div style={S.selectedSub}>{selected.subtitle}</div>
            </div>
          </div>

          <div style={S.whyCard}>
            <div style={S.whyTitle}>Por que fazer?</div>
            <div style={S.whyText}>{selected.why}</div>

            <div style={S.keywordRow}>
              {selected.keywords.map((word) => {
                const active = openKeyword === word;

                return (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setOpenKeyword(active ? null : word)}
                    style={{
                      ...S.keyword,
                      ...(active
                        ? {
                            background: selected.color,
                            color: "#fff",
                            borderColor: selected.color,
                          }
                        : null),
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            {keywordHelp ? <div style={S.keywordBox}>{keywordHelp}</div> : null}
          </div>

          {selected.cardioPlan?.length ? (
            <div style={S.cardioBox}>
              <div style={S.blockTitle}>Cardio sugerido</div>
              <div style={S.cardioList}>
                {selected.cardioPlan.map((line, index) => (
                  <div key={index} style={S.cardioItem}>
                    <span>{index + 1}</span>
                    <b>{line}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={S.exerciseBlock}>
            <div style={S.exerciseHead}>
              <div>
                <div style={S.blockTitle}>Exercícios indicados</div>
                <div style={S.blockSub}>GIF, séries, reps, descanso e execução.</div>
              </div>

              <button type="button" onClick={addExercise} style={S.addBtn}>
                + Exercício
              </button>
            </div>

            <div style={S.exerciseList}>
              {exercises.map((ex, index) => {
                const editing = editingId === ex.id;

                return (
                  <article key={ex.id} style={S.exerciseCard}>
                    <ExerciseMedia ex={ex} color={selected.color} />

                    <div style={S.exerciseBody}>
                      <div style={S.exerciseTop}>
                        <div style={{ ...S.exerciseNumber, background: selected.color }}>{index + 1}</div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          {editing ? (
                            <>
                              <input
                                value={ex.name}
                                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                                style={S.nameInput}
                              />
                              <input
                                value={ex.group}
                                onChange={(e) => updateExercise(ex.id, { group: e.target.value })}
                                style={S.groupInput}
                              />
                            </>
                          ) : (
                            <>
                              <div style={S.exerciseName}>{ex.name}</div>
                              <div style={S.exerciseMeta}>
                                {ex.group} • {ex.sets}x • {ex.reps} • {ex.rest}
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingId(editing ? null : ex.id)}
                          style={{
                            ...S.editBtn,
                            background: editing ? selected.color : "rgba(15,23,42,.05)",
                            color: editing ? "#fff" : TEXT,
                          }}
                        >
                          {editing ? "Ok" : "Editar"}
                        </button>
                      </div>

                      {editing ? (
                        <>
                          <div style={S.editGrid}>
                            <label style={S.miniLabel}>
                              Séries
                              <input
                                value={ex.sets}
                                onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                                inputMode="numeric"
                                style={S.miniInput}
                              />
                            </label>

                            <label style={S.miniLabel}>
                              Reps
                              <input
                                value={ex.reps}
                                onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                                style={S.miniInput}
                              />
                            </label>

                            <label style={S.miniLabel}>
                              Descanso
                              <input
                                value={ex.rest}
                                onChange={(e) => updateExercise(ex.id, { rest: e.target.value })}
                                style={S.miniInput}
                              />
                            </label>
                          </div>

                          <label style={S.methodLabel}>
                            Execução
                            <textarea
                              value={ex.method}
                              onChange={(e) => updateExercise(ex.id, { method: e.target.value })}
                              style={S.methodInput}
                              rows={2}
                            />
                          </label>

                          <div style={S.exerciseTools}>
                            <button type="button" onClick={() => moveExercise(ex.id, -1)} style={S.toolBtn}>
                              Subir
                            </button>
                            <button type="button" onClick={() => moveExercise(ex.id, 1)} style={S.toolBtn}>
                              Descer
                            </button>
                            <button type="button" onClick={() => removeExercise(ex.id)} style={S.removeBtn}>
                              Remover
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={S.methodPreview}>{ex.method}</div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section style={S.confirmCard}>
          <div style={S.confirmKicker}>Confirmar aplicação</div>
          <div style={S.confirmTitle}>Como você quer usar essa ênfase?</div>
          <div style={S.confirmSub}>
            O FitDeal salva essa montagem e abre o treino com essa configuração.
          </div>

          <div style={S.confirmGrid}>
            {[
              {
                id: "hoje",
                title: "Fazer hoje",
                sub: "Aplica só no treino atual.",
              },
              {
                id: "semana",
                title: "Usar 1 semana",
                sub: "Mantém por 7 dias.",
              },
              {
                id: "mes",
                title: "Usar 1 mês",
                sub: "Mantém por 30 dias.",
              },
            ].map((item) => {
              const active = scope === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id)}
                  style={{
                    ...S.confirmOption,
                    ...(active ? S.confirmOptionOn : null),
                  }}
                >
                  <b>{item.title}</b>
                  <span>{item.sub}</span>
                </button>
              );
            })}
          </div>

          {selected.id === "emagrecer" ? (
            <label style={S.daysLabelDark}>
              Quero emagrecer em quantos dias?
              <div style={S.daysInlineDark}>
                <input
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  inputMode="numeric"
                  style={S.daysInputDark}
                />
                <span>dias</span>
              </div>
            </label>
          ) : null}

          <button type="button" style={S.saveBtn} onClick={() => saveMontage(scope)} disabled={saving}>
            {saving ? "Salvando..." : `Confirmar • ${applyWindow.label}`}
          </button>
        </section>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: 14,
    paddingBottom: 190,
    overflowX: "hidden",
  },

  wrap: {
    maxWidth: 760,
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 28,
    padding: 14,
    background:
      "radial-gradient(circle at 92% 0%, rgba(255,106,0,.24), rgba(255,106,0,0) 30%), linear-gradient(135deg, rgba(255,255,255,.96), rgba(255,247,237,.96))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 50px rgba(15,23,42,.08)",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.88)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
  },

  topText: {
    minWidth: 0,
    flex: 1,
    paddingTop: 2,
  },

  kicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  title: {
    margin: "6px 0 0",
    color: TEXT,
    fontSize: 29,
    lineHeight: 0.98,
    fontWeight: 980,
    letterSpacing: -1.2,
  },

  sub: {
    margin: "10px 0 0",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.38,
    fontWeight: 800,
  },

  railSection: {
    marginTop: 16,
  },

  deckScroller: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    padding: "4px 2px 18px",
    WebkitOverflowScrolling: "touch",
    perspective: 1000,
    scrollBehavior: "smooth",
  },

  bigCard: {
    minWidth: "84%",
    height: 430,
    borderRadius: 32,
    border: `1px solid ${BORDER}`,
    padding: 17,
    scrollSnapAlign: "center",
    textAlign: "left",
    transition: "transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s ease, border-color .24s ease, opacity .24s ease",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    background: "#fff",
  },

  bigCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: MUTED,
    fontSize: 12,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  bigIconArea: {
    flex: 1,
    minHeight: 130,
    display: "grid",
    placeItems: "center",
  },

  bigCardBottom: {
    marginTop: "auto",
  },

  bigCardTitle: {
    color: TEXT,
    fontSize: 31,
    lineHeight: 0.96,
    fontWeight: 980,
    letterSpacing: -1.25,
  },

  bigCardSub: {
    marginTop: 8,
    color: MUTED,
    fontSize: 15,
    lineHeight: 1.25,
    fontWeight: 850,
  },

  bigKeywords: {
    marginTop: 13,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  selectedContent: {
    marginTop: 8,
    borderRadius: 28,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 44px rgba(15,23,42,.06)",
    padding: 14,
  },

  selectedTop: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  selectedIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    overflow: "hidden",
  },

  selectedKicker: {
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  selectedTitle: {
    marginTop: 5,
    color: TEXT,
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.8,
  },

  selectedSub: {
    marginTop: 6,
    color: MUTED,
    fontSize: 13,
    fontWeight: 830,
  },

  whyCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 13,
    background: "rgba(248,250,252,.9)",
    border: `1px solid ${BORDER}`,
  },

  whyTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: 980,
  },

  whyText: {
    marginTop: 7,
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.42,
    fontWeight: 780,
  },

  keywordRow: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  keyword: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: "8px 10px",
    background: "#fff",
    color: TEXT,
    fontSize: 12,
    fontWeight: 900,
  },

  keywordBox: {
    marginTop: 10,
    borderRadius: 17,
    padding: 11,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    color: TEXT,
    fontSize: 13,
    lineHeight: 1.38,
    fontWeight: 800,
  },

  cardioBox: {
    marginTop: 14,
  },

  blockTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: 980,
    letterSpacing: -0.5,
  },

  blockSub: {
    marginTop: 5,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  cardioList: {
    marginTop: 10,
    display: "grid",
    gap: 9,
  },

  cardioItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 17,
    padding: 11,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    color: TEXT,
    fontSize: 13,
    lineHeight: 1.35,
  },

  exerciseBlock: {
    marginTop: 16,
  },

  exerciseHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  addBtn: {
    border: "none",
    borderRadius: 999,
    padding: "10px 12px",
    background: BLACK,
    color: "#fff",
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  exerciseList: {
    marginTop: 12,
    display: "grid",
    gap: 12,
  },

  exerciseCard: {
    borderRadius: 22,
    overflow: "hidden",
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 34px rgba(15,23,42,.05)",
  },

  exerciseMedia: {
    height: 150,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    background: "#f8fafc",
  },

  exerciseGif: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  exerciseFallbackIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontSize: 24,
    fontWeight: 980,
    boxShadow: "0 16px 38px rgba(15,23,42,.12)",
  },

  exerciseBody: {
    padding: 12,
  },

  exerciseTop: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },

  exerciseNumber: {
    width: 38,
    height: 38,
    borderRadius: 15,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: 980,
    flexShrink: 0,
  },

  exerciseName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: 980,
    letterSpacing: -0.3,
  },

  exerciseMeta: {
    marginTop: 5,
    color: MUTED,
    fontSize: 12,
    fontWeight: 830,
  },

  editBtn: {
    border: "none",
    borderRadius: 999,
    padding: "9px 11px",
    fontSize: 12,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  nameInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: TEXT,
    fontSize: 15,
    fontWeight: 980,
    letterSpacing: -0.3,
    outline: "none",
  },

  groupInput: {
    width: "100%",
    marginTop: 3,
    border: "none",
    background: "transparent",
    color: MUTED,
    fontSize: 12,
    fontWeight: 850,
    outline: "none",
  },

  editGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "80px 1fr 1fr",
    gap: 8,
  },

  miniLabel: {
    display: "grid",
    gap: 6,
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
  },

  miniInput: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    background: "#fff",
    padding: "10px 9px",
    color: TEXT,
    fontSize: 13,
    fontWeight: 900,
    outline: "none",
  },

  methodLabel: {
    marginTop: 10,
    display: "grid",
    gap: 6,
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
  },

  methodInput: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: "#fff",
    padding: "11px 10px",
    color: TEXT,
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 800,
    resize: "vertical",
    outline: "none",
  },

  exerciseTools: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr",
    gap: 8,
  },

  toolBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    background: "#fff",
    color: TEXT,
    padding: 10,
    fontSize: 12,
    fontWeight: 950,
  },

  removeBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    background: "rgba(255,55,95,.08)",
    color: "#FF375F",
    padding: 10,
    fontSize: 12,
    fontWeight: 950,
  },

  methodPreview: {
    marginTop: 10,
    borderRadius: 16,
    padding: 10,
    background: "rgba(15,23,42,.035)",
    border: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 780,
  },

  confirmCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 15,
    background:
      "radial-gradient(circle at 88% 10%, rgba(255,106,0,.34), rgba(255,106,0,0) 34%), linear-gradient(135deg, #050506, #121214)",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(0,0,0,.20)",
  },

  confirmKicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },

  confirmTitle: {
    marginTop: 7,
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.7,
  },

  confirmSub: {
    marginTop: 8,
    color: "rgba(255,255,255,.68)",
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 800,
  },

  confirmGrid: {
    marginTop: 14,
    display: "grid",
    gap: 9,
  },

  confirmOption: {
    width: "100%",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.08)",
    color: "#fff",
    padding: 13,
    display: "grid",
    gap: 5,
    textAlign: "left",
  },

  confirmOptionOn: {
    background: "rgba(255,106,0,.20)",
    border: "1px solid rgba(255,106,0,.48)",
    boxShadow: "0 16px 42px rgba(255,106,0,.14)",
  },

  daysLabelDark: {
    marginTop: 13,
    display: "grid",
    gap: 8,
    color: "rgba(255,255,255,.72)",
    fontSize: 12,
    fontWeight: 950,
  },

  daysInlineDark: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
  },

  daysInputDark: {
    width: 82,
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 16,
    background: "rgba(255,255,255,.10)",
    padding: "12px 10px",
    color: "#fff",
    fontSize: 15,
    fontWeight: 950,
    outline: "none",
  },

  saveBtn: {
    marginTop: 13,
    width: "100%",
    height: 52,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 15,
    fontWeight: 980,
    boxShadow: "0 16px 42px rgba(255,106,0,.24)",
  },
};

if (typeof document !== "undefined") {
  const id = "montagem-treino-effects";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .montagem-card-press:active {
        transform: scale(.985) !important;
      }

      button {
        -webkit-tap-highlight-color: transparent;
      }

      ::-webkit-scrollbar {
        height: 0px;
        width: 0px;
      }
    `;
    document.head.appendChild(style);
  }
}
