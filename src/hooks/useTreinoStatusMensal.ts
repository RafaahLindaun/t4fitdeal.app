import { useTreinoStatus } from "./useTreinoStatus";
import { monthKey } from "../lib/workoutStatus";

/** @deprecated Use useTreinoStatus(alunoId, { periodo: 'mes' }). */
export function useTreinoStatusMensal(alunoId: string, reference: Date | string = new Date()) {
  const query = useTreinoStatus(alunoId, { periodo: "mes", reference });
  return {
    ...query,
    data: query.data ? {
      monthKey: monthKey(reference),
      completedCount: query.data.completedDates.length,
      completedDates: query.data.completedDates,
    } : undefined,
  };
}
