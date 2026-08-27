import { isSupabaseConfigured, supabase } from "./supabase";

type Row = Record<string, unknown>;
export type TreinoPeriodo = "hoje" | "semana" | "mes";

export type TreinoStatusPeriodo = {
  periodo: TreinoPeriodo;
  completed: boolean;
  completedCount: number;
  completedDates: string[];
  totalCompleted: number;
  latestCompletedAt: string;
  latestRecordId: string;
  rangeStart: string;
  rangeEnd: string;
};

function text(value: unknown) { return String(value ?? "").trim(); }
function num(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; }

export function localDateKey(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export function monthKey(value: Date | string = new Date()) {
  const key = localDateKey(value);
  return key ? key.slice(0, 7) : "";
}

function startOfLocalDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
function endOfLocalDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
function startOfWeek(value: Date) {
  const date = startOfLocalDay(value);
  date.setDate(date.getDate() - date.getDay());
  return date;
}
function endOfWeek(value: Date) {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  return endOfLocalDay(date);
}
function rangeFor(periodo: TreinoPeriodo, reference: Date | string) {
  const date = reference instanceof Date ? new Date(reference) : new Date(reference);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  if (periodo === "semana") return { start: startOfWeek(safe), end: endOfWeek(safe) };
  if (periodo === "mes") {
    return {
      start: new Date(safe.getFullYear(), safe.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(safe.getFullYear(), safe.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return { start: startOfLocalDay(safe), end: endOfLocalDay(safe) };
}

function isFullyCompleted(row: Row) {
  const completedAt = text(row.completed_at);
  const percentage = num(row.completion_percentage);
  const completedSets = num(row.completed_sets);
  const totalSets = num(row.total_sets);
  return Boolean(completedAt) && percentage >= 100 && totalSets > 0 && completedSets >= totalSets;
}

async function canonicalRows(alunoId: string) {
  if (!isSupabaseConfigured || !alunoId) return [] as Row[];
  const response = await supabase
    .from("accqua_workout_records")
    .select("id,student_id,plan_id,completed_at,completion_percentage,completed_sets,total_sets")
    .eq("student_id", alunoId)
    .order("completed_at", { ascending: false })
    .limit(2500);
  if (response.error) throw response.error;
  return ((response.data ?? []) as Row[]).filter(isFullyCompleted);
}

export async function loadTreinoStatus(
  alunoId: string,
  options: { periodo: TreinoPeriodo; reference?: Date | string },
): Promise<TreinoStatusPeriodo> {
  const reference = options.reference ?? new Date();
  const { start, end } = rangeFor(options.periodo, reference);
  const rows = await canonicalRows(alunoId);
  const entries = rows.map((row) => ({ row, at: text(row.completed_at), key: localDateKey(text(row.completed_at)) }))
    .filter((entry) => entry.key && new Date(entry.at).getTime() >= start.getTime() && new Date(entry.at).getTime() <= end.getTime());
  const completedDates = [...new Set(entries.map((entry) => entry.key))].sort();
  const latest = rows[0];
  return {
    periodo: options.periodo,
    completed: entries.length > 0,
    completedCount: entries.length,
    completedDates,
    totalCompleted: rows.length,
    latestCompletedAt: text(latest?.completed_at),
    latestRecordId: text(latest?.id),
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
  };
}

export async function loadTreinoStatusHoje(alunoId: string, date = new Date()) {
  const status = await loadTreinoStatus(alunoId, { periodo: "hoje", reference: date });
  return {
    completedToday: status.completed,
    completedTodayCount: status.completedCount,
    totalCompleted: status.totalCompleted,
    completedDates: status.completedDates,
    latestCompletedAt: status.latestCompletedAt,
    latestSessionId: status.latestRecordId,
  };
}

export async function loadTreinoStatusMensal(alunoId: string, reference: Date | string = new Date()) {
  const status = await loadTreinoStatus(alunoId, { periodo: "mes", reference });
  return { monthKey: monthKey(reference), completedCount: status.completedDates.length, completedDates: status.completedDates };
}

// A conclusão é registrada pela RPC canônica accqua_finish_workout_v9_6.
// Esta função existe só por compatibilidade de chamadas antigas e não cria uma segunda fonte de verdade.
export async function recordWorkoutSessionCompletion() {
  window.dispatchEvent(new CustomEvent("accqua:treino-status-invalidated"));
}
