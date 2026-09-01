import { supabase } from "./supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export type PushEnableResult = { ok: true } | { ok: false; reason: "unsupported" | "ios_install_required" | "permission_denied" | "config_missing" | "subscribe_failed" };

export function webPushEnvironment() {
  return {
    supported: "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,
    ios: isIos(),
    standalone: isStandalone(),
  };
}

export async function loadNotificationsActive() {
  const { data, error } = await supabase.rpc("get_my_notifications_active_v1_5_3");
  if (error) return true;
  return data !== false;
}

export async function setNotificationsActive(enabled: boolean) {
  const { error } = await supabase.rpc("set_my_notifications_active_v1_5_3", { p_enabled: enabled });
  if (error) throw error;
}

export async function enableWebPush(userId: string): Promise<PushEnableResult> {
  const env = webPushEnvironment();
  if (!env.supported) return { ok:false, reason:"unsupported" };
  if (env.ios && !env.standalone) return { ok:false, reason:"ios_install_required" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { ok:false, reason:"permission_denied" };

  try {
    const registration = await navigator.serviceWorker.register("/accqua-notifications-sw.js");
    await navigator.serviceWorker.ready;
    const config = await supabase.functions.invoke("push-config", { body:{} });
    const publicKey = String(config.data?.publicKey ?? "").trim();
    if (config.error || !publicKey) return { ok:false, reason:"config_missing" };

    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(publicKey),
    });
    const json = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = String(json.keys?.p256dh ?? "");
    const authKey = String(json.keys?.auth ?? "");
    if (!endpoint || !p256dh || !authKey) return { ok:false, reason:"subscribe_failed" };

    const { error } = await supabase.from("push_subscriptions").upsert({
      aluno_id:userId,
      endpoint,
      p256dh,
      auth_key:authKey,
      atualizado_em:new Date().toISOString(),
    }, { onConflict:"aluno_id,endpoint" });
    if (error) throw error;
    return { ok:true };
  } catch (error) {
    console.warn("enableWebPush", error);
    return { ok:false, reason:"subscribe_failed" };
  }
}

export async function disableWebPush(userId: string) {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration("/accqua-notifications-sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("aluno_id", userId).eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      } else {
        await supabase.from("push_subscriptions").delete().eq("aluno_id", userId);
      }
    }
  } catch (error) {
    console.warn("disableWebPush", error);
  }
}
