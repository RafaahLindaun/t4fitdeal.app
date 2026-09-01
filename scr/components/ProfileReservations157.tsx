import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { cancelMyReservation, loadMyReservations } from "../lib/store";
import { supabase } from "../lib/supabase";

async function deleteMyCancelledReservation(reservationId: string) {
  const { data, error } = await supabase.rpc("delete_my_cancelled_reservation_v1_5_7", {
    p_reserva_id: reservationId,
  });
  if (error) throw error;
  if (data !== true) throw new Error("reservation_not_deleted");
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
}

export default function ProfileReservations157() {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (location.pathname !== "/perfil") {
      setTarget(null);
      return;
    }
    let frame = 0;
    let observer: MutationObserver | null = null;
    const find = () => {
      const node = document.getElementById("profile-reservations");
      if (node) {
        node.classList.add("has-v157-panel");
        setTarget(node);
        return true;
      }
      return false;
    };
    if (!find()) {
      observer = new MutationObserver(() => { if (find()) observer?.disconnect(); });
      observer.observe(document.body, { childList: true, subtree: true });
      frame = window.requestAnimationFrame(find);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      document.getElementById("profile-reservations")?.classList.remove("has-v157-panel");
    };
  }, [location.pathname]);

  const query = useQuery({
    queryKey: ["store-reservations-v157", user?.id],
    queryFn: () => loadMyReservations(user!.id),
    enabled: Boolean(user?.id && target),
    staleTime: 8_000,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["store-reservations-v157", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["store-reservations", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["profile-reservations", user?.id] }),
    ]);
  };

  const cancelMutation = useMutation({
    mutationFn: cancelMyReservation,
    onSuccess: async () => { toast.success("Reserva cancelada. Ela continua no seu histórico."); await refresh(); },
    onError: () => toast.error("Não foi possível cancelar a reserva agora."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMyCancelledReservation,
    onSuccess: async () => { toast.success("Reserva apagada do histórico."); await refresh(); },
    onError: () => toast.error("Só é possível apagar uma reserva já cancelada."),
  });

  if (!target || !user) return null;
  const reservations = query.data ?? [];
  const activeCount = reservations.filter((reservation) => reservation.status === "reservado").length;

  return createPortal(
    <div className="profile-reservations-v157">
      <div className="profile-section-heading">
        <div><small>LOJA ACCQUA</small><h3>Minhas peças reservadas</h3></div>
        {activeCount > 0 ? <strong aria-label={`${activeCount} reserva${activeCount === 1 ? " ativa" : "s ativas"}`}>{activeCount}</strong> : null}
      </div>
      {query.isLoading ? (
        <div className="profile-reservation-empty">Carregando reservas...</div>
      ) : reservations.length ? (
        <div className="profile-reservation-list">
          {reservations.map((reservation) => (
            <article key={reservation.id} className={`is-${reservation.status}`}>
              <div className="profile-reservation-thumb">
                {reservation.product?.imageUrl ? <img src={reservation.product.imageUrl} alt="" /> : <span aria-hidden="true">★</span>}
              </div>
              <div className="profile-reservation-copy">
                <strong>{reservation.product?.name ?? "Produto ACCQUA"}</strong>
                <span>{new Date(reservation.reservedAt).toLocaleDateString("pt-BR")} · {reservation.status === "reservado" ? "Reservado" : reservation.status === "cancelado" ? "Cancelado" : "Retirado"}</span>
              </div>
              {reservation.status === "reservado" ? (
                <button type="button" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(reservation.id)}>Cancelar</button>
              ) : reservation.status === "cancelado" ? (
                <button
                  type="button"
                  className="profile-reservation-delete-v157"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(reservation.id)}
                  aria-label={`Apagar reserva cancelada de ${reservation.product?.name ?? "produto"}`}
                  title="Apagar"
                ><TrashIcon /></button>
              ) : (
                <span className="profile-reservation-status is-retirado">Retirado</span>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-reservation-empty">Você ainda não tem peças reservadas.</div>
      )}
    </div>,
    target,
  );
}
