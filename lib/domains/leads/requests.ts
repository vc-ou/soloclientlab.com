/**
 * leads 域 · 等待名单 / 访问申请 / 试用 / 问卷 / 反馈
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { addDaysIso } from "@/lib/platform";
import { isInternalProductTrial } from "@/lib/analytics-filters";
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  ADMIN_DB_TIMEOUT_MS,
  isMissingOptionalTable,
  mapLeadRadarConfigRow,
  mapProductAccessRequestRow,
  mapProductTrialRow,
  readFeedbackRows,
  readLocalDb,
  readLocalDbSafe,
  readWaitlistRows,
  readWithRetry,
  shouldMirrorDatabaseToLocalFile,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb,
  getReadSql,
  getWriteSql,
  LeadRadarConfigRow,
  ProductAccessRequestRow,
  ProductTrialRow,
  WaitlistFilters,
  FeedbackFilters
} from "@/lib/platform";
import type {
  FeedbackEntry,
  LeadRadarConfig,
  Product,
  ProductAccessRequest,
  ProductTrial,
  WaitlistEntry
} from "@/lib/types";
export async function addWaitlistEntry(
  input: Omit<WaitlistEntry, "id" | "created_at">
) {
  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into waitlists (
        id, project_name, page_slug, email, source_page, interest_tag, note, created_at
      ) values (
        ${randomUUID()}, ${input.project_name}, ${input.page_slug}, ${input.email.toLowerCase()},
        ${input.source_page ?? null}, ${input.interest_tag ?? null}, ${input.note ?? null},
        ${new Date().toISOString()}
      )
    `;
    return;
  }

  const db = await readLocalDb();
  db.waitlists.unshift({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
    email: input.email.toLowerCase()
  });
  await writeLocalDb(db);
}


export async function addProductAccessRequest(
  input: Omit<ProductAccessRequest, "id" | "created_at" | "updated_at" | "status"> & {
    status?: ProductAccessRequest["status"];
  }
) {
  const now = new Date();
  const nowIso = now.toISOString();
  const email = input.email.toLowerCase();
  const accessRequestId = randomUUID();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into product_access_requests (
        id, product_slug, access_type, email, company_name, role, source_page, use_case,
        status, created_at, updated_at
      ) values (
        ${accessRequestId}, ${input.product_slug}, ${input.access_type}, ${email},
        ${input.company_name ?? null}, ${input.role ?? null}, ${input.source_page ?? null},
        ${input.use_case ?? null}, ${input.status ?? "new"}, ${nowIso}, ${nowIso}
      )
    `;

    if (input.access_type === "trial_access" || input.access_type === "co_build_access") {
      await writeSql`
        insert into product_trials (
          id, product_slug, email, access_request_id, status, trial_started_at,
          trial_ends_at, co_build_unlock_ends_at, source_page, notes, created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.product_slug}, ${email}, ${accessRequestId}, 'requested',
          ${nowIso}, ${addDaysIso(now, 7)},
          ${input.access_type === "co_build_access" ? addDaysIso(now, 30) : null},
          ${input.source_page ?? null}, ${input.use_case ?? null}, ${nowIso}, ${nowIso}
        )
      `;
    }

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.product_access_requests.unshift({
        id: accessRequestId,
        product_slug: input.product_slug,
        access_type: input.access_type,
        email,
        company_name: input.company_name,
        role: input.role,
        source_page: input.source_page,
        use_case: input.use_case,
        status: input.status ?? "new",
        created_at: nowIso,
        updated_at: nowIso
      });
      if (input.access_type === "trial_access" || input.access_type === "co_build_access") {
        localDb.product_trials.unshift({
          id: randomUUID(),
          product_slug: input.product_slug,
          email,
          access_request_id: accessRequestId,
          status: "requested",
          trial_started_at: nowIso,
          trial_ends_at: addDaysIso(now, 7),
          co_build_unlock_ends_at: input.access_type === "co_build_access" ? addDaysIso(now, 30) : undefined,
          source_page: input.source_page,
          notes: input.use_case,
          created_at: nowIso,
          updated_at: nowIso
        });
      }
      await writeLocalDb(localDb);
    }

    return accessRequestId;
  }

  const db = await readLocalDb();
  db.product_access_requests.unshift({
    id: accessRequestId,
    product_slug: input.product_slug,
    access_type: input.access_type,
    email,
    company_name: input.company_name,
    role: input.role,
    source_page: input.source_page,
    use_case: input.use_case,
    status: input.status ?? "new",
    created_at: nowIso,
    updated_at: nowIso
  });
  if (input.access_type === "trial_access" || input.access_type === "co_build_access") {
    db.product_trials.unshift({
      id: randomUUID(),
      product_slug: input.product_slug,
      email,
      access_request_id: accessRequestId,
      status: "requested",
      trial_started_at: nowIso,
      trial_ends_at: addDaysIso(now, 7),
      co_build_unlock_ends_at: input.access_type === "co_build_access" ? addDaysIso(now, 30) : undefined,
      source_page: input.source_page,
      notes: input.use_case,
      created_at: nowIso,
      updated_at: nowIso
    });
  }
  await writeLocalDb(db);
  return accessRequestId;
}

export async function addLeadRadarConfig(
  input: Omit<LeadRadarConfig, "id" | "created_at" | "updated_at" | "status"> & {
    status?: LeadRadarConfig["status"];
  }
) {
  const now = new Date().toISOString();
  const email = input.email.toLowerCase();
  const keywords = input.keywords.map((keyword) => keyword.trim()).filter(Boolean);

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into leadradar_configs (
        id, email, company_name, target_market, platforms, keywords, countries,
        capabilities, lead_types, notes, status, created_at, updated_at
      ) values (
        ${randomUUID()}, ${email}, ${input.company_name ?? null}, ${input.target_market ?? null},
        ${input.platforms ?? null}, ${writeSql.json(keywords)}, ${input.countries ?? null},
        ${input.capabilities ?? null}, ${input.lead_types ?? null}, ${input.notes ?? null},
        ${input.status ?? "completed"}, ${now}, ${now}
      )
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.leadradar_configs.unshift({
        id: randomUUID(),
        email,
        company_name: input.company_name,
        target_market: input.target_market,
        platforms: input.platforms,
        keywords,
        countries: input.countries,
        capabilities: input.capabilities,
        lead_types: input.lead_types,
        notes: input.notes,
        status: input.status ?? "completed",
        created_at: now,
        updated_at: now
      });
      await writeLocalDb(localDb);
    }
    return;
  }

  const db = await readLocalDb();
  db.leadradar_configs.unshift({
    id: randomUUID(),
    email,
    company_name: input.company_name,
    target_market: input.target_market,
    platforms: input.platforms,
    keywords,
    countries: input.countries,
    capabilities: input.capabilities,
    lead_types: input.lead_types,
    notes: input.notes,
    status: input.status ?? "completed",
    created_at: now,
    updated_at: now
  });
  await writeLocalDb(db);
}

export async function getProductAccessRequests(): Promise<ProductAccessRequest[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product access requests read",
        () => withTimeout(sql<ProductAccessRequestRow[]>`
          select * from product_access_requests
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductAccessRequestRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "product_access_requests")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_access_requests;
}

export async function getProductTrials(): Promise<ProductTrial[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product trials read",
        () => withTimeout(sql<ProductTrialRow[]>`
          select * from product_trials
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductTrialRow).filter((trial) => !isInternalProductTrial(trial));
    } catch (error) {
      if (isMissingOptionalTable(error, "product_trials")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_trials.filter((trial) => !isInternalProductTrial(trial));
}

export async function getLeadRadarConfigs(): Promise<LeadRadarConfig[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "LeadRadar configs read",
        () => withTimeout(sql<LeadRadarConfigRow[]>`
          select * from leadradar_configs
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapLeadRadarConfigRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "leadradar_configs")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.leadradar_configs;
}

export async function getWaitlistFilterOptions(): Promise<{
  projects: string[];
  sourcePages: string[];
}> {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const [projectRows, sourcePageRows] = await readWithRetry(
      "Waitlist filter options read",
      () => withTimeout(Promise.all([
        sql<{ project_name: string }[]>`
          select distinct project_name
          from waitlists
          order by project_name asc
        `,
        sql<{ source_page: string | null }[]>`
          select distinct source_page
          from waitlists
          where source_page is not null and source_page <> ''
          order by source_page asc
        `
      ]), ADMIN_DB_TIMEOUT_MS)
    );

    return {
      projects: projectRows.map((row) => row.project_name),
      sourcePages: sourcePageRows.map((row) => row.source_page).filter((value): value is string => Boolean(value))
    };
  }

  const db = await readLocalDbSafe();

  return {
    projects: Array.from(new Set(db.waitlists.map((entry) => entry.project_name))),
    sourcePages: Array.from(new Set(db.waitlists.map((entry) => entry.source_page).filter((value): value is string => Boolean(value))))
  };
}


export async function getFilteredWaitlists(filters: WaitlistFilters): Promise<WaitlistEntry[]> {
  const db = shouldReadLiveAdminDb()
    ? { waitlists: await readWaitlistRows(filters) }
    : await readLocalDbSafe();

  return db.waitlists.filter((entry) => {
    if (filters.project_name && entry.project_name !== filters.project_name) return false;
    if (filters.page_slug && entry.page_slug !== filters.page_slug) return false;
    if (filters.interest_tag && entry.interest_tag !== filters.interest_tag) return false;
    if (filters.source_page && entry.source_page !== filters.source_page) return false;
    return true;
  });
}

