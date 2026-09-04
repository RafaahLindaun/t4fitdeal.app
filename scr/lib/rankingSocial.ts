import { isSupabaseConfigured, supabase } from "./supabase";

export type PublicWorkoutSummary = {
  programName: string;
  split: string;
  focus: string;
  routines: number;
  exercises: number;
  reviewAt: string;
};

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
};

export async function loadPublicWorkoutSummary(studentId: string): Promise<PublicWorkoutSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;
  const { data, error } = await supabase.rpc("get_accqua_public_workout_summary_v1_6_5", {
    p_student_id: studentId,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  return {
    programName: text(row.programName) || "Treino atual",
    split: text(row.split) || "Não informada",
    focus: text(row.focus),
    routines: numberValue(row.routines),
    exercises: numberValue(row.exercises),
    reviewAt: text(row.reviewAt),
  };
}
