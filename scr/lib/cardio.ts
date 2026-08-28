import { isSupabaseConfigured, supabase } from "./supabase";

export type CardioActivity =
  | "treadmill"
  | "spinning"
  | "elliptical"
  | "stairs"
  | "rowing"
  | "walk"
  | "swim";

export type CardioTiming = "before" | "after" | "anytime";
export type CardioSessionStatus =
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type CardioPrescription = {
  id: string;
  studentId: string;
  professorId: string | null;
  title: string;
  activityType: CardioActivity;
  timing: CardioTiming;
  targetDurationMinutes: number;
  targetDistance: number;
  distanceUnit: "km" | "m";
  targetPaceSeconds: number;
  paceUnit: "km" | "100m" | "500m";
  targetSpeedKmh: number;
  targetCalories: number;
  targetLaps: number;
  notes: string;
  isActive: boolean;
};

export type CardioSessionRecord = {
  id: string;
  studentId: string;
  prescriptionId: string | null;
  activityType: CardioActivity;
  timing: CardioTiming;
  status: CardioSessionStatus;
  targetDurationSeconds: number;
  elapsedSeconds: number;
  distanceMeters: number;
  averagePaceSeconds: number;
  averageSpeedKmh: number;
  cadenceRpm: number;
  laps: number;
  calories: number;
  startedAt: string;
  completedAt: string;
  source: "professor" | "free";
  validForRanking: boolean;
  idempotencyKey: string;
  local: boolean;
};

export type CardioDashboard = {
  prescriptions: CardioPrescription[];
  openSession: CardioSessionRecord | null;
  recentSessions: CardioSessionRecord[];
  storageReady: boolean;
  message: string;
};

export type CardioSnapshot = {
  elapsedSeconds: number;
  distanceMeters: number;
  averagePaceSeconds: number;
  averageSpeedKmh: number;
  cadenceRpm: number;
  laps: number;
  calories: number;
  status: CardioSessionStatus;
};

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function activityValue(value: unknown): CardioActivity {
  const normalized = String(value ?? "").toLowerCase();

  if (
    normalized === "swim" ||
    normalized === "nado" ||
    normalized === "swimming"
  ) {
    return "swim";
  }

  if (
    normalized === "spinning" ||
    normalized === "bike" ||
    normalized === "cycling"
  ) {
    return "spinning";
  }

  if (
    normalized === "elliptical" ||
    normalized === "eliptico" ||
    normalized === "elíptico"
  ) {
    return "elliptical";
  }

  if (
    normalized === "stairs" ||
    normalized === "stair" ||
    normalized === "escada"
  ) {
    return "stairs";
  }

  if (
    normalized === "rowing" ||
    normalized === "row" ||
    normalized === "remo"
  ) {
    return "rowing";
  }

  if (
    normalized === "walk" ||
    normalized === "walking" ||
    normalized === "caminhada"
  ) {
    return "walk";
  }

  return "treadmill";
}

function timingValue(value: unknown): CardioTiming {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "before" || normalized === "antes") return "before";
  if (normalized === "after" || normalized === "depois") return "after";
  return "anytime";
}

function statusValue(value: unknown): CardioSessionStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "running") return "running";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  return "paused";
}

function normalizePrescription(
  raw: Record<string, unknown>,
): CardioPrescription {
  const distanceUnit =
    String(raw.distance_unit ?? "km").toLowerCase() === "m" ? "m" : "km";
  const rawPaceUnit = String(raw.pace_unit ?? "km").toLowerCase();
  const paceUnit =
    rawPaceUnit === "100m"
      ? "100m"
      : rawPaceUnit === "500m"
        ? "500m"
        : "km";

  return {
    id: String(raw.id ?? ""),
    studentId: String(raw.student_id ?? raw.user_id ?? ""),
    professorId: raw.professor_id ? String(raw.professor_id) : null,
    title: String(raw.title ?? raw.name ?? "Cardio"),
    activityType: activityValue(raw.activity_type ?? raw.mode),
    timing: timingValue(raw.timing ?? raw.session_context),
    targetDurationMinutes: Math.max(
      0,
      numberValue(raw.target_duration_minutes, 20),
    ),
    targetDistance: Math.max(0, numberValue(raw.target_distance, 0)),
    distanceUnit,
    targetPaceSeconds: Math.max(
      0,
      numberValue(raw.target_pace_seconds, 0),
    ),
    paceUnit,
    targetSpeedKmh: Math.max(
      0,
      numberValue(raw.target_speed_kmh, 0),
    ),
    targetCalories: Math.max(
      0,
      numberValue(raw.target_calories, 0),
    ),
    targetLaps: Math.max(0, numberValue(raw.target_laps, 0)),
    notes: String(raw.notes ?? raw.observations ?? ""),
    isActive: raw.is_active !== false,
  };
}

function normalizeSession(
  raw: Record<string, unknown>,
): CardioSessionRecord {
  return {
    id: String(raw.id ?? ""),
    studentId: String(raw.student_id ?? raw.user_id ?? ""),
    prescriptionId: raw.prescription_id
      ? String(raw.prescription_id)
      : null,
    activityType: activityValue(raw.activity_type),
    timing: timingValue(raw.session_context ?? raw.timing),
    status: statusValue(raw.status),
    targetDurationSeconds: Math.max(
      0,
      numberValue(raw.target_duration_seconds, 0),
    ),
    elapsedSeconds: Math.max(0, numberValue(raw.elapsed_seconds, 0)),
    distanceMeters: Math.max(0, numberValue(raw.distance_meters, 0)),
    averagePaceSeconds: Math.max(
      0,
      numberValue(raw.average_pace_seconds, 0),
    ),
    averageSpeedKmh: Math.max(
      0,
      numberValue(raw.average_speed_kmh, 0),
    ),
    cadenceRpm: Math.max(0, numberValue(raw.cadence_rpm, 0)),
    laps: Math.max(0, numberValue(raw.laps, 0)),
    calories: Math.max(0, numberValue(raw.calories, 0)),
    startedAt: String(raw.started_at ?? ""),
    completedAt: String(raw.completed_at ?? ""),
    source:
      String(raw.source ?? "").toLowerCase() === "professor"
        ? "professor"
        : "free",
    validForRanking: Boolean(raw.valid_for_ranking),
    idempotencyKey: String(raw.idempotency_key ?? (raw.id ? `legacy-${String(raw.id)}` : `legacy-${Date.now()}`)),
    local: false,
  };
}

async function loadSessions(userId: string) {
  let response = await supabase
    .from("cardio_sessions")
    .select("*")
    .eq("student_id", userId)
    .order("started_at", { ascending: false })
    .limit(15);

  if (response.error && /student_id/i.test(response.error.message)) {
    response = await supabase
      .from("cardio_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(15);
  }

  return response;
}


type CardioQueryResponse = {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
};

function relationUnavailable(message: string) {
  return /does not exist|relation|schema cache|not found/i.test(message);
}

async function loadPrescriptionRows(
  userId: string,
): Promise<CardioQueryResponse> {
  const programResponse = await supabase
    .from("workout_programs")
    .select("id")
    .eq("student_id", userId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  const activeProgramId = String(programResponse.data?.[0]?.id ?? "");

  if (!programResponse.error && activeProgramId) {
    const currentProgramResponse = await supabase
      .from("workout_cardio_prescriptions")
      .select("*")
      .eq("student_id", userId)
      .eq("program_id", activeProgramId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!currentProgramResponse.error) {
      return {
        data: (currentProgramResponse.data ?? []) as Record<string, unknown>[],
        error: null,
      };
    }

    if (!relationUnavailable(currentProgramResponse.error.message)) {
      return {
        data: null,
        error: { message: currentProgramResponse.error.message },
      };
    }
  }

  const currentTableResponse = await supabase
    .from("workout_cardio_prescriptions")
    .select("*")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!currentTableResponse.error) {
    return {
      data: (currentTableResponse.data ?? []) as Record<string, unknown>[],
      error: null,
    };
  }

  const legacyResponse = await supabase
    .from("cardio_prescriptions")
    .select("*")
    .eq("student_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return {
    data: (legacyResponse.data ?? []) as Record<string, unknown>[],
    error: legacyResponse.error
      ? { message: legacyResponse.error.message }
      : null,
  };
}

export async function loadActiveWorkoutCardioPrescription(
  userId: string,
): Promise<CardioPrescription | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const response = await loadPrescriptionRows(userId);
    const first = response.data?.[0];
    return first ? normalizePrescription(first) : null;
  } catch {
    return null;
  }
}

export async function loadCardioDashboard(
  userId: string,
): Promise<CardioDashboard> {
  if (!isSupabaseConfigured) {
    return {
      prescriptions: [],
      openSession: null,
      recentSessions: [],
      storageReady: false,
      message: "O Supabase não está configurado neste ambiente.",
    };
  }

  try {
    const [prescriptionResponse, sessionResponse] = await Promise.all([
      loadPrescriptionRows(userId),
      loadSessions(userId),
    ]);

    const prescriptions = (prescriptionResponse.data ?? []).map((row) =>
      normalizePrescription(row as Record<string, unknown>),
    );
    const sessions = (sessionResponse.data ?? []).map((row) =>
      normalizeSession(row as Record<string, unknown>),
    );

    const prescriptionError = prescriptionResponse.error?.message ?? "";
    const sessionError = sessionResponse.error?.message ?? "";
    const tableError = prescriptionError || sessionError;

    return {
      prescriptions,
      openSession:
        sessions.find(
          (session) =>
            session.status === "running" || session.status === "paused",
        ) ?? null,
      recentSessions: sessions.filter(
        (session) => session.status === "completed",
      ),
      storageReady: !prescriptionError && !sessionError,
      message: tableError
        ? relationUnavailable(tableError)
          ? "A prescrição foi carregada, mas o histórico de cardio ainda precisa da tabela de sessões no Supabase."
          : tableError
        : "",
    };
  } catch {
    return {
      prescriptions: [],
      openSession: null,
      recentSessions: [],
      storageReady: false,
      message: "Não foi possível consultar o histórico de cardio agora.",
    };
  }
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cardio-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function startCardioSession(input: {
  userId: string;
  prescriptionId: string | null;
  activityType: CardioActivity;
  timing: CardioTiming;
  targetDurationSeconds: number;
  targetSnapshot: Record<string, unknown>;
  source: "professor" | "free";
}): Promise<CardioSessionRecord> {
  const idempotencyKey = createIdempotencyKey();
  const localRecord: CardioSessionRecord = {
    id: `local-cardio-${Date.now()}`,
    studentId: input.userId,
    prescriptionId: input.prescriptionId,
    activityType: input.activityType,
    timing: input.timing,
    status: "running",
    targetDurationSeconds: input.targetDurationSeconds,
    elapsedSeconds: 0,
    distanceMeters: 0,
    averagePaceSeconds: 0,
    averageSpeedKmh: 0,
    cadenceRpm: 0,
    laps: 0,
    calories: 0,
    startedAt: new Date().toISOString(),
    completedAt: "",
    source: input.source,
    validForRanking: false,
    idempotencyKey,
    local: true,
  };

  if (!isSupabaseConfigured) return localRecord;

  const payload = {
    student_id: input.userId,
    user_id: input.userId,
    prescription_id: input.prescriptionId,
    activity_type: input.activityType,
    session_context: input.timing,
    target_duration_seconds: input.targetDurationSeconds,
    target_snapshot: input.targetSnapshot,
    source: input.source,
    status: "running",
    started_at: new Date().toISOString(),
    elapsed_seconds: 0,
    distance_meters: 0,
    average_pace_seconds: 0,
    average_speed_kmh: 0,
    cadence_rpm: 0,
    laps: 0,
    calories: 0,
    idempotency_key: idempotencyKey,
  };

  const rpc = await supabase.rpc("start_cardio_session_v9_2", {
    p_prescription_id: input.prescriptionId,
    p_activity_type: input.activityType,
    p_session_context: input.timing,
    p_target_duration_seconds: input.targetDurationSeconds,
    p_target_snapshot: input.targetSnapshot,
    p_source: input.source,
  });

  const rpcValue = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
  const rpcId =
    typeof rpcValue === "object" && rpcValue !== null && "id" in rpcValue
      ? String((rpcValue as Record<string, unknown>).id ?? "")
      : String(rpcValue ?? "");

  if (!rpc.error && rpcId) {
    void supabase
      .from("cardio_sessions")
      .update({ idempotency_key: idempotencyKey })
      .eq("id", rpcId);
    return {
      ...localRecord,
      id: rpcId,
      local: false,
    };
  }

  const response = await supabase
    .from("cardio_sessions")
    .insert(payload)
    .select("*")
    .single();

  if (response.error || !response.data) {
    return localRecord;
  }

  return normalizeSession(
    response.data as Record<string, unknown>,
  );
}

export async function saveCardioSnapshot(
  session: CardioSessionRecord,
  snapshot: CardioSnapshot,
) {
  if (
    session.local ||
    !isSupabaseConfigured ||
    !session.id
  ) {
    return { saved: false };
  }

  const { error } = await supabase
    .from("cardio_sessions")
    .update({
      status: snapshot.status,
      elapsed_seconds: snapshot.elapsedSeconds,
      distance_meters: snapshot.distanceMeters,
      average_pace_seconds: snapshot.averagePaceSeconds,
      average_speed_kmh: snapshot.averageSpeedKmh,
      cadence_rpm: snapshot.cadenceRpm,
      laps: snapshot.laps,
      calories: snapshot.calories,
      last_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return { saved: !error };
}

export async function syncQueuedCardioCompletion(
  session: CardioSessionRecord,
  snapshot: CardioSnapshot,
): Promise<{ saved: boolean; validForRanking: boolean }> {
  if (!isSupabaseConfigured) {
    return { saved: false, validForRanking: false };
  }

  let remoteSession = session;

  if (session.local || !session.id || session.id.startsWith("local-cardio-")) {
    const existing = await supabase
      .from("cardio_sessions")
      .select("*")
      .eq("idempotency_key", session.idempotencyKey)
      .maybeSingle();

    if (existing.error) {
      return { saved: false, validForRanking: false };
    }

    if (existing.data) {
      remoteSession = normalizeSession(existing.data as Record<string, unknown>);
    } else {
      const created = await supabase
        .from("cardio_sessions")
        .insert({
          student_id: session.studentId,
          user_id: session.studentId,
          prescription_id: session.prescriptionId,
          activity_type: session.activityType,
          session_context: session.timing,
          target_duration_seconds: session.targetDurationSeconds,
          target_snapshot: {},
          source: session.source,
          status: "running",
          started_at: session.startedAt || new Date().toISOString(),
          elapsed_seconds: 0,
          distance_meters: 0,
          average_pace_seconds: 0,
          average_speed_kmh: 0,
          cadence_rpm: 0,
          laps: 0,
          calories: 0,
          idempotency_key: session.idempotencyKey,
        })
        .select("*")
        .single();

      if (created.error || !created.data) {
        const raced = await supabase
          .from("cardio_sessions")
          .select("*")
          .eq("idempotency_key", session.idempotencyKey)
          .maybeSingle();
        if (raced.error || !raced.data) {
          return { saved: false, validForRanking: false };
        }
        remoteSession = normalizeSession(raced.data as Record<string, unknown>);
      } else {
        remoteSession = normalizeSession(created.data as Record<string, unknown>);
      }
    }
  } else {
    const idempotencyUpdate = await supabase
      .from("cardio_sessions")
      .update({ idempotency_key: session.idempotencyKey })
      .eq("id", session.id);
    if (idempotencyUpdate.error) {
      const existing = await supabase
        .from("cardio_sessions")
        .select("*")
        .eq("idempotency_key", session.idempotencyKey)
        .maybeSingle();
      if (!existing.error && existing.data) remoteSession = normalizeSession(existing.data as Record<string, unknown>);
    }
  }

  return finishCardioSession(
    { ...remoteSession, idempotencyKey: session.idempotencyKey, local: false },
    snapshot,
  );
}

export async function finishCardioSession(
  session: CardioSessionRecord,
  snapshot: CardioSnapshot,
): Promise<{ saved: boolean; validForRanking: boolean }> {
  if (
    session.local ||
    !isSupabaseConfigured ||
    !session.id
  ) {
    return { saved: false, validForRanking: false };
  }

  const { data, error } = await supabase.rpc(
    "complete_cardio_session_v9_2",
    {
      p_session_id: session.id,
      p_elapsed_seconds: snapshot.elapsedSeconds,
      p_distance_meters: snapshot.distanceMeters,
      p_average_pace_seconds: snapshot.averagePaceSeconds,
      p_average_speed_kmh: snapshot.averageSpeedKmh,
      p_cadence_rpm: snapshot.cadenceRpm,
      p_laps: snapshot.laps,
      p_calories: snapshot.calories,
    },
  );

  if (!error && data) {
    const row = Array.isArray(data) ? data[0] : data;
    const result = row as Record<string, unknown>;
    return {
      saved: Boolean(result?.saved ?? true),
      validForRanking: Boolean(
        result?.valid_for_ranking ?? result?.validForRanking,
      ),
    };
  }

  const previous = await supabase.rpc(
    "complete_cardio_session",
    {
      p_session_id: session.id,
      p_elapsed_seconds: snapshot.elapsedSeconds,
      p_distance_meters: snapshot.distanceMeters,
      p_average_pace_seconds: snapshot.averagePaceSeconds,
      p_average_speed_kmh: snapshot.averageSpeedKmh,
      p_cadence_rpm: snapshot.cadenceRpm,
      p_laps: snapshot.laps,
      p_calories: snapshot.calories,
    },
  );

  if (!previous.error) {
    return {
      saved: true,
      validForRanking: Boolean(previous.data),
    };
  }

  const completedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("cardio_sessions")
    .update({
      status: "completed",
      elapsed_seconds: snapshot.elapsedSeconds,
      distance_meters: snapshot.distanceMeters,
      average_pace_seconds: snapshot.averagePaceSeconds,
      average_speed_kmh: snapshot.averageSpeedKmh,
      cadence_rpm: snapshot.cadenceRpm,
      laps: snapshot.laps,
      calories: snapshot.calories,
      completed_at: completedAt,
      last_heartbeat_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", session.id)
    .select("valid_for_ranking")
    .single();

  return {
    saved: !updateError,
    validForRanking:
      !updateError && Boolean(updated?.valid_for_ranking),
  };
}
