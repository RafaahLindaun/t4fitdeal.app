import { supabase } from "./supabase";
import { getDailyBurn, type CalorieSourceKey, type DailyBurnResult } from "./calorieSources";

export type DietProfile = {
  weightKg: number;
  heightCm: number;
  sexForFormula: "male" | "female" | "unspecified";
  birthDate: string;
  objective: string;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  preferredCalorieSource: CalorieSourceKey;
};

export type MealItem = {
  nome: string;
  quantidade_estimada_g: number;
  calorias: number;
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
};

export type MealMacros = { proteina_g: number; carbo_g: number; gordura_g: number };

export type MealLog = {
  id: string;
  imagePath: string;
  displayImageUrl: string;
  items: MealItem[];
  caloriesTotal: number;
  macros: MealMacros;
  source: "ocr_rotulo" | "ia_visao" | "manual";
  confidence: number;
  registeredAt: string;
};

export type RecipeIngredient = {
  nome: string;
  quantidade_g?: number;
  fonte?: string;
  taco_id?: number;
  descricao_taco?: string;
};

export type RecipeHealthLevel = "saudavel" | "moderado" | "menos_saudavel";

export type Recipe = {
  id: string;
  name: string;
  macros: MealMacros & { calorias: number };
  objectiveCategories: string[];
  mealCategory: string;
  portionDescription: string;
  imageUrl: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  healthLevel: RecipeHealthLevel;
  alternativeRecipeId: string;
  imageValidated: boolean;
};

export type MealScheduleItem = {
  key: string;
  label: string;
  timeWindow: string;
  fraction: number;
  calories: number;
};

export const DEFAULT_MEAL_SCHEDULE_CONFIG = [
  { key: "cafe_da_manha", label: "Café da manhã", timeWindow: "07:00 - 08:30", fraction: 0.25 },
  { key: "almoco", label: "Almoço", timeWindow: "12:00 - 13:30", fraction: 0.35 },
  { key: "lanche", label: "Lanche", timeWindow: "15:30 - 17:00", fraction: 0.10 },
  { key: "jantar", label: "Jantar", timeWindow: "19:00 - 20:30", fraction: 0.30 },
] as const;

export type DietHistoryDay = {
  dateKey: string;
  label: string;
  waterMl: number;
  waterTargetMl: number;
  consumedCalories: number;
  calorieTarget: number;
};

export type DietDashboardData = {
  profile: DietProfile;
  waterMl: number;
  consumedCalories: number;
  consumedMacros: MealMacros;
  burn: DailyBurnResult;
  meals: MealLog[];
  recipes: Recipe[];
  calorieTarget: number;
  waterTargetMl: number;
  history: DietHistoryDay[];
};

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayRange(date = new Date()) {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end = new Date(date); end.setHours(23,59,59,999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function ageFromBirthDate(birthDate: string, today = new Date()) {
  const parts = String(birthDate || "").slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return 0;
  const [year, month, day] = parts;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return 0;
  let age = today.getFullYear() - year;
  const beforeBirthday = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

export function isPerfilNutricionalCompleto(profile: DietProfile) {
  return profile.weightKg > 0
    && profile.heightCm > 0
    && ageFromBirthDate(profile.birthDate) > 0
    && Boolean(profile.objective.trim());
}

export function buildMealSchedule(
  calorieTarget: number,
  config: ReadonlyArray<{ key: string; label: string; timeWindow: string; fraction: number }> = DEFAULT_MEAL_SCHEDULE_CONFIG,
): MealScheduleItem[] {
  const safeTarget = Number.isFinite(calorieTarget) ? Math.max(0, calorieTarget) : 0;
  return config.map((item) => ({ ...item, calories: Math.round(safeTarget * Math.max(0, item.fraction)) }));
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function findLessHealthyRecipeMatch(itemName: string, recipes: Recipe[]) {
  const needle = normalizeSearchText(itemName);
  if (!needle) return null;
  const needleTokens = new Set(needle.split(" ").filter((token) => token.length > 2));
  let best: { recipe: Recipe; score: number; candidateLength: number } | null = null;

  for (const recipe of recipes) {
    if (recipe.healthLevel !== "menos_saudavel") continue;
    const candidate = normalizeSearchText(recipe.name);
    const candidateTokens = candidate.split(" ").filter((token) => token.length > 2);
    const overlap = candidateTokens.filter((token) => needleTokens.has(token)).length;
    const needleCoverage = overlap / Math.max(1, needleTokens.size);
    const candidateCoverage = overlap / Math.max(1, candidateTokens.length);
    const containsBonus = candidate.includes(needle) || needle.includes(candidate) ? 0.12 : 0;
    const score = needleCoverage * 0.72 + candidateCoverage * 0.28 + containsBonus;

    if (needleCoverage < 0.5) continue;
    if (!best || score > best.score || (score === best.score && candidateTokens.length < best.candidateLength)) {
      best = { recipe, score, candidateLength: candidateTokens.length };
    }
  }

  return best?.recipe ?? null;
}

export function recipeAlternative(recipe: Recipe, recipes: Recipe[]) {
  if (!recipe.alternativeRecipeId) return null;
  return recipes.find((candidate) => candidate.id === recipe.alternativeRecipeId) ?? null;
}

export function suggestCalorieTarget(profile: DietProfile) {
  if (!profile.weightKg || !profile.heightCm || !profile.birthDate) return 2000;
  const age = ageFromBirthDate(profile.birthDate);
  if (!age) return 2000;
  // Quando o sexo metabólico não foi informado, usa o ponto médio dos offsets
  // da fórmula para manter uma estimativa individual por peso/altura/idade,
  // sem esconder o cronograma por um campo que não faz parte do requisito.
  const sexOffset = profile.sexForFormula === "male" ? 5 : profile.sexForFormula === "female" ? -161 : -78;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + sexOffset;
  const tdee = bmr * 1.4;
  const objective = profile.objective.toLowerCase();
  const adjustment = /emag|perd|defin/.test(objective) ? -350 : /hipert|ganh|massa/.test(objective) ? 250 : 0;
  return Math.max(1200, Math.round(tdee + adjustment));
}

export function suggestedWaterTarget(profile: DietProfile) {
  return profile.dailyWaterTargetMl > 0
    ? Math.round(profile.dailyWaterTargetMl)
    : profile.weightKg > 0
      ? Math.round(profile.weightKg * 35)
      : 2000;
}

async function loadDietProfile(userId: string): Promise<DietProfile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const row = (data ?? {}) as Record<string, unknown>;
  const rawSex = String(row.sex_for_metabolic_formula ?? row.gender ?? row.sex ?? row.sexo ?? "").toLowerCase();
  const normalizedSex = ["male","masculino","m"].includes(rawSex) ? "male" : ["female","feminino","f"].includes(rawSex) ? "female" : "unspecified";
  return {
    weightKg: Math.max(0, num(row.weight_kg ?? row.weight ?? row.peso)),
    heightCm: Math.max(0, num(row.height_cm ?? row.height ?? row.altura_cm ?? row.altura)),
    sexForFormula: normalizedSex,
    birthDate: String(row.birth_date ?? row.birthdate ?? row.data_nascimento ?? ""),
    objective: String(row.objective ?? row.objetivo ?? row.goal ?? ""),
    dailyCalorieTarget: Math.max(0, num(row.daily_calorie_target ?? row.calorie_target)),
    dailyWaterTargetMl: Math.max(0, num(row.daily_water_target_ml ?? row.water_target_ml)),
    preferredCalorieSource: (["manual","garmin","apple_health","google_fit","samsung_health"].includes(String(row.preferred_calorie_source)) ? String(row.preferred_calorie_source) : "manual") as CalorieSourceKey,
  };
}

async function signedMealUrl(path: string) {
  if (!path) return "";
  const { data } = await supabase.storage.from("meal-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

function normalizeMeal(raw: Record<string, unknown>): MealLog {
  const macros = (raw.macros ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ""),
    imagePath: String(raw.imagem_url ?? ""),
    displayImageUrl: "",
    items: Array.isArray(raw.itens) ? raw.itens as MealItem[] : [],
    caloriesTotal: Math.max(0, num(raw.calorias_total)),
    macros: {
      proteina_g: Math.max(0, num(macros.proteina_g)),
      carbo_g: Math.max(0, num(macros.carbo_g)),
      gordura_g: Math.max(0, num(macros.gordura_g)),
    },
    source: ["ocr_rotulo","ia_visao"].includes(String(raw.fonte)) ? String(raw.fonte) as MealLog["source"] : "manual",
    confidence: Math.max(0, Math.min(1, num(raw.confianca))),
    registeredAt: String(raw.registrado_em ?? ""),
  };
}

function normalizeRecipeCategory(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function legacyObjectiveCategories(tags: string[]) {
  const normalized = tags.map(normalizeRecipeCategory);
  const objectives = ["emagrecimento", "hipertrofia", "low_carb"].filter((key) =>
    normalized.some((tag) => tag === key || (key === "low_carb" && tag.includes("low_carb"))),
  );
  return objectives.length ? objectives : ["emagrecimento"];
}

function legacyMealCategory(tags: string[]) {
  const normalized = tags.map(normalizeRecipeCategory);
  if (normalized.some((tag) => tag.includes("cafe_da_manha"))) return "cafe_da_manha";
  if (normalized.some((tag) => tag.includes("jantar"))) return "jantar";
  if (normalized.some((tag) => tag.includes("lanche"))) return "lanche";
  return "almoco";
}

async function loadRecipeRows() {
  let result = await supabase.from("recipes").select("*").eq("ativo", true).eq("imagem_validada", true).order("nome", { ascending: true }).limit(150);
  if (result.error && /nome/i.test(result.error.message)) {
    result = await supabase.from("recipes").select("*").eq("ativo", true).eq("imagem_validada", true).order("title", { ascending: true }).limit(150);
  }
  // Em produção, receita sem controle visual não entra no catálogo.
  if (result.error && /imagem_validada/i.test(result.error.message)) return { ...result, data: [] };
  return result;
}

export async function loadDietDashboard(userId: string): Promise<DietDashboardData> {
  const profile = await loadDietProfile(userId);
  const now = new Date();
  const { end } = dayRange(now);
  const historyStartDate = new Date(now);
  historyStartDate.setDate(historyStartDate.getDate() - 13);
  const { start: historyStart } = dayRange(historyStartDate);
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const localKey = (value: unknown) => {
    const date = new Date(String(value ?? ""));
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  };
  const [waterResult, mealResult, recipeResult, burn] = await Promise.all([
    supabase.from("water_logs").select("ml,registrado_em").eq("user_id", userId).gte("registrado_em", historyStart).lte("registrado_em", end),
    supabase.from("meal_logs").select("*").eq("user_id", userId).gte("registrado_em", historyStart).lte("registrado_em", end).order("registrado_em", { ascending: false }),
    loadRecipeRows(),
    getDailyBurn(profile.preferredCalorieSource, userId, now, profile.weightKg || 70),
  ]);

  const waterRows = (waterResult.data ?? []) as Array<Record<string, unknown>>;
  const mealRows = (mealResult.data ?? []) as Array<Record<string, unknown>>;
  const waterMl = waterRows.filter((row) => localKey(row.registrado_em) === todayKey).reduce((sum, row) => sum + Math.max(0, num(row.ml)), 0);
  const meals = await Promise.all(mealRows.filter((row) => localKey(row.registrado_em) === todayKey).map(async (row) => {
    const meal = normalizeMeal(row);
    meal.displayImageUrl = await signedMealUrl(meal.imagePath);
    return meal;
  }));
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.caloriesTotal, 0);
  const consumedMacros = meals.reduce((acc, meal) => ({
    proteina_g: acc.proteina_g + meal.macros.proteina_g,
    carbo_g: acc.carbo_g + meal.macros.carbo_g,
    gordura_g: acc.gordura_g + meal.macros.gordura_g,
  }), { proteina_g: 0, carbo_g: 0, gordura_g: 0 });

  const recipes: Recipe[] = (recipeResult.data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const legacyMacros = (raw.macros ?? {}) as Record<string, unknown>;
    const legacyTags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
    const objectives = Array.isArray(raw.categoria_objetivo)
      ? raw.categoria_objetivo.map(normalizeRecipeCategory).filter(Boolean)
      : legacyObjectiveCategories(legacyTags);
    const ingredients = Array.isArray(raw.ingredientes)
      ? raw.ingredientes.filter((item): item is RecipeIngredient => Boolean(item && typeof item === "object"))
      : [];

    return {
      id: String(raw.id ?? ""),
      name: String(raw.nome ?? raw.title ?? raw.name ?? "Receita"),
      macros: {
        calorias: Math.max(0, num(raw.kcal) || num(legacyMacros.calorias)),
        proteina_g: Math.max(0, num(raw.proteina_g) || num(legacyMacros.proteina_g)),
        carbo_g: Math.max(0, num(raw.carbo_g) || num(legacyMacros.carbo_g)),
        gordura_g: Math.max(0, num(raw.gordura_g) || num(legacyMacros.gordura_g)),
      },
      objectiveCategories: objectives.length ? objectives : legacyObjectiveCategories(legacyTags),
      mealCategory: normalizeRecipeCategory(raw.categoria_refeicao) || legacyMealCategory(legacyTags),
      portionDescription: String(raw.porcao_descricao ?? ""),
      imageUrl: String(raw.imagem_url ?? raw.image_url ?? ""),
      instructions: String(raw.modo_preparo ?? ""),
      ingredients,
      healthLevel: (["saudavel", "moderado", "menos_saudavel"].includes(String(raw.nivel_saudavel)) ? String(raw.nivel_saudavel) : "saudavel") as RecipeHealthLevel,
      alternativeRecipeId: String(raw.receita_alternativa_id ?? ""),
      imageValidated: raw.imagem_validada === true,
    };
  });

  const calorieTarget = profile.dailyCalorieTarget > 0 ? profile.dailyCalorieTarget : suggestCalorieTarget(profile);
  const waterTargetMl = suggestedWaterTarget(profile);
  const history: DietHistoryDay[] = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (13 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const dayWater = waterRows.filter((row) => localKey(row.registrado_em) === key).reduce((sum, row) => sum + Math.max(0, num(row.ml)), 0);
    const dayCalories = mealRows.filter((row) => localKey(row.registrado_em) === key).reduce((sum, row) => sum + Math.max(0, num(row.calorias_total)), 0);
    return {
      dateKey: key,
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", ""),
      waterMl: dayWater,
      waterTargetMl,
      consumedCalories: dayCalories,
      calorieTarget,
    };
  });

  return {
    profile, waterMl, consumedCalories, consumedMacros, burn, meals, recipes, calorieTarget, waterTargetMl, history,
  };
}

export async function addWater(userId: string, ml: number) {
  const { data, error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, ml: Math.round(ml) })
    .select("id,ml")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("water log insert did not return an id");
  return { id: String(data.id), ml: Math.max(0, num(data.ml)) };
}

export async function deleteWaterLog(userId: string, logId: string) {
  const { error } = await supabase
    .from("water_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function resetTodayWater(userId: string, date = new Date()) {
  const { start, end } = dayRange(date);
  const { error } = await supabase
    .from("water_logs")
    .delete()
    .eq("user_id", userId)
    .gte("registrado_em", start)
    .lte("registrado_em", end);
  if (error) throw error;
}

export async function updateDietTargets(userId: string, input: Partial<DietProfile>) {
  const payload: Record<string, unknown> = {};
  if (input.weightKg !== undefined) payload.weight_kg = input.weightKg || null;
  if (input.heightCm !== undefined) payload.height_cm = input.heightCm || null;
  if (input.sexForFormula !== undefined) payload.sex_for_metabolic_formula = input.sexForFormula;
  if (input.dailyCalorieTarget !== undefined) payload.daily_calorie_target = input.dailyCalorieTarget || null;
  if (input.dailyWaterTargetMl !== undefined) payload.daily_water_target_ml = input.dailyWaterTargetMl || null;
  if (input.preferredCalorieSource !== undefined) payload.preferred_calorie_source = input.preferredCalorieSource;
  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw error;
}

export async function saveMeal(userId: string, input: Omit<MealLog, "id" | "displayImageUrl" | "registeredAt">) {
  const { error } = await supabase.from("meal_logs").insert({
    user_id: userId,
    imagem_url: input.imagePath || null,
    itens: input.items,
    calorias_total: Math.round(input.caloriesTotal),
    macros: input.macros,
    fonte: input.source,
    confianca: input.confidence,
  });
  if (error) throw error;
}

export async function registerRecipe(userId: string, recipe: Recipe) {
  await saveMeal(userId, {
    imagePath: "",
    items: [{ nome: recipe.name, quantidade_estimada_g: 0, calorias: recipe.macros.calorias, proteina_g: recipe.macros.proteina_g, carbo_g: recipe.macros.carbo_g, gordura_g: recipe.macros.gordura_g }],
    caloriesTotal: recipe.macros.calorias,
    macros: { proteina_g: recipe.macros.proteina_g, carbo_g: recipe.macros.carbo_g, gordura_g: recipe.macros.gordura_g },
    source: "manual",
    confidence: 1,
  });
}
