import { useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { InputField, SelectField, TextareaField } from "../components/Field";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function PersonalData(){
 const {profile,user,refreshProfile}=useAuth();
 const [form,setForm]=useState({full_name:profile?.full_name||"",birth_date:profile?.birth_date||"",phone:profile?.phone||"",emergency_phone:profile?.emergency_phone||"",gender:profile?.gender||"",address:profile?.address||"",city:profile?.city||"",objective:profile?.objective||"",weight_kg:profile?.weight_kg?.toString()||"",height_cm:profile?.height_cm?.toString()||"",activity_level:profile?.activity_level||"moderado",dietary_restrictions:profile?.dietary_restrictions||"",food_preferences:profile?.food_preferences||"",show_in_ranking:profile?.show_in_ranking??true});
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const update=(key:string,value:string|boolean)=>setForm(current=>({...current,[key]:value}));
 async function save(e:FormEvent){e.preventDefault();if(!user)return;setBusy(true);const {error}=await supabase.from("profiles").update({...form,weight_kg:form.weight_kg?Number(form.weight_kg):null,height_cm:form.height_cm?Number(form.height_cm):null}).eq("id",user.id);setBusy(false);setMessage(error?error.message:"Dados atualizados com sucesso.");if(!error)await refreshProfile();}
 return <AppShell title="Dados pessoais" subtitle="Mantenha suas informações sempre atualizadas" back>
  <div className="profile-photo-edit"><div>{profile?.avatar_url?<img src={profile.avatar_url}/>:<Icon name="user" size={45}/>}</div><button><Icon name="camera"/> Alterar foto</button></div>
  <form className="form-grid" onSubmit={save}>
   <InputField label="Nome completo" value={form.full_name} onChange={e=>update("full_name",e.target.value)}/><InputField label="CPF" value={profile?.cpf||""} disabled hint="O CPF só pode ser alterado pela recepção."/>
   <InputField label="E-mail" value={profile?.email||""} disabled/><InputField label="Data de nascimento" type="date" value={form.birth_date} onChange={e=>update("birth_date",e.target.value)}/>
   <InputField label="Telefone" value={form.phone} onChange={e=>update("phone",e.target.value)}/><InputField label="Telefone de emergência" value={form.emergency_phone} onChange={e=>update("emergency_phone",e.target.value)}/>
   <SelectField label="Sexo" value={form.gender} onChange={e=>update("gender",e.target.value)}><option value="">Não informar</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option></SelectField><InputField label="Cidade" value={form.city} onChange={e=>update("city",e.target.value)}/>
   <InputField label="Endereço" value={form.address} onChange={e=>update("address",e.target.value)}/><InputField label="Peso (kg)" type="number" step="0.1" value={form.weight_kg} onChange={e=>update("weight_kg",e.target.value)}/>
   <InputField label="Altura (cm)" type="number" value={form.height_cm} onChange={e=>update("height_cm",e.target.value)}/><SelectField label="Atividade" value={form.activity_level} onChange={e=>update("activity_level",e.target.value)}><option value="baixo">Baixo</option><option value="moderado">Moderado</option><option value="alto">Alto</option></SelectField>
   <TextareaField label="Objetivo" value={form.objective} onChange={e=>update("objective",e.target.value)}/><TextareaField label="Restrições alimentares" value={form.dietary_restrictions} onChange={e=>update("dietary_restrictions",e.target.value)}/><TextareaField label="Preferências alimentares" value={form.food_preferences} onChange={e=>update("food_preferences",e.target.value)}/>
   <label className="toggle-row span-2"><span><strong>Aparecer no ranking</strong><small>Mostra apenas seu primeiro nome e foto.</small></span><input type="checkbox" checked={form.show_in_ranking} onChange={e=>update("show_in_ranking",e.target.checked)}/><i/></label>
   {message&&<div className={`form-message span-2 ${message.includes("sucesso")?"success":"error"}`}>{message}</div>}
   <button className="button primary span-2" disabled={busy}><Icon name="save"/> {busy?"Salvando...":"Salvar alterações"}</button>
  </form>
 </AppShell>;
}
