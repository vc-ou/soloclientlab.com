/**
 * leads 域 · 校准反馈（注意：feedback 表没有 email，不能并入"人"视图）
 */
import { randomUUID } from "node:crypto";
import {
  ADMIN_DB_TIMEOUT_MS,
  getReadSql,
  getWriteSql,
  mapFeedbackRow,
  markTestValue,
  readFeedbackRows,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldMirrorDatabaseToLocalFile,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb
} from "@/lib/platform";
import type { FeedbackFilters } from "@/lib/platform";
import { hasDatabaseUrl } from "@/lib/env";
import type { FeedbackEntry } from "@/lib/types";

export async function addFeedbackEntry(
  input: Omit<FeedbackEntry, "id" | "created_at">
) {
  const createdAt = new Date().toISOString();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into feedback (
        id, tool_slug, source_page, is_useful, problem_context, attachment_url, attachment_name, created_at
      ) values (
        ${randomUUID()}, ${input.tool_slug}, ${input.source_page ?? null}, ${input.is_useful},
        ${input.problem_context}, ${input.attachment_url ?? null}, ${input.attachment_name ?? null}, ${createdAt}
      )
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.feedback.unshift({
        id: randomUUID(),
        ...input,
        created_at: createdAt
      });
      await writeLocalDb(localDb);
    }
    return;
  }

  const db = await readLocalDb();
  db.feedback.unshift({
    id: randomUUID(),
    ...input,
    created_at: createdAt
  });
  await writeLocalDb(db);
}

export async function getFilteredFeedback(filters: FeedbackFilters): Promise<FeedbackEntry[]> {
  const db = shouldReadLiveAdminDb()
    ? {
        feedback: await readFeedbackRows()
      }
    : await readLocalDbSafe();

  return db.feedback.filter((entry) => {
    if (filters.tool_slug && entry.tool_slug !== filters.tool_slug) return false;
    if (filters.is_useful) {
      const matchesUseful = filters.is_useful === "yes" ? entry.is_useful : !entry.is_useful;
      if (!matchesUseful) return false;
    }
    if (filters.has_attachment) {
      const hasAttachment = Boolean(entry.attachment_url);
      if (filters.has_attachment === "yes" && !hasAttachment) return false;
      if (filters.has_attachment === "no" && hasAttachment) return false;
    }
    if (filters.source_page && entry.source_page !== filters.source_page) return false;
    return true;
  });
}

export async function getFeedbackSourcePageOptions(): Promise<string[]> {
  if (shouldReadLiveAdminDb()) {
    const rows = await readFeedbackRows();
    return Array.from(new Set(rows.map((entry) => entry.source_page).filter((value): value is string => Boolean(value))));
  }

  const db = await readLocalDbSafe();
  return Array.from(new Set(db.feedback.map((entry) => entry.source_page).filter((value): value is string => Boolean(value))));
}
