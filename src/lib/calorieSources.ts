import { supabase } from "./supabase";

export type CalorieSourceKey = "manual" | "garmin" | "apple_health" | "google_fit" | "samsung_health";

export type DailyBurnResult = {
  calories: number;
  cardioCalories: number;
  strengthCalories: number;
  source: CalorieSourceKey;
  sourceLabel: string;
  usedFallback: boolean;
};

export interface CalorieSource {
  key: CalorieSourceKey;
  getDailyBurn(userId: string, date: Date, weightKg?: number): Promise<DailyBurnResult | null>;
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeGroup(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function metForMuscleGroup(group: string) {
  if (/perna|quadr|glute|panturr|posterior|leg/.test(group)) return 6.0;
  if (/costas|peito|dorsal|chest|back/.test(group)) return 5.6;
  if (/ombro|braco|biceps|triceps|shoulder|arm/.test(group)) return 5.1;
  if (/abd|core|lombar/.test(group)) return 4.8;
  return 5.2;
}

export class ManualEstimateSource implements CalorieSource {
  key: CalorieSourceKey = "manual";

  async getDailyBurn(userId: string, date: Date, weightKg = 70): Promise<DailyBurnResult> {
    const { start, end } = dayRange(date);

    const cardioResult = await supabase
      .from("cardio_sessions")
      .select("calories,duration_seconds,completed_at,status")
      .or(`student_id.eq.${userId},user_id.eq.${userId}`)
      .gte("completed_at", start)
      .lte("completed_at", end);

    const cardioCalories = (cardioResult.data ?? []).reduce((total, row) => {
      const raw = row as Record<string, unknown>;
      const status = String(raw.status ?? "completed").toLowerCase();
      if (status && !["completed", "complete", "concluido", "concluído"].includes(status)) return total;
      return total + Math.max(0, numberValue(raw.calories));
    }, 0);

    const sessionsResult = await supabase
      .from("workout_sessions")
      .select("id,duration_seconds,started_at,completed_at")
      .or(`student_id.eq.${userId},user_id.eq.${userId}`)
      .gte("completed_at", start)
      .lte("completed_at", end);

    const sessions = (sessionsResult.data ?? []) as Array<Record<string, unknown>>;
    const sessionIds = sessions.map((row) => String(row.id ?? "")).filter(Boolean);

    let executions: Array<Record<string, unknown>> = [];
    if (sessionIds.length) {
      const executionResult = await supabase
        .from("serie_execucoes")
        .select("sessao_id,exercicio_id,reps_executadas,carga_executada_kg,concluida_em")
        .eq("aluno_id", userId)
        .in("sessao_id", sessionIds)
        .not("concluida_em", "is", null);
      executions = (executionResult.data ?? []) as Array<Record<string, unknown>>;
    }

    const exerciseIds = [...new Set(executions.map((row) => String(row.exercicio_id ?? "")).filter(Boolean))];
    const groupByExercise = new Map<string, string>();
    if (exerciseIds.length) {
      const exerciseResult = await supabase
        .from("workout_exercises")
        .select("id,muscle_group")
        .in("id", exerciseIds);
      for (const row of exerciseResult.data ?? []) {
        const raw = row as Record<string, unknown>;
        groupByExercise.set(String(raw.id), normalizeGroup(raw.muscle_group));
      }
    }

    let strengthCalories = 0;
    for (const session of sessions) {
      const sessionId = String(session.id ?? "");
      const durationSeconds = Math.max(0, numberValue(session.duration_seconds));
      if (!durationSeconds) continue;
      const sessionExecutions = executions.filter((row) => String(row.sessao_id ?? "") === sessionId);
      const mets = sessionExecutions.length
        ? sessionExecutions.map((row) => metForMuscleGroup(groupByExercise.get(String(row.exercicio_id ?? "")) ?? ""))
        : [5.2];
      const averageMet = mets.reduce((sum, value) => sum + value, 0) / mets.length;
      strengthCalories += averageMet * Math.max(35, weightKg || 70) * (durationSeconds / 3600);
    }

    const roundedCardio = Math.round(cardioCalories);
    const roundedStrength = Math.round(strengthCalories);
    return {
      calories: roundedCardio + roundedStrength,
      cardioCalories: roundedCardio,
      strengthCalories: roundedStrength,
      source: "manual",
      sourceLabel: "Estimativa do app",
      usedFallback: false,
    };
  }
}

class FutureWearableSource implements CalorieSource {
  key: CalorieSourceKey;
  label: string;
  constructor(key: CalorieSourceKey, label: string) { this.key = key; this.label = label; }
  async getDailyBurn(_userId: string, _date: Date, _weightKg?: number): Promise<DailyBurnResult | null> {
    // Ponto de extensão. Implementar autenticação/sincronização do wearable aqui.
    void this.label;
    return null;
  }
}

const manual = new ManualEstimateSource();
const sources: Record<CalorieSourceKey, CalorieSource> = {
  manual,
  garmin: new FutureWearableSource("garmin", "Garmin Connect"),
  apple_health: new FutureWearableSource("apple_health", "Apple Health"),
  google_fit: new FutureWearableSource("google_fit", "Google Fit"),
  samsung_health: new FutureWearableSource("samsung_health", "Samsung Health"),
};

export async function getDailyBurn(
  preferred: CalorieSourceKey,
  userId: string,
  date: Date,
  weightKg?: number,
): Promise<DailyBurnResult> {
  const requested = sources[preferred] ?? manual;
  const result = await requested.getDailyBurn(userId, date, weightKg);
  if (result) return result;
  const fallback = await manual.getDailyBurn(userId, date, weightKg);
  return { ...fallback, usedFallback: preferred !== "manual" };
}
