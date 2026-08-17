import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { getOptionalEnv } from "@/lib/env";
import type { ProductSlug } from "@/lib/types";

const LICENSE_KEY_PREFIX: Record<ProductSlug, string> = {
  leadradar: "SCL-LR",
  "needradar-workflow-lab": "SCL-NR"
};

const base32Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getLicenseSigningSecret() {
  const secret = getOptionalEnv("LICENSE_SIGNING_SECRET") ?? getOptionalEnv("PAYPAL_CLIENT_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "development-license-signing-secret";
  throw new Error("Missing required environment variable: LICENSE_SIGNING_SECRET");
}

function toBase32(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function groupKey(value: string) {
  return value.match(/.{1,4}/g)?.join("-") ?? value;
}

export function normalizeLicenseKey(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "").replace(/-+/g, "-") : "";
}

export function buildLicenseKey(productSlug: ProductSlug, paymentId: string, entitlementId: string) {
  const digest = createHmac("sha256", getLicenseSigningSecret())
    .update(`product-license:v1:${productSlug}:${paymentId}:${entitlementId}`)
    .digest();
  return `${LICENSE_KEY_PREFIX[productSlug]}-${groupKey(toBase32(digest).slice(0, 24))}`;
}

export function hashLicenseSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getLicenseKeySuffix(licenseKey: string) {
  return normalizeLicenseKey(licenseKey).slice(-8);
}

export function generateLicenseToken() {
  return `scltok_${randomBytes(32).toString("base64url")}`;
}

export function buildDeviceIdHash(deviceId: string) {
  return hashLicenseSecret(`device:${deviceId}`);
}

export function buildLicenseTokenHash(token: string) {
  return hashLicenseSecret(`token:${token}`);
}
