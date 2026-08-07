import "server-only";

import { fulfillPaidProductPayment, getProductPaymentByProviderCheckoutSessionId, withDatabaseTimeout } from "@/lib/db";
import { amountStringToCents, verifyPayPalWebhookSignature } from "@/lib/paypal";

export const runtime = "nodejs";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: {
      currency_code?: string;
      value?: string;
    };
    create_time?: string;
    update_time?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

async function fulfillCaptureCompleted(event: PayPalWebhookEvent) {
  const resource = event.resource;
  const orderId = resource?.supplementary_data?.related_ids?.order_id;

  if (!orderId) {
    throw new Error(`PayPal webhook ${event.id ?? "unknown"} is missing related order id.`);
  }

  const pendingPayment = await getProductPaymentByProviderCheckoutSessionId(orderId);
  if (!pendingPayment) {
    console.warn(`PayPal webhook ${event.id ?? "unknown"} could not find pending payment for order ${orderId}; waiting for the return route.`);
    return;
  }

  const amountCents = resource?.amount?.value ? amountStringToCents(resource.amount.value) : pendingPayment.amount_total;

  await withDatabaseTimeout(
    fulfillPaidProductPayment({
      provider: "paypal",
      product_slug: pendingPayment.product_slug,
      access_type: pendingPayment.metadata?.access_type === "paid_pilot" ? "paid_pilot" : "lifetime_access",
      email: pendingPayment.email,
      access_request_id: pendingPayment.access_request_id,
      provider_checkout_session_id: orderId,
      provider_payment_intent_id: resource?.id,
      currency: resource?.amount?.currency_code ?? pendingPayment.currency,
      amount_subtotal: amountCents,
      amount_total: amountCents,
      paid_at: resource?.update_time ?? resource?.create_time ?? event.create_time,
      metadata: {
        ...(pendingPayment.metadata ?? {}),
        paypal_event_id: event.id,
        paypal_event_type: event.event_type,
        paypal_order_id: orderId,
        paypal_capture_id: resource?.id,
        paypal_capture_status: resource?.status
      }
    }),
    8000
  );
}

export async function POST(request: Request) {
  const payload = await request.text();
  let event: PayPalWebhookEvent;

  try {
    event = JSON.parse(payload) as PayPalWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid PayPal webhook payload." }, { status: 400 });
  }

  const verified = await verifyPayPalWebhookSignature({
    headers: request.headers,
    event
  });

  if (!verified) {
    return Response.json({ error: "Invalid PayPal webhook signature." }, { status: 400 });
  }

  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      await fulfillCaptureCompleted(event);
    }
  } catch (error) {
    console.error(`PayPal webhook fulfillment failed for ${event.id ?? "unknown"}:`, error);
    return Response.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
