import { useEffect, useState } from "react";
import AppShell, { Card } from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { firstName, formatDate } from "../lib/format";
import { supabase } from "../lib/supabase";

export default function Profile(){
 const {profile}=useAuth();const [stats,setStats]=useState({workouts:0,classes:0,days:0,streak:0});
 useEffect(()=>{if(!profile)return;void (async()=>{const {data}=await supabase.rpc("get_student_profile_stats",{p_student_id:profile.id});if(data)setStats(data);})();},[profile]);
 return <AppShell title="Meu perfil" back><Card className="public-profile"><div className="account-avatar">{profile?.avatar_url?<img src={profile.avatar_url}/>:<Icon name="user" size={45}/>}</div><h1>{profile?.full_name}</h1><span>Aluno Accqua Sports</span><small>Membro desde {formatDate(profile?.created_at?.slice(0,10))}</small></Card><div className="profile-stats"><Card><strong>{stats.workouts}</strong><small>Treinos</small></Card><Card><strong>{stats.classes}</strong><small>Aulas</small></Card><Card><strong>{stats.days}</strong><small>Dias ativos</small></Card><Card><strong>{stats.streak}</strong><small>Sequência</small></Card></div><Card><h2>Meu objetivo</h2><p>{profile?.objective||"Nenhum objetivo informado."}</p></Card><Card><h2>Informações atuais</h2><div className="profile-info"><span>Peso <b>{profile?.weight_kg?`${profile.weight_kg} kg`:"—"}</b></span><span>Altura <b>{profile?.height_cm?`${profile.height_cm} cm`:"—"}</b></span><span>Atividade <b>{profile?.activity_level||"—"}</b></span><span>Ranking <b>{profile?.show_in_ranking?"Visível":"Oculto"}</b></span></div></Card></AppShell>;
}
