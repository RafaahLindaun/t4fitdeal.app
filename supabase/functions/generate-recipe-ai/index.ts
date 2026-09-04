// ACCQUA Sports Build 1.6.5.1 — rascunho de receita com TACO prioritária e fallback estimado identificado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const TACO_URL = "https://www.nepa.unicamp.br/arquivo/uploads/taco-4a-edicao/taco-4a-edicao-2/";
const text = (value: unknown) => String(value ?? "").trim();
const finite = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const positive = (value: unknown) => Math.max(0, finite(value));

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function normalizeModel(raw?: string) {
  return text(raw).replace(/^["'`]+|["'`]+$/g, "").replace(/^https?:\/\/generativelanguage\.googleapis\.com\/v1(?:beta)?\/models\//i, "").replace(/^models\//i, "").replace(/:generateContent.*$/i, "").trim();
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
  const models = [normalizeModel(Deno.env.get("MEAL_VISION_MODEL")), "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"]
    .filter((model, index, array) => Boolean(model) && array.indexOf(model) === index);
  let lastDetail = "";
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.25 },
        }),
      });
      if (!response.ok) {
        lastDetail = `${model}:${response.status}:${(await response.text()).slice(0, 260)}`;
        console.warn("generate-recipe-ai candidate failed", lastDetail);
        continue;
      }
      const raw = extractText(await response.json());
      if (!raw) { lastDetail = `${model}:empty`; continue; }
      return parseJson(raw);
    } catch (error) {
      lastDetail = `${model}:${error instanceof Error ? error.message : String(error)}`;
      console.warn("generate-recipe-ai candidate exception", lastDetail);
    }
  }
  throw new Error(`gemini_unavailable:${lastDetail.slice(0, 180)}`);
}

type TacoFood = { name: string; kcal: number; protein: number; carbs: number; fat: number };
type MacroSet = { kcal: number; protein: number; carbs: number; fat: number };
let tacoCache: { loadedAt: number; foods: TacoFood[] } | null = null;

function numberFromCell(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const normalized = text(value).replace(",", ".").replace(/\s/g, "");
  if (!normalized || /^(na|nd|\*|-)$/i.test(normalized)) return NaN;
  if (/^tr$/i.test(normalized)) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}
function headerIndex(row: unknown[], needles: string[]) {
  return row.findIndex((cell) => needles.some((needle) => normalize(text(cell)).includes(needle)));
}
function looksLikeWorkbook(bytes: Uint8Array, contentType: string) {
  const type = contentType.toLowerCase();
  return (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) || type.includes("spreadsheet") || type.includes("excel") || type.includes("octet-stream");
}
async function loadTaco() {
  if (tacoCache && Date.now() - tacoCache.loadedAt < 12 * 60 * 60 * 1000) return tacoCache.foods;
  const response = await fetch(TACO_URL, {
    headers: { "User-Agent": "ACCQUA-Sports/1.6.5.1", Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream;q=0.9,*/*;q=0.2" },
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
  return foods;
}

function scoreFood(needle: string, candidate: string) {
  const a = normalize(needle), b = normalize(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return .87;
  const aa = new Set(a.split(" ").filter((token) => token.length > 2));
  const bb = new Set(b.split(" ").filter((token) => token.length > 2));
  let hits = 0;
  for (const token of aa) if (bb.has(token)) hits += 1;
  const overlap = hits / Math.max(1, Math.max(aa.size, bb.size));
  const anchors = ["frango", "arroz", "feijao", "batata", "brocolis", "ovo", "leite", "banana", "aveia", "carne", "peixe", "macarrao", "queijo", "iogurte", "pao", "manteiga", "requeijao"];
  return Math.min(1, overlap + (anchors.some((token) => a.includes(token) && b.includes(token)) ? .1 : 0));
}
function matchTaco(name: string, foods: TacoFood[]) {
  let best: TacoFood | null = null, bestScore = 0;
  for (const food of foods) {
    const score = scoreFood(name, food.name);
    if (score > bestScore) { best = food; bestScore = score; }
  }
  return best && bestScore >= .58 ? { food: best, score: bestScore } : null;
}
function macroFromDraft(raw: any): MacroSet {
  const source = raw?.macro_estimada ?? raw?.macros_estimados ?? raw?.macros ?? {};
  const protein = positive(source.proteina_g ?? source.protein ?? source.proteina);
  const carbs = positive(source.carboidrato_g ?? source.carbs ?? source.carboidratos);
  const fat = positive(source.gordura_g ?? source.fat ?? source.gordura);
  const kcalRaw = positive(source.kcal_total ?? source.kcal ?? source.calorias);
  return { kcal: kcalRaw || Math.round(protein * 4 + carbs * 4 + fat * 9), protein, carbs, fat };
}
function macroLooksUsable(value: MacroSet) {
  return value.kcal > 0 && value.protein >= 0 && value.carbs >= 0 && value.fat >= 0 && (value.protein + value.carbs + value.fat) > 0;
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
      "Crie um RASCUNHO culinário completo para revisão humana de um professor.",
      "Retorne SOMENTE JSON válido.",
      "Campos obrigatórios: nome, ingredientes (array de {nome, quantidade_g, observacao}), modo_preparo, porcao_descricao, categoria_objetivo (array somente emagrecimento|hipertrofia|low_carb), categoria_refeicao (cafe_da_manha|almoco|lanche|jantar), periodo_dia (manha|tarde|noite), nivel_saudavel (saudavel|moderado|menos_saudavel), macro_estimada ({kcal_total, proteina_g, carboidrato_g, gordura_g}).",
      "A macro_estimada é somente fallback de revisão. Faça uma estimativa nutricional plausível para UMA porção com todos os quatro campos numéricos preenchidos.",
      "Cada ingrediente precisa de quantidade_g numérica plausível para UMA porção e nome simples para facilitar cruzamento com a TACO brasileira.",
      `Descrição do professor: ${descricao}`,
    ].join("\n");

    const tacoPromise = loadTaco().catch((error) => {
      console.warn("generate-recipe-ai TACO unavailable", error instanceof Error ? error.message : String(error));
      return [] as TacoFood[];
    });
    const draft = await geminiJson(prompt);
    const ingredients = Array.isArray(draft?.ingredientes)
      ? draft.ingredientes.slice(0, 30).map((item: any) => ({ nome: text(item?.nome), quantidade_g: Math.max(0, finite(item?.quantidade_g)), observacao: text(item?.observacao) })).filter((item: any) => item.nome && item.quantidade_g > 0)
      : [];
    if (!ingredients.length) throw new Error("ingredients_not_generated");

    let aiMacros = macroFromDraft(draft);
    if (!macroLooksUsable(aiMacros)) {
      const repaired = await geminiJson([
        "Estime os macros totais de UMA porção da receita abaixo para revisão humana.",
        "Retorne somente JSON: {kcal_total:number, proteina_g:number, carboidrato_g:number, gordura_g:number}.",
        `Receita: ${text(draft?.nome) || descricao}`,
        `Ingredientes: ${ingredients.map((item: any) => `${item.nome} ${item.quantidade_g}g`).join(", ")}`,
      ].join("\n"));
      aiMacros = macroFromDraft({ macro_estimada: repaired });
    }
    if (!macroLooksUsable(aiMacros)) throw new Error("macro_estimate_missing");

    const taco = await tacoPromise;
    let tacoKcal = 0, tacoProtein = 0, tacoCarbs = 0, tacoFat = 0;
    const verification = ingredients.map((item: any) => {
      const matched = taco.length ? matchTaco(item.nome, taco) : null;
      if (!matched) return { ingrediente: item.nome, quantidade_g: item.quantidade_g, encontradoNaTaco: false, referencia: null, confianca: 0 };
      const ratio = item.quantidade_g / 100;
      tacoKcal += matched.food.kcal * ratio;
      tacoProtein += matched.food.protein * ratio;
      tacoCarbs += matched.food.carbs * ratio;
      tacoFat += matched.food.fat * ratio;
      return { ingrediente: item.nome, quantidade_g: item.quantidade_g, encontradoNaTaco: true, referencia: matched.food.name, confianca: Number(matched.score.toFixed(2)) };
    });
    const allMatched = taco.length > 0 && verification.length > 0 && verification.every((item: any) => item.encontradoNaTaco);
    const tacoMacros: MacroSet = { kcal: Math.round(tacoKcal), protein: Number(tacoProtein.toFixed(1)), carbs: Number(tacoCarbs.toFixed(1)), fat: Number(tacoFat.toFixed(1)) };
    const finalMacros = allMatched && macroLooksUsable(tacoMacros) ? tacoMacros : aiMacros;
    const estimated = !(allMatched && macroLooksUsable(tacoMacros));

    return new Response(JSON.stringify({
      name: text(draft?.nome) || descricao,
      ingredients,
      instructions: text(draft?.modo_preparo),
      portionDescription: text(draft?.porcao_descricao) || "1 porção",
      objectiveCategories: Array.isArray(draft?.categoria_objetivo) ? draft.categoria_objetivo : [],
      mealCategory: text(draft?.categoria_refeicao) || "almoco",
      dayPeriod: text(draft?.periodo_dia) || "tarde",
      healthLevel: text(draft?.nivel_saudavel) || "saudavel",
      kcal: Math.round(finalMacros.kcal),
      protein: Number(finalMacros.protein.toFixed(1)),
      carbs: Number(finalMacros.carbs.toFixed(1)),
      fat: Number(finalMacros.fat.toFixed(1)),
      macrosEstimatedAi: estimated,
      macroVerification: verification,
      nutritionSource: estimated ? "Estimativa nutricional da IA — revisão humana obrigatória; TACO não confirmou 100% dos ingredientes" : "TACO/NEPA-UNICAMP 4a edição",
      imageUrl: "",
      imageConfidence: null,
      imageSource: null,
      imageReason: "Envie ou valide uma imagem separadamente.",
    }), { status: 200, headers: cors });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("generate-recipe-ai", detail);
    return new Response(JSON.stringify({ error: "generation_failed", message: "Não foi possível completar a receita agora. Tente novamente.", detail: detail.slice(0, 180) }), { status: 502, headers: cors });
  }
});
