import { describe, expect, it } from "vitest";
import { useIsolatedDataDir } from "./setup";

// 必须在 import 领域模块前设置环境：数据目录在模块加载时读取
const env = useIsolatedDataDir();

const commerce = await import("@/lib/domains/commerce");
const platform = await import("@/lib/platform");
const licenses = await import("@/lib/licenses");

const ORDER = "TEST-ORDER-1001";
const PRODUCT = "leadradar" as const;
const EMAIL = "buyer@example.com";

async function snapshot() {
  const db = await platform.readDb();
  return {
    payments: db.product_payments.filter((p) => p.provider_checkout_session_id === ORDER),
    entitlements: db.product_entitlements,
    keys: db.product_license_keys,
    activations: db.product_license_activations
  };
}

describe("commerce · 支付履约", () => {
  it("同一订单重复履约只产生一条支付与一条权益（幂等）", async () => {
    await commerce.fulfillPaidProductPayment({
      provider: "paypal",
      product_slug: PRODUCT,
      email: EMAIL,
      provider_checkout_session_id: ORDER,
      provider_payment_intent_id: "CAPTURE-1",
      amount_total: 990,
      currency: "USD"
    });
    await commerce.fulfillPaidProductPayment({
      provider: "paypal",
      product_slug: PRODUCT,
      email: EMAIL,
      provider_checkout_session_id: ORDER,
      provider_payment_intent_id: "CAPTURE-1",
      amount_total: 990,
      currency: "USD"
    });

    const snap = await snapshot();
    expect(snap.payments).toHaveLength(1);
    expect(snap.payments[0].status).toBe("paid");
    expect(snap.entitlements.filter((e) => e.source_payment_id === snap.payments[0].id)).toHaveLength(1);
  });

  it("已付订单可以查到有效权益（success 页依赖它）", async () => {
    const access = await commerce.getPaidProductLicenseAccessByCheckoutSessionId(ORDER, PRODUCT);
    expect(access).not.toBeNull();
    expect(access!.entitlement.status).toBe("active");
  });

  it("查不到的订单返回 null，不会伪造权益", async () => {
    const access = await commerce.getPaidProductLicenseAccessByCheckoutSessionId("NOT-EXIST", PRODUCT);
    expect(access).toBeNull();
  });
});

describe("commerce · 授权码", () => {
  it("同样的 (商品, 支付, 权益) 永远算出同一把码", () => {
    const a = licenses.buildLicenseKey(PRODUCT, "pay-1", "ent-1");
    const b = licenses.buildLicenseKey(PRODUCT, "pay-1", "ent-1");
    const c = licenses.buildLicenseKey(PRODUCT, "pay-2", "ent-1");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^SCL-LR(-[A-Z2-9]{4}){6}$/);
  });

  it("未登记前缀的商品会抛错（防止收款后拿不到码）", () => {
    expect(() => licenses.buildLicenseKey("unknown-product", "pay", "ent")).toThrow();
  });

  it("ensureProductLicenseKey 幂等：同 key_hash 只落一条", async () => {
    const snap = await snapshot();
    const entitlement = snap.entitlements.find((e) => e.source_payment_id === snap.payments[0].id)!;
    const key = licenses.buildLicenseKey(PRODUCT, snap.payments[0].id, entitlement.id);
    const input = {
      product_slug: PRODUCT,
      entitlement_id: entitlement.id,
      source_payment_id: snap.payments[0].id,
      key_hash: licenses.hashLicenseSecret(key),
      key_suffix: licenses.getLicenseKeySuffix(key),
      max_activations: 1
    };
    const first = await commerce.ensureProductLicenseKey(input);
    const second = await commerce.ensureProductLicenseKey(input);
    expect(second.id).toBe(first.id);
    expect((await snapshot()).keys).toHaveLength(1);
  });

  it("激活受 max_activations 限制；同设备重复激活只刷新 token", async () => {
    const snap = await snapshot();
    const keyRow = snap.keys[0];
    const key = licenses.buildLicenseKey(
      PRODUCT,
      snap.payments[0].id,
      snap.entitlements.find((e) => e.source_payment_id === snap.payments[0].id)!.id
    );

    const first = await commerce.activateProductLicense({
      product_slug: PRODUCT,
      key_hash: licenses.hashLicenseSecret(key),
      device_id_hash: licenses.buildDeviceIdHash("device-A"),
      token_hash: licenses.buildLicenseTokenHash("token-A")
    });
    expect(first.status).toBe("active");

    const again = await commerce.activateProductLicense({
      product_slug: PRODUCT,
      key_hash: licenses.hashLicenseSecret(key),
      device_id_hash: licenses.buildDeviceIdHash("device-A"),
      token_hash: licenses.buildLicenseTokenHash("token-A2")
    });
    expect(again.status).toBe("active");
    expect((await snapshot()).activations.filter((a) => a.license_key_id === keyRow.id)).toHaveLength(1);

    const secondDevice = await commerce.activateProductLicense({
      product_slug: PRODUCT,
      key_hash: licenses.hashLicenseSecret(key),
      device_id_hash: licenses.buildDeviceIdHash("device-B"),
      token_hash: licenses.buildLicenseTokenHash("token-B")
    });
    expect(secondDevice.status).toBe("activation_limit_reached");
  });

  it("verify 对有效 token 返回 active", async () => {
    const verified = await commerce.verifyProductLicenseToken({
      product_slug: PRODUCT,
      token_hash: licenses.buildLicenseTokenHash("token-A2"),
      device_id_hash: licenses.buildDeviceIdHash("device-A")
    });
    expect(verified.status).toBe("active");
  });

  it("退款撤权后 verify 立刻失效", async () => {
    await commerce.revokeProductAccessForPayment({ provider_checkout_session_id: ORDER });

    const snap = await snapshot();
    expect(snap.payments[0].status).toBe("refunded");
    expect(snap.entitlements.every((e) => e.status !== "active")).toBe(true);
    expect(snap.keys.every((k) => k.status !== "active")).toBe(true);
    expect(snap.activations.every((a) => a.status !== "active")).toBe(true);

    const verified = await commerce.verifyProductLicenseToken({
      product_slug: PRODUCT,
      token_hash: licenses.buildLicenseTokenHash("token-A2"),
      device_id_hash: licenses.buildDeviceIdHash("device-A")
    });
    expect(verified.status).toBe("inactive");
  });
});

process.on("exit", () => env.cleanup());
