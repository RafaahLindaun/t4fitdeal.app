import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const defaults={reduce_motion:false,large_text:false,keep_screen_awake:true,sound_enabled:true,vibration_enabled:true};
export default function Settings(){
 const {user}=useAuth();const [prefs,setPrefs]=useState(defaults);
 useEffect(()=>{if(!user)return;void (async()=>{const {data}=await supabase.from("user_preferences").select("*").eq("user_id",user.id).maybeSingle();if(data)setPrefs(current=>({...current,...data}));})();},[user]);
 async function toggle(key:keyof typeof defaults){if(!user)return;const next={...prefs,[key]:!prefs[key]};setPrefs(next);document.documentElement.classList.toggle("reduce-motion",next.reduce_motion);document.documentElement.classList.toggle("large-text",next.large_text);await supabase.from("user_preferences").upsert({user_id:user.id,...next},{onConflict:"user_id"});}
 const rows:[keyof typeof defaults,string,string,string][]=[["reduce_motion","Reduzir animações","Movimentos mais discretos","refresh"],["large_text","Texto maior","Aumenta a leitura do aplicativo","book"],["keep_screen_awake","Manter tela ligada no treino","Evita bloquear durante séries","dumbbell"],["sound_enabled","Sons do aplicativo","Alertas e conclusões","bell"],["vibration_enabled","Vibração","Feedback ao tocar em ações","phone"]];
 return <AppShell title="Configurações" subtitle="Personalize sua experiência no aplicativo" back><div className="settings-list">{rows.map(([key,title,text,icon])=><label key={key}><span className="settings-icon"><Icon name={icon}/></span><div><strong>{title}</strong><small>{text}</small></div><input type="checkbox" checked={prefs[key]} onChange={()=>void toggle(key)}/><i/></label>)}</div></AppShell>;
}
