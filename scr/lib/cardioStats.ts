import { supabase } from "./supabase";

export type CardioStatsPeriod = "day" | "month";

export type CardioStats = {
  studentId: string;
  period: CardioStatsPeriod;
  referenceDate: string;
  calories: number;
  distanceMeters: number;
  durationSeconds: number;
  sessions: number;
};

type Row = Record<string, unknown>;

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export async function loadCardioStats(
  studentId: string,
  period: CardioStatsPeriod,
  referenceDate = new Date(),
): Promise<CardioStats> {
  const date = localDateKey(referenceDate);
  const response = await supabase.rpc("get_accqua_cardio_stats_v1_5_6", {
    p_student_id: studentId,
    p_period: period,
    p_reference_date: date,
  });
  if (response.error) throw response.error;
  const row = (Array.isArray(response.data) ? response.data[0] : response.data) as Row | null;
  return {
    studentId,
    period,
    referenceDate: String(row?.reference_date ?? date),
    calories: numberValue(row?.calories_total),
    distanceMeters: numberValue(row?.distance_total_m),
    durationSeconds: numberValue(row?.duration_total_seconds),
    sessions: Math.round(numberValue(row?.sessions)),
  };
}
