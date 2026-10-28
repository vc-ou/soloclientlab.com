export { hasDatabaseUrl } from "@/lib/env";
/**
 * 平台出口 —— 连接池之外的共享基础设施：存储、SQL 保护、建表、读、快照
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

export { getReadSql, getWriteSql } from "@/lib/postgres";
export * from "./types";
export * from "./rows";
export * from "./sql";
export { ensureDbFile, readLocalDb, readLocalDbSafe, writeLocalDb, shouldMirrorDatabaseToLocalFile, shouldReadLiveAdminDb, shouldReadLiveProducts } from "./storage";
export { ensureProductLicenseTables, ensureSubscriberNoteColumn, ensurePostsTable, ensureProductsTable, ensureProductPaymentsEmailNullable } from "./tables";
export { filterSubscribers, readWaitlistRows, readFeedbackRows, readAdminPostPerformanceData } from "./reads";
export { readDb, getSnapshot } from "./snapshot";
export { resetCacheUnsafe } from "./cache";
export { addDaysIso } from "./time";
export { rethrowInProduction } from "./errors";
export { enforceRateLimit } from "./rate-limit";
