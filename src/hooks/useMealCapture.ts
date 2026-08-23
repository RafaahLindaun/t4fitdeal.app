import { useCallback, useState } from "react";
import { toast } from "sonner";
import { saveMeal, type MealItem, type MealMacros } from "../lib/diet";
import { analyzeMealImage, MealImageError, uploadMealImage, type MealAnalysis, type MealCaptureMode } from "../lib/mealVision";
import { readNutritionLabelLocally } from "../lib/labelOcr";

export type MealDraft = MealAnalysis & { imagePath: string; previewUrl: string };

export function useMealCapture(userId: string, onSaved: () => Promise<void> | void) {
  const [mode, setMode] = useState<MealCaptureMode>("prato");
  const [stage, setStage] = useState<"capture" | "analyzing" | "review">("capture");
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    setStage("capture");
  }, [draft?.previewUrl]);

  const selectFile = useCallback(async (originalFile: File) => {
    if (!originalFile || !userId) return;
    setStage("analyzing");
    let previewUrl = "";
    try {
      const uploaded = await uploadMealImage(userId, originalFile);
      previewUrl = URL.createObjectURL(uploaded.file);
      const localOcr = mode === "rotulo" ? await readNutritionLabelLocally(uploaded.file) : undefined;
      const analysis = await analyzeMealImage(uploaded.path, mode, localOcr);
      setDraft({ ...analysis, imagePath: uploaded.path, previewUrl });
      setStage("review");
      if (!analysis.automaticAvailable) {
        toast.message("Foto recebida", { description: "A IA não respondeu agora. Revise os campos ou tente outra foto." });
      }
    } catch (error) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const message = error instanceof MealImageError ? error.message : "Não foi possível abrir ou enviar essa foto.";
      toast.error(message);
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
        source: !draft.automaticAvailable || draft.confidence < 0.6 ? "manual" : draft.source,
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
