import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const SOFT = "#8A8A8A";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";

const WATER_STEP = 250;

const MEAL_LABELS = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Janta",
};

const BASE_RECIPES = {
  cafe: [
    {
      id: "cafe-omelete-aveia",
      title: "Omelete com aveia",
      subtitle: "Proteína + energia logo cedo",
      minutes: 10,
      tags: ["proteína", "rápido", "manhã"],
      goals: ["Hipertrofia", "Performance"],
      calories: 420,
      ingredients: ["2 ovos", "3 colheres de aveia", "1 banana", "canela"],
      steps: [
        "Misture os ovos com a aveia.",
        "Faça a omelete em fogo baixo.",
        "Sirva com banana e canela ao lado.",
      ],
      hydration: "Combine com 500 ml de água ao acordar.",
    },
    {
      id: "cafe-iogurte-frutas",
      title: "Iogurte com frutas e granola",
      subtitle: "Leve, prático e fácil de repetir",
      minutes: 5,
      tags: ["leve", "rápido", "rotina"],
      goals: ["Emagrecimento", "Performance"],
      calories: 320,
      ingredients: ["1 iogurte natural", "frutas picadas", "granola", "chia"],
      steps: [
        "Coloque o iogurte em uma tigela.",
        "Adicione frutas, granola e chia.",
        "Mexa levemente e consuma na hora.",
      ],
      hydration: "Boa opção para manhãs corridas sem perder qualidade.",
    },
    {
      id: "cafe-tapioca-frango",
      title: "Tapioca com frango",
      subtitle: "Mais saciedade e boa densidade nutricional",
      minutes: 12,
      tags: ["saciedade", "proteína", "forte"],
      goals: ["Hipertrofia", "Emagrecimento"],
      calories: 390,
      ingredients: ["2 colheres de goma", "frango desfiado", "queijo branco", "orégano"],
      steps: [
        "Prepare a tapioca na frigideira.",
        "Recheie com frango e queijo branco.",
        "Finalize com orégano.",
      ],
      hydration: "Boa para começar o dia com mais saciedade.",
    },
  ],
  almoco: [
    {
      id: "almoco-frango-arroz",
      title: "Frango, arroz e legumes",
      subtitle: "Base forte para uma rotina consistente",
      minutes: 18,
      tags: ["base", "equilíbrio", "consistência"],
      goals: ["Hipertrofia", "Performance", "Emagrecimento"],
      calories: 560,
      ingredients: ["frango grelhado", "arroz", "legumes", "azeite"],
      steps: [
        "Monte o prato com frango, arroz e legumes.",
        "Adicione azeite por cima dos legumes.",
        "Ajuste a porção ao seu objetivo.",
      ],
      hydration: "Almoço fácil de repetir ao longo da semana.",
    },
    {
      id: "almoco-patinho-batata",
      title: "Patinho com batata e salada",
      subtitle: "Energia limpa para treinar e recuperar",
      minutes: 20,
      tags: ["força", "massa", "almoço"],
      goals: ["Hipertrofia", "Performance"],
      calories: 610,
      ingredients: ["patinho moído", "batata inglesa", "salada", "azeite"],
      steps: [
        "Cozinhe a batata até ficar macia.",
        "Prepare o patinho moído com temperos simples.",
        "Sirva com salada e azeite.",
      ],
      hydration: "Boa combinação para dias de treino mais pesado.",
    },
    {
      id: "almoco-peixe-vegetais",
      title: "Peixe com vegetais e arroz",
      subtitle: "Mais leve sem perder estrutura",
      minutes: 18,
      tags: ["leve", "qualidade", "rotina"],
      goals: ["Emagrecimento", "Performance"],
      calories: 470,
      ingredients: ["filé de peixe", "arroz", "brócolis", "cenoura"],
      steps: [
        "Grelhe o peixe dos dois lados.",
        "Sirva com arroz e vegetais cozidos.",
        "Ajuste o tempero com limão e sal.",
      ],
      hydration: "Boa opção para manter o almoço mais leve.",
    },
  ],
  janta: [
    {
      id: "janta-crepioca-frango",
      title: "Crepioca com frango",
      subtitle: "Janta prática e com boa proteína",
      minutes: 12,
      tags: ["noite", "prático", "proteína"],
      goals: ["Hipertrofia", "Emagrecimento"],
      calories: 410,
      ingredients: ["1 ovo", "goma de tapioca", "frango desfiado", "temperos"],
      steps: [
        "Misture o ovo com a goma.",
        "Prepare a base da crepioca na frigideira.",
        "Recheie com frango desfiado.",
      ],
      hydration: "Boa escolha para uma noite mais prática.",
    },
    {
      id: "janta-carne-salada",
      title: "Carne magra com salada",
      subtitle: "Mais controle sem perder qualidade",
      minutes: 15,
      tags: ["leve", "controle", "noite"],
      goals: ["Emagrecimento", "Performance"],
      calories: 360,
      ingredients: ["carne magra", "folhas", "tomate", "azeite"],
      steps: [
        "Grelhe a carne magra.",
        "Monte a salada com folhas e tomate.",
        "Finalize com azeite.",
      ],
      hydration: "Boa para noites mais leves e objetivas.",
    },
    {
      id: "janta-omelete-legumes",
      title: "Omelete com legumes",
      subtitle: "Simples, rápida e fácil de repetir",
      minutes: 10,
      tags: ["simples", "leve", "rotina"],
      goals: ["Emagrecimento", "Hipertrofia"],
      calories: 330,
      ingredients: ["2 ovos", "legumes picados", "queijo branco", "temperos"],
      steps: [
        "Bata os ovos.",
        "Adicione os legumes picados.",
        "Prepare na frigideira e finalize com queijo branco.",
      ],
      hydration: "Ótima para manter consistência sem esforço.",
    },
  ],
};

function normalizeText(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildWeekStrip(daysCount) {
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const result = [];
  const count = Math.max(5, Math.min(Number(daysCount) || 5, 7));
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    result.push({
      key: d.toISOString().slice(0, 10),
      day: d.getDate(),
      label: labels[d.getDay()],
      isToday: i === 0,
    });
  }

  return result;
}

function getGoalWater(profile) {
  const peso = Number(profile?.peso || 0);
  if (!peso) return 2500;
  const suggested = Math.round(peso * 35);
  return Math.max(2000, Math.min(suggested, 4500));
}

function getSupplements(profile) {
  const objetivo = profile?.objetivo || "Hipertrofia";
  const peso = Number(profile?.peso || 70);

  if (objetivo === "Emagrecimento") {
    return [
      `Whey protein conforme necessidade de proteína diária`,
      `Creatina 3g a 5g por dia`,
      `Cafeína em dias de treino, se fizer sentido para sua rotina`,
    ];
  }

  if (objetivo === "Performance") {
    return [
      `Creatina 3g a 5g por dia`,
      `Whey protein no pós-treino se necessário`,
      `Cafeína em dias de treino mais forte`,
    ];
  }

  return [
    `Creatina 3g a 5g por dia`,
    `Whey protein para complementar proteína diária`,
    `Meta de proteína ajustada ao peso: cerca de ${Math.round(peso * 1.8)}g/dia`,
  ];
}

function generateMealOptions({ mealKey, profile, search, activeChip }) {
  const base = BASE_RECIPES[mealKey] || [];
  const objetivo = profile?.objetivo || "Hipertrofia";

  let items = base.map((recipe) => {
    let emphasis = "";
    if (objetivo === "Hipertrofia") emphasis = "Boa para apoiar ganho de massa com mais consistência.";
    if (objetivo === "Emagrecimento") emphasis = "Boa para manter controle e praticidade no dia a dia.";
    if (objetivo === "Performance") emphasis = "Boa para melhorar rendimento e rotina alimentar.";

    return {
      ...recipe,
      stableId: recipe.id,
      mealKey,
      emphasis,
      favoriteHint: `Salvar ${recipe.title} nos favoritos`,
    };
  });

  if (activeChip === "favoritas") {
    return items;
  }

  if (activeChip && activeChip !== "todos") {
    items = items.filter((item) =>
      item.tags.some((tag) => normalizeText(tag).includes(normalizeText(activeChip)))
    );
  }

  if (search.trim()) {
    const q = normalizeText(search);
    items = items.filter((item) => {
      return (
        normalizeText(item.title).includes(q) ||
        normalizeText(item.subtitle).includes(q) ||
        item.tags.some((tag) => normalizeText(tag).includes(q))
      );
    });
  }

  return items;
}

export default function Nutricao() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const [profile, setProfile] = useState({
    nome: "",
    objetivo: "Hipertrofia",
    peso: "",
    frequencia: 3,
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mealTab, setMealTab] = useState("cafe");
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("todos");
  const [expandedId, setExpandedId] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [waterMl, setWaterMl] = useState(() => {
    const raw = localStorage.getItem(`nutri_water_${email}_${todayKey()}`);
    return raw ? Number(raw) : 0;
  });

  const [favorites, setFavorites] = useState(() => {
    const raw = localStorage.getItem(`nutri_fav_${email}`);
    return raw ? JSON.parse(raw) : [];
  });

  const [repeatPlan, setRepeatPlan] = useState(() => {
    const raw = localStorage.getItem(`nutri_repeat_${email}`);
    return raw ? JSON.parse(raw) : [];
  });

  const paidNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        if (!user?.id) {
          setLoadingProfile(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("nome, objetivo, peso, frequencia")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        setProfile({
          nome:
            data?.nome ||
            user?.user_metadata?.nome ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "",
          objetivo: data?.objetivo || "Hipertrofia",
          peso: data?.peso || "",
          frequencia: data?.frequencia || 3,
        });
      } catch {
        if (!mounted) return;
        setProfile((prev) => ({
          ...prev,
          nome:
            user?.user_metadata?.nome ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "",
        }));
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`nutri_fav_${email}`, JSON.stringify(favorites));
  }, [favorites, email]);

  useEffect(() => {
    localStorage.setItem(`nutri_repeat_${email}`, JSON.stringify(repeatPlan));
  }, [repeatPlan, email]);

  useEffect(() => {
    localStorage.setItem(`nutri_water_${email}_${todayKey()}`, String(waterMl));
  }, [waterMl, email]);

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);
  const waterLeft = Math.max(0, waterGoal - waterMl);
  const waterPct = Math.max(0, Math.min(100, Math.round((waterMl / waterGoal) * 100)));

  const weekStrip = useMemo(() => buildWeekStrip(profile?.frequencia || 3), [profile?.frequencia]);

  const chips = useMemo(
    () => ["todos", "rápido", "leve", "proteína", "rotina"],
    []
  );

  const allOptions = useMemo(() => {
    return generateMealOptions({
      mealKey: mealTab,
      profile,
      search,
      activeChip,
    });
  }, [mealTab, profile, search, activeChip]);

  const visibleOptions = useMemo(() => {
    if (!showOnlyFavorites) return allOptions;
    return allOptions.filter((item) => favorites.includes(item.stableId));
  }, [allOptions, favorites, showOnlyFavorites]);

  const favoriteRecipes = useMemo(() => {
    const all = [...BASE_RECIPES.cafe, ...BASE_RECIPES.almoco, ...BASE_RECIPES.janta];
    return all.filter((item) => favorites.includes(item.id)).slice(0, 6);
  }, [favorites]);

  const suggestion = useMemo(() => {
    const list = visibleOptions.length ? visibleOptions : allOptions;
    return list[0] || null;
  }, [visibleOptions, allOptions]);

  const supplements = useMemo(() => getSupplements(profile), [profile]);

  function isFavorite(id) {
    return favorites.includes(id);
  }

  function toggleFavorite(id) {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [id, ...prev];
    });
  }

  function addWater() {
    setWaterMl((prev) => Math.min(waterGoal, prev + WATER_STEP));
  }

  function removeWater() {
    setWaterMl((prev) => Math.max(0, prev - WATER_STEP));
  }

  function toggleRepeat(item) {
    setRepeatPlan((prev) => {
      if (prev.includes(item.stableId)) {
        return prev.filter((v) => v !== item.stableId);
      }
      return [item.stableId, ...prev].slice(0, 10);
    });
  }

  if (!paidNutriPlus) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.headerCompact}>
            <div style={styles.brand}>Nutri<span style={{ color: ORANGE }}>+</span></div>
          </div>

          <section style={styles.lockedHero}>
            <div style={styles.kicker}>premium nutrition</div>
            <h1 style={styles.titleLocked}>Leve sua alimentação para outro nível.</h1>
            <p style={styles.subLocked}>
              Refeições, receitas, hidratação e uma rotina mais completa para quem quer evoluir de
              verdade dentro do FitDeal.
            </p>

            <button style={styles.mainCta} onClick={() => nav("/planos#nutri")}>
              Liberar Nutri+
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerCompact}>
          <div style={styles.brand}>Nutri<span style={{ color: ORANGE }}>+</span></div>
        </div>

        <section style={styles.heroCard}>
          <div>
            <div style={styles.heroTitle}>
              {loadingProfile
                ? "Sua nutrição"
                : `${profile.nome ? `${profile.nome}, ` : ""}sua nutrição`}
            </div>
            <div style={styles.heroSub}>
              Mais organização, mais constância e uma rotina alimentar mais alinhada com o seu
              objetivo.
            </div>
          </div>

          <div style={styles.heroMini}>
            <div style={styles.heroMiniLabel}>Objetivo</div>
            <div style={styles.heroMiniValue}>{profile.objetivo || "Hipertrofia"}</div>
          </div>
        </section>

        <section style={styles.hydrationSection}>
          <div style={styles.hydrationHeader}>
            <div>
              <div style={styles.hydrationTitle}>Hidratação</div>
              <div style={styles.hydrationSub}>
                {waterMl} ml de {waterGoal} ml • faltam {waterLeft} ml
              </div>
            </div>
            <div style={styles.hydrationPct}>{waterPct}%</div>
          </div>

          <div style={styles.calendarRow}>
            {weekStrip.map((item) => (
              <div
                key={item.key}
                style={{
                  ...styles.calendarPill,
                  ...(item.isToday ? styles.calendarPillActive : null),
                }}
              >
                <div style={styles.calendarLabel}>{item.label}</div>
                <div style={styles.calendarDay}>{item.day}</div>
              </div>
            ))}
          </div>

          <div style={styles.waterCardOld}>
            <button type="button" style={styles.waterBtnSoft} onClick={removeWater}>
              −250 ml
            </button>

            <div style={styles.waterCenter}>
              <div style={styles.waterBig}>{waterMl} ml</div>
              <div style={styles.waterSubOld}>Meta diária sugerida</div>
            </div>

            <button type="button" style={styles.waterBtn} onClick={addWater}>
              +250 ml
            </button>
          </div>
        </section>

        {suggestion ? (
          <section style={styles.suggestionCard}>
            <div style={styles.sectionLabel}>Sugestão do dia</div>
            <div style={styles.suggestionTitle}>{suggestion.title}</div>
            <div style={styles.suggestionSub}>{suggestion.subtitle}</div>

            <div style={styles.inlineTags}>
              {suggestion.tags.slice(0, 3).map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <button
              type="button"
              style={styles.secondaryAction}
              onClick={() =>
                setExpandedId((prev) => (prev === suggestion.stableId ? null : suggestion.stableId))
              }
            >
              Ver detalhes
            </button>
          </section>
        ) : null}

        {favoriteRecipes.length > 0 ? (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Salvos</div>
            <div style={styles.horizontalScroll}>
              {favoriteRecipes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  style={styles.savedCard}
                  onClick={() => {
                    const mealKey = Object.keys(BASE_RECIPES).find((key) =>
                      BASE_RECIPES[key].some((r) => r.id === item.id)
                    );
                    if (mealKey) setMealTab(mealKey);
                    setExpandedId(item.id);
                    setShowOnlyFavorites(false);
                  }}
                >
                  <div style={styles.savedCardTitle}>{item.title}</div>
                  <div style={styles.savedCardSub}>{item.subtitle}</div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section style={styles.section}>
          <div style={styles.segmentWrap}>
            {Object.keys(MEAL_LABELS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMealTab(key);
                  setExpandedId(null);
                }}
                style={{
                  ...styles.segmentBtn,
                  ...(mealTab === key ? styles.segmentBtnActive : null),
                }}
              >
                {MEAL_LABELS[key]}
              </button>
            ))}
          </div>

          <div style={styles.searchWrap}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar refeição, receita ou tag"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.chipsRow}>
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveChip(chip)}
                style={{
                  ...styles.chip,
                  ...(activeChip === chip ? styles.chipActive : null),
                }}
              >
                {chip}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowOnlyFavorites((prev) => !prev)}
              style={{
                ...styles.chip,
                ...(showOnlyFavorites ? styles.chipActive : null),
              }}
            >
              favoritas
            </button>
          </div>
        </section>

        <section style={styles.recipeList}>
          {visibleOptions.map((item) => {
            const open = expandedId === item.stableId;
            const favorite = isFavorite(item.stableId);
            const repeating = repeatPlan.includes(item.stableId);

            return (
              <div
                key={item.stableId}
                style={{
                  ...styles.recipeCard,
                  ...(open ? styles.recipeCardOpen : null),
                }}
              >
                <div style={styles.recipeHead}>
                  <button
                    type="button"
                    style={styles.recipeMainButton}
                    onClick={() => setExpandedId((prev) => (prev === item.stableId ? null : item.stableId))}
                  >
                    <div style={styles.recipeTitle}>{item.title}</div>
                    <div style={styles.recipeSub}>{item.subtitle}</div>

                    <div style={styles.metaRow}>
                      <span style={styles.metaPill}>{item.minutes} min</span>
                      <span style={styles.metaPill}>{item.calories} kcal</span>
                      <span style={styles.metaPill}>{item.mealKey}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label={item.favoriteHint}
                    onClick={() => toggleFavorite(item.stableId)}
                    style={{
                      ...styles.starButton,
                      ...(favorite ? styles.starButtonActive : null),
                    }}
                  >
                    {favorite ? "★" : "☆"}
                  </button>
                </div>

                <div
                  style={{
                    ...styles.expandArea,
                    maxHeight: open ? 420 : 0,
                    opacity: open ? 1 : 0,
                    marginTop: open ? 14 : 0,
                  }}
                >
                  <div style={styles.expandText}>{item.emphasis}</div>

                  <div style={styles.expandBlockTitle}>Ingredientes</div>
                  <div style={styles.inlineList}>
                    {item.ingredients.map((v) => (
                      <span key={v} style={styles.tagSoft}>
                        {v}
                      </span>
                    ))}
                  </div>

                  <div style={styles.expandBlockTitle}>Como fazer</div>
                  <div style={styles.stepsCol}>
                    {item.steps.map((stepText, idx) => (
                      <div key={stepText} style={styles.stepRow}>
                        <div style={styles.stepIndex}>{idx + 1}</div>
                        <div style={styles.stepText}>{stepText}</div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.noteCard}>{item.hydration}</div>

                  <div style={styles.actionRow}>
                    <button
                      type="button"
                      style={styles.actionBtnSoft}
                      onClick={() => toggleRepeat(item)}
                    >
                      {repeating ? "Remover de amanhã" : "Repetir amanhã"}
                    </button>

                    <button
                      type="button"
                      style={styles.actionBtn}
                      onClick={() => toggleFavorite(item.stableId)}
                    >
                      {favorite ? "Remover favorito" : "Salvar favorito"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!visibleOptions.length ? (
            <div style={styles.emptyState}>
              Nenhuma receita encontrada com esse filtro.
            </div>
          ) : null}
        </section>

        <section style={styles.section}>
          <div style={styles.supplementBalloon}>
            <div style={styles.supplementHeader}>
              <div>
                <div style={styles.sectionTitle}>Suplementação</div>
                <div style={styles.supplementSub}>
                  Sugestões alinhadas ao seu objetivo atual.
                </div>
              </div>

              <button type="button" style={styles.supplementBtn}>
                Ver plano
              </button>
            </div>

            <div style={styles.supplementCard}>
              {supplements.map((item) => (
                <div key={item} style={styles.simpleBulletRow}>
                  <div style={styles.simpleDot} />
                  <div style={styles.simpleBulletText}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 18,
    paddingBottom: 120,
  },

  wrap: {
    maxWidth: 620,
    margin: "0 auto",
  },

  headerCompact: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: "rgba(247,247,245,.75)",
    paddingBottom: 12,
    marginBottom: 8,
  },

  brand: {
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: -1,
    color: BLACK,
    paddingTop: 4,
  },

  kicker: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: SOFT,
  },

  titleLocked: {
    margin: 0,
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: -1.2,
    color: BLACK,
  },

  subLocked: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.55,
    fontWeight: 600,
    color: GRAY,
    maxWidth: 480,
  },

  lockedHero: {
    paddingTop: 12,
  },

  mainCta: {
    marginTop: 22,
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.2,
  },

  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-end",
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 28px rgba(0,0,0,.04)",
  },

  heroTitle: {
    fontSize: 30,
    lineHeight: 1.02,
    fontWeight: 800,
    letterSpacing: -1.1,
    color: BLACK,
  },

  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 600,
    color: GRAY,
    maxWidth: 420,
  },

  heroMini: {
    minWidth: 112,
    padding: 12,
    borderRadius: 18,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
  },

  heroMiniLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: 800,
    color: SOFT,
  },

  heroMiniValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 800,
    color: BLACK,
  },

  hydrationSection: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 28px rgba(0,0,0,.04)",
  },

  hydrationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },

  hydrationTitle: {
    fontSize: 24,
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: -0.7,
    color: BLACK,
  },

  hydrationSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.45,
    color: GRAY,
    fontWeight: 600,
  },

  hydrationPct: {
    fontSize: 26,
    lineHeight: 1,
    fontWeight: 800,
    color: ORANGE,
    letterSpacing: -0.8,
  },

  calendarRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    marginBottom: 14,
  },

  calendarPill: {
    minWidth: 60,
    padding: "12px 10px",
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    textAlign: "center",
  },

  calendarPillActive: {
    background: "#FFF7F1",
    borderColor: "rgba(255,106,0,.28)",
  },

  calendarLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: SOFT,
  },

  calendarDay: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: 800,
    color: BLACK,
  },

  waterCardOld: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 110px",
    gap: 10,
    alignItems: "center",
  },

  waterCenter: {
    textAlign: "center",
  },

  waterBig: {
    fontSize: 28,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -0.8,
  },

  waterSubOld: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 1.4,
    color: GRAY,
    fontWeight: 600,
  },

  waterBtn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 13,
    fontWeight: 800,
  },

  waterBtnSoft: {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontSize: 13,
    fontWeight: 800,
  },

  suggestionCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    background: BLACK,
    color: WHITE,
    boxShadow: "0 16px 36px rgba(0,0,0,.12)",
  },

  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: 800,
    color: "rgba(255,255,255,.65)",
  },

  suggestionTitle: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 1.06,
    fontWeight: 800,
    letterSpacing: -0.6,
  },

  suggestionSub: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 1.45,
    fontWeight: 600,
    color: "rgba(255,255,255,.78)",
  },

  inlineTags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },

  tag: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.08)",
    fontSize: 11.5,
    fontWeight: 700,
    color: WHITE,
  },

  secondaryAction: {
    marginTop: 16,
    height: 44,
    padding: "0 16px",
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 14,
    fontWeight: 800,
  },

  section: {
    marginTop: 14,
    paddingTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 1.2,
    fontWeight: 800,
    color: BLACK,
    marginBottom: 12,
  },

  horizontalScroll: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 2,
  },

  savedCard: {
    minWidth: 190,
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    textAlign: "left",
    boxShadow: "0 8px 20px rgba(0,0,0,.03)",
  },

  savedCardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: BLACK,
  },

  savedCardSub: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 1.45,
    color: GRAY,
    fontWeight: 600,
  },

  segmentWrap: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 2,
  },

  segmentBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  segmentBtnActive: {
    background: BLACK,
    color: WHITE,
    borderColor: BLACK,
  },

  searchWrap: {
    marginTop: 12,
  },

  searchInput: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    padding: "0 14px",
    fontSize: 14,
    color: BLACK,
    outline: "none",
  },

  chipsRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginTop: 12,
    paddingBottom: 2,
  },

  chip: {
    height: 36,
    padding: "0 12px",
    borderRadius: 999,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontSize: 12.5,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  chipActive: {
    background: "#FFF7F1",
    borderColor: "rgba(255,106,0,.28)",
    color: BLACK,
  },

  recipeList: {
    display: "grid",
    gap: 12,
    marginTop: 14,
  },

  recipeCard: {
    borderRadius: 22,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    padding: 16,
    boxShadow: "0 8px 22px rgba(0,0,0,.03)",
    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
  },

  recipeCardOpen: {
    borderColor: "rgba(255,106,0,.28)",
    boxShadow: "0 12px 30px rgba(255,106,0,.08)",
  },

  recipeHead: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  recipeMainButton: {
    flex: 1,
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: 0,
  },

  recipeTitle: {
    fontSize: 18,
    lineHeight: 1.15,
    fontWeight: 800,
    color: BLACK,
  },

  recipeSub: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 1.45,
    color: GRAY,
    fontWeight: 600,
  },

  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },

  metaPill: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    fontSize: 11.5,
    fontWeight: 700,
    color: BLACK,
  },

  starButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontSize: 18,
    flexShrink: 0,
  },

  starButtonActive: {
    borderColor: "rgba(255,106,0,.28)",
    background: "#FFF7F1",
    color: ORANGE,
  },

  expandArea: {
    overflow: "hidden",
    transition: "all 220ms cubic-bezier(.22,1,.36,1)",
  },

  expandText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: GRAY,
    fontWeight: 600,
  },

  expandBlockTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: SOFT,
    fontWeight: 800,
  },

  inlineList: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  tagSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 700,
    color: BLACK,
  },

  stepsCol: {
    display: "grid",
    gap: 10,
  },

  stepRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },

  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    background: "#FFF1E8",
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
    marginTop: 1,
  },

  stepText: {
    fontSize: 13.5,
    lineHeight: 1.5,
    color: BLACK,
    fontWeight: 600,
  },

  noteCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: GRAY,
    fontWeight: 600,
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 14,
  },

  actionBtn: {
    height: 44,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 13,
    fontWeight: 800,
  },

  actionBtnSoft: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontSize: 13,
    fontWeight: 800,
  },

  emptyState: {
    padding: 16,
    borderRadius: 18,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    color: GRAY,
    fontSize: 14,
    fontWeight: 600,
  },

  supplementBalloon: {
    padding: 16,
    borderRadius: 22,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 8px 22px rgba(0,0,0,.03)",
  },

  supplementHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  supplementSub: {
    marginTop: -6,
    fontSize: 12.5,
    color: GRAY,
    fontWeight: 600,
  },

  supplementBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  supplementCard: {
    display: "grid",
    gap: 12,
  },

  simpleBulletRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },

  simpleDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    marginTop: 7,
    flexShrink: 0,
  },

  simpleBulletText: {
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 600,
    color: BLACK,
  },
};
