import "server-only";

import Stripe from "stripe";
import { fulfillPaidProductPayment, withDatabaseTimeout } from "@/lib/db";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function getStripeObjectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

function getSessionEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? session.metadata?.email;
}

async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  eventType: Stripe.Event.Type,
  eventCreatedAt: number
) {
  if (session.payment_status !== "paid") {
    return;
  }

  const metadata = session.metadata ?? {};
  if (metadata.product_slug !== "leadradar" || metadata.access_type !== "paid_pilot") {
    return;
  }

  const email = getSessionEmail(session);
  if (!email) {
    throw new Error(`Stripe Checkout session ${session.id} has no customer email.`);
  }

  await withDatabaseTimeout(
    fulfillPaidProductPayment({
      product_slug: "leadradar",
      email,
      access_request_id: metadata.access_request_id,
      provider_checkout_session_id: session.id,
      provider_payment_intent_id: getStripeObjectId(session.payment_intent),
      provider_customer_id: getStripeObjectId(session.customer),
      currency: session.currency ?? undefined,
      amount_subtotal: session.amount_subtotal ?? undefined,
      amount_total: session.amount_total ?? undefined,
      paid_at: new Date(eventCreatedAt * 1000).toISOString(),
      metadata: {
        stripe_event_type: eventType,
        stripe_event_created_at: eventCreatedAt,
        ...metadata
      }
    }),
    8000
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, event.type, event.created);
    }
  } catch (error) {
    console.error(`Stripe webhook fulfillment failed for ${event.id}:`, error);
    return Response.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
