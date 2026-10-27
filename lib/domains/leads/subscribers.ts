/**
 * leads 域 · 订阅者
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  ADMIN_DB_TIMEOUT_MS,
  ensureSubscriberNoteColumn,
  filterSubscribers,
  mapSubscriberRow,
  markTestValue,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb,
  getReadSql,
  getWriteSql,
  SubscriberFilters
} from "@/lib/platform";
import type {
  Subscriber
} from "@/lib/types";
export async function saveSubscriber(
  input: Omit<Subscriber, "id" | "created_at" | "updated_at" | "status"> & {
    status?: Subscriber["status"];
  }
) {
  if (hasDatabaseUrl()) {
    await ensureSubscriberNoteColumn();
    const writeSql = getWriteSql();
    const now = new Date().toISOString();
    const email = input.email.toLowerCase();
    const personaTag = markTestValue(input.persona_tag);
    const topicTag = markTestValue(input.topic_tag);

    await writeSql`
      insert into subscribers (
        id, email, source_page, source_type, lead_magnet, persona_tag,
        topic_tag, note, status, created_at, updated_at
      ) values (
        ${randomUUID()}, ${email}, ${input.source_page ?? null}, ${input.source_type ?? null},
        ${input.lead_magnet ?? null}, ${personaTag ?? null}, ${topicTag ?? null}, ${input.note ?? null},
        ${input.status ?? "active"}, ${now}, ${now}
      )
      on conflict (email) do update set
        source_page = coalesce(excluded.source_page, subscribers.source_page),
        source_type = coalesce(excluded.source_type, subscribers.source_type),
        lead_magnet = coalesce(excluded.lead_magnet, subscribers.lead_magnet),
        persona_tag = coalesce(excluded.persona_tag, subscribers.persona_tag),
        topic_tag = coalesce(excluded.topic_tag, subscribers.topic_tag),
        note = coalesce(excluded.note, subscribers.note),
        status = excluded.status,
        updated_at = excluded.updated_at
    `;
    return;
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const email = input.email.toLowerCase();
  const personaTag = markTestValue(input.persona_tag);
  const topicTag = markTestValue(input.topic_tag);
  const existing = db.subscribers.find((item) => item.email === email);

  if (existing) {
    existing.source_page = input.source_page ?? existing.source_page;
    existing.source_type = input.source_type ?? existing.source_type;
    existing.lead_magnet = input.lead_magnet ?? existing.lead_magnet;
    existing.persona_tag = personaTag ?? existing.persona_tag;
    existing.topic_tag = topicTag ?? existing.topic_tag;
    existing.note = input.note ?? existing.note;
    existing.status = input.status ?? existing.status;
    existing.updated_at = now;
  } else {
    db.subscribers.unshift({
      id: randomUUID(),
      email,
      source_page: input.source_page,
      source_type: input.source_type,
      lead_magnet: input.lead_magnet,
      persona_tag: personaTag,
      topic_tag: topicTag,
      note: input.note,
      status: input.status ?? "active",
      created_at: now,
      updated_at: now
    });
  }

  await writeLocalDb(db);
}

export async function getSubscriberByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  if (hasDatabaseUrl()) {
    const sql = getReadSql();
    const rows = await withTimeout(sql<Subscriber[]>`
      select * from subscribers
      where email = ${normalizedEmail}
      limit 1
    `, 1500);
    return rows[0] ? mapSubscriberRow(rows[0]) : undefined;
  }

  const db = await readLocalDb();
  return db.subscribers.find((item) => item.email === normalizedEmail);
}

export async function updateSubscriberNote(id: string, note: string) {
  const normalizedNote = note.trim();
  const now = new Date().toISOString();

  if (hasDatabaseUrl()) {
    await ensureSubscriberNoteColumn();
    const sql = getWriteSql();
    await sql`
      update subscribers
      set note = ${normalizedNote || null}, updated_at = ${now}
      where id = ${id}
    `;
    return;
  }

  const db = await readLocalDb();
  const existing = db.subscribers.find((item) => item.id === id);
  if (!existing) throw new Error("Subscriber not found");
  existing.note = normalizedNote || undefined;
  existing.updated_at = now;
  await writeLocalDb(db);
}

export async function deleteSubscriberById(id: string) {
  if (hasDatabaseUrl()) {
    await ensureSubscriberNoteColumn();
    const sql = getWriteSql();
    await sql`delete from subscribers where id = ${id}`;
    return;
  }

  const db = await readLocalDb();
  const nextSubscribers = db.subscribers.filter((item) => item.id !== id);
  if (nextSubscribers.length === db.subscribers.length) {
    throw new Error("Subscriber not found");
  }
  db.subscribers = nextSubscribers;
  await writeLocalDb(db);
}

export async function getFilteredSubscribers(filters: SubscriberFilters): Promise<Subscriber[]> {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const subscribers = await readWithRetry(
      "Filtered subscribers read",
      () => withTimeout(sql<Subscriber[]>`
        select * from subscribers
        where (${filters.source_type ?? null}::text is null or source_type = ${filters.source_type ?? null})
          and (${filters.lead_magnet ?? null}::text is null or lead_magnet = ${filters.lead_magnet ?? null})
          and (${filters.persona_tag ?? null}::text is null or persona_tag = ${filters.persona_tag ?? null})
          and (${filters.topic_tag ?? null}::text is null or topic_tag = ${filters.topic_tag ?? null})
          and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
        order by created_at desc
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return subscribers.map(mapSubscriberRow);
  }

  const db = await readLocalDbSafe();

  return filterSubscribers(db.subscribers, filters);
}

export async function getSubscriberLeadMagnetOptions() {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Subscriber lead magnet options read",
        () => withTimeout(sql<{ lead_magnet: string | null }[]>`
          select distinct lead_magnet
          from subscribers
          where lead_magnet is not null and lead_magnet <> ''
          order by lead_magnet asc
        `, ADMIN_DB_TIMEOUT_MS)
      );

      return rows.map((row) => row.lead_magnet).filter((value): value is string => Boolean(value));
    } catch (error) {
      console.error("Falling back to local lead magnet options:", error);
    }
  }

  const db = await readLocalDbSafe();
  return Array.from(new Set(db.subscribers.map((subscriber) => subscriber.lead_magnet).filter(Boolean)));
}
