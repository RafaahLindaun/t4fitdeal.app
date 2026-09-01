import { useQuery } from "@tanstack/react-query";
import { loadCardioStats, type CardioStatsPeriod } from "../lib/cardioStats";

export function useCardioStats(
  studentId: string,
  period: CardioStatsPeriod,
  referenceDate = new Date(),
) {
  const dateKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`;
  return useQuery({
    queryKey: ["cardio-stats", studentId, period, dateKey],
    queryFn: () => loadCardioStats(studentId, period, referenceDate),
    enabled: Boolean(studentId),
    staleTime: 15_000,
  });
}
