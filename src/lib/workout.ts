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

function commonStemVariants(stem: string) {
  const decoded = safelyDecodeMediaPath(stem).trim();
  if (!decoded) return [];

  const words = decoded.split(/[-_\s]+/g).filter(Boolean);
  const titleCase = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");

  return unique([
    decoded,
    decoded.toLowerCase(),
    decoded.toUpperCase(),
    titleCase,
    decoded.replace(/\s+/g, "-"),
    decoded.replace(/_/g, "-"),
    decoded.replace(/-/g, "_"),
    slugify(decoded),
  ]);
}

function fileCaseCandidates(value: string) {
  if (!value) return [];

  if (/^(https?:|data:|blob:)/i.test(value)) {
    const match = value.match(/^(.*)\.([gG][iI][fF])([?#].*)?$/);
    if (!match) return [value];
    const base = match[1];
    const suffix = match[3] ?? "";
    return unique([value, `${base}.gif${suffix}`, `${base}.GIF${suffix}`]);
  }

  const match = value.match(/^(.*\/)?([^/?#]+?)(?:\.([^.?#]+))?([?#].*)?$/);
  if (!match) return [value];

  const directory = match[1] ?? "";
  const fileStem = match[2] ?? "";
  const extension = match[3] ?? "";
  const suffix = match[4] ?? "";
  const extensions = /^gif$/i.test(extension)
    ? [extension, "gif", "GIF"]
    : extension
      ? [extension]
      : [""];

  return unique(
    commonStemVariants(fileStem).flatMap((stem) =>
      extensions.map((ext) =>
        ext ? `${directory}${stem}.${ext}${suffix}` : `${directory}${stem}${suffix}`,
      ),
    ),
  );
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
        `/gifs/${slug}-com-halteres.GIF`,
        `/gifs/${slug}-unilateral.gif`,
        `/gifs/${slug}-unilateral.GIF`,
      ]
    : [];

  return unique([
    ...fileCaseCandidates(explicit),
    ...aliasMatches.flatMap(fileCaseCandidates),
    ...generated.flatMap(fileCaseCandidates),
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

async function confirmWorkoutHistory(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  if (!sessionId || sessionId.startsWith("local-session-")) return false;

  const rpc = await supabase.rpc("get_accqua_student_activity_history_v9_4", {
    p_student_id: userId,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    return rpc.data.some((row) =>
      String((row as Record<string, unknown>).source_session_id ?? "") === sessionId
      && String((row as Record<string, unknown>).activity_kind ?? "") === "workout",
    );
  }

  const direct = await supabase
    .from("accqua_activity_history")
    .select("id")
    .eq("student_id", userId)
    .eq("activity_kind", "workout")
    .eq("source_session_id", sessionId)
    .maybeSingle();

  return !direct.error && Boolean(direct.data?.id);
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
    // V9.6: o primeiro e obrigatório registro é feito em uma tabela canônica
    // independente das estruturas antigas. A RPC só retorna saved=true depois
    // de confirmar accqua_workout_records.
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
      const raw = Array.isArray(canonical.data)
        ? canonical.data[0]
        : canonical.data;
      const result = (raw ?? {}) as Record<string, unknown>;
      const recordId = String(result.record_id ?? "");
      const saved = result.saved === true && Boolean(recordId);

      if (saved) {
        return {
          saved: true,
          validForRanking: Boolean(result.valid_for_ranking),
          recordId,
        };
      }
    }

    // Compatibilidade temporária: caso o SQL v9.6 ainda não tenha sido
    // publicado no projeto, tenta a RPC anterior sem declarar sucesso falso.
    const compatibility: any = await withRequestTimeout(
      supabase.rpc("complete_workout_session_v9_4", {
        p_session_id: input.localSession ? null : input.sessionId,
        p_plan_id: input.planId,
        p_completion_percentage: percentage,
        p_duration_seconds: durationSeconds,
        p_completed_sets: completedSets,
        p_total_sets: totalSets,
      }),
      12000,
    );

    if (!compatibility.error && compatibility.data) {
      const raw = Array.isArray(compatibility.data)
        ? compatibility.data[0]
        : compatibility.data;
      const result = (raw ?? {}) as Record<string, unknown>;
      const saved = result.saved === true && Boolean(result.history_id);
      if (saved) {
        return {
          saved: true,
          validForRanking: Boolean(result.valid_for_ranking),
          recordId: String(result.history_id ?? ""),
        };
      }
    }

    const message = String(
      canonical.error?.message ?? compatibility.error?.message ?? "",
    );

    console.error("[ACCQUA] Falha ao registrar treino", {
      canonical: canonical.error,
      compatibility: compatibility.error,
      planId: input.planId,
      clientEventId,
    });

    return {
      saved: false,
      validForRanking: false,
      error: message || "O banco não confirmou o registro obrigatório do treino.",
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
