import { getVisitorIp } from "@/lib/visitor-ip";

/**
 * 埋点接口的最小防护。
 *
 * 背景：/api/post-events 与 /api/tool-events 之前对匿名请求完全开放，
 * 任何人构造一个 POST 就能污染浏览量、转化漏斗（已实测可写入）。
 *
 * 这里做两件事：
 * 1. 同源校验：要求带 Origin 或 Referer，且 host 与请求 host 一致。
 *    浏览器发起的 fetch 一定带其中之一；脚本/爬虫通常不带或无意义，直接拒绝。
 * 2. 进程内限流：同一 IP 每分钟最多 N 次。serverless 多实例下不精确，
 *    但足以挡住批量刷量与误触发循环。
 */

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function normalizeHost(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

function sameHost(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return normalizeHost(a) === normalizeHost(b);
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestHost = request.headers.get("host");

  if (origin) {
    try {
      return sameHost(new URL(origin).host, requestHost);
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      return sameHost(new URL(referer).host, requestHost);
    } catch {
      return false;
    }
  }

  return false;
}

export function checkRateLimit(request: Request, limit: number) {
  const ip = getVisitorIp(request.headers) || "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
