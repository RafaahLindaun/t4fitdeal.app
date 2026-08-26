import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { loadTreinoStatusMensal, monthKey } from "../lib/workoutStatus";

export function useTreinoStatusMensal(alunoId: string, reference: Date | string = new Date()) {
  const queryClient = useQueryClient();
  const mesAno = monthKey(reference);
  const query = useQuery({
    queryKey: ["treino-status-mensal", alunoId, mesAno],
    queryFn: () => loadTreinoStatusMensal(alunoId, reference),
    enabled: Boolean(alunoId && mesAno),
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!alunoId || !isSupabaseConfigured) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["treino-status-mensal", alunoId] });
      void queryClient.invalidateQueries({ queryKey: ["treino-status", alunoId] });
    };
    const channel = supabase
      .channel(`treino-status-mensal-${alunoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, invalidate)
      .subscribe();
    window.addEventListener("accqua:treino-status-invalidated", invalidate);
    return () => {
      window.removeEventListener("accqua:treino-status-invalidated", invalidate);
      void supabase.removeChannel(channel);
    };
  }, [alunoId, queryClient]);

  return query;
}
