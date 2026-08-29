import { isSupabaseConfigured, supabase } from "./supabase";

type Row = Record<string, unknown>;
export type TreinoPeriodo = "hoje" | "semana" | "mes";
export type RitmoDiaEstado = "completed" | "missed" | "rest" | "today-pending" | "future";

export type TreinoStatusPeriodo = {
  periodo: TreinoPeriodo;
  completed: boolean;
  completedCount: number;
  completedDates: string[];
  /**
   * Histórico completo vindo da MESMA consulta canônica de accqua_workout_records.
   * É usado para streak/ritmo sem abrir uma segunda query de treinos concluídos.
   */
  allCompletedDates: string[];
  totalCompleted: number;
  latestCompletedAt: string;
  latestRecordId: string;
  rangeStart: string;
  rangeEnd: string;
};

export type RitmoDia = {
  key: string;
  date: Date;
  weekday: string;
  dayNumber: number;
  scheduled: boolean;
  completed: boolean;
  isToday: boolean;
  state: RitmoDiaEstado;
};

export type RitmoSemanal = {
  days: RitmoDia[];
  plannedDays: number;
  completedPlannedDays: number;
  streakDays: number;
  weekStartKey: string;
  weekEndKey: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function localDateKey(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

export function startOfTreinoWeek(value: Date) {
  const date = startOfLocalDay(value);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

export function endOfTreinoWeek(value: Date) {
  const date = startOfTreinoWeek(value);
  date.setDate(date.getDate() + 6);
  return endOfLocalDay(date);
}

function rangeFor(periodo: TreinoPeriodo, reference: Date | string) {
  const date = reference instanceof Date ? new Date(reference) : new Date(reference);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  if (periodo === "semana") return { start: startOfTreinoWeek(safe), end: endOfTreinoWeek(safe) };
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
  const normalized = rows
    .map((row) => ({
      row,
      at: text(row.completed_at),
      key: localDateKey(text(row.completed_at)),
    }))
    .filter((entry) => entry.key && entry.at);
  const entries = normalized.filter((entry) => {
    const time = new Date(entry.at).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });
  const completedDates = [...new Set(entries.map((entry) => entry.key))].sort();
  const allCompletedDates = [...new Set(normalized.map((entry) => entry.key))].sort();
  const latest = rows[0];
  return {
    periodo: options.periodo,
    completed: entries.length > 0,
    completedCount: entries.length,
    completedDates,
    allCompletedDates,
    totalCompleted: rows.length,
    latestCompletedAt: text(latest?.completed_at),
    latestRecordId: text(latest?.id),
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
  };
}

function normalizedPlanDays(planWeekDays: number[]) {
  return [...new Set(planWeekDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Deriva semana + streak sem query adicional. Usa allCompletedDates retornado
 * pelo próprio useTreinoStatus e os weekDays da ficha ativa já carregada.
 */
export function deriveRitmoSemanal(
  status: TreinoStatusPeriodo | undefined,
  planWeekDays: number[],
  reference = new Date(),
): RitmoSemanal {
  const today = startOfLocalDay(reference);
  const todayKey = localDateKey(today);
  const weekStart = startOfTreinoWeek(today);
  const planDays = normalizedPlanDays(planWeekDays);
  const planned = new Set(planDays);
  const completed = new Set(status?.allCompletedDates ?? status?.completedDates ?? []);

  const days = Array.from({ length: 7 }, (_, index): RitmoDia => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = localDateKey(date);
    const scheduled = planned.has(date.getDay());
    const done = completed.has(key);
    const isToday = key === todayKey;
    const isFuture = date.getTime() > today.getTime();

    let state: RitmoDiaEstado;
    if (isFuture) state = "future";
    else if (scheduled && done) state = "completed";
    else if (isToday && scheduled) state = "today-pending";
    else if (!scheduled) state = "rest";
    else state = "missed";

    return {
      key,
      date,
      weekday: dayLabel(date),
      dayNumber: date.getDate(),
      scheduled,
      completed: done,
      isToday,
      state,
    };
  });

  const completedPlannedDays = days.filter((day) => day.state === "completed").length;

  let streakDays = 0;
  if (planned.size > 0) {
    // Limite defensivo. Na prática a sequência quebra no primeiro treino planejado perdido.
    for (let offset = 0; offset < 3660; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = localDateKey(date);
      const scheduled = planned.has(date.getDay());
      const done = completed.has(key);

      // Hoje ainda não terminou: se há treino planejado e ele ainda está pendente,
      // não conta o dia e também não quebra a sequência construída até ontem.
      if (offset === 0 && scheduled && !done) continue;

      if (scheduled && !done) break;
      // Dia livre ou treino concluído mantêm a ofensiva e contam como dia sem falha.
      streakDays += 1;
    }
  }

  return {
    days,
    plannedDays: planned.size,
    completedPlannedDays,
    streakDays,
    weekStartKey: localDateKey(weekStart),
    weekEndKey: localDateKey(endOfTreinoWeek(today)),
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
  return {
    monthKey: monthKey(reference),
    completedCount: status.completedDates.length,
    completedDates: status.completedDates,
  };
}

// A conclusão é registrada exclusivamente pela RPC canônica accqua_finish_workout_v9_6.
// Esta função NÃO grava outra tabela: só invalida consumidores da fonte canônica.
export async function recordWorkoutSessionCompletion(_input?: {
  alunoId?: string;
  sessionId?: string;
  completionPercentage?: number;
  durationSeconds?: number;
}) {
  window.dispatchEvent(new CustomEvent("accqua:treino-status-invalidated"));
}
