import { supabase } from "./supabase";
import type { StorageImageValue } from "../components/StorageImageUploadGrid";

export type StoreProductImage = StorageImageValue & { id?: string };

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  pixPrice: number;
  discountPercent: number;
  rating: number;
  ratingCount: number;
  stock: number;
  imageUrl: string;
  images: StoreProductImage[];
  active: boolean;
  purchaseEnabled: boolean;
};

export type StoreReservation = {
  id: string;
  productId: string;
  studentId: string;
  status: "reservado" | "retirado" | "cancelado";
  reservedAt: string;
  withdrawnAt: string;
  product: StoreProduct | null;
  studentName?: string;
};

export type RecipeImageSource = "upload_manual" | "ia_unsplash" | "ia_catalogo" | "";

export type RecipeAdminRecord = {
  id: string;
  name: string;
  imageUrl: string;
  imageValidated: boolean;
  imageConfidence: number | null;
  imageSource: RecipeImageSource;
  macrosEstimatedAi: boolean;
  aiScore: number | null;
  aiReason: string;
  objectiveCategories: string[];
  mealCategory: string;
  dayPeriod: "manha" | "tarde" | "noite" | "";
  calorieLevel: "mais_calorica" | "menos_calorica" | "";
  healthLevel: "saudavel" | "moderado" | "menos_saudavel";
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portionDescription: string;
  ingredients: unknown[];
  instructions: string;
  active: boolean;
};

export type RecipeAdminInput = Omit<RecipeAdminRecord, "id" | "aiScore" | "aiReason">;

export type RecipeImageReview = {
  id: string;
  name: string;
  imageUrl: string;
  validated: boolean;
  aiScore: number | null;
  aiReason: string;
  objectiveTags: string[];
  mealCategory: string;
};

export type RecipeAiDraft = {
  name: string;
  ingredients: unknown[];
  instructions: string;
  portionDescription: string;
  objectiveCategories: string[];
  mealCategory: string;
  dayPeriod: RecipeAdminRecord["dayPeriod"];
  healthLevel: RecipeAdminRecord["healthLevel"];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosEstimatedAi: boolean;
  macroVerification: unknown[];
  nutritionSource: string;
  imageUrl: string;
  imageConfidence: number | null;
  imageSource: RecipeImageSource;
};

type Row = Record<string, unknown>;
function n(value: unknown) { const x = Number(value ?? 0); return Number.isFinite(x) ? x : 0; }
function t(value: unknown) { return String(value ?? "").trim(); }

const CATEGORY_ALIASES: Record<string, string> = {
  camisa: "camisas",
  camisas: "camisas",
  camiseta: "camisas",
  camisetas: "camisas",
  suplemento: "suplementos",
  suplementos: "suplementos",
};

export function normalizeProductCategory(value: unknown) {
  const normalized = t(value).toLocaleLowerCase("pt-BR").replace(/\s+/g, "_");
  return CATEGORY_ALIASES[normalized] ?? (normalized || "outros");
}

export function productCategoryLabel(value: unknown) {
  const normalized = normalizeProductCategory(value);
  const known: Record<string, string> = { todos: "Todos", camisas: "Camisas", suplementos: "Suplementos", acessorios: "Acessórios", outros: "Outros" };
  if (known[normalized]) return known[normalized];
  return normalized.replace(/_/g, " ").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

const TEST_COPY_PATTERNS = [/nunca\s+mais\s+comer\s+p[aã]ozinho/i, /lorem\s+ipsum/i, /\bplaceholder\b/i, /^teste(?:\s+teste)*[.!]?$/i];

export function hasSuspiciousProductCopy(value: unknown) {
  const copy = t(value);
  return Boolean(copy && TEST_COPY_PATTERNS.some((pattern) => pattern.test(copy)));
}

export function hasProductImage(input: { images?: StoreProductImage[]; imageUrl?: string }) {
  return Boolean(input.images?.some((image) => t(image.url || image.path)) || t(input.imageUrl));
}

function publicStorageUrl(bucket: string, path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function productBase(row: Row): Omit<StoreProduct, "images" | "imageUrl"> {
  return {
    id: t(row.id), name: t(row.nome), description: t(row.descricao), category: normalizeProductCategory(row.categoria),
    originalPrice: Math.max(0,n(row.preco_original)), pixPrice: Math.max(0,n(row.preco_pix)), discountPercent: Math.max(0,Math.round(n(row.desconto_percentual))),
    rating: Math.max(0,Math.min(5,n(row.avaliacao))), ratingCount: Math.max(0,Math.round(n(row.quantidade_avaliacoes))), stock: Math.max(0,Math.round(n(row.estoque_quantidade))),
    active: row.ativo !== false, purchaseEnabled: row.compra_habilitada === true,
  };
}

async function loadImagesForProducts(productIds: string[]) {
  const map = new Map<string, StoreProductImage[]>();
  if (!productIds.length) return map;
  const response = await supabase.from("produto_imagens").select("id,produto_id,storage_path,ordem").in("produto_id", productIds).order("ordem", { ascending: true });
  if (response.error) return map;
  for (const raw of (response.data ?? []) as Row[]) {
    const productId = t(raw.produto_id); const path = t(raw.storage_path); if (!productId || !path) continue;
    const bucket = path.startsWith("recipe:") ? "receitas-imagens" : "produtos-imagens";
    const normalizedPath = path.replace(/^product:/, "").replace(/^recipe:/, "");
    const item: StoreProductImage = { id:t(raw.id), path:normalizedPath, url:publicStorageUrl(bucket, normalizedPath), order:Math.max(0,Math.round(n(raw.ordem))) };
    map.set(productId, [...(map.get(productId) ?? []), item]);
  }
  for (const [id, items] of map) map.set(id, items.sort((a,b)=>a.order-b.order).map((item,index)=>({...item,order:index})));
  return map;
}

async function productsFromRows(rows: Row[]) {
  const imageMap = await loadImagesForProducts(rows.map((row) => t(row.id)).filter(Boolean));
  return rows.map((row) => {
    const base = productBase(row);
    const images = imageMap.get(base.id) ?? [];
    const legacy = t(row.imagem_url);
    const imageUrl = images[0]?.url || legacy;
    return { ...base, images, imageUrl } satisfies StoreProduct;
  });
}

export async function loadStoreProducts(includeInactive = false) {
  let query = supabase.from("produtos").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) throw error;
  const products = await productsFromRows((data ?? []) as Row[]);
  return includeInactive ? products : products.filter((product) => hasProductImage(product));
}

export async function reserveProduct(productId: string) {
  const { data, error } = await supabase.rpc("reserve_product_v1_3_1", { p_produto_id: productId });
  if (error) throw error;
  return String(Array.isArray(data) ? data[0] : data ?? "");
}

export async function cancelMyReservation(reservationId: string) {
  const { error } = await supabase.rpc("cancel_my_reservation_v1_3_1", { p_reserva_id: reservationId });
  if (error) throw error;
}

async function productMapByIds(ids: string[]) {
  if (!ids.length) return new Map<string, StoreProduct>();
  const response = await supabase.from("produtos").select("*").in("id", ids);
  if (response.error) return new Map<string, StoreProduct>();
  const products = await productsFromRows((response.data ?? []) as Row[]);
  return new Map(products.map((product) => [product.id, product]));
}

export async function loadMyReservations(userId: string): Promise<StoreReservation[]> {
  const { data, error } = await supabase.from("reservas").select("*").eq("aluno_id", userId).order("reservado_em", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const ids = [...new Set(rows.map(r=>t(r.produto_id)).filter(Boolean))];
  const productMap = await productMapByIds(ids);
  return rows.map(row => ({ id:t(row.id), productId:t(row.produto_id), studentId:t(row.aluno_id), status:(t(row.status)||"reservado") as StoreReservation["status"], reservedAt:t(row.reservado_em), withdrawnAt:t(row.retirado_em), product:productMap.get(t(row.produto_id)) ?? null }));
}

export type ProductInput = Omit<StoreProduct,"id"|"discountPercent"|"rating"|"ratingCount"|"imageUrl"> & { rating?: number; ratingCount?: number };

async function syncProductImages(productId: string, images: StoreProductImage[]) {
  const existingResponse = await supabase.from("produto_imagens").select("id,storage_path,ordem").eq("produto_id", productId);
  if (existingResponse.error) throw existingResponse.error;
  const existing = (existingResponse.data ?? []) as Row[];
  const nextPaths = new Set(images.map((image) => image.path));
  const removed = existing.filter((row) => !nextPaths.has(t(row.storage_path)));
  if (removed.length) {
    const ids = removed.map((row) => t(row.id)).filter(Boolean);
    if (ids.length) {
      const { error } = await supabase.from("produto_imagens").delete().in("id", ids);
      if (error) throw error;
    }
    const storagePaths = removed.map((row) => t(row.storage_path)).filter((path) => path && !/^https?:\/\//i.test(path));
    if (storagePaths.length) await supabase.storage.from("produtos-imagens").remove(storagePaths);
  }
  for (const [index, image] of images.entries()) {
    const row = existing.find((candidate) => t(candidate.storage_path) === image.path);
    if (row) {
      const { error } = await supabase.from("produto_imagens").update({ ordem:index }).eq("id", t(row.id));
      if (error) throw error;
    } else {
      const { error } = await supabase.from("produto_imagens").insert({ produto_id:productId, storage_path:image.path, ordem:index });
      if (error) throw error;
    }
  }
}

export async function saveProduct(input: ProductInput, id?: string) {
  const firstImage = input.images[0]?.url ?? input.images[0]?.path ?? null;
  if (input.active && !hasProductImage({ images: input.images })) throw new Error("product_image_required");
  if (input.active && hasSuspiciousProductCopy(input.description)) throw new Error("product_copy_review_required");
  const basePayload = { nome:input.name.trim(), descricao:input.description.trim() || null, categoria:normalizeProductCategory(input.category), preco_original:input.originalPrice, preco_pix:input.pixPrice, avaliacao:input.rating ?? null, quantidade_avaliacoes:input.ratingCount ?? 0, estoque_quantidade:Math.max(0,Math.round(input.stock)), imagem_url:firstImage, compra_habilitada:input.purchaseEnabled };
  let productId = id ?? "";
  if (id) {
    const { error } = await supabase.from("produtos").update({ ...basePayload, ativo:false }).eq("id",id);
    if (error) throw error;
  } else {
    const user = await supabase.auth.getUser();
    const { data,error } = await supabase.from("produtos").insert({ ...basePayload, ativo:false, criado_por:user.data.user?.id ?? null }).select("id").single();
    if (error) throw error;
    productId = String(data.id);
  }
  await syncProductImages(productId, input.images);
  const { error: publishError } = await supabase.from("produtos").update({ ativo:input.active }).eq("id", productId);
  if (publishError) throw publishError;
  return productId;
}

export async function loadStaffReservations(): Promise<StoreReservation[]> {
  const { data,error } = await supabase.from("reservas").select("*").order("reservado_em",{ascending:false}).limit(500); if(error) throw error;
  const rows=(data??[]) as Row[]; const productIds=[...new Set(rows.map(r=>t(r.produto_id)).filter(Boolean))]; const studentIds=[...new Set(rows.map(r=>t(r.aluno_id)).filter(Boolean))];
  const [productMap,profiles] = await Promise.all([ productMapByIds(productIds), studentIds.length ? supabase.from("profiles").select("id,full_name").in("id",studentIds) : Promise.resolve({data:[],error:null} as any) ]);
  const profileMap=new Map(((profiles.data??[]) as Row[]).map(r=>[t(r.id),t(r.full_name)||"Aluno ACCQUA"]));
  return rows.map(row=>({id:t(row.id),productId:t(row.produto_id),studentId:t(row.aluno_id),status:(t(row.status)||"reservado") as StoreReservation["status"],reservedAt:t(row.reservado_em),withdrawnAt:t(row.retirado_em),product:productMap.get(t(row.produto_id))??null,studentName:profileMap.get(t(row.aluno_id))??"Aluno ACCQUA"}));
}

export async function staffSetReservationStatus(reservationId:string,status:"retirado"|"cancelado") {
  const {error}=await supabase.rpc("staff_set_reservation_status_v1_3_1",{p_reserva_id:reservationId,p_status:status}); if(error) throw error;
}

function recipeFromRow(r: Row): RecipeAdminRecord {
  const objectives = Array.isArray(r.categoria_objetivo) ? r.categoria_objetivo.map(t).filter(Boolean) : [];
  return {
    id:t(r.id), name:t(r.nome??r.title)||"Receita", imageUrl:t(r.imagem_url), imageValidated:r.imagem_validada===true,
    imageConfidence:r.imagem_confianca==null?null:Math.max(0,Math.min(1,n(r.imagem_confianca))),
    imageSource:(t(r.imagem_fonte) as RecipeImageSource)||"", macrosEstimatedAi:r.macros_estimados_ia===true,
    aiScore:r.imagem_validacao_score==null?null:n(r.imagem_validacao_score), aiReason:t(r.imagem_validacao_motivo), objectiveCategories:objectives,
    mealCategory:t(r.categoria_refeicao), dayPeriod:(t(r.periodo_dia) as RecipeAdminRecord["dayPeriod"])||"", calorieLevel:(t(r.nivel_calorico) as RecipeAdminRecord["calorieLevel"])||"",
    healthLevel:(["saudavel","moderado","menos_saudavel"].includes(t(r.nivel_saudavel))?t(r.nivel_saudavel):"saudavel") as RecipeAdminRecord["healthLevel"],
    kcal:Math.max(0,n(r.kcal)), protein:Math.max(0,n(r.proteina_g)), carbs:Math.max(0,n(r.carbo_g)), fat:Math.max(0,n(r.gordura_g)),
    portionDescription:t(r.porcao_descricao), ingredients:Array.isArray(r.ingredientes)?r.ingredientes:[], instructions:t(r.modo_preparo), active:r.ativo!==false,
  };
}

export async function loadRecipesForAdmin(): Promise<RecipeAdminRecord[]> {
  const {data,error}=await supabase.from("recipes").select("*").order("nome",{ascending:true});
  if(error) throw error;
  return ((data??[]) as Row[]).map(recipeFromRow);
}

export async function saveRecipeAdmin(input: RecipeAdminInput, id?: string) {
  const payload = {
    nome: input.name.trim(), title: input.name.trim(), imagem_url: input.imageUrl || null,
    imagem_validada: input.imageValidated && Boolean(input.imageUrl), imagem_confianca: input.imageConfidence,
    imagem_fonte: input.imageUrl ? (input.imageSource || "upload_manual") : null, macros_estimados_ia: input.macrosEstimatedAi,
    categoria_objetivo: input.objectiveCategories, categoria_refeicao: input.mealCategory,
    periodo_dia: input.dayPeriod || null, nivel_calorico: input.calorieLevel || null, nivel_saudavel: input.healthLevel,
    kcal:Math.round(input.kcal), proteina_g:input.protein, carbo_g:input.carbs, gordura_g:input.fat,
    porcao_descricao:input.portionDescription || null, ingredientes:input.ingredients, modo_preparo:input.instructions || null,
    macros:{calorias:Math.round(input.kcal),proteina_g:input.protein,carbo_g:input.carbs,gordura_g:input.fat},
    tags:[...input.objectiveCategories,input.mealCategory], ativo:input.active,
  };
  if (id) { const {error}=await supabase.from("recipes").update(payload).eq("id",id); if(error) throw error; return id; }
  const {data,error}=await supabase.from("recipes").insert(payload).select("id").single(); if(error) throw error; return t(data?.id);
}

export async function setRecipeActive(id:string,active:boolean) { const {error}=await supabase.from("recipes").update({ativo:active}).eq("id",id); if(error) throw error; }
export async function setRecipeImageValidated(id:string,validated:boolean) { const {error}=await supabase.from("recipes").update({imagem_validada:validated,imagem_validada_em:validated?new Date().toISOString():null}).eq("id",id); if(error) throw error; }

export async function loadRecipeImageReviewQueue(): Promise<RecipeImageReview[]> {
  const rows = await loadRecipesForAdmin();
  return rows.map(r=>({id:r.id,name:r.name,imageUrl:r.imageUrl,validated:r.imageValidated,aiScore:r.aiScore,aiReason:r.aiReason,objectiveTags:r.objectiveCategories,mealCategory:r.mealCategory}));
}

export async function validateRecipeImageWithAI(recipe:RecipeImageReview, replaceApproved = false) {
  const {data,error}=await supabase.functions.invoke("validate-recipe-image",{body:{recipe_id:recipe.id,replace_approved:replaceApproved}});
  if(error) {
    const context = (error as any)?.context;
    if (context?.status === 409) return { status:"confirmation_required" as const, match:false, score:0, reason:"Substituir imagem já aprovada?", imageUrl:"", source:"" };
    throw error;
  }
  return {
    status:(t(data?.status)||"ok") as "ok"|"sem_match"|"confirmation_required",
    match:Boolean(data?.match), score:Math.max(0,Math.min(1,n(data?.score))), reason:t(data?.reason),
    imageUrl:t(data?.imageUrl), source:t(data?.source),
  };
}

export async function generateRecipeDraftWithAI(description:string): Promise<RecipeAiDraft> {
  const { data, error } = await supabase.functions.invoke("generate-recipe-ai", { body: { descricao: description.trim() } });
  if (error) throw error;
  return {
    name:t(data?.name), ingredients:Array.isArray(data?.ingredients)?data.ingredients:[], instructions:t(data?.instructions), portionDescription:t(data?.portionDescription),
    objectiveCategories:Array.isArray(data?.objectiveCategories)?data.objectiveCategories.map(t).filter(Boolean):[], mealCategory:t(data?.mealCategory)||"almoco",
    dayPeriod:(["manha","tarde","noite"].includes(t(data?.dayPeriod))?t(data?.dayPeriod):"tarde") as RecipeAiDraft["dayPeriod"],
    healthLevel:(["saudavel","moderado","menos_saudavel"].includes(t(data?.healthLevel))?t(data?.healthLevel):"saudavel") as RecipeAiDraft["healthLevel"],
    kcal:Math.max(0,n(data?.kcal)),protein:Math.max(0,n(data?.protein)),carbs:Math.max(0,n(data?.carbs)),fat:Math.max(0,n(data?.fat)),macrosEstimatedAi:Boolean(data?.macrosEstimatedAi),
    macroVerification:Array.isArray(data?.macroVerification)?data.macroVerification:[],nutritionSource:t(data?.nutritionSource),imageUrl:t(data?.imageUrl),
    imageConfidence:data?.imageConfidence==null?null:Math.max(0,Math.min(1,n(data?.imageConfidence))),imageSource:(t(data?.imageSource) as RecipeImageSource)||"",
  };
}

export async function deleteStoreProductStaff(id: string): Promise<{ action: "deleted" | "deactivated"; reservations: number }> {
  const { data, error } = await supabase.rpc("accqua_staff_delete_product_v1_3_6", { p_product_id: id });
  if (error) throw new Error(error.message);
  const raw = (Array.isArray(data) ? data[0] : data ?? {}) as Row;
  return { action: t(raw.action) === "deleted" ? "deleted" : "deactivated", reservations: Math.max(0, n(raw.reservations)) };
}

export async function deleteRecipeStaff(id: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_staff_delete_recipe_v1_3_6", { p_recipe_id: id });
  if (error) throw new Error(error.message);
}
