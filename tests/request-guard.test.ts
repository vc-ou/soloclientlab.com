import { describe, expect, it } from "vitest";
import { checkRateLimit, isSameOriginRequest } from "@/app/api/_lib/request-guard";

function req(headers: Record<string, string>) {
  return new Request("https://www.soloclientlab.com/api/post-events", { method: "POST", headers });
}

describe("request-guard · 同源校验", () => {
  it("没有 Origin 与 Referer 的请求被拒绝（脚本/爬虫常见形态）", () => {
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com" }))).toBe(false);
  });

  it("同源 Origin 通过", () => {
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com", origin: "https://www.soloclientlab.com" }))).toBe(true);
  });

  it("跨源 Origin 被拒绝", () => {
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com", origin: "https://evil.example" }))).toBe(false);
  });

  it("只有 Referer 时按 Referer 判定", () => {
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com", referer: "https://www.soloclientlab.com/research/x" }))).toBe(true);
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com", referer: "https://evil.example/x" }))).toBe(false);
  });

  it("端口与协议差异不影响主机比对", () => {
    expect(isSameOriginRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
  });

  it("畸形的 Origin 不会抛错，按拒绝处理", () => {
    expect(isSameOriginRequest(req({ host: "www.soloclientlab.com", origin: "not a url" }))).toBe(false);
  });
});

describe("request-guard · 限流", () => {
  it("同一 IP 在窗口内超过上限后被拒", () => {
    const headers = { host: "www.soloclientlab.com", "x-forwarded-for": "203.0.113.10" };
    const limit = 3;
    expect(checkRateLimit(req(headers), limit)).toBe(true);
    expect(checkRateLimit(req(headers), limit)).toBe(true);
    expect(checkRateLimit(req(headers), limit)).toBe(true);
    expect(checkRateLimit(req(headers), limit)).toBe(false);
  });

  it("不同 IP 之间互不影响", () => {
    const a = { host: "www.soloclientlab.com", "x-forwarded-for": "203.0.113.20" };
    const b = { host: "www.soloclientlab.com", "x-forwarded-for": "203.0.113.21" };
    expect(checkRateLimit(req(a), 1)).toBe(true);
    expect(checkRateLimit(req(a), 1)).toBe(false);
    expect(checkRateLimit(req(b), 1)).toBe(true);
  });
});
