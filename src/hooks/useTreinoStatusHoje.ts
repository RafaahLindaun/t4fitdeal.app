import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { loadTreinoStatusHoje, localDateKey } from "../lib/workoutStatus";

export function useTreinoStatusHoje(alunoId: string) {
  const queryClient = useQueryClient();
  const dateKey = localDateKey();
  const query = useQuery({
    queryKey: ["treino-status", alunoId, dateKey],
    queryFn: () => loadTreinoStatusHoje(alunoId),
    enabled: Boolean(alunoId),
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!alunoId || !isSupabaseConfigured) return;
    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["treino-status", alunoId] });
    const channel = supabase.channel(`treino-status-${alunoId}`)
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
