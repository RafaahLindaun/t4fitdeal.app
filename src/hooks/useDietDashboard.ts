import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { addWater, loadDietDashboard, registerRecipe, updateDietTargets, type DietDashboardData, type DietProfile, type Recipe } from "../lib/diet";

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

  const addWaterAmount = useCallback(async (ml: number) => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      await addWater(userId, ml);
      setData((previous) => previous ? { ...previous, waterMl: previous.waterMl + ml } : previous);
      if ("vibrate" in navigator) navigator.vibrate(14);
    } catch {
      toast.error("Não foi possível registrar a água.");
    } finally {
      setBusy(false);
    }
  }, [busy, userId]);

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

  return { data, loading, busy, refresh, addWaterAmount, saveTargets, addRecipe };
}
