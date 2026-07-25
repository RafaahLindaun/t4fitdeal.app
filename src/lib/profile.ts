import type { AppProfile } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "./supabase";
import { resolveProfileAvatar } from "./profileAvatar";

export type ProfilePreferences = {
  workoutNotifications: boolean;
  classNotifications: boolean;
  activityReminders: boolean;
  newsNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export type ProfileActivityKind = "workout" | "cardio" | "class";

export type ProfileActivity = {
  id: string;
  kind: ProfileActivityKind;
  title: string;
  performedAt: string;
  durationSeconds: number;
  calories: number;
  completionPercentage: number;
  validForRanking: boolean;
  status: string;
  instructorName: string;
};

export type ProfileDetails = {
  id: string;
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
  registrationCode: string;
  avatarUrl: string;
  memberSince: string;
  showInRanking: boolean;
  role: string;
  status: string;
};

export type ActiveWorkoutSummary = {
  programName: string;
  splitType: string;
  routines: number;
  reviewAt: string;
};

export type ProfileDashboard = {
  details: ProfileDetails;
  preferences: ProfilePreferences;
  activities: ProfileActivity[];
  classes: ProfileActivity[];
  activeWorkout: ActiveWorkoutSummary | null;
  rankingPoints: number;
  totalWorkoutSessions: number;
  totalCardioMinutes: number;
  totalClasses: number;
  totalCalories: number;
};

export type PersonalProfileInput = {
  fullName: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
  showInRanking: boolean;
};

const defaultPreferences: ProfilePreferences = {
  workoutNotifications: true,
  classNotifications: true,
  activityReminders: true,
  newsNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").toLowerCase();
  if (["true", "1", "yes", "sim"].includes(normalized)) return true;
  if (["false", "0", "no", "nao", "não"].includes(normalized)) return false;
  return fallback;
}

function normalizeProfileDetails(
  raw: Record<string, unknown> | null,
  fallback: AppProfile | null,
  userCreatedAt: string,
): ProfileDetails {
  return {
    id: text(raw?.id ?? fallback?.id),
    email: text(raw?.email ?? fallback?.email),
    fullName: text(
      raw?.full_name ?? raw?.nome ?? raw?.name ?? fallback?.fullName,
    ),
    cpf: text(raw?.cpf ?? fallback?.cpf),
    phone: text(raw?.phone ?? raw?.telefone ?? fallback?.phone),
    emergencyPhone: text(
      raw?.emergency_phone ??
        raw?.telefone_emergencia ??
        fallback?.emergencyPhone,
    ),
    birthDate: text(
      raw?.birth_date ?? raw?.data_nascimento ?? fallback?.birthDate,
    ),
    objective: text(
      raw?.objective ?? raw?.objetivo ?? raw?.goal ?? fallback?.objective,
    ),
    registrationCode: text(
      raw?.registration_code ??
        raw?.codigo_matricula ??
        raw?.matricula,
    ),
    avatarUrl: text(raw?.avatar_url),
    memberSince: text(raw?.member_since ?? raw?.created_at ?? userCreatedAt),
    showInRanking: booleanValue(raw?.show_in_ranking, true),
    role: text(raw?.role ?? fallback?.role),
    status: text(raw?.status ?? fallback?.status),
  };
}

function normalizePreferences(
  raw: Record<string, unknown> | null,
): ProfilePreferences {
  return {
    workoutNotifications: booleanValue(
      raw?.workout_notifications,
      defaultPreferences.workoutNotifications,
    ),
    classNotifications: booleanValue(
      raw?.class_notifications,
      defaultPreferences.classNotifications,
    ),
    activityReminders: booleanValue(
      raw?.activity_reminders,
      defaultPreferences.activityReminders,
    ),
    newsNotifications: booleanValue(
      raw?.news_notifications,
      defaultPreferences.newsNotifications,
    ),
    soundEnabled: booleanValue(
      raw?.sound_enabled,
      defaultPreferences.soundEnabled,
    ),
    vibrationEnabled: booleanValue(
      raw?.vibration_enabled,
      defaultPreferences.vibrationEnabled,
    ),
  };
}

function normalizeActivity(raw: Record<string, unknown>): ProfileActivity {
  const kind = text(raw.activity_kind || raw.kind) as ProfileActivityKind;
  return {
    id: text(raw.id),
    kind: kind === "cardio" || kind === "class" ? kind : "workout",
    title: text(raw.title) || (kind === "cardio" ? "Cardio" : "Treino"),
    performedAt: text(raw.performed_at ?? raw.attended_at ?? raw.scheduled_at),
    durationSeconds: Math.max(0, numberValue(raw.duration_seconds)),
    calories: Math.max(0, numberValue(raw.calories)),
    completionPercentage: Math.max(
      0,
      Math.min(100, numberValue(raw.completion_percentage)),
    ),
    validForRanking: booleanValue(raw.valid_for_ranking),
    status: text(raw.status),
    instructorName: text(raw.instructor_name),
  };
}

function relationUnavailable(message: string) {
  return /does not exist|relation|schema cache|not found|could not find/i.test(
    message,
  );
}

async function loadProfileRow(userId: string) {
  const rpc = await supabase.rpc("get_my_accqua_profile_v8_6");
  if (!rpc.error && rpc.data) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    return row && typeof row === "object"
      ? (row as Record<string, unknown>)
      : null;
  }

  const direct = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (direct.error) return null;
  return (direct.data ?? null) as Record<string, unknown> | null;
}

async function loadPreferencesRow(userId: string) {
  const response = await supabase
    .from("accqua_profile_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (response.error) return null;
  return (response.data ?? null) as Record<string, unknown> | null;
}

async function loadActivityRows(userId: string) {
  const rpc = await supabase.rpc("get_accqua_student_activity_history_v9_2", {
    p_student_id: userId,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    return (rpc.data as Record<string, unknown>[]).map(normalizeActivity);
  }

  // Compatibilidade com instalações anteriores.
  const direct = await supabase
    .from("accqua_activity_history")
    .select("*")
    .eq("student_id", userId)
    .order("performed_at", { ascending: false })
    .limit(120);

  if (!direct.error) {
    return ((direct.data ?? []) as Record<string, unknown>[]).map(
      normalizeActivity,
    );
  }

  const fallback = await supabase
    .from("accqua_student_activity_history_v8_5")
    .select("*")
    .eq("student_id", userId)
    .order("performed_at", { ascending: false })
    .limit(120);

  if (fallback.error) return [];
  return ((fallback.data ?? []) as Record<string, unknown>[]).map(
    normalizeActivity,
  );
}

async function loadClassRows(userId: string) {
  const response = await supabase
    .from("accqua_class_attendance")
    .select("*")
    .eq("student_id", userId)
    .order("scheduled_at", { ascending: false })
    .limit(80);

  if (response.error) return [];

  return ((response.data ?? []) as Record<string, unknown>[]).map((raw) =>
    normalizeActivity({
      ...raw,
      activity_kind: "class",
      title: raw.class_name,
      performed_at: raw.attended_at ?? raw.scheduled_at,
    }),
  );
}

async function loadRankingPoints(userId: string) {
  const response = await supabase
    .from("accqua_ranking_v9_2")
    .select("ranking_points")
    .eq("student_id", userId)
    .maybeSingle();

  if (!response.error) {
    return Math.max(0, numberValue(response.data?.ranking_points));
  }

  const previous = await supabase
    .from("accqua_ranking_v8_5")
    .select("ranking_points")
    .eq("student_id", userId)
    .maybeSingle();

  if (!previous.error) {
    return Math.max(0, numberValue(previous.data?.ranking_points));
  }

  const history = await supabase
    .from("accqua_activity_history")
    .select("performed_at")
    .eq("student_id", userId)
    .eq("valid_for_ranking", true);

  if (history.error) return 0;

  const validDays = new Set(
    (history.data ?? []).map((row) => {
      const date = new Date(String(row.performed_at ?? ""));
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }).filter(Boolean),
  );

  return validDays.size;
}

async function loadActiveWorkout(userId: string): Promise<ActiveWorkoutSummary | null> {
  const programResponse = await supabase
    .from("workout_programs")
    .select("*")
    .eq("student_id", userId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!programResponse.error && programResponse.data) {
    const program = programResponse.data as Record<string, unknown>;
    const planResponse = await supabase
      .from("workout_plans")
      .select("id")
      .eq("student_id", userId)
      .eq("program_id", text(program.id))
      .eq("is_active", true);

    return {
      programName: text(program.name ?? program.title) || "Treino atual",
      splitType: text(program.split_type ?? program.division_type).toUpperCase(),
      routines: Math.max(0, planResponse.data?.length ?? 0),
      reviewAt: text(program.review_at),
    };
  }

  const plans = await supabase
    .from("workout_plans")
    .select("*")
    .eq("student_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (plans.error || !plans.data?.length) return null;

  const first = plans.data[0] as Record<string, unknown>;
  return {
    programName: text(first.program_name ?? first.name) || "Treino atual",
    splitType: text(first.split_type ?? first.division_type).toUpperCase(),
    routines: plans.data.length,
    reviewAt: text(first.review_at),
  };
}

export async function loadProfileDashboard(
  userId: string,
  fallbackProfile: AppProfile | null,
  userCreatedAt = "",
): Promise<ProfileDashboard> {
  const fallbackDetails = normalizeProfileDetails(
    null,
    fallbackProfile,
    userCreatedAt,
  );

  if (!isSupabaseConfigured || !userId) {
    return {
      details: fallbackDetails,
      preferences: defaultPreferences,
      activities: [],
      classes: [],
      activeWorkout: null,
      rankingPoints: 0,
      totalWorkoutSessions: 0,
      totalCardioMinutes: 0,
      totalClasses: 0,
      totalCalories: 0,
    };
  }

  const [profileRow, preferenceRow, activities, classes, rankingPoints, activeWorkout] =
    await Promise.all([
      loadProfileRow(userId),
      loadPreferencesRow(userId),
      loadActivityRows(userId),
      loadClassRows(userId),
      loadRankingPoints(userId),
      loadActiveWorkout(userId),
    ]);

  const attendedClasses = classes.filter((item) =>
    ["attended", "presente", "completed", "concluida", "concluída"].includes(
      item.status.toLowerCase(),
    ),
  );
  const totalWorkoutSessions = activities.filter(
    (item) => item.kind === "workout",
  ).length;
  const totalCardioMinutes = Math.floor(
    activities
      .filter((item) => item.kind === "cardio")
      .reduce((sum, item) => sum + item.durationSeconds, 0) / 60,
  );
  const totalCalories = activities.reduce(
    (sum, item) => sum + item.calories,
    0,
  );

  const details = normalizeProfileDetails(profileRow, fallbackProfile, userCreatedAt);
  details.avatarUrl = await resolveProfileAvatar(details.avatarUrl);

  return {
    details,
    preferences: normalizePreferences(preferenceRow),
    activities: [...activities, ...attendedClasses].sort((a, b) =>
      b.performedAt.localeCompare(a.performedAt),
    ),
    classes,
    activeWorkout,
    rankingPoints,
    totalWorkoutSessions,
    totalCardioMinutes,
    totalClasses: attendedClasses.length,
    totalCalories,
  };
}

export async function savePersonalProfile(
  input: PersonalProfileInput,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: "O Supabase não está configurado." };
  }

  const payload = {
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.replace(/\D/g, ""),
    p_emergency_phone: input.emergencyPhone.replace(/\D/g, ""),
    p_birth_date: input.birthDate || null,
    p_objective: input.objective.trim(),
    p_show_in_ranking: input.showInRanking,
  };

  const rpc = await supabase.rpc("update_my_accqua_profile_v8_6", payload);
  if (!rpc.error) return {};

  if (!relationUnavailable(rpc.error.message)) {
    return { error: rpc.error.message };
  }

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (!userId) return { error: "Sessão não encontrada." };

  const direct = await supabase
    .from("profiles")
    .update({
      full_name: payload.p_full_name,
      phone: payload.p_phone,
      emergency_phone: payload.p_emergency_phone,
      birth_date: payload.p_birth_date,
      objective: payload.p_objective,
      show_in_ranking: payload.p_show_in_ranking,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return direct.error ? { error: direct.error.message } : {};
}

export async function saveProfilePreferences(
  userId: string,
  preferences: ProfilePreferences,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: "O Supabase não está configurado." };
  }

  const response = await supabase.from("accqua_profile_preferences").upsert(
    {
      user_id: userId,
      workout_notifications: preferences.workoutNotifications,
      class_notifications: preferences.classNotifications,
      activity_reminders: preferences.activityReminders,
      news_notifications: preferences.newsNotifications,
      sound_enabled: preferences.soundEnabled,
      vibration_enabled: preferences.vibrationEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return response.error ? { error: response.error.message } : {};
}

export async function changeMyPassword(
  password: string,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: "O Supabase não está configurado." };
  }

  const response = await supabase.auth.updateUser({ password });
  return response.error ? { error: response.error.message } : {};
}

async function resizeAvatar(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("invalid-image"));
      img.src = objectUrl;
    });
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("encode")), "image/webp", .88),
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) return { error: "Escolha uma imagem JPG, PNG ou WEBP." };
  if (file.size > 12 * 1024 * 1024) return { error: "A imagem deve ter no máximo 12 MB." };
  try {
    const blob = await resizeAvatar(file);
    const path = `${userId}/avatar.webp`;
    const upload = await supabase.storage.from("profile-avatars").upload(path, blob, {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "3600",
    });
    if (upload.error) return { error: upload.error.message };
    const rpc = await supabase.rpc("update_my_accqua_avatar_v8_8", { p_avatar_url: path });
    if (rpc.error) {
      const update = await supabase.from("profiles").update({ avatar_url: path, updated_at: new Date().toISOString() }).eq("id", userId);
      if (update.error) return { error: update.error.message };
    }
    const url = await resolveProfileAvatar(path);
    return { url };
  } catch {
    return { error: "Não foi possível preparar essa imagem. Tente outra foto." };
  }
}
