import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import NotificationIcon, { NOTIFICATION_ICON_OPTIONS, type NotificationIconId } from "../components/NotificationIcon";
import { supabase } from "../lib/supabase";
import "./staff-notifications.css";

type Target = "todos" | "matriculados" | "gympass" | "totalpass";
type SentRow = { id:string; titulo:string; mensagem:string; icone:NotificationIconId; publico_alvo:Target; enviado_em:string };
function BackIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
function targetLabel(value:Target){return value==="todos"?"Todos os alunos":value==="matriculados"?"Matrícula ativa":value==="gympass"?"Gympass":"TotalPass"}

async function loadSent():Promise<SentRow[]>{const {data,error}=await supabase.from("notificacoes").select("id,titulo,mensagem,icone,publico_alvo,enviado_em").order("enviado_em",{ascending:false}).limit(20);if(error)throw error;return (data??[]) as SentRow[]}

export default function StaffNotifications(){
 const navigate=useNavigate();const qc=useQueryClient();const {user,profile,loading}=useAuth();const staff=Boolean(profile&&["professor","admin","reception"].includes(profile.role));
 const [title,setTitle]=useState("");const [message,setMessage]=useState("");const [icon,setIcon]=useState<NotificationIconId>("megafone");const [target,setTarget]=useState<Target>("todos");const [sending,setSending]=useState(false);const [result,setResult]=useState<{enviados:number;pushEntregues:number}|null>(null);
 const history=useQuery({queryKey:["staff-notifications-history"],queryFn:loadSent,enabled:staff,staleTime:10_000});
 if(loading)return <LoadingSplash/>;if(!user)return <Navigate to="/login" replace/>;if(!staff)return <Navigate to="/menu-teste" replace/>;
 const submit=async(e:FormEvent)=>{e.preventDefault();if(!title.trim()||!message.trim())return;setSending(true);setResult(null);try{const {data,error}=await supabase.functions.invoke("send-staff-notification",{body:{titulo:title.trim(),mensagem:message.trim(),icone:icon,publicoAlvo:target}});if(error)throw error;const next={enviados:Number(data?.enviados??0),pushEntregues:Number(data?.pushEntregues??0)};setResult(next);toast.success(`Enviado para ${next.enviados} aluno${next.enviados===1?"":"s"}.`);setTitle("");setMessage("");await qc.invalidateQueries({queryKey:["staff-notifications-history"]});}catch{toast.error("Não foi possível enviar a notificação.");}finally{setSending(false)}};
 return <div className="staff-notifications-screen"><main className="staff-notifications-shell">
  <PageHeader className="staff-notifications-header" left={<button onClick={()=>navigate("/area-accqua")} aria-label="Voltar"><BackIcon/></button>} center={<div><span>ÁREA ACCQUA</span><strong>Notificações</strong></div>} right={<span/>}/>
  <div className="staff-notifications-scroll">
   <section className="staff-notifications-card"><div className="staff-notifications-heading"><small>COMUNICADO</small><h1>Enviar notificação</h1><p>O mesmo público recebe o aviso no sino e, quando autorizado, também por push.</p></div>
    <form onSubmit={submit} className="staff-notifications-form">
     <label>Título <span>{title.length}/60</span><input maxLength={60} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Horário especial neste sábado"/></label>
     <label>Mensagem <span>{message.length}/200</span><textarea maxLength={200} required rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Escreva uma mensagem curta e objetiva."/></label>
     <fieldset><legend>Ícone</legend><div className="staff-notification-icons">{NOTIFICATION_ICON_OPTIONS.map(option=><button key={option.id} type="button" className={icon===option.id?"is-selected":""} aria-pressed={icon===option.id} onClick={()=>setIcon(option.id)}><NotificationIcon id={option.id}/><span>{option.label}</span></button>)}</div></fieldset>
     <fieldset><legend>Público</legend><div className="staff-notification-targets">{(["todos","matriculados","gympass","totalpass"] as Target[]).map(value=><button key={value} type="button" className={target===value?"is-selected":""} aria-pressed={target===value} onClick={()=>setTarget(value)}>{targetLabel(value)}</button>)}</div></fieldset>
     <button className="staff-notification-send" type="submit" disabled={sending||!title.trim()||!message.trim()}>{sending?"Enviando...":"Enviar notificação"}</button>
     {result?<div className="staff-notification-result" role="status"><strong>Enviado para {result.enviados} aluno{result.enviados===1?"":"s"}</strong><span>{result.pushEntregues} push{result.pushEntregues===1?"":"s"} entregue{result.pushEntregues===1?"":"s"} agora. Quem não autorizou push continua com o aviso no sino.</span></div>:null}
    </form>
   </section>
   <section className="staff-notifications-card"><div className="staff-notifications-heading"><small>HISTÓRICO</small><h2>Últimos envios</h2></div>{history.isLoading?<p className="staff-notification-empty">Carregando...</p>:(history.data?.length??0)?<div className="staff-notification-history">{history.data?.map(item=><article key={item.id}><span><NotificationIcon id={item.icone}/></span><div><strong>{item.titulo}</strong><p>{item.mensagem}</p><small>{targetLabel(item.publico_alvo)} · {new Date(item.enviado_em).toLocaleString("pt-BR")}</small></div></article>)}</div>:<p className="staff-notification-empty">Nenhum comunicado enviado ainda.</p>}</section>
  </div>
 </main></div>;
}
