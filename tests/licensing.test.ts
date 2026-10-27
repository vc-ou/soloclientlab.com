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
