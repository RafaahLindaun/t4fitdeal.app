import { supabase } from "./supabase";
import type { MealItem, MealMacros } from "./diet";

export type MealCaptureMode = "prato" | "rotulo";
export type MealAnalysis = {
  items: MealItem[];
  macros: MealMacros;
  caloriesTotal: number;
  confidence: number;
  source: "ocr_rotulo" | "ia_visao" | "manual";
  providerMessage?: string;
};

function extension(file: File) {
  const raw = file.name.split(".").pop()?.toLowerCase();
  if (raw && /^[a-z0-9]{2,5}$/.test(raw)) return raw;
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

export async function uploadMealImage(userId: string, file: File) {
  const path = `${userId}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension(file)}`;
  const { error } = await supabase.storage.from("meal-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

function fallbackAnalysis(mode: MealCaptureMode): MealAnalysis {
  return {
    items: [{ nome: mode === "rotulo" ? "Produto do rótulo" : "Refeição", quantidade_estimada_g: 0, calorias: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0 }],
    macros: { proteina_g: 0, carbo_g: 0, gordura_g: 0 },
    caloriesTotal: 0,
    confidence: 0,
    source: "manual",
    providerMessage: "Análise automática indisponível. Revise os dados manualmente.",
  };
}

export async function analyzeMealImage(storagePath: string, mode: MealCaptureMode): Promise<MealAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { storagePath, mode },
  });
  if (error || !data || typeof data !== "object") return fallbackAnalysis(mode);
  const raw = data as Record<string, unknown>;
  const items = Array.isArray(raw.itens) ? raw.itens as MealItem[] : [];
  const macrosRaw = (raw.macros ?? {}) as Record<string, unknown>;
  const num = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  return {
    items: items.length ? items : fallbackAnalysis(mode).items,
    macros: {
      proteina_g: num(macrosRaw.proteina_g),
      carbo_g: num(macrosRaw.carbo_g),
      gordura_g: num(macrosRaw.gordura_g),
    },
    caloriesTotal: num(raw.calorias_total),
    confidence: Math.max(0, Math.min(1, num(raw.confianca))),
    source: mode === "rotulo" ? "ocr_rotulo" : "ia_visao",
    providerMessage: String(raw.mensagem ?? ""),
  };
}
