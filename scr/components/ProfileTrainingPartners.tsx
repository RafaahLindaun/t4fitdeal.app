import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SwipeableListItem from "./SwipeableListItem";
import {
  acceptTrainingPartner,
  callTrainingPartner,
  declineTrainingPartner,
  loadMyTrainingPartners,
  removeTrainingPartner,
  type TrainingPartnerStatus,
} from "../lib/trainingPartners";
import "./profile-training-partners.css";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "A"}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function invalidatePartners(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["training-partners", "mine"] }),
    queryClient.invalidateQueries({ queryKey: ["training-partners", "count"] }),
    queryClient.invalidateQueries({ queryKey: ["training-partner-status"] }),
  ]);
}

function statusCopy(value: TrainingPartnerStatus) {
  if (value === "accepted") return "Parceiro";
  if (value === "incoming_pending") return "Quer ser seu parceiro";
  if (value === "outgoing_pending") return "Convite enviado";
  return "Parceiro ACCQUA";
}

function FilterLinesIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export default function ProfileTrainingPartners() {
  const reduceMotion = Boolean(useReducedMotion());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["training-partners", "mine"],
    queryFn: loadMyTrainingPartners,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const action = useMutation({
    mutationFn: async ({ kind, id }: { kind: "accept" | "decline" | "remove" | "call"; id: string }) => {
      if (kind === "accept") return acceptTrainingPartner(id);
      if (kind === "decline") return declineTrainingPartner(id);
      if (kind === "call") return callTrainingPartner(id);
      return removeTrainingPartner(id);
    },
    onSuccess: async (_, variables) => {
      if (variables.kind === "accept") toast.success("Parceria aceita.");
      else if (variables.kind === "decline") toast.success("Convite recusado.");
      else if (variables.kind === "call") toast.success("Convite para treinar enviado.");
      else toast.success("Parceiro removido.");
      await invalidatePartners(queryClient);
    },
    onError: () => toast.error("Não foi possível concluir essa ação agora."),
  });

  const relations = query.data ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const visibleRelations = useMemo(() => {
    if (!normalizedSearch) return relations;
    return relations.filter((item) => `${item.firstName} ${item.objective}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  }, [normalizedSearch, relations]);

  const accepted = visibleRelations.filter((item) => item.status === "accepted");
  const incoming = visibleRelations.filter((item) => item.status === "incoming_pending");
  const outgoing = visibleRelations.filter((item) => item.status === "outgoing_pending");
  const acceptedTotal = relations.filter((item) => item.status === "accepted").length;

  return (
    <section className="profile-partners-panel" aria-label="Meus parceiros de treino">
      <nav className="profile-partners-tabs" aria-label="Perfil e parceiros">
        <button type="button" onClick={() => window.location.assign("/perfil")}>Perfil</button>
        <button type="button" className="is-active" aria-current="page">Parceiros</button>
      </nav>

      <div className="profile-partners-panel-heading">
        <div>
          <small>PARCEIROS DE TREINO</small>
          <h2>{acceptedTotal ? `${acceptedTotal} parceiro${acceptedTotal === 1 ? "" : "s"}` : "Seus parceiros"}</h2>
        </div>
        <button type="button" className="profile-partners-filter-future" aria-label="Filtros, em breve" title="Filtros em breve"><FilterLinesIcon /></button>
      </div>

      <label className="profile-partners-search">
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar parceiro..." autoComplete="off" />
      </label>

      {incoming.length ? (
        <div className="profile-partners-requests">
          <small>CONVITES RECEBIDOS</small>
          {incoming.map((partner) => (
            <article key={`incoming-${partner.id}`}>
              <span className={`profile-partners-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
                {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.firstName)}
              </span>
              <div><strong>{partner.firstName}</strong><small>{partner.objective || statusCopy(partner.status)}</small></div>
              <div className="profile-partners-request-actions">
                <button type="button" className="is-accept" disabled={action.isPending} onClick={() => action.mutate({ kind: "accept", id: partner.id })}>Aceitar</button>
                <button type="button" disabled={action.isPending} onClick={() => action.mutate({ kind: "decline", id: partner.id })}>Recusar</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {outgoing.length ? (
        <div className="profile-partners-outgoing">
          <small>CONVITES ENVIADOS</small>
          {outgoing.map((partner) => (
            <article key={`outgoing-${partner.id}`}>
              <span className={`profile-partners-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
                {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.firstName)}
              </span>
              <div><strong>{partner.firstName}</strong><small>{partner.objective || "Aguardando resposta"}</small></div>
              <span className="profile-partners-pending">Convite enviado</span>
            </article>
          ))}
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="profile-partners-empty">Buscando seus parceiros...</div>
      ) : query.isError ? (
        <div className="profile-partners-empty">Não foi possível carregar seus parceiros agora.</div>
      ) : accepted.length ? (
        <div className="profile-partners-list">
          {accepted.map((partner) => (
            <SwipeableListItem
              key={partner.id}
              className="profile-partners-swipe"
              disabled={action.isPending}
              deleteLabel={`Remover ${partner.firstName}`}
              onDelete={() => action.mutateAsync({ kind: "remove", id: partner.id })}
            >
              <motion.article initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <span className={`profile-partners-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
                  {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.firstName)}
                </span>
                <div><strong>{partner.firstName}</strong><small>{partner.objective || "Parceiro ACCQUA"}</small></div>
                <div className="profile-partners-row-actions">
                  <button type="button" className="is-call" disabled={action.isPending} onClick={() => action.mutate({ kind: "call", id: partner.id })}>Chamar para treinar</button>
                </div>
              </motion.article>
            </SwipeableListItem>
          ))}
        </div>
      ) : !incoming.length && !outgoing.length ? (
        <div className="profile-partners-empty"><strong>Nenhum parceiro encontrado.</strong><p>Adicione parceiros pelo Ranking; eles aparecem aqui para você gerenciar.</p></div>
      ) : null}

      {search && !accepted.length && !incoming.length && !outgoing.length && !query.isLoading ? (
        <div className="profile-partners-empty">Nenhum parceiro corresponde à busca.</div>
      ) : null}
    </section>
  );
}
