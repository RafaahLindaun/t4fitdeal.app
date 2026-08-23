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

export type Recipe = {
  id: string;
  name: string;
  macros: MealMacros & { calorias: number };
  tags: string[];
  imageUrl: string;
  instructions: string;
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

function ageFromBirthDate(birthDate: string) {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

export function suggestCalorieTarget(profile: DietProfile) {
  if (!profile.weightKg || !profile.heightCm || !profile.birthDate || profile.sexForFormula === "unspecified") return 2000;
  const age = ageFromBirthDate(profile.birthDate);
  if (!age) return 2000;
  const sexOffset = profile.sexForFormula === "male" ? 5 : -161;
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
  const { data } = await supabase
    .from("profiles")
    .select("weight_kg,height_cm,sex_for_metabolic_formula,birth_date,objective,daily_calorie_target,daily_water_target_ml,preferred_calorie_source")
    .eq("id", userId)
    .maybeSingle();
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    weightKg: Math.max(0, num(row.weight_kg)),
    heightCm: Math.max(0, num(row.height_cm)),
    sexForFormula: ["male", "female"].includes(String(row.sex_for_metabolic_formula)) ? String(row.sex_for_metabolic_formula) as "male" | "female" : "unspecified",
    birthDate: String(row.birth_date ?? ""),
    objective: String(row.objective ?? ""),
    dailyCalorieTarget: Math.max(0, num(row.daily_calorie_target)),
    dailyWaterTargetMl: Math.max(0, num(row.daily_water_target_ml)),
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

async function loadRecipeRows() {
  let result = await supabase.from("recipes").select("*").order("nome", { ascending: true }).limit(40);
  if (result.error && /nome/i.test(result.error.message)) {
    result = await supabase.from("recipes").select("*").order("title", { ascending: true }).limit(40);
  }
  return result;
}

export async function loadDietDashboard(userId: string): Promise<DietDashboardData> {
  const profile = await loadDietProfile(userId);
  const { start, end } = dayRange();
  const [waterResult, mealResult, recipeResult, burn] = await Promise.all([
    supabase.from("water_logs").select("ml").eq("user_id", userId).gte("registrado_em", start).lte("registrado_em", end),
    supabase.from("meal_logs").select("*").eq("user_id", userId).gte("registrado_em", start).lte("registrado_em", end).order("registrado_em", { ascending: false }),
    loadRecipeRows(),
    getDailyBurn(profile.preferredCalorieSource, userId, new Date(), profile.weightKg || 70),
  ]);

  const waterMl = (waterResult.data ?? []).reduce((sum, row) => sum + Math.max(0, num((row as Record<string, unknown>).ml)), 0);
  const meals = await Promise.all((mealResult.data ?? []).map(async (row) => {
    const meal = normalizeMeal(row as Record<string, unknown>);
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
    const macros = (raw.macros ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id ?? ""),
      name: String(raw.nome ?? raw.title ?? raw.name ?? "Receita"),
      macros: {
        calorias: Math.max(0, num(macros.calorias)),
        proteina_g: Math.max(0, num(macros.proteina_g)),
        carbo_g: Math.max(0, num(macros.carbo_g)),
        gordura_g: Math.max(0, num(macros.gordura_g)),
      },
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
      imageUrl: String(raw.imagem_url ?? raw.image_url ?? ""),
      instructions: String(raw.modo_preparo ?? ""),
    };
  });

  return {
    profile,
    waterMl,
    consumedCalories,
    consumedMacros,
    burn,
    meals,
    recipes,
    calorieTarget: profile.dailyCalorieTarget > 0 ? profile.dailyCalorieTarget : suggestCalorieTarget(profile),
    waterTargetMl: suggestedWaterTarget(profile),
  };
}

export async function addWater(userId: string, ml: number) {
  const { error } = await supabase.from("water_logs").insert({ user_id: userId, ml: Math.round(ml) });
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
