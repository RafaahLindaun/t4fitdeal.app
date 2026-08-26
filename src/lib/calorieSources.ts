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

type Row = Record<string, unknown>;

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeGroup(value: unknown) {
  return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function metForMuscleGroup(group: string) {
  if (/perna|quadr|glute|panturr|posterior|leg/.test(group)) return 6.0;
  if (/costas|peito|dorsal|chest|back/.test(group)) return 5.6;
  if (/ombro|braco|biceps|triceps|shoulder|arm/.test(group)) return 5.1;
  if (/abd|core|lombar/.test(group)) return 4.8;
  return 5.2;
}

function localDayKey(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timestampFrom(row: Row, candidates: string[]) {
  for (const key of candidates) {
    const value = text(row[key]);
    if (value && !Number.isNaN(new Date(value).getTime())) return value;
  }
  return "";
}

function belongsToLocalDay(row: Row, target: Date, candidates: string[]) {
  const timestamp = timestampFrom(row, candidates);
  return Boolean(timestamp) && localDayKey(timestamp) === localDayKey(target);
}

async function rowsByIdentity(table: string, userId: string, identityColumns: string[], limit = 500): Promise<Row[]> {
  // Algumas tabelas legadas coexistem com mais de uma coluna de identidade
  // (ex.: student_id + user_id). Consultar apenas a primeira coluna válida pode
  // retornar [] mesmo quando os registros reais estão na segunda. Mesclamos todas
  // as consultas que existem no schema e deduplicamos pelo id.
  const merged = new Map<string, Row>();
  let successfulQuery = false;

  for (const column of identityColumns) {
    const response = await (supabase.from(table) as any)
      .select("*")
      .eq(column, userId)
      .limit(limit);

    if (response.error) continue;
    successfulQuery = true;

    for (const row of (response.data ?? []) as Row[]) {
      const stableKey = text(row.id) || `${column}:${JSON.stringify(row)}`;
      merged.set(stableKey, row);
    }
  }

  return successfulQuery ? [...merged.values()] : [];
}

async function rowsByIds(table: string, ids: string[], idColumn = "id"): Promise<Row[]> {
  if (!ids.length) return [];
  const response = await (supabase.from(table) as any).select("*").in(idColumn, ids);
  return response.error ? [] : (response.data ?? []) as Row[];
}

function completedCardio(row: Row) {
  const status = normalizeGroup(row.status);
  if (!status) return Boolean(timestampFrom(row, ["completed_at", "finished_at"]));
  return ["completed", "complete", "concluido", "finalizado", "finished", "done"].includes(status);
}

function cardioCaloriesFrom(row: Row) {
  for (const key of ["calories", "calorias", "calorias_estimadas", "estimated_calories", "kcal"]) {
    const value = numberValue(row[key]);
    if (value > 0) return value;
  }
  return 0;
}

async function loadStrengthHistoryDurations(userId: string, date: Date) {
  const rows = await rowsByIdentity("accqua_activity_history", userId, ["student_id", "user_id", "aluno_id"], 300);
  const map = new Map<string, number>();
  for (const row of rows) {
    if (normalizeGroup(row.activity_kind ?? row.kind) !== "workout") continue;
    if (!belongsToLocalDay(row, date, ["performed_at", "completed_at", "created_at"])) continue;
    const sourceId = text(row.source_session_id ?? row.session_id ?? row.sessao_id);
    const duration = Math.max(0, numberValue(row.duration_seconds));
    if (sourceId && duration > 0) map.set(sourceId, duration);
  }
  return map;
}

function durationFromExecutions(executions: Row[]) {
  if (!executions.length) return 0;
  const timestamps = executions
    .map((row) => new Date(timestampFrom(row, ["concluida_em", "atualizado_em", "criado_em"])).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (timestamps.length >= 2) {
    // Inclui uma janela curta para a última série sem transformar pausas longas em treino ativo.
    const spreadSeconds = Math.max(0, (timestamps[timestamps.length - 1] - timestamps[0]) / 1000);
    return Math.min(3 * 60 * 60, Math.max(executions.length * 35, spreadSeconds + 45));
  }
  return executions.length * 45;
}

export class ManualEstimateSource implements CalorieSource {
  key: CalorieSourceKey = "manual";

  async getDailyBurn(userId: string, date: Date, weightKg = 70): Promise<DailyBurnResult> {
    const cardioRows = await rowsByIdentity("cardio_sessions", userId, ["student_id", "user_id", "aluno_id"], 500);
    const cardioCalories = cardioRows.reduce((total, row) => {
      if (!completedCardio(row)) return total;
      if (!belongsToLocalDay(row, date, ["completed_at", "finished_at", "updated_at", "started_at", "created_at"])) return total;
      return total + Math.max(0, cardioCaloriesFrom(row));
    }, 0);

    // A Build 1.3 consolida as duas fontes de séries que coexistem no app:
    // - serie_execucoes (fluxo novo)
    // - workout_set_logs (Treino clássico preservado)
    // O filtro de "hoje" é sempre feito pelo fuso local do aparelho.
    const [allExecutions, allWorkoutSessions] = await Promise.all([
      rowsByIdentity("serie_execucoes", userId, ["aluno_id", "student_id", "user_id"], 1500),
      rowsByIdentity("workout_sessions", userId, ["student_id", "user_id", "aluno_id"], 500),
    ]);

    const executions = allExecutions.filter((row) =>
      Boolean(row.concluida_em ?? row.completed_at)
      && belongsToLocalDay(row, date, ["concluida_em", "completed_at", "atualizado_em", "criado_em", "created_at"]),
    );

    const todaySessions = allWorkoutSessions.filter((row) =>
      belongsToLocalDay(row, date, ["completed_at", "started_at", "created_at"]),
    );
    const todaySessionIds = todaySessions.map((row) => text(row.id)).filter(Boolean);
    const classicLogs = await rowsByIds("workout_set_logs", todaySessionIds, "session_id");

    const sessionById = new Map(todaySessions.map((row) => [text(row.id), row]));
    const historyDurations = await loadStrengthHistoryDurations(userId, date);

    const allExerciseIds = [...new Set([
      ...executions.map((row) => text(row.exercicio_id ?? row.workout_exercise_id)),
      ...classicLogs.map((row) => text(row.workout_exercise_id ?? row.exercise_id ?? row.exercicio_id)),
    ].filter(Boolean))];
    const exerciseRows = await rowsByIds("workout_exercises", allExerciseIds);
    const groupByExercise = new Map<string, string>();
    for (const row of exerciseRows) {
      groupByExercise.set(text(row.id), normalizeGroup(row.muscle_group ?? row.group_name ?? row.muscleGroup));
    }

    const activityBySession = new Map<string, Row[]>();
    for (const row of executions) {
      const sessionId = text(row.sessao_id ?? row.session_id) || `execution-${text(row.id)}`;
      const bucket = activityBySession.get(sessionId) ?? [];
      bucket.push(row);
      activityBySession.set(sessionId, bucket);
    }
    for (const row of classicLogs) {
      const sessionId = text(row.session_id) || `classic-${text(row.id)}`;
      const bucket = activityBySession.get(sessionId) ?? [];
      // Se a mesma sessão já possui serie_execucoes, não duplicamos séries legadas.
      if (!bucket.some((entry) => Boolean(entry.exercicio_id ?? entry.sessao_id))) bucket.push(row);
      activityBySession.set(sessionId, bucket);
    }

    let strengthCalories = 0;
    const safeWeight = Math.max(35, numberValue(weightKg) || 70);
    for (const [sessionId, sessionRows] of activityBySession) {
      const session = sessionById.get(sessionId) ?? {};
      const timestamps = sessionRows
        .map((row) => new Date(timestampFrom(row, ["concluida_em", "completed_at", "atualizado_em", "created_at"])).getTime())
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      const logDuration = timestamps.length >= 2
        ? Math.min(3 * 60 * 60, Math.max(sessionRows.length * 35, (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 + 45))
        : sessionRows.length * 45;
      const durationSeconds = Math.max(
        0,
        numberValue(session.duration_seconds),
        historyDurations.get(sessionId) ?? 0,
        durationFromExecutions(sessionRows),
        logDuration,
      );
      if (!durationSeconds) continue;

      const mets = sessionRows.map((row) =>
        metForMuscleGroup(groupByExercise.get(text(row.exercicio_id ?? row.workout_exercise_id ?? row.exercise_id)) ?? ""),
      );
      const averageMet = mets.length ? mets.reduce((sum, value) => sum + value, 0) / mets.length : 5.2;
      strengthCalories += averageMet * safeWeight * (durationSeconds / 3600);
    }

    const roundedCardio = Math.max(0, Math.round(Number.isFinite(cardioCalories) ? cardioCalories : 0));
    const roundedStrength = Math.max(0, Math.round(Number.isFinite(strengthCalories) ? strengthCalories : 0));
    return {
      calories: roundedCardio + roundedStrength,
      cardioCalories: roundedCardio,
      strengthCalories: roundedStrength,
      source: "manual",
      sourceLabel: "Treinos registrados",
      usedFallback: false,
    };
  }
}

class FutureWearableSource implements CalorieSource {
  key: CalorieSourceKey;
  label: string;
  constructor(key: CalorieSourceKey, label: string) { this.key = key; this.label = label; }
  async getDailyBurn(_userId: string, _date: Date, _weightKg?: number): Promise<DailyBurnResult | null> {
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
