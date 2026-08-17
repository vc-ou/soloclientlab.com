import "server-only";

import { activateProductLicense } from "@/lib/db";
import {
  buildDeviceIdHash,
  buildLicenseTokenHash,
  generateLicenseToken,
  hashLicenseSecret,
  normalizeLicenseKey
} from "@/lib/licenses";
import type { ProductSlug } from "@/lib/types";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function parseProductSlug(value: unknown): ProductSlug | null {
  if (value === "leadradar" || value === "needradar-workflow-lab") return value;
  return null;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ active: false, error: "invalid_json" }, { status: 400, headers: corsHeaders });
  }

  const productSlug = parseProductSlug(body.productSlug);
  const licenseKey = normalizeLicenseKey(body.licenseKey);
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!productSlug || !licenseKey || !deviceId) {
    return Response.json({ active: false, error: "invalid_request" }, { status: 400, headers: corsHeaders });
  }

  const licenseToken = generateLicenseToken();
  const result = await activateProductLicense({
    product_slug: productSlug,
    key_hash: hashLicenseSecret(licenseKey),
    device_id_hash: buildDeviceIdHash(deviceId),
    token_hash: buildLicenseTokenHash(licenseToken),
    metadata: {
      user_agent: request.headers.get("user-agent") ?? undefined
    }
  });

  if (result.status !== "active") {
    return Response.json({ active: false, error: result.status }, { status: result.status === "activation_limit_reached" ? 409 : 403, headers: corsHeaders });
  }

  return Response.json({
    active: true,
    licenseToken,
    productSlug,
    accessType: result.entitlement.access_type,
    licenseKeySuffix: result.licenseKey.key_suffix
  }, { headers: corsHeaders });
}
