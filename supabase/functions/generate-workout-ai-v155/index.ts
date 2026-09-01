import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function splitForDays(days: number) { return (["FULL","FULL","AB","ABC","ABCD","ABCDE","ABCDEF"] as const)[Math.max(1, Math.min(6, days))]; }
function schedules(days: number) {
  const map: Record<number, number[][]> = { 1:[[1,3,5]],2:[[1,4],[2,5]],3:[[1,4],[2,5],[3,6]],4:[[1],[2],[4],[5]],5:[[1],[2],[3],[4],[5]],6:[[1],[2],[3],[4],[5],[6]] };
  return map[Math.max(1, Math.min(6, days))] ?? map[3];
}
function prescription(goal: string, level: string) {
  const g=normalize(goal),l=normalize(level);
  if(g.includes("forca"))return{sets:l.includes("inic")?3:4,repsMin:4,repsMax:8,restSeconds:120};
  if(g.includes("emagrec")||g.includes("condicion"))return{sets:3,repsMin:12,repsMax:15,restSeconds:45};
  if(g.includes("saude")||g.includes("adapt"))return{sets:3,repsMin:10,repsMax:15,restSeconds:60};
  return{sets:l.includes("avanc")?4:3,repsMin:8,repsMax:12,restSeconds:75};
}
function inferDays(description:string,frequency:unknown){const match=normalize(description).match(/([1-6])\s*(?:x|vez(?:es)?|dias?)/);return Math.max(1,Math.min(6,match?Number(match[1]):numberValue(frequency,3)||3));}
function parseJson(value:string){return JSON.parse(value.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim());}
async function askGemini(prompt:string){
  const key=Deno.env.get("GEMINI_API_KEY")?.trim();if(!key)throw new Error("gemini_not_configured");
  const models=[Deno.env.get("MEAL_VISION_MODEL"),"gemini-3.7-flash","gemini-3.1-flash-lite","gemini-2.5-flash-lite"].map(m=>text(m).replace(/^models\//,"").replace(/:generateContent.*$/,"")).filter((m,i,a)=>m&&a.indexOf(m)===i);
  for(const model of models){const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:.25}})});if(response.status===404)continue;if(!response.ok)throw new Error(`gemini_${response.status}`);const payload=await response.json();const raw=(payload?.candidates?.[0]?.content?.parts??[]).map((p:any)=>text(p?.text)).join("");if(raw)return parseJson(raw);}
  throw new Error("gemini_unavailable");
}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:cors});
  try{
    const url=Deno.env.get("SUPABASE_URL")??"",anon=Deno.env.get("SUPABASE_ANON_KEY")??"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",authHeader=req.headers.get("Authorization")??"";
    const auth=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});const{data:authData,error:authError}=await auth.auth.getUser();if(authError||!authData.user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:cors});
    const admin=createClient(url,service,{auth:{persistSession:false}});const{data:staff}=await admin.from("profiles").select("role,status").eq("id",authData.user.id).maybeSingle();if(!staff||!["professor","admin","reception"].includes(text(staff.role))||!["active","ativo","approved"].includes(text(staff.status).toLowerCase()))return new Response(JSON.stringify({error:"forbidden"}),{status:403,headers:cors});
    const body=await req.json();const studentId=text(body?.studentId??body?.alunoId),description=text(body?.description??body?.descricao).slice(0,1800);if(!studentId||!description)return new Response(JSON.stringify({error:"student_and_description_required"}),{status:400,headers:cors});
    const[{data:student},{data:exerciseRows,error:exerciseError}]=await Promise.all([admin.from("profiles").select("id,full_name,birth_date,objective,objetivo,nivel,frequencia").eq("id",studentId).maybeSingle(),admin.from("exercise_library").select("id,slug,name,muscle_group,equipment,category,media_url,beginner_tip,default_sets,default_reps_min,default_reps_max,default_rest_seconds").eq("is_active",true).order("name")]);
    if(!student)return new Response(JSON.stringify({error:"student_not_found"}),{status:404,headers:cors});if(exerciseError||!exerciseRows?.length)return new Response(JSON.stringify({error:"exercise_library_empty"}),{status:409,headers:cors});
    const days=inferDays(description,student.frequencia);const catalogText=exerciseRows.map((e:any)=>`${e.id}|${text(e.name)}|${text(e.muscle_group)}|${text(e.equipment)}`).join("\n");
    const prompt=["Você é um assistente de montagem de treino para um PROFESSOR revisar. Nunca salve nada.","REGRA ABSOLUTA: só escolha exerciseId do catálogo abaixo. Nunca invente exercício ou ID.",`Aluno: ${text(student.full_name)}. Objetivo: ${text(student.objective??student.objetivo)}. Nível: ${text(student.nivel)}.`,`Descrição do professor: ${description}`,`Rotinas esperadas: ${days}.`,`Retorne JSON estrito: {title:string,objective:string,level:string,restrictions:string[],preferences:string[],days:number,routines:[{focus:string,exerciseIds:string[]}],cardioSuggested:boolean,cardioMinutes:number}.`,`Cada rotina deve usar 4 a 8 IDs reais. A revisão humana é obrigatória.`,`CATÁLOGO REAL:`,catalogText].join("\n");
    let ai:any;try{ai=await askGemini(prompt)}catch{ai={title:`${text(student.objective??student.objetivo)||"Treino"} — sugestão`,objective:text(student.objective??student.objetivo)||"saúde",level:text(student.nivel)||"iniciante",restrictions:[],preferences:[],days,routines:[]}}
    const valid=new Map(exerciseRows.map((e:any)=>[text(e.id),e])),used=new Set<string>(),requested=Array.isArray(ai?.routines)?ai.routines:[],targetDays=Math.max(1,Math.min(6,numberValue(ai?.days,days)||days)),schedule=schedules(targetDays),params=prescription(text(ai?.objective??student.objective??student.objetivo),text(ai?.level??student.nivel));
    const routines=Array.from({length:targetDays},(_,index)=>{const request=requested[index],ids=Array.isArray(request?.exerciseIds)?request.exerciseIds.map(text).filter((id:string)=>valid.has(id)):[],selected:any[]=[];for(const id of ids){if(selected.length>=8||used.has(id))continue;const item=valid.get(id);if(item){selected.push(item);used.add(id)}}if(selected.length<4){for(const item of exerciseRows){const id=text((item as any).id);if(used.has(id))continue;selected.push(item);used.add(id);if(selected.length>=6)break}}const code=String.fromCharCode(65+index);return{code,name:targetDays===1?"Treino Full Body":`Treino ${code}`,focus:text(request?.focus)||"Treino sugerido para revisão",weekDays:schedule[index]??[],exercises:selected.map((item:any,exerciseIndex:number)=>({id:text(item.id),slug:text(item.slug)||text(item.id),name:text(item.name),muscleGroup:text(item.muscle_group),equipment:text(item.equipment),category:text(item.category),mediaUrl:text(item.media_url),beginnerTip:text(item.beginner_tip),defaultSets:numberValue(item.default_sets,3),defaultRepsMin:numberValue(item.default_reps_min,10),defaultRepsMax:numberValue(item.default_reps_max,12),defaultRestSeconds:numberValue(item.default_rest_seconds,60),draftId:`${text(item.id)}-${crypto.randomUUID()}`,sets:params.sets,repsMin:params.repsMin,repsMax:params.repsMax,restSeconds:params.restSeconds,initialLoadKg:0,notes:"",position:exerciseIndex+1}))}});
    for(const routine of routines)for(const exercise of routine.exercises)if(!valid.has(exercise.id))throw new Error("catalog_validation_failed");
    const reviewDate=new Date();reviewDate.setDate(reviewDate.getDate()+35);const title=text(ai?.title)||`${text(ai?.objective)||text(student.objective??student.objetivo)||"Treino"} ${splitForDays(targetDays)}`;
    return new Response(JSON.stringify({programName:title,splitCode:splitForDays(targetDays),programNotes:`✨ Sugestão da IA baseada na descrição do professor. Restrições interpretadas: ${(Array.isArray(ai?.restrictions)?ai.restrictions:[]).map(text).filter(Boolean).join(", ")||"nenhuma informada"}. Revise exercícios, cargas e limitações antes de publicar.`,reviewAt:reviewDate.toISOString().slice(0,10),routines,cardio:ai?.cardioSuggested?{enabled:true,activityType:"treadmill",timing:"after",durationMinutes:Math.max(10,Math.min(60,numberValue(ai?.cardioMinutes,20))),speedKmh:0,calories:0,notes:"Sugestão da IA — revisar antes de publicar."}:{enabled:false,activityType:"treadmill",timing:"after",durationMinutes:20,speedKmh:0,calories:0,notes:""},origin:"ia_descricao",interpretation:{objective:text(ai?.objective),level:text(ai?.level),restrictions:Array.isArray(ai?.restrictions)?ai.restrictions.map(text):[],preferences:Array.isArray(ai?.preferences)?ai.preferences.map(text):[],days:targetDays},catalogValidated:true}),{headers:cors});
  }catch(error){console.error("generate-workout-ai-v155",error instanceof Error?error.message:String(error));return new Response(JSON.stringify({error:"generation_failed"}),{status:500,headers:cors});}
});
