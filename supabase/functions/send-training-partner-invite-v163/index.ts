import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const text = (value: unknown) => String(value ?? "").trim();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anon || !service) return json({ ok: false, message: "Serviço indisponível." }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    const auth = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return json({ ok: false, message: "Sessão necessária." }, 401);

    const body = await req.json().catch(() => ({}));
    const partnerId = text(body?.partnerId);
    if (!/^[0-9a-f-]{36}$/i.test(partnerId) || partnerId === authData.user.id) {
      return json({ ok: false, message: "Aluno inválido." }, 400);
    }

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: rpcRows, error: rpcError } = await auth.rpc("create_accqua_training_partner_invite_v1_6_3", {
      p_partner_id: partnerId,
    });
    if (rpcError) throw rpcError;
    const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    const notificationId = text(result?.notification_id);

    let pushDelivered = 0;
    const [{ data: subscriptions }, { data: vapidRows, error: vapidError }] = await Promise.all([
      admin.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq("aluno_id", partnerId),
      admin.rpc("get_push_vapid_config_v1_5_3"),
    ]);
    const vapid = Array.isArray(vapidRows) ? vapidRows[0] : vapidRows;
    if (!vapidError && vapid?.public_key && vapid?.private_key && subscriptions?.length) {
      webpush.setVapidDetails("mailto:contato@accquasports.com.br", vapid.public_key, vapid.private_key);
      const { data: sender } = await admin.from("profiles").select("full_name,nome").eq("id", authData.user.id).maybeSingle();
      const senderName = text(sender?.full_name || sender?.nome || "Um aluno").split(/\s+/)[0] || "Um aluno";
      const payload = JSON.stringify({
        title: "Chamada pra treinar 💪",
        body: `${senderName} te chamou pra treinar junto. Bora?`,
        icon: "/logo/logo_app_4k.png",
        badge: "/logo/logo_app_4k.png",
        data: { url: "/perfil#profile-training-partners", notificationId, icon: "treino" },
      });
      await Promise.allSettled(subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload,
            { TTL: 3600 },
          );
          pushDelivered += 1;
        } catch (error: any) {
          const status = Number(error?.statusCode ?? error?.status ?? 0);
          if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }));
    }

    return json({ ok: true, notificationId, pushDelivered });
  } catch (error) {
    console.error("send-training-partner-invite-v163", error instanceof Error ? error.message : String(error));
    return json({ ok: false, message: "Não foi possível enviar a chamada agora." }, 500);
  }
});
