import { useEffect, useMemo, useState } from "react";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { supabase } from "../lib/supabase";

interface ClassRow { id:string;name:string;category:string;description:string|null;gympass_tier:string|null;active:boolean;schedule_id:string;day_of_week:number;starts_at:string;ends_at:string|null;instructor:string|null;location:string|null;capacity:number|null; }
const days=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export default function Classes(){
 const [rows,setRows]=useState<ClassRow[]>([]);const [view,setView]=useState<"now"|"today"|"week">("today");const [loading,setLoading]=useState(true);const [info,setInfo]=useState(false);
 useEffect(()=>{void (async()=>{const {data}=await supabase.from("class_schedule_view").select("*").eq("active",true).order("day_of_week").order("starts_at");setRows((data||[]) as ClassRow[]);setLoading(false);})();},[]);
 const now=new Date();const day=now.getDay();const hhmm=now.toTimeString().slice(0,5);
 const visible=useMemo(()=>rows.filter(row=>view==="week"?true:view==="today"?row.day_of_week===day:row.day_of_week===day&&row.starts_at.slice(0,5)<=hhmm&&(row.ends_at?row.ends_at.slice(0,5)>=hhmm:true)),[rows,view,day,hhmm]);
 return <AppShell title="Aulas coletivas" subtitle="Aulas, planos aceitos e horários atualizados" back right={<button className="icon-button" onClick={()=>setInfo(!info)}><Icon name="info"/></button>}>
  {info&&<div className="notice info"><Icon name="info"/><span>As aulas exibidas são coletivas, como hidroginástica, natação, funcional e ritmos. Planos aceitos aparecem em cada horário.</span></div>}
  <div className="class-tabs"><button className={view==="now"?"active":""} onClick={()=>setView("now")}>Agora</button><button className={view==="today"?"active":""} onClick={()=>setView("today")}>Hoje</button><button className={view==="week"?"active":""} onClick={()=>setView("week")}>Semana</button></div>
  {loading?<div className="skeleton hero"/>:visible.length===0?<EmptyState icon="calendar" title="Nenhuma aula neste período" text="Troque a visualização ou consulte novamente mais tarde."/>:<div className="class-list">{visible.map(row=>{const happening=view==="now";return <Card key={row.schedule_id} className={happening?"live":""}><span className="class-icon"><Icon name={row.category.toLowerCase().includes("nata")||row.category.toLowerCase().includes("pisc")?"swim":"run"}/></span><div><h2>{row.name}</h2><p><Icon name="clock"/> {row.starts_at.slice(0,5)} {row.ends_at?`– ${row.ends_at.slice(0,5)}`:""}</p><small>{view==="week"?`${days[row.day_of_week]} · `:""}{row.location||"Academia"}{row.instructor?` · ${row.instructor}`:""}</small></div><div className="class-meta">{happening&&<em>AGORA</em>}{row.gympass_tier&&<span>Wellhub {row.gympass_tier}</span>}</div></Card>})}</div>}
 </AppShell>;
}
