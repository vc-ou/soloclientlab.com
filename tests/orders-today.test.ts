import { describe, expect, it } from "vitest";
import { useIsolatedDataDir } from "./setup";

const env = useIsolatedDataDir();

const commerce = await import("@/lib/domains/commerce");
const analytics = await import("@/lib/domains/analytics");
const platform = await import("@/lib/platform");

describe("commerce · 订单视图", () => {
  it("空库时返回空列表，不抛错", async () => {
    expect(await commerce.getOrderRows()).toEqual([]);
  });

  it("已付款但无权益的订单被标为最高优先级", async () => {
    const db = await platform.readDb();
    db.product_payments.unshift({
      id: "pay-orphan",
      product_slug: "leadradar",
      provider: "paypal",
      status: "paid",
      email: "orphan@example.com",
      amount_total: 990,
      currency: "USD",
      provider_checkout_session_id: "ORD-ORPHAN",
      created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
      updated_at: new Date().toISOString(),
      paid_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
      metadata: {}
    } as never);
    await platform.writeLocalDb(db);

    const rows = await commerce.getOrderRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].flags).toContain("paid_without_entitlement");
    expect(rows[0].priority).toBe(0);
    expect(commerce.getOrderFlagLabel("paid_without_entitlement")).toContain("已付款");
  });

  it("正常履约的订单没有异常标记，且能看到授权码与激活数", async () => {
    const licenses = await import("@/lib/licenses");
    await commerce.fulfillPaidProductPayment({
      provider: "paypal",
      product_slug: "leadradar",
      email: "ok@example.com",
      provider_checkout_session_id: "ORD-OK",
      amount_total: 990,
      currency: "USD"
    });
    const rows = await commerce.getOrderRows();
    const ok = rows.find((row) => row.payment.provider_checkout_session_id === "ORD-OK")!;
    const key = licenses.buildLicenseKey("leadradar", ok.payment.id, ok.entitlement!.id);
    await commerce.ensureProductLicenseKey({
      product_slug: "leadradar",
      entitlement_id: ok.entitlement!.id,
      source_payment_id: ok.payment.id,
      key_hash: licenses.hashLicenseSecret(key),
      key_suffix: licenses.getLicenseKeySuffix(key)
    });
    await commerce.activateProductLicense({
      product_slug: "leadradar",
      key_hash: licenses.hashLicenseSecret(key),
      device_id_hash: licenses.buildDeviceIdHash("device-x"),
      token_hash: licenses.buildLicenseTokenHash("token-x")
    });

    const refreshed = (await commerce.getOrderRows()).find((row) => row.payment.provider_checkout_session_id === "ORD-OK")!;
    expect(refreshed.flags).toEqual([]);
    expect(refreshed.activeActivationCount).toBe(1);
    expect(refreshed.licenseKey?.key_suffix).toBeTruthy();
  });

  it("待付款超过 24 小时会被标记，排序在正常订单之前", async () => {
    const db = await platform.readDb();
    db.product_payments.unshift({
      id: "pay-stale",
      product_slug: "leadradar",
      provider: "paypal",
      status: "pending",
      amount_total: 990,
      currency: "USD",
      provider_checkout_session_id: "ORD-STALE",
      created_at: new Date(Date.now() - 30 * 3600_000).toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {}
    } as never);
    await platform.writeLocalDb(db);

    const rows = await commerce.getOrderRows();
    const stale = rows.find((row) => row.payment.provider_checkout_session_id === "ORD-STALE")!;
    expect(stale.flags).toContain("pending_stale");
    expect(rows.findIndex((row) => row.payment.provider_checkout_session_id === "ORD-STALE")).toBeLessThan(
      rows.findIndex((row) => row.payment.provider_checkout_session_id === "ORD-OK")
    );
  });
});

describe("analytics · 今日快照", () => {
  it("四个数字齐备，且每个都带上周对比", async () => {
    const snapshot = await analytics.getTodaySnapshot();
    expect(snapshot.metrics.map((m) => m.key)).toEqual(["views", "leads", "paid", "customers"]);
    for (const metric of snapshot.metrics) {
      expect(typeof metric.value).toBe("number");
      expect(typeof metric.previous).toBe("number");
    }
    expect(snapshot.metrics.find((m) => m.key === "paid")!.unit).toBe("money");
  });

  it("四条队列齐备，且把待付款与异常订单收进去", async () => {
    const snapshot = await analytics.getTodaySnapshot();
    expect(snapshot.queues.map((q) => q.key)).toEqual(["stuck_payments", "new_leads", "drafts", "anomalies"]);

    const stuck = snapshot.queues.find((q) => q.key === "stuck_payments")!;
    expect(stuck.count).toBeGreaterThanOrEqual(1);
    expect(stuck.items[0].href).toMatch(/^\/admin\/orders\//);

    const anomalies = snapshot.queues.find((q) => q.key === "anomalies")!;
    expect(anomalies.count).toBeGreaterThanOrEqual(1);
  });

  it("队列为空时给出下一步建议而不是空白", async () => {
    const snapshot = await analytics.getTodaySnapshot();
    for (const queue of snapshot.queues) {
      if (queue.count === 0) expect(queue.emptyHint.length).toBeGreaterThan(10);
    }
  });
});

process.on("exit", () => env.cleanup());
