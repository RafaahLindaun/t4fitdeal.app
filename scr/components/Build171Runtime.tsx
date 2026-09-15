import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { registerAccquaPush } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const OLD_PUBLISH_COPY = "Treino publicado para o aluno.";
const NEW_PUBLISH_COPY = "Treino publicado com sucesso";

function useBuilderCopyFix(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(".admin-builder-screen *").forEach((element) => {
          if (element.children.length === 0 && element.textContent?.trim() === OLD_PUBLISH_COPY) {
            element.textContent = NEW_PUBLISH_COPY;
          }
        });
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [active]);
}

function useStorePolish(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const recipeDescription = document.querySelector<HTMLElement>(".recipe-ai-dialog .responsive-dialog-header p, .recipe-ai-dialog .responsive-dialog-header [data-radix-dialog-description]");
        if (recipeDescription) recipeDescription.textContent = "Descreva o prato — a IA sugere ingredientes, preparo e macros pela TACO.";

        document.querySelectorAll<HTMLButtonElement>(".store-admin-row-actions .danger").forEach((button) => {
          if (button.textContent?.trim() === "Cancelar") button.textContent = "Excluir";
          button.setAttribute("aria-label", "Excluir reserva");
          button.title = "Excluir reserva";
        });
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    const confirmReservationDelete = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".store-admin-row-actions .danger");
      if (!target || target.textContent?.trim() !== "Excluir") return;
      if (!window.confirm("Excluir esta reserva? Esta ação não pode ser desfeita.")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener("click", confirmReservationDelete, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("click", confirmReservationDelete, true);
    };
  }, [active]);
}

function usePushPermissionBridge(active: boolean, userId: string) {
  useEffect(() => {
    if (!active || !userId) return;
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".profile-notification-permission");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      button.disabled = true;
      void registerAccquaPush(userId)
        .then((result) => {
          if (result.ok) {
            toast.success("Notificações ativadas neste aparelho.");
            button.textContent = "Notificações ativadas";
            return;
          }
          if (result.reason === "ios_install_required") {
            toast.info("No iPhone, instale o ACCQUA pela opção Compartilhar → Adicionar à Tela de Início e depois ative as notificações.", { duration: 7000 });
          } else if (result.reason === "permission_denied") {
            toast.warning("A permissão de notificações não foi concedida.");
          } else if (result.reason === "push_not_configured") {
            toast.error("O push ainda não está configurado para este ambiente.");
          } else {
            toast.warning("Este navegador não oferece notificações push para o ACCQUA.");
          }
          button.disabled = false;
        })
        .catch(() => {
          button.disabled = false;
          toast.error("Não foi possível ativar as notificações agora.");
        });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, userId]);
}

function usePendingApprovalNudge(active: boolean, userId: string) {
  const warnedRef = useRef("");
  useEffect(() => {
    if (!active || !userId) return;
    let cancelled = false;
    const check = async () => {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("accqua_app_approval")
        .select("user_id,created_at")
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .limit(25);
      if (cancelled || error) return;
      const count = data?.length ?? 0;
      if (!count) return;
      const key = `${new Date().toISOString().slice(0, 10)}:${count}`;
      if (warnedRef.current === key || window.sessionStorage.getItem(`accqua:pending-approval-warning:${key}`)) return;
      warnedRef.current = key;
      window.sessionStorage.setItem(`accqua:pending-approval-warning:${key}`, "1");
      toast.warning(`${count} cadastro${count === 1 ? "" : "s"} aguardando liberação há mais de 2 horas.`, { duration: 6500 });
    };

    void check();
    const timer = window.setInterval(() => void check(), 5 * 60_000);
    const channel = supabase
      .channel(`pending-approval-nudge-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "accqua_app_approval" }, () => void check())
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [active, userId]);
}

export default function Build171Runtime() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const builderActive = location.pathname.includes("/area-accqua/montar/editor");
  const storeActive = location.pathname.includes("/area-accqua/loja");
  const profileActive = location.pathname === "/perfil";
  const isStaff = Boolean(profile && ["professor", "admin", "reception"].includes(profile.role));

  useBuilderCopyFix(builderActive);
  useStorePolish(storeActive);
  usePushPermissionBridge(profileActive, user?.id ?? "");
  usePendingApprovalNudge(isStaff, user?.id ?? "");

  return null;
}
