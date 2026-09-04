import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { inviteTrainingPartner, loadTrainingPartners } from "../lib/trainingPartners";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "A"}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8v8M2.5 10v4M19 8v8M21.5 10v4M5 12h14" /></svg>;
}

export default function ProfileTrainingPartners163() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = Boolean(useReducedMotion());
  const query = useQuery({
    queryKey: ["training-partners-v163", user?.id],
    queryFn: loadTrainingPartners,
    enabled: Boolean(user?.id && profile?.role === "student"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const invite = useMutation({
    mutationFn: inviteTrainingPartner,
    onSuccess: async () => {
      toast.success("Chamada enviada. Agora é combinar o treino 💪");
      await queryClient.invalidateQueries({ queryKey: ["training-partners-v163", user?.id] });
    },
    onError: () => toast.error("Não foi possível enviar a chamada agora."),
  });

  if (!user || profile?.role !== "student") return null;
  const partners = query.data ?? [];

  return (
    <section className="profile-menu-section profile-training-partners-v163" id="profile-training-partners">
      <div className="profile-section-heading">
        <div><small>JUNTO É MAIS FÁCIL</small><h3>Parceiros de treino</h3></div>
        <span className="profile-training-partners-icon"><DumbbellIcon /></span>
      </div>
      <p className="profile-training-partners-lead">Chame alguém da ACCQUA pra treinar junto e manter o ritmo.</p>
      {query.isLoading ? (
        <div className="profile-reservation-empty">Buscando parceiros...</div>
      ) : partners.length ? (
        <div className="profile-training-partners-list">
          {partners.slice(0, 12).map((partner) => {
            const pending = partner.inviteStatus === "pending";
            const accepted = partner.inviteStatus === "accepted";
            return (
              <motion.article key={partner.id} initial={false} whileHover={reduceMotion ? undefined : { y: -2 }}>
                <span className={`profile-training-partner-avatar ${partner.avatarUrl ? "has-photo" : ""}`}>
                  {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : initials(partner.fullName)}
                </span>
                <div><strong>{partner.fullName.split(/\s+/)[0]}</strong><small>{partner.objective || "Objetivo não informado"}</small></div>
                <button
                  type="button"
                  disabled={invite.isPending || pending || accepted}
                  className={accepted ? "is-accepted" : pending ? "is-pending" : ""}
                  onClick={() => invite.mutate(partner.id)}
                >
                  {accepted ? "Parceiro" : pending ? "Chamado" : "Chamar"}
                </button>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="profile-reservation-empty">Nenhum outro aluno disponível agora.</div>
      )}
    </section>
  );
}
