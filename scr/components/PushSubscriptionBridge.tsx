import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { disableWebPush, enableWebPush, setNotificationsActive, webPushEnvironment } from "../lib/pushNotifications";

/**
 * Bridge de compatibilidade 1.5.3: o toggle já existente "Novidades da ACCQUA"
 * continua sendo a ação explícita do aluno. O bridge nunca abre o prompt nativo
 * sozinho; ele só cria a PushSubscription depois que o próprio toggle já obteve
 * Notification.permission === "granted".
 */
export default function PushSubscriptionBridge() {
  const { user, profile } = useAuth();
  const lastState = useRef<boolean | null>(null);
  const iosHintShown = useRef(false);

  useEffect(() => {
    if (!user?.id || profile?.role !== "student") return;
    let alive = true;
    let running = false;

    const sync = async () => {
      if (!alive || running) return;
      running = true;
      try {
        const { data } = await supabase.from("accqua_profile_preferences").select("news_notifications").eq("user_id", user.id).maybeSingle();
        const enabled = Boolean(data?.news_notifications);
        if (lastState.current !== enabled) {
          await setNotificationsActive(enabled);
          if (!enabled) await disableWebPush(user.id);
          lastState.current = enabled;
        }
        if (!enabled) return;

        const env = webPushEnvironment();
        if (env.ios && !env.standalone) {
          if (!iosHintShown.current) {
            toast.info("No iPhone, instale o ACCQUA na Tela de Início para receber notificações com o app fechado.", { duration: 7000 });
            iosHintShown.current = true;
          }
          return;
        }
        if (env.supported && Notification.permission === "granted") await enableWebPush(user.id);
      } catch (error) {
        console.warn("push preference sync", error);
      } finally {
        running = false;
      }
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 1800);
    const onVisible = () => { if (document.visibilityState === "visible") void sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive=false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [profile?.role, user?.id]);

  return null;
}
