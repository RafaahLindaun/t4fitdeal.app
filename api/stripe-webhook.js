import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  const event = stripe.webhooks.constructEvent(
    req.rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.metadata.user_id;

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_code: "nutri_plus",
      plan_name: "Nutri+",
      status: "active",
      stripe_subscription_id: session.subscription,
    });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;

    await supabase.from("payments").insert({
      user_id: invoice.metadata?.user_id,
      amount_brl: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      stripe_invoice_id: invoice.id,
    });
  }

  res.json({ received: true });
}
