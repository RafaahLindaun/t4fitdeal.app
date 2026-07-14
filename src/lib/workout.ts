import { isSupabaseConfigured, supabase } from "./supabase";

export type WorkoutMediaType = "gif" | "image" | "video" | "link";

export type WorkoutPlanRecord = {
  id: string;
  studentId: string;
  professorId: string | null;
  name: string;
  focus: string;
  version: number;
  notes: string;
  reviewAt: string;
  isSimple: boolean;
};

export type WorkoutExerciseRecord = {
  id: string;
  planId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  mediaUrl: string;
  mediaType: WorkoutMediaType;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  initialLoadKg: number;
  notes: string;
  position: number;
  isSimple: boolean;
};

export type AssignedWorkoutResult =
  | {
      status: "ready";
      plan: WorkoutPlanRecord;
      exercises: WorkoutExerciseRecord[];
    }
  | {
      status: "empty";
      reason?: string;
    }
  | {
      status: "error";
      reason: string;
    };

export type SessionStartResult = {
  id: string;
  local: boolean;
};

const DEFAULT_GIF = "/rosca-banco-inclinado-unilateral.gif";

const SIMPLE_EXERCISES: WorkoutExerciseRecord[] = [
  {
    id: "simple-1",
    planId: "simple-plan",
    name: "Rosca inclinada",
    muscleGroup: "Bíceps",
    equipment: "Halteres",
    mediaUrl: DEFAULT_GIF,
    mediaType: "gif",
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 45,
    initialLoadKg: 0,
    notes: "Use uma carga confortável e mantenha o movimento controlado.",
    position: 1,
    isSimple: true,
  },
  {
    id: "simple-2",
    planId: "simple-plan",
    name: "Elevação lateral",
    muscleGroup: "Ombros",
    equipment: "Halteres",
    mediaUrl: DEFAULT_GIF,
    mediaType: "gif",
    sets: 3,
    repsMin: 10,
    repsMax: 15,
    restSeconds: 45,
    initialLoadKg: 0,
    notes: "Não ultrapasse a linha dos ombros.",
    position: 2,
    isSimple: true,
  },
  {
    id: "simple-3",
    planId: "simple-plan",
    name: "Agachamento livre",
    muscleGroup: "Pernas",
    equipment: "Peso corporal",
    mediaUrl: DEFAULT_GIF,
    mediaType: "gif",
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    initialLoadKg: 0,
    notes: "Mantenha o tronco firme e respeite sua amplitude.",
    position: 3,
    isSimple: true,
  },
  {
    id: "simple-4",
    planId: "simple-plan",
    name: "Flexão de braços",
    muscleGroup: "Peitoral",
    equipment: "Peso corporal",
    mediaUrl: DEFAULT_GIF,
    mediaType: "gif",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 60,
    initialLoadKg: 0,
    notes: "Faça com os joelhos apoiados quando necessário.",
    position: 4,
    isSimple: true,
  },
];

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function publicMediaPath(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_GIF;
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const normalized = raw
    .replace(/^public\//i, "")
    .replace(/^\.\/public\//i, "")
    .replace(/^\/+/, "");

  return `/${normalized}`;
}

function inferMediaType(
  rawType: unknown,
  mediaUrl: string,
): WorkoutMediaType {
  const normalizedType = String(rawType ?? "").toLowerCase();

  if (
    normalizedType === "video" ||
    /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(mediaUrl)
  ) {
    return "video";
  }

  if (
    normalizedType === "gif" ||
    /\.gif(\?|#|$)/i.test(mediaUrl)
  ) {
    return "gif";
  }

  if (
    normalizedType === "image" ||
    /\.(png|jpe?g|webp|avif|svg)(\?|#|$)/i.test(mediaUrl)
  ) {
    return "image";
  }

  if (/youtu\.be|youtube\.com|vimeo\.com/i.test(mediaUrl)) {
    return "link";
  }

  if (/^https?:\/\//i.test(mediaUrl)) {
    return "link";
  }

  return "gif";
}

function normalizePlan(raw: Record<string, unknown>): WorkoutPlanRecord {
  return {
    id: String(raw.id ?? ""),
    studentId: String(raw.student_id ?? raw.user_id ?? raw.aluno_id ?? ""),
    professorId: raw.professor_id
      ? String(raw.professor_id)
      : raw.teacher_id
        ? String(raw.teacher_id)
        : null,
    name: String(raw.name ?? raw.title ?? "Treino"),
    focus: String(raw.focus ?? raw.objective ?? ""),
    version: Math.max(1, toNumber(raw.version, 1)),
    notes: String(raw.notes ?? raw.description ?? ""),
    reviewAt: String(raw.review_at ?? ""),
    isSimple: false,
  };
}

function normalizeExercise(
  raw: Record<string, unknown>,
): WorkoutExerciseRecord {
  const mediaUrl = publicMediaPath(
    raw.media_url ??
      raw.gif_url ??
      raw.video_url ??
      raw.image_url ??
      raw.animation_url ??
      raw.media,
  );

  return {
    id: String(raw.id ?? ""),
    planId: String(raw.plan_id ?? raw.workout_id ?? ""),
    name: String(raw.name ?? raw.exercise_name ?? raw.title ?? "Exercício"),
    muscleGroup: String(raw.muscle_group ?? raw.grupo_muscular ?? ""),
    equipment: String(raw.equipment ?? raw.equipamento ?? ""),
    mediaUrl,
    mediaType: inferMediaType(raw.media_type, mediaUrl),
    sets: Math.max(1, Math.min(20, toNumber(raw.sets ?? raw.series, 3))),
    repsMin: Math.max(
      1,
      toNumber(raw.reps_min ?? raw.repetitions_min ?? raw.reps, 8),
    ),
    repsMax: Math.max(
      1,
      toNumber(raw.reps_max ?? raw.repetitions_max ?? raw.reps, 12),
    ),
    restSeconds: Math.max(
      0,
      toNumber(raw.rest_seconds ?? raw.descanso, 60),
    ),
    initialLoadKg: Math.max(
      0,
      toNumber(raw.initial_load_kg ?? raw.load_kg ?? raw.carga, 0),
    ),
    notes: String(raw.notes ?? raw.observations ?? ""),
    position: toNumber(raw.position ?? raw.order_index, 0),
    isSimple: false,
  };
}

export function getSimpleWorkout(): {
  plan: WorkoutPlanRecord;
  exercises: WorkoutExerciseRecord[];
} {
  return {
    plan: {
      id: "simple-plan",
      studentId: "",
      professorId: null,
      name: "Treino livre",
      focus: "Treino simples",
      version: 1,
      notes:
        "Treino básico para você se movimentar enquanto seu professor prepara seu plano.",
      reviewAt: "",
      isSimple: true,
    },
    exercises: SIMPLE_EXERCISES.map((exercise) => ({ ...exercise })),
  };
}

export async function loadAssignedWorkout(
  userId: string,
): Promise<AssignedWorkoutResult> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      reason: "O Supabase não está configurado.",
    };
  }

  try {
    const { data: planData, error: planError } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("student_id", userId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      return {
        status: "error",
        reason:
          "Não foi possível consultar seu treino. Atualize a página ou fale com a recepção.",
      };
    }

    if (!planData) {
      return { status: "empty" };
    }

    const plan = normalizePlan(planData as Record<string, unknown>);

    const { data: exerciseData, error: exerciseError } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("plan_id", plan.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (exerciseError) {
      return {
        status: "error",
        reason:
          "Seu treino foi encontrado, mas não foi possível carregar os exercícios.",
      };
    }

    const exercises = (exerciseData ?? [])
      .map((row) => normalizeExercise(row as Record<string, unknown>))
      .filter((exercise) => Boolean(exercise.id));

    if (!exercises.length) {
      return {
        status: "empty",
        reason:
          "Seu professor já criou o treino, mas ainda não adicionou exercícios.",
      };
    }

    return {
      status: "ready",
      plan,
      exercises,
    };
  } catch {
    return {
      status: "error",
      reason:
        "Ocorreu uma falha ao carregar seu treino. Tente novamente.",
    };
  }
}

export async function startWorkoutSession(
  userId: string,
  planId: string | null,
): Promise<SessionStartResult> {
  if (!isSupabaseConfigured || !planId || planId.startsWith("simple-")) {
    return {
      id: `local-session-${Date.now()}`,
      local: true,
    };
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      plan_id: planId,
      started_at: new Date().toISOString(),
      completion_percentage: 0,
      duration_seconds: 0,
      valid_for_ranking: false,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      id: `local-session-${Date.now()}`,
      local: true,
    };
  }

  return {
    id: String(data.id),
    local: false,
  };
}

export async function saveCompletedSet(input: {
  sessionId: string;
  localSession: boolean;
  exerciseId: string;
  simpleExercise: boolean;
  setNumber: number;
  loadKg: number;
  reps: number;
}) {
  if (
    input.localSession ||
    input.simpleExercise ||
    !isSupabaseConfigured
  ) {
    return;
  }

  await supabase.from("workout_set_logs").upsert(
    {
      session_id: input.sessionId,
      workout_exercise_id: input.exerciseId,
      set_number: input.setNumber,
      load_kg: input.loadKg,
      reps: input.reps,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict:
        "session_id,workout_exercise_id,set_number",
    },
  );
}

export async function finishWorkoutSession(input: {
  sessionId: string;
  localSession: boolean;
  simpleWorkout: boolean;
  completionPercentage: number;
  durationSeconds: number;
}): Promise<{
  saved: boolean;
  validForRanking: boolean;
}> {
  if (
    input.localSession ||
    input.simpleWorkout ||
    !isSupabaseConfigured
  ) {
    return {
      saved: true,
      validForRanking: false,
    };
  }

  const { data, error } = await supabase.rpc(
    "complete_workout_session",
    {
      p_session_id: input.sessionId,
      p_completion_percentage: input.completionPercentage,
      p_duration_seconds: input.durationSeconds,
    },
  );

  if (!error) {
    return {
      saved: true,
      validForRanking: Boolean(data),
    };
  }

  const validForRanking =
    input.completionPercentage >= 70 &&
    input.durationSeconds >= 900;

  const { error: updateError } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
      completion_percentage: Math.min(
        100,
        Math.max(0, input.completionPercentage),
      ),
      duration_seconds: Math.max(0, input.durationSeconds),
      valid_for_ranking: validForRanking,
    })
    .eq("id", input.sessionId);

  return {
    saved: !updateError,
    validForRanking: !updateError && validForRanking,
  };
}
