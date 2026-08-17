import "server-only";

import { verifyProductLicenseToken } from "@/lib/db";
import { buildDeviceIdHash, buildLicenseTokenHash } from "@/lib/licenses";
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
  const licenseToken = typeof body.licenseToken === "string" ? body.licenseToken.trim() : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!productSlug || !licenseToken || !deviceId) {
    return Response.json({ active: false, error: "invalid_request" }, { status: 400, headers: corsHeaders });
  }

  const result = await verifyProductLicenseToken({
    product_slug: productSlug,
    token_hash: buildLicenseTokenHash(licenseToken),
    device_id_hash: buildDeviceIdHash(deviceId)
  });

  if (result.status !== "active") {
    return Response.json({ active: false, error: "inactive" }, { status: 403, headers: corsHeaders });
  }

  return Response.json({
    active: true,
    productSlug,
    accessType: result.entitlement.access_type,
    licenseKeySuffix: result.licenseKey.key_suffix
  }, { headers: corsHeaders });
}
