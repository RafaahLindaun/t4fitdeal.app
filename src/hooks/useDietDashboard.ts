import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import {
  addWater,
  deleteWaterLog,
  loadDietDashboard,
  registerRecipe,
  resetTodayWater,
  updateDietTargets,
  type DietDashboardData,
  type DietProfile,
  type Recipe,
} from "../lib/diet";

export function useDietDashboard(userId: string) {
  const [data, setData] = useState<DietDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const loadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    if (!loadedOnce.current) setLoading(true);
    try {
      setData(await loadDietDashboard(userId));
      loadedOnce.current = true;
    } catch {
      toast.error("Não foi possível carregar sua dieta agora.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void refresh(), 220);
    };

    const onInvalidation = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) scheduleRefresh();
    };
    window.addEventListener("accqua:daily-summary-invalidated", onInvalidation);

    const channel = supabase
      .channel(`diet-daily-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cardio_sessions", filter: `student_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "cardio_sessions", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "serie_execucoes", filter: `aluno_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions", filter: `student_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "water_logs", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("accqua:daily-summary-invalidated", onInvalidation);
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const undoWaterAmount = useCallback(async (logId: string, ml: number) => {
    if (!userId) return;
    try {
      await deleteWaterLog(userId, logId);
      setData((previous) => previous ? { ...previous, waterMl: Math.max(0, previous.waterMl - ml) } : previous);
      toast.success("Registro de água desfeito.");
      if ("vibrate" in navigator) navigator.vibrate(12);
    } catch {
      toast.error("Não foi possível desfazer esse registro.");
      await refresh();
    }
  }, [refresh, userId]);

  const addWaterAmount = useCallback(async (ml: number) => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      const created = await addWater(userId, ml);
      setData((previous) => previous ? { ...previous, waterMl: previous.waterMl + created.ml } : previous);
      if ("vibrate" in navigator) navigator.vibrate(14);
      toast.success(`${Math.round(created.ml)} ml de água registrados.`, {
        duration: 5200,
        action: {
          label: "Desfazer",
          onClick: () => { void undoWaterAmount(created.id, created.ml); },
        },
      });
    } catch {
      toast.error("Não foi possível registrar a água.");
    } finally {
      setBusy(false);
    }
  }, [busy, undoWaterAmount, userId]);

  const resetWater = useCallback(async () => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      await resetTodayWater(userId);
      setData((previous) => previous ? { ...previous, waterMl: 0 } : previous);
      toast.success("Água de hoje zerada.");
      if ("vibrate" in navigator) navigator.vibrate([18, 20, 18]);
    } catch {
      toast.error("Não foi possível zerar a água de hoje.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, userId]);

  const saveTargets = useCallback(async (input: Partial<DietProfile>) => {
    setBusy(true);
    try {
      await updateDietTargets(userId, input);
      toast.success("Metas atualizadas.");
      await refresh();
    } catch {
      toast.error("Não foi possível atualizar as metas.");
      throw new Error("diet targets update failed");
    } finally {
      setBusy(false);
    }
  }, [refresh, userId]);

  const addRecipe = useCallback(async (recipe: Recipe) => {
    setBusy(true);
    try {
      await registerRecipe(userId, recipe);
      toast.success("Receita registrada na alimentação de hoje.");
      await refresh();
    } catch {
      toast.error("Não foi possível registrar esta receita.");
    } finally {
      setBusy(false);
    }
  }, [refresh, userId]);

  return { data, loading, busy, refresh, addWaterAmount, resetWater, saveTargets, addRecipe };
}
