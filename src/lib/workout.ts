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
  weekDays: number[];
};

export type WorkoutExerciseRecord = {
  id: string;
  planId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  mediaUrl: string;
  mediaCandidates: string[];
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

export type WorkoutCalendarData = {
  trainedDates: string[];
  trainedThisMonth: number;
  trainedThisWeek: number;
  currentMonthLabel: string;
  todayKey: string;
  weekStartKey: string;
  weekEndKey: string;
  plans: Array<{
    id: string;
    name: string;
    isActive: boolean;
    weekDays: number[];
    reviewAt: string;
  }>;
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

const DEFAULT_GIF = "/gifs/rosca-banco-inclinado-unilateral.gif";
const ROOT_FALLBACK_GIF = "/rosca-banco-inclinado-unilateral.gif";

/**
 * Nomes confirmados no diretório public/gifs do Git:
 * - agachamento-livre.gif
 * - elevacao-lateral.GIF
 * - flexao-de-braco-tradicional.gif
 * - cadeira-extensora.GIF
 * - crucifixo-inclinado-com-halteres.gif
 * - desenvolvimento-com-halteres.gif
 */
const MEDIA_ALIASES: Record<string, string[]> = {
  "rosca inclinada": [
    "/gifs/rosca-banco-inclinado-unilateral.gif",
    "/gifs/rosca-inclinada-com-halteres.gif",
    "/gifs/rosca-inclinada.gif",
    ROOT_FALLBACK_GIF,
  ],
  "rosca inclinada halteres": [
    "/gifs/rosca-banco-inclinado-unilateral.gif",
    "/gifs/rosca-inclinada-com-halteres.gif",
    ROOT_FALLBACK_GIF,
  ],
  "elevacao lateral": [
    "/gifs/elevacao-lateral.GIF",
    "/gifs/elevacao-lateral-sentado.gif",
  ],
  "agachamento livre": ["/gifs/agachamento-livre.gif"],
  "flexao de braco": ["/gifs/flexao-de-braco-tradicional.gif"],
  "cadeira extensora": ["/gifs/cadeira-extensora.GIF"],
  "crucifixo inclinado": ["/gifs/crucifixo-inclinado-com-halteres.gif"],
  "desenvolvimento com halteres": [
    "/gifs/desenvolvimento-com-halteres.gif",
  ],
};

const SIMPLE_EXERCISES: WorkoutExerciseRecord[] = [
  createSimpleExercise({
    id: "simple-1",
    name: "Rosca inclinada",
    muscleGroup: "Bíceps",
    equipment: "Halteres",
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 45,
    notes: "Use uma carga confortável e mantenha o movimento controlado.",
  }),
  createSimpleExercise({
    id: "simple-2",
    name: "Elevação lateral",
    muscleGroup: "Ombros",
    equipment: "Halteres",
    sets: 3,
    repsMin: 10,
    repsMax: 15,
    restSeconds: 45,
    notes: "Não ultrapasse a linha dos ombros.",
  }),
  createSimpleExercise({
    id: "simple-3",
    name: "Agachamento livre",
    muscleGroup: "Pernas",
    equipment: "Peso corporal",
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    notes: "Mantenha o tronco firme e respeite sua amplitude.",
  }),
  createSimpleExercise({
    id: "simple-4",
    name: "Flexão de braço",
    muscleGroup: "Peitoral",
    equipment: "Peso corporal",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 60,
    notes: "Faça com os joelhos apoiados quando necessário.",
  }),
];

function createSimpleExercise(input: {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes: string;
}): WorkoutExerciseRecord {
  const candidates = buildMediaCandidates("", input.name);
  return {
    id: input.id,
    planId: "simple-plan",
    name: input.name,
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
    mediaUrl: candidates[0],
    mediaCandidates: candidates,
    mediaType: "gif",
    sets: input.sets,
    repsMin: input.repsMin,
    repsMax: input.repsMax,
    restSeconds: input.restSeconds,
    initialLoadKg: 0,
    notes: input.notes,
    position: Number(input.id.split("-")[1]) || 1,
    isSimple: true,
  };
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function slugify(value: unknown) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeExplicitMediaPath(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const normalized = raw
    .replace(/^\.\/public\//i, "")
    .replace(/^public\//i, "")
    .replace(/^\/+/, "");

  if (/^gifs\//i.test(normalized)) {
    return `/${normalized}`;
  }

  if (/\.(gif|png|jpe?g|webp|avif|svg|mp4|webm|ogg|mov|m4v)$/i.test(normalized)) {
    return `/gifs/${normalized}`;
  }

  return `/${normalized}`;
}

export function buildMediaCandidates(
  explicitValue: unknown,
  exerciseName: unknown,
) {
  const explicit = normalizeExplicitMediaPath(explicitValue);
  const normalizedName = normalizeText(exerciseName);
  const slug = slugify(exerciseName);

  const aliasMatches = Object.entries(MEDIA_ALIASES)
    .filter(([alias]) => normalizedName.includes(alias))
    .flatMap(([, values]) => values);

  const generated = slug
    ? [
        `/gifs/${slug}.gif`,
        `/gifs/${slug}.GIF`,
        `/gifs/${slug}-com-halteres.gif`,
        `/gifs/${slug}-unilateral.gif`,
      ]
    : [];

  return unique([
    explicit,
    ...aliasMatches,
    ...generated,
    DEFAULT_GIF,
    ROOT_FALLBACK_GIF,
  ]);
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

function parseWeekDays(value: unknown): number[] {
  const dayMap: Record<string, number> = {
    domingo: 0,
    dom: 0,
    sunday: 0,
    sun: 0,
    segunda: 1,
    seg: 1,
    monday: 1,
    mon: 1,
    terca: 2,
    ter: 2,
    terça: 2,
    tuesday: 2,
    tue: 2,
    quarta: 3,
    qua: 3,
    wednesday: 3,
    wed: 3,
    quinta: 4,
    qui: 4,
    thursday: 4,
    thu: 4,
    sexta: 5,
    sex: 5,
    friday: 5,
    fri: 5,
    sabado: 6,
    sábado: 6,
    sab: 6,
    saturday: 6,
    sat: 6,
  };

  const rawValues = (() => {
    if (Array.isArray(value)) return value;
    if (typeof value === "number") return [value];
    if (value && typeof value === "object") {
      return Object.entries(value as Record<string, unknown>)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key);
    }

    const raw = String(value ?? "").trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") {
        return Object.entries(parsed)
          .filter(([, enabled]) => Boolean(enabled))
          .map(([key]) => key);
      }
    } catch {
      // Continue with comma/space parsing.
    }

    return raw.split(/[,;|/]+|\s{2,}/g);
  })();

  return unique(
    rawValues
      .map((entry) => {
        if (typeof entry === "number") {
          return entry >= 0 && entry <= 6 ? String(entry) : "";
        }

        const normalized = normalizeText(entry);
        if (/^[0-6]$/.test(normalized)) return normalized;
        const matched = dayMap[normalized];
        return matched === undefined ? "" : String(matched);
      })
      .filter(Boolean),
  )
    .map(Number)
    .sort((a, b) => a - b);
}

function normalizePlan(raw: Record<string, unknown>): WorkoutPlanRecord {
  const weekDays = parseWeekDays(
    raw.days_of_week ??
      raw.week_days ??
      raw.weekdays ??
      raw.training_days ??
      raw.schedule,
  );

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
    weekDays,
  };
}

function normalizeExercise(
  raw: Record<string, unknown>,
): WorkoutExerciseRecord {
  const name = String(
    raw.name ?? raw.exercise_name ?? raw.title ?? "Exercício",
  );
  const explicitMedia =
    raw.media_url ??
    raw.gif_url ??
    raw.video_url ??
    raw.image_url ??
    raw.animation_url ??
    raw.media ??
    raw.gif ??
    raw.video;

  const mediaCandidates = buildMediaCandidates(explicitMedia, name);
  const mediaUrl = mediaCandidates[0];

  return {
    id: String(raw.id ?? ""),
    planId: String(raw.plan_id ?? raw.workout_id ?? ""),
    name,
    muscleGroup: String(raw.muscle_group ?? raw.grupo_muscular ?? ""),
    equipment: String(raw.equipment ?? raw.equipamento ?? ""),
    mediaUrl,
    mediaCandidates,
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

function isoDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

async function querySessionsByStudent(
  userId: string,
  fromIso: string,
  toIso: string,
) {
  const first = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("student_id", userId)
    .gte("completed_at", fromIso)
    .lte("completed_at", toIso)
    .order("completed_at", { ascending: false });

  if (!first.error) return first;

  return await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("completed_at", fromIso)
    .lte("completed_at", toIso)
    .order("completed_at", { ascending: false });
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
      weekDays: [1, 3, 5],
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
    const { data: planRows, error: planError } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("student_id", userId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .order("created_at", { ascending: false });

    if (planError) {
      return {
        status: "error",
        reason:
          "Não foi possível consultar seu treino. Atualize a página ou fale com a recepção.",
      };
    }

    if (!planRows?.length) {
      return { status: "empty" };
    }

    const today = new Date().getDay();
    const planData =
      planRows.find((row) =>
        parseWeekDays(
          (row as Record<string, unknown>).week_days ??
            (row as Record<string, unknown>).days_of_week,
        ).includes(today),
      ) ?? planRows[0];

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

export async function loadWorkoutCalendar(
  userId: string,
  currentPlan: WorkoutPlanRecord | null,
): Promise<WorkoutCalendarData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const fallback: WorkoutCalendarData = {
    trainedDates: [],
    trainedThisMonth: 0,
    trainedThisWeek: 0,
    currentMonthLabel: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(now),
    todayKey: isoDateKey(now),
    weekStartKey: isoDateKey(weekStart),
    weekEndKey: isoDateKey(weekEnd),
    plans: currentPlan
      ? [
          {
            id: currentPlan.id,
            name: currentPlan.name,
            isActive: true,
            weekDays: currentPlan.weekDays,
            reviewAt: currentPlan.reviewAt,
          },
        ]
      : [],
  };

  if (!isSupabaseConfigured || currentPlan?.isSimple) {
    return fallback;
  }

  try {
    const [planResponse, sessionResponse] = await Promise.all([
      supabase
        .from("workout_plans")
        .select("*")
        .eq("student_id", userId)
        .order("is_active", { ascending: false })
        .order("version", { ascending: false }),
      querySessionsByStudent(
        userId,
        monthStart.toISOString(),
        monthEnd.toISOString(),
      ),
    ]);

    const plans = (planResponse.data ?? []).map((row) => {
      const normalized = normalizePlan(row as Record<string, unknown>);
      return {
        id: normalized.id,
        name: normalized.name,
        isActive: Boolean((row as Record<string, unknown>).is_active),
        weekDays: normalized.weekDays,
        reviewAt: normalized.reviewAt,
      };
    });

    const sessionRows = sessionResponse.data ?? [];
    const trainedDates = unique(
      sessionRows
        .map((row) =>
          isoDateKey(
            String(
              (row as Record<string, unknown>).completed_at ??
                (row as Record<string, unknown>).started_at ??
                "",
            ),
          ),
        )
        .filter(Boolean),
    );

    const trainedThisWeek = trainedDates.filter(
      (date) =>
        date >= isoDateKey(weekStart) && date <= isoDateKey(weekEnd),
    ).length;

    return {
      ...fallback,
      trainedDates,
      trainedThisMonth: trainedDates.length,
      trainedThisWeek,
      plans: plans.length ? plans : fallback.plans,
    };
  } catch {
    return fallback;
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

  const payload = {
    student_id: userId,
    plan_id: planId,
    started_at: new Date().toISOString(),
    completion_percentage: 0,
    duration_seconds: 0,
    valid_for_ranking: false,
  };

  let response = await supabase
    .from("workout_sessions")
    .insert(payload)
    .select("id")
    .single();

  if (response.error) {
    response = await supabase
      .from("workout_sessions")
      .insert({
        ...payload,
        student_id: undefined,
        user_id: userId,
      })
      .select("id")
      .single();
  }

  if (response.error || !response.data?.id) {
    return {
      id: `local-session-${Date.now()}`,
      local: true,
    };
  }

  return {
    id: String(response.data.id),
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
      onConflict: "session_id,workout_exercise_id,set_number",
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
