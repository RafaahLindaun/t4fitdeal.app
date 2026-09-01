// ACCQUA Sports Build 1.5.3 — busca + QA de imagem de receita.
// A IA nunca aprova a imagem: ela apenas encontra/valida um candidato e deixa a aprovação humana pendente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
function normalizeModel(raw?: string) { return text(raw).replace(/^["'`]+|["'`]+$/g, "").replace(/^models\//i, "").replace(/:generateContent.*$/i, ""); }
function extractText(payload: any) { const parts = payload?.candidates?.[0]?.content?.parts; return Array.isArray(parts) ? parts.map((p:any)=>typeof p?.text === "string" ? p.text : "").join("").trim() : ""; }
function parseJson(value:string) { return JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()); }
async function blobBase64(blob: Blob) { const bytes = new Uint8Array(await blob.arrayBuffer()); let binary=""; for(let i=0;i<bytes.length;i+=0x8000) binary += String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(binary); }
function tokens(value:string) { return new Set(value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/[^a-z0-9]+/).filter(x=>x.length>2)); }
function similarity(a:string,b:string) { const aa=tokens(a), bb=tokens(b); if(!aa.size||!bb.size)return 0; let hits=0; for(const t of aa) if(bb.has(t)) hits++; return hits/Math.max(aa.size,bb.size); }

async function evaluateImage(name:string, image:Blob) {
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const models = [normalizeModel(Deno.env.get("MEAL_VISION_MODEL")), "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"].filter((m,i,a)=>Boolean(m)&&a.indexOf(m)===i);
  const data = await blobBase64(image);
  const prompt = `Controle de qualidade visual de catálogo de receitas. Nome esperado: "${name}". Avalie se a foto representa razoavelmente esse prato/comida. Rejeite casas, pessoas, objetos, suplementos isolados ou pratos claramente diferentes. Retorne SOMENTE JSON: {"score":0.0,"reason":"explicação curta"}. score entre 0 e 1.`;
  for (const model of models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method:"POST", headers:{"Content-Type":"application/json","x-goog-api-key":key}, body:JSON.stringify({ contents:[{role:"user",parts:[{text:prompt},{inlineData:{mimeType:image.type||"image/jpeg",data}}]}], generationConfig:{responseMimeType:"application/json"} }) });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const parsed = parseJson(extractText(await response.json()));
    return { score: Math.max(0,Math.min(1,num(parsed.score))), reason:text(parsed.reason).slice(0,300), model };
  }
  throw new Error("Gemini model unavailable");
}

async function unsplashCandidates(name:string) {
  const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY")?.trim();
  if (!accessKey) return [] as {url:string;source:string;label:string}[];
  const q = encodeURIComponent(`${name} prato comida food`);
  const response = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=5&orientation=landscape`, { headers:{Authorization:`Client-ID ${accessKey}`,"Accept-Version":"v1"} });
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload?.results ?? []).map((r:any)=>({url:text(r?.urls?.regular),source:"ia_unsplash",label:text(r?.alt_description||r?.description||name)})).filter((x:any)=>x.url);
}

async function catalogCandidates(admin:any, recipeId:string, name:string) {
  const [recipes, foods] = await Promise.all([
    admin.from("recipes").select("id,nome,title,imagem_url").neq("id",recipeId).not("imagem_url","is",null).limit(40),
    admin.from("foods").select("name,image_url").eq("active",true).not("image_url","is",null).limit(80),
  ]);
  const list = [
    ...((recipes.data??[]).map((r:any)=>({url:text(r.imagem_url),source:"ia_catalogo",label:text(r.nome||r.title)}))),
    ...((foods.data??[]).map((r:any)=>({url:text(r.image_url),source:"ia_catalogo",label:text(r.name)}))),
  ].filter((x:any)=>x.url);
  return list.sort((a:any,b:any)=>similarity(name,b.label)-similarity(name,a.label)).slice(0,8);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers:cors });
  if (req.method !== "POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:cors});
  try {
    const url=Deno.env.get("SUPABASE_URL")??"", anon=Deno.env.get("SUPABASE_ANON_KEY")??"", service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
    const authHeader=req.headers.get("Authorization")??"";
    const auth=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
    const {data:authData,error:authError}=await auth.auth.getUser();
    if(authError||!authData.user) return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:cors});
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const {data:profile}=await admin.from("profiles").select("role").eq("id",authData.user.id).maybeSingle();
    if(!["professor","admin","reception"].includes(text(profile?.role).toLowerCase())) return new Response(JSON.stringify({error:"forbidden"}),{status:403,headers:cors});
    const body=await req.json(); const recipeId=text(body?.recipe_id); const replaceApproved=body?.replace_approved===true;
    if(!recipeId) return new Response(JSON.stringify({error:"recipe_id_required"}),{status:400,headers:cors});
    const {data:recipe,error:recipeError}=await admin.from("recipes").select("id,nome,title,imagem_url,imagem_validada").eq("id",recipeId).maybeSingle();
    if(recipeError||!recipe) throw recipeError??new Error("recipe_not_found");
    if(recipe.imagem_validada===true&&!replaceApproved) return new Response(JSON.stringify({status:"confirmation_required",message:"Substituir imagem já aprovada?"}),{status:409,headers:cors});
    const name=text(recipe.nome||recipe.title)||"Receita";
    const candidates=[...(await unsplashCandidates(name)),...(await catalogCandidates(admin,recipeId,name))].filter((c,i,a)=>a.findIndex(x=>x.url===c.url)===i).slice(0,10);
    let best:any=null;
    for(const candidate of candidates){
      try{
        const imageResponse=await fetch(candidate.url,{headers:{"User-Agent":"ACCQUA-Recipe-QA/1.5.3"}}); if(!imageResponse.ok)continue;
        const image=await imageResponse.blob(); if(!image.type.startsWith("image/")||image.size>12*1024*1024)continue;
        const evaluated=await evaluateImage(name,image);
        if(!best||evaluated.score>best.score) best={...candidate,...evaluated};
        if(evaluated.score>=0.82) break;
      }catch(error){console.warn("candidate rejected",candidate.url,error instanceof Error?error.message:String(error));}
    }
    if(!best||best.score<0.75){
      await admin.from("recipes").update({imagem_validacao_score:best?.score??0,imagem_validacao_motivo:best?.reason||"Nenhuma imagem adequada encontrada — envie manualmente.",imagem_confianca:best?.score??null}).eq("id",recipeId);
      return new Response(JSON.stringify({status:"sem_match",match:false,score:best?.score??0,reason:best?.reason||"Nenhuma imagem adequada encontrada — envie manualmente.",requires_human_review:true}),{headers:cors});
    }
    await admin.from("recipes").update({imagem_url:best.url,imagem_validada:false,imagem_validada_em:null,imagem_confianca:best.score,imagem_fonte:best.source,imagem_validacao_score:best.score,imagem_validacao_motivo:best.reason}).eq("id",recipeId);
    return new Response(JSON.stringify({status:"ok",match:true,imageUrl:best.url,score:best.score,reason:best.reason,source:best.source,requires_human_review:true}),{headers:cors});
  }catch(error){
    console.error("validate-recipe-image",error instanceof Error?error.message:String(error));
    return new Response(JSON.stringify({status:"sem_match",match:false,score:0,reason:"Nenhuma imagem adequada encontrada — envie manualmente.",requires_human_review:true}),{status:200,headers:cors});
  }
});
