import { supabase } from "./supabase";
import type { MealItem, MealMacros } from "./diet";

export type MealCaptureMode = "prato" | "rotulo";

export type LocalLabelOcr = {
  text: string;
  confidence: number;
  available: boolean;
};

export type MealAnalysis = {
  items: MealItem[];
  macros: MealMacros;
  caloriesTotal: number;
  confidence: number;
  source: "ocr_rotulo" | "ia_visao" | "manual";
  providerMessage?: string;
  automaticAvailable: boolean;
};

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const REENCODE_THRESHOLD_BYTES = 4 * 1024 * 1024;
const DIRECT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class MealImageError extends Error {
  code: "invalid_file" | "too_large" | "unsupported_format" | "upload_failed";

  constructor(code: "invalid_file" | "too_large" | "unsupported_format" | "upload_failed", message: string) {
    super(message);
    this.code = code;
    this.name = "MealImageError";
  }
}

function extension(file: File) {
  const raw = file.name.split(".").pop()?.toLowerCase();
  if (raw && /^[a-z0-9]{2,5}$/.test(raw)) return raw;
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

async function imageToJpeg(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("canvas unavailable");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) throw new Error("jpeg conversion failed");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "refeicao"}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Normaliza fotos antes do upload.
 * - JPEG/PNG/WEBP pequenos seguem intactos.
 * - imagens grandes ou formatos como HEIC tentam virar JPEG 2048px.
 */
export async function normalizeMealImage(file: File) {
  if (!file || file.size <= 0) throw new MealImageError("invalid_file", "Essa foto não pôde ser lida.");
  if (file.size > MAX_UPLOAD_BYTES * 2) throw new MealImageError("too_large", "A foto está muito grande. Tente fotografar novamente.");

  const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!looksLikeImage) throw new MealImageError("invalid_file", "Escolha uma foto do prato ou do rótulo.");

  if (DIRECT_IMAGE_TYPES.has(file.type) && file.size <= REENCODE_THRESHOLD_BYTES) return file;

  try {
    const converted = await imageToJpeg(file);
    if (converted.size > MAX_UPLOAD_BYTES) throw new MealImageError("too_large", "A foto ficou grande demais para enviar.");
    return converted;
  } catch (error) {
    if (error instanceof MealImageError) throw error;
    if (DIRECT_IMAGE_TYPES.has(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;
    throw new MealImageError("unsupported_format", "Esse formato de foto não abriu corretamente. Tire a foto pela câmera do app ou escolha JPG/PNG.");
  }
}

export async function uploadMealImage(userId: string, originalFile: File) {
  const file = await normalizeMealImage(originalFile);
  const path = `${userId}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension(file)}`;
  const { error } = await supabase.storage.from("meal-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new MealImageError("upload_failed", "Não foi possível enviar a foto agora.");
  return { path, file };
}

function fallbackAnalysis(mode: MealCaptureMode, providerMessage = "Análise automática indisponível. Revise os dados manualmente."): MealAnalysis {
  return {
    items: [{ nome: mode === "rotulo" ? "Produto do rótulo" : "Refeição", quantidade_estimada_g: 0, calorias: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0 }],
    macros: { proteina_g: 0, carbo_g: 0, gordura_g: 0 },
    caloriesTotal: 0,
    confidence: 0,
    source: "manual",
    providerMessage,
    automaticAvailable: false,
  };
}

export async function analyzeMealImage(storagePath: string, mode: MealCaptureMode, localOcr?: LocalLabelOcr): Promise<MealAnalysis> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-meal", {
      body: {
        storagePath,
        mode,
        ocrText: mode === "rotulo" && localOcr?.available ? localOcr.text : undefined,
        ocrConfidence: mode === "rotulo" && localOcr?.available ? localOcr.confidence : undefined,
      },
    });
    if (error || !data || typeof data !== "object") {
      return fallbackAnalysis(mode, "A IA não respondeu agora. A foto foi recebida e pode ser preenchida manualmente.");
    }

    const raw = data as Record<string, unknown>;
    const items = Array.isArray(raw.itens) ? raw.itens as MealItem[] : [];
    const macrosRaw = (raw.macros ?? {}) as Record<string, unknown>;
    const num = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    const confidence = Math.max(0, Math.min(1, num(raw.confianca)));
    const hasAutomaticResult = items.length > 0 && confidence > 0;

    if (!hasAutomaticResult) {
      return fallbackAnalysis(mode, String(raw.mensagem ?? "A IA não conseguiu interpretar essa foto. Revise manualmente ou tente outra."));
    }

    return {
      items,
      macros: {
        proteina_g: num(macrosRaw.proteina_g),
        carbo_g: num(macrosRaw.carbo_g),
        gordura_g: num(macrosRaw.gordura_g),
      },
      caloriesTotal: num(raw.calorias_total),
      confidence,
      source: mode === "rotulo" ? "ocr_rotulo" : "ia_visao",
      providerMessage: String(raw.mensagem ?? ""),
      automaticAvailable: true,
    };
  } catch {
    return fallbackAnalysis(mode, "A IA não respondeu agora. Você pode revisar manualmente e salvar mesmo assim.");
  }
}
