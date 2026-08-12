import { isSupabaseConfigured, supabase } from "./supabase";
import { loadResolvedAvatarsByUserIds } from "./profileAvatar";

export type RankingEntry = {
  studentId: string;
  firstName: string;
  avatarUrl: string;
  points: number;
  workoutDays: number;
  cardioOnlyDays: number;
  totalDurationSeconds: number;
  lastActivityDate: string;
};

function mapEntry(row: Record<string, unknown>): RankingEntry {
  return {
    studentId: String(row.student_id ?? row.user_id ?? ""),
    firstName:
      String(row.first_name ?? row.student_name ?? "Aluno").split(/\s+/)[0] ||
      "Aluno",
    avatarUrl: String(row.avatar_url ?? ""),
    points: Math.max(
      0,
      Number(
        row.monthly_workout_count ??
          row.workout_count ??
          row.ranking_points ??
          row.points ??
          0,
      ),
    ),
    workoutDays: Math.max(0, Number(row.workout_days ?? 0)),
    cardioOnlyDays: Math.max(0, Number(row.cardio_only_days ?? 0)),
    totalDurationSeconds: Math.max(
      0,
      Number(row.total_duration_seconds ?? 0),
    ),
    lastActivityDate: String(row.last_activity_date ?? ""),
  };
}

export async function loadAccquaRanking(): Promise<RankingEntry[]> {
  if (!isSupabaseConfigured) return [];

  // Ranking visual definitivo: usa primeiro a agregação mensal de treinos.
  // As RPCs antigas permanecem apenas como fallback de compatibilidade.
  const monthlyRpc = await supabase.rpc("get_accqua_monthly_ranking_v9_6");
  const newestRpc = monthlyRpc.error
    ? await supabase.rpc("get_accqua_ranking_v9_6")
    : monthlyRpc;
  const rpc = newestRpc.error
    ? await supabase.rpc("get_accqua_ranking_v9_4")
    : newestRpc;

  let entries: RankingEntry[] = [];

  if (!rpc.error && Array.isArray(rpc.data)) {
    entries = rpc.data.map((row) => mapEntry(row as Record<string, unknown>));
  } else {
    const previousRpc = await supabase.rpc("get_accqua_ranking_v8_9");

    if (!previousRpc.error && Array.isArray(previousRpc.data)) {
      entries = previousRpc.data.map((row) =>
        mapEntry(row as Record<string, unknown>),
      );
    } else {
      const fallback = await supabase
        .from("accqua_ranking_v9_2")
        .select("*")
        .order("ranking_points", { ascending: false })
        .limit(100);

      if (fallback.error) {
        const legacy = await supabase
          .from("accqua_ranking_v8_5")
          .select("*")
          .order("ranking_points", { ascending: false })
          .limit(100);
        if (legacy.error) return [];
        entries = (legacy.data ?? []).map((row) =>
          mapEntry(row as Record<string, unknown>),
        );
      } else {
        entries = (fallback.data ?? []).map((row) =>
          mapEntry(row as Record<string, unknown>),
        );
      }
    }
  }

  const avatarMap = await loadResolvedAvatarsByUserIds(
    entries.map((entry) => entry.studentId),
  );

  return entries
    .map((entry) => ({
      ...entry,
      avatarUrl: avatarMap.get(entry.studentId) || entry.avatarUrl,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.lastActivityDate.localeCompare(b.lastActivityDate) ||
        a.firstName.localeCompare(b.firstName, "pt-BR"),
    );
}

export type RankingProfileSummary = {
  studentId: string;
  memberSince: string;
  ageYears: number | null;
  totalWorkouts: number;
  currentSplit: string;
};

export async function loadRankingProfileSummary(
  studentId: string,
): Promise<RankingProfileSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;

  const response = await supabase.rpc(
    "get_accqua_ranking_profile_summary_v9_6",
    { p_student_id: studentId },
  );

  if (response.error || !response.data) return null;

  const raw = (Array.isArray(response.data)
    ? response.data[0]
    : response.data) as Record<string, unknown> | undefined;

  if (!raw) return null;

  const rawAge = Number(raw.age_years);

  return {
    studentId: String(raw.student_id ?? studentId),
    memberSince: String(raw.member_since ?? ""),
    ageYears: Number.isFinite(rawAge) && rawAge >= 0 ? rawAge : null,
    totalWorkouts: Math.max(0, Number(raw.total_workouts ?? 0)),
    currentSplit: String(raw.current_split ?? "Não informado"),
  };
}
