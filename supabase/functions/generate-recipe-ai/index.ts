// ACCQUA Sports Build 1.6.5 — gera somente RASCUNHO para revisão humana.
// O LLM nunca calcula macros. Nutrição vem exclusivamente da TACO/NEPA-UNICAMP.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const TACO_URL = "https://www.nepa.unicamp.br/arquivo/uploads/taco-4a-edicao/taco-4a-edicao-2/";
const text = (value: unknown) => String(value ?? "").trim();
const numberFromCell = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const normalized = text(value).replace(",", ".").replace(/\s/g, "");
  if (!normalized || /^(na|nd|\*|-)$/i.test(normalized)) return NaN;
  if (/^tr$/i.test(normalized)) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function normalizeModel(raw?: string) {
  return text(raw)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^https?:\/\/generativelanguage\.googleapis\.com\/v1(?:beta)?\/models\//i, "")
    .replace(/^models\//i, "")
    .replace(/:generateContent.*$/i, "")
    .trim();
}
function extractText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map((part: any) => typeof part?.text === "string" ? part.text : "").join("").trim() : "";
}
function parseJson(value: string) {
  return JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim());
}

async function geminiJson(prompt: string) {
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!key) throw new Error("gemini_key_missing");

  // Build 1.6.5: usa a mesma família/caminho já comprovada pela IA de treinos.
  const models = [
    normalizeModel(Deno.env.get("MEAL_VISION_MODEL")),
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
  ].filter((model, index, array) => Boolean(model) && array.indexOf(model) === index);

  let lastDetail = "";
  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.25,
          },
        }),
      });
      if (!response.ok) {
        lastDetail = `${model}:${response.status}:${(await response.text()).slice(0, 350)}`;
        console.warn("generate-recipe-ai Gemini candidate failed", lastDetail);
        continue;
      }
      const raw = extractText(await response.json());
      if (!raw) {
        lastDetail = `${model}:empty_response`;
        continue;
      }
      const parsed = parseJson(raw);
      console.log("generate-recipe-ai Gemini model", model);
      return parsed;
    } catch (error) {
      lastDetail = `${model}:${error instanceof Error ? error.message : String(error)}`;
      console.warn("generate-recipe-ai Gemini candidate exception", lastDetail);
    }
  }
  throw new Error(`gemini_unavailable:${lastDetail.slice(0, 220)}`);
}

type TacoFood = { name: string; kcal: number; protein: number; carbs: number; fat: number };
let tacoCache: { loadedAt: number; foods: TacoFood[] } | null = null;

function headerIndex(row: unknown[], needles: string[]) {
  return row.findIndex((cell) => {
    const value = normalize(text(cell));
    return needles.some((needle) => value.includes(needle));
  });
}
function looksLikeWorkbook(bytes: Uint8Array, contentType: string) {
  const type = contentType.toLowerCase();
  const zipMagic = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  return zipMagic || type.includes("spreadsheet") || type.includes("excel") || type.includes("octet-stream");
}

async function loadTaco() {
  if (tacoCache && Date.now() - tacoCache.loadedAt < 12 * 60 * 60 * 1000) return tacoCache.foods;
  const response = await fetch(TACO_URL, {
    headers: {
      "User-Agent": "ACCQUA-Sports/1.6.5",
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream;q=0.9,*/*;q=0.2",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`taco_download_${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 1024 || !looksLikeWorkbook(bytes, contentType)) throw new Error("taco_invalid_workbook");

  let workbook: XLSX.WorkBook;
  try { workbook = XLSX.read(bytes, { type: "array" }); }
  catch { throw new Error("taco_parse_failed"); }

  let foods: TacoFood[] = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: "" });
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 45); rowIndex += 1) {
      const row = rows[rowIndex] ?? [];
      const nameCol = headerIndex(row, ["descricao dos alimentos", "descricao do alimento", "alimento"]);
      const kcalCol = headerIndex(row, ["energia kcal", "kcal"]);
      const proteinCol = headerIndex(row, ["proteina"]);
      const fatCol = headerIndex(row, ["lipideos", "lipideo", "gordura"]);
      const carbCol = headerIndex(row, ["carboidrato"]);
      if ([nameCol, kcalCol, proteinCol, fatCol, carbCol].some((index) => index < 0)) continue;

      const parsed: TacoFood[] = [];
      for (let i = rowIndex + 1; i < rows.length; i += 1) {
        const data = rows[i] ?? [];
        const name = text(data[nameCol]);
        if (!name || /^fonte|^nota|^tabela/i.test(name)) continue;
        const kcal = numberFromCell(data[kcalCol]);
        const protein = numberFromCell(data[proteinCol]);
        const fat = numberFromCell(data[fatCol]);
        const carbs = numberFromCell(data[carbCol]);
        if (![kcal, protein, fat, carbs].every(Number.isFinite)) continue;
        parsed.push({ name, kcal, protein, carbs, fat });
      }
      if (parsed.length > 100) { foods = parsed; break; }
    }
    if (foods.length > 100) break;
  }

  if (foods.length < 100) throw new Error("taco_foods_not_found");
  tacoCache = { loadedAt: Date.now(), foods };
  console.log("generate-recipe-ai TACO foods", foods.length);
  return foods;
}

function scoreFood(needle: string, candidate: string) {
  const a = normalize(needle), b = normalize(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.86;
  const aa = new Set(a.split(" ").filter((token) => token.length > 2));
  const bb = new Set(b.split(" ").filter((token) => token.length > 2));
  let hits = 0;
  for (const token of aa) if (bb.has(token)) hits += 1;
  const overlap = hits / Math.max(1, Math.max(aa.size, bb.size));
  const important = ["frango", "arroz", "feijao", "batata", "brocolis", "ovo", "leite", "banana", "aveia", "carne", "peixe", "macarrao", "queijo", "iogurte"]
    .some((token) => a.includes(token) && b.includes(token)) ? 0.08 : 0;
  return Math.min(1, overlap + important);
}
function matchTaco(name: string, foods: TacoFood[]) {
  let best: TacoFood | null = null;
  let bestScore = 0;
  for (const food of foods) {
    const score = scoreFood(name, food.name);
    if (score > bestScore) { best = food; bestScore = score; }
  }
  return best && bestScore >= 0.62 ? { food: best, score: bestScore } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const auth = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return new Response(JSON.stringify({ error: "unauthorized", message: "Faça login novamente para continuar." }), { status: 401, headers: cors });

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: profile } = await admin.from("profiles").select("role,status").eq("id", authData.user.id).maybeSingle();
    const role = text(profile?.role).toLowerCase();
    const status = text(profile?.status).toLowerCase();
    if (!["professor", "admin", "reception"].includes(role) || (status && !["active", "ativo", "approved"].includes(status))) {
      return new Response(JSON.stringify({ error: "forbidden", message: "Seu perfil não tem permissão para gerar receitas." }), { status: 403, headers: cors });
    }

    const body = await req.json();
    const descricao = text(body?.descricao).slice(0, 700);
    if (!descricao) return new Response(JSON.stringify({ error: "descricao_required", message: "Descreva a receita antes de gerar." }), { status: 400, headers: cors });

    const prompt = [
      "Crie um RASCUNHO culinário para revisão de um professor.",
      "NÃO calcule e NÃO retorne kcal, proteína, carboidrato, gordura ou qualquer macro.",
      "Retorne SOMENTE JSON válido com: nome, ingredientes (array de {nome, quantidade_g, observacao}), modo_preparo, porcao_descricao, categoria_objetivo (array somente emagrecimento|hipertrofia|low_carb), categoria_refeicao (cafe_da_manha|almoco|lanche|jantar), periodo_dia (manha|tarde|noite), nivel_saudavel (saudavel|moderado|menos_saudavel).",
      "Cada ingrediente precisa de quantidade_g numérica plausível para UMA porção. Prefira ingredientes simples presentes em tabelas brasileiras de composição de alimentos.",
      `Descrição do professor: ${descricao}`,
    ].join("\n");

    const tacoPromise = loadTaco().catch((error) => {
      console.error("generate-recipe-ai TACO unavailable", error instanceof Error ? error.message : String(error));
      return [] as TacoFood[];
    });
    const draft = await geminiJson(prompt);
    const ingredients = Array.isArray(draft?.ingredientes)
      ? draft.ingredientes.slice(0, 30).map((item: any) => ({ nome: text(item?.nome), quantidade_g: Math.max(0, Number(item?.quantidade_g ?? 0)), observacao: text(item?.observacao) })).filter((item: any) => item.nome && Number.isFinite(item.quantidade_g) && item.quantidade_g > 0)
      : [];
    if (!ingredients.length) throw new Error("ingredients_not_generated");

    const taco = await tacoPromise;
    let kcal = 0, protein = 0, carbs = 0, fat = 0;
    const verification = ingredients.map((item: any) => {
      const matched = taco.length ? matchTaco(item.nome, taco) : null;
      if (!matched) return { ingrediente: item.nome, quantidade_g: item.quantidade_g, encontradoNaTaco: false, referencia: null, confianca: 0 };
      const ratio = item.quantidade_g / 100;
      const food = matched.food;
      kcal += food.kcal * ratio; protein += food.protein * ratio; carbs += food.carbs * ratio; fat += food.fat * ratio;
      return { ingrediente: item.nome, quantidade_g: item.quantidade_g, encontradoNaTaco: true, referencia: food.name, confianca: Number(matched.score.toFixed(2)) };
    });

    const allMatched = taco.length > 0 && verification.length > 0 && verification.every((item: any) => item.encontradoNaTaco);
    return new Response(JSON.stringify({
      name: text(draft?.nome) || descricao,
      ingredients,
      instructions: text(draft?.modo_preparo),
      portionDescription: text(draft?.porcao_descricao) || "1 porção",
      objectiveCategories: Array.isArray(draft?.categoria_objetivo) ? draft.categoria_objetivo : [],
      mealCategory: text(draft?.categoria_refeicao) || "almoco",
      dayPeriod: text(draft?.periodo_dia) || "tarde",
      healthLevel: text(draft?.nivel_saudavel) || "saudavel",
      kcal: Math.round(kcal),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fat: Number(fat.toFixed(1)),
      macrosEstimatedAi: !allMatched,
      macroVerification: verification,
      nutritionSource: taco.length ? "TACO/NEPA-UNICAMP 4a edição" : "TACO temporariamente indisponível — revisão obrigatória",
      imageUrl: "",
      imageConfidence: null,
      imageSource: null,
      imageReason: "Use Validar IA para buscar uma imagem candidata ou envie manualmente.",
    }), { status: 200, headers: cors });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("generate-recipe-ai", detail);
    return new Response(JSON.stringify({ error: "generation_failed", message: "Não foi possível gerar a receita agora. Tente novamente.", detail: detail.slice(0, 180) }), { status: 502, headers: cors });
  }
});
