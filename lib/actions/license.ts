"use server";

import { z } from "zod";
import { enforceRateLimit } from "@/lib/platform/rate-limit";
import { findLicenseAccessForCustomer } from "@/lib/domains/commerce";

export type LicenseLookupState = {
  status: "idle" | "ok" | "error";
  message: string;
  licenseKey?: string;
  productSlug?: string;
  maxActivations?: number;
  activeActivations?: number;
};

const lookupSchema = z.object({
  email: z.string().trim().email().max(255),
  identifier: z.string().trim().min(6).max(200)
});

const MESSAGES = {
  not_found:
    "没有找到匹配的订单。请确认邮箱与订单号/授权码后 8 位是否正确。订单号在付款完成页或 PayPal 收据里。",
  not_paid: "该订单还没有完成付款。如果刚付完，请等 1–2 分钟再试。",
  revoked: "该订单已退款或被撤销，授权码不再有效。如有疑问请邮件联系。",
  invalid: "请填写有效的邮箱，以及订单号或授权码后 8 位。"
};

export async function lookupLicense(
  _prevState: LicenseLookupState,
  formData: FormData
): Promise<LicenseLookupState> {
  const limited = await enforceRateLimit({ key: "license-lookup", limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return {
      status: "error",
      message: `尝试次数过多，请 ${Math.ceil(limited.retryAfterSeconds / 60)} 分钟后再试。`
    };
  }

  const parsed = lookupSchema.safeParse({
    email: formData.get("email"),
    identifier: formData.get("identifier")
  });

  if (!parsed.success) {
    return { status: "error", message: MESSAGES.invalid };
  }

  try {
    const result = await findLicenseAccessForCustomer(parsed.data);
    if (result.status === "ok") {
      return {
        status: "ok",
        message: "找到了。请把授权码粘贴到扩展首次启动的输入框。",
        licenseKey: result.licenseKey,
        productSlug: result.productSlug,
        maxActivations: result.maxActivations,
        activeActivations: result.activeActivations
      };
    }
    return { status: "error", message: MESSAGES[result.status] };
  } catch (error) {
    console.error("License lookup failed:", error);
    return { status: "error", message: "查询暂时失败，请稍后重试或邮件联系。" };
  }
}
