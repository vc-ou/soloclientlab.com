/**
 * 共享读 —— 筛选器与按需聚合读（被判为平台能力，因为多个域共用）
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

import { getReadSql } from "@/lib/postgres";
import type { Database, Subscriber, WaitlistEntry } from "@/lib/types";
import {
  isMissingOptionalTable,
  mapFeedbackRow,
  mapPostEventRow,
  mapPostRow,
  mapSubscriberRow,
  mapWaitlistRow
} from "./rows";
import type { FeedbackRow, PostEventRow, PostRow, SubscriberFilters, WaitlistFilters } from "./types";
import { ADMIN_DB_TIMEOUT_MS, readWithRetry, withTimeout } from "./sql";

export function filterSubscribers(subscribers: Subscriber[], filters: SubscriberFilters) {
  return subscribers.filter((subscriber) => {
    if (filters.source_type && subscriber.source_type !== filters.source_type) return false;
    if (filters.lead_magnet && subscriber.lead_magnet !== filters.lead_magnet) return false;
    if (filters.persona_tag && subscriber.persona_tag !== filters.persona_tag) return false;
    if (filters.topic_tag && subscriber.topic_tag !== filters.topic_tag) return false;
    if (filters.status && subscriber.status !== filters.status) return false;
    return true;
  });
}

export async function readWaitlistRows(filters: WaitlistFilters = {}) {
  const sql = getReadSql();
  const waitlists = await readWithRetry(
    "Filtered waitlists read",
    () => withTimeout(sql<WaitlistEntry[]>`
      select * from waitlists
      where (${filters.project_name ?? null}::text is null or project_name = ${filters.project_name ?? null})
        and (${filters.page_slug ?? null}::text is null or page_slug = ${filters.page_slug ?? null})
        and (${filters.interest_tag ?? null}::text is null or interest_tag = ${filters.interest_tag ?? null})
        and (${filters.source_page ?? null}::text is null or source_page = ${filters.source_page ?? null})
      order by created_at desc
    `, ADMIN_DB_TIMEOUT_MS)
  );

  return waitlists.map(mapWaitlistRow);
}

export async function readFeedbackRows() {
  const sql = getReadSql();

  try {
    const feedback = await readWithRetry(
      "Feedback read",
      () => withTimeout(sql<FeedbackRow[]>`
        select * from feedback
        order by created_at desc
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return feedback.map(mapFeedbackRow);
  } catch (error) {
    if (isMissingOptionalTable(error, "feedback")) {
      console.warn("feedback table is not available yet, using empty feedback data.");
      return [];
    }

    throw error;
  }
}

export async function readAdminPostPerformanceData(): Promise<Pick<Database, "posts" | "post_events" | "subscribers">> {
  const sql = getReadSql();
  const postEventsPromise = withTimeout(
    sql<PostEventRow[]>`select * from post_events order by created_at desc`,
    ADMIN_DB_TIMEOUT_MS
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "post_events")) {
      console.warn("post_events table is not available yet, using empty analytics events.");
      return [] as PostEventRow[];
    }

    throw error;
  });

  const [posts, postEvents, subscribers] = await readWithRetry(
    "Post performance read",
    () => withTimeout(Promise.all([
      sql<PostRow[]>`select * from posts order by published_at desc nulls last, created_at desc`,
      postEventsPromise,
      sql<Subscriber[]>`select * from subscribers order by created_at desc`
    ]), ADMIN_DB_TIMEOUT_MS)
  );

  return {
    posts: posts.map(mapPostRow),
    post_events: postEvents.map(mapPostEventRow),
    subscribers: subscribers.map(mapSubscriberRow)
  };
}
