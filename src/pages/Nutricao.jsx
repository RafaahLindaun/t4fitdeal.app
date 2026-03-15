import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { recipeBank } from "../data/recipeBank";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const SOFT = "#8A8A8A";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";

const WATER_STEP = 250;
const INITIAL_KEYWORDS_VISIBLE = 5;
const KEYWORDS_STEP = 2;

const MEAL_LABELS = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Janta",
};

const BASE_RECIPES = recipeBank;

function normalizeText(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function todayKey() {
  return toDateKey(new Date());
}

function getWaterStorageKey(email, dateKey) {
  return `nutri_water_${email}_${dateKey}`;
}

function getWaterHistoryKey(email) {
  return `nutri_water_history_${email}`;
}

function readWaterHistory(email) {
  try {
    const raw = localStorage.getItem(getWaterHistoryKey(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeWaterHistory(email, history) {
  localStorage.setItem(getWaterHistoryKey(email), JSON.stringify(history));
}

function persistWaterForDate(email, dateKey, ml) {
  const safeMl = Math.max(0, Number(ml) || 0);
  localStorage.setItem(getWaterStorageKey(email, dateKey), String(safeMl));

  const history = readWaterHistory(email);
  history[dateKey] = safeMl;
  writeWaterHistory(email, history);
}

function getWaterForDate(email, dateKey) {
  const direct = localStorage.getItem(getWaterStorageKey(email, dateKey));
  if (direct !== null) return Math.max(0, Number(direct) || 0);

  const history = readWaterHistory(email);
  return Math.max(0, Number(history?.[dateKey]) || 0);
}

function buildWeekStrip(daysCount, email, waterGoal) {
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const result = [];
  const count = Math.max(3, Math.min(Number(daysCount) || 3, 7));
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = toDateKey(d);
    const total = getWaterForDate(email, key);
    const done = waterGoal > 0 ? total >= waterGoal : false;

    result.push({
      key,
      day: d.getDate(),
      label: labels[d.getDay()],
      isToday: i === 0,
      total,
      done,
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
      `Cafeína em dias de treino`,
    ];
  }

  if (objetivo === "Performance") {
    return [
      `Creatina 3g a 5g por dia`,
      `Whey protein no pós treino`,
      `Cafeína em dias de treino forte`,
    ];
  }

  return [
    `Creatina 3g a 5g por dia`,
    `Whey protein para complementar proteína`,
    `Meta proteína diária cerca de ${Math.round(peso * 1.8)}g`,
  ];
}

function prettifyRecipeTitle(title) {
  const safe = String(title || "").trim();
  if (!safe) return "";

  return safe
    .split(" ")
    .map((part) => {
      if (!part) return part;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function getRecipeKeywords(recipe) {
  const tags = Array.isArray(recipe?.tags) ? recipe.tags : [];
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const keywords = [...tags, ...ingredients]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  return [...new Set(keywords)];
}

function generateMealOptions({ mealKey, profile, search, activeChip }) {
  const base = BASE_RECIPES?.[mealKey] || [];
  const objetivo = profile?.objetivo || "Hipertrofia";

  let items = base.map((recipe) => {
    let emphasis = "";

    if (objetivo === "Hipertrofia") {
      emphasis = "Boa para apoiar ganho de massa com mais consistência.";
    }

    if (objetivo === "Emagrecimento") {
      emphasis = "Boa para ajudar no controle calórico com mais praticidade.";
    }

    if (objetivo === "Performance") {
      emphasis = "Boa para melhorar rendimento e manter energia melhor distribuída.";
    }

    return {
      ...recipe,
      title: prettifyRecipeTitle(recipe.title),
      stableId: recipe.id,
      mealKey,
      emphasis,
      favoriteHint: `Salvar ${recipe.title}`,
      keywords: getRecipeKeywords(recipe),
    };
  });

  if (activeChip && activeChip !== "todos") {
    items = items.filter((item) =>
      item.tags?.some((tag) =>
        normalizeText(tag).includes(normalizeText(activeChip))
      ) ||
      item.keywords?.some((keyword) =>
        normalizeText(keyword).includes(normalizeText(activeChip))
      )
    );
  }

  if (search.trim()) {
    const q = normalizeText(search);

    items = items.filter(
      (item) =>
        normalizeText(item.title).includes(q) ||
        normalizeText(item.subtitle).includes(q) ||
        item.keywords?.some((keyword) => normalizeText(keyword).includes(q))
    );
  }

  return items;
}

function RecipeKeywordList({ item, expandedCount, onMore }) {
  const keywords = item.keywords || [];
  const visibleCount = Math.min(expandedCount, keywords.length);
  const visible = keywords.slice(0, visibleCount);
  const hidden = keywords.length - visibleCount;

  return (
    <div style={styles.keywordRow}>
      {visible.map((keyword) => (
        <span key={`${item.stableId}-${keyword}`} style={styles.keywordPill}>
          {keyword}
        </span>
      ))}

      {hidden > 0 ? (
        <button
          type="button"
          style={styles.moreKeywordBtn}
          onClick={onMore}
        >
          ver mais +{Math.min(KEYWORDS_STEP, hidden)}
        </button>
      ) : null}
    </div>
  );
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
  const [keywordVisibleById, setKeywordVisibleById] = useState({});

  const [favorites, setFavorites] = useState(() => {
    const raw = localStorage.getItem(`nutri_fav_${email}`);
    return raw ? JSON.parse(raw) : [];
  });

  const [waterMl, setWaterMl] = useState(() => getWaterForDate(email, todayKey()));

  const paidNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("nome, objetivo, peso, frequencia")
        .eq("id", user.id)
        .maybeSingle();

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

      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`nutri_fav_${email}`, JSON.stringify(favorites));
  }, [favorites, email]);

  useEffect(() => {
    persistWaterForDate(email, todayKey(), waterMl);
  }, [waterMl, email]);

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);
  const waterLeft = Math.max(0, waterGoal - waterMl);
  const waterPct = waterGoal > 0 ? Math.max(0, Math.min(100, Math.round((waterMl / waterGoal) * 100))) : 0;

  const weekStrip = useMemo(
    () => buildWeekStrip(profile?.frequencia || 3, email, waterGoal),
    [profile?.frequencia, email, waterGoal, waterMl]
  );

  const chips = useMemo(
    () => ["todos", "rápido", "leve", "proteína", "rotina"],
    []
  );

  const options = useMemo(() => {
    return generateMealOptions({
      mealKey: mealTab,
      profile,
      search,
      activeChip,
    });
  }, [mealTab, profile, search, activeChip]);

  const visibleOptions = useMemo(() => {
    return options.map((item) => ({
      ...item,
      isFavorite: favorites.includes(item.stableId),
    }));
  }, [options, favorites]);

  const suggestion = useMemo(() => visibleOptions[0] || null, [visibleOptions]);

  const supplements = useMemo(() => getSupplements(profile), [profile]);

  function addWater(amount = WATER_STEP) {
    setWaterMl((prev) => Math.min(waterGoal, prev + amount));
  }

  function removeWater(amount = WATER_STEP) {
    setWaterMl((prev) => Math.max(0, prev - amount));
  }

  function toggleFavorite(id) {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [id, ...prev];
    });
  }

  function handleMoreKeywords(id, total) {
    setKeywordVisibleById((prev) => {
      const current = prev[id] || INITIAL_KEYWORDS_VISIBLE;
      return {
        ...prev,
        [id]: Math.min(current + KEYWORDS_STEP, total),
      };
    });
  }

  if (!paidNutriPlus) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.headerRow}>
            <div style={styles.brandFit}>
              fitdeal<span style={{ color: ORANGE }}>.</span>
            </div>
            <div style={styles.brand}>
              Nutri<span style={{ color: ORANGE }}>+</span>
            </div>
          </div>

          <section style={styles.lockedHero}>
            <div style={styles.lockedKicker}>premium nutrition</div>
            <h1 style={styles.titleLocked}>Leve sua alimentação para outro nível.</h1>
            <p style={styles.subLocked}>
              Receitas, hidratação e organização alimentar dentro do FitDeal.
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
        <div style={styles.headerRow}>
          <div style={styles.brandFit}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
          <div style={styles.brand}>
            Nutri<span style={{ color: ORANGE }}>+</span>
          </div>
        </div>

        <section style={styles.heroCard}>
          <div>
            <div style={styles.heroTitle}>
              {loadingProfile ? "Sua nutrição" : `${profile.nome}, sua nutrição`}
            </div>

            <div style={styles.heroSub}>
              Rotina alimentar alinhada ao seu objetivo com mais clareza e constância.
            </div>
          </div>

          <div style={styles.heroMini}>
            <div style={styles.heroMiniLabel}>Objetivo</div>
            <div style={styles.heroMiniValue}>{profile.objetivo}</div>
          </div>
        </section>

        <button
          type="button"
          style={styles.suppHeroBtn}
          onClick={() => nav("/suplementacao")}
        >
          <div style={styles.suppHeroTop}>
            <div style={styles.suppHeroKicker}>SUPLEMENTAÇÃO</div>
            <div style={styles.suppHeroArrow}>›</div>
          </div>

          <div style={styles.suppHeroTitle}>
            Plano premium de suplementos<span style={{ color: ORANGE }}>.</span>
          </div>

          <div style={styles.suppHeroSub}>
            Ajustado ao seu objetivo, com orientação rápida e acesso direto.
          </div>
        </button>

        <section style={styles.section}>
          <div style={styles.hydrationHeader}>
            <div>
              <div style={styles.sectionTitleLarge}>
                Hidratação<span style={{ color: ORANGE }}>.</span>
              </div>
              <div style={styles.waterSubTop}>
                {waterMl} ml de {waterGoal} ml • faltam {waterLeft} ml
              </div>
            </div>

            <button
              type="button"
              style={styles.calendarNavBtn}
              onClick={() => nav("/calendario")}
            >
              Calendário
            </button>
          </div>

          <div style={styles.waterCard}>
            <div style={styles.waterProgressBar}>
              <div
                style={{
                  ...styles.waterProgressFill,
                  width: `${waterPct}%`,
                }}
              />
            </div>

            <div style={styles.waterPercentRow}>
              <div style={styles.waterBigPercent}>{waterPct}%</div>
              <div style={styles.waterPercentHint}>marcado pelo total do dia</div>
            </div>

            <div style={styles.weekStrip}>
              {weekStrip.map((item) => (
                <div
                  key={item.key}
                  style={{
                    ...styles.weekPill,
                    ...(item.isToday ? styles.weekPillActive : null),
                    ...(item.done ? styles.weekPillDone : null),
                  }}
                >
                  <div style={styles.weekLabel}>{item.label}</div>
                  <div style={styles.weekDay}>{item.day}</div>
                  <div style={styles.weekMl}>{item.total} ml</div>
                </div>
              ))}
            </div>

            <div style={styles.waterNumbers}>
              <div style={styles.waterBig}>{waterMl} ml</div>
              <div style={styles.waterSub}>
                cerca de {Math.round(waterMl / WATER_STEP)} copos
              </div>
            </div>

            <div style={styles.waterActions}>
              <button style={styles.waterBtnSoft} onClick={() => removeWater(250)}>
                −250 ml
              </button>

              <button style={styles.waterBtn} onClick={() => addWater(250)}>
                +250 ml
              </button>
            </div>
          </div>
        </section>

        {suggestion ? (
          <section style={styles.suggestionCard}>
            <div style={styles.suggestionLabel}>O que fazer agora?</div>
            <div style={styles.suggestionTitle}>{suggestion.title}</div>
            <div style={styles.suggestionSub}>{suggestion.subtitle}</div>

            <div style={styles.suggestionTags}>
              {(suggestion.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <button
              type="button"
              style={styles.suggestionAction}
              onClick={() =>
                setExpandedId((prev) =>
                  prev === suggestion.stableId ? null : suggestion.stableId
                )
              }
            >
              Ver receita
            </button>
          </section>
        ) : null}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Refeições</div>

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
              placeholder="Buscar receita ou palavra-chave"
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
          </div>

          <div style={styles.recipeList}>
            {visibleOptions.map((item) => {
              const open = expandedId === item.stableId;
              const favorite = favorites.includes(item.stableId);
              const totalKeywords = item.keywords?.length || 0;
              const visibleKeywordCount =
                keywordVisibleById[item.stableId] || INITIAL_KEYWORDS_VISIBLE;

              return (
                <div key={item.stableId} style={styles.recipeCard}>
                  <div style={styles.recipeCardTop}>
                    <button
                      style={styles.recipeMainButton}
                      onClick={() => setExpandedId(open ? null : item.stableId)}
                      type="button"
                    >
                      <div style={styles.recipeTitle}>{item.title}</div>
                      <div style={styles.recipeSub}>{item.subtitle}</div>

                      <div style={styles.metaRow}>
                        {item.minutes ? (
                          <span style={styles.metaPill}>{item.minutes} min</span>
                        ) : null}
                        {item.calories ? (
                          <span style={styles.metaPill}>{item.calories} kcal</span>
                        ) : null}
                        <span style={styles.metaPill}>{item.mealKey}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      style={{
                        ...styles.favoriteBtn,
                        ...(favorite ? styles.favoriteBtnActive : null),
                      }}
                      onClick={() => toggleFavorite(item.stableId)}
                      aria-label={favorite ? "Remover favorito" : "Salvar favorito"}
                    >
                      {favorite ? "★" : "☆"}
                    </button>
                  </div>

                  <RecipeKeywordList
                    item={item}
                    expandedCount={visibleKeywordCount}
                    onMore={() => handleMoreKeywords(item.stableId, totalKeywords)}
                  />

                  {open && (
                    <div style={styles.expandArea}>
                      <div style={styles.expandText}>{item.emphasis}</div>

                      <div style={styles.expandBlockTitle}>Ingredientes</div>

                      <div style={styles.ingredientsWrap}>
                        {item.ingredients?.map((v) => (
                          <span key={v} style={styles.ingredientPill}>
                            {v}
                          </span>
                        ))}
                      </div>

                      {item.steps?.length ? (
                        <>
                          <div style={styles.expandBlockTitle}>Como fazer</div>
                          <div style={styles.stepsWrap}>
                            {item.steps.map((step, idx) => (
                              <div key={`${item.stableId}-${idx}`} style={styles.stepRow}>
                                <div style={styles.stepIndex}>{idx + 1}</div>
                                <div style={styles.stepText}>{step}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Suplementação</div>

          <div style={styles.supplementCard}>
            {supplements.map((item) => (
              <div key={item} style={styles.simpleBulletRow}>
                <div style={styles.simpleDot} />
                <div style={styles.simpleBulletText}>{item}</div>
              </div>
            ))}
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

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  brandFit: {
    fontSize: 30,
    fontWeight: 900,
    color: BLACK,
    letterSpacing: -1,
  },

  brand: {
    fontSize: 30,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -1,
  },

  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 26px rgba(0,0,0,.04)",
    marginBottom: 14,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -0.8,
    lineHeight: 1.05,
  },

  heroSub: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY,
    lineHeight: 1.5,
    maxWidth: 420,
  },

  heroMini: {
    minWidth: 112,
    padding: 12,
    borderRadius: 18,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    alignSelf: "flex-end",
  },

  heroMiniLabel: {
    fontSize: 11,
    color: SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: 800,
  },

  heroMiniValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 800,
    color: BLACK,
  },

  suppHeroBtn: {
    width: "100%",
    padding: 18,
    borderRadius: 24,
    border: "none",
    background: BLACK,
    color: WHITE,
    textAlign: "left",
    marginBottom: 18,
    boxShadow: "0 14px 34px rgba(0,0,0,.14)",
  },

  suppHeroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  suppHeroKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,.68)",
  },

  suppHeroArrow: {
    fontSize: 24,
    fontWeight: 800,
    color: "rgba(255,255,255,.68)",
  },

  suppHeroTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: WHITE,
    lineHeight: 1.08,
  },

  suppHeroSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.45,
    color: "rgba(255,255,255,.74)",
    fontWeight: 600,
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: BLACK,
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  sectionTitleLarge: {
    fontSize: 24,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -0.7,
    lineHeight: 1.05,
  },

  hydrationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
  },

  waterSubTop: {
    marginTop: 6,
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.45,
    fontWeight: 600,
  },

  calendarNavBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  waterCard: {
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 26px rgba(0,0,0,.04)",
  },

  waterProgressBar: {
    height: 10,
    borderRadius: 999,
    background: "#EDEDEB",
    overflow: "hidden",
    marginBottom: 14,
  },

  waterProgressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #FF6A00, #FF8A3D)",
    borderRadius: 999,
    transition: "width .3s ease",
  },

  waterPercentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },

  waterBigPercent: {
    fontSize: 30,
    fontWeight: 800,
    color: ORANGE,
    letterSpacing: -1,
  },

  waterPercentHint: {
    fontSize: 12.5,
    color: GRAY,
    fontWeight: 600,
  },

  weekStrip: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginBottom: 14,
  },

  weekPill: {
    minWidth: 62,
    padding: "10px 8px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    textAlign: "center",
  },

  weekPillActive: {
    background: "#FFF7F1",
    borderColor: "rgba(255,106,0,.24)",
  },

  weekPillDone: {
    boxShadow: "inset 0 0 0 1px rgba(255,106,0,.18)",
  },

  weekLabel: {
    fontSize: 11,
    color: SOFT,
    fontWeight: 800,
  },

  weekDay: {
    marginTop: 4,
    fontSize: 17,
    color: BLACK,
    fontWeight: 800,
  },

  weekMl: {
    marginTop: 4,
    fontSize: 10.5,
    color: GRAY,
    fontWeight: 700,
  },

  waterNumbers: {
    textAlign: "center",
    marginBottom: 14,
  },

  waterBig: {
    fontSize: 28,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -0.8,
  },

  waterSub: {
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.45,
    fontWeight: 600,
  },

  waterActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  waterBtn: {
    height: 46,
    borderRadius: 14,
    background: ORANGE,
    border: "none",
    color: BLACK,
    fontWeight: 800,
    fontSize: 14,
  },

  waterBtnSoft: {
    height: 46,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontWeight: 800,
    fontSize: 14,
  },

  suggestionCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 24,
    background: BLACK,
    color: WHITE,
    boxShadow: "0 14px 34px rgba(0,0,0,.14)",
  },

  suggestionLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,.72)",
  },

  suggestionTitle: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: -0.6,
  },

  suggestionSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(255,255,255,.74)",
  },

  suggestionTags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },

  suggestionAction: {
    marginTop: 16,
    height: 44,
    padding: "0 16px",
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 800,
    fontSize: 14,
  },

  tag: {
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
    color: WHITE,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.08)",
  },

  segmentWrap: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginBottom: 12,
    paddingBottom: 2,
  },

  segmentBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontWeight: 700,
    whiteSpace: "nowrap",
    fontSize: 13,
  },

  segmentBtnActive: {
    background: BLACK,
    color: WHITE,
    borderColor: BLACK,
  },

  searchWrap: {
    marginBottom: 12,
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
    paddingBottom: 2,
    marginBottom: 14,
  },

  chip: {
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontWeight: 700,
    whiteSpace: "nowrap",
    fontSize: 12.5,
  },

  chipActive: {
    background: "#FFF7F1",
    borderColor: "rgba(255,106,0,.24)",
  },

  recipeList: {
    display: "grid",
    gap: 12,
  },

  recipeCard: {
    padding: 16,
    borderRadius: 22,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    boxShadow: "0 8px 22px rgba(0,0,0,.03)",
  },

  recipeCardTop: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  recipeMainButton: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: 0,
    flex: 1,
  },

  recipeTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: BLACK,
    lineHeight: 1.15,
    letterSpacing: -0.2,
  },

  recipeSub: {
    marginTop: 5,
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.45,
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

  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontSize: 18,
    flexShrink: 0,
  },

  favoriteBtnActive: {
    background: "#FFF7F1",
    borderColor: "rgba(255,106,0,.24)",
    color: ORANGE,
  },

  keywordRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },

  keywordPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    fontSize: 11.5,
    fontWeight: 700,
    color: BLACK,
  },

  moreKeywordBtn: {
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: `1px solid rgba(255,106,0,.24)`,
    background: "#FFF7F1",
    color: BLACK,
    fontWeight: 800,
    fontSize: 12,
  },

  expandArea: {
    marginTop: 12,
  },

  expandText: {
    fontSize: 13.5,
    color: GRAY,
    lineHeight: 1.5,
    marginBottom: 12,
  },

  expandBlockTitle: {
    fontSize: 12,
    fontWeight: 800,
    marginTop: 8,
    marginBottom: 8,
    color: SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  ingredientsWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  ingredientPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    fontSize: 12,
    fontWeight: 700,
    color: BLACK,
  },

  stepsWrap: {
    display: "grid",
    gap: 10,
    marginTop: 8,
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

  supplementCard: {
    padding: 16,
    borderRadius: 22,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 8px 22px rgba(0,0,0,.03)",
  },

  simpleBulletRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },

  simpleDot: {
    width: 8,
    height: 8,
    background: ORANGE,
    borderRadius: 999,
    marginTop: 6,
    flexShrink: 0,
  },

  simpleBulletText: {
    fontSize: 14,
    lineHeight: 1.5,
    color: BLACK,
  },

  lockedHero: {
    paddingTop: 12,
  },

  lockedKicker: {
    fontSize: 11,
    fontWeight: 900,
    color: SOFT,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  titleLocked: {
    margin: 0,
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1.05,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -1,
  },

  subLocked: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.55,
    fontWeight: 600,
    color: GRAY,
    maxWidth: 480,
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
  },
};
