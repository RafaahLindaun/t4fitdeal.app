import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function RealtimeNotificationBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    const refreshNotifications = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["accqua-notifications", user.id] }),
      ]);
      window.dispatchEvent(new CustomEvent("accqua:notifications:changed"));
    };

    const refreshPartners = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["training-partners", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["training-partners", "count"] }),
        queryClient.invalidateQueries({ queryKey: ["training-partner-status"] }),
      ]);
    };

    const direct = supabase
      .channel(`accqua-direct-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        refreshNotifications,
      )
      .subscribe();

    const central = supabase
      .channel(`accqua-central-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes_leitura", filter: `aluno_id=eq.${user.id}` },
        refreshNotifications,
      )
      .subscribe();

    const partners = supabase
      .channel(`accqua-training-partners-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accqua_training_partners" },
        refreshPartners,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(direct);
      void supabase.removeChannel(central);
      void supabase.removeChannel(partners);
    };
  }, [queryClient, user?.id]);

  return null;
}
