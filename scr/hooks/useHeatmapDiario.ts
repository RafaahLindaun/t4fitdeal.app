import { useMemo } from "react";
import type { DietHistoryDay } from "../lib/diet";

export type HeatmapMetric = "agua" | "kcal";
export type HeatmapTone = "empty" | "future" | "good" | "medium" | "far" | "water";

export type HeatmapPoint = {
  dateKey: string;
  label: string;
  ratio: number;
  percent: number;
  tone: HeatmapTone;
  future: boolean;
};

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export function useHeatmapDiario(days: DietHistoryDay[], metrica: HeatmapMetric, limit = 14) {
  return useMemo<HeatmapPoint[]>(() => {
    const today = todayKey();
    return days.slice(-limit).map((day) => {
      const future = day.dateKey > today;
      const value = metrica === "agua" ? Number(day.waterMl ?? 0) : Number(day.consumedCalories ?? 0);
      const target = metrica === "agua" ? Number(day.waterTargetMl ?? 0) : Number(day.calorieTarget ?? 0);
      const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
      const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
      const ratio = !future && safeTarget > 0 ? safeValue / safeTarget : 0;
      const percent = Math.max(0, Math.min(100, ratio * 100));
      let tone: HeatmapTone = future ? "future" : safeTarget <= 0 || safeValue <= 0 ? "empty" : "water";
      if (metrica === "kcal" && !future && safeTarget > 0 && safeValue > 0) {
        tone = ratio >= 0.9 && ratio <= 1.1 ? "good" : ratio >= 0.75 && ratio <= 1.25 ? "medium" : "far";
      }
      return { dateKey: day.dateKey, label: day.label, ratio, percent, tone, future };
    });
  }, [days, metrica, limit]);
}
