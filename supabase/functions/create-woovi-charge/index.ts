// ACCQUA Sports — Build 1.5.2
// Cria cobrança Pix Woovi no servidor. WOOVI_APP_ID nunca é exposto ao client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WOOVI_CHARGE_URL = "https://api.woovi.com/api/v1/charge";
const EXPIRES_IN_SECONDS = 300;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let heldCorrelation = "";
  let admin: ReturnType<typeof createClient> | null = null;

  try {
    const wooviAppId = Deno.env.get("WOOVI_APP_ID")?.trim();
    if (!wooviAppId) return json({ error: "pix_provider_not_configured" }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = text(body?.productId);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      return json({ error: "invalid_product" }, 400);
    }

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Libera holds vencidos do próprio aluno antes de criar um novo.
    await admin.rpc("release_expired_pix_holds_v1_5_2", { p_aluno_id: authData.user.id });

    heldCorrelation = crypto.randomUUID();
    const provisionalExpiresAt = new Date(Date.now() + EXPIRES_IN_SECONDS * 1000).toISOString();
    const holdResponse = await admin.rpc("create_pix_payment_hold_v1_5_2", {
      p_produto_id: productId,
      p_aluno_id: authData.user.id,
      p_correlation_id: heldCorrelation,
      p_expira_em: provisionalExpiresAt,
    });

    if (holdResponse.error) {
      const message = holdResponse.error.message || "payment_hold_failed";
      if (/out_of_stock|sem estoque/i.test(message)) return json({ error: "product_out_of_stock" }, 409);
      if (/payment_already_pending/i.test(message)) return json({ error: "payment_already_pending" }, 409);
      throw holdResponse.error;
    }

    const hold = Array.isArray(holdResponse.data) ? holdResponse.data[0] : holdResponse.data;
    const amount = Number(hold?.amount ?? 0);
    const productName = text(hold?.product_name) || "Produto ACCQUA";
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid_payment_amount");

    const providerResponse = await fetch(WOOVI_CHARGE_URL, {
      method: "POST",
      headers: {
        Authorization: wooviAppId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        correlationID: heldCorrelation,
        value: Math.round(amount * 100),
        comment: productName.slice(0, 140),
        expiresIn: EXPIRES_IN_SECONDS,
        additionalInfo: [
          { key: "ACCQUA produto", value: productId },
          { key: "ACCQUA aluno", value: authData.user.id },
        ],
      }),
    });

    const providerPayload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) {
      console.error("create-woovi-charge provider error", providerResponse.status, providerPayload?.errors?.[0]?.message ?? "unknown");
      await admin.rpc("cancel_pix_payment_hold_v1_5_2", { p_correlation_id: heldCorrelation });
      heldCorrelation = "";
      return json({ error: "pix_provider_error" }, 502);
    }

    const charge = providerPayload?.charge ?? providerPayload ?? {};
    const providerCorrelation = text(charge?.correlationID ?? providerPayload?.correlationID ?? heldCorrelation);
    const brCode = text(charge?.brCode ?? providerPayload?.brCode);
    const qrCodeImageUrl = text(charge?.qrCodeImage);
    const transactionId = text(charge?.transactionID ?? charge?.identifier);
    const expiresAt = text(charge?.expiresDate) || provisionalExpiresAt;

    if (providerCorrelation !== heldCorrelation || !brCode || !qrCodeImageUrl) {
      await admin.rpc("cancel_pix_payment_hold_v1_5_2", { p_correlation_id: heldCorrelation });
      heldCorrelation = "";
      return json({ error: "invalid_pix_provider_response" }, 502);
    }

    const finalizeResponse = await admin.rpc("finalize_pix_payment_charge_v1_5_2", {
      p_correlation_id: heldCorrelation,
      p_transaction_id: transactionId,
      p_br_code: brCode,
      p_qr_code_image_url: qrCodeImageUrl,
      p_expira_em: expiresAt,
    });
    if (finalizeResponse.error) throw finalizeResponse.error;

    const paymentResponse = await admin
      .from("pagamentos")
      .select("*")
      .eq("correlation_id", heldCorrelation)
      .single();
    if (paymentResponse.error || !paymentResponse.data) throw paymentResponse.error ?? new Error("payment_not_found");

    heldCorrelation = "";
    return json({ payment: paymentResponse.data });
  } catch (error) {
    console.error("create-woovi-charge", error instanceof Error ? error.message : String(error));
    if (heldCorrelation && admin) {
      try {
        await admin.rpc("cancel_pix_payment_hold_v1_5_2", { p_correlation_id: heldCorrelation });
      } catch {
        console.error("create-woovi-charge: failed to release payment hold");
      }
    }
    return json({ error: "pix_payment_creation_failed" }, 500);
  }
});
