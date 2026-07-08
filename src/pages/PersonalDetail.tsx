import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

const receptionUrl="https://wa.me/551147181730?text=";
export default function PersonalDetail(){
 const {id}=useParams();const {user}=useAuth();const [person,setPerson]=useState<Profile|null>(null);const [loading,setLoading]=useState(true);const [sent,setSent]=useState(false);
 useEffect(()=>{if(!id)return;void (async()=>{const {data}=await supabase.from("profiles").select("*").eq("id",id).eq("role","professor").maybeSingle();setPerson(data as Profile|null);setLoading(false);})();},[id]);
 async function requestPersonal(){if(!user||!person)return;await supabase.from("personal_requests").upsert({student_id:user.id,professor_id:person.id,status:"pending"},{onConflict:"student_id,professor_id"});setSent(true);const text=encodeURIComponent(`Olá, tenho interesse em conversar com o personal ${person.full_name.split(" ")[0]} pelo app Accqua Sports.`);window.open(receptionUrl+text,"_blank","noopener,noreferrer");}
 if(loading)return <AppShell back><div className="skeleton hero"/></AppShell>;
 if(!person)return <AppShell back><EmptyState title="Professor não encontrado" text="O perfil pode ter sido removido."/></AppShell>;
 return <AppShell back right={<button className="icon-button"><Icon name="info"/></button>}>
  <Card className="personal-profile-hero"><div className="personal-cover">{person.avatar_url?<img src={person.avatar_url}/>:<span>{person.full_name[0]}</span>}</div><h1>{person.full_name.split(" ")[0]}</h1><p>{person.specialty||"Treinamento personalizado"}</p><div className="profile-badges"><span><Icon name="star"/> Verificado</span><span><Icon name="dumbbell"/> Accqua Sports</span></div></Card>
  <Card className="profile-story"><h2>Minha história</h2><p>{person.bio||"Trabalho para ajudar cada aluno a treinar com segurança, constância e objetivos claros. Meu acompanhamento combina técnica, motivação e ajustes conforme sua evolução."}</p></Card>
  <Card><h2>Especialidades</h2><p>{person.specialty||"Hipertrofia, emagrecimento, condicionamento e acompanhamento de iniciantes."}</p></Card>
  {sent&&<div className="notice success"><Icon name="check"/><span>Solicitação registrada.</span></div>}
  <button className="button primary large sticky-action" onClick={requestPersonal}><Icon name="message"/> Chamar personal</button>
 </AppShell>;
}
