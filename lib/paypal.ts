import "server-only";

import { getOptionalEnv, getRequiredEnv } from "@/lib/env";
import { getProductBySlug } from "@/lib/db";
import type { ProductSlug } from "@/lib/types";

type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrder = {
  id: string;
  status?: string;
  links?: PayPalLink[];
};

type PayPalAmount = {
  currency_code: string;
  value: string;
};

type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: PayPalAmount;
  create_time?: string;
  update_time?: string;
};

export type PayPalCapturedOrder = PayPalOrder & {
  payer?: {
    email_address?: string;
    payer_id?: string;
  };
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    invoice_id?: string;
    amount?: PayPalAmount;
    payments?: {
      captures?: PayPalCapture[];
    };
  }>;
};

declare global {
  var __soloClientLabPayPalAccessToken:
    | {
        value: string;
        expiresAt: number;
      }
    | undefined;
}

function getPayPalBaseUrl() {
  return getOptionalEnv("PAYPAL_ENV") === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

function normalizeCurrency(value?: string) {
  return (value ?? "USD").trim().toUpperCase();
}

export function amountStringToCents(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("PayPal amount must be a positive number with up to two decimal places.");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function centsToPayPalAmount(cents: number) {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error("PayPal amount must be a positive integer number of cents.");
  }

  return (cents / 100).toFixed(2);
}

async function getPayPalAccessToken() {
  const cached = globalThis.__soloClientLabPayPalAccessToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.value;
  }

  const credentials = Buffer.from(`${getRequiredEnv("PAYPAL_CLIENT_ID")}:${getRequiredEnv("PAYPAL_CLIENT_SECRET")}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const body = await response.json().catch(() => null) as { access_token?: string; expires_in?: number } | null;
  if (!response.ok || !body?.access_token) {
    throw new Error(`PayPal access token request failed with status ${response.status}.`);
  }

  globalThis.__soloClientLabPayPalAccessToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 300) * 1000
  };

  return body.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getPayPalAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...init,
    headers
  });
  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    throw new Error(`PayPal request failed with status ${response.status}: ${text}`);
  }

  return data as T;
}

export async function createPayPalPaidPilotOrder(input: {
  accessRequestId: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  return createPayPalProductOrder({
    checkoutId: input.accessRequestId,
    productSlug: "leadradar",
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl
  });
}

export async function createPayPalProductOrder(input: {
  checkoutId: string;
  productSlug: ProductSlug;
  productName?: string;
  amountCents?: number;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const product = await getProductBySlug(input.productSlug);
  if (!product || !product.payment_enabled) {
    throw new Error(`Product ${input.productSlug} is not available for payment.`);
  }

  const amountCents = input.amountCents ?? product.price_cents;
  const currency = normalizeCurrency(input.currency ?? product.currency);
  const productName = input.productName ?? product.name;
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": input.checkoutId
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `${input.productSlug}-access-payment`,
          custom_id: input.checkoutId,
          invoice_id: input.checkoutId,
          description: `${productName} access payment`,
          amount: {
            currency_code: currency,
            value: centsToPayPalAmount(amountCents)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "SoloClientLab",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl
          }
        }
      }
    })
  });

  return {
    id: order.id,
    approveUrl: order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href
  };
}

export async function capturePayPalOrder(orderId: string) {
  return paypalRequest<PayPalCapturedOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `capture-${orderId}`
    },
    body: JSON.stringify({})
  });
}

export function getPayPalCapturedOrderDetails(order: PayPalCapturedOrder) {
  const purchaseUnit = order.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const amount = capture?.amount ?? purchaseUnit?.amount;
  const productSlug = purchaseUnit?.reference_id?.replace(/-access-payment$/, "") ?? "leadradar";

  return {
    productSlug: productSlug as ProductSlug,
    payerEmail: order.payer?.email_address,
    payerId: order.payer?.payer_id,
    accessRequestId: purchaseUnit?.custom_id,
    captureId: capture?.id,
    captureStatus: capture?.status,
    currency: amount?.currency_code,
    amountCents: amount?.value ? amountStringToCents(amount.value) : undefined,
    paidAt: capture?.update_time ?? capture?.create_time
  };
}

export async function verifyPayPalWebhookSignature(input: {
  headers: Headers;
  event: unknown;
}) {
  const authAlgo = input.headers.get("paypal-auth-algo");
  const certUrl = input.headers.get("paypal-cert-url");
  const transmissionId = input.headers.get("paypal-transmission-id");
  const transmissionSig = input.headers.get("paypal-transmission-sig");
  const transmissionTime = input.headers.get("paypal-transmission-time");

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }

  const result = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: getRequiredEnv("PAYPAL_WEBHOOK_ID"),
      webhook_event: input.event
    })
  });

  return result.verification_status === "SUCCESS";
}
