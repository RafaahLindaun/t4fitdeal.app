import { isSupabaseConfigured, supabase } from "./supabase";

export type AccquaNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

function normalizeNotification(raw: Record<string, unknown>): AccquaNotification {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "Notificação ACCQUA"),
    body: String(raw.body ?? ""),
    read: Boolean(raw.lida),
    createdAt: String(raw.created_at ?? ""),
  };
}

export async function loadAccquaNotifications(userId: string): Promise<AccquaNotification[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const response = await supabase
    .from("notifications")
    .select("id,title,body,lida,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (response.error) return [];
  return (response.data ?? []).map((row) => normalizeNotification(row as Record<string, unknown>));
}

export async function markAccquaNotificationRead(id: string) {
  if (!isSupabaseConfigured || !id) return false;
  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("id", id);
  return !error;
}

export async function markAllAccquaNotificationsRead(userId: string) {
  if (!isSupabaseConfigured || !userId) return false;
  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("user_id", userId)
    .eq("lida", false);
  return !error;
}
