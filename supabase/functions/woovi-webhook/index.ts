// ACCQUA Sports — Build 1.5.2
// Webhook público da Woovi. Não usa JWT porque a origem é externa; valida assinatura antes de tocar no banco.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUBLIC_KEYS_URL = "https://api.woovi.com/api/v1/webhook/public-keys";
const KEY_CACHE_MS = 60 * 60 * 1000;
let keyCache: { keys: string[]; expiresAt: number } | null = null;

function response(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function base64Bytes(value: string) {
  const binary = atob(value.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function pemToDer(pem: string) {
  return base64Bytes(
    pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, ""),
  );
}

async function getPublicKeys() {
  if (keyCache && keyCache.expiresAt > Date.now()) return keyCache.keys;

  try {
    const res = await fetch(PUBLIC_KEYS_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`public_keys_${res.status}`);
    const payload = await res.json();
    const keys = Array.isArray(payload?.public_keys)
      ? payload.public_keys.map((item: { key?: unknown }) => String(item?.key ?? "").trim()).filter(Boolean)
      : [];
    if (!keys.length) throw new Error("public_keys_empty");
    keyCache = { keys, expiresAt: Date.now() + KEY_CACHE_MS };
    return keys;
  } catch (error) {
    // Durante uma indisponibilidade temporária, a própria Woovi recomenda continuar usando a chave em cache.
    if (keyCache?.keys.length) return keyCache.keys;
    throw error;
  }
}

async function verifyWooviSignature(rawBody: string, signatureBase64: string) {
  if (!signatureBase64) return false;
  const signature = base64Bytes(signatureBase64);
  const payload = new TextEncoder().encode(rawBody);
  const publicKeys = await getPublicKeys();

  for (const pem of publicKeys) {
    try {
      const key = await crypto.subtle.importKey(
        "spki",
        pemToDer(pem),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      );
      const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, payload);
      if (valid) return true;
    } catch {
      // Tenta a próxima chave para suportar rotação da Woovi.
    }
  }

  return false;
}

async function verifyOptionalHmac(rawBody: string, signatureBase64: string | null, secret: string) {
  if (!signatureBase64) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64Bytes(signatureBase64),
    new TextEncoder().encode(rawBody),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response("method not allowed", 405);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") ?? "";
    if (!(await verifyWooviSignature(rawBody, signature))) {
      return response("assinatura inválida", 401);
    }

    // HMAC é legado/depreciado na Woovi, mas continua disponível como segunda camada quando configurado.
    const hmacSecret = Deno.env.get("WOOVI_WEBHOOK_SECRET")?.trim() ?? "";
    if (hmacSecret) {
      const hmacSignature = req.headers.get("x-openpix-signature");
      if (!(await verifyOptionalHmac(rawBody, hmacSignature, hmacSecret))) {
        return response("hmac inválido", 401);
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = String(event?.event ?? "");
    const correlationId = String(event?.charge?.correlationID ?? "").trim();
    if (!correlationId) return response("ok", 200);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (
      eventName === "OPENPIX:CHARGE_COMPLETED" ||
      eventName === "OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER"
    ) {
      const paidAt = String(event?.charge?.paidAt ?? event?.pix?.time ?? new Date().toISOString());
      const completed = await admin.rpc("complete_pix_payment_v1_5_2", {
        p_correlation_id: correlationId,
        p_paid_at: paidAt,
      });
      if (completed.error) throw completed.error;
    } else if (eventName === "OPENPIX:CHARGE_EXPIRED") {
      const expired = await admin.rpc("expire_pix_payment_v1_5_2", {
        p_correlation_id: correlationId,
      });
      if (expired.error) throw expired.error;
    }

    return response("ok", 200);
  } catch (error) {
    console.error("woovi-webhook", error instanceof Error ? error.message : String(error));
    return response("internal error", 500);
  }
});
