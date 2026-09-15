import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const JSON_HEADERS = { "Content-Type": "application/json" };
const TIME_ZONE = "America/Sao_Paulo";
const STAFF_ROLES = new Set(["professor", "admin", "reception", "recepcao"]);

type Category = "alimentacao" | "hidratacao" | "treino";
type Config = {
  category: Category;
  icon: string;
  url: string;
  preferenceColumn: "meal_reminders" | "hydration_reminders" | "training_reminders";
  times: readonly string[];
  messages: readonly string[];
};

const CONFIGS: readonly Config[] = [
  {
    category: "alimentacao",
    icon: "/notification-icons/alimentacao.svg",
    url: "/dieta#registro-rapido",
    preferenceColumn: "meal_reminders",
    times: ["08:00", "11:00", "14:00", "17:00", "20:00"],
    messages: [
      "Já comeu ou tá esperando motivação divina?",
      "Sua próxima refeição não vai se registrar sozinha",
      "Bora colocar o prato na história hoje?",
      "3 horas se passaram e você sumiu do controle de refeições",
      "Seu corpo tá pedindo combustível, não seu feed",
      "Registrar a refeição leva 10 segundos, sumir do plano leva semanas",
      "Já é hora de comer de novo. Bora registrar?",
      "Sua meta calórica tá te esperando desde a última refeição",
    ],
  },
  {
    category: "hidratacao",
    icon: "/notification-icons/hidratacao.svg",
    url: "/dieta#hidratacao",
    preferenceColumn: "hydration_reminders",
    times: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
    messages: [
      "Sua garrafa de água tá se sentindo abandonada",
      "2 horas sem beber água. Seu corpo tá desidratando de tristeza",
      "Um golinho agora, um favor pro seu corpo depois",
      "Cadê aquele copo d'água que você prometeu tomar?",
      "Sua meta de hidratação hoje ainda tá bem sedenta",
      "Beber água não é só quando você lembra",
      "Passou 2 horas. Já tomou água ou só pensou em tomar?",
      "Seu corpo é 70% água e 30% desculpa pra não beber mais",
    ],
  },
  {
    category: "treino",
    icon: "/notification-icons/treino.svg",
    url: "/treino",
    preferenceColumn: "training_reminders",
    times: ["10:00", "15:30"],
    messages: [
      "Vai treinar nunca?",
      "A academia tá mais vazia agora. Sem desculpa de fila",
      "Seu treino de hoje ainda nem começou e o dia já tá passando",
      "Bora treinar antes que vire amanhã de novo?",
      "Seu treino te chamou e você nem respondeu",
      "Esse é o horário mais tranquilo do dia pra treinar. Bora?",
      "A ficha tá pronta. Só falta você aparecer",
      "Cadê você? O treino de hoje sentiu sua falta",
    ],
  },
] as const;

const text = (value: unknown) => String(value ?? "").trim();

function zonedNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  return { dateKey, hour, minute, totalMinutes: hour * 60 + minute };
}

function dueSlot(config: Config, now = zonedNow()) {
  let selected = "";
  let selectedDelta = Number.POSITIVE_INFINITY;
  for (const time of config.times) {
    const [hour, minute] = time.split(":").map(Number);
    const delta = now.totalMinutes - (hour * 60 + minute);
    if (delta >= 0 && delta < 15 && delta < selectedDelta) {
      selected = time;
      selectedDelta = delta;
    }
  }
  return selected ? `${now.dateKey}T${selected}` : "";
}

function chooseMessageIndex(messageCount: number, previousIndex: number | undefined, seed: string) {
  if (messageCount <= 1) return 0;
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  let index = Math.abs(hash) % messageCount;
  if (index === previousIndex) index = (index + 1) % messageCount;
  return index;
}

async function runInChunks<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.allSettled(items.slice(index, index + size).map(task));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: JSON_HEADERS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: JSON_HEADERS });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !service) return new Response(JSON.stringify({ error: "server_config_missing" }), { status: 500, headers: JSON_HEADERS });

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: cronConfig, error: cronConfigError } = await admin
    .from("accqua_motivational_cron_config")
    .select("cron_token")
    .eq("id", true)
    .maybeSingle();
  if (cronConfigError || !cronConfig?.cron_token || req.headers.get("x-accqua-cron-token") !== cronConfig.cron_token) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const now = zonedNow();
    const dueConfigs = CONFIGS.map((config) => ({ config, slotKey: dueSlot(config, now) })).filter((item) => item.slotKey);
    if (!dueConfigs.length) return new Response(JSON.stringify({ ok: true, due: [], sent: 0 }), { headers: JSON_HEADERS });

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id,role,status,notificacoes_ativas")
      .eq("status", "active");
    if (profilesError) throw profilesError;

    const students = (profiles ?? []).filter((row: any) => !STAFF_ROLES.has(text(row.role).toLowerCase()) && row.notificacoes_ativas !== false);
    const studentIds = students.map((row: any) => text(row.id)).filter(Boolean);
    if (!studentIds.length) return new Response(JSON.stringify({ ok: true, due: dueConfigs.map((item) => item.config.category), sent: 0 }), { headers: JSON_HEADERS });

    const [{ data: preferences, error: preferencesError }, { data: logs, error: logsError }, { data: subscriptions, error: subscriptionsError }, { data: vapidRows, error: vapidError }] = await Promise.all([
      admin.from("accqua_profile_preferences").select("user_id,meal_reminders,hydration_reminders,training_reminders").in("user_id", studentIds),
      admin.from("accqua_motivational_notification_log").select("user_id,category,slot_key,message_index,sent_at").in("user_id", studentIds).order("sent_at", { ascending: false }).limit(10000),
      admin.from("push_subscriptions").select("id,aluno_id,endpoint,p256dh,auth_key").in("aluno_id", studentIds),
      admin.rpc("get_push_vapid_config_v1_5_3"),
    ]);
    if (preferencesError) throw preferencesError;
    if (logsError) throw logsError;
    if (subscriptionsError) throw subscriptionsError;

    const preferenceMap = new Map((preferences ?? []).map((row: any) => [text(row.user_id), row]));
    const latestMessage = new Map<string, number>();
    const sentSlots = new Set<string>();
    for (const row of logs ?? []) {
      const key = `${text((row as any).user_id)}|${text((row as any).category)}`;
      if (!latestMessage.has(key)) latestMessage.set(key, Number((row as any).message_index));
      sentSlots.add(`${key}|${text((row as any).slot_key)}`);
    }

    const subscriptionMap = new Map<string, any[]>();
    for (const sub of subscriptions ?? []) {
      const id = text((sub as any).aluno_id);
      subscriptionMap.set(id, [...(subscriptionMap.get(id) ?? []), sub]);
    }

    const vapid = Array.isArray(vapidRows) ? vapidRows[0] : vapidRows;
    const pushReady = !vapidError && vapid?.public_key && vapid?.private_key;
    if (pushReady) webpush.setVapidDetails("mailto:contato@accquasports.com.br", vapid.public_key, vapid.private_key);

    const candidates: Array<{ userId: string; config: Config; slotKey: string }> = [];
    for (const userId of studentIds) {
      const prefs: any = preferenceMap.get(userId) ?? {};
      for (const due of dueConfigs) {
        if (prefs[due.config.preferenceColumn] === false) continue;
        const slotIdentity = `${userId}|${due.config.category}|${due.slotKey}`;
        if (!sentSlots.has(slotIdentity)) candidates.push({ userId, config: due.config, slotKey: due.slotKey });
      }
    }

    let sent = 0;
    let pushDelivered = 0;
    let pushFailed = 0;

    await runInChunks(candidates, 20, async ({ userId, config, slotKey }) => {
      const previousIndex = latestMessage.get(`${userId}|${config.category}`);
      const messageIndex = chooseMessageIndex(config.messages.length, previousIndex, `${userId}|${config.category}|${slotKey}`);
      const body = config.messages[messageIndex];

      const { data: logRow, error: logInsertError } = await admin
        .from("accqua_motivational_notification_log")
        .insert({ user_id: userId, category: config.category, slot_key: slotKey, message_index: messageIndex })
        .select("id")
        .single();
      if (logInsertError || !logRow) return;

      const { data: notification, error: notificationError } = await admin
        .from("notifications")
        .insert({ user_id: userId, title: "Accqua Sports", body, url: config.url, category: config.category, lida: false })
        .select("id")
        .single();
      if (notificationError || !notification) {
        await admin.from("accqua_motivational_notification_log").delete().eq("id", logRow.id);
        return;
      }

      let deliveredForUser = 0;
      let failedForUser = 0;
      if (pushReady) {
        const payload = JSON.stringify({
          title: "Accqua Sports",
          body,
          icon: config.icon,
          badge: "/logo/logo_app_4k.png",
          data: { categoria: config.category, url: config.url, notificationId: notification.id },
        });
        await Promise.allSettled((subscriptionMap.get(userId) ?? []).map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
              payload,
              { TTL: 3600 },
            );
            deliveredForUser += 1;
          } catch (error: any) {
            failedForUser += 1;
            const status = Number(error?.statusCode ?? error?.status ?? 0);
            if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }));
      }

      await admin.from("accqua_motivational_notification_log").update({
        notification_id: notification.id,
        push_delivered: deliveredForUser,
        push_failed: failedForUser,
      }).eq("id", logRow.id);

      latestMessage.set(`${userId}|${config.category}`, messageIndex);
      sent += 1;
      pushDelivered += deliveredForUser;
      pushFailed += failedForUser;
    });

    return new Response(JSON.stringify({
      ok: true,
      due: dueConfigs.map((item) => item.config.category),
      candidates: candidates.length,
      sent,
      pushDelivered,
      pushFailed,
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error("enviar-notificacoes-motivacionais", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "motivational_send_failed" }), { status: 500, headers: JSON_HEADERS });
  }
});
