import { isSupabaseConfigured, supabase } from "./supabase";
import { deriveRitmoSemanal, endOfTreinoWeek, loadTreinoStatus, localDateKey, startOfTreinoWeek } from "./workoutStatus";

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
export type WorkoutSessionProgress = {
  id: string;
  startedAt: string;
  completedSets: Array<{
    exerciseId: string;
    setNumber: number;
    loadKg: number;
    reps: number;
  }>;
};


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


function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function withRequestTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = 12000,
): Promise<T> {
  let timer = 0;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(
          () => reject(new Error("Tempo limite ao salvar o treino.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

function stripMediaWrapping(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\\/g, "/");
}

function safelyDecodeMediaPath(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeExplicitMediaPath(value: unknown) {
  const raw = safelyDecodeMediaPath(stripMediaWrapping(value));
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
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  if (/^gifs\//i.test(normalized)) {
    return `/${normalized}`;
  }

  if (/\.(gif|png|jpe?g|webp|avif|svg|mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(normalized)) {
    return `/gifs/${normalized}`;
  }

  return `/${normalized}`;
}


export function buildMediaCandidates(
  explicitValue: unknown,
  _exerciseName: unknown,
) {
  // Build 1.3.6: não tentar adivinhar nome/case do arquivo.
  // A URL persistida no banco (Storage) é a fonte definitiva.
  const explicit = normalizeExplicitMediaPath(explicitValue);
  return explicit ? [explicit] : [];
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
  const mediaUrl = mediaCandidates[0] ?? "";

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
    // A ficha atribuída é independente de existir sessão no dia. Bases antigas
    // podem vincular o aluno por student_id ou user_id; tentamos ambas antes de
    // declarar que o aluno realmente não possui ficha ativa.
    let planRows: any[] = [];
    let successfulPlanQuery = false;
    let lastPlanError: any = null;
    for (const identity of ["student_id", "user_id"]) {
      const response = await (supabase.from("workout_plans") as any)
        .select("*")
        .eq(identity, userId)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .order("created_at", { ascending: false });
      if (response.error) {
        lastPlanError = response.error;
        continue;
      }
      successfulPlanQuery = true;
      if ((response.data ?? []).length) {
        planRows = response.data ?? [];
        break;
      }
    }

    if (!successfulPlanQuery) {
      console.error("[ACCQUA] Falha ao consultar ficha atribuída", lastPlanError);
      return {
        status: "error",
        reason: "Não foi possível consultar sua ficha agora. Tente novamente em instantes.",
      };
    }

    if (!planRows.length) {
      return { status: "empty", reason: "Nenhuma ficha ativa foi atribuída ao aluno." };
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
  const weekStart = startOfTreinoWeek(now);
  const weekEnd = endOfTreinoWeek(now);

  const fallback: WorkoutCalendarData = {
    trainedDates: [],
    trainedThisMonth: 0,
    trainedThisWeek: 0,
    currentMonthLabel: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(now),
    todayKey: localDateKey(now),
    weekStartKey: localDateKey(weekStart),
    weekEndKey: localDateKey(weekEnd),
    plans: currentPlan
      ? [{
          id: currentPlan.id,
          name: currentPlan.name,
          isActive: true,
          weekDays: currentPlan.weekDays,
          reviewAt: currentPlan.reviewAt,
        }]
      : [],
  };

  if (!isSupabaseConfigured || currentPlan?.isSimple) return fallback;

  try {
    const [planResponse, canonicalStatus] = await Promise.all([
      supabase
        .from("workout_plans")
        .select("*")
        .eq("student_id", userId)
        .order("is_active", { ascending: false })
        .order("version", { ascending: false }),
      loadTreinoStatus(userId, { periodo: "mes", reference: now }),
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

    const trainedThisWeek = deriveRitmoSemanal(
      canonicalStatus,
      currentPlan?.weekDays ?? [],
      now,
    ).completedPlannedDays;

    return {
      ...fallback,
      trainedDates: canonicalStatus.completedDates,
      trainedThisMonth: canonicalStatus.completedDates.length,
      trainedThisWeek,
      plans: plans.length ? plans : fallback.plans,
    };
  } catch {
    return fallback;
  }
}

export async function loadWorkoutSessionProgress(
  userId: string,
  sessionId: string,
): Promise<WorkoutSessionProgress | null> {
  if (!isSupabaseConfigured || !userId || !sessionId || sessionId.startsWith("local-session-")) {
    return null;
  }

  try {
    const sessionResponse = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionResponse.error || !sessionResponse.data) return null;
    const row = sessionResponse.data as Record<string, unknown>;
    const identities = [row.student_id, row.user_id, row.aluno_id]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    if (identities.length && !identities.includes(userId)) return null;

    const logsResponse = await supabase
      .from("workout_set_logs")
      .select("workout_exercise_id,set_number,load_kg,reps,completed_at")
      .eq("session_id", sessionId)
      .order("completed_at", { ascending: true });

    if (logsResponse.error) return null;

    return {
      id: sessionId,
      startedAt: String(row.started_at ?? row.created_at ?? new Date().toISOString()),
      completedSets: (logsResponse.data ?? []).map((log) => ({
        exerciseId: String((log as Record<string, unknown>).workout_exercise_id ?? ""),
        setNumber: Math.max(1, toNumber((log as Record<string, unknown>).set_number, 1)),
        loadKg: Math.max(0, toNumber((log as Record<string, unknown>).load_kg, 0)),
        reps: Math.max(0, toNumber((log as Record<string, unknown>).reps, 0)),
      })).filter((entry) => Boolean(entry.exerciseId)),
    };
  } catch {
    return null;
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

  // A RPC v8.7 cria a sessão com privilégios controlados e evita que uma
  // política RLS ou coluna legada faça o aplicativo cair silenciosamente no
  // modo local. Mantemos o insert direto como compatibilidade.
  const rpc = await supabase.rpc("start_workout_session_v9_2", {
    p_plan_id: planId,
  });

  const rpcId = Array.isArray(rpc.data)
    ? rpc.data[0]
    : rpc.data;

  if (!rpc.error && rpcId) {
    return {
      id: String(
        typeof rpcId === "object" && rpcId !== null && "id" in rpcId
          ? (rpcId as Record<string, unknown>).id
          : rpcId,
      ),
      local: false,
    };
  }

  const payload = {
    student_id: userId,
    user_id: userId,
    plan_id: planId,
    started_at: new Date().toISOString(),
    completion_percentage: 0,
    duration_seconds: 0,
    valid_for_ranking: false,
  };

  const response = await supabase
    .from("workout_sessions")
    .insert(payload)
    .select("id")
    .single();

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
  userId: string;
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

  const response = await supabase.from("workout_set_logs").upsert(
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

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("accqua:daily-summary-invalidated", {
      detail: { userId: input.userId, source: "strength" },
    }));
  }
}

export async function finishWorkoutSession(input: {
  userId: string;
  planId: string | null;
  sessionId: string;
  localSession: boolean;
  simpleWorkout: boolean;
  completionPercentage: number;
  durationSeconds: number;
  completedSets: number;
  totalSets: number;
}): Promise<{
  saved: boolean;
  validForRanking: boolean;
  recordId?: string;
  error?: string;
}> {
  if (input.simpleWorkout || !isSupabaseConfigured || !input.planId) {
    return {
      saved: false,
      validForRanking: false,
      error: "O treino não possui uma ficha válida para registro.",
    };
  }

  const percentage = Math.min(100, Math.max(0, input.completionPercentage));
  const durationSeconds = Math.max(1, input.durationSeconds);
  const completedSets = Math.max(0, input.completedSets);
  const totalSets = Math.max(0, input.totalSets);
  const clientEventId = input.sessionId || `workout-${input.userId}-${Date.now()}`;

  try {
    // Build 1.3.5: não existe mais "sucesso" por tabela legada.
    // O treino só termina como salvo quando accqua_workout_records confirma a gravação.
    const canonical: any = await withRequestTimeout(
      supabase.rpc("accqua_finish_workout_v9_6", {
        p_client_event_id: clientEventId,
        p_plan_id: input.planId,
        p_completion_percentage: percentage,
        p_duration_seconds: durationSeconds,
        p_completed_sets: completedSets,
        p_total_sets: totalSets,
      }),
      15000,
    );

    if (!canonical.error && canonical.data) {
      const raw = Array.isArray(canonical.data) ? canonical.data[0] : canonical.data;
      const result = (raw ?? {}) as Record<string, unknown>;
      const recordId = String(result.record_id ?? "");
      if (result.saved === true && recordId) {
        return {
          saved: true,
          validForRanking: Boolean(result.valid_for_ranking),
          recordId,
        };
      }
    }

    const message = String(canonical.error?.message ?? "");
    console.error("[ACCQUA] Registro canônico obrigatório não confirmado", {
      canonical: canonical.error,
      planId: input.planId,
      clientEventId,
    });

    return {
      saved: false,
      validForRanking: false,
      error: message || "O treino não foi gravado na fonte canônica. A conclusão não será confirmada até o banco responder.",
    };
  } catch (error) {
    console.error("[ACCQUA] Erro inesperado ao finalizar treino", error);
    return {
      saved: false,
      validForRanking: false,
      error: error instanceof Error
        ? error.message
        : "Não foi possível registrar o treino.",
    };
  }
}
