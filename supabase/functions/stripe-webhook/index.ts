import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

function unixToIso(ts?: number | null) {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function upsertSubscription(payload: {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  plan_key: string;
  status: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  raw?: unknown;
}) {
  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: payload.user_id,
      stripe_customer_id: payload.stripe_customer_id ?? null,
      stripe_subscription_id: payload.stripe_subscription_id ?? null,
      stripe_price_id: payload.stripe_price_id ?? null,
      plan_key: payload.plan_key,
      status: payload.status,
      current_period_end: payload.current_period_end ?? null,
      cancel_at_period_end: payload.cancel_at_period_end ?? false,
      raw: payload.raw ?? null,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) throw error;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!webhookSecret) {
      return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
    }

    if (!stripeSecretKey) {
      return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-04-10",
    });

    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId =
        (session.metadata?.supabase_user_id as string | undefined) ||
        (session.client_reference_id as string | undefined);

      const planKey =
        (session.metadata?.plan_key as string | undefined) || "basico";

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
          plan_key: (subscription.metadata?.plan_key as string) || planKey,
          status: subscription.status,
          current_period_end: unixToIso(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
          raw: subscription,
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.supabase_user_id;
      const planKey = subscription.metadata?.plan_key || "basico";
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
          plan_key: planKey,
          status: subscription.status,
          current_period_end: unixToIso(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
          raw: subscription,
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.supabase_user_id;
      const planKey = subscription.metadata?.plan_key || "basico";
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
          plan_key: planKey,
          status: "canceled",
          current_period_end: unixToIso(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
          raw: subscription,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
