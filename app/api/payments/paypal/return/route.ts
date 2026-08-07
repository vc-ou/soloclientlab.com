import "server-only";

import { NextResponse } from "next/server";
import { fulfillPaidProductPayment, getProductPaymentByProviderCheckoutSessionId, withDatabaseTimeout } from "@/lib/db";
import { capturePayPalOrder, getPayPalCapturedOrderDetails } from "@/lib/paypal";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const orderId = requestUrl.searchParams.get("token");

  if (!orderId) {
    return NextResponse.redirect(new URL("/checkout/cancel?reason=missing_paypal_order", requestUrl.origin));
  }

  try {
    const [capturedOrder, pendingPayment] = await Promise.all([
      capturePayPalOrder(orderId),
      getProductPaymentByProviderCheckoutSessionId(orderId)
    ]);
    const details = getPayPalCapturedOrderDetails(capturedOrder);
    const email = pendingPayment?.email ?? details.payerEmail;

    if (!email) {
      throw new Error(`PayPal order ${orderId} has no email on the pending payment or capture response.`);
    }

    await withDatabaseTimeout(
      fulfillPaidProductPayment({
        provider: "paypal",
        product_slug: pendingPayment?.product_slug ?? details.productSlug,
        access_type: pendingPayment?.metadata?.access_type === "paid_pilot" ? "paid_pilot" : "lifetime_access",
        email,
        access_request_id: pendingPayment?.access_request_id,
        provider_checkout_session_id: orderId,
        provider_payment_intent_id: details.captureId,
        provider_customer_id: details.payerId,
        currency: details.currency ?? pendingPayment?.currency,
        amount_subtotal: details.amountCents ?? pendingPayment?.amount_subtotal,
        amount_total: details.amountCents ?? pendingPayment?.amount_total,
        paid_at: details.paidAt,
        metadata: {
          ...(pendingPayment?.metadata ?? {}),
          paypal_order_id: orderId,
          paypal_order_status: capturedOrder.status,
          paypal_capture_id: details.captureId,
          paypal_capture_status: details.captureStatus,
          paypal_payer_id: details.payerId,
          paypal_return_confirmed_at: new Date().toISOString()
        }
      }),
      8000
    );

    return NextResponse.redirect(new URL(`/checkout/success?provider=paypal&order_id=${encodeURIComponent(orderId)}`, requestUrl.origin));
  } catch (error) {
    console.error(`PayPal checkout return failed for order ${orderId}:`, error);
    return NextResponse.redirect(new URL("/checkout/cancel?reason=paypal_capture_failed", requestUrl.origin));
  }
}
