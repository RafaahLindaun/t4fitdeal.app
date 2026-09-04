import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  loadMyTrainingPartners,
  removeTrainingPartner,
} from "../lib/trainingPartners";
import "./profile-training-partners.css";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "A"}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

export default function ProfileTrainingPartners() {
  const reduceMotion = Boolean(useReducedMotion());
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["training-partners", "mine"],
    queryFn: loadMyTrainingPartners,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
  const remove = useMutation({
    mutationFn: removeTrainingPartner,
    onSuccess: async () => {
      toast.success("Parceiro removido.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["training-partners", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["training-partners", "count"] }),
        queryClient.invalidateQueries({ queryKey: ["training-partner-status"] }),
      ]);
    },
    onError: () => toast.error("Não foi possível remover esse parceiro agora."),
  });

  const partners = query.data ?? [];

  return (
    <section className="profile-partners-panel" aria-label="Meus parceiros de treino">
      <div className="profile-partners-panel-heading">
        <div>
          <small>PARCEIROS DE TREINO</small>
          <h2>{partners.length ? `${partners.length} adicionado${partners.length === 1 ? "" : "s"}` : "Sua lista"}</h2>
        </div>
        <span aria-hidden="true">⌁</span>
      </div>

      {query.isLoading ? (
        <div className="profile-partners-empty">Buscando seus parceiros...</div>
      ) : query.isError ? (
        <div className="profile-partners-empty">Não foi possível carregar seus parceiros agora.</div>
      ) : partners.length ? (
        <div className="profile-partners-list">
          {partners.map((partner) => (
            <motion.article
              key={partner.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
            >
              <span className={`profile-partners-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
                {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.firstName)}
              </span>
              <div>
                <strong>{partner.firstName}</strong>
                <small>{partner.objective || "Parceiro ACCQUA"}</small>
              </div>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(partner.id)}>
                Remover
              </button>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="profile-partners-empty">
          <strong>Nenhum parceiro adicionado ainda.</strong>
          <p>Abra o perfil de alguém no Ranking e toque em Adicionar.</p>
        </div>
      )}
    </section>
  );
}
