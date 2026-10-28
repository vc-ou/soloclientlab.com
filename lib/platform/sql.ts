/**
 * SQL 执行保护 —— 超时、重试、可重试错误码
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

export const ADMIN_DB_TIMEOUT_MS = 10000;

export async function withTimeout<T>(promise: Promise<T>, ms = 8000) {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Database read timed out after ${ms}ms`)), ms);
    })
  ]);
}

export async function withDatabaseTimeout<T>(promise: Promise<T>, ms = 4000) {
  return withTimeout(promise, ms);
}

let productLicenseTablesReady: Promise<void> | null = null;

export const retryableDatabaseErrorCodes = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_DESTROYED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENETUNREACH",
  "ETIMEDOUT",
  "EPIPE"
]);

export function isRetryableDatabaseError(error: unknown) {
  const databaseError = error as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  } | undefined;
  const code = databaseError?.code ?? databaseError?.cause?.code;
  const message = `${databaseError?.message ?? ""} ${databaseError?.cause?.message ?? ""}`.toLowerCase();

  return Boolean(
    (code && retryableDatabaseErrorCodes.has(code)) ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("connection closed") ||
    message.includes("connection terminated")
  );
}

export async function readWithRetry<T>(label: string, read: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (retries <= 0 || !isRetryableDatabaseError(error)) {
      throw error;
    }

    console.warn(`${label} failed, retrying once:`, error);
    return readWithRetry(label, read, retries - 1);
  }
}
