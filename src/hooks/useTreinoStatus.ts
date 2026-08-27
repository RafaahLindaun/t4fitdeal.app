import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  loadTreinoStatus,
  localDateKey,
  monthKey,
  type TreinoPeriodo,
  type TreinoStatusPeriodo,
} from "../lib/workoutStatus";

export function useTreinoStatus(
  alunoId: string,
  options: { periodo: TreinoPeriodo; reference?: Date | string },
) {
  const queryClient = useQueryClient();
  const reference = options.reference ?? new Date();
  const periodKey = useMemo(() => {
    if (options.periodo === "mes") return monthKey(reference);
    if (options.periodo === "semana") return `week:${localDateKey(reference)}`;
    return localDateKey(reference);
  }, [options.periodo, reference instanceof Date ? reference.getTime() : String(reference)]);

  const query = useQuery<TreinoStatusPeriodo>({
    queryKey: ["treino-status", alunoId, options.periodo, periodKey],
    queryFn: () => loadTreinoStatus(alunoId, { periodo: options.periodo, reference }),
    enabled: Boolean(alunoId),
    staleTime: 8_000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!alunoId || !isSupabaseConfigured) return;
    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["treino-status", alunoId] });
    const channel = supabase
      .channel(`treino-status-canonical-${alunoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "accqua_workout_records", filter: `student_id=eq.${alunoId}` }, invalidate)
      .subscribe();
    window.addEventListener("accqua:treino-status-invalidated", invalidate);
    return () => {
      window.removeEventListener("accqua:treino-status-invalidated", invalidate);
      void supabase.removeChannel(channel);
    };
  }, [alunoId, queryClient]);

  return query;
}
