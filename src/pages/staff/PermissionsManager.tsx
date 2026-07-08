import { useEffect, useState, type FormEvent } from "react";
import StaffShell from "../../components/StaffShell";
import { Card } from "../../components/AppShell";
import Icon from "../../components/Icon";
import { InputField, SelectField } from "../../components/Field";
import { supabase } from "../../lib/supabase";

interface AuthRow{email:string;role:string;active:boolean;created_at:string;}
export default function PermissionsManager(){
 const [rows,setRows]=useState<AuthRow[]>([]);const [email,setEmail]=useState("");const [role,setRole]=useState("professor");const [message,setMessage]=useState("");
 async function load(){const {data}=await supabase.from("staff_authorizations").select("*").order("created_at",{ascending:false});setRows((data||[]) as AuthRow[]);}useEffect(()=>{void load();},[]);
 async function add(e:FormEvent){e.preventDefault();const {error}=await supabase.from("staff_authorizations").upsert({email:email.trim().toLowerCase(),role,active:true},{onConflict:"email"});setMessage(error?error.message:"Autorização salva.");if(!error){setEmail("");await load();}}
 async function toggle(row:AuthRow){await supabase.from("staff_authorizations").update({active:!row.active}).eq("email",row.email);await load();}
 return <StaffShell title="Permissões da equipe" subtitle="Autorize e revogue acessos de professores e recepção.">
  <div className="notice warning"><Icon name="warning"/><span>E-mails terminados em <b>@professor.com</b> são reconhecidos como professor após verificação do e-mail. Mantenha confirmação de e-mail ativada no Supabase e use um domínio controlado pela academia.</span></div>
  <form className="inline-form card" onSubmit={add}><InputField label="E-mail autorizado" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/><SelectField label="Função" value={role} onChange={e=>setRole(e.target.value)}><option value="professor">Professor</option><option value="reception">Recepção</option><option value="admin">Administrador</option></SelectField><button className="button primary"><Icon name="plus"/> Autorizar</button></form>
  {message&&<div className="form-message success">{message}</div>}
  <div className="permission-list">{rows.map(row=><Card key={row.email}><div><strong>{row.email}</strong><small>{row.role}</small></div><button className={`button small ${row.active?"outline":"primary"}`} onClick={()=>void toggle(row)}>{row.active?"Revogar":"Ativar"}</button></Card>)}</div>
 </StaffShell>;
}
