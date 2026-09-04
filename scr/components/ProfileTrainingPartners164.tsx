import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import {
  callTrainingPartner,
  loadTrainingPartners,
  requestTrainingPartner,
  respondTrainingPartner,
  type TrainingPartner,
} from "../lib/trainingPartners";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "A"}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8v8M2.5 10v4M19 8v8M21.5 10v4M5 12h14" /></svg>;
}

export default function ProfileTrainingPartners164() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = Boolean(useReducedMotion());
  const queryKey = ["training-partners-v164", user?.id];
  const query = useQuery({
    queryKey,
    queryFn: loadTrainingPartners,
    enabled: Boolean(user?.id && profile?.role === "student"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const refresh = async () => queryClient.invalidateQueries({ queryKey });
  const request = useMutation({
    mutationFn: requestTrainingPartner,
    onSuccess: async () => { toast.success("Pedido de parceiro enviado."); await refresh(); },
    onError: () => toast.error("Não foi possível enviar o pedido agora."),
  });
  const respond = useMutation({
    mutationFn: ({ partner, accept }: { partner: TrainingPartner; accept: boolean }) => respondTrainingPartner(partner.relationId, accept),
    onSuccess: async (_data, variables) => {
      toast.success(variables.accept ? "Parceiro adicionado 💪" : "Pedido recusado.");
      await refresh();
    },
    onError: () => toast.error("Não foi possível atualizar o pedido."),
  });
  const call = useMutation({
    mutationFn: callTrainingPartner,
    onSuccess: () => toast.success("Chamada para treino enviada 💪"),
    onError: () => toast.error("Não foi possível chamar esse parceiro agora."),
  });

  if (!user || profile?.role !== "student") return null;
  const partners = query.data ?? [];
  const accepted = partners.filter((partner) => partner.relationStatus === "accepted");
  const incoming = partners.filter((partner) => partner.relationStatus === "incoming_pending");
  const suggestions = partners.filter((partner) => !["accepted", "incoming_pending"].includes(partner.relationStatus));
  const busy = request.isPending || respond.isPending || call.isPending;

  const person = (partner: TrainingPartner, mode: "accepted" | "incoming" | "suggestion") => (
    <motion.article key={partner.id} initial={false} whileHover={reduceMotion ? undefined : { y: -2 }} className={`profile-training-partner-card-v164 is-${mode}`}>
      <span className={`profile-training-partner-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
        {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.fullName)}
      </span>
      <div className="profile-training-partner-copy-v164">
        <strong>{partner.fullName}</strong>
        <small>{partner.objective || "Objetivo não informado"}</small>
      </div>
      <div className="profile-training-partner-actions-v164">
        {mode === "accepted" ? (
          <button type="button" disabled={busy} onClick={() => call.mutate(partner.id)}>Chamar pra treino</button>
        ) : mode === "incoming" ? (
          <>
            <button type="button" disabled={busy} onClick={() => respond.mutate({ partner, accept: true })}>Aceitar</button>
            <button type="button" className="is-secondary" disabled={busy} onClick={() => respond.mutate({ partner, accept: false })}>Agora não</button>
          </>
        ) : partner.relationStatus === "outgoing_pending" ? (
          <button type="button" className="is-secondary" disabled>Pedido enviado</button>
        ) : (
          <button type="button" disabled={busy} onClick={() => request.mutate(partner.id)}>Adicionar</button>
        )}
      </div>
    </motion.article>
  );

  return (
    <section className="profile-menu-section profile-training-partners-v164" id="profile-training-partners">
      <div className="profile-section-heading">
        <div><small>TREINO EM COMPANHIA</small><h3>Parceiros</h3></div>
        <span className="profile-training-partners-icon"><DumbbellIcon /></span>
      </div>
      <p className="profile-training-partners-lead">Adicione parceiros da ACCQUA e chame quem já aceitou para treinar com você.</p>

      {query.isLoading ? <div className="profile-reservation-empty">Buscando parceiros...</div> : null}
      {query.isError ? <div className="profile-reservation-empty">Não foi possível carregar seus parceiros agora.</div> : null}

      {!query.isLoading && !query.isError ? (
        <>
          {incoming.length ? <div className="profile-partner-group-v164"><h4>Pedidos recebidos</h4><div className="profile-training-partners-list">{incoming.map((partner) => person(partner, "incoming"))}</div></div> : null}
          <div className="profile-partner-group-v164">
            <h4>Meus parceiros</h4>
            {accepted.length ? <div className="profile-training-partners-list">{accepted.map((partner) => person(partner, "accepted"))}</div> : <div className="profile-reservation-empty">Você ainda não adicionou um parceiro.</div>}
          </div>
          <div className="profile-partner-group-v164">
            <h4>Encontrar alunos</h4>
            {suggestions.length ? <div className="profile-training-partners-list">{suggestions.slice(0, 20).map((partner) => person(partner, "suggestion"))}</div> : <div className="profile-reservation-empty">Nenhuma nova sugestão agora.</div>}
          </div>
        </>
      ) : null}
    </section>
  );
}
