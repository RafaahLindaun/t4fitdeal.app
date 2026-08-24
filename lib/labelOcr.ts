export type LabelOcrResult = {
  text: string;
  confidence: number;
  available: boolean;
};

let workerPromise: Promise<any> | null = null;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
}

async function getPortugueseWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("por", 1, {
        logger: () => undefined,
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: "1",
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/**
 * OCR local para rótulos nutricionais.
 * Roda no navegador via Web Worker e não envia a imagem para um serviço de OCR.
 * O texto extraído pode ser enviado à Edge Function apenas para estruturação.
 */
export async function readNutritionLabelLocally(file: File): Promise<LabelOcrResult> {
  try {
    const worker = await getPortugueseWorker();
    const result = await worker.recognize(file);
    const rawText = String(result?.data?.text ?? "");
    const text = rawText
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 12000);
    const confidence = clamp(Number(result?.data?.confidence ?? 0) / 100);
    return {
      text,
      confidence,
      available: text.length >= 12,
    };
  } catch {
    // OCR local é uma otimização. A análise por imagem continua disponível no Gemini.
    return { text: "", confidence: 0, available: false };
  }
}
