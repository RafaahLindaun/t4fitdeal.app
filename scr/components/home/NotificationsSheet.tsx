import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResponsiveDialog from "../ResponsiveDialog";
import SwipeableListItem from "../SwipeableListItem";
import type { WorkoutRequiredAlert } from "../../lib/admin";
import {
  deleteAccquaNotificationForMe,
  loadAccquaNotifications,
  markAccquaNotificationRead,
  markAllAccquaNotificationsRead,
  type NotificationIcon,
} from "../../lib/notifications";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function NotificationGlyph({ icon }: { icon: NotificationIcon }) {
  if (icon === "treino") return <span aria-hidden="true">🏋️</span>;
  if (icon === "pagamento") return <span aria-hidden="true">💳</span>;
  if (icon === "presente") return <span aria-hidden="true">🎁</span>;
  if (icon === "alerta") return <span aria-hidden="true">⚠️</span>;
  if (icon === "conquista") return <span aria-hidden="true">🏆</span>;
  return <span aria-hidden="true">📣</span>;
}

type Props = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffAlerts: WorkoutRequiredAlert[];
  onStaffAlertClick: (alert: WorkoutRequiredAlert) => Promise<void> | void;
};

export default function NotificationsSheet({
  userId,
  open,
  onOpenChange,
  staffAlerts,
  onStaffAlertClick,
}: Props) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState("");

  const notificationsQuery = useQuery({
    queryKey: ["accqua-notifications", userId],
    queryFn: () => loadAccquaNotifications(userId),
    enabled: open && Boolean(userId),
    staleTime: 10_000,
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const totalCount = notifications.length + staffAlerts.length;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["accqua-notifications", userId] }),
      queryClient.invalidateQueries({ queryKey: ["unread-notifications", userId] }),
    ]);
  };

  const openNotification = async (receiptId: string, read: boolean) => {
    setExpandedId((current) => current === receiptId ? "" : receiptId);
    if (!read && await markAccquaNotificationRead(receiptId)) await invalidate();
  };

  const removeNotification = async (receiptId: string) => {
    if (await deleteAccquaNotificationForMe(receiptId)) {
      if (expandedId === receiptId) setExpandedId("");
      await invalidate();
    }
  };

  const markAll = async () => {
    if (!unreadCount) return;
    if (await markAllAccquaNotificationsRead(userId)) await invalidate();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Notificações"
      description="Avisos do seu app ACCQUA e atualizações importantes."
      className="accqua-notifications-dialog"
      bodyClassName="accqua-notifications-sheet"
    >
      <div className="accqua-notifications-toolbar">
        <small>{totalCount ? `${totalCount} ${totalCount === 1 ? "aviso" : "avisos"}` : "Tudo em dia"}</small>
        {unreadCount ? <button type="button" onClick={() => void markAll()}>Marcar todas como lidas</button> : null}
      </div>

      {notificationsQuery.isLoading ? (
        <div className="accqua-notifications-empty"><strong>Carregando notificações...</strong></div>
      ) : totalCount ? (
        <div className="accqua-notifications-list">
          <AnimatePresence initial={false} mode="popLayout">
            {staffAlerts.map((alert) => (
              <motion.button
                layout
                key={`staff-${alert.id}`}
                type="button"
                className="accqua-notification-row is-unread"
                initial={{ opacity: 0, x: 12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 38, scale: 0.96 }}
                transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
                onClick={() => void onStaffAlertClick(alert)}
              >
                <span className="accqua-notification-icon is-alert" aria-hidden="true">⚠️</span>
                <span>
                  <strong>{alert.title || "Aluno precisa de atenção"}</strong>
                  <p>{alert.message || `${alert.studentName} precisa de uma ação da equipe.`}</p>
                </span>
                <time>{formatNotificationTime(alert.deliveredAt || alert.createdAt)}</time>
              </motion.button>
            ))}
          </AnimatePresence>

          {notifications.map((notification) => {
            const expanded = expandedId === notification.receiptId;
            return (
              <SwipeableListItem
                key={notification.receiptId}
                onDelete={() => void removeNotification(notification.receiptId)}
                deleteLabel="Excluir notificação"
              >
                <button
                  type="button"
                  className={`accqua-notification-row ${notification.read ? "" : "is-unread"} ${expanded ? "is-expanded" : ""}`.trim()}
                  aria-expanded={expanded}
                  onClick={() => void openNotification(notification.receiptId, notification.read)}
                >
                  <span className={`accqua-notification-icon is-${notification.icon}`}><NotificationGlyph icon={notification.icon} /></span>
                  <span><strong>{notification.title}</strong><p>{notification.body || "Toque para marcar como lida."}</p></span>
                  <time>{formatNotificationTime(notification.createdAt)}</time>
                </button>
              </SwipeableListItem>
            );
          })}
        </div>
      ) : (
        <div className="accqua-notifications-empty">
          <strong>Nenhuma notificação nova</strong>
          <span>Quando algo importante acontecer, aparece aqui.</span>
        </div>
      )}
    </ResponsiveDialog>
  );
}
