import { useEffect, useState } from "react";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { supabase } from "../lib/supabase";

interface RankRow { rank:number; student_id:string; first_name:string; avatar_url:string|null; workout_count:number; streak_days:number; }

export default function Ranking(){
 const [rows,setRows]=useState<RankRow[]>([]);const [loading,setLoading]=useState(true);const [info,setInfo]=useState(false);
 useEffect(()=>{void (async()=>{const {data}=await supabase.rpc("get_monthly_ranking");setRows((data||[]) as RankRow[]);setLoading(false);})();},[]);
 const top=rows.slice(0,3);const rest=rows.slice(3);
 return <AppShell title="Ranking" subtitle="Alunos com mais treinos válidos neste mês" back right={<button className="icon-button" onClick={()=>setInfo(!info)}><Icon name="info"/></button>}>
  {info&&<div className="notice info"><Icon name="info"/><span>Conta no máximo 1 treino por dia, com pelo menos 70% das séries concluídas e duração mínima definida pela academia. O ranking reinicia todo mês.</span></div>}
  {loading?<div className="skeleton hero"/>:rows.length===0?<EmptyState icon="trophy" title="Ranking começando" text="Ainda não há treinos válidos registrados neste mês."/>:<>
   <div className="podium">{top.map((row,index)=><Card key={row.student_id} className={`podium-card place-${index+1}`}><span className="medal">{index+1}</span><div className="rank-avatar">{row.avatar_url?<img src={row.avatar_url}/>:row.first_name[0]}</div><strong>{row.first_name}</strong><small>{row.workout_count} treinos</small></Card>)}</div>
   <div className="ranking-list">{rest.map(row=><Card key={row.student_id}><b>{row.rank}</b><div className="rank-avatar small">{row.avatar_url?<img src={row.avatar_url}/>:row.first_name[0]}</div><strong>{row.first_name}</strong><span>{row.workout_count} treinos</span></Card>)}</div>
  </>}
 </AppShell>;
}
