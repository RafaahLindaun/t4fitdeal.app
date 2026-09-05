import { isSupabaseConfigured, supabase } from "./supabase";
import type { RankingProfileSummary } from "./ranking";

export type PublicWorkoutSummary = {
  programName: string;
  split: string;
  focus: string;
  routines: number;
  exercises: number;
  reviewAt: string;
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
};

export async function loadRankingProfileSummary165(studentId: string): Promise<RankingProfileSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;
  const v98 = await supabase.rpc("get_accqua_ranking_profile_summary_v9_8", { p_student_id: studentId });
  const v97 = v98.error
    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_7", { p_student_id: studentId })
    : v98;
  const response = v97.error
    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_6", { p_student_id: studentId })
    : v97;
  if (response.error || !response.data) return null;
  const raw = (Array.isArray(response.data) ? response.data[0] : response.data) as Row | undefined;
  if (!raw) return null;
  const rawAge = Number(raw.age_years);
  return {
    studentId: text(raw.student_id) || studentId,
    memberSince: text(raw.member_since),
    ageYears: Number.isFinite(rawAge) && rawAge >= 0 ? rawAge : null,
    totalWorkouts: numberValue(raw.total_workouts),
    currentSplit: text(raw.current_split) || "—",
    objective: text(raw.objective),
  };
}

export async function loadPublicWorkoutSummary(studentId: string): Promise<PublicWorkoutSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;
  const { data, error } = await supabase.rpc("get_accqua_public_workout_summary_v1_6_5", {
    p_student_id: studentId,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  const row = data as Row;
  return {
    programName: text(row.programName) || "Treino atual",
    split: text(row.split) || "—",
    focus: text(row.focus),
    routines: numberValue(row.routines),
    exercises: numberValue(row.exercises),
    reviewAt: text(row.reviewAt),
  };
}
