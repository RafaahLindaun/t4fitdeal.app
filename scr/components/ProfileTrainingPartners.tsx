import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { performHaptic } from "../lib/appFeedback";
import {
  acceptTrainingPartner,
  callTrainingPartner,
  declineTrainingPartner,
  loadMyTrainingPartners,
  removeTrainingPartner,
  requestTrainingPartner,
  searchTrainingPartnerCandidates,
  type TrainingPartnerCandidate,
} from "../lib/trainingPartners";
import "./profile-training-partners.css";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "AS";
}

function Avatar({ name, url }: { name: string; url: string }) {
  return <span className={`profile-partner-avatar ${url ? "has-photo" : ""}`}>{url ? <img src={url} alt="" /> : initials(name)}</span>;
}

export default function ProfileTrainingPartners() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"partners" | "find">("partners");

  const partners = useQuery({
    queryKey: ["training-partners", "1.7.1"],
    queryFn: loadMyTrainingPartners,
    staleTime: 15_000,
  });
  const candidates = useQuery({
    queryKey: ["training-partner-candidates", query],
    queryFn: () => searchTrainingPartnerCandidates(query),
    enabled: mode === "find",
    staleTime: 10_000,
  });

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["training-partners"] }),
      client.invalidateQueries({ queryKey: ["training-partner-candidates"] }),
      client.invalidateQueries({ queryKey: ["training-partner-count"] }),
    ]);
  };

  const mutate = useMutation({
    mutationFn: async (action: { type: "request" | "accept" | "decline" | "call" | "remove"; id: string }) => {
      if (action.type === "request") return requestTrainingPartner(action.id);
      if (action.type === "accept") return acceptTrainingPartner(action.id);
      if (action.type === "decline") return declineTrainingPartner(action.id);
      if (action.type === "call") return callTrainingPartner(action.id);
      return removeTrainingPartner(action.id);
    },
    onSuccess: async (_data, action) => {
      await invalidate();
      if (action.type === "request") toast.success("Convite de parceria enviado.");
      if (action.type === "accept") toast.success("Parceria aceita.");
      if (action.type === "decline") toast.success("Convite recusado.");
      if (action.type === "call") {
        if (user?.id) void performHaptic(user.id, [18, 28, 18]);
        toast.success("Chamado para treino enviado.");
      }
      if (action.type === "remove") toast.success("Parceiro removido.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação."),
  });

  const accepted = useMemo(() => (partners.data ?? []).filter((item) => item.status === "accepted"), [partners.data]);
  const incoming = useMemo(() => (partners.data ?? []).filter((item) => item.status === "incoming_pending" || (item.status === "outgoing_pending" && item.direction === "incoming")), [partners.data]);
  const outgoing = useMemo(() => (partners.data ?? []).filter((item) => item.status === "outgoing_pending" && item.direction !== "incoming"), [partners.data]);

  const renderCandidateAction = (candidate: TrainingPartnerCandidate) => {
    if (candidate.status === "accepted") return <span className="profile-partner-state is-accepted">Parceiro</span>;
    if (candidate.status === "outgoing_pending") return <span className="profile-partner-state">Convite enviado</span>;
    if (candidate.status === "incoming_pending") return <button type="button" className="profile-partner-primary" onClick={() => mutate.mutate({ type: "accept", id: candidate.id })}>Aceitar</button>;
    return <button type="button" className="profile-partner-secondary" onClick={() => mutate.mutate({ type: "request", id: candidate.id })}>Adicionar parceiro</button>;
  };

  return (
    <div className="profile-partners-171">
      <div className="profile-partner-tabs" role="tablist" aria-label="Parceiros de treino">
        <button type="button" className={mode === "partners" ? "is-active" : ""} onClick={() => setMode("partners")}>Parceiros</button>
        <button type="button" className={mode === "find" ? "is-active" : ""} onClick={() => setMode("find")}>Buscar alunos</button>
      </div>

      {mode === "find" ? (
        <>
          <label className="profile-partner-search"><span>Buscar aluno</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o nome..." /></label>
          <div className="profile-partner-list">
            {candidates.isLoading ? <p className="profile-partner-empty">Buscando alunos...</p> : (candidates.data ?? []).map((candidate) => (
              <article key={candidate.id} className="profile-partner-card">
                <Avatar name={candidate.firstName} url={candidate.avatarUrl} />
                <div className="profile-partner-copy"><strong>{candidate.firstName}</strong><small>{candidate.objective || "Objetivo não informado"}</small></div>
                {renderCandidateAction(candidate)}
              </article>
            ))}
            {!candidates.isLoading && !(candidates.data?.length) ? <p className="profile-partner-empty">Nenhum aluno encontrado.</p> : null}
          </div>
        </>
      ) : (
        <div className="profile-partner-sections">
          {incoming.length ? <section><h3>Convites recebidos</h3><div className="profile-partner-list">{incoming.map((partner) => <article className="profile-partner-card" key={partner.id}><Avatar name={partner.firstName} url={partner.avatarUrl}/><div className="profile-partner-copy"><strong>{partner.firstName}</strong><small>{partner.objective || "Quer ser seu parceiro de treino"}</small></div><div className="profile-partner-actions"><button type="button" className="profile-partner-primary" onClick={() => mutate.mutate({ type: "accept", id: partner.id })}>Aceitar</button><button type="button" className="profile-partner-icon-action" aria-label="Recusar convite" onClick={() => mutate.mutate({ type: "decline", id: partner.id })}>×</button></div></article>)}</div></section> : null}
          {outgoing.length ? <section><h3>Convites enviados</h3><div className="profile-partner-list">{outgoing.map((partner) => <article className="profile-partner-card" key={partner.id}><Avatar name={partner.firstName} url={partner.avatarUrl}/><div className="profile-partner-copy"><strong>{partner.firstName}</strong><small>Aguardando resposta</small></div><span className="profile-partner-state">Enviado</span></article>)}</div></section> : null}
          <section><h3>Seus parceiros</h3><div className="profile-partner-list">{partners.isLoading ? <p className="profile-partner-empty">Carregando parceiros...</p> : accepted.map((partner) => <article className="profile-partner-card" key={partner.id}><Avatar name={partner.firstName} url={partner.avatarUrl}/><div className="profile-partner-copy"><strong>{partner.firstName}</strong><small>{partner.objective || "Parceiro de treino"}</small></div><div className="profile-partner-actions"><button type="button" className="profile-partner-primary" onClick={() => mutate.mutate({ type: "call", id: partner.id })}>Chamar para treinar</button><button type="button" className="profile-partner-icon-action" aria-label="Remover parceiro" onClick={() => mutate.mutate({ type: "remove", id: partner.id })}>×</button></div></article>)}{!partners.isLoading && !accepted.length ? <p className="profile-partner-empty">Você ainda não adicionou parceiros. Abra “Buscar alunos” para começar.</p> : null}</div></section>
        </div>
      )}
    </div>
  );
}
