import { isSupabaseConfigured, supabase } from "./supabase";
import type { NotificationIconId } from "../components/NotificationIcon";

export type AccquaNotification = {
  id: string;
  readingId: string;
  title: string;
  body: string;
  icon: NotificationIconId;
  read: boolean;
  createdAt: string;
  source: "broadcast" | "legacy";
};

function normalizeLegacy(raw: Record<string, unknown>): AccquaNotification {
  return {
    id: String(raw.id ?? ""),
    readingId: "",
    title: String(raw.title ?? "Notificação ACCQUA"),
    body: String(raw.body ?? ""),
    icon: "megafone",
    read: Boolean(raw.lida),
    createdAt: String(raw.created_at ?? ""),
    source: "legacy",
  };
}

export async function loadAccquaNotifications(userId: string): Promise<AccquaNotification[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const broadcast = await supabase
    .from("notificacoes_leitura")
    .select("id,lida,excluida,notificacao:notificacoes(id,titulo,mensagem,icone,enviado_em,ativo)")
    .eq("aluno_id", userId)
    .eq("excluida", false)
    .order("id", { ascending: false })
    .limit(80);

  const broadcastRows: AccquaNotification[] = broadcast.error ? [] : (broadcast.data ?? []).flatMap((raw: any) => {
    const notification = Array.isArray(raw.notificacao) ? raw.notificacao[0] : raw.notificacao;
    if (!notification || notification.ativo === false) return [];
    return [{
      id:String(notification.id ?? ""),
      readingId:String(raw.id ?? ""),
      title:String(notification.titulo ?? "Notificação ACCQUA"),
      body:String(notification.mensagem ?? ""),
      icon:(String(notification.icone ?? "megafone") || "megafone") as NotificationIconId,
      read:Boolean(raw.lida),
      createdAt:String(notification.enviado_em ?? ""),
      source:"broadcast" as const,
    }];
  });

  const legacy = await supabase
    .from("notifications")
    .select("id,title,body,lida,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  const legacyRows = legacy.error ? [] : (legacy.data ?? []).map((row) => normalizeLegacy(row as Record<string, unknown>));

  return [...broadcastRows, ...legacyRows]
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
}

export async function markAccquaNotificationRead(notification: Pick<AccquaNotification,"id"|"readingId"|"source">) {
  if (!isSupabaseConfigured || !notification.id) return false;
  if (notification.source === "broadcast" && notification.readingId) {
    const { error } = await supabase.from("notificacoes_leitura").update({ lida:true, lida_em:new Date().toISOString() }).eq("id", notification.readingId);
    return !error;
  }
  const { error } = await supabase.from("notifications").update({ lida:true }).eq("id", notification.id);
  return !error;
}

export async function markAllAccquaNotificationsRead(userId: string) {
  if (!isSupabaseConfigured || !userId) return false;
  const now = new Date().toISOString();
  const [broadcast, legacy] = await Promise.all([
    supabase.from("notificacoes_leitura").update({ lida:true, lida_em:now }).eq("aluno_id",userId).eq("excluida",false).eq("lida",false),
    supabase.from("notifications").update({ lida:true }).eq("user_id",userId).eq("lida",false),
  ]);
  return !broadcast.error || !legacy.error;
}

export async function deleteAccquaNotification(notification: Pick<AccquaNotification,"id"|"readingId"|"source">) {
  if (notification.source !== "broadcast" || !notification.readingId) return false;
  const { error } = await supabase.from("notificacoes_leitura").update({ excluida:true, excluida_em:new Date().toISOString() }).eq("id",notification.readingId);
  return !error;
}
