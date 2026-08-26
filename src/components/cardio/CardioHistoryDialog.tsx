import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ResponsiveDialog from "../ResponsiveDialog";
import { loadCardioHistory } from "../../lib/cardioHistory";

function activityName(value: string) {
  return ({ treadmill: "Esteira", walk: "Caminhada", swim: "Natação", spinning: "Spinning", elliptical: "Elíptico", stairs: "Escada", rowing: "Remo" } as Record<string,string>)[value] ?? "Cardio";
}
function duration(seconds: number) { const m=Math.floor(Math.max(0,seconds)/60); const s=Math.max(0,seconds)%60; return `${m}:${String(s).padStart(2,"0")}`; }
function dateLabel(value: string) { const d=new Date(value); return Number.isNaN(d.getTime()) ? "Sessão recente" : new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }).format(d); }

export default function CardioHistoryDialog({ open, onOpenChange, userId }: { open:boolean; onOpenChange:(open:boolean)=>void; userId:string }) {
  const query = useQuery({ queryKey:["cardio-history",userId], queryFn:()=>loadCardioHistory(userId), enabled:open && Boolean(userId), refetchOnMount:"always" });
  useEffect(() => {
    if (!open) return;
    const refresh=()=>void query.refetch();
    window.addEventListener("accqua:cardio-sync-state", refresh);
    window.addEventListener("accqua:cardio-synced", refresh);
    return ()=>{ window.removeEventListener("accqua:cardio-sync-state", refresh); window.removeEventListener("accqua:cardio-synced", refresh); };
  }, [open, query.refetch]);
  return <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Histórico de cardio" description="Sessões deste aparelho e do ACCQUA, incluindo o estado de sincronização." ariaDescriptionId="cardio-history-description" className="cardio-history-dialog" closeButton={<button type="button" aria-label="Fechar">×</button>}>
    <div className="cardio-history-list">
      {query.isLoading ? <p>Carregando sessões...</p> : null}
      {!query.isLoading && !(query.data?.length) ? <p>Nenhuma sessão de cardio registrada ainda.</p> : null}
      {query.data?.map((entry)=><article key={entry.key}>
        <div><strong>{activityName(entry.activityType)}</strong><span>{dateLabel(entry.completedAt)}</span></div>
        <div className="cardio-history-metrics"><b>{duration(entry.elapsedSeconds)}</b><b>{Math.round(entry.calories)} kcal</b></div>
        <span className={`cardio-history-sync is-${entry.syncStatus}`} aria-label={entry.syncStatus === "synced" ? "Sincronizado" : entry.syncStatus === "failed" ? "Aguardando nova tentativa" : "Sincronização pendente"}>{entry.syncStatus === "synced" ? "☁✓" : "☁◷"}</span>
      </article>)}
    </div>
  </ResponsiveDialog>;
}
