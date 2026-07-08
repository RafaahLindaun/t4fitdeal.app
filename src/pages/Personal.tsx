import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

export default function Personal(){
 const [professors,setProfessors]=useState<Profile[]>([]);const [filter,setFilter]=useState("Todos");const [loading,setLoading]=useState(true);
 useEffect(()=>{void (async()=>{const {data}=await supabase.from("profiles").select("*").eq("role","professor").eq("status","active").order("full_name");setProfessors((data||[]) as Profile[]);setLoading(false);})();},[]);
 const categories=useMemo(()=>["Todos",...Array.from(new Set(professors.map(p=>p.specialty).filter(Boolean) as string[]))], [professors]);
 const visible=filter==="Todos"?professors:professors.filter(p=>p.specialty===filter);
 return <AppShell title="Área personal" subtitle="Escolha um professor e solicite atendimento personalizado." back right={<button className="icon-button"><Icon name="info"/></button>}>
  <Card className="how-it-works"><h2>Como funciona</h2><div><span><Icon name="user"/><b>1. Escolha</b><small>Encontre o personal ideal.</small></span><Icon name="next"/><span><Icon name="message"/><b>2. Converse</b><small>Tire suas dúvidas.</small></span><Icon name="next"/><span><Icon name="dumbbell"/><b>3. Comece</b><small>Receba seu plano.</small></span></div></Card>
  <div className="filter-chips">{categories.map(category=><button className={filter===category?"active":""} onClick={()=>setFilter(category)} key={category}>{category}</button>)}</div>
  {loading?<div className="skeleton hero"/>:visible.length===0?<EmptyState icon="users" title="Nenhum professor encontrado" text="A equipe ainda não cadastrou professores nesta categoria."/>:<div className="personal-list">{visible.map((person,index)=><Card key={person.id} className="personal-row">{index===0&&<em>MAIS PROCURADO</em>}<div className="personal-avatar">{person.avatar_url?<img src={person.avatar_url}/>:person.full_name[0]}</div><div><h2>{person.full_name.split(" ")[0]}</h2><p>{person.specialty||"Treinamento personalizado"}</p><small><Icon name="star"/> Perfil verificado</small></div><Link className="button outline small" to={`/personal/${person.id}`}>Ver perfil</Link></Card>)}</div>}
 </AppShell>;
}
