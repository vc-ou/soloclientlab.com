import "server-only";

import postgres from "postgres";
import { getDatabaseUrl, hasDatabaseUrl } from "@/lib/env";

declare global {
  var __vcAiLabReadSql: ReturnType<typeof postgres> | undefined;
  var __vcAiLabWriteSql: ReturnType<typeof postgres> | undefined;
}

export function getReadSql() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__vcAiLabReadSql) {
    globalThis.__vcAiLabReadSql = postgres(getDatabaseUrl(), {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      connection: {
        statement_timeout: 10000
      }
    });
  }

  return globalThis.__vcAiLabReadSql;
}

export function getWriteSql() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__vcAiLabWriteSql) {
    globalThis.__vcAiLabWriteSql = postgres(getDatabaseUrl(), {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      connection: {
        statement_timeout: 3000
      }
    });
  }

  return globalThis.__vcAiLabWriteSql;
}

export function getSql() {
  return getReadSql();
}
