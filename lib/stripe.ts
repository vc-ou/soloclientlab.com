import "server-only";

import Stripe from "stripe";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";
import type { ProductSlug } from "@/lib/types";

declare global {
  var __soloClientLabStripe: Stripe | undefined;
}

export function getStripe() {
  if (!globalThis.__soloClientLabStripe) {
    globalThis.__soloClientLabStripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  }

  return globalThis.__soloClientLabStripe;
}

export function getStripeWebhookSecret() {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getLeadRadarPaidPilotPriceId() {
  return getRequiredEnv("STRIPE_LEADRADAR_PAID_PILOT_PRICE_ID");
}

export function getProductMonthlySubscriptionPriceId(productSlug: ProductSlug) {
  if (productSlug === "needradar-workflow-lab") {
    return getOptionalEnv("STRIPE_NEEDRADAR_MONTHLY_PRICE_ID")
      ?? getOptionalEnv("STRIPE_LEADRADAR_MONTHLY_PRICE_ID")
      ?? getLeadRadarPaidPilotPriceId();
  }

  return getOptionalEnv("STRIPE_LEADRADAR_MONTHLY_PRICE_ID") ?? getLeadRadarPaidPilotPriceId();
}
