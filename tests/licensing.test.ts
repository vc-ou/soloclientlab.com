import { describe, expect, it } from "vitest";
import { useIsolatedDataDir } from "./setup";

const env = useIsolatedDataDir();

const licenses = await import("@/lib/licenses");

describe("licensing · 商品前缀与白名单", () => {
  it("三个已发布商品都在白名单里", () => {
    const slugs = licenses.LICENSED_PRODUCT_SLUGS;
    expect(slugs).toContain("leadradar");
    expect(slugs).toContain("needradar-workflow-lab");
    expect(slugs).toContain("opportunity-intelligence-agent");
  });

  it("isLicensedProduct 接受已知商品、拒绝未知与非法输入", () => {
    expect(licenses.isLicensedProduct("opportunity-intelligence-agent")).toBe(true);
    expect(licenses.isLicensedProduct("leadradar")).toBe(true);
    expect(licenses.isLicensedProduct("some-unreleased-product")).toBe(false);
    expect(licenses.isLicensedProduct("")).toBe(false);
    expect(licenses.isLicensedProduct(null)).toBe(false);
    expect(licenses.isLicensedProduct(123)).toBe(false);
    // 原型链上的键不应被误判
    expect(licenses.isLicensedProduct("toString")).toBe(false);
  });

  it("每个商品有独立前缀，且格式稳定", () => {
    expect(licenses.buildLicenseKey("leadradar", "pay-1", "ent-1")).toMatch(/^SCL-LR(-[A-Z2-9]{4}){6}$/);
    expect(licenses.buildLicenseKey("needradar-workflow-lab", "pay-1", "ent-1")).toMatch(/^SCL-NR(-[A-Z2-9]{4}){6}$/);
    expect(licenses.buildLicenseKey("opportunity-intelligence-agent", "pay-1", "ent-1")).toMatch(/^SCL-OI(-[A-Z2-9]{4}){6}$/);
  });

  it("同一输入跨商品不产生相同码（前缀之外的主体也不同）", () => {
    const a = licenses.buildLicenseKey("leadradar", "pay-1", "ent-1");
    const b = licenses.buildLicenseKey("opportunity-intelligence-agent", "pay-1", "ent-1");
    expect(a).not.toBe(b);
    expect(a.slice(7)).not.toBe(b.slice(7));
  });

  it("未知商品拒绝发码，避免收款后拿不到授权码", () => {
    expect(() => licenses.buildLicenseKey("unknown-product", "pay", "ent")).toThrow();
  });
});

process.on("exit", () => env.cleanup());

describe("licensing · 签名密钥来源", () => {
  // @types/node 把 NODE_ENV 标成只读，测试里需要临时改写，因此走可写视图
  const env = process.env as Record<string, string | undefined>;
  const originalSecret = env.LICENSE_SIGNING_SECRET;
  const originalPayPal = env.PAYPAL_CLIENT_SECRET;
  const originalEnv = env.NODE_ENV;

  function restore() {
    if (originalSecret === undefined) delete env.LICENSE_SIGNING_SECRET;
    else env.LICENSE_SIGNING_SECRET = originalSecret;
    if (originalPayPal === undefined) delete env.PAYPAL_CLIENT_SECRET;
    else env.PAYPAL_CLIENT_SECRET = originalPayPal;
    if (originalEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = originalEnv;
  }

  it("生产环境缺少 LICENSE_SIGNING_SECRET 时直接报错（不回退到 PayPal 密钥）", () => {
    try {
      delete env.LICENSE_SIGNING_SECRET;
      env.PAYPAL_CLIENT_SECRET = "paypal-secret-should-not-be-used";
      env.NODE_ENV = "production";
      expect(() => licenses.buildLicenseKey("leadradar", "p", "e")).toThrow(/LICENSE_SIGNING_SECRET/);
    } finally {
      restore();
    }
  });

  it("配置了独立密钥后，生产环境正常出码，且与 PayPal 密钥无关", () => {
    try {
      env.LICENSE_SIGNING_SECRET = "dedicated-secret";
      env.PAYPAL_CLIENT_SECRET = "paypal-secret";
      env.NODE_ENV = "production";
      const key = licenses.buildLicenseKey("leadradar", "p", "e");

      env.PAYPAL_CLIENT_SECRET = "rotated-paypal-secret";
      expect(licenses.buildLicenseKey("leadradar", "p", "e")).toBe(key);
    } finally {
      restore();
    }
  });
});
