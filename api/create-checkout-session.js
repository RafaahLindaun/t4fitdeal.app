import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { priceId, userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    success_url: `${process.env.APP_URL}/pagamento-sucesso`,
    cancel_url: `${process.env.APP_URL}/planos`,

    metadata: {
      user_id: userId,
    },
  });

  res.status(200).json({
    url: session.url,
  });
}
