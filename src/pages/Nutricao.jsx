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
  const count = Math.max(4, Math.min(Number(daysCount) || 4, 7));
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

function prettifyRecipeTitle(title) {
  const safe = String(title || "").trim();
  if (!safe) return "";
  return safe
    .split(" ")
    .map((part) => {
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
    items = items.filter(
      (item) =>
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
  const waterPct =
    waterGoal > 0
      ? Math.max(0, Math.min(100, Math.round((waterMl / waterGoal) * 100)))
      : 0;

  const weekStrip = useMemo(
    () => buildWeekStrip(profile?.frequencia || 4, email, waterGoal),
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
          <div style={styles.heroContent}>
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
            Suplementação<span style={{ color: ORANGE }}>.</span>
          </div>

          <div style={styles.suppHeroSub}>
            Abra seu plano premium com indicação rápida e objetiva.
          </div>
        </button>

        <section style={styles.section}>
          <div style={styles.waterShell}>
            <div style={styles.hydrationHeader}>
              <div style={styles.hydrationHeaderLeft}>
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

              <div style={styles.waterQuickRow}>
                <button style={styles.waterMiniBtn} onClick={() => addWater(100)}>
                  +100 ml
                </button>
                <button style={styles.waterMiniBtn} onClick={() => addWater(250)}>
                  +250 ml
                </button>
                <button style={styles.waterMiniBtn} onClick={() => addWater(300)}>
                  +300 ml
                </button>
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

                  <div
                    style={{
                      ...styles.expandAnimated,
                      maxHeight: open ? 620 : 0,
                      opacity: open ? 1 : 0,
                      marginTop: open ? 14 : 0,
                    }}
                  >
                    <div style={styles.expandText}>{item.emphasis}</div>

                    <div style={styles.expandBlockTitle}>Receita</div>

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
                </div>
              );
            })}
          </div>
        </section>

        <div style={styles.footerBrand}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>
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
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 180px",
    gap: 16,
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 26px rgba(0,0,0,.04)",
    marginBottom: 14,
    alignItems: "center",
  },

  heroContent: {
    minWidth: 0,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    maxWidth: 320,
  },

  heroSub: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY,
    lineHeight: 1.5,
    maxWidth: 360,
  },

  heroMini: {
    minWidth: 0,
    width: "100%",
    minHeight: 132,
    padding: 18,
    borderRadius: 24,
    background: "#FAFAF8",
    border: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "left",
    boxSizing: "border-box",
  },

  heroMiniLabel: {
    fontSize: 11,
    color: SOFT,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 800,
    lineHeight: 1.2,
  },

  heroMiniValue: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: 800,
    color: BLACK,
    lineHeight: 1.15,
    wordBreak: "break-word",
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

  waterShell: {
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 26px rgba(0,0,0,.04)",
  },

  hydrationHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "start",
    marginBottom: 14,
  },

  hydrationHeaderLeft: {
    minWidth: 0,
  },

  waterSubTop: {
    marginTop: 8,
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.45,
    fontWeight: 600,
    maxWidth: 320,
    wordBreak: "break-word",
  },

  calendarNavBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: BLACK,
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
    boxShadow: "0 6px 16px rgba(0,0,0,.03)",
  },

  waterCard: {
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    overflow: "visible",
  },

  waterProgressBar: {
    height: 12,
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
    gap: 10,
  },

  waterBigPercent: {
    fontSize: 30,
    fontWeight: 800,
    color: ORANGE,
    letterSpacing: -1,
    lineHeight: 1,
  },

  waterPercentHint: {
    fontSize: 12.5,
    color: GRAY,
    fontWeight: 600,
    textAlign: "right",
    maxWidth: 150,
    lineHeight: 1.3,
  },

  weekStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 16,
  },

  weekPill: {
    minWidth: 0,
    padding: "12px 8px",
    borderRadius: 18,
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
    fontSize: 18,
    color: BLACK,
    fontWeight: 800,
    lineHeight: 1,
  },

  weekMl: {
    marginTop: 6,
    fontSize: 11,
    color: GRAY,
    fontWeight: 700,
    lineHeight: 1.15,
  },

  waterNumbers: {
    textAlign: "center",
    marginBottom: 14,
  },

  waterBig: {
    fontSize: 32,
    fontWeight: 800,
    color: BLACK,
    letterSpacing: -1,
    lineHeight: 1,
  },

  waterSub: {
    marginTop: 6,
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.45,
    fontWeight: 600,
  },

  waterQuickRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 10,
  },

  waterMiniBtn: {
    height: 42,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontWeight: 800,
    fontSize: 13,
  },

  waterActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  waterBtn: {
    height: 48,
    borderRadius: 16,
    background: ORANGE,
    border: "none",
    color: BLACK,
    fontWeight: 800,
    fontSize: 15,
  },

  waterBtnSoft: {
    height: 48,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontWeight: 800,
    fontSize: 15,
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
    height: 42,
    padding: "0 16px",
    borderRadius: 16,
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
    height: 52,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    padding: "0 16px",
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
    height: 36,
    padding: "0 14px",
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
    fontSize: 18,
    fontWeight: 800,
    color: BLACK,
    lineHeight: 1.15,
    letterSpacing: -0.3,
  },

  recipeSub: {
    marginTop: 6,
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
    textTransform: "capitalize",
  },

  favoriteBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontSize: 20,
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

  expandAnimated: {
    overflow: "hidden",
    transition: "all 240ms cubic-bezier(.22,1,.36,1)",
    willChange: "max-height, opacity, margin-top",
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

  footerBrand: {
    textAlign: "center",
    marginTop: 26,
    paddingBottom: 10,
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: -1,
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
