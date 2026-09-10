import { isSupabaseConfigured, supabase } from "./supabase";
import { loadUnreadNotificationCountV153 } from "./notifications";
import { loadAssignedWorkout, type WorkoutExerciseRecord, type WorkoutPlanRecord } from "./workout";

type Row = Record<string, unknown>;

export type HomeWorkoutSummary = {
  status: "ready" | "empty" | "error";
  plan: WorkoutPlanRecord | null;
  exercises: WorkoutExerciseRecord[];
  exerciseCount: number;
  estimatedMinutes: number;
  completedExercises: number;
  completedSets: number;
  totalSets: number;
  sessionId: string | null;
  hasProgress: boolean;
  reason?: string;
};

export type MembershipHealth = "ativa" | "vencendo" | "inativa";

export type HomeDashboardData = {
  workout: HomeWorkoutSummary;
  membershipValidUntil: string;
};

export function statusMatricula(validUntil: string | Date | null | undefined, today = new Date()): MembershipHealth {
  if (!validUntil) return "inativa";
  const value = validUntil instanceof Date ? validUntil : new Date(`${String(validUntil).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(value.getTime())) return "inativa";
  const base = new Date(today); base.setHours(12, 0, 0, 0);
  value.setHours(12, 0, 0, 0);
  const days = Math.floor((value.getTime() - base.getTime()) / 86_400_000);
  if (days < 0) return "inativa";
  if (days <= 7) return "vencendo";
  return "ativa";
}

async function loadMembershipValidity(userId: string) {
  if (!isSupabaseConfigured || !userId) return "";
  const response = await (supabase.from("profiles") as any)
    .select("matricula_valida_ate")
    .eq("id", userId)
    .maybeSingle();
  if (response.error) return "";
  return text(response.data?.matricula_valida_ate);
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function localDayKey(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function rowTimestamp(row: Row, candidates: string[]) {
  for (const key of candidates) {
    const value = text(row[key]);
    if (value && !Number.isNaN(new Date(value).getTime())) return value;
  }
  return "";
}

function estimateWorkoutMinutes(exercises: WorkoutExerciseRecord[]) {
  const seconds = exercises.reduce((total, exercise, index) => {
    const sets = Math.max(1, numberValue(exercise.sets));
    const workSeconds = sets * 38;
    const restSeconds = Math.max(0, sets - 1) * Math.max(0, numberValue(exercise.restSeconds));
    const transitionSeconds = index < exercises.length - 1 ? 35 : 0;
    return total + workSeconds + restSeconds + transitionSeconds;
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}

async function loadWorkoutSummary(userId: string): Promise<HomeWorkoutSummary> {
  const assigned = await loadAssignedWorkout(userId);
  if (assigned.status !== "ready") {
    return {
      status: assigned.status,
      plan: null,
      exercises: [],
      exerciseCount: 0,
      estimatedMinutes: 0,
      completedExercises: 0,
      completedSets: 0,
      totalSets: 0,
      sessionId: null,
      hasProgress: false,
      reason: assigned.reason,
    };
  }

  const { plan, exercises } = assigned;
  const totalSets = exercises.reduce((sum, exercise) => sum + Math.max(1, exercise.sets), 0);
  const todayKey = localDayKey(new Date());
  let sessionId: string | null = null;
  let completedSets = 0;
  let completedExercises = 0;

  if (isSupabaseConfigured) {
    // Build 1.7.0: student_id é a identidade canônica de workout_sessions.
    // Removidos os fallbacks user_id/aluno_id que geravam até 3 requests para a mesma informação.
    const sessionsResponse = await supabase
      .from("workout_sessions")
      .select("id,plan_id,started_at,completed_at,created_at")
      .eq("student_id", userId)
      .eq("plan_id", plan.id)
      .order("started_at", { ascending: false })
      .limit(12);

    const sessions = sessionsResponse.error ? [] : ((sessionsResponse.data ?? []) as Row[]);
    const todaySessions = sessions.filter((row) => localDayKey(rowTimestamp(row, ["started_at", "completed_at", "created_at"])) === todayKey);
    const openSession = todaySessions.find((row) => !row.completed_at);
    const progressSession = openSession ?? todaySessions[0];
    sessionId = openSession ? text(openSession.id) || null : null;

    const progressSessionId = progressSession ? text(progressSession.id) : "";
    if (progressSessionId) {
      const logsResponse = await supabase
        .from("workout_set_logs")
        .select("workout_exercise_id,exercise_id,exercicio_id,set_number,serie_numero")
        .eq("session_id", progressSessionId);
      const logs = logsResponse.error ? [] : ((logsResponse.data ?? []) as Row[]);
      const exerciseSetCounts = new Map<string, Set<number>>();
      for (const log of logs) {
        const exerciseId = text(log.workout_exercise_id ?? log.exercise_id ?? log.exercicio_id);
        if (!exerciseId) continue;
        const bucket = exerciseSetCounts.get(exerciseId) ?? new Set<number>();
        bucket.add(Math.max(1, numberValue(log.set_number ?? log.serie_numero)));
        exerciseSetCounts.set(exerciseId, bucket);
      }

      completedSets = [...exerciseSetCounts.values()].reduce((sum, set) => sum + set.size, 0);
      completedExercises = exercises.filter((exercise) =>
        (exerciseSetCounts.get(exercise.id)?.size ?? 0) >= Math.max(1, exercise.sets),
      ).length;
    }
  }

  return {
    status: "ready",
    plan,
    exercises,
    exerciseCount: exercises.length,
    estimatedMinutes: estimateWorkoutMinutes(exercises),
    completedExercises,
    completedSets,
    totalSets,
    sessionId,
    hasProgress: completedSets > 0 && completedSets < totalSets,
    reason: undefined,
  };
}

export async function loadHomeDashboard(userId: string): Promise<HomeDashboardData> {
  const [workout, membershipValidUntil] = await Promise.all([
    loadWorkoutSummary(userId),
    loadMembershipValidity(userId),
  ]);
  return { workout, membershipValidUntil };
}

export async function loadUnreadNotificationCount(userId: string) {
  if (!isSupabaseConfigured || !userId) return 0;
  // V1.5.3 já soma a central atual + notifications legadas por user_id.
  // O fallback antigo repetia a mesma busca por três colunas quando o total era zero.
  return loadUnreadNotificationCountV153(userId);
}
