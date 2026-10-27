import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { getOptionalEnv } from "@/lib/env";
import type { ProductSlug } from "@/lib/types";

const LICENSE_KEY_PREFIX = {
  leadradar: "SCL-LR",
  "needradar-workflow-lab": "SCL-NR",
  "opportunity-intelligence-agent": "SCL-OI"
} as const;

/** 所有可发放授权码的商品。新增商品时只改这里，API 白名单会自动跟随。 */
export const LICENSED_PRODUCT_SLUGS = Object.keys(LICENSE_KEY_PREFIX) as ProductSlug[];

export function isLicensedProduct(value: unknown): value is ProductSlug {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(LICENSE_KEY_PREFIX, value);
}

const base32Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getLicenseSigningSecret() {
  const dedicated = getOptionalEnv("LICENSE_SIGNING_SECRET");
  if (dedicated) return dedicated;

  // 生产环境必须使用独立的密钥，**不再回退**到 PAYPAL_CLIENT_SECRET。
  // 回退的后果是：轮换 PayPal 密钥会静默地把签名密钥换掉，导致所有已发出的授权码失效，
  // 而且没有任何报错——这比启动失败危险得多。宁可让请求失败。
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable: LICENSE_SIGNING_SECRET。" +
        "生产环境不会回退到 PAYPAL_CLIENT_SECRET（轮换 PayPal 密钥会让已发授权码全部失效）。" +
        "请在 Vercel 的 Production 与 Preview 环境都配置该变量。"
    );
  }

  return "development-license-signing-secret";
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
  if (!(productSlug in LICENSE_KEY_PREFIX)) {
    throw new Error(`Unsupported license product: ${productSlug}`);
  }
  const prefix = LICENSE_KEY_PREFIX[productSlug as keyof typeof LICENSE_KEY_PREFIX];
  const digest = createHmac("sha256", getLicenseSigningSecret())
    .update(`product-license:v1:${productSlug}:${paymentId}:${entitlementId}`)
    .digest();
  return `${prefix}-${groupKey(toBase32(digest).slice(0, 24))}`;
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
