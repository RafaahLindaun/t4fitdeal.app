import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";
const BLACK = "#0B0B0C";

function stripAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugifyExercise(name) {
  return stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");
}

function gifCandidates(name) {
  const slug = slugifyExercise(name);
  return [`/gifs/${slug}.GIF`, `/gifs/${slug}.gif`, `/publicgifs/${slug}.GIF`, `/publicgifs/${slug}.gif`];
}

function SafeExerciseImage({ name, fallback = "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.92))" }) {
  const candidates = gifCandidates(name);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{ ...S.exerciseImageFallback, background: fallback }}>
        <div style={S.imageBadge}>FIT</div>
      </div>
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt={name}
      style={S.exerciseImage}
      onError={() => {
        if (idx < candidates.length - 1) {
          setIdx((v) => v + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

const QUICK_FOCUSES = [
  {
    id: "gluteo",
    title: "Foco em glúteo",
    sub: "Mais ativação, posterior e estabilidade.",
    tag: "Mais procurado",
    image: "linear-gradient(135deg, rgba(255,106,0,.22), rgba(255,255,255,.92))",
    exercises: [
      { name: "Hip thrust", group: "Glúteos", sets: 4, reps: "8–12", rest: "90–120s", method: "Pausa de 1s no topo" },
      { name: "Agachamento sumô", group: "Glúteos/Pernas", sets: 4, reps: "10–12", rest: "90s", method: "Amplitude controlada" },
      { name: "Cadeira abdutora", group: "Glúteo médio", sets: 4, reps: "12–20", rest: "60s", method: "Controle total" },
      { name: "Kickback no cabo", group: "Glúteos", sets: 3, reps: "12–15", rest: "60s", method: "Sem jogar lombar" },
      { name: "Terra romeno", group: "Posterior/Glúteos", sets: 4, reps: "8–12", rest: "90–120s", method: "Quadril para trás" },
      { name: "Elevação pélvica", group: "Glúteos", sets: 3, reps: "12–15", rest: "75s", method: "Finalizar queimando" },
    ],
  },
  {
    id: "lombar",
    title: "Foco em lombares",
    sub: "Base, postura, core e posterior.",
    tag: "Postura",
    image: "linear-gradient(135deg, rgba(15,23,42,.10), rgba(255,255,255,.96))",
    exercises: [
      { name: "Hiperextensão lombar", group: "Lombar", sets: 3, reps: "12–15", rest: "60–75s", method: "Subida controlada" },
      { name: "Terra romeno", group: "Posterior/Lombar", sets: 4, reps: "8–12", rest: "90–120s", method: "Coluna neutra" },
      { name: "Good morning", group: "Lombar/Posterior", sets: 3, reps: "10–12", rest: "90s", method: "Carga leve/moderada" },
      { name: "Prancha", group: "Core", sets: 4, reps: "30–45s", rest: "45s", method: "Abdômen travado" },
      { name: "Dead bug", group: "Core", sets: 3, reps: "10–12", rest: "45s", method: "Controle respiratório" },
      { name: "Remada baixa", group: "Costas/Postura", sets: 4, reps: "10–12", rest: "75–90s", method: "Escápulas firmes" },
    ],
  },
  {
    id: "hipertrofia",
    title: "Hipertrofia rápida",
    sub: "Treino cheio, visual e simples de seguir.",
    tag: "Massa",
    image: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(15,23,42,.06))",
    exercises: [
      { name: "Supino reto", group: "Peito", sets: 4, reps: "6–12", rest: "90s", method: "Progressão de carga" },
      { name: "Puxada frente", group: "Costas", sets: 4, reps: "8–12", rest: "90s", method: "Peito alto" },
      { name: "Leg press", group: "Pernas", sets: 4, reps: "10–15", rest: "90–120s", method: "Amplitude segura" },
      { name: "Desenvolvimento com halteres", group: "Ombros", sets: 3, reps: "8–12", rest: "75s", method: "Sem roubar" },
      { name: "Rosca direta", group: "Bíceps", sets: 3, reps: "8–12", rest: "60s", method: "Cotovelo fixo" },
      { name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "10–15", rest: "60s", method: "Estender completo" },
    ],
  },
  {
    id: "emagrecimento",
    title: "Emagrecimento",
    sub: "Mais gasto, ritmo e treino sem enrolação.",
    tag: "Queima",
    image: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,178,107,.16))",
    exercises: [
      { name: "Agachamento livre", group: "Pernas", sets: 4, reps: "12–15", rest: "60–75s", method: "Ritmo constante" },
      { name: "Remada baixa", group: "Costas", sets: 4, reps: "10–12", rest: "60–75s", method: "Controle" },
      { name: "Supino inclinado", group: "Peito", sets: 3, reps: "10–12", rest: "60s", method: "Sem pausa longa" },
      { name: "Cadeira extensora", group: "Quadríceps", sets: 3, reps: "12–15", rest: "45–60s", method: "Queima controlada" },
      { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "12–15", rest: "45–60s", method: "Amplitude limpa" },
      { name: "Prancha", group: "Core", sets: 3, reps: "30–45s", rest: "45s", method: "Finalização" },
    ],
  },
  {
    id: "iniciante",
    title: "Iniciante seguro",
    sub: "Fácil de entender e difícil de errar.",
    tag: "Começo",
    image: "linear-gradient(135deg, rgba(15,23,42,.08), rgba(255,255,255,.96))",
    exercises: [
      { name: "Leg press", group: "Pernas", sets: 3, reps: "12", rest: "75s", method: "Aprender amplitude" },
      { name: "Puxada frente", group: "Costas", sets: 3, reps: "12", rest: "75s", method: "Movimento controlado" },
      { name: "Supino máquina", group: "Peito", sets: 3, reps: "12", rest: "75s", method: "Carga confortável" },
      { name: "Cadeira flexora", group: "Posterior", sets: 3, reps: "12", rest: "60s", method: "Sem pressa" },
      { name: "Elevação lateral", group: "Ombros", sets: 3, reps: "12", rest: "60s", method: "Carga leve" },
      { name: "Abdominal crunch", group: "Core", sets: 3, reps: "12–15", rest: "45s", method: "Controle" },
    ],
  },
];

function normalizePlanKey(plan) {
  return String(plan?.plan_key || plan?.plan || plan?.name || "")
    .toLowerCase()
    .trim();
}

function hasActiveSubscription(subscription) {
  const status = String(subscription?.status || "").toLowerCase();
  return ["active", "trialing"].includes(status);
}

export default function MontagemTreino() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedFocus, setSelectedFocus] = useState("gluteo");
  const [selectedLevel, setSelectedLevel] = useState("auto");
  const [selectedDays, setSelectedDays] = useState("auto");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

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
      setLoading(false);
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const activePlan = hasActiveSubscription(subscription);
  const planKey = normalizePlanKey(subscription);

  const suggestedFocus = useMemo(() => {
    const objetivo = String(profile?.objetivo || "").toLowerCase();

    if (objetivo.includes("emagrec")) return "emagrecimento";
    if (objetivo.includes("performance")) return "hipertrofia";
    if (objetivo.includes("hipertrofia")) return "hipertrofia";

    return "gluteo";
  }, [profile?.objetivo]);

  useEffect(() => {
    if (suggestedFocus) setSelectedFocus(suggestedFocus);
  }, [suggestedFocus]);

  const currentFocus = useMemo(() => {
    return QUICK_FOCUSES.find((item) => item.id === selectedFocus) || QUICK_FOCUSES[0];
  }, [selectedFocus]);

  const profileLevel = String(profile?.nivel || "").trim() || "Não informado";
  const profileSplit = String(profile?.split || "").trim() || "Automático";
  const profileFrequency = profile?.frequencia || "auto";

  const finalLevel = selectedLevel === "auto" ? profileLevel : selectedLevel;
  const finalDays = selectedDays === "auto" ? profileFrequency : selectedDays;

  const generatedPlan = useMemo(() => {
    const base = currentFocus.exercises.map((ex, index) => ({
      ...ex,
      id: `${currentFocus.id}_${index + 1}`,
      order: index + 1,
      focus: currentFocus.title,
      level: finalLevel,
      days: finalDays,
    }));

    return {
      source: "montagem",
      createdAt: new Date().toISOString(),
      focusId: currentFocus.id,
      focusTitle: currentFocus.title,
      focusSubtitle: currentFocus.sub,
      userId: user?.id || null,
      profile: {
        objetivo: profile?.objetivo || null,
        nivel: profile?.nivel || null,
        split: profile?.split || null,
        frequencia: profile?.frequencia || null,
      },
      subscription: {
        active: activePlan,
        planKey,
        status: subscription?.status || null,
      },
      exercises: base,
    };
  }, [currentFocus, finalLevel, finalDays, user?.id, profile, activePlan, planKey, subscription?.status]);

  function saveAndOpenDetail() {
    try {
      localStorage.setItem("fitdeal_quick_workout", JSON.stringify(generatedPlan));
    } catch (err) {
      console.error("save quick workout localStorage:", err);
    }

    nav("/treino/detalhe?source=montagem");
  }

  async function saveAsCurrentWorkout() {
    try {
      localStorage.setItem("fitdeal_quick_workout", JSON.stringify(generatedPlan));

      if (user?.id) {
        await supabase.from("user_workout_montages").insert({
          user_id: user.id,
          focus_key: generatedPlan.focusId,
          title: generatedPlan.focusTitle,
          payload: generatedPlan,
        });
      }
    } catch (err) {
      console.error("save montage:", err);
    }

    nav("/treino/detalhe?source=montagem");
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <section style={S.hero}>
          <button type="button" style={S.backBtn} onClick={() => nav("/treino")}>
            ←
          </button>

          <div style={S.heroBody}>
            <div style={S.kicker}>Montagem rápida</div>
            <h1 style={S.title}>Monte seu treino sem complicar.</h1>
            <p style={S.sub}>
              Escolha o foco, veja os exercícios com imagens e abra direto no treino detalhe.
            </p>

            <div style={S.profileStrip}>
              <div style={S.profilePill}>
                <span>Objetivo</span>
                <b>{loading ? "..." : profile?.objetivo || "Automático"}</b>
              </div>

              <div style={S.profilePill}>
                <span>Nível</span>
                <b>{loading ? "..." : profileLevel}</b>
              </div>

              <div style={S.profilePill}>
                <span>Plano</span>
                <b>{activePlan ? planKey || "Ativo" : "Livre"}</b>
              </div>
            </div>
          </div>
        </section>

        <section style={S.blackCta}>
          <div>
            <div style={S.blackKicker}>Novo jeito de treinar</div>
            <div style={S.blackTitle}>Não sabe personalizar?</div>
            <div style={S.blackText}>
              Use a montagem rápida. Ela interpreta seu onboarding e sugere uma base pronta.
            </div>
          </div>

          <button type="button" style={S.blackBtn} onClick={saveAndOpenDetail}>
            Abrir treino
          </button>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Escolha o foco</div>

          <div style={S.focusGrid}>
            {QUICK_FOCUSES.map((item) => {
              const active = item.id === selectedFocus;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedFocus(item.id)}
                  style={{
                    ...S.focusCard,
                    ...(active ? S.focusCardActive : null),
                    background: item.image,
                  }}
                >
                  <div style={S.focusTop}>
                    <span style={S.focusTag}>{item.tag}</span>
                    <span style={{ ...S.focusDot, ...(active ? S.focusDotActive : null) }} />
                  </div>

                  <div style={S.focusTitle}>{item.title}</div>
                  <div style={S.focusSub}>{item.sub}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <div style={S.sectionTitle}>Preview do treino</div>
              <div style={S.sectionSub}>
                {currentFocus.title} • {generatedPlan.exercises.length} exercícios
              </div>
            </div>

            <button type="button" style={S.smallBtn} onClick={saveAndOpenDetail}>
              Ver detalhe
            </button>
          </div>

          <div style={S.exerciseList}>
            {generatedPlan.exercises.map((ex) => (
              <article key={ex.id} style={S.exerciseCard}>
                <SafeExerciseImage name={ex.name} fallback={currentFocus.image} />

                <div style={S.exerciseBody}>
                  <div style={S.exerciseTop}>
                    <div>
                      <div style={S.exerciseName}>{ex.name}</div>
                      <div style={S.exerciseGroup}>{ex.group}</div>
                    </div>

                    <div style={S.orderBadge}>{ex.order}</div>
                  </div>

                  <div style={S.exerciseMeta}>
                    <span>{ex.sets} séries</span>
                    <span>{ex.reps}</span>
                    <span>{ex.rest}</span>
                  </div>

                  <div style={S.methodBox}>{ex.method}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Ajustes rápidos</div>

          <div style={S.adjustGrid}>
            <label style={S.label}>
              Nível
              <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} style={S.input}>
                <option value="auto">Usar onboarding</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </label>

            <label style={S.label}>
              Dias por semana
              <select value={selectedDays} onChange={(e) => setSelectedDays(e.target.value)} style={S.input}>
                <option value="auto">Usar onboarding</option>
                <option value="2">2 dias</option>
                <option value="3">3 dias</option>
                <option value="4">4 dias</option>
                <option value="5">5 dias</option>
                <option value="6">6 dias</option>
              </select>
            </label>
          </div>
        </section>

        <div style={S.bottomActions}>
          <button type="button" style={S.secondary} onClick={() => nav("/treino/personalizar")}>
            Personalizar avançado
          </button>

          <button type="button" style={S.primary} onClick={saveAsCurrentWorkout}>
            Usar este treino
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: 18,
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
    borderRadius: 30,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,255,255,.96))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.84)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
  },

  heroBody: {
    minWidth: 0,
    flex: 1,
  },

  kicker: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  title: {
    margin: "8px 0 0",
    color: TEXT,
    fontSize: 33,
    lineHeight: 0.98,
    fontWeight: 980,
    letterSpacing: -1.3,
  },

  sub: {
    margin: "12px 0 0",
    color: MUTED,
    fontSize: 15,
    lineHeight: 1.45,
    fontWeight: 780,
  },

  profileStrip: {
    marginTop: 15,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  profilePill: {
    borderRadius: 18,
    background: "rgba(255,255,255,.72)",
    border: `1px solid ${BORDER}`,
    padding: 10,
    display: "grid",
    gap: 5,
  },

  blackCta: {
    marginTop: 16,
    borderRadius: 28,
    padding: 18,
    background:
      "radial-gradient(circle at 86% 10%, rgba(255,106,0,.36), rgba(255,106,0,0) 34%), linear-gradient(135deg, #050506, #121214)",
    color: "#fff",
    boxShadow: "0 24px 70px rgba(0,0,0,.20)",
    display: "grid",
    gap: 16,
  },

  blackKicker: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,.58)",
  },

  blackTitle: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.8,
  },

  blackText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.45,
    color: "rgba(255,255,255,.68)",
    fontWeight: 750,
  },

  blackBtn: {
    height: 54,
    border: "none",
    borderRadius: 19,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 15,
    fontWeight: 950,
    boxShadow: "0 18px 44px rgba(255,106,0,.28)",
  },

  section: {
    marginTop: 22,
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.7,
  },

  sectionSub: {
    marginTop: 6,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  focusGrid: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  focusCard: {
    minHeight: 154,
    borderRadius: 25,
    border: `1px solid ${BORDER}`,
    padding: 14,
    textAlign: "left",
    boxShadow: "0 16px 44px rgba(15,23,42,.07)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  focusCardActive: {
    border: "1px solid rgba(255,106,0,.42)",
    boxShadow: "0 18px 54px rgba(255,106,0,.16)",
    transform: "translateY(-1px)",
  },

  focusTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  focusTag: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.78)",
    color: TEXT,
    fontSize: 11,
    fontWeight: 950,
  },

  focusDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    border: "2px solid rgba(15,23,42,.14)",
    background: "#fff",
  },

  focusDotActive: {
    borderColor: ORANGE,
    background: ORANGE,
    boxShadow: "inset 0 0 0 5px #fff",
  },

  focusTitle: {
    marginTop: 22,
    color: TEXT,
    fontSize: 18,
    fontWeight: 980,
    letterSpacing: -0.45,
  },

  focusSub: {
    marginTop: 7,
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 800,
  },

  smallBtn: {
    border: "none",
    borderRadius: 999,
    padding: "11px 14px",
    background: BLACK,
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  exerciseList: {
    display: "grid",
    gap: 13,
  },

  exerciseCard: {
    borderRadius: 25,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 46px rgba(15,23,42,.07)",
    overflow: "hidden",
  },

  exerciseImage: {
    width: "100%",
    height: 168,
    objectFit: "cover",
    display: "block",
    background: SOFT,
  },

  exerciseImageFallback: {
    width: "100%",
    height: 168,
    display: "grid",
    placeItems: "center",
  },

  imageBadge: {
    width: 72,
    height: 72,
    borderRadius: 28,
    display: "grid",
    placeItems: "center",
    background: BLACK,
    color: "#fff",
    fontSize: 20,
    fontWeight: 980,
    letterSpacing: -0.6,
  },

  exerciseBody: {
    padding: 14,
  },

  exerciseTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  exerciseName: {
    color: TEXT,
    fontSize: 18,
    fontWeight: 980,
    letterSpacing: -0.45,
  },

  exerciseGroup: {
    marginTop: 5,
    color: MUTED,
    fontSize: 13,
    fontWeight: 850,
  },

  orderBadge: {
    width: 38,
    height: 38,
    borderRadius: 15,
    background: "rgba(255,106,0,.12)",
    color: TEXT,
    display: "grid",
    placeItems: "center",
    fontWeight: 980,
  },

  exerciseMeta: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },

  methodBox: {
    marginTop: 11,
    borderRadius: 17,
    background: "rgba(255,106,0,.08)",
    border: "1px solid rgba(255,106,0,.14)",
    padding: 12,
    color: TEXT,
    fontSize: 13,
    fontWeight: 850,
  },

  adjustGrid: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  label: {
    display: "grid",
    gap: 7,
    color: MUTED,
    fontSize: 12,
    fontWeight: 950,
  },

  input: {
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: 17,
    background: "#fff",
    color: TEXT,
    padding: "13px 12px",
    fontSize: 14,
    fontWeight: 900,
    outline: "none",
  },

  bottomActions: {
    position: "sticky",
    bottom: 14,
    zIndex: 20,
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    gap: 10,
    padding: 10,
    borderRadius: 25,
    background: "rgba(255,255,255,.78)",
    border: "1px solid rgba(255,255,255,.58)",
    boxShadow: "0 22px 70px rgba(15,23,42,.14)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
  },

  secondary: {
    height: 54,
    borderRadius: 19,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontSize: 13,
    fontWeight: 950,
  },

  primary: {
    height: 54,
    border: "none",
    borderRadius: 19,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 14,
    fontWeight: 980,
    boxShadow: "0 16px 42px rgba(255,106,0,.24)",
  },
};
