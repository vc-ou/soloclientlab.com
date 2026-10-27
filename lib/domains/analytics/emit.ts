/**
 * analytics 域 · 事件写入（其他域唯一允许横向调用的入口，例外 E-001）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { isInternalTrialEvent } from "@/lib/analytics-filters";
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  readLocalDb,
  shouldMirrorDatabaseToLocalFile,
  writeLocalDb,
  getWriteSql
} from "@/lib/platform";
import type {
  PostEvent,
  TrialEvent
} from "@/lib/types";
export async function trackPostEvent(input: TrackPostEventInput) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const safePath = input.path?.slice(0, 300);
  const safeReferrer = input.referrer?.slice(0, 500);
  const safeTargetUrl = input.targetUrl?.slice(0, 500);

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    try {
      await writeSql`
        insert into post_events (
          id, post_id, post_slug, event_type, path, referrer, target_url, created_at
        ) values (
          ${randomUUID()}, ${input.postId ?? null}, ${input.postSlug}, ${input.eventType},
          ${safePath ?? null}, ${safeReferrer ?? null}, ${safeTargetUrl ?? null}, ${createdAt}
        )
      `;
    } catch (error) {
      const databaseError = error as { code?: string; message?: string } | undefined;
      if (databaseError?.code !== "42703" && !databaseError?.message?.includes("target_url")) {
        throw error;
      }

      await writeSql`
        insert into post_events (
          id, post_id, post_slug, event_type, path, referrer, created_at
        ) values (
          ${randomUUID()}, ${input.postId ?? null}, ${input.postSlug}, ${input.eventType},
          ${safePath ?? null}, ${safeReferrer ?? null}, ${createdAt}
        )
      `;
    }

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.post_events.unshift({
        id: randomUUID(),
        post_id: input.postId,
        post_slug: input.postSlug,
        event_type: input.eventType,
        path: safePath,
        referrer: safeReferrer,
        target_url: safeTargetUrl,
        created_at: createdAt
      });
      await writeLocalDb(localDb);
    }
    return;
  }

  const db = await readLocalDb();
  db.post_events.unshift({
    id: randomUUID(),
    post_id: input.postId,
    post_slug: input.postSlug,
    event_type: input.eventType,
    path: safePath,
    referrer: safeReferrer,
    target_url: safeTargetUrl,
    created_at: createdAt
  });
  await writeLocalDb(db);
}

export async function trackTrialEvent(input: Omit<TrialEvent, "id" | "created_at"> & { createdAt?: string }) {
  if (isInternalTrialEvent(input)) {
    return;
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const safePath = input.path?.slice(0, 300);
  const safeReferrer = input.referrer?.slice(0, 500);
  const safeSourcePage = input.source_page?.slice(0, 300);
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into trial_events (
        id, product_slug, event_type, email, source_page, path, referrer, metadata, created_at
      ) values (
        ${randomUUID()}, ${input.product_slug}, ${input.event_type}, ${input.email?.toLowerCase() ?? null},
        ${safeSourcePage ?? null}, ${safePath ?? null}, ${safeReferrer ?? null},
        ${writeSql.json(metadataJson)}, ${createdAt}
      )
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.trial_events.unshift({
        id: randomUUID(),
        product_slug: input.product_slug,
        event_type: input.event_type,
        email: input.email?.toLowerCase(),
        source_page: safeSourcePage,
        path: safePath,
        referrer: safeReferrer,
        metadata: metadataJson,
        created_at: createdAt
      });
      await writeLocalDb(localDb);
    }
    return;
  }

  const db = await readLocalDb();
  db.trial_events.unshift({
    id: randomUUID(),
    product_slug: input.product_slug,
    event_type: input.event_type,
    email: input.email?.toLowerCase(),
    source_page: safeSourcePage,
    path: safePath,
    referrer: safeReferrer,
    metadata: metadataJson,
    created_at: createdAt
  });
  await writeLocalDb(db);
}

type TrackPostEventInput = {
  postId?: string;
  postSlug: string;
  eventType: PostEvent["event_type"];
  path?: string;
  referrer?: string;
  targetUrl?: string;
  createdAt?: string;
};
