import { describe, expect, it } from "vitest";
import { resolvePostCta } from "@/lib/post-cta";

describe("resolvePostCta", () => {
  it("returns the series card for autopsy-style posts", () => {
    const cta = resolvePostCta({ cta_type: "series", cta_target: "/research" });

    expect(cta).toMatchObject({
      href: "/research",
      label: "Read the next autopsy"
    });
    expect(cta?.description.length).toBeGreaterThan(80);
  });

  it("returns null when no target is configured", () => {
    expect(resolvePostCta({ cta_type: "series" })).toBeNull();
    expect(resolvePostCta({ cta_type: "series", cta_target: "   " })).toBeNull();
  });

  it("rejects off-site and protocol-relative targets", () => {
    expect(resolvePostCta({ cta_type: "product", cta_target: "https://example.com" })).toBeNull();
    expect(resolvePostCta({ cta_type: "product", cta_target: "//evil.example" })).toBeNull();
  });

  it("downgrades retired /resources targets to the guide index", () => {
    const cta = resolvePostCta({
      cta_type: "lead_magnet",
      cta_target: "/resources/client-acquisition-report"
    });

    expect(cta?.href).toBe("/research");
    expect(cta?.label).toBe("Browse practical guides");
  });

  it("falls back to generic copy for an unknown type but keeps the target", () => {
    const cta = resolvePostCta({ cta_type: "not-a-real-type", cta_target: "/products" });

    expect(cta?.href).toBe("/products");
    expect(cta?.label).toBe("Continue");
  });
});
