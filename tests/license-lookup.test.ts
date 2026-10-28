import { describe, expect, it } from "vitest";
import { useIsolatedDataDir } from "./setup";

const env = useIsolatedDataDir();

const commerce = await import("@/lib/domains/commerce");
const licenses = await import("@/lib/licenses");

const EMAIL = "buyer@example.com";
const ORDER = "ORD-LOOKUP-1";

async function seedPaidOrder() {
  await commerce.fulfillPaidProductPayment({
    provider: "paypal",
    product_slug: "leadradar",
    email: EMAIL,
    provider_checkout_session_id: ORDER,
    provider_payment_intent_id: "CAPTURE-LOOKUP-1",
    amount_total: 990,
    currency: "USD"
  });
}

describe("授权码自助找回", () => {
  it("邮箱 + 订单号 → 返回同一把（确定性）授权码", async () => {
    await seedPaidOrder();
    const result = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: ORDER });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;

    const access = await commerce.getPaidProductLicenseAccessByCheckoutSessionId(ORDER, "leadradar");
    const expected = licenses.buildLicenseKey("leadradar", access!.payment.id, access!.entitlement.id);
    expect(result.licenseKey).toBe(expected);
    expect(result.maxActivations).toBe(1);
  });

  it("大小写与空格不影响邮箱匹配", async () => {
    const result = await commerce.findLicenseAccessForCustomer({ email: "  BUYER@Example.com ", identifier: ORDER });
    expect(result.status).toBe("ok");
  });

  it("用 payment intent id 也能查到", async () => {
    const result = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: "CAPTURE-LOOKUP-1" });
    expect(result.status).toBe("ok");
  });

  it("授权码后 8 位也能查到", async () => {
    const first = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: ORDER });
    if (first.status !== "ok") throw new Error("seed failed");
    const suffix = first.licenseKey.slice(-8);
    const result = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: suffix });
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.licenseKey).toBe(first.licenseKey);
  });

  it("邮箱不匹配时一律 not_found（不泄露订单是否存在）", async () => {
    const result = await commerce.findLicenseAccessForCustomer({ email: "other@example.com", identifier: ORDER });
    expect(result.status).toBe("not_found");
  });

  it("错误的标识符返回 not_found", async () => {
    const result = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: "WRONG-ORDER-ID" });
    expect(result.status).toBe("not_found");
  });

  it("退款后返回 revoked", async () => {
    await commerce.revokeProductAccessForPayment({ provider_checkout_session_id: ORDER });
    const result = await commerce.findLicenseAccessForCustomer({ email: EMAIL, identifier: ORDER });
    expect(result.status).toBe("revoked");
  });
});

process.on("exit", () => env.cleanup());
