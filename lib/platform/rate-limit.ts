import { headers } from "next/headers";

/**
 * 进程内限流。用于 Server Action（表单）——它们拿不到 Request 对象，
 * 只能从 headers() 里取 IP。
 *
 * 局限：serverless 多实例下每个实例各有一份计数，不是全局精确值。
 * 目的不是"精确配额"，而是挡住脚本批量提交与误触发的循环。
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(headerValue: string | null, host: string | null) {
  const first = headerValue?.split(",")[0]?.trim();
  if (first) return first.replace(/^::ffff:/i, "");
  return host ?? "unknown";
}

export async function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const headerList = await headers();
  const ip = clientIp(
    headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip"),
    headerList.get("host")
  );

  const bucketKey = `${input.key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + input.windowMs });
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count <= input.limit) return { ok: true };

  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}
