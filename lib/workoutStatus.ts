import { isSupabaseConfigured, supabase } from "./supabase";

type Row = Record<string, unknown>;

export type TreinoStatus = {
  completedToday: boolean;
  completedTodayCount: number;
  totalCompleted: number;
  completedDates: string[];
  latestCompletedAt: string;
  latestSessionId: string;
};

function text(value: unknown) { return String(value ?? "").trim(); }
function num(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; }
export function localDateKey(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

async function sessionRows(alunoId: string) {
  if (!isSupabaseConfigured || !alunoId) return [] as Row[];
  const merged = new Map<string, Row>();
  for (const column of ["student_id", "user_id", "aluno_id"]) {
    const response = await (supabase.from("workout_sessions") as any)
      .select("*")
      .eq(column, alunoId)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (response.error) continue;
    for (const row of (response.data ?? []) as Row[]) merged.set(text(row.id) || JSON.stringify(row), row);
  }
  return [...merged.values()];
}

function isCompleted(row: Row) {
  const completedAt = text(row.completed_at ?? row.concluido_em ?? row.finished_at);
  const status = text(row.status).toLowerCase();
  return Boolean(completedAt) || ["completed","complete","concluido","concluído","finalizado","finished","done"].includes(status) || num(row.completion_percentage) >= 100;
}

export async function loadTreinoStatusHoje(alunoId: string, date = new Date()): Promise<TreinoStatus> {
  const today = localDateKey(date);
  const rows = (await sessionRows(alunoId)).filter(isCompleted);
  const completed = rows.map((row) => {
    const at = text(row.completed_at ?? row.concluido_em ?? row.finished_at ?? row.updated_at ?? row.started_at);
    return { row, at, key: localDateKey(at) };
  }).filter((entry) => entry.key);
  const todayRows = completed.filter((entry) => entry.key === today);
  const latest = completed.sort((a,b) => b.at.localeCompare(a.at))[0];
  return {
    completedToday: todayRows.length > 0,
    completedTodayCount: todayRows.length,
    totalCompleted: completed.length,
    completedDates: [...new Set(completed.map((entry) => entry.key))],
    latestCompletedAt: latest?.at ?? "",
    latestSessionId: latest ? text(latest.row.id) : "",
  };
}

export async function recordWorkoutSessionCompletion(input: { alunoId: string; sessionId: string; completionPercentage: number; durationSeconds: number }) {
  if (!isSupabaseConfigured || !input.sessionId || input.sessionId.startsWith("local-session-")) return;
  const completedAt = new Date().toISOString();
  const rpc = await supabase.rpc("mark_workout_session_completed_v1_3_1", {
    p_session_id: input.sessionId,
    p_completion_percentage: Math.max(0, Math.min(100, Math.round(input.completionPercentage))),
    p_duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
  });
  if (!rpc.error) return;
  await (supabase.from("workout_sessions") as any)
    .update({ completed_at: completedAt, completion_percentage: input.completionPercentage, duration_seconds: input.durationSeconds })
    .eq("id", input.sessionId);
}
