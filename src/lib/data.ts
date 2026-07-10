import { supabase, isSupabaseReady } from "./supabase";
import type { Profile, WorkoutPlan, WorkoutExercise, WorkoutSession, CardioSession, ProductItem, ClassItem, RecipeItem } from "../types";

const fallbackWorkoutExercises: WorkoutExercise[] = [
  { id: "1", plan_id: "demo", position: 1, name: "Supino reto", sets: 4, reps_min: 8, reps_max: 12, load_label: "20kg", rest_seconds: 60, media_url: "/gifs/classic-stick-bench.gif", notes: "Controle a descida e suba firme." },
  { id: "2", plan_id: "demo", position: 2, name: "Cadeira extensora", sets: 3, reps_min: 12, reps_max: 15, load_label: "35kg", rest_seconds: 45, media_url: "/gifs/classic-stick-bench.gif", notes: "Segure 1s no topo." },
  { id: "3", plan_id: "demo", position: 3, name: "Remada baixa", sets: 4, reps_min: 10, reps_max: 12, load_label: "25kg", rest_seconds: 60, media_url: "/gifs/classic-stick-bench.gif", notes: "Puxe com o cotovelo." },
];

const fallbackProducts: ProductItem[] = [
  { id: "p1", title: "Whey Protein", category: "Suplementos" },
  { id: "p2", title: "Creatina", category: "Suplementos" },
  { id: "p3", title: "Energético", category: "Bebidas" },
  { id: "p4", title: "Camiseta Accqua", category: "Roupas" },
];

const fallbackClasses: ClassItem[] = [
  { id: "c1", title: "Jump", category: "Coletiva", weekday: "Segunda", time_label: "18:30", gympass_plan: "Basic+" },
  { id: "c2", title: "Funcional", category: "Coletiva", weekday: "Terça", time_label: "18:00", gympass_plan: "Basic+" },
  { id: "c3", title: "Hidro", category: "Piscina", weekday: "Quarta", time_label: "09:00", gympass_plan: "Silver" },
  { id: "c4", title: "Natação", category: "Piscina", weekday: "Quinta", time_label: "19:00", gympass_plan: "Silver" },
];

const fallbackRecipes: RecipeItem[] = [
  { id: "r1", title: "Panqueca proteica", category: "Café da manhã", summary: "Proteína + aveia + banana.", calories: 320 },
  { id: "r2", title: "Bowl de frango com arroz", category: "Almoço", summary: "Completo e fácil de montar.", calories: 480 },
  { id: "r3", title: "Smoothie pós-treino", category: "Lanche", summary: "Leve e nutritivo.", calories: 250 },
];

async function safeTable<T>(table: string, orderField = "created_at", ascending = false): Promise<T[]> {
  if (!isSupabaseReady) return [];
  const { data, error } = await supabase.from(table).select("*").order(orderField, { ascending });
  if (error) return [];
  return (data || []) as T[];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseReady) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return null;
  return normalizeProfile(data);
}

export function normalizeProfile(raw: any): Profile {
  return {
    id: raw.id,
    email: raw.email || "",
    full_name: raw.full_name || raw.nome || "Aluno Accqua",
    cpf: raw.cpf,
    phone: raw.phone || raw.telefone,
    emergency_phone: raw.emergency_phone || raw.telefone_emergencia,
    birth_date: raw.birth_date || raw.data_nascimento,
    role: raw.role || "aluno",
    status: raw.status || "pending",
    goal: raw.goal || raw.objetivo,
    current_weight: raw.current_weight,
    height_cm: raw.height_cm,
    diet_active: raw.diet_active ?? raw.dieta_ativa ?? false,
    avatar_url: raw.avatar_url,
    professor_id: raw.professor_id,
  };
}

export async function upsertProfile(payload: Partial<Profile> & { id: string; email: string }) {
  if (!isSupabaseReady) return { error: null };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  return { error };
}

export async function getStudentWorkout(studentId: string) {
  if (isSupabaseReady) {
    const { data: plans } = await supabase.from("workout_plans").select("*").eq("student_id", studentId).eq("is_active", true).order("updated_at", { ascending: false }).limit(1);
    const plan = plans?.[0] as WorkoutPlan | undefined;
    if (plan) {
      const { data: exercises } = await supabase.from("workout_exercises").select("*").eq("plan_id", plan.id).order("position", { ascending: true });
      return { plan, exercises: (exercises || []) as WorkoutExercise[] };
    }
  }
  return { plan: { id: "demo", student_id: studentId, name: "Treino A", version: 1, is_active: true } as WorkoutPlan, exercises: fallbackWorkoutExercises };
}

export async function saveWorkoutSession(payload: WorkoutSession) {
  if (!isSupabaseReady) return { error: null };
  return supabase.from("workout_sessions").insert(payload);
}

export async function saveCardioSession(payload: CardioSession) {
  if (!isSupabaseReady) return { error: null };
  return supabase.from("cardio_sessions").insert(payload);
}

export async function getRanking() {
  if (isSupabaseReady) {
    const { data } = await supabase
      .from("workout_sessions")
      .select("student_id, completed_at, valid_for_ranking, profiles!workout_sessions_student_id_fkey(full_name, nome)")
      .eq("valid_for_ranking", true)
      .order("completed_at", { ascending: false });
    if (data && data.length) {
      const map = new Map<string, { name: string; count: number }>();
      data.forEach((row: any) => {
        const id = row.student_id;
        const full = row.profiles?.full_name || row.profiles?.nome || "Aluno";
        const first = full.split(" ")[0];
        const current = map.get(id) || { name: first, count: 0 };
        current.count += 1;
        map.set(id, current);
      });
      return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 20);
    }
  }
  return [
    { name: "Rafael", count: 22 },
    { name: "Ana", count: 19 },
    { name: "Lucas", count: 17 },
    { name: "Marina", count: 15 },
    { name: "Bruna", count: 14 },
  ];
}

export async function getProducts() {
  const data = await safeTable<ProductItem>("shop_items");
  return data.length ? data : fallbackProducts;
}

export async function getClasses() {
  const data = await safeTable<ClassItem>("classes");
  return data.length ? data : fallbackClasses;
}

export async function getRecipes() {
  const data = await safeTable<RecipeItem>("recipes");
  return data.length ? data : fallbackRecipes;
}

export async function getStudentsForTeam(profile: Profile) {
  if (isSupabaseReady) {
    const query = supabase.from("profiles").select("*").eq("role", "aluno").order("full_name", { ascending: true });
    if (profile.role === "professor") query.eq("professor_id", profile.id);
    const { data } = await query;
    if (data) return data.map(normalizeProfile);
  }
  return [
    { id: "s1", email: "aluno1@teste.com", full_name: "Gabriela Rocha", role: "aluno", status: "active", goal: "Hipertrofia" },
    { id: "s2", email: "aluno2@teste.com", full_name: "Pedro Alves", role: "aluno", status: "active", goal: "Emagrecimento" },
    { id: "s3", email: "aluno3@teste.com", full_name: "Paula Mendes", role: "aluno", status: "pending", goal: "Condicionamento" },
  ] as Profile[];
}

export async function createWorkoutPlan(payload: Partial<WorkoutPlan>) {
  if (!isSupabaseReady) return { data: { id: `local-${Date.now()}` }, error: null };
  return supabase.from("workout_plans").insert(payload).select("id").single();
}

export async function addWorkoutExercise(payload: Partial<WorkoutExercise>) {
  if (!isSupabaseReady) return { error: null };
  return supabase.from("workout_exercises").insert(payload);
}

export async function upsertProduct(payload: Partial<ProductItem>) {
  if (!isSupabaseReady) return { error: null };
  return supabase.from("shop_items").upsert(payload);
}

export async function upsertClass(payload: Partial<ClassItem>) {
  if (!isSupabaseReady) return { error: null };
  return supabase.from("classes").upsert(payload);
}
