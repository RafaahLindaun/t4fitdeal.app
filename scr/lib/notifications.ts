import { isSupabaseConfigured, supabase } from "./supabase";

export type NotificationIcon =
  | "megafone"
  | "treino"
  | "pagamento"
  | "presente"
  | "alerta"
  | "conquista";

export type NotificationAudience = "todos" | "matriculados" | "gympass" | "totalpass";

export type AccquaNotification = {
  id: string;
  receiptId: string;
  title: string;
  body: string;
  icon: NotificationIcon;
  read: boolean;
  createdAt: string;
};

export type StaffNotificationInput = {
  title: string;
  body: string;
  icon: NotificationIcon;
  audience: NotificationAudience;
};

export type StaffNotificationResult = {
  notificationId: string;
  recipients: number;
  pushDelivered: number;
  pushFailed: number;
};

type Row = Record<string, unknown>;
const t = (value: unknown) => String(value ?? "").trim();

function icon(value: unknown): NotificationIcon {
  const normalized = t(value) as NotificationIcon;
  return ["megafone", "treino", "pagamento", "presente", "alerta", "conquista"].includes(normalized)
    ? normalized
    : "megafone";
}

function normalizeLegacyNotification(raw: Row): AccquaNotification {
  return {
    id: t(raw.id),
    receiptId: t(raw.id),
    title: t(raw.title) || "Notificação ACCQUA",
    body: t(raw.body),
    icon: "megafone",
    read: Boolean(raw.lida),
    createdAt: t(raw.created_at),
  };
}

export async function loadAccquaNotifications(userId: string): Promise<AccquaNotification[]> {
  if (!isSupabaseConfigured || !userId) return [];

  const receipts = await supabase
    .from("notificacoes_leitura")
    .select("id,notificacao_id,lida,lida_em,excluida")
    .eq("aluno_id", userId)
    .eq("excluida", false)
    .order("id", { ascending: false })
    .limit(80);

  if (!receipts.error && receipts.data?.length) {
    const rows = receipts.data as Row[];
    const notificationIds = [...new Set(rows.map((row) => t(row.notificacao_id)).filter(Boolean))];
    const notices = notificationIds.length
      ? await supabase
          .from("notificacoes")
          .select("id,titulo,mensagem,icone,enviado_em,ativo")
          .in("id", notificationIds)
          .eq("ativo", true)
      : { data: [], error: null };

    if (!notices.error) {
      const noticeMap = new Map(
        ((notices.data ?? []) as Row[]).map((row) => [t(row.id), row]),
      );
      return rows
        .map((receipt) => {
          const notice = noticeMap.get(t(receipt.notificacao_id));
          if (!notice) return null;
          return {
            id: t(notice.id),
            receiptId: t(receipt.id),
            title: t(notice.titulo) || "Notificação ACCQUA",
            body: t(notice.mensagem),
            icon: icon(notice.icone),
            read: Boolean(receipt.lida),
            createdAt: t(notice.enviado_em),
          } satisfies AccquaNotification;
        })
        .filter((value): value is AccquaNotification => Boolean(value))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }

  // Compatibilidade com avisos antigos criados antes da central 1.5.3.
  const legacy = await supabase
    .from("notifications")
    .select("id,title,body,lida,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (legacy.error) return [];
  return (legacy.data ?? []).map((row) => normalizeLegacyNotification(row as Row));
}

export async function loadUnreadNotificationCountV153(userId: string) {
  if (!isSupabaseConfigured || !userId) return 0;
  const { count, error } = await supabase
    .from("notificacoes_leitura")
    .select("id", { count: "exact", head: true })
    .eq("aluno_id", userId)
    .eq("lida", false)
    .eq("excluida", false);
  if (!error) return Math.max(0, Number(count ?? 0));
  return 0;
}

export async function markAccquaNotificationRead(receiptId: string) {
  if (!isSupabaseConfigured || !receiptId) return false;
  const now = new Date().toISOString();
  const current = await supabase
    .from("notificacoes_leitura")
    .update({ lida: true, lida_em: now })
    .eq("id", receiptId)
    .select("id")
    .maybeSingle();
  if (!current.error && current.data) return true;

  const legacy = await supabase.from("notifications").update({ lida: true }).eq("id", receiptId);
  return !legacy.error;
}

export async function markAllAccquaNotificationsRead(userId: string) {
  if (!isSupabaseConfigured || !userId) return false;
  const now = new Date().toISOString();
  const current = await supabase
    .from("notificacoes_leitura")
    .update({ lida: true, lida_em: now })
    .eq("aluno_id", userId)
    .eq("lida", false)
    .eq("excluida", false);

  const legacy = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("user_id", userId)
    .eq("lida", false);
  return !current.error || !legacy.error;
}

export async function deleteAccquaNotificationForMe(receiptId: string) {
  if (!isSupabaseConfigured || !receiptId) return false;
  const { error } = await supabase
    .from("notificacoes_leitura")
    .update({ excluida: true, excluida_em: new Date().toISOString() })
    .eq("id", receiptId);
  return !error;
}

export async function sendStaffNotification(input: StaffNotificationInput): Promise<StaffNotificationResult> {
  const { data, error } = await supabase.functions.invoke("send-staff-notification", {
    body: {
      titulo: input.title.trim(),
      mensagem: input.body.trim(),
      icone: input.icon,
      publicoAlvo: input.audience,
    },
  });
  if (error) throw error;
  return {
    notificationId: t(data?.notificacaoId),
    recipients: Math.max(0, Number(data?.enviados ?? 0)),
    pushDelivered: Math.max(0, Number(data?.pushEntregues ?? 0)),
    pushFailed: Math.max(0, Number(data?.pushFalhos ?? 0)),
  };
}

export async function getMyNotificationsEnabled() {
  const { data, error } = await supabase.rpc("get_my_notifications_active_v1_5_3");
  if (error) return true;
  return Boolean(data);
}

export async function setMyNotificationsEnabled(enabled: boolean) {
  const { data, error } = await supabase.rpc("set_my_notifications_active_v1_5_3", {
    p_enabled: enabled,
  });
  if (error) throw error;
  return Boolean(data);
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function isIosBrowser() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export async function registerAccquaPush(userId: string) {
  if (!userId || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { ok: false as const, reason: "unsupported" as const };
  }
  if (isIosBrowser() && !isStandaloneApp()) {
    return { ok: false as const, reason: "ios_install_required" as const };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false as const, reason: "permission_denied" as const };

  const registration = await navigator.serviceWorker.register("/accqua-notifications-sw.js");
  const existing = await registration.pushManager.getSubscription();
  let subscription = existing;
  if (!subscription) {
    const config = await supabase.functions.invoke("push-config", { body: {} });
    if (config.error || !config.data?.publicKey) return { ok: false as const, reason: "push_not_configured" as const };
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(t(config.data.publicKey)),
    });
  }

  const json = subscription.toJSON();
  const endpoint = t(json.endpoint);
  const p256dh = t(json.keys?.p256dh);
  const authKey = t(json.keys?.auth);
  if (!endpoint || !p256dh || !authKey) return { ok: false as const, reason: "subscription_invalid" as const };

  const { error } = await supabase.from("push_subscriptions").upsert(
    { aluno_id: userId, endpoint, p256dh, auth_key: authKey, atualizado_em: new Date().toISOString() },
    { onConflict: "aluno_id,endpoint" },
  );
  if (error) throw error;
  return { ok: true as const, reason: "subscribed" as const };
}
