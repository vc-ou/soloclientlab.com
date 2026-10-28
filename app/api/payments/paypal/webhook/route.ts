import "server-only";

import { logError } from "@/lib/domains/analytics";
import { fulfillPaidProductPayment, getProductPaymentByProviderCheckoutSessionId, revokeProductAccessForPayment, withDatabaseTimeout
} from "@/lib/domains/commerce";
import { amountStringToCents, getPayPalCapturedOrderDetails, getPayPalOrder, verifyPayPalWebhookSignature } from "@/lib/paypal";

export const runtime = "nodejs";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource?: {
    id?: string;
    status?: string;
    payer?: {
      email_address?: string;
      payer_id?: string;
    };
    amount?: {
      currency_code?: string;
      value?: string;
    };
    create_time?: string;
    update_time?: string;
      supplementary_data?: {
        related_ids?: {
          capture_id?: string;
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
  // pending 记录建单时还没有 payer email（要等用户 approve）。以前这里直接 return，
  // 导致"用户付完关页面 → 回跳丢失 + webhook 跳过 = 收了钱不发货"。
  // 现在改为向 PayPal 反查订单拿 payer email，仍然拿不到才降级。
  let payerEmail = pendingPayment.email ?? resource?.payer?.email_address;
  let recoveredFromOrder = false;

  if (!payerEmail) {
    try {
      const order = await getPayPalOrder(orderId);
      payerEmail = getPayPalCapturedOrderDetails(order).payerEmail;
      recoveredFromOrder = Boolean(payerEmail);
    } catch (error) {
      console.error(`PayPal webhook ${event.id ?? "unknown"} could not fetch order ${orderId} to recover payer email:`, error);
    }
  }

  if (!payerEmail) {
    // 仍拿不到：记录待人工处理，避免"悄悄不发货"
    console.error(`PayPal webhook ${event.id ?? "unknown"} captured order ${orderId} but no payer email is available; needs manual fulfilment.`);
    return;
  }

  const amountCents = resource?.amount?.value ? amountStringToCents(resource.amount.value) : pendingPayment.amount_total;

  await withDatabaseTimeout(
    fulfillPaidProductPayment({
      provider: "paypal",
      product_slug: pendingPayment.product_slug,
      access_type: pendingPayment.metadata?.access_type === "paid_pilot" ? "paid_pilot" : "lifetime_access",
      email: payerEmail,
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
        paypal_capture_status: resource?.status,
        paypal_payer_email_recovered_from_order: recoveredFromOrder
      }
    }),
    8000
  );
}

async function revokeCapturePayment(event: PayPalWebhookEvent) {
  const resource = event.resource;
  const orderId = resource?.supplementary_data?.related_ids?.order_id;
  const captureId = resource?.supplementary_data?.related_ids?.capture_id ?? resource?.id;

  await withDatabaseTimeout(
    revokeProductAccessForPayment({
      provider_checkout_session_id: orderId,
      provider_payment_intent_id: captureId,
      refunded_at: resource?.update_time ?? resource?.create_time ?? event.create_time,
      metadata: {
        paypal_event_id: event.id,
        paypal_event_type: event.event_type,
        paypal_refund_or_reversal_id: resource?.id,
        paypal_capture_id: captureId,
        paypal_order_id: orderId,
        paypal_refund_or_reversal_status: resource?.status
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
    if (event.event_type === "PAYMENT.CAPTURE.REFUNDED" || event.event_type === "PAYMENT.CAPTURE.REVERSED") {
      await revokeCapturePayment(event);
    }
  } catch (error) {
    await logError({ scope: "paypal-webhook", error, detail: { event_id: event.id, event_type: event.event_type } });
    return Response.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
