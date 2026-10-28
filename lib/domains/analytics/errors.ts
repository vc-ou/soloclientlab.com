import { randomUUID } from "node:crypto";
import { getReadSql, getWriteSql, readWithRetry, withTimeout, hasDatabaseUrl } from "@/lib/platform";

/**
 * 轻量错误监控。
 *
 * 不引入 Sentry 之类的外部服务（又要账号、又要 SDK、还要处理隐私），
 * 直接把服务端错误写进一张小表，并在后台「今日」页露出最近 24 小时的数量。
 *
 * 写入是 best-effort：任何失败都只打日志，绝不影响主流程。
 */

const ADMIN_READ_TIMEOUT_MS = 20_000;

export type ErrorLogRow = {
  id: string;
  scope: string;
  message: string;
  detail: Record<string, unknown>;
  created_at: string;
};

let tableReady: Promise<void> | null = null;

async function ensureErrorLogsTable() {
  if (!hasDatabaseUrl()) return;
  tableReady ??= (async () => {
    const sql = getWriteSql();
    await sql`
      create table if not exists error_logs (
        id text primary key,
        scope text not null,
        message text not null,
        detail jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `;
    await sql`create index if not exists idx_error_logs_created_at on error_logs (created_at desc)`;
  })().catch((error) => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export async function logError(input: {
  scope: string;
  error: unknown;
  detail?: Record<string, unknown>;
}) {
  const message =
    input.error instanceof Error ? input.error.message : String(input.error ?? "unknown error");
  const detail = input.detail ?? {};

  console.error(`[${input.scope}] ${message}`, detail);

  if (!hasDatabaseUrl()) return;

  try {
    await ensureErrorLogsTable();
    const sql = getWriteSql();
    await sql`
      insert into error_logs (id, scope, message, detail, created_at)
      values (${randomUUID()}, ${input.scope}, ${message.slice(0, 2000)},
        ${sql.json(JSON.parse(JSON.stringify(detail)))}, ${new Date().toISOString()})
    `;
  } catch (error) {
    console.error("[error_logs] failed to persist error", error);
  }
}

export async function getRecentErrors(limit = 20): Promise<ErrorLogRow[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    await ensureErrorLogsTable();
    const sql = getReadSql();
    return await readWithRetry("Recent errors read", () =>
      withTimeout(sql<ErrorLogRow[]>`
        select id, scope, message, detail, created_at
        from error_logs order by created_at desc limit ${limit}
      `, ADMIN_READ_TIMEOUT_MS)
    );
  } catch (error) {
    console.error("[error_logs] read failed", error);
    return [];
  }
}

export async function countErrorsSince(iso: string): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  try {
    await ensureErrorLogsTable();
    const sql = getReadSql();
    const rows = await withTimeout(sql<{ n: number }[]>`
      select count(*)::int as n from error_logs where created_at >= ${iso}
    `, ADMIN_READ_TIMEOUT_MS);
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}
