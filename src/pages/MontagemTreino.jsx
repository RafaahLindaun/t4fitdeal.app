import { useEffect, useMemo, useState } from "react";
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

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
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

const INTENTS = [
  {
    id: "gluteo",
    chapter: "01",
    title: "Glúteo hoje",
    short: "Glúteo",
    subtitle: "Mais ativação, posterior e controle.",
    color: "#FF6A00",
    soft: "rgba(255,106,0,.12)",
    gradient:
      "radial-gradient(circle at 85% 8%, rgba(255,106,0,.40), rgba(255,106,0,0) 32%), linear-gradient(135deg, #FFF7ED, #FFFFFF)",
    guideTitle: "Guia rápido para glúteo",
    guideText:
      "Use controle, pausa no topo e amplitude segura. A ideia é sentir o glúteo trabalhando sem jogar tudo para lombar.",
    keywords: ["pausa no topo", "quadril", "amplitude", "controle"],
    exercises: [
      {
        name: "Hip thrust",
        group: "Glúteos",
        sets: 4,
        reps: "8–12",
        rest: "90–120s",
        method: "Pausa de 1 segundo no topo. Não hiperestenda a lombar.",
      },
      {
        name: "Terra romeno",
        group: "Posterior/Glúteos",
        sets: 4,
        reps: "8–12",
        rest: "90–120s",
        method: "Desça com quadril para trás e coluna neutra.",
      },
      {
        name: "Agachamento sumô",
        group: "Glúteos/Pernas",
        sets: 4,
        reps: "10–12",
        rest: "90s",
        method: "Pés mais abertos, joelhos acompanhando a ponta dos pés.",
      },
      {
        name: "Cadeira abdutora",
        group: "Glúteo médio",
        sets: 4,
        reps: "12–20",
        rest: "60s",
        method: "Controle a volta. Não deixe o peso despencar.",
      },
      {
        name: "Kickback no cabo",
        group: "Glúteos",
        sets: 3,
        reps: "12–15",
        rest: "60s",
        method: "Movimento curto e limpo, sem girar o tronco.",
      },
    ],
  },
  {
    id: "lombar",
    chapter: "02",
    title: "Dor na lombar",
    short: "Lombar",
    subtitle: "Treino mais seguro, core e postura.",
    color: "#34C759",
    soft: "rgba(52,199,89,.13)",
    gradient:
      "radial-gradient(circle at 86% 8%, rgba(52,199,89,.32), rgba(52,199,89,0) 32%), linear-gradient(135deg, #F0FDF4, #FFFFFF)",
    guideTitle: "Guia rápido para lombar",
    guideText:
      "A proposta aqui é reduzir agressão, fortalecer core e priorizar coluna neutra. Dor forte ou aguda precisa de avaliação profissional.",
    keywords: ["coluna neutra", "core", "controle", "sem dor"],
    exercises: [
      {
        name: "Dead bug",
        group: "Core",
        sets: 3,
        reps: "10–12",
        rest: "45–60s",
        method: "Controle a respiração e mantenha lombar estável.",
      },
      {
        name: "Prancha",
        group: "Core",
        sets: 4,
        reps: "30–45s",
        rest: "45–60s",
        method: "Abdômen travado, sem deixar o quadril cair.",
      },
      {
        name: "Hiperextensão lombar leve",
        group: "Lombar",
        sets: 3,
        reps: "12–15",
        rest: "60–75s",
        method: "Suba só até alinhar o corpo. Sem jogar para trás.",
      },
      {
        name: "Remada baixa",
        group: "Costas/Postura",
        sets: 4,
        reps: "10–12",
        rest: "75–90s",
        method: "Peito aberto, escápulas firmes e tronco estável.",
      },
      {
        name: "Alongamento de posterior",
        group: "Mobilidade",
        sets: 3,
        reps: "30s",
        rest: "30s",
        method: "Alongue sem forçar dor. Respire devagar.",
      },
    ],
  },
  {
    id: "emagrecer",
    chapter: "03",
    title: "Emagrecer em dias",
    short: "Emagrecer",
    subtitle: "Musculação + cardio com plano simples.",
    color: "#0A84FF",
    soft: "rgba(10,132,255,.13)",
    gradient:
      "radial-gradient(circle at 86% 8%, rgba(10,132,255,.32), rgba(10,132,255,0) 32%), linear-gradient(135deg, #EFF6FF, #FFFFFF)",
    guideTitle: "Guia rápido para emagrecer",
    guideText:
      "O segredo é constância. A montagem combina treino com ritmo controlado e um plano de cardio puxadinho, mas sustentável.",
    keywords: ["cardio", "constância", "gasto calórico", "ritmo"],
    exercises: [
      {
        name: "Agachamento livre",
        group: "Pernas",
        sets: 4,
        reps: "12–15",
        rest: "60–75s",
        method: "Ritmo constante, sem descanso longo demais.",
      },
      {
        name: "Remada baixa",
        group: "Costas",
        sets: 4,
        reps: "10–12",
        rest: "60–75s",
        method: "Movimento firme e controlado.",
      },
      {
        name: "Supino inclinado",
        group: "Peito",
        sets: 3,
        reps: "10–12",
        rest: "60s",
        method: "Controle a descida e mantenha ritmo.",
      },
      {
        name: "Cadeira extensora",
        group: "Quadríceps",
        sets: 3,
        reps: "12–15",
        rest: "45–60s",
        method: "Queima controlada, sem roubar.",
      },
      {
        name: "Cardio moderado",
        group: "Cardio",
        sets: 1,
        reps: "25–35min",
        rest: "—",
        method: "Esteira, bike ou elíptico em ritmo que dê para sustentar.",
      },
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
    title: "Trocar treino de hoje",
    short: "Trocar hoje",
    subtitle: "Muda o dia sem bagunçar seu plano.",
    color: "#AF52DE",
    soft: "rgba(175,82,222,.13)",
    gradient:
      "radial-gradient(circle at 86% 8%, rgba(175,82,222,.30), rgba(175,82,222,0) 32%), linear-gradient(135deg, #FAF5FF, #FFFFFF)",
    guideTitle: "Guia para trocar sem perder o plano",
    guideText:
      "Essa opção troca o estímulo do dia, mas mantém uma estrutura organizada para você não abandonar o treino por estar cansado ou sem tempo.",
    keywords: ["troca rápida", "sem bagunçar", "adaptação", "praticidade"],
    exercises: [
      {
        name: "Leg press",
        group: "Pernas",
        sets: 3,
        reps: "12",
        rest: "75s",
        method: "Opção segura para substituir agachamento pesado.",
      },
      {
        name: "Puxada frente",
        group: "Costas",
        sets: 3,
        reps: "12",
        rest: "75s",
        method: "Boa base para manter treino completo.",
      },
      {
        name: "Supino máquina",
        group: "Peito",
        sets: 3,
        reps: "12",
        rest: "75s",
        method: "Mais simples que livre em dias corridos.",
      },
      {
        name: "Elevação lateral",
        group: "Ombros",
        sets: 3,
        reps: "12–15",
        rest: "60s",
        method: "Carga leve e execução limpa.",
      },
      {
        name: "Prancha",
        group: "Core",
        sets: 3,
        reps: "30–45s",
        rest: "45s",
        method: "Finalização rápida.",
      },
    ],
  },
  {
    id: "leve",
    chapter: "05",
    title: "Treino leve",
    short: "Leve",
    subtitle: "Dia cansado, recuperação ou volta ao ritmo.",
    color: "#64D2FF",
    soft: "rgba(100,210,255,.15)",
    gradient:
      "radial-gradient(circle at 86% 8%, rgba(100,210,255,.35), rgba(100,210,255,0) 32%), linear-gradient(135deg, #F0FDFF, #FFFFFF)",
    guideTitle: "Guia para treino leve",
    guideText:
      "Melhor fazer um treino leve bem feito do que faltar. Use menos carga, mais controle e saia melhor do que entrou.",
    keywords: ["controle", "leve", "recuperação", "constância"],
    exercises: [
      {
        name: "Bike leve",
        group: "Cardio",
        sets: 1,
        reps: "8–10min",
        rest: "—",
        method: "Aquecimento sem cansar demais.",
      },
      {
        name: "Agachamento goblet leve",
        group: "Pernas",
        sets: 3,
        reps: "12",
        rest: "60s",
        method: "Carga confortável e amplitude segura.",
      },
      {
        name: "Remada máquina",
        group: "Costas",
        sets: 3,
        reps: "12",
        rest: "60s",
        method: "Controle total, sem roubar.",
      },
      {
        name: "Supino máquina",
        group: "Peito",
        sets: 3,
        reps: "12",
        rest: "60s",
        method: "Movimento limpo e carga moderada.",
      },
      {
        name: "Alongamento curto",
        group: "Mobilidade",
        sets: 1,
        reps: "5min",
        rest: "—",
        method: "Finalize soltando quadril, posterior e costas.",
      },
    ],
  },
  {
    id: "forte",
    chapter: "06",
    title: "Treino forte",
    short: "Forte",
    subtitle: "Mais carga, foco e progressão.",
    color: "#FF375F",
    soft: "rgba(255,55,95,.13)",
    gradient:
      "radial-gradient(circle at 86% 8%, rgba(255,55,95,.32), rgba(255,55,95,0) 32%), linear-gradient(135deg, #FFF1F2, #FFFFFF)",
    guideTitle: "Guia para treino forte",
    guideText:
      "Treino forte não é bagunçado. Use boa técnica, descanso correto e progressão real de carga.",
    keywords: ["carga", "progressão", "descanso", "técnica"],
    exercises: [
      {
        name: "Agachamento",
        group: "Pernas",
        sets: 5,
        reps: "5–8",
        rest: "120s",
        method: "Priorize técnica e carga progressiva.",
      },
      {
        name: "Supino reto",
        group: "Peito",
        sets: 5,
        reps: "5–8",
        rest: "120s",
        method: "Controle a descida e suba com força.",
      },
      {
        name: "Remada curvada",
        group: "Costas",
        sets: 4,
        reps: "6–10",
        rest: "90–120s",
        method: "Tronco firme e puxada forte.",
      },
      {
        name: "Terra romeno",
        group: "Posterior",
        sets: 4,
        reps: "8–10",
        rest: "120s",
        method: "Quadril para trás e coluna neutra.",
      },
      {
        name: "Desenvolvimento",
        group: "Ombros",
        sets: 4,
        reps: "6–10",
        rest: "90s",
        method: "Sem roubar com lombar.",
      },
    ],
  },
];

function makeEditableExercise(ex) {
  return {
    id: uid(),
    name: ex.name || "",
    group: ex.group || "",
    sets: ex.sets ?? 3,
    reps: ex.reps || "10–12",
    rest: ex.rest || "60s",
    method: ex.method || "",
  };
}

export default function MontagemTreino() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedIntentId, setSelectedIntentId] = useState("gluteo");
  const [duration, setDuration] = useState("hoje");
  const [targetDays, setTargetDays] = useState("30");
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openKeyword, setOpenKeyword] = useState(null);

  const selectedIntent = useMemo(() => {
    return INTENTS.find((item) => item.id === selectedIntentId) || INTENTS[0];
  }, [selectedIntentId]);

  useEffect(() => {
    setExercises((selectedIntent.exercises || []).map(makeEditableExercise));
    setOpenKeyword(null);
  }, [selectedIntentId]);

  useEffect(() => {
    let alive = true;

    async function loadUserData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [profileRes, subRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!alive) return;

        if (profileRes.error) {
          console.error("MontagemTreino profile error:", profileRes.error);
        }

        if (subRes.error) {
          console.error("MontagemTreino subscription error:", subRes.error);
        }

        setProfile(profileRes.data || null);
        setSubscription(subRes.data || null);
      } catch (err) {
        console.error("MontagemTreino load catch:", err);
      } finally {
        if (alive) setLoading(false);
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
      setSelectedIntentId("emagrecer");
      return;
    }

    if (objetivo.includes("forca") || objetivo.includes("performance")) {
      setSelectedIntentId("forte");
      return;
    }

    if (objetivo.includes("glute")) {
      setSelectedIntentId("gluteo");
    }
  }, [profile?.objetivo]);

  const isPaid = hasActiveSubscription(subscription);
  const planKey = normalizePlanKey(subscription);

  const guideKeywordText = useMemo(() => {
    if (!openKeyword) return null;

    const map = {
      "pausa no topo": "Segure a contração por 1 segundo no ponto mais forte do movimento.",
      quadril: "Pense em mover o quadril, não a lombar. Isso ajuda a ativar glúteos e posterior.",
      amplitude: "Use uma amplitude segura, sem perder postura ou sentir dor articular.",
      controle: "Controle a ida e a volta do movimento. Evite jogar o peso.",
      "coluna neutra": "Mantenha a coluna alinhada, sem arredondar ou hiperestender.",
      core: "Trave abdômen e respire com controle. O core protege a lombar.",
      "sem dor": "Dor forte, pontada ou irradiação não deve ser ignorada. Reduza carga ou pare.",
      cardio: "Use cardio como ferramenta de constância, não punição.",
      constância: "Resultado vem da repetição semanal, não de um treino perfeito isolado.",
      "gasto calórico": "Musculação + cardio + alimentação bem organizada melhoram o déficit calórico.",
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
      intent: selectedIntent.id,
      duration,
      targetDays: selectedIntent.id === "emagrecer" ? Number(targetDays || 30) : null,
      focusId: selectedIntent.id,
      focusTitle: selectedIntent.title,
      focusSubtitle: selectedIntent.subtitle,
      guide: {
        chapter: selectedIntent.chapter,
        title: selectedIntent.guideTitle,
        text: selectedIntent.guideText,
        keywords: selectedIntent.keywords,
        color: selectedIntent.color,
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
      cardioPlan: selectedIntent.cardioPlan || [],
      exercises: exercises.map((ex, index) => ({
        ...ex,
        order: index + 1,
        sets: numberFrom(ex.sets, 3),
      })),
      createdAt: new Date().toISOString(),
    };
  }, [selectedIntent, duration, targetDays, profile, subscription, isPaid, planKey, exercises]);

  function updateExercise(exerciseId, patch) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, ...patch };
      })
    );
  }

  function removeExercise(exerciseId) {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      makeEditableExercise({
        name: "Novo exercício",
        group: "Grupo muscular",
        sets: 3,
        reps: "10–12",
        rest: "60s",
        method: "Descreva a execução.",
      }),
    ]);
  }

  function moveExercise(exerciseId, dir) {
    setExercises((prev) => {
      const index = prev.findIndex((ex) => ex.id === exerciseId);
      if (index < 0) return prev;

      const nextIndex = clamp(index + dir, 0, prev.length - 1);
      if (nextIndex === index) return prev;

      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);

      return copy;
    });
  }

  async function saveMontage() {
    if (!user?.id || saving) return;

    setSaving(true);

    try {
      localStorage.setItem("fitdeal_quick_workout", JSON.stringify(payload));

      const { data, error } = await supabase
        .from("user_workout_montages")
        .insert({
          user_id: user.id,
          focus_key: payload.focusId,
          title: payload.focusTitle,
          selected_level: String(profile?.nivel || ""),
          selected_days: String(duration || ""),
          payload,
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
        <section style={S.hero}>
          <button type="button" style={S.backBtn} onClick={() => nav("/treino")}>
            ←
          </button>

          <div style={S.heroMain}>
            <div style={S.kicker}>Montagem inteligente</div>
            <h1 style={S.heroTitle}>Vamos alterar seu foco hoje</h1>
            <p style={S.heroSub}>
              Escolha uma intenção. Depois ajuste séries, repetições, descanso e execução do seu jeito.
            </p>

            <div style={S.profileRow}>
              <div style={S.profilePill}>
                <span>Hoje</span>
                <b>{todayLabel()}</b>
              </div>

              <div style={S.profilePill}>
                <span>Objetivo</span>
                <b>{loading ? "..." : profile?.objetivo || "Automático"}</b>
              </div>

              <div style={S.profilePill}>
                <span>Plano</span>
                <b>{isPaid ? planKey || "Ativo" : "Livre"}</b>
              </div>
            </div>
          </div>
        </section>

        <section style={S.bookCard}>
          <div style={S.bookLine}>
            <span>01</span>
            <b>Escolha o treino do dia</b>
          </div>

          <div style={S.intentGrid}>
            {INTENTS.map((item) => {
              const active = item.id === selectedIntentId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIntentId(item.id)}
                  style={{
                    ...S.intentCard,
                    ...(active ? S.intentCardOn : null),
                    background: item.gradient,
                    borderColor: active ? item.color : "rgba(15,23,42,.08)",
                  }}
                >
                  <div style={S.intentTop}>
                    <div
                      style={{
                        ...S.intentDot,
                        background: item.color,
                        boxShadow: active ? `0 0 0 5px ${item.soft}` : "none",
                      }}
                    />
                    <span>{item.chapter}</span>
                  </div>

                  <div style={S.intentTitle}>{item.short}</div>
                  <div style={S.intentSub}>{item.subtitle}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={S.guideCard}>
          <div style={S.bookLine}>
            <span>02</span>
            <b>Guia do foco escolhido</b>
          </div>

          <div style={S.guideInner}>
            <div
              style={{
                ...S.guideIcon,
                background: selectedIntent.color,
                boxShadow: `0 18px 44px ${selectedIntent.soft}`,
              }}
            >
              {selectedIntent.chapter}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={S.guideTitle}>{selectedIntent.guideTitle}</div>
              <div style={S.guideText}>{selectedIntent.guideText}</div>
            </div>
          </div>

          <div style={S.keywordRow}>
            {selectedIntent.keywords.map((word) => {
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
                          background: selectedIntent.color,
                          color: "#fff",
                          borderColor: selectedIntent.color,
                        }
                      : null),
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>

          {guideKeywordText ? (
            <div style={S.keywordBox}>{guideKeywordText}</div>
          ) : null}

          {selectedIntent.id === "emagrecer" ? (
            <div style={S.targetDaysBox}>
              <label style={S.label}>
                Quero emagrecer em quantos dias?
                <div style={S.daysInline}>
                  <input
                    value={targetDays}
                    onChange={(e) => setTargetDays(e.target.value)}
                    inputMode="numeric"
                    style={S.daysInput}
                  />
                  <span>dias</span>
                </div>
              </label>
            </div>
          ) : null}
        </section>

        <section style={S.durationCard}>
          <div style={S.bookLine}>
            <span>03</span>
            <b>Aplicar por quanto tempo?</b>
          </div>

          <div style={S.durationGrid}>
            {[
              { id: "hoje", label: "Só hoje", sub: "Troca rápida" },
              { id: "semana", label: "Semana", sub: "7 dias" },
              { id: "mes", label: "Mês", sub: "Ciclo maior" },
            ].map((item) => {
              const active = duration === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDuration(item.id)}
                  style={{
                    ...S.durationBtn,
                    ...(active
                      ? {
                          borderColor: selectedIntent.color,
                          background: selectedIntent.soft,
                        }
                      : null),
                  }}
                >
                  <b>{item.label}</b>
                  <span>{item.sub}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedIntent.cardioPlan?.length ? (
          <section style={S.cardioPlan}>
            <div style={S.bookLine}>
              <span>+</span>
              <b>Plano de cardio puxadinho</b>
            </div>

            <div style={S.cardioList}>
              {selectedIntent.cardioPlan.map((line, index) => (
                <div key={index} style={S.cardioItem}>
                  <span>{index + 1}</span>
                  <b>{line}</b>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section style={S.editorCard}>
          <div style={S.editorHead}>
            <div>
              <div style={S.bookLine}>
                <span>04</span>
                <b>Edite seu treino</b>
              </div>
              <div style={S.editorSub}>
                Toque nos campos e ajuste séries, repetições, descanso e execução.
              </div>
            </div>

            <button type="button" style={S.addBtn} onClick={addExercise}>
              + Exercício
            </button>
          </div>

          <div style={S.exerciseList}>
            {exercises.map((ex, index) => (
              <article key={ex.id} style={S.exerciseCard}>
                <div style={S.exerciseTop}>
                  <div
                    style={{
                      ...S.exerciseNumber,
                      background: selectedIntent.color,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
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
                  </div>

                  <div style={S.moveBtns}>
                    <button type="button" onClick={() => moveExercise(ex.id, -1)} style={S.moveBtn}>
                      ↑
                    </button>
                    <button type="button" onClick={() => moveExercise(ex.id, 1)} style={S.moveBtn}>
                      ↓
                    </button>
                  </div>
                </div>

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

                <button
                  type="button"
                  style={S.removeBtn}
                  onClick={() => removeExercise(ex.id)}
                >
                  Remover exercício
                </button>
              </article>
            ))}
          </div>
        </section>

        <section style={S.previewCard}>
          <div>
            <div style={S.previewTitle}>Treino pronto para abrir</div>
            <div style={S.previewSub}>
              {selectedIntent.title} • {exercises.length} exercícios • {duration === "hoje" ? "só hoje" : duration}
            </div>
          </div>

          <button type="button" style={S.primaryBtn} onClick={saveMontage} disabled={saving}>
            {saving ? "Salvando..." : "Usar este treino"}
          </button>

          <button type="button" style={S.secondaryBtn} onClick={() => nav("/treino")}>
            Voltar sem salvar
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
    padding: 16,
    paddingBottom: 130,
  },

  wrap: {
    maxWidth: 760,
    margin: "0 auto",
  },

  hero: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 28,
    padding: 15,
    background:
      "radial-gradient(circle at 92% 0%, rgba(255,106,0,.28), rgba(255,106,0,0) 30%), linear-gradient(135deg, rgba(255,255,255,.96), rgba(255,247,237,.96))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 50px rgba(15,23,42,.08)",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
  },

  heroMain: {
    minWidth: 0,
    flex: 1,
  },

  kicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },

  heroTitle: {
    margin: "7px 0 0",
    color: TEXT,
    fontSize: 29,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -1.1,
  },

  heroSub: {
    margin: "10px 0 0",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.42,
    fontWeight: 780,
  },

  profileRow: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  profilePill: {
    borderRadius: 17,
    background: "rgba(255,255,255,.78)",
    border: `1px solid ${BORDER}`,
    padding: 9,
    display: "grid",
    gap: 4,
    minWidth: 0,
  },

  bookCard: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  bookLine: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: TEXT,
    fontSize: 15,
    fontWeight: 980,
    letterSpacing: -0.3,
  },

  intentGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  intentCard: {
    minHeight: 126,
    borderRadius: 22,
    border: `1px solid ${BORDER}`,
    padding: 12,
    textAlign: "left",
    boxShadow: "0 12px 34px rgba(15,23,42,.05)",
    transition: "transform .14s ease, box-shadow .14s ease",
  },

  intentCardOn: {
    transform: "translateY(-1px)",
    boxShadow: "0 16px 44px rgba(15,23,42,.10)",
  },

  intentTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    color: MUTED,
    fontSize: 11,
    fontWeight: 950,
  },

  intentDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },

  intentTitle: {
    marginTop: 22,
    color: TEXT,
    fontSize: 17,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.45,
  },

  intentSub: {
    marginTop: 7,
    color: MUTED,
    fontSize: 12,
    lineHeight: 1.32,
    fontWeight: 800,
  },

  guideCard: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  guideInner: {
    marginTop: 13,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  guideIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: 980,
    flexShrink: 0,
  },

  guideTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: 980,
    letterSpacing: -0.4,
  },

  guideText: {
    marginTop: 7,
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.42,
    fontWeight: 780,
  },

  keywordRow: {
    marginTop: 13,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  keyword: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: "8px 10px",
    background: "rgba(15,23,42,.03)",
    color: TEXT,
    fontSize: 12,
    fontWeight: 900,
  },

  keywordBox: {
    marginTop: 10,
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.04)",
    border: `1px solid ${BORDER}`,
    color: TEXT,
    fontSize: 13,
    lineHeight: 1.38,
    fontWeight: 800,
  },

  targetDaysBox: {
    marginTop: 13,
    borderRadius: 18,
    padding: 12,
    background: "rgba(10,132,255,.08)",
    border: "1px solid rgba(10,132,255,.14)",
  },

  label: {
    display: "grid",
    gap: 8,
    color: MUTED,
    fontSize: 12,
    fontWeight: 950,
  },

  daysInline: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: TEXT,
    fontSize: 14,
    fontWeight: 900,
  },

  daysInput: {
    width: 82,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: "#fff",
    padding: "12px 10px",
    color: TEXT,
    fontSize: 15,
    fontWeight: 950,
    outline: "none",
  },

  durationCard: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  durationGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },

  durationBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 19,
    background: "#fff",
    padding: "11px 8px",
    display: "grid",
    gap: 4,
    color: TEXT,
    textAlign: "center",
  },

  cardioPlan: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "linear-gradient(135deg, rgba(10,132,255,.10), rgba(255,255,255,.96))",
    border: "1px solid rgba(10,132,255,.14)",
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  cardioList: {
    marginTop: 12,
    display: "grid",
    gap: 9,
  },

  cardioItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 18,
    padding: 11,
    background: "rgba(255,255,255,.72)",
    border: `1px solid ${BORDER}`,
    color: TEXT,
    fontSize: 13,
    lineHeight: 1.35,
  },

  editorCard: {
    marginTop: 14,
    borderRadius: 25,
    padding: 14,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  editorHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  editorSub: {
    marginTop: 7,
    color: MUTED,
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 800,
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
    marginTop: 13,
    display: "grid",
    gap: 12,
  },

  exerciseCard: {
    borderRadius: 22,
    padding: 12,
    background: "rgba(248,250,252,.82)",
    border: `1px solid ${BORDER}`,
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

  nameInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: TEXT,
    fontSize: 16,
    fontWeight: 980,
    letterSpacing: -0.35,
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

  moveBtns: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 5,
  },

  moveBtn: {
    width: 30,
    height: 26,
    border: `1px solid ${BORDER}`,
    borderRadius: 11,
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
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

  removeBtn: {
    marginTop: 10,
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: "rgba(255,255,255,.76)",
    color: MUTED,
    padding: 11,
    fontSize: 12,
    fontWeight: 950,
  },

  previewCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 14,
    background:
      "radial-gradient(circle at 88% 10%, rgba(255,106,0,.34), rgba(255,106,0,0) 34%), linear-gradient(135deg, #050506, #121214)",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(0,0,0,.20)",
  },

  previewTitle: {
    fontSize: 20,
    fontWeight: 980,
    letterSpacing: -0.55,
  },

  previewSub: {
    marginTop: 6,
    color: "rgba(255,255,255,.68)",
    fontSize: 13,
    fontWeight: 800,
  },

  primaryBtn: {
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

  secondaryBtn: {
    marginTop: 9,
    width: "100%",
    height: 48,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18,
    background: "rgba(255,255,255,.08)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
  },
};
