// ACCQUA Sports Build 1.5.3 — gera apenas um RASCUNHO para revisão humana.
// O LLM nunca fornece kcal/macros. Nutrição vem exclusivamente da TACO/NEPA-UNICAMP.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const TACO_URL="https://nepa.unicamp.br/publicacoes/tabela-taco-excel/";
const text=(v:unknown)=>String(v??"").trim();
const num=(v:unknown)=>{if(typeof v==="number")return Number.isFinite(v)?v:NaN;const s=text(v).replace(",",".").replace(/\s/g,"");if(!s||/^(tr|na|nd|\*|-)$/i.test(s))return /tr/i.test(s)?0:NaN;const parsed=Number(s);return Number.isFinite(parsed)?parsed:NaN;};
function normalize(value:string){return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function normalizeModel(raw?:string){return text(raw).replace(/^["'`]+|["'`]+$/g,"").replace(/^models\//i,"").replace(/:generateContent.*$/i,"");}
function extractText(payload:any){const parts=payload?.candidates?.[0]?.content?.parts;return Array.isArray(parts)?parts.map((p:any)=>typeof p?.text==="string"?p.text:"").join("").trim():"";}
function parseJson(value:string){return JSON.parse(value.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim());}
async function blobBase64(blob:Blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}

async function geminiJson(prompt:string){
 const key=Deno.env.get("GEMINI_API_KEY")?.trim();if(!key)throw new Error("GEMINI_API_KEY missing");
 const models=[normalizeModel(Deno.env.get("MEAL_VISION_MODEL")),"gemini-3.7-flash","gemini-3.1-flash-lite","gemini-2.5-flash-lite"].filter((m,i,a)=>Boolean(m)&&a.indexOf(m)===i);
 for(const model of models){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:.35}})});if(r.status===404)continue;if(!r.ok)throw new Error(`Gemini ${r.status}`);return parseJson(extractText(await r.json()));}
 throw new Error("Gemini unavailable");
}

async function evaluateImage(name:string,image:Blob){
 const key=Deno.env.get("GEMINI_API_KEY")?.trim();if(!key)return null;
 const models=[normalizeModel(Deno.env.get("MEAL_VISION_MODEL")),"gemini-3.7-flash","gemini-3.1-flash-lite","gemini-2.5-flash-lite"].filter((m,i,a)=>Boolean(m)&&a.indexOf(m)===i);
 const data=await blobBase64(image);const prompt=`Controle de qualidade visual de receita. Nome esperado: "${name}". Avalie se a foto representa razoavelmente esse prato. Rejeite pessoas, casas, objetos, suplementos isolados ou comida claramente diferente. Retorne SOMENTE JSON {"score":0.0,"reason":"curto"}.`;
 for(const model of models){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},{inlineData:{mimeType:image.type||"image/jpeg",data}}]}],generationConfig:{responseMimeType:"application/json"}})});if(r.status===404)continue;if(!r.ok)continue;const parsed=parseJson(extractText(await r.json()));return{score:Math.max(0,Math.min(1,Number(parsed?.score??0))),reason:text(parsed?.reason)};}
 return null;
}

async function findValidatedImage(name:string){
 const accessKey=Deno.env.get("UNSPLASH_ACCESS_KEY")?.trim();if(!accessKey)return null;
 const response=await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(name+" prato comida food")}&per_page=5&orientation=landscape`,{headers:{Authorization:`Client-ID ${accessKey}`,"Accept-Version":"v1"}});if(!response.ok)return null;
 const payload=await response.json();for(const result of (payload?.results??[])){const url=text(result?.urls?.regular);if(!url)continue;try{const imgResponse=await fetch(url,{headers:{"User-Agent":"ACCQUA-Recipe-QA/1.5.3"}});if(!imgResponse.ok)continue;const blob=await imgResponse.blob();if(!blob.type.startsWith("image/")||blob.size>12*1024*1024)continue;const qa=await evaluateImage(name,blob);if(qa&&qa.score>=.75)return{url,confidence:qa.score,source:"ia_unsplash",reason:qa.reason};}catch{} }
 return null;
}

type TacoFood={name:string;kcal:number;protein:number;carbs:number;fat:number};
let tacoCache:{loadedAt:number;foods:TacoFood[]}|null=null;
function headerIndex(row:unknown[],needles:string[]){return row.findIndex((cell)=>{const value=normalize(text(cell));return needles.some((needle)=>value.includes(needle));});}
async function loadTaco(){
 if(tacoCache&&Date.now()-tacoCache.loadedAt<12*60*60*1000)return tacoCache.foods;
 const response=await fetch(TACO_URL,{headers:{"User-Agent":"ACCQUA-Sports/1.5.3"}});if(!response.ok)throw new Error(`TACO download ${response.status}`);
 const bytes=new Uint8Array(await response.arrayBuffer());const workbook=XLSX.read(bytes,{type:"array"});let foods:TacoFood[]=[];
 for(const sheetName of workbook.SheetNames){const rows=XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName],{header:1,raw:true,defval:""});for(let r=0;r<Math.min(rows.length,35);r++){const row=rows[r]??[];const nameCol=headerIndex(row,["descricao dos alimentos","descricao do alimento","alimento"]);const kcalCol=headerIndex(row,["energia kcal","kcal"]);const proteinCol=headerIndex(row,["proteina"]);const fatCol=headerIndex(row,["lipideos","lipideo","gordura"]);const carbCol=headerIndex(row,["carboidrato"]);if(nameCol<0||kcalCol<0||proteinCol<0||fatCol<0||carbCol<0)continue;const parsed:TacoFood[]=[];for(let i=r+1;i<rows.length;i++){const data=rows[i]??[];const name=text(data[nameCol]);if(!name||/^fonte|^nota|^tabela/i.test(name))continue;const kcal=num(data[kcalCol]),protein=num(data[proteinCol]),fat=num(data[fatCol]),carbs=num(data[carbCol]);if(!Number.isFinite(kcal)||!Number.isFinite(protein)||!Number.isFinite(fat)||!Number.isFinite(carbs))continue;parsed.push({name,kcal,protein,carbs,fat});}if(parsed.length>100){foods=parsed;break;}}if(foods.length>100)break;}
 if(foods.length<100)throw new Error("TACO parse failed");tacoCache={loadedAt:Date.now(),foods};return foods;
}

function scoreFood(needle:string,candidate:string){const a=normalize(needle),b=normalize(candidate);if(!a||!b)return 0;if(a===b)return 1;if(b.includes(a)||a.includes(b))return .86;const aa=new Set(a.split(" ").filter(x=>x.length>2)),bb=new Set(b.split(" ").filter(x=>x.length>2));let hits=0;for(const token of aa)if(bb.has(token))hits++;const overlap=hits/Math.max(1,Math.max(aa.size,bb.size));const important=["frango","arroz","feijao","batata","brocolis","ovo","leite","banana","aveia","carne","peixe","macarrao","queijo","iogurte"].some(k=>a.includes(k)&&b.includes(k)) ? .08 : 0;return Math.min(1,overlap+important);}
function matchTaco(name:string,foods:TacoFood[]){let best:TacoFood|null=null,bestScore=0;for(const food of foods){const score=scoreFood(name,food.name);if(score>bestScore){best=food;bestScore=score;}}return best&&bestScore>=.62?{food:best,score:bestScore}:null;}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:cors});
 try{
  const url=Deno.env.get("SUPABASE_URL")??"",anon=Deno.env.get("SUPABASE_ANON_KEY")??"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",authHeader=req.headers.get("Authorization")??"";
  const auth=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});const {data:authData,error:authError}=await auth.auth.getUser();if(authError||!authData.user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:cors});
  const admin=createClient(url,service,{auth:{persistSession:false}});const {data:profile}=await admin.from("profiles").select("role").eq("id",authData.user.id).maybeSingle();if(!["professor","admin","reception"].includes(text(profile?.role).toLowerCase()))return new Response(JSON.stringify({error:"forbidden"}),{status:403,headers:cors});
  const body=await req.json();const descricao=text(body?.descricao).slice(0,500);if(!descricao)return new Response(JSON.stringify({error:"descricao_required"}),{status:400,headers:cors});
  const prompt=["Crie um RASCUNHO culinário para revisão de um professor.","NÃO calcule e NÃO retorne kcal, proteína, carboidrato, gordura ou qualquer macro.","Retorne SOMENTE JSON: nome, ingredientes (array de {nome, quantidade_g, observacao}), modo_preparo, porcao_descricao, categoria_objetivo (array somente emagrecimento|hipertrofia|low_carb), categoria_refeicao (cafe_da_manha|almoco|lanche|jantar), periodo_dia (manha|tarde|noite), nivel_saudavel (saudavel|moderado|menos_saudavel).","Cada ingrediente precisa de quantidade_g numérica plausível para UMA porção. Prefira ingredientes simples presentes em tabelas brasileiras de composição de alimentos.",`Descrição do professor: ${descricao}`].join("\n");
  const draft=await geminiJson(prompt);const ingredients=Array.isArray(draft?.ingredientes)?draft.ingredientes.slice(0,30).map((i:any)=>({nome:text(i?.nome),quantidade_g:Math.max(0,Number(i?.quantidade_g??0)),observacao:text(i?.observacao)})).filter((i:any)=>i.nome&&Number.isFinite(i.quantidade_g)&&i.quantidade_g>0):[];
  const taco=await loadTaco();let kcal=0,protein=0,carbs=0,fat=0;const verification=ingredients.map((item:any)=>{const matched=matchTaco(item.nome,taco);if(!matched)return{ingrediente:item.nome,quantidade_g:item.quantidade_g,encontradoNaTaco:false,referencia:null,confianca:0};const ratio=item.quantidade_g/100;const f=matched.food;kcal+=f.kcal*ratio;protein+=f.protein*ratio;carbs+=f.carbs*ratio;fat+=f.fat*ratio;return{ingrediente:item.nome,quantidade_g:item.quantidade_g,encontradoNaTaco:true,referencia:f.name,confianca:Number(matched.score.toFixed(2))};});
  const allMatched=verification.length>0&&verification.every((item:any)=>item.encontradoNaTaco);const recipeName=text(draft?.nome)||descricao;const image=await findValidatedImage(recipeName);
  return new Response(JSON.stringify({name:recipeName,ingredients,instructions:text(draft?.modo_preparo),portionDescription:text(draft?.porcao_descricao)||"1 porção",objectiveCategories:Array.isArray(draft?.categoria_objetivo)?draft.categoria_objetivo:[],mealCategory:text(draft?.categoria_refeicao)||"almoco",dayPeriod:text(draft?.periodo_dia)||"tarde",healthLevel:text(draft?.nivel_saudavel)||"saudavel",kcal:Math.round(kcal),protein:Number(protein.toFixed(1)),carbs:Number(carbs.toFixed(1)),fat:Number(fat.toFixed(1)),macrosEstimatedAi:!allMatched,macroVerification:verification,nutritionSource:"TACO/NEPA-UNICAMP 4a edição",imageUrl:image?.url??"",imageConfidence:image?.confidence??null,imageSource:image?.source??null,imageReason:image?.reason??""}),{headers:cors});
 }catch(error){console.error("generate-recipe-ai",error instanceof Error?error.message:String(error));return new Response(JSON.stringify({error:"generation_failed",message:error instanceof Error?error.message:"unknown"}),{status:500,headers:cors});}
});