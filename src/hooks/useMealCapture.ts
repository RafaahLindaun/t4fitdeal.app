import { useCallback, useState } from "react";
import { toast } from "sonner";
import { saveMeal, type MealItem, type MealMacros } from "../lib/diet";
import { analyzeMealImage, uploadMealImage, type MealAnalysis, type MealCaptureMode } from "../lib/mealVision";

export type MealDraft = MealAnalysis & { imagePath: string; previewUrl: string };

export function useMealCapture(userId: string, onSaved: () => Promise<void> | void) {
  const [mode, setMode] = useState<MealCaptureMode>("prato");
  const [stage, setStage] = useState<"capture" | "analyzing" | "review">("capture");
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null); setStage("capture");
  }, [draft?.previewUrl]);

  const selectFile = useCallback(async (file: File) => {
    if (!file || !userId) return;
    const previewUrl = URL.createObjectURL(file);
    setStage("analyzing");
    try {
      const imagePath = await uploadMealImage(userId, file);
      const analysis = await analyzeMealImage(imagePath, mode);
      setDraft({ ...analysis, imagePath, previewUrl });
      setStage("review");
    } catch {
      URL.revokeObjectURL(previewUrl);
      toast.error("Não foi possível analisar esta foto.");
      setStage("capture");
    }
  }, [mode, userId]);

  const updateItems = useCallback((items: MealItem[]) => {
    setDraft((previous) => previous ? { ...previous, items } : previous);
  }, []);

  const updateTotals = useCallback((caloriesTotal: number, macros: MealMacros) => {
    setDraft((previous) => previous ? { ...previous, caloriesTotal, macros } : previous);
  }, []);

  const confirm = useCallback(async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      await saveMeal(userId, {
        imagePath: draft.imagePath,
        items: draft.items,
        caloriesTotal: draft.caloriesTotal,
        macros: draft.macros,
        source: draft.confidence < 0.6 ? "manual" : draft.source,
        confidence: draft.confidence,
      });
      toast.success("Refeição registrada.");
      await onSaved();
      reset();
      return true;
    } catch {
      toast.error("Não foi possível salvar a refeição.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, onSaved, reset, saving, userId]);

  return { mode, setMode, stage, draft, saving, reset, selectFile, updateItems, updateTotals, confirm };
}
