import { useTreinoStatus } from "./useTreinoStatus";

/** @deprecated Use useTreinoStatus(alunoId, { periodo: 'hoje' }). */
export function useTreinoStatusHoje(alunoId: string) {
  const query = useTreinoStatus(alunoId, { periodo: "hoje" });
  return {
    ...query,
    data: query.data ? {
      completedToday: query.data.completed,
      completedTodayCount: query.data.completedCount,
      totalCompleted: query.data.totalCompleted,
      completedDates: query.data.completedDates,
      latestCompletedAt: query.data.latestCompletedAt,
      latestSessionId: query.data.latestRecordId,
    } : undefined,
  };
}
