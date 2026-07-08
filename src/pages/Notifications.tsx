import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const defaults={academy_notices:true,class_reminders:true,workout_reminders:true,store_news:false,ranking_updates:true,diet_reminders:true,email_notifications:false};
export default function Notifications(){
 const {user}=useAuth();const [prefs,setPrefs]=useState(defaults);const [saved,setSaved]=useState(false);
 useEffect(()=>{if(!user)return;void (async()=>{const {data}=await supabase.from("user_preferences").select("*").eq("user_id",user.id).maybeSingle();if(data)setPrefs(current=>({...current,...data}));})();},[user]);
 async function toggle(key:keyof typeof defaults){if(!user)return;const next={...prefs,[key]:!prefs[key]};setPrefs(next);await supabase.from("user_preferences").upsert({user_id:user.id,...next},{onConflict:"user_id"});setSaved(true);window.setTimeout(()=>setSaved(false),1400);}
 const rows:[keyof typeof defaults,string,string,string][]=[
  ["academy_notices","Avisos gerais da academia","Novidades e comunicados","bell"],["class_reminders","Lembretes de aulas","Avisos sobre suas aulas","calendar"],["workout_reminders","Lembretes de treino","Não esqueça seu plano","dumbbell"],["diet_reminders","Dieta e hidratação","Lembretes da área premium","water"],["ranking_updates","Resultados e conquistas","Atualizações do ranking","trophy"],["store_news","Novidades da loja","Novos itens disponíveis","bag"],["email_notifications","Receber por e-mail","Cópia dos avisos importantes","mail"],
 ];
 return <AppShell title="Notificações" subtitle="Escolha o que deseja receber" back>{saved&&<div className="toast">Preferência salva</div>}<div className="settings-list">{rows.map(([key,title,text,icon])=><label key={key}><span className="settings-icon"><Icon name={icon}/></span><div><strong>{title}</strong><small>{text}</small></div><input type="checkbox" checked={prefs[key]} onChange={()=>void toggle(key)}/><i/></label>)}</div></AppShell>;
}
