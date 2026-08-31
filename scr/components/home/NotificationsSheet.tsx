import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResponsiveDialog from "../ResponsiveDialog";
import type { WorkoutRequiredAlert } from "../../lib/admin";
import {
  loadAccquaNotifications,
  markAccquaNotificationRead,
  markAllAccquaNotificationsRead,
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

  const openNotification = async (id: string, read: boolean) => {
    setExpandedId((current) => current === id ? "" : id);
    if (!read && await markAccquaNotificationRead(id)) await invalidate();
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
        {unreadCount ? (
          <button type="button" onClick={() => void markAll()}>Marcar todas como lidas</button>
        ) : null}
      </div>

      {notificationsQuery.isLoading ? (
        <div className="accqua-notifications-empty">
          <strong>Carregando notificações...</strong>
        </div>
      ) : totalCount ? (
        <div className="accqua-notifications-list">
          {staffAlerts.map((alert) => (
            <button
              key={`staff-${alert.id}`}
              type="button"
              className="accqua-notification-row is-unread"
              onClick={() => void onStaffAlertClick(alert)}
            >
              <i aria-hidden="true" />
              <span>
                <strong>{alert.title || "Aluno precisa de atenção"}</strong>
                <p>{alert.message || `${alert.studentName} precisa de uma ação da equipe.`}</p>
              </span>
              <time>{formatNotificationTime(alert.deliveredAt || alert.createdAt)}</time>
            </button>
          ))}

          {notifications.map((notification) => {
            const expanded = expandedId === notification.id;
            return (
              <button
                key={notification.id}
                type="button"
                className={`accqua-notification-row ${notification.read ? "" : "is-unread"} ${expanded ? "is-expanded" : ""}`.trim()}
                aria-expanded={expanded}
                onClick={() => void openNotification(notification.id, notification.read)}
              >
                <i aria-hidden="true" />
                <span>
                  <strong>{notification.title}</strong>
                  <p>{notification.body || "Toque para marcar como lida."}</p>
                </span>
                <time>{formatNotificationTime(notification.createdAt)}</time>
              </button>
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
