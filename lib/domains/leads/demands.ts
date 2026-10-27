/**
 * leads 域 · 需求库（内容选题输入）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  ADMIN_DB_TIMEOUT_MS,
  mapDemandRow,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb,
  getReadSql,
  getWriteSql,
  DemandRow,
  DemandFilters
} from "@/lib/platform";
import type {
  Demand
} from "@/lib/types";
export async function saveDemand(input: Partial<Demand> & Pick<Demand, "title" | "status">) {
  if (hasDatabaseUrl()) {
    const sql = getWriteSql();
    const now = new Date().toISOString();

    if (input.id) {
      const existing = await sql<{ id: string }[]>`select id from demands where id = ${input.id} limit 1`;
      if (!existing.length) throw new Error("Demand not found");

      await sql`
        update demands
        set
          title = ${input.title},
          source_url = ${input.source_url ?? null},
          source_platform = ${input.source_platform ?? null},
          user_quote = ${input.user_quote ?? null},
          persona = ${input.persona ?? null},
          job_to_be_done = ${input.job_to_be_done ?? null},
          problem_stage = ${input.problem_stage ?? null},
          solution_attempted = ${input.solution_attempted ?? null},
          keyword = ${input.keyword ?? null},
          pain_score = ${input.pain_score ?? null},
          frequency_score = ${input.frequency_score ?? null},
          payment_score = ${input.payment_score ?? null},
          evidence_strength = ${input.evidence_strength ?? null},
          status = ${input.status},
          tags = ${sql.json(input.tags ?? [])},
          next_action = ${input.next_action ?? null},
          topic_tag = ${input.topic_tag ?? null},
          updated_at = ${now}
        where id = ${input.id}
      `;
    } else {
      await sql`
        insert into demands (
          id, title, source_url, source_platform, user_quote, persona, job_to_be_done,
          problem_stage, solution_attempted, keyword, pain_score, frequency_score,
          payment_score, evidence_strength, status, tags, next_action, topic_tag,
          created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.title}, ${input.source_url ?? null}, ${input.source_platform ?? null},
          ${input.user_quote ?? null}, ${input.persona ?? null}, ${input.job_to_be_done ?? null},
          ${input.problem_stage ?? null}, ${input.solution_attempted ?? null}, ${input.keyword ?? null},
          ${input.pain_score ?? null}, ${input.frequency_score ?? null}, ${input.payment_score ?? null},
          ${input.evidence_strength ?? null}, ${input.status}, ${sql.json(input.tags ?? [])},
          ${input.next_action ?? null}, ${input.topic_tag ?? null}, ${now}, ${now}
        )
      `;
    }

    return;
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();

  if (input.id) {
    const existing = db.demands.find((item) => item.id === input.id);
    if (!existing) throw new Error("Demand not found");
    Object.assign(existing, input, { updated_at: now });
  } else {
    db.demands.unshift({
      id: randomUUID(),
      title: input.title,
      status: input.status,
      source_url: input.source_url,
      source_platform: input.source_platform,
      user_quote: input.user_quote,
      persona: input.persona,
      job_to_be_done: input.job_to_be_done,
      problem_stage: input.problem_stage,
      solution_attempted: input.solution_attempted,
      keyword: input.keyword,
      pain_score: input.pain_score,
      frequency_score: input.frequency_score,
      payment_score: input.payment_score,
      evidence_strength: input.evidence_strength,
      tags: input.tags ?? [],
      next_action: input.next_action,
      topic_tag: input.topic_tag,
      created_at: now,
      updated_at: now
    });
  }

  await writeLocalDb(db);
}

export async function getDemands(options?: { preferLocal?: boolean; timeoutMs?: number }) {
  const preferLocal = options?.preferLocal ?? false;

  if (preferLocal) {
    const db = await readLocalDb();
    return db.demands;
  }

  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const demands = await readWithRetry(
      "Admin demands read",
      () => withTimeout(sql<DemandRow[]>`
        select * from demands
        order by created_at desc
      `, options?.timeoutMs ?? ADMIN_DB_TIMEOUT_MS)
    );

    return demands.map(mapDemandRow);
  }

  const db = await readLocalDbSafe();
  return db.demands;
}

export async function getDemandsByIds(ids: string[], options?: { preferLocal?: boolean; timeoutMs?: number }) {
  if (!ids.length) {
    return [];
  }

  const preferLocal = options?.preferLocal ?? false;
  const timeoutMs = options?.timeoutMs ?? 1500;

  if (preferLocal || process.env.NODE_ENV !== "production") {
    const db = await readLocalDb();
    const idSet = new Set(ids);
    return db.demands.filter((demand) => idSet.has(demand.id));
  }

  if (hasDatabaseUrl()) {
    try {
      const sql = getReadSql();
      const demands = await readWithRetry(
        "Related demands read",
        () => withTimeout(sql<DemandRow[]>`
          select * from demands
          where id in ${sql(ids)}
          order by created_at desc
        `, timeoutMs)
      );

      return demands.map(mapDemandRow);
    } catch (error) {
      console.error("Falling back to local related demands:", error);
    }
  }

  const db = await readLocalDbSafe();
  const idSet = new Set(ids);
  return db.demands.filter((demand) => idSet.has(demand.id));
}

export async function getDemandById(id: string) {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const demands = await readWithRetry(
      "Admin demand read",
      () => withTimeout(sql<DemandRow[]>`
        select * from demands
        where id = ${id}
        limit 1
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return demands[0] ? mapDemandRow(demands[0]) : undefined;
  }

  const db = await readLocalDbSafe();
  return db.demands.find((demand) => demand.id === id);
}

export async function getDemandFilterOptions(): Promise<{
  platforms: string[];
  personas: string[];
}> {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const [platformRows, personaRows] = await readWithRetry(
      "Demand filter options read",
      () => withTimeout(Promise.all([
        sql<{ source_platform: string | null }[]>`
          select distinct source_platform
          from demands
          where source_platform is not null and source_platform <> ''
          order by source_platform asc
        `,
        sql<{ persona: string | null }[]>`
          select distinct persona
          from demands
          where persona is not null and persona <> ''
          order by persona asc
        `
      ]), ADMIN_DB_TIMEOUT_MS)
    );

    return {
      platforms: platformRows.map((row) => row.source_platform).filter((value): value is string => Boolean(value)),
      personas: personaRows.map((row) => row.persona).filter((value): value is string => Boolean(value))
    };
  }

  const db = await readLocalDbSafe();

  return {
    platforms: Array.from(new Set(db.demands.map((demand) => demand.source_platform).filter((value): value is string => Boolean(value)))),
    personas: Array.from(new Set(db.demands.map((demand) => demand.persona).filter((value): value is string => Boolean(value))))
  };
}

export async function getFilteredDemands(filters: DemandFilters): Promise<Demand[]> {
  const db = shouldReadLiveAdminDb()
    ? {
        demands: await (async () => {
          const sql = getReadSql();
          const query = filters.query?.trim();
          const queryPattern = query ? `%${query}%` : null;
          const demands = await readWithRetry(
            "Filtered demands read",
            () => withTimeout(sql<DemandRow[]>`
              select * from demands
              where (${queryPattern}::text is null or concat_ws(' ', title, keyword, persona, source_platform, user_quote, next_action) ilike ${queryPattern})
                and (${filters.source_platform ?? null}::text is null or source_platform = ${filters.source_platform ?? null})
                and (${filters.persona ?? null}::text is null or persona = ${filters.persona ?? null})
                and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
                and (${filters.topic_tag ?? null}::text is null or topic_tag = ${filters.topic_tag ?? null})
              order by created_at desc
            `, ADMIN_DB_TIMEOUT_MS)
          );

          return demands.map(mapDemandRow);
        })()
      }
    : await readLocalDbSafe();
  const query = filters.query?.trim().toLowerCase();

  const filtered = db.demands.filter((demand) => {
    if (query) {
      const haystack = [
        demand.title,
        demand.keyword,
        demand.persona,
        demand.source_platform,
        demand.user_quote,
        demand.next_action
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    if (filters.source_platform && demand.source_platform !== filters.source_platform) return false;
    if (filters.persona && demand.persona !== filters.persona) return false;
    if (filters.status && demand.status !== filters.status) return false;
    if (filters.topic_tag && demand.topic_tag !== filters.topic_tag) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case "pain_desc":
      sorted.sort((a, b) => (b.pain_score ?? 0) - (a.pain_score ?? 0));
      break;
    case "frequency_desc":
      sorted.sort((a, b) => (b.frequency_score ?? 0) - (a.frequency_score ?? 0));
      break;
    case "payment_desc":
      sorted.sort((a, b) => (b.payment_score ?? 0) - (a.payment_score ?? 0));
      break;
    case "updated_desc":
      sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      break;
    case "created_asc":
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
      break;
    case "created_desc":
    default:
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
  }

  return sorted;
}
