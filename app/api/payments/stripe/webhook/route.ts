import "server-only";

import Stripe from "stripe";
import { fulfillPaidProductPayment, revokeProductAccessForPayment, withDatabaseTimeout } from "@/lib/domains/commerce";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { isLicensedProduct } from "@/lib/licenses";
import type { ProductAccessType, ProductSlug } from "@/lib/types";

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
  if (
    !isLicensedProduct(metadata.product_slug) ||
    !["paid_pilot", "monthly_subscription"].includes(metadata.access_type ?? "")
  ) {
    return;
  }

  const email = getSessionEmail(session);
  if (!email) {
    throw new Error(`Stripe Checkout session ${session.id} has no customer email.`);
  }

  await withDatabaseTimeout(
    fulfillPaidProductPayment({
      product_slug: metadata.product_slug as ProductSlug,
      access_type: metadata.access_type as ProductAccessType,
      email,
      access_request_id: metadata.access_request_id,
      provider_checkout_session_id: session.id,
      provider_payment_intent_id: getStripeObjectId(session.payment_intent),
      provider_customer_id: getStripeObjectId(session.customer),
      provider_subscription_id: getStripeObjectId(session.subscription),
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

/**
 * 退款 → 撤权。
 *
 * 以前完全没处理退款：客户退款后仍能激活、仍能继续用。这里按 charge 上的
 * payment_intent 找到原订单并撤权（幂等：重复的 refund 事件不会重复处理出错）。
 */
async function revokeFromChargeRefund(charge: Stripe.Charge, event: Stripe.Event) {
  const paymentIntentId = getStripeObjectId(charge.payment_intent);
  if (!paymentIntentId) {
    console.warn(`Stripe ${event.type} ${event.id} has no payment_intent; cannot revoke access.`);
    return;
  }

  const revoked = await withDatabaseTimeout(
    revokeProductAccessForPayment({
      provider_payment_intent_id: paymentIntentId,
      refunded_at: new Date(event.created * 1000).toISOString(),
      metadata: {
        stripe_event_type: event.type,
        stripe_event_id: event.id,
        stripe_charge_id: charge.id,
        stripe_refunded: charge.refunded,
        stripe_amount_refunded: charge.amount_refunded
      }
    }),
    8000
  );

  if (!revoked) {
    console.warn(`Stripe ${event.type} ${event.id}: no payment matched payment_intent ${paymentIntentId}.`);
  }
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

    // 退款 / 部分退款 / 退款失败回滚：统一按 charge 处理
    if (event.type === "charge.refunded" || event.type === "charge.refund.updated") {
      await revokeFromChargeRefund(event.data.object as Stripe.Charge, event);
    }
  } catch (error) {
    console.error(`Stripe webhook fulfillment failed for ${event.id}:`, error);
    return Response.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
