"use server";

/**
 * 结账：Stripe 订阅 / PayPal 一次性 / paid pilot
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { getText, monthlySubscriptionCheckoutSchema, paidPilotCheckoutSchema } from "./shared";

import { getProductBySlug } from "@/lib/domains/catalog";
import { addProductAccessRequest, saveSubscriber } from "@/lib/domains/leads";
import { addPendingProductPayment } from "@/lib/domains/commerce";
import { trackTrialEvent } from "@/lib/domains/analytics";
import { createPayPalPaidPilotOrder } from "@/lib/paypal";
import { createPayPalProductOrder } from "@/lib/paypal";
import { getProductMonthlySubscriptionPriceId } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  ActionState,
  ProductSlug
} from "@/lib/types";

export async function startMonthlySubscriptionCheckout(formData: FormData) {
  const requestedProductSlug: ProductSlug =
    getText(formData, "product_slug") === "needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar";
  const parsed = monthlySubscriptionCheckoutSchema.safeParse({
    product_slug: requestedProductSlug,
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    redirect(`/checkout/cancel?reason=invalid_subscription_request&product=${encodeURIComponent(requestedProductSlug)}`);
  }

  const productSlug = parsed.data.product_slug as ProductSlug;
  const siteUrl = getSiteUrl();
  const metadata = {
    product_slug: productSlug,
    access_type: "monthly_subscription",
    source_page: parsed.data.source_page ?? ""
  };

  let checkoutUrl: string | null = null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: getProductMonthlySubscriptionPriceId(productSlug),
          quantity: 1
        }
      ],
      success_url: `${siteUrl}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(productSlug)}`,
      cancel_url: `${siteUrl}/checkout/cancel?product=${encodeURIComponent(productSlug)}`,
      allow_promotion_codes: true,
      metadata,
      subscription_data: {
        metadata
      }
    });

    checkoutUrl = session.url;

    await trackTrialEvent({
      product_slug: productSlug,
      event_type: "monthly_subscription_checkout_started",
      source_page: parsed.data.source_page,
      metadata: {
        stripe_checkout_session_id: session.id,
        access_type: "monthly_subscription"
      }
    });
  } catch (error) {
    console.error("Failed to create monthly subscription checkout:", error);
    redirect(`/checkout/cancel?reason=subscription_checkout_failed&product=${encodeURIComponent(productSlug)}`);
  }

  if (!checkoutUrl) {
    redirect(`/checkout/cancel?reason=missing_checkout_url&product=${encodeURIComponent(productSlug)}`);
  }

  redirect(checkoutUrl);
}


export async function startPayPalCheckout(formData: FormData) {
  const requestedProductSlug = getText(formData, "product_slug").trim() as ProductSlug;
  const parsed = monthlySubscriptionCheckoutSchema.safeParse({
    product_slug: requestedProductSlug,
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    redirect(`/checkout/cancel?reason=invalid_paypal_request&product=${encodeURIComponent(requestedProductSlug)}`);
  }

  const productSlug = parsed.data.product_slug as ProductSlug;
  const product = await getProductBySlug(productSlug);
  if (!product || !product.payment_enabled) {
    redirect(`/checkout/cancel?reason=product_not_available&product=${encodeURIComponent(productSlug)}`);
  }
  const checkoutId = randomUUID();
  let approveUrl: string | undefined;

  try {
    const order = await createPayPalProductOrder({
      checkoutId,
      productSlug,
      productName: product.name,
      amountCents: product.price_cents,
      currency: product.currency,
      returnUrl: `${getSiteUrl()}/api/payments/paypal/return`,
      cancelUrl: `${getSiteUrl()}/checkout/cancel?product=${encodeURIComponent(productSlug)}`
    });

    if (!order.approveUrl) {
      throw new Error("PayPal did not return an approval URL.");
    }
    approveUrl = order.approveUrl;

    await addPendingProductPayment({
      provider: "paypal",
      product_slug: productSlug,
      currency: product.currency,
      amount_subtotal: product.price_cents,
      amount_total: product.price_cents,
      provider_checkout_session_id: order.id,
      checkout_url: order.approveUrl,
      metadata: {
        access_type: "lifetime_access",
        product_name: product.name,
        source_page: parsed.data.source_page
      }
    });

    try {
      await trackTrialEvent({
        product_slug: productSlug,
        event_type: "paypal_access_started",
        source_page: parsed.data.source_page,
        metadata: {
          paypal_order_id: order.id,
          access_type: "lifetime_access"
        }
      });
    } catch (error) {
      console.error("PayPal checkout analytics write failed:", error);
    }
  } catch (error) {
    console.error("Failed to create PayPal checkout:", error);
    redirect(`/checkout/cancel?reason=paypal_checkout_failed&product=${encodeURIComponent(productSlug)}`);
  }

  if (!approveUrl) {
    redirect(`/checkout/cancel?reason=missing_paypal_approval_url&product=${encodeURIComponent(productSlug)}`);
  }

  redirect(approveUrl);
}


export async function createPaidPilotCheckout(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = paidPilotCheckoutSchema.safeParse({
    email: getText(formData, "email").toLowerCase(),
    company_name: getText(formData, "company_name"),
    role: getText(formData, "role") || undefined,
    use_case: getText(formData, "use_case"),
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please add a valid email, company or workflow name, and paid pilot use case."
    };
  }

  let accessRequestId: string;
  let checkoutUrl: string;

  try {
    const product = await getProductBySlug("leadradar");
    if (!product || !product.payment_enabled) {
      throw new Error("LeadRadar product is not available for payment.");
    }
    const amountCents = product.price_cents;
    const currency = product.currency;

    accessRequestId = await addProductAccessRequest({
      product_slug: "leadradar",
      access_type: "paid_pilot",
      email: parsed.data.email,
      company_name: parsed.data.company_name,
      role: parsed.data.role,
      source_page: parsed.data.source_page,
      use_case: parsed.data.use_case
    });

    const paypalOrder = await createPayPalPaidPilotOrder({
      accessRequestId,
      returnUrl: `${getSiteUrl()}/api/payments/paypal/return`,
      cancelUrl: `${getSiteUrl()}/checkout/cancel?product=leadradar`
    });

    if (!paypalOrder.approveUrl) {
      throw new Error("PayPal did not return an approval URL.");
    }
    checkoutUrl = paypalOrder.approveUrl;

    await addPendingProductPayment({
      provider: "paypal",
      product_slug: "leadradar",
      access_request_id: accessRequestId,
      email: parsed.data.email,
      currency,
      amount_subtotal: amountCents,
      amount_total: amountCents,
      provider_checkout_session_id: paypalOrder.id,
      checkout_url: paypalOrder.approveUrl,
      metadata: {
        access_type: "paid_pilot",
        company_name: parsed.data.company_name,
        role: parsed.data.role,
        use_case: parsed.data.use_case,
        source_page: parsed.data.source_page
      }
    });

    const secondaryWrites = await Promise.allSettled([
      saveSubscriber({
        email: parsed.data.email,
        source_page: parsed.data.source_page,
        source_type: "product_access",
        topic_tag: "manufacturing_social_lead_discovery",
        note: parsed.data.use_case
      }),
      trackTrialEvent({
        product_slug: "leadradar",
        event_type: "paid_pilot_requested",
        email: parsed.data.email,
        source_page: parsed.data.source_page,
        metadata: {
          access_request_id: accessRequestId,
          paypal_order_id: paypalOrder.id,
          company_name: parsed.data.company_name
        }
      })
    ]);
    secondaryWrites.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Paid pilot checkout secondary write failed:", result.reason);
      }
    });
  } catch (error) {
    console.error("Failed to create paid pilot checkout:", error);
    return {
      success: false,
      message: "Checkout could not be started just now. Please email soloclientlab.com@gmail.com."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/product-access");

  return {
    success: true,
    message: "Redirecting to secure checkout...",
    redirectUrl: checkoutUrl,
    eventName: "paid_pilot_requested"
  };
}

