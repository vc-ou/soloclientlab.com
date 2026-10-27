/**
 * content 域 · 辅助页面实现（前台已下线，仅后台与历史数据）
 */
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  getReadSql,
  getWriteSql,
  ADMIN_DB_TIMEOUT_MS,
  mapResourceRow,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb,
  ResourcePerformance
} from "@/lib/platform";
import type {
  Resource
} from "@/lib/types";
export async function getResourceBySlug(slug: string) {
  if (process.env.NODE_ENV !== "production") {
    const db = await readLocalDb();
    return db.resources.find((resource) => resource.slug === slug && resource.status === "published");
  }

  if (hasDatabaseUrl()) {
    try {
      const sql = getReadSql();
      const resources = await readWithRetry(
        "Public resource read",
        () => withTimeout(sql<Resource[]>`
          select * from resources
          where slug = ${slug} and status = 'published'
          limit 1
        `)
      );

      return resources[0] ? mapResourceRow(resources[0]) : undefined;
    } catch (error) {
      console.error("Falling back to local resource:", error);
    }
  }

  const db = await readLocalDbSafe();
  return db.resources.find((resource) => resource.slug === slug && resource.status === "published");
}

export async function getResourceById(id: string) {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const resources = await readWithRetry(
      "Admin resource read",
      () => withTimeout(sql<Resource[]>`
        select * from resources
        where id = ${id}
        limit 1
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return resources[0] ? mapResourceRow(resources[0]) : undefined;
  }

  const db = await readLocalDbSafe();
  return db.resources.find((resource) => resource.id === id);
}

export async function saveResource(
  input: Partial<Resource> & Pick<Resource, "title" | "slug" | "type" | "status">
) {
  if (hasDatabaseUrl()) {
    const sql = getWriteSql();
    const now = new Date().toISOString();
    const duplicate = await sql<{ id: string }[]>`
      select id from resources where slug = ${input.slug} and id <> ${input.id ?? ""} limit 1
    `;
    if (duplicate.length) throw new Error("Slug must be unique");

    if (input.id) {
      const existing = await sql<{ id: string }[]>`select id from resources where id = ${input.id} limit 1`;
      if (!existing.length) throw new Error("Resource not found");

      await sql`
        update resources
        set
          title = ${input.title},
          slug = ${input.slug},
          type = ${input.type},
          audience = ${input.audience ?? null},
          related_topic = ${input.related_topic ?? null},
          landing_page_slug = ${input.landing_page_slug ?? null},
          delivery_mode = ${input.delivery_mode ?? null},
          delivery_url = ${input.delivery_url ?? null},
          status = ${input.status},
          updated_at = ${now}
        where id = ${input.id}
      `;
    } else {
      await sql`
        insert into resources (
          id, title, slug, type, audience, related_topic, landing_page_slug,
          delivery_mode, delivery_url, status, created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.title}, ${input.slug}, ${input.type}, ${input.audience ?? null},
          ${input.related_topic ?? null}, ${input.landing_page_slug ?? null},
          ${input.delivery_mode ?? null}, ${input.delivery_url ?? null}, ${input.status}, ${now}, ${now}
        )
      `;
    }

    return;
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const duplicate = db.resources.find((item) => item.slug === input.slug && item.id !== input.id);
  if (duplicate) throw new Error("Slug must be unique");

  if (input.id) {
    const existing = db.resources.find((item) => item.id === input.id);
    if (!existing) throw new Error("Resource not found");
    Object.assign(existing, input, { updated_at: now });
  } else {
    db.resources.unshift({
      id: randomUUID(),
      title: input.title,
      slug: input.slug,
      type: input.type,
      audience: input.audience,
      related_topic: input.related_topic,
      landing_page_slug: input.landing_page_slug,
      delivery_mode: input.delivery_mode,
      delivery_url: input.delivery_url,
      status: input.status,
      created_at: now,
      updated_at: now
    });
  }

  await writeLocalDb(db);
}

export async function getResourcePerformance(): Promise<ResourcePerformance[]> {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const rows = await readWithRetry(
      "Resource performance read",
      () => withTimeout(sql<(Resource & { subscriber_count: number; active_subscriber_count: number })[]>`
        select
          resources.*,
          count(subscribers.id) filter (
            where subscribers.status = 'active' and subscribers.lead_magnet = resources.slug
          )::int as subscriber_count,
          (select count(*)::int from subscribers where status = 'active') as active_subscriber_count
        from resources
        left join subscribers on subscribers.lead_magnet = resources.slug
        group by resources.id
        order by resources.created_at desc
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return rows.map((row) => {
      const resource = mapResourceRow(row);
      return {
        ...resource,
        subscriberCount: row.subscriber_count,
        conversionRate: row.active_subscriber_count ? row.subscriber_count / row.active_subscriber_count : 0
      };
    });
  }

  const db = await readLocalDbSafe();
  const activeSubscribers = db.subscribers.filter((subscriber) => subscriber.status === "active");

  return db.resources.map((resource) => {
    const subscriberCount = activeSubscribers.filter((subscriber) => subscriber.lead_magnet === resource.slug).length;
    const conversionRate = activeSubscribers.length
      ? subscriberCount / activeSubscribers.length
      : 0;

    return {
      ...resource,
      subscriberCount,
      conversionRate
    };
  });
}
