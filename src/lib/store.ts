import { supabase } from "./supabase";

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

type Row = Record<string, unknown>;
function n(value: unknown) { const x = Number(value ?? 0); return Number.isFinite(x) ? x : 0; }
function t(value: unknown) { return String(value ?? "").trim(); }
function productFrom(row: Row): StoreProduct {
  return {
    id: t(row.id), name: t(row.nome), description: t(row.descricao), category: t(row.categoria) || "outros",
    originalPrice: Math.max(0,n(row.preco_original)), pixPrice: Math.max(0,n(row.preco_pix)), discountPercent: Math.max(0,Math.round(n(row.desconto_percentual))),
    rating: Math.max(0,Math.min(5,n(row.avaliacao))), ratingCount: Math.max(0,Math.round(n(row.quantidade_avaliacoes))), stock: Math.max(0,Math.round(n(row.estoque_quantidade))),
    imageUrl: t(row.imagem_url), active: row.ativo !== false, purchaseEnabled: row.compra_habilitada === true,
  };
}

export async function loadStoreProducts(includeInactive = false) {
  let query = supabase.from("produtos").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as Row[]).map(productFrom);
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

export async function loadMyReservations(userId: string): Promise<StoreReservation[]> {
  const { data, error } = await supabase.from("reservas").select("*").eq("aluno_id", userId).order("reservado_em", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const ids = [...new Set(rows.map(r=>t(r.produto_id)).filter(Boolean))];
  const productsResponse = ids.length ? await supabase.from("produtos").select("*").in("id",ids) : { data: [], error: null } as any;
  const productMap = new Map(((productsResponse.data ?? []) as Row[]).map(row => [t(row.id), productFrom(row)]));
  return rows.map(row => ({
    id:t(row.id), productId:t(row.produto_id), studentId:t(row.aluno_id), status:(t(row.status)||"reservado") as StoreReservation["status"],
    reservedAt:t(row.reservado_em), withdrawnAt:t(row.retirado_em), product:productMap.get(t(row.produto_id)) ?? null,
  }));
}

export type ProductInput = Omit<StoreProduct,"id"|"discountPercent"|"rating"|"ratingCount"> & { rating?: number; ratingCount?: number };
export async function saveProduct(input: ProductInput, id?: string) {
  const payload = {
    nome:input.name.trim(), descricao:input.description.trim() || null, categoria:input.category.trim() || "outros",
    preco_original:input.originalPrice, preco_pix:input.pixPrice, avaliacao:input.rating ?? null, quantidade_avaliacoes:input.ratingCount ?? 0,
    estoque_quantidade:Math.max(0,Math.round(input.stock)), imagem_url:input.imageUrl.trim() || null, ativo:input.active, compra_habilitada:input.purchaseEnabled,
  };
  if (id) {
    const { error } = await supabase.from("produtos").update(payload).eq("id",id); if (error) throw error; return id;
  }
  const user = await supabase.auth.getUser();
  const { data,error } = await supabase.from("produtos").insert({ ...payload, criado_por:user.data.user?.id ?? null }).select("id").single();
  if (error) throw error; return String(data.id);
}

export async function loadStaffReservations(): Promise<StoreReservation[]> {
  const { data,error } = await supabase.from("reservas").select("*").order("reservado_em",{ascending:false}).limit(500); if(error) throw error;
  const rows=(data??[]) as Row[]; const productIds=[...new Set(rows.map(r=>t(r.produto_id)).filter(Boolean))]; const studentIds=[...new Set(rows.map(r=>t(r.aluno_id)).filter(Boolean))];
  const [products,profiles] = await Promise.all([
    productIds.length ? supabase.from("produtos").select("*").in("id",productIds) : Promise.resolve({data:[],error:null} as any),
    studentIds.length ? supabase.from("profiles").select("id,full_name").in("id",studentIds) : Promise.resolve({data:[],error:null} as any),
  ]);
  const productMap=new Map(((products.data??[]) as Row[]).map(r=>[t(r.id),productFrom(r)])); const profileMap=new Map(((profiles.data??[]) as Row[]).map(r=>[t(r.id),t(r.full_name)||"Aluno ACCQUA"]));
  return rows.map(row=>({id:t(row.id),productId:t(row.produto_id),studentId:t(row.aluno_id),status:(t(row.status)||"reservado") as StoreReservation["status"],reservedAt:t(row.reservado_em),withdrawnAt:t(row.retirado_em),product:productMap.get(t(row.produto_id))??null,studentName:profileMap.get(t(row.aluno_id))??"Aluno ACCQUA"}));
}

export async function staffSetReservationStatus(reservationId:string,status:"retirado"|"cancelado") {
  const {error}=await supabase.rpc("staff_set_reservation_status_v1_3_1",{p_reserva_id:reservationId,p_status:status}); if(error) throw error;
}

export type RecipeImageReview = { id:string; name:string; imageUrl:string; validated:boolean; aiScore:number|null; aiReason:string; objectiveTags:string[]; mealCategory:string };
export async function loadRecipeImageReviewQueue(): Promise<RecipeImageReview[]> {
  const {data,error}=await supabase.from("recipes").select("id,nome,title,imagem_url,imagem_validada,imagem_validacao_score,imagem_validacao_motivo,categoria_objetivo,categoria_refeicao,tags").order("nome",{ascending:true});
  if(error) throw error;
  return ((data??[]) as Row[]).map(r=>{
    const rawObjectives = Array.isArray(r.categoria_objetivo) ? r.categoria_objetivo : Array.isArray(r.tags) ? r.tags : [];
    return {
      id:t(r.id),name:t(r.nome??r.title)||"Receita",imageUrl:t(r.imagem_url),validated:r.imagem_validada===true,
      aiScore:r.imagem_validacao_score==null?null:n(r.imagem_validacao_score),aiReason:t(r.imagem_validacao_motivo),
      objectiveTags:rawObjectives.map(t).filter(Boolean),mealCategory:t(r.categoria_refeicao),
    };
  });
}
export async function setRecipeImageValidated(id:string,validated:boolean) { const {error}=await supabase.from("recipes").update({imagem_validada:validated,imagem_validada_em:validated?new Date().toISOString():null}).eq("id",id); if(error) throw error; }
export async function validateRecipeImageWithAI(recipe:RecipeImageReview) {
  const {data,error}=await supabase.functions.invoke("validate-recipe-image",{body:{recipe_id:recipe.id,nome:recipe.name,imagem_url:recipe.imageUrl}}); if(error) throw error;
  return { match:Boolean(data?.match), score:Math.max(0,Math.min(1,n(data?.score))), reason:t(data?.reason) };
}
