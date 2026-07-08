import { useEffect, useState, type FormEvent } from "react";
import StaffShell from "../../components/StaffShell";
import { Card } from "../../components/AppShell";
import EmptyState from "../../components/EmptyState";
import Icon from "../../components/Icon";
import { InputField, SelectField, TextareaField } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { DietAccess, Profile } from "../../lib/types";

const defaultPlan={calories_goal:2200,protein_goal:150,carbs_goal:250,fat_goal:65,fiber_goal:30,water_goal_ml:2500,notes:""};
export default function DietManager(){
 const {profile,canApproveStudents}=useAuth();const [students,setStudents]=useState<Profile[]>([]);const [studentId,setStudentId]=useState("");const [student,setStudent]=useState<Profile|null>(null);const [access,setAccess]=useState<DietAccess|null>(null);const [plan,setPlan]=useState<any>(defaultPlan);const [message,setMessage]=useState("");
 async function loadStudents(){const {data}=await supabase.from("profiles").select("*").eq("role","student").eq("status","active").order("full_name");const rows=(data||[]) as Profile[];setStudents(rows);if(!studentId&&rows[0])setStudentId(rows[0].id);}
 async function loadStudent(id:string){if(!id)return;const current=students.find(x=>x.id===id)||null;setStudent(current);const [accessResult,planResult]=await Promise.all([supabase.from("diet_access").select("*").eq("user_id",id).maybeSingle(),supabase.from("diet_plans").select("*").eq("user_id",id).maybeSingle()]);setAccess(accessResult.data as DietAccess|null);setPlan(planResult.data||defaultPlan);}
 useEffect(()=>{void loadStudents();},[]);useEffect(()=>{if(studentId)void loadStudent(studentId);},[studentId,students.length]);
 async function changeAccess(status:string){if(!studentId||!canApproveStudents)return;const {error}=await supabase.rpc("set_diet_access",{p_student_id:studentId,p_status:status,p_source:"reception",p_expires_at:null});setMessage(error?error.message:`Acesso da dieta alterado para ${status}.`);await loadStudent(studentId);}
 async function savePlan(e:FormEvent){e.preventDefault();if(!studentId||!profile)return;const {error}=await supabase.from("diet_plans").upsert({user_id:studentId,...plan,updated_by:profile.id},{onConflict:"user_id"});setMessage(error?error.message:"Metas da dieta salvas.");}
 return <StaffShell title="Dieta dos alunos" subtitle="A recepção libera o acesso pago; professores vinculados ajustam as metas.">
  <div className="staff-toolbar"><label className="field compact"><span>Aluno</span><select value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Selecione</option>{students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label></div>
  {!studentId?<EmptyState icon="apple" title="Selecione um aluno" text="Escolha um aluno ativo para ver o acesso e o plano nutricional."/>:<>
   <Card className="diet-access-admin"><div><Icon name="apple" size={36}/><span><strong>{student?.full_name}</strong><small>{student?.objective||"Objetivo não informado"}</small></span></div><div><span className={`status-pill ${access?.status||"locked"}`}>{access?.status||"locked"}</span>{canApproveStudents&&<div className="inline-actions"><button className="button small primary" onClick={()=>void changeAccess("active")}>Liberar</button><button className="button small outline" onClick={()=>void changeAccess("locked")}>Bloquear</button></div>}</div></Card>
   <Card className="student-nutrition-data"><h2>Dados do primeiro acesso</h2><div><span>Peso <b>{student?.weight_kg?`${student.weight_kg} kg`:"—"}</b></span><span>Altura <b>{student?.height_cm?`${student.height_cm} cm`:"—"}</b></span><span>Atividade <b>{student?.activity_level||"—"}</b></span><span>Restrições <b>{student?.dietary_restrictions||"Nenhuma"}</b></span></div></Card>
   <form className="form-grid card diet-plan-form" onSubmit={savePlan}><InputField label="Meta de calorias" type="number" value={plan.calories_goal} onChange={e=>setPlan({...plan,calories_goal:Number(e.target.value)})}/><InputField label="Proteínas (g)" type="number" value={plan.protein_goal} onChange={e=>setPlan({...plan,protein_goal:Number(e.target.value)})}/><InputField label="Carboidratos (g)" type="number" value={plan.carbs_goal} onChange={e=>setPlan({...plan,carbs_goal:Number(e.target.value)})}/><InputField label="Gorduras (g)" type="number" value={plan.fat_goal} onChange={e=>setPlan({...plan,fat_goal:Number(e.target.value)})}/><InputField label="Fibras (g)" type="number" value={plan.fiber_goal} onChange={e=>setPlan({...plan,fiber_goal:Number(e.target.value)})}/><InputField label="Água (ml)" type="number" value={plan.water_goal_ml} onChange={e=>setPlan({...plan,water_goal_ml:Number(e.target.value)})}/><TextareaField label="Observações do plano" value={plan.notes||""} onChange={e=>setPlan({...plan,notes:e.target.value})}/>{message&&<div className="form-message success span-2">{message}</div>}<button className="button primary span-2"><Icon name="save"/> Salvar metas</button></form>
  </>}
 </StaffShell>;
}
