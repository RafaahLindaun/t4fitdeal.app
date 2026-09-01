import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import StorageImageUploadGrid, { type StorageImageValue } from "../components/StorageImageUploadGrid";
import {
  loadAccquaRanking,
  loadRankingPrize,
  nextRankingPeriodKey,
  rankingPeriodKey,
  saveRankingPrize,
} from "../lib/ranking";
import "./staff-ranking.css";

function BackIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function monthLabel(period:string) { const d=new Date(`${period}T12:00:00`); return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(d); }

export default function StaffRanking() {
  const navigate=useNavigate();
  const qc=useQueryClient();
  const { user, profile, loading }=useAuth();
  const staff=Boolean(profile && ["professor","admin","reception"].includes(profile.role));
  const currentPeriod=rankingPeriodKey();
  const nextPeriod=nextRankingPeriodKey();
  const [period,setPeriod]=useState(currentPeriod);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [images,setImages]=useState<StorageImageValue[]>([]);

  const ranking=useQuery({queryKey:["staff-ranking-v153"],queryFn:loadAccquaRanking,enabled:staff,staleTime:15_000});
  const prize=useQuery({queryKey:["ranking-prize",period],queryFn:()=>loadRankingPrize(period),enabled:staff});
  useEffect(()=>{const p=prize.data;setName(p?.name??"");setDescription(p?.description??"");setImages(p?.imageUrl?[{path:p.imageUrl,url:p.imageUrl,order:0}]:[]);},[prize.data,period]);

  const save=useMutation({
    mutationFn:()=>saveRankingPrize({period,name,description,imageUrl:images[0]?.url??""}),
    onSuccess:async()=>{toast.success(`Prêmio de ${monthLabel(period)} salvo.`);await Promise.all([qc.invalidateQueries({queryKey:["ranking-prize",period]}),qc.invalidateQueries({queryKey:["ranking-prize"]})]);},
    onError:()=>toast.error("Não foi possível salvar o prêmio."),
  });
  const top5=useMemo(()=>(ranking.data??[]).slice(0,5),[ranking.data]);
  const submit=(event:FormEvent)=>{event.preventDefault();if(!name.trim()){toast.error("Informe o nome do prêmio.");return;}save.mutate();};

  if(loading)return <LoadingSplash/>;
  if(!user)return <Navigate to="/login" replace/>;
  if(!staff)return <Navigate to="/menu-teste" replace/>;

  return <div className="staff-ranking-screen"><main className="staff-ranking-shell">
    <PageHeader className="staff-ranking-header" left={<button onClick={()=>navigate("/area-accqua")} aria-label="Voltar"><BackIcon/></button>} center={<div><span>ÁREA ACCQUA</span><strong>Ranking</strong></div>} right={<span/>}/>
    <div className="staff-ranking-scroll">
      <section className="staff-ranking-card">
        <div className="staff-ranking-section-head"><div><small>PRÊMIO MENSAL</small><h1>O que está em jogo</h1></div><select aria-label="Período do prêmio" value={period} onChange={e=>setPeriod(e.target.value)}><option value={currentPeriod}>{monthLabel(currentPeriod)} · atual</option><option value={nextPeriod}>{monthLabel(nextPeriod)} · próximo</option></select></div>
        <form className="staff-ranking-form" onSubmit={submit}>
          <StorageImageUploadGrid bucket="premios-ranking" folder={`prizes/${user.id}/${period}`} value={images} onChange={setImages} maxFiles={1} multiple={false} label="Imagem do prêmio"/>
          <label>Nome do prêmio<input maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Kit ACCQUA + suplemento"/></label>
          <label>Descrição<textarea rows={4} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Conte o que o vencedor leva e como retirar."/></label>
          <button type="submit" disabled={save.isPending}>{save.isPending?"Salvando...":`Salvar prêmio de ${monthLabel(period)}`}</button>
        </form>
      </section>

      <section className="staff-ranking-card">
        <div className="staff-ranking-section-head"><div><small>DISPUTA DO MÊS</small><h2>Quem está perto de ganhar</h2></div><span>{top5.length} no Top 5</span></div>
        {ranking.isLoading?<p className="staff-ranking-empty">Carregando ranking...</p>:top5.length?<div className="staff-ranking-top-list">{top5.map((entry,index)=><article key={entry.studentId} className={entry.workoutsToLeader>0&&entry.workoutsToLeader<=2?"is-close":""}><strong>{index+1}º</strong><div><b>{entry.firstName}</b><span>{entry.points} treino{entry.points===1?"":"s"} no mês</span></div>{index===0?<em className="is-leader">Líder</em>:<div className="staff-ranking-gap"><span>a {entry.workoutsToLeader} treino{entry.workoutsToLeader===1?"":"s"} do 1º</span>{entry.workoutsToLeader<=2?<em>🔥 Disputa acirrada</em>:null}</div>}</article>)}</div>:<p className="staff-ranking-empty">Ainda não há treinos válidos neste mês.</p>}
      </section>
    </div>
  </main></div>;
}
