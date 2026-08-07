import "server-only";

import Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";

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
