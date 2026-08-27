import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { isInternalProductTrial, isInternalTrialEvent } from "@/lib/analytics-filters";
import { seedDatabase } from "@/lib/seed";
import { hasDatabaseUrl } from "@/lib/env";
import { getReadSql, getWriteSql } from "@/lib/postgres";
import type {
  Database,
  Demand,
  FeedbackEntry,
  LeadRadarConfig,
  Post,
  PostEvent,
  PostPerformance,
  Product,
  ProductAccessRequest,
  ProductAccessType,
  ProductEntitlement,
  ProductLicenseActivation,
  ProductLicenseKey,
  ProductPayment,
  ProductSlug,
  ProductTrial,
  Resource,
  Subscriber,
  TrialEvent,
  WaitlistEntry
} from "@/lib/types";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "db.json");

type DemandRow = Omit<Demand, "tags"> & {
  tags: string[] | null;
};

type PostRow = Post;
type ProductRow = Product;

type PostEventRow = PostEvent;
type FeedbackRow = FeedbackEntry;
type ProductAccessRequestRow = ProductAccessRequest;
type ProductTrialRow = ProductTrial;
type ProductPaymentRow = Omit<ProductPayment, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
type ProductEntitlementRow = Omit<ProductEntitlement, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
type ProductLicenseKeyRow = ProductLicenseKey;
type ProductLicenseActivationRow = Omit<ProductLicenseActivation, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
type LeadRadarConfigRow = Omit<LeadRadarConfig, "keywords"> & {
  keywords: string[] | null;
};
type TrialEventRow = Omit<TrialEvent, "metadata"> & {
  metadata: Record<string, unknown> | null;
};

type SubscriberFilters = {
  source_type?: string;
  lead_magnet?: string;
  persona_tag?: string;
  topic_tag?: string;
  status?: string;
};

type WaitlistFilters = {
  project_name?: string;
  page_slug?: string;
  interest_tag?: string;
  source_page?: string;
};

type FeedbackFilters = {
  tool_slug?: string;
  is_useful?: string;
  has_attachment?: string;
  source_page?: string;
};

type DemandFilters = {
  query?: string;
  source_platform?: string;
  persona?: string;
  status?: string;
  topic_tag?: string;
  sort?: string;
};

type ResourcePerformance = Resource & {
  subscriberCount: number;
  conversionRate: number;
};

type ToolTrafficMetric = {
  path: string;
  referrer: string;
  clicks: number;
  lastEventAt?: string;
};

function normalizeTopicTag(topic?: string | null) {
  if (topic === "client_acquisition" || topic === "marketing_positioning") {
    return "solo_worker_client_acquisition";
  }
  if (topic === "ai_automation" || topic === "offer_validation" || topic === "operations") {
    return "workflow_signal_research";
  }

  return topic ?? undefined;
}

async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedDatabase, null, 2), "utf8");
  }
}

async function readLocalDb(): Promise<Database> {
  await ensureDbFile();
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<Database>;
  return {
    demands: parsed.demands ?? [],
    posts: (parsed.posts ?? []).map((post) => ({
      ...post,
      topic_tag: normalizeTopicTag(post.topic_tag) as Post["topic_tag"]
    })),
    products: parsed.products ?? seedDatabase.products ?? [],
    resources: parsed.resources ?? [],
    subscribers: parsed.subscribers ?? [],
    waitlists: parsed.waitlists ?? [],
    post_events: parsed.post_events ?? [],
    feedback: parsed.feedback ?? [],
    product_access_requests: parsed.product_access_requests ?? [],
    product_trials: parsed.product_trials ?? [],
    product_payments: (parsed.product_payments ?? []).map((payment) => ({
      ...payment,
      metadata: payment.metadata ?? {}
    })),
    product_entitlements: (parsed.product_entitlements ?? []).map((entitlement) => ({
      ...entitlement,
      metadata: entitlement.metadata ?? {}
    })),
    product_license_keys: parsed.product_license_keys ?? [],
    product_license_activations: (parsed.product_license_activations ?? []).map((activation) => ({
      ...activation,
      metadata: activation.metadata ?? {}
    })),
    leadradar_configs: (parsed.leadradar_configs ?? []).map((config) => ({
      ...config,
      keywords: config.keywords ?? []
    })),
    trial_events: (parsed.trial_events ?? []).map((event) => ({
      ...event,
      metadata: event.metadata ?? {}
    }))
  };
}

async function readLocalDbSafe(): Promise<Database> {
  try {
    return await readLocalDb();
  } catch (error) {
    console.error("Local data fallback is unavailable, using in-memory seed data:", error);
    return createInMemoryFallbackDb();
  }
}

async function writeLocalDb(db: Database) {
  await writeFile(dataFile, JSON.stringify(db, null, 2), "utf8");
}

function createInMemoryFallbackDb(): Database {
  return {
    demands: seedDatabase.demands.map((item) => ({ ...item, tags: [...(item.tags ?? [])] })),
    posts: seedDatabase.posts.map((item) => ({ ...item })),
    products: seedDatabase.products.map((item) => ({ ...item })),
    resources: seedDatabase.resources.map((item) => ({ ...item })),
    subscribers: [],
    waitlists: [],
    post_events: [],
    feedback: [],
    product_access_requests: [],
    product_trials: [],
    product_payments: [],
    product_entitlements: [],
    product_license_keys: [],
    product_license_activations: [],
    leadradar_configs: [],
    trial_events: []
  };
}

function shouldMirrorDatabaseToLocalFile() {
  return process.env.NODE_ENV !== "production";
}

const ADMIN_DB_TIMEOUT_MS = 10000;

function shouldReadLiveAdminDb() {
  return process.env.NODE_ENV === "production" && hasDatabaseUrl();
}

function shouldReadLiveProducts() {
  return hasDatabaseUrl();
}

async function withTimeout<T>(promise: Promise<T>, ms = 4000) {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Database read timed out after ${ms}ms`)), ms);
    })
  ]);
}

export async function withDatabaseTimeout<T>(promise: Promise<T>, ms = 4000) {
  return withTimeout(promise, ms);
}

let productLicenseTablesReady: Promise<void> | null = null;

async function ensureProductLicenseTables() {
  if (!hasDatabaseUrl()) return;
  productLicenseTablesReady ??= (async () => {
    const writeSql = getWriteSql();
    await writeSql`
      create table if not exists product_license_keys (
        id text primary key,
        product_slug text not null,
        entitlement_id text not null references product_entitlements(id) on delete cascade,
        source_payment_id text references product_payments(id) on delete set null,
        key_hash text not null unique,
        key_suffix text not null,
        status text not null,
        max_activations integer not null default 1,
        created_at timestamptz not null,
        updated_at timestamptz not null
      )
    `;
    await writeSql`
      create table if not exists product_license_activations (
        id text primary key,
        license_key_id text not null references product_license_keys(id) on delete cascade,
        product_slug text not null,
        device_id_hash text not null,
        token_hash text not null unique,
        status text not null,
        activated_at timestamptz not null,
        last_verified_at timestamptz,
        revoked_at timestamptz,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null,
        updated_at timestamptz not null
      )
    `;
    await writeSql`create index if not exists idx_product_license_keys_product_slug on product_license_keys (product_slug)`;
    await writeSql`create index if not exists idx_product_license_keys_entitlement on product_license_keys (entitlement_id)`;
    await writeSql`create index if not exists idx_product_license_keys_source_payment on product_license_keys (source_payment_id)`;
    await writeSql`create index if not exists idx_product_license_keys_status on product_license_keys (status)`;
    await writeSql`create index if not exists idx_product_license_activations_license_key on product_license_activations (license_key_id)`;
    await writeSql`create index if not exists idx_product_license_activations_product_slug on product_license_activations (product_slug)`;
    await writeSql`create index if not exists idx_product_license_activations_device on product_license_activations (device_id_hash)`;
    await writeSql`create index if not exists idx_product_license_activations_status on product_license_activations (status)`;
  })();
  await productLicenseTablesReady;
}

const retryableDatabaseErrorCodes = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_DESTROYED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENETUNREACH",
  "ETIMEDOUT",
  "EPIPE"
]);

function isRetryableDatabaseError(error: unknown) {
  const databaseError = error as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  } | undefined;
  const code = databaseError?.code ?? databaseError?.cause?.code;
  const message = `${databaseError?.message ?? ""} ${databaseError?.cause?.message ?? ""}`.toLowerCase();

  return Boolean(
    (code && retryableDatabaseErrorCodes.has(code)) ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("connection closed") ||
    message.includes("connection terminated")
  );
}

async function readWithRetry<T>(label: string, read: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (retries <= 0 || !isRetryableDatabaseError(error)) {
      throw error;
    }

    console.warn(`${label} failed, retrying once:`, error);
    return readWithRetry(label, read, retries - 1);
  }
}

let ensuredSubscriberNoteColumn = false;
let ensuredPostsTable = false;
let ensuredProductsTable = false;
let ensuredProductPaymentsEmailNullable = false;

async function ensureSubscriberNoteColumn() {
  if (ensuredSubscriberNoteColumn || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`alter table subscribers add column if not exists note text`;
  ensuredSubscriberNoteColumn = true;
}

async function ensurePostsTable() {
  if (ensuredPostsTable || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`
    create table if not exists posts (
      id text primary key,
      title text not null,
      slug text not null unique,
      summary text,
      content text,
      cover_image_url text,
      topic_tag text,
      seo_title text,
      seo_description text,
      cta_type text,
      cta_target text,
      faq jsonb,
      status text not null,
      published_at timestamptz,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      read_time text
    )
  `;
  await writeSql`alter table posts add column if not exists cover_image_url text`;
  await writeSql`alter table posts add column if not exists cta_type text`;
  await writeSql`alter table posts add column if not exists cta_target text`;
  await writeSql`alter table posts add column if not exists faq jsonb`;
  await writeSql`alter table posts add column if not exists read_time text`;
  await writeSql`create index if not exists idx_posts_status on posts (status)`;
  await writeSql`create index if not exists idx_posts_topic_tag on posts (topic_tag)`;
  await writeSql`create index if not exists idx_posts_published_at on posts (published_at desc)`;
  await writeSql`create index if not exists idx_posts_created_at on posts (created_at desc)`;
  ensuredPostsTable = true;
}

async function ensureProductsTable() {
  if (ensuredProductsTable || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`
    create table if not exists products (
      id text primary key,
      slug text not null unique,
      name text not null,
      short_description text,
      hero_title text,
      hero_description text,
      audience text,
      problem text,
      promise text,
      landing_page_url text,
      features jsonb not null default '[]'::jsonb,
      delivery_mode text not null,
      development_status text not null,
      price_cents integer not null default 0,
      currency text not null default 'USD',
      payment_enabled boolean not null default false,
      status text not null,
      seo_title text,
      seo_description text,
      published_at timestamptz,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `;
  await writeSql`alter table products add column if not exists landing_page_url text`;
  await writeSql`alter table products add column if not exists features jsonb not null default '[]'::jsonb`;
  await writeSql`create index if not exists idx_products_status on products (status)`;
  await writeSql`create index if not exists idx_products_slug on products (slug)`;
  ensuredProductsTable = true;
}

async function ensureProductPaymentsEmailNullable() {
  if (ensuredProductPaymentsEmailNullable || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`alter table product_payments alter column email drop not null`;
  ensuredProductPaymentsEmailNullable = true;
}

function toIsoString(value?: string | null) {
  return value ? new Date(value).toISOString() : undefined;
}

function markTestValue(value?: string | null) {
  if (!value) return value ?? undefined;
  if (process.env.NODE_ENV === "production") return value;
  return value.includes("[TEST]") ? value : `${value} [TEST]`;
}

function mapDemandRow(row: DemandRow): Demand {
  return {
    ...row,
    topic_tag: normalizeTopicTag(row.topic_tag) as Demand["topic_tag"],
    tags: row.tags ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapPostRow(row: PostRow): Post {
  return {
    ...row,
    topic_tag: normalizeTopicTag(row.topic_tag) as Post["topic_tag"],
    published_at: toIsoString(row.published_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductRow(row: ProductRow): Product {
  return {
    ...row,
    features: row.features ?? [],
    published_at: toIsoString(row.published_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function toPostListItem(post: Post): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    cover_image_url: post.cover_image_url,
    topic_tag: post.topic_tag,
    status: post.status,
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    read_time: post.read_time
  };
}

function mapResourceRow(row: Resource): Resource {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapSubscriberRow(row: Subscriber): Subscriber {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapWaitlistRow(row: WaitlistEntry): WaitlistEntry {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapPostEventRow(row: PostEventRow): PostEvent {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapFeedbackRow(row: FeedbackRow): FeedbackEntry {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapProductAccessRequestRow(row: ProductAccessRequestRow): ProductAccessRequest {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductTrialRow(row: ProductTrialRow): ProductTrial {
  return {
    ...row,
    trial_started_at: toIsoString(row.trial_started_at),
    trial_ends_at: toIsoString(row.trial_ends_at),
    co_build_unlock_ends_at: toIsoString(row.co_build_unlock_ends_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductPaymentRow(row: ProductPaymentRow): ProductPayment {
  return {
    ...row,
    paid_at: toIsoString(row.paid_at),
    refunded_at: toIsoString(row.refunded_at),
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductEntitlementRow(row: ProductEntitlementRow): ProductEntitlement {
  return {
    ...row,
    starts_at: new Date(row.starts_at).toISOString(),
    ends_at: toIsoString(row.ends_at),
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductLicenseKeyRow(row: ProductLicenseKeyRow): ProductLicenseKey {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapProductLicenseActivationRow(row: ProductLicenseActivationRow): ProductLicenseActivation {
  return {
    ...row,
    metadata: row.metadata ?? {},
    activated_at: new Date(row.activated_at).toISOString(),
    last_verified_at: toIsoString(row.last_verified_at),
    revoked_at: toIsoString(row.revoked_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapLeadRadarConfigRow(row: LeadRadarConfigRow): LeadRadarConfig {
  return {
    ...row,
    keywords: row.keywords ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function mapTrialEventRow(row: TrialEventRow): TrialEvent {
  return {
    ...row,
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString()
  };
}

function isMissingOptionalTable(error: unknown, tableName: string) {
  const databaseError = error as { code?: string; message?: string } | undefined;
  return databaseError?.code === "42P01" || Boolean(databaseError?.message?.includes(tableName));
}

function filterSubscribers(subscribers: Subscriber[], filters: SubscriberFilters) {
  return subscribers.filter((subscriber) => {
    if (filters.source_type && subscriber.source_type !== filters.source_type) return false;
    if (filters.lead_magnet && subscriber.lead_magnet !== filters.lead_magnet) return false;
    if (filters.persona_tag && subscriber.persona_tag !== filters.persona_tag) return false;
    if (filters.topic_tag && subscriber.topic_tag !== filters.topic_tag) return false;
    if (filters.status && subscriber.status !== filters.status) return false;
    return true;
  });
}

async function readWaitlistRows(filters: WaitlistFilters = {}) {
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

async function readFeedbackRows() {
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

async function readAdminPostPerformanceData(): Promise<Pick<Database, "posts" | "post_events" | "subscribers">> {
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

async function readPostgresDb(): Promise<Database> {
  const sql = getReadSql();
  const postEventsPromise = withTimeout(
    sql<PostEventRow[]>`select * from post_events order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    const databaseError = error as { code?: string; message?: string } | undefined;
    const isMissingRelation = databaseError?.code === "42P01";
    const mentionsPostEvents = databaseError?.message?.includes("post_events");

    if (isMissingRelation || mentionsPostEvents) {
      console.warn("post_events table is not available yet, using empty analytics events.");
      return [] as PostEventRow[];
    }

    throw error;
  });
  const feedbackPromise = withTimeout(
    sql<FeedbackRow[]>`select * from feedback order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    const databaseError = error as { code?: string; message?: string } | undefined;
    const isMissingRelation = databaseError?.code === "42P01";
    const mentionsFeedback = databaseError?.message?.includes("feedback");

    if (isMissingRelation || mentionsFeedback) {
      console.warn("feedback table is not available yet, using empty feedback data.");
      return [] as FeedbackRow[];
    }

    throw error;
  });
  const productAccessRequestsPromise = withTimeout(
    sql<ProductAccessRequestRow[]>`select * from product_access_requests order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_access_requests")) {
      console.warn("product_access_requests table is not available yet, using empty product access data.");
      return [] as ProductAccessRequestRow[];
    }

    throw error;
  });
  const productTrialsPromise = withTimeout(
    sql<ProductTrialRow[]>`select * from product_trials order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_trials")) {
      console.warn("product_trials table is not available yet, using empty product trial data.");
      return [] as ProductTrialRow[];
    }

    throw error;
  });
  const productPaymentsPromise = withTimeout(
    sql<ProductPaymentRow[]>`select * from product_payments order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_payments")) {
      console.warn("product_payments table is not available yet, using empty payment data.");
      return [] as ProductPaymentRow[];
    }

    throw error;
  });
  const productEntitlementsPromise = withTimeout(
    sql<ProductEntitlementRow[]>`select * from product_entitlements order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_entitlements")) {
      console.warn("product_entitlements table is not available yet, using empty entitlement data.");
      return [] as ProductEntitlementRow[];
    }

    throw error;
  });
  const productLicenseKeysPromise = withTimeout(
    sql<ProductLicenseKeyRow[]>`select * from product_license_keys order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_license_keys")) {
      console.warn("product_license_keys table is not available yet, using empty license key data.");
      return [] as ProductLicenseKeyRow[];
    }

    throw error;
  });
  const productLicenseActivationsPromise = withTimeout(
    sql<ProductLicenseActivationRow[]>`select * from product_license_activations order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "product_license_activations")) {
      console.warn("product_license_activations table is not available yet, using empty license activation data.");
      return [] as ProductLicenseActivationRow[];
    }

    throw error;
  });
  const leadRadarConfigsPromise = withTimeout(
    sql<LeadRadarConfigRow[]>`select * from leadradar_configs order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "leadradar_configs")) {
      console.warn("leadradar_configs table is not available yet, using empty LeadRadar config data.");
      return [] as LeadRadarConfigRow[];
    }

    throw error;
  });
  const trialEventsPromise = withTimeout(
    sql<TrialEventRow[]>`select * from trial_events order by created_at desc`,
    4000
  ).catch((error: unknown) => {
    if (isMissingOptionalTable(error, "trial_events")) {
      console.warn("trial_events table is not available yet, using empty trial event data.");
      return [] as TrialEventRow[];
    }

    throw error;
  });

  const [
    demands,
    posts,
    products,
    resources,
    subscribers,
    waitlists,
    postEvents,
    feedback,
    productAccessRequests,
    productTrials,
    productPayments,
    productEntitlements,
    productLicenseKeys,
    productLicenseActivations,
    leadRadarConfigs,
    trialEvents
  ] = await withTimeout(
    Promise.all([
      sql<DemandRow[]>`select * from demands order by created_at desc`,
      sql<PostRow[]>`select * from posts order by created_at desc`,
      sql<ProductRow[]>`select * from products order by created_at desc`.catch((error: unknown) => {
        if (isMissingOptionalTable(error, "products")) {
          console.warn("products table is not available yet, using seed product data.");
          return seedDatabase.products as ProductRow[];
        }
        throw error;
      }),
      sql<Resource[]>`select * from resources order by created_at desc`,
      sql<Subscriber[]>`select * from subscribers order by created_at desc`,
      sql<WaitlistEntry[]>`select * from waitlists order by created_at desc`,
      postEventsPromise,
      feedbackPromise,
      productAccessRequestsPromise,
      productTrialsPromise,
      productPaymentsPromise,
      productEntitlementsPromise,
      productLicenseKeysPromise,
      productLicenseActivationsPromise,
      leadRadarConfigsPromise,
      trialEventsPromise
    ])
  );

  return {
    demands: demands.map(mapDemandRow),
    posts: posts.map(mapPostRow),
    products: products.map(mapProductRow),
    resources: resources.map(mapResourceRow),
    subscribers: subscribers.map(mapSubscriberRow),
    waitlists: waitlists.map(mapWaitlistRow),
    post_events: postEvents.map(mapPostEventRow),
    feedback: feedback.map(mapFeedbackRow),
    product_access_requests: productAccessRequests.map(mapProductAccessRequestRow),
    product_trials: productTrials.map(mapProductTrialRow).filter((trial) => !isInternalProductTrial(trial)),
    product_payments: productPayments.map(mapProductPaymentRow),
    product_entitlements: productEntitlements.map(mapProductEntitlementRow),
    product_license_keys: productLicenseKeys.map(mapProductLicenseKeyRow),
    product_license_activations: productLicenseActivations.map(mapProductLicenseActivationRow),
    leadradar_configs: leadRadarConfigs.map(mapLeadRadarConfigRow),
    trial_events: trialEvents.map(mapTrialEventRow).filter((event) => !isInternalTrialEvent(event))
  };
}

export async function readDb(): Promise<Database> {
  if (hasDatabaseUrl()) {
    try {
      return await readWithRetry("Live database snapshot", () => readPostgresDb());
    } catch (error) {
      console.error("Live database snapshot failed:", error);

      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  return readLocalDbSafe();
}

export async function getSnapshot() {
  return readDb();
}

async function readPublicPosts(topic?: string) {
  if (process.env.NODE_ENV !== "production") {
    const db = await readLocalDb();
    return db.posts
      .filter((post) => post.status === "published")
      .filter((post) => (topic && topic !== "all" ? post.topic_tag === topic : true))
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .map(toPostListItem);
  }

  if (hasDatabaseUrl()) {
    try {
      const sql = getReadSql();
      const posts = await readWithRetry(
        "Public posts read",
        () => topic && topic !== "all"
          ? withTimeout(sql<PostRow[]>`
              select id, title, slug, summary, topic_tag,
                status, published_at, created_at, updated_at, read_time
              from posts
              where status = 'published' and topic_tag = ${topic}
              order by published_at desc nulls last, created_at desc
            `)
          : withTimeout(sql<PostRow[]>`
              select id, title, slug, summary, topic_tag,
                status, published_at, created_at, updated_at, read_time
              from posts
              where status = 'published'
              order by published_at desc nulls last, created_at desc
            `)
      );

      return posts.map(mapPostRow).map(toPostListItem);
    } catch (error) {
      console.error("Falling back to local posts:", error);
    }
  }

  const db = await readLocalDbSafe();
  return db.posts
    .filter((post) => post.status === "published")
    .filter((post) => (topic && topic !== "all" ? post.topic_tag === topic : true))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .map(toPostListItem);
}

const getCachedAllPublicPosts = unstable_cache(
  async () => readPublicPosts(),
  ["public-posts", "all"],
  {
    tags: ["public-posts"],
    revalidate: 300
  }
);

function getCachedTopicPublicPosts(topic: string) {
  return unstable_cache(
    async () => readPublicPosts(topic),
    ["public-posts", topic],
    {
      tags: ["public-posts"],
      revalidate: 300
    }
  )();
}

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

type TrackPostEventInput = {
  postId?: string;
  postSlug: string;
  eventType: PostEvent["event_type"];
  path?: string;
  referrer?: string;
  targetUrl?: string;
  createdAt?: string;
};

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

function addDaysIso(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
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

export async function addPendingProductPayment(
  input: Omit<ProductPayment, "id" | "status" | "provider" | "created_at" | "updated_at"> & {
    provider?: ProductPayment["provider"];
  }
) {
  const nowIso = new Date().toISOString();
  const paymentId = randomUUID();
  const email = input.email?.toLowerCase();
  const provider = input.provider ?? "stripe";
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    await ensureProductPaymentsEmailNullable();
    const writeSql = getWriteSql();
    await writeSql`
      insert into product_payments (
        id, product_slug, provider, status, access_request_id, email, currency,
        amount_subtotal, amount_total, provider_checkout_session_id,
        provider_payment_intent_id, provider_customer_id, provider_subscription_id,
        checkout_url, paid_at, refunded_at, metadata, created_at, updated_at
      ) values (
        ${paymentId}, ${input.product_slug}, ${provider}, 'pending',
        ${input.access_request_id ?? null}, ${email ?? null}, ${input.currency ?? null},
        ${input.amount_subtotal ?? null}, ${input.amount_total ?? null},
        ${input.provider_checkout_session_id ?? null}, ${input.provider_payment_intent_id ?? null},
        ${input.provider_customer_id ?? null}, ${input.provider_subscription_id ?? null},
        ${input.checkout_url ?? null}, ${input.paid_at ?? null}, ${input.refunded_at ?? null},
        ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
      )
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.product_payments.unshift({
        id: paymentId,
        product_slug: input.product_slug,
        provider,
        status: "pending",
        access_request_id: input.access_request_id,
        email,
        currency: input.currency,
        amount_subtotal: input.amount_subtotal,
        amount_total: input.amount_total,
        provider_checkout_session_id: input.provider_checkout_session_id,
        provider_payment_intent_id: input.provider_payment_intent_id,
        provider_customer_id: input.provider_customer_id,
        provider_subscription_id: input.provider_subscription_id,
        checkout_url: input.checkout_url,
        paid_at: input.paid_at,
        refunded_at: input.refunded_at,
        metadata: metadataJson,
        created_at: nowIso,
        updated_at: nowIso
      });
      await writeLocalDb(localDb);
    }

    return paymentId;
  }

  const db = await readLocalDb();
  db.product_payments.unshift({
    id: paymentId,
    product_slug: input.product_slug,
    provider,
    status: "pending",
    access_request_id: input.access_request_id,
    email,
    currency: input.currency,
    amount_subtotal: input.amount_subtotal,
    amount_total: input.amount_total,
    provider_checkout_session_id: input.provider_checkout_session_id,
    provider_payment_intent_id: input.provider_payment_intent_id,
    provider_customer_id: input.provider_customer_id,
    provider_subscription_id: input.provider_subscription_id,
    checkout_url: input.checkout_url,
    paid_at: input.paid_at,
    refunded_at: input.refunded_at,
    metadata: metadataJson,
    created_at: nowIso,
    updated_at: nowIso
  });
  await writeLocalDb(db);
  return paymentId;
}

export async function fulfillPaidProductPayment(input: {
  provider?: ProductPayment["provider"];
  product_slug: ProductPayment["product_slug"];
  access_type?: ProductAccessType;
  email: string;
  access_request_id?: string;
  provider_checkout_session_id: string;
  provider_payment_intent_id?: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  currency?: string;
  amount_subtotal?: number;
  amount_total?: number;
  paid_at?: string;
  metadata?: Record<string, unknown>;
}) {
  const nowIso = new Date().toISOString();
  const email = input.email.toLowerCase();
  const paidAt = input.paid_at ?? nowIso;
  const provider = input.provider ?? "stripe";
  const providerLabel = provider === "paypal" ? "PayPal" : "Stripe";
  const entitlementAccessType = input.access_type ?? "paid_pilot";
  const isLifetimeAccess = entitlementAccessType === "lifetime_access";
  const isMonthlySubscription = entitlementAccessType === "monthly_subscription" && Boolean(input.provider_subscription_id);
  const entitlementNotes = isLifetimeAccess
    ? `${providerLabel} lifetime access payment completed.`
    : isMonthlySubscription
      ? `${providerLabel} monthly subscription checkout completed.`
      : `${providerLabel} paid pilot checkout completed.`;
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const existingPayments = await writeSql<ProductPaymentRow[]>`
      select * from product_payments
      where provider_checkout_session_id = ${input.provider_checkout_session_id}
      limit 1
    `;
    const paymentId = existingPayments[0]?.id ?? randomUUID();
    const accessRequestId = input.access_request_id ?? existingPayments[0]?.access_request_id;

    if (existingPayments[0]) {
      await writeSql`
        update product_payments
        set status = 'paid',
          email = ${email},
          currency = ${input.currency ?? existingPayments[0].currency ?? null},
          amount_subtotal = ${input.amount_subtotal ?? existingPayments[0].amount_subtotal ?? null},
          amount_total = ${input.amount_total ?? existingPayments[0].amount_total ?? null},
          provider_payment_intent_id = ${input.provider_payment_intent_id ?? existingPayments[0].provider_payment_intent_id ?? null},
          provider_customer_id = ${input.provider_customer_id ?? existingPayments[0].provider_customer_id ?? null},
          provider_subscription_id = ${input.provider_subscription_id ?? existingPayments[0].provider_subscription_id ?? null},
          paid_at = ${paidAt},
          metadata = ${writeSql.json({ ...(existingPayments[0].metadata ?? {}), ...metadataJson })},
          updated_at = ${nowIso}
        where id = ${paymentId}
      `;
    } else {
      await writeSql`
        insert into product_payments (
          id, product_slug, provider, status, access_request_id, email, currency,
          amount_subtotal, amount_total, provider_checkout_session_id,
          provider_payment_intent_id, provider_customer_id, provider_subscription_id,
          paid_at, metadata, created_at, updated_at
        ) values (
          ${paymentId}, ${input.product_slug}, ${provider}, 'paid',
          ${accessRequestId ?? null}, ${email}, ${input.currency ?? null},
          ${input.amount_subtotal ?? null}, ${input.amount_total ?? null},
          ${input.provider_checkout_session_id}, ${input.provider_payment_intent_id ?? null},
          ${input.provider_customer_id ?? null}, ${input.provider_subscription_id ?? null},
          ${paidAt}, ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
        )
      `;
    }

    const existingEntitlements = await writeSql<ProductEntitlementRow[]>`
      select * from product_entitlements
      where source_payment_id = ${paymentId}
      limit 1
    `;
    if (!existingEntitlements[0]) {
      await writeSql`
        insert into product_entitlements (
          id, product_slug, access_type, email, status, source_payment_id,
          access_request_id, starts_at, ends_at, notes, metadata, created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.product_slug}, ${entitlementAccessType}, ${email}, 'active',
          ${paymentId}, ${accessRequestId ?? null}, ${paidAt}, ${isLifetimeAccess || isMonthlySubscription ? null : addDaysIso(new Date(paidAt), 30)},
          ${entitlementNotes}, ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
        )
        on conflict (source_payment_id) where source_payment_id is not null do nothing
      `;
    }

    if (accessRequestId) {
      await writeSql`
        update product_access_requests
        set status = 'paid', updated_at = ${nowIso}
        where id = ${accessRequestId}
      `;
    }

    return paymentId;
  }

  const db = await readLocalDb();
  let payment = db.product_payments.find((item) => item.provider_checkout_session_id === input.provider_checkout_session_id);
  if (!payment) {
    payment = {
      id: randomUUID(),
      product_slug: input.product_slug,
      provider,
      status: "paid",
      email,
      access_request_id: input.access_request_id,
      provider_checkout_session_id: input.provider_checkout_session_id,
      created_at: nowIso,
      updated_at: nowIso
    };
    db.product_payments.unshift(payment);
  }

  payment.status = "paid";
  payment.email = email;
  payment.access_request_id = input.access_request_id ?? payment.access_request_id;
  payment.currency = input.currency ?? payment.currency;
  payment.amount_subtotal = input.amount_subtotal ?? payment.amount_subtotal;
  payment.amount_total = input.amount_total ?? payment.amount_total;
  payment.provider_payment_intent_id = input.provider_payment_intent_id ?? payment.provider_payment_intent_id;
  payment.provider_customer_id = input.provider_customer_id ?? payment.provider_customer_id;
  payment.provider_subscription_id = input.provider_subscription_id ?? payment.provider_subscription_id;
  payment.paid_at = paidAt;
  payment.metadata = { ...(payment.metadata ?? {}), ...metadataJson };
  payment.updated_at = nowIso;

  if (!db.product_entitlements.some((item) => item.source_payment_id === payment.id)) {
    db.product_entitlements.unshift({
      id: randomUUID(),
      product_slug: input.product_slug,
      access_type: entitlementAccessType,
      email,
      status: "active",
      source_payment_id: payment.id,
      access_request_id: payment.access_request_id,
      starts_at: paidAt,
      ends_at: isLifetimeAccess || isMonthlySubscription ? undefined : addDaysIso(new Date(paidAt), 30),
      notes: entitlementNotes,
      metadata: metadataJson,
      created_at: nowIso,
      updated_at: nowIso
    });
  }

  if (payment.access_request_id) {
    const request = db.product_access_requests.find((item) => item.id === payment.access_request_id);
    if (request) {
      request.status = "paid";
      request.updated_at = nowIso;
    }
  }

  await writeLocalDb(db);
  return payment.id;
}

export async function getProductPaymentByProviderCheckoutSessionId(
  providerCheckoutSessionId: string
): Promise<ProductPayment | null> {
  if (hasDatabaseUrl()) {
    const sql = getReadSql();
    const rows = await sql<ProductPaymentRow[]>`
      select * from product_payments
      where provider_checkout_session_id = ${providerCheckoutSessionId}
      limit 1
    `;
    return rows[0] ? mapProductPaymentRow(rows[0]) : null;
  }

  const db = await readLocalDbSafe();
  return db.product_payments.find((payment) => payment.provider_checkout_session_id === providerCheckoutSessionId) ?? null;
}

function isEntitlementCurrentlyActive(entitlement: ProductEntitlement) {
  if (entitlement.status !== "active") return false;
  if (!entitlement.ends_at) return true;
  return new Date(entitlement.ends_at).getTime() > Date.now();
}

export type PaidProductLicenseAccess = {
  payment: ProductPayment;
  entitlement: ProductEntitlement;
  licenseKey?: ProductLicenseKey;
};

export async function getPaidProductLicenseAccessByCheckoutSessionId(
  providerCheckoutSessionId: string,
  productSlug: ProductSlug
): Promise<PaidProductLicenseAccess | null> {
  await ensureProductLicenseTables();

  if (hasDatabaseUrl()) {
    const sql = getReadSql();
    const rows = await sql<Array<{
      payment: ProductPaymentRow;
      entitlement: ProductEntitlementRow;
      license_key: ProductLicenseKeyRow | null;
    }>>`
      select
        to_jsonb(p.*) as payment,
        to_jsonb(e.*) as entitlement,
        case when lk.id is null then null else to_jsonb(lk.*) end as license_key
      from product_payments p
      join product_entitlements e on e.source_payment_id = p.id
      left join product_license_keys lk on lk.entitlement_id = e.id
      where p.provider_checkout_session_id = ${providerCheckoutSessionId}
        and p.product_slug = ${productSlug}
        and p.status = 'paid'
        and e.status = 'active'
      order by e.created_at desc
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const entitlement = mapProductEntitlementRow(row.entitlement);
    if (!isEntitlementCurrentlyActive(entitlement)) return null;
    return {
      payment: mapProductPaymentRow(row.payment),
      entitlement,
      licenseKey: row.license_key ? mapProductLicenseKeyRow(row.license_key) : undefined
    };
  }

  const db = await readLocalDbSafe();
  const payment = db.product_payments.find(
    (item) => item.provider_checkout_session_id === providerCheckoutSessionId && item.product_slug === productSlug && item.status === "paid"
  );
  if (!payment) return null;
  const entitlement = db.product_entitlements.find(
    (item) => item.source_payment_id === payment.id && item.product_slug === productSlug && isEntitlementCurrentlyActive(item)
  );
  if (!entitlement) return null;
  return {
    payment,
    entitlement,
    licenseKey: db.product_license_keys.find((item) => item.entitlement_id === entitlement.id && item.status === "active")
  };
}

export async function ensureProductLicenseKey(input: {
  product_slug: ProductSlug;
  entitlement_id: string;
  source_payment_id?: string;
  key_hash: string;
  key_suffix: string;
  max_activations?: number;
}): Promise<ProductLicenseKey> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();
  const maxActivations = input.max_activations ?? 1;

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into product_license_keys (
        id, product_slug, entitlement_id, source_payment_id, key_hash, key_suffix,
        status, max_activations, created_at, updated_at
      ) values (
        ${randomUUID()}, ${input.product_slug}, ${input.entitlement_id}, ${input.source_payment_id ?? null},
        ${input.key_hash}, ${input.key_suffix}, 'active', ${maxActivations}, ${nowIso}, ${nowIso}
      )
      on conflict (key_hash) do nothing
    `;
    const rows = await writeSql<ProductLicenseKeyRow[]>`
      select * from product_license_keys
      where key_hash = ${input.key_hash}
      limit 1
    `;
    if (!rows[0]) throw new Error("license_key_not_created");
    return mapProductLicenseKeyRow(rows[0]);
  }

  const db = await readLocalDb();
  let licenseKey = db.product_license_keys.find((item) => item.key_hash === input.key_hash);
  if (!licenseKey) {
    licenseKey = {
      id: randomUUID(),
      product_slug: input.product_slug,
      entitlement_id: input.entitlement_id,
      source_payment_id: input.source_payment_id,
      key_hash: input.key_hash,
      key_suffix: input.key_suffix,
      status: "active",
      max_activations: maxActivations,
      created_at: nowIso,
      updated_at: nowIso
    };
    db.product_license_keys.unshift(licenseKey);
    await writeLocalDb(db);
  }
  return licenseKey;
}

export type ProductLicenseActivationResult =
  | { status: "active"; activation: ProductLicenseActivation; licenseKey: ProductLicenseKey; entitlement: ProductEntitlement }
  | { status: "invalid_license" | "inactive" | "activation_limit_reached" };

export async function activateProductLicense(input: {
  product_slug: ProductSlug;
  key_hash: string;
  device_id_hash: string;
  token_hash: string;
  metadata?: Record<string, unknown>;
}): Promise<ProductLicenseActivationResult> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const licenseRows = await writeSql<Array<{ license_key: ProductLicenseKeyRow; entitlement: ProductEntitlementRow }>>`
      select to_jsonb(lk.*) as license_key, to_jsonb(e.*) as entitlement
      from product_license_keys lk
      join product_entitlements e on e.id = lk.entitlement_id
      where lk.key_hash = ${input.key_hash}
        and lk.product_slug = ${input.product_slug}
      limit 1
    `;
    const licenseRow = licenseRows[0];
    if (!licenseRow) return { status: "invalid_license" };
    const licenseKey = mapProductLicenseKeyRow(licenseRow.license_key);
    const entitlement = mapProductEntitlementRow(licenseRow.entitlement);
    if (licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) return { status: "inactive" };

    const existingDeviceRows = await writeSql<ProductLicenseActivationRow[]>`
      select * from product_license_activations
      where license_key_id = ${licenseKey.id}
        and device_id_hash = ${input.device_id_hash}
        and status = 'active'
      limit 1
    `;
    const existingDeviceActivation = existingDeviceRows[0];
    if (existingDeviceActivation) {
      await writeSql`
        update product_license_activations
        set token_hash = ${input.token_hash},
          last_verified_at = ${nowIso},
          metadata = ${writeSql.json({ ...(existingDeviceActivation.metadata ?? {}), ...metadataJson })},
          updated_at = ${nowIso}
        where id = ${existingDeviceActivation.id}
      `;
      return {
        status: "active",
        activation: {
          ...mapProductLicenseActivationRow(existingDeviceActivation),
          token_hash: input.token_hash,
          last_verified_at: nowIso,
          metadata: { ...(existingDeviceActivation.metadata ?? {}), ...metadataJson },
          updated_at: nowIso
        },
        licenseKey,
        entitlement
      };
    }

    const activeRows = await writeSql<Array<{ count: number }>>`
      select count(*)::int as count
      from product_license_activations
      where license_key_id = ${licenseKey.id}
        and status = 'active'
    `;
    if ((activeRows[0]?.count ?? 0) >= licenseKey.max_activations) {
      return { status: "activation_limit_reached" };
    }

    const activation: ProductLicenseActivation = {
      id: randomUUID(),
      license_key_id: licenseKey.id,
      product_slug: input.product_slug,
      device_id_hash: input.device_id_hash,
      token_hash: input.token_hash,
      status: "active",
      activated_at: nowIso,
      last_verified_at: nowIso,
      metadata: metadataJson,
      created_at: nowIso,
      updated_at: nowIso
    };
    await writeSql`
      insert into product_license_activations (
        id, license_key_id, product_slug, device_id_hash, token_hash, status,
        activated_at, last_verified_at, metadata, created_at, updated_at
      ) values (
        ${activation.id}, ${activation.license_key_id}, ${activation.product_slug}, ${activation.device_id_hash},
        ${activation.token_hash}, ${activation.status}, ${activation.activated_at}, ${nowIso},
        ${writeSql.json(metadataJson)}, ${activation.created_at}, ${activation.updated_at}
      )
    `;
    return { status: "active", activation, licenseKey, entitlement };
  }

  const db = await readLocalDb();
  const licenseKey = db.product_license_keys.find(
    (item) => item.key_hash === input.key_hash && item.product_slug === input.product_slug
  );
  if (!licenseKey) return { status: "invalid_license" };
  const entitlement = db.product_entitlements.find((item) => item.id === licenseKey.entitlement_id);
  if (!entitlement || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) return { status: "inactive" };

  const existingDeviceActivation = db.product_license_activations.find(
    (item) => item.license_key_id === licenseKey.id && item.device_id_hash === input.device_id_hash && item.status === "active"
  );
  if (existingDeviceActivation) {
    existingDeviceActivation.token_hash = input.token_hash;
    existingDeviceActivation.last_verified_at = nowIso;
    existingDeviceActivation.metadata = { ...(existingDeviceActivation.metadata ?? {}), ...metadataJson };
    existingDeviceActivation.updated_at = nowIso;
    await writeLocalDb(db);
    return { status: "active", activation: existingDeviceActivation, licenseKey, entitlement };
  }

  const activeActivationCount = db.product_license_activations.filter(
    (item) => item.license_key_id === licenseKey.id && item.status === "active"
  ).length;
  if (activeActivationCount >= licenseKey.max_activations) {
    return { status: "activation_limit_reached" };
  }

  const activation: ProductLicenseActivation = {
    id: randomUUID(),
    license_key_id: licenseKey.id,
    product_slug: input.product_slug,
    device_id_hash: input.device_id_hash,
    token_hash: input.token_hash,
    status: "active",
    activated_at: nowIso,
    last_verified_at: nowIso,
    metadata: metadataJson,
    created_at: nowIso,
    updated_at: nowIso
  };
  db.product_license_activations.unshift(activation);
  await writeLocalDb(db);
  return { status: "active", activation, licenseKey, entitlement };
}

export type ProductLicenseVerificationResult =
  | { status: "active"; activation: ProductLicenseActivation; licenseKey: ProductLicenseKey; entitlement: ProductEntitlement }
  | { status: "inactive" };

export async function verifyProductLicenseToken(input: {
  product_slug: ProductSlug;
  token_hash: string;
  device_id_hash: string;
}): Promise<ProductLicenseVerificationResult> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const rows = await writeSql<Array<{
      activation: ProductLicenseActivationRow;
      license_key: ProductLicenseKeyRow;
      entitlement: ProductEntitlementRow;
    }>>`
      select to_jsonb(a.*) as activation, to_jsonb(lk.*) as license_key, to_jsonb(e.*) as entitlement
      from product_license_activations a
      join product_license_keys lk on lk.id = a.license_key_id
      join product_entitlements e on e.id = lk.entitlement_id
      where a.token_hash = ${input.token_hash}
        and a.device_id_hash = ${input.device_id_hash}
        and a.product_slug = ${input.product_slug}
      limit 1
    `;
    const row = rows[0];
    if (!row) return { status: "inactive" };
    const activation = mapProductLicenseActivationRow(row.activation);
    const licenseKey = mapProductLicenseKeyRow(row.license_key);
    const entitlement = mapProductEntitlementRow(row.entitlement);
    if (activation.status !== "active" || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) {
      return { status: "inactive" };
    }
    await writeSql`
      update product_license_activations
      set last_verified_at = ${nowIso}, updated_at = ${nowIso}
      where id = ${activation.id}
    `;
    return {
      status: "active",
      activation: { ...activation, last_verified_at: nowIso, updated_at: nowIso },
      licenseKey,
      entitlement
    };
  }

  const db = await readLocalDb();
  const activation = db.product_license_activations.find(
    (item) => item.token_hash === input.token_hash && item.device_id_hash === input.device_id_hash && item.product_slug === input.product_slug
  );
  if (!activation) return { status: "inactive" };
  const licenseKey = db.product_license_keys.find((item) => item.id === activation.license_key_id);
  const entitlement = licenseKey ? db.product_entitlements.find((item) => item.id === licenseKey.entitlement_id) : undefined;
  if (!licenseKey || !entitlement || activation.status !== "active" || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) {
    return { status: "inactive" };
  }
  activation.last_verified_at = nowIso;
  activation.updated_at = nowIso;
  await writeLocalDb(db);
  return { status: "active", activation, licenseKey, entitlement };
}

export async function revokeProductAccessForPayment(input: {
  provider_checkout_session_id?: string;
  provider_payment_intent_id?: string;
  refunded_at?: string;
  metadata?: Record<string, unknown>;
}) {
  const nowIso = new Date().toISOString();
  const refundedAt = input.refunded_at ?? nowIso;
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));
  await ensureProductLicenseTables();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const paymentRows = await writeSql<ProductPaymentRow[]>`
      select * from product_payments
      where (${input.provider_checkout_session_id ?? null}::text is not null and provider_checkout_session_id = ${input.provider_checkout_session_id ?? null})
        or (${input.provider_payment_intent_id ?? null}::text is not null and provider_payment_intent_id = ${input.provider_payment_intent_id ?? null})
      limit 1
    `;
    const payment = paymentRows[0];
    if (!payment) return null;

    await writeSql`
      update product_payments
      set status = 'refunded',
        refunded_at = ${refundedAt},
        metadata = ${writeSql.json({ ...(payment.metadata ?? {}), ...metadataJson })},
        updated_at = ${nowIso}
      where id = ${payment.id}
    `;
    await writeSql`
      update product_entitlements
      set status = 'revoked', updated_at = ${nowIso}
      where source_payment_id = ${payment.id}
    `;
    await writeSql`
      update product_license_keys
      set status = 'revoked', updated_at = ${nowIso}
      where source_payment_id = ${payment.id}
    `;
    await writeSql`
      update product_license_activations
      set status = 'revoked', revoked_at = ${nowIso}, updated_at = ${nowIso}
      where license_key_id in (
        select id from product_license_keys where source_payment_id = ${payment.id}
      )
    `;
    return mapProductPaymentRow({ ...payment, status: "refunded", refunded_at: refundedAt, metadata: { ...(payment.metadata ?? {}), ...metadataJson }, updated_at: nowIso });
  }

  const db = await readLocalDb();
  const payment = db.product_payments.find(
    (item) =>
      (input.provider_checkout_session_id && item.provider_checkout_session_id === input.provider_checkout_session_id) ||
      (input.provider_payment_intent_id && item.provider_payment_intent_id === input.provider_payment_intent_id)
  );
  if (!payment) return null;
  payment.status = "refunded";
  payment.refunded_at = refundedAt;
  payment.metadata = { ...(payment.metadata ?? {}), ...metadataJson };
  payment.updated_at = nowIso;
  const entitlementIds = new Set<string>();
  for (const entitlement of db.product_entitlements) {
    if (entitlement.source_payment_id === payment.id) {
      entitlement.status = "revoked";
      entitlement.updated_at = nowIso;
      entitlementIds.add(entitlement.id);
    }
  }
  const licenseKeyIds = new Set<string>();
  for (const licenseKey of db.product_license_keys) {
    if (licenseKey.source_payment_id === payment.id || entitlementIds.has(licenseKey.entitlement_id)) {
      licenseKey.status = "revoked";
      licenseKey.updated_at = nowIso;
      licenseKeyIds.add(licenseKey.id);
    }
  }
  for (const activation of db.product_license_activations) {
    if (licenseKeyIds.has(activation.license_key_id)) {
      activation.status = "revoked";
      activation.revoked_at = nowIso;
      activation.updated_at = nowIso;
    }
  }
  await writeLocalDb(db);
  return payment;
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

export async function savePost(input: Partial<Post> & Pick<Post, "title" | "slug" | "status">) {
  if (hasDatabaseUrl()) {
    await ensurePostsTable();
    const sql = getWriteSql();
    const now = new Date().toISOString();
    let savedPostId = input.id;
    const duplicate = await sql<{ id: string }[]>`
      select id from posts where slug = ${input.slug} and id <> ${input.id ?? ""} limit 1
    `;
    if (duplicate.length) throw new Error("Slug must be unique");

    if (input.id) {
      const existing = await sql<{ id: string; published_at: string | null; status: string }[]>`
        select id, published_at, status from posts where id = ${input.id} limit 1
      `;
      if (!existing.length) throw new Error("Post not found");

      const publishedAt = input.status === "published"
        ? input.published_at ?? existing[0].published_at ?? now
        : input.published_at ?? null;

      await sql`
        update posts
        set
          title = ${input.title},
          slug = ${input.slug},
          summary = ${input.summary ?? null},
          content = ${input.content ?? null},
          cover_image_url = ${input.cover_image_url ?? null},
          topic_tag = ${input.topic_tag ?? null},
          seo_title = ${input.seo_title ?? null},
          seo_description = ${input.seo_description ?? null},
          cta_type = coalesce(${input.cta_type ?? null}, cta_type),
          cta_target = coalesce(${input.cta_target ?? null}, cta_target),
          faq = ${sql.json(input.faq ?? [])},
          status = ${input.status},
          published_at = ${publishedAt},
          updated_at = ${now},
          read_time = ${input.read_time ?? null}
        where id = ${input.id}
      `;
    } else {
      const postId = randomUUID();
      savedPostId = postId;
      const publishedAt = input.status === "published" ? input.published_at ?? now : input.published_at;

      await sql`
        insert into posts (
          id, title, slug, summary, content, cover_image_url,
          topic_tag, seo_title, seo_description, cta_type, cta_target, faq, status,
          published_at, created_at, updated_at, read_time
        ) values (
          ${postId}, ${input.title}, ${input.slug}, ${input.summary ?? null}, ${input.content ?? null},
          ${input.cover_image_url ?? null},
          ${input.topic_tag ?? null},
          ${input.seo_title ?? null}, ${input.seo_description ?? null},
          ${input.cta_type ?? null}, ${input.cta_target ?? null},
          ${sql.json(input.faq ?? [])},
          ${input.status}, ${publishedAt ?? null},
          ${now}, ${now}, ${input.read_time ?? null}
        )
      `;
    }

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();

      if (input.id) {
        const localExisting = localDb.posts.find((item) => item.id === input.id);
        if (localExisting) {
          Object.assign(localExisting, input, {
            updated_at: now,
            published_at: input.status === "published"
              ? input.published_at ?? localExisting.published_at ?? now
              : input.published_at ?? undefined
          });
        }
      } else {
        localDb.posts.unshift({
          id: savedPostId ?? randomUUID(),
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          content: input.content,
          cover_image_url: input.cover_image_url,
          topic_tag: input.topic_tag,
          seo_title: input.seo_title,
          seo_description: input.seo_description,
          cta_type: input.cta_type,
          cta_target: input.cta_target,
          faq: input.faq,
          status: input.status,
          published_at: input.status === "published" ? input.published_at ?? now : input.published_at,
          created_at: now,
          updated_at: now,
          read_time: input.read_time
        });
      }

      await writeLocalDb(localDb);
    }

    revalidateTag("public-posts", "max");
    return;
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const duplicate = db.posts.find((item) => item.slug === input.slug && item.id !== input.id);
  if (duplicate) throw new Error("Slug must be unique");

  if (input.id) {
    const existing = db.posts.find((item) => item.id === input.id);
    if (!existing) throw new Error("Post not found");
    Object.assign(existing, input, { updated_at: now });
    if (existing.status === "published" && !existing.published_at) {
      existing.published_at = now;
    }
  } else {
    db.posts.unshift({
      id: randomUUID(),
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      content: input.content,
      cover_image_url: input.cover_image_url,
      topic_tag: input.topic_tag,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      cta_type: input.cta_type,
      cta_target: input.cta_target,
      faq: input.faq,
      status: input.status,
      published_at: input.status === "published" ? input.published_at ?? now : input.published_at,
      created_at: now,
      updated_at: now,
      read_time: input.read_time
    });
  }

  await writeLocalDb(db);
  revalidateTag("public-posts", "max");
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

export async function saveProduct(
  input: Partial<Product> & Pick<Product, "slug" | "name" | "delivery_mode" | "development_status" | "price_cents" | "currency" | "payment_enabled" | "status">
) {
  if (hasDatabaseUrl()) {
    await ensureProductsTable();
    const sql = getWriteSql();
    const now = new Date().toISOString();
    const duplicate = await sql<{ id: string }[]>`
      select id from products where slug = ${input.slug} and id <> ${input.id ?? ""} limit 1
    `;
    if (duplicate.length) throw new Error("Slug must be unique");

    const publishedAt = input.status === "published" ? input.published_at ?? now : input.published_at ?? null;

    if (input.id) {
      const existing = await sql<{ id: string }[]>`select id from products where id = ${input.id} limit 1`;
      if (!existing.length) {
        await sql`
          insert into products (
            id, slug, name, short_description, hero_title, hero_description, audience,
            problem, promise, landing_page_url, features, delivery_mode, development_status, price_cents, currency,
            payment_enabled, status, seo_title, seo_description, published_at,
            created_at, updated_at
          ) values (
            ${input.id}, ${input.slug}, ${input.name}, ${input.short_description ?? null},
            ${input.hero_title ?? null}, ${input.hero_description ?? null}, ${input.audience ?? null},
            ${input.problem ?? null}, ${input.promise ?? null}, ${input.landing_page_url ?? null},
            ${sql.json(input.features ?? [])}, ${input.delivery_mode},
            ${input.development_status}, ${input.price_cents}, ${input.currency},
            ${input.payment_enabled}, ${input.status}, ${input.seo_title ?? null},
            ${input.seo_description ?? null}, ${publishedAt}, ${now}, ${now}
          )
        `;
      }

      await sql`
        update products
        set
          slug = ${input.slug},
          name = ${input.name},
          short_description = ${input.short_description ?? null},
          hero_title = ${input.hero_title ?? null},
          hero_description = ${input.hero_description ?? null},
          audience = ${input.audience ?? null},
          problem = ${input.problem ?? null},
          promise = ${input.promise ?? null},
          landing_page_url = ${input.landing_page_url ?? null},
          features = ${sql.json(input.features ?? [])},
          delivery_mode = ${input.delivery_mode},
          development_status = ${input.development_status},
          price_cents = ${input.price_cents},
          currency = ${input.currency},
          payment_enabled = ${input.payment_enabled},
          status = ${input.status},
          seo_title = ${input.seo_title ?? null},
          seo_description = ${input.seo_description ?? null},
          published_at = ${publishedAt},
          updated_at = ${now}
        where id = ${input.id}
      `;
    } else {
      await sql`
        insert into products (
          id, slug, name, short_description, hero_title, hero_description, audience,
          problem, promise, landing_page_url, features, delivery_mode, development_status, price_cents, currency,
          payment_enabled, status, seo_title, seo_description, published_at,
          created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.slug}, ${input.name}, ${input.short_description ?? null},
          ${input.hero_title ?? null}, ${input.hero_description ?? null}, ${input.audience ?? null},
          ${input.problem ?? null}, ${input.promise ?? null}, ${input.landing_page_url ?? null},
          ${sql.json(input.features ?? [])}, ${input.delivery_mode}, ${input.development_status},
          ${input.price_cents}, ${input.currency}, ${input.payment_enabled}, ${input.status},
          ${input.seo_title ?? null}, ${input.seo_description ?? null}, ${publishedAt},
          ${now}, ${now}
        )
      `;
    }

    revalidateTag("public-products", "max");
    return;
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const duplicate = db.products.find((item) => item.slug === input.slug && item.id !== input.id);
  if (duplicate) throw new Error("Slug must be unique");

  if (input.id) {
    const existing = db.products.find((item) => item.id === input.id);
    if (!existing) throw new Error("Product not found");
    Object.assign(existing, input, {
      published_at: input.status === "published" ? input.published_at ?? existing.published_at ?? now : input.published_at ?? undefined,
      updated_at: now
    });
  } else {
    db.products.unshift({
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      short_description: input.short_description,
      hero_title: input.hero_title,
      hero_description: input.hero_description,
      audience: input.audience,
      problem: input.problem,
      promise: input.promise,
      landing_page_url: input.landing_page_url,
      features: input.features ?? [],
      delivery_mode: input.delivery_mode,
      development_status: input.development_status,
      price_cents: input.price_cents,
      currency: input.currency,
      payment_enabled: input.payment_enabled,
      status: input.status,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      published_at: input.status === "published" ? input.published_at ?? now : input.published_at,
      created_at: now,
      updated_at: now
    });
  }

  await writeLocalDb(db);
  revalidateTag("public-products", "max");
}

export async function syncSeedProducts() {
  const seedProducts = seedDatabase.products;

  if (hasDatabaseUrl()) {
    await ensureProductsTable();
    const sql = getWriteSql();
    let inserted = 0;
    let updated = 0;

    for (const product of seedProducts) {
      const existing = await sql<{ id: string }[]>`
        select id from products where slug = ${product.slug} limit 1
      `;
      const rows = await sql<{ id: string }[]>`
        insert into products (
          id, slug, name, short_description, hero_title, hero_description, audience,
          problem, promise, delivery_mode, development_status, price_cents, currency,
          payment_enabled, status, seo_title, seo_description, published_at,
          created_at, updated_at
        ) values (
          ${product.id}, ${product.slug}, ${product.name}, ${product.short_description ?? null},
          ${product.hero_title ?? null}, ${product.hero_description ?? null}, ${product.audience ?? null},
          ${product.problem ?? null}, ${product.promise ?? null}, ${product.delivery_mode},
          ${product.development_status}, ${product.price_cents}, ${product.currency},
          ${product.payment_enabled}, ${product.status}, ${product.seo_title ?? null},
          ${product.seo_description ?? null}, ${product.published_at ?? null},
          ${product.created_at}, ${product.updated_at}
        )
        on conflict (slug) do update set
          name = excluded.name,
          short_description = excluded.short_description,
          hero_title = excluded.hero_title,
          hero_description = excluded.hero_description,
          audience = excluded.audience,
          problem = excluded.problem,
          promise = excluded.promise,
          delivery_mode = excluded.delivery_mode,
          development_status = excluded.development_status,
          price_cents = excluded.price_cents,
          currency = excluded.currency,
          payment_enabled = excluded.payment_enabled,
          status = excluded.status,
          seo_title = excluded.seo_title,
          seo_description = excluded.seo_description,
          published_at = excluded.published_at,
          updated_at = excluded.updated_at
        returning id
      `;
      if (rows.length) {
        if (existing.length) {
          updated += 1;
        } else {
          inserted += 1;
        }
      }
    }

    revalidateTag("public-products", "max");
    return { inserted, updated, total: seedProducts.length };
  }

  const db = await readLocalDb();
  let inserted = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const product of seedProducts) {
    const existingIndex = db.products.findIndex((item) => item.slug === product.slug);
    const nextProduct = {
      ...product,
      created_at: existingIndex >= 0 ? db.products[existingIndex].created_at : now,
      updated_at: now,
      published_at: product.status === "published" ? product.published_at ?? now : product.published_at
    };

    if (existingIndex >= 0) {
      db.products[existingIndex] = nextProduct;
      updated += 1;
    } else {
      db.products.unshift(nextProduct);
      inserted += 1;
    }
  }

  await writeLocalDb(db);
  revalidateTag("public-products", "max");
  return { inserted, updated, total: seedProducts.length };
}

export async function deleteProductById(id: string) {
  if (hasDatabaseUrl()) {
    await ensureProductsTable();
    const sql = getWriteSql();
    await sql`
      delete from products
      where id = ${id}
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const db = await readLocalDb();
      db.products = db.products.filter((product) => product.id !== id);
      await writeLocalDb(db);
    }

    revalidateTag("public-products", "max");
    return;
  }

  const db = await readLocalDb();
  db.products = db.products.filter((product) => product.id !== id);
  await writeLocalDb(db);
  revalidateTag("public-products", "max");
}

function filterPublishedProducts(products: Product[]) {
  return products
    .filter((product) => product.status === "published")
    .sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));
}

function getSeedPublicProducts() {
  return filterPublishedProducts(seedDatabase.products.map(mapProductRow));
}

function getSeedProductBySlug(slug: string) {
  return getSeedPublicProducts().find((product) => product.slug === slug) ?? null;
}

async function readPublicProducts() {
  if (shouldReadLiveProducts()) {
    try {
      const sql = getReadSql();
      const products = await readWithRetry(
        "Public products read",
        () => withTimeout(sql<ProductRow[]>`
          select * from products
          where status = 'published'
          order by published_at desc nulls last, created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );

      const publicProducts = products.map(mapProductRow);
      return publicProducts.length > 0 ? publicProducts : getSeedPublicProducts();
    } catch (error) {
      console.error("Falling back to local products:", error);
    }
  }

  const db = await readLocalDbSafe();
  return filterPublishedProducts(db.products.map(mapProductRow));
}

const getCachedAllPublicProducts = unstable_cache(
  async () => readPublicProducts(),
  ["public-products", "all"],
  {
    tags: ["public-products"],
    revalidate: 300
  }
);

export async function getPublicProducts() {
  return getCachedAllPublicProducts();
}

export async function getAdminProducts() {
  if (shouldReadLiveProducts()) {
    const sql = getReadSql();
    const products = await readWithRetry(
      "Admin products read",
      () => withTimeout(sql<ProductRow[]>`
        select * from products
        order by created_at desc
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return products.map(mapProductRow);
  }

  const db = await readLocalDbSafe();
  return db.products.map(mapProductRow);
}

export async function getProductById(id: string) {
  if (shouldReadLiveProducts()) {
    const sql = getReadSql();
    const products = await readWithRetry(
      "Product by id read",
      () => withTimeout(sql<ProductRow[]>`
        select * from products where id = ${id} limit 1
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return products[0] ? mapProductRow(products[0]) : null;
  }

  const db = await readLocalDbSafe();
  return db.products.find((product) => product.id === id) ?? null;
}

export async function getProductBySlug(slug: string) {
  if (shouldReadLiveProducts()) {
    try {
      const sql = getReadSql();
      const products = await readWithRetry(
        "Product by slug read",
        () => withTimeout(sql<ProductRow[]>`
          select * from products
          where slug = ${slug} and status = 'published'
          limit 1
        `, ADMIN_DB_TIMEOUT_MS)
      );

      if (products[0]) {
        return mapProductRow(products[0]);
      }

      const publicProducts = await getCachedAllPublicProducts();
      return publicProducts.find((product) => product.slug === slug) ?? null;
    } catch (error) {
      console.error("Falling back to local product lookup:", error);
    }
  }

  const db = await readLocalDbSafe();
  return db.products.find((product) => product.slug === slug && product.status === "published") ?? null;
}

export async function getPublicPosts(topic?: string) {
  if (topic && topic !== "all") {
    return getCachedTopicPublicPosts(topic);
  }

  return getCachedAllPublicPosts();
}

export async function getAdminPosts() {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const posts = await readWithRetry(
      "Admin posts read",
      () => withTimeout(sql<PostRow[]>`
        select id, title, slug, summary, topic_tag,
          status, published_at, created_at, updated_at, read_time
        from posts
        order by created_at desc
      `, ADMIN_DB_TIMEOUT_MS)
    );

    return posts.map(mapPostRow).map(toPostListItem);
  }

  const db = await readLocalDbSafe();
  return db.posts.map(toPostListItem);
}

export async function getPostBySlug(slug: string, options?: { preferLocal?: boolean; timeoutMs?: number }) {
  const preferLocal = options?.preferLocal ?? false;
  const timeoutMs = options?.timeoutMs ?? 4000;

  if (preferLocal) {
    const db = await readLocalDb();
    return db.posts.find((post) => post.slug === slug && post.status === "published");
  }

  if (hasDatabaseUrl()) {
    try {
      const sql = getReadSql();
      const posts = await readWithRetry(
        "Public post detail read",
        () => withTimeout(sql<PostRow[]>`
          select * from posts
          where slug = ${slug} and status = 'published'
          limit 1
        `, timeoutMs)
      );

      return posts[0] ? mapPostRow(posts[0]) : undefined;
    } catch (error) {
      console.error("Falling back to local post detail:", error);
    }
  }

  const db = await readLocalDbSafe();
  return db.posts.find((post) => post.slug === slug && post.status === "published");
}

export async function getRelatedPosts(slug: string, limit = 3, options?: { preferLocal?: boolean; timeoutMs?: number }) {
  const preferLocal = options?.preferLocal ?? false;
  const timeoutMs = options?.timeoutMs ?? 4000;

  if (preferLocal || process.env.NODE_ENV !== "production") {
    const db = await readLocalDb();
    return db.posts
      .filter((post) => post.status === "published" && post.slug !== slug)
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, limit);
  }

  if (hasDatabaseUrl()) {
    try {
      const sql = getReadSql();
      const posts = await readWithRetry(
        "Related posts read",
        () => withTimeout(sql<PostRow[]>`
          select * from posts
          where status = 'published' and slug <> ${slug}
          order by published_at desc nulls last, created_at desc
          limit ${limit}
        `, timeoutMs)
      );

      return posts.map(mapPostRow);
    } catch (error) {
      console.error("Falling back to local related posts:", error);
    }
  }

  const db = await readLocalDbSafe();
  return db.posts
    .filter((post) => post.status === "published" && post.slug !== slug)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, limit);
}

export async function getAnyPostById(id: string, options?: { preferLocal?: boolean; timeoutMs?: number }) {
  const preferLocal = options?.preferLocal ?? false;

  if (preferLocal || process.env.NODE_ENV !== "production") {
    const db = await readLocalDb();
    const localPost = db.posts.find((post) => post.id === id);
    if (localPost) {
      return localPost;
    }
  }

  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const posts = await readWithRetry(
      "Admin post read",
      () => withTimeout(sql<PostRow[]>`
        select * from posts
        where id = ${id}
        limit 1
      `, options?.timeoutMs ?? ADMIN_DB_TIMEOUT_MS)
    );

    return posts[0] ? mapPostRow(posts[0]) : undefined;
  }

  const db = await readLocalDbSafe();
  return db.posts.find((post) => post.id === id);
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

export async function deletePostById(id: string) {
  if (hasDatabaseUrl()) {
    const sql = getWriteSql();
    await sql`
      delete from posts
      where id = ${id}
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const db = await readLocalDb();
      db.posts = db.posts.filter((post) => post.id !== id);
      await writeLocalDb(db);
    }

    revalidateTag("public-posts", "max");
    return;
  }

  const db = await readLocalDb();
  db.posts = db.posts.filter((post) => post.id !== id);
  await writeLocalDb(db);
  revalidateTag("public-posts", "max");
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

export async function getDashboardMetrics() {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const [counts, latestSubscribers, latestWaitlists, latestDemands, leadRadarDemoReferrers] = await readWithRetry(
      "Dashboard metrics read",
      () => withTimeout(Promise.all([
        sql<{
          total_demands: number;
          published_posts: number;
          total_subscribers: number;
          active_subscribers: number;
          qualified_subscribers: number;
          resource_signups: number;
          waitlist_count: number;
          waitlist_subscribers: number;
          leadradar_demo_clicks: number;
          research_views: number;
          product_page_views: number;
          trial_access_clicks: number;
          install_clicks: number;
          review_completions: number;
          feedback_count: number;
        }[]>`
          select
            (select count(*)::int from demands where status <> 'archived') as total_demands,
            (select count(*)::int from posts where status = 'published') as published_posts,
            (select count(*)::int from subscribers) as total_subscribers,
            (select count(*)::int from subscribers where status = 'active') as active_subscribers,
            (select count(*)::int from subscribers where status = 'active' and persona_tag is not null) as qualified_subscribers,
            (select count(*)::int from subscribers where status = 'active' and source_type = 'resource') as resource_signups,
            (select count(*)::int from waitlists) as waitlist_count,
            (
              select count(*)::int
              from subscribers
              where status = 'active'
                and lower(email) in (select lower(email) from waitlists)
            ) as waitlist_subscribers,
            (
              select count(*)::int
              from post_events
              where post_slug = 'tools/leadradar'
                and event_type in ('cta_click', 'demo_open')
            ) as leadradar_demo_clicks
            ,
            (
              select count(*)::int
              from post_events
              where event_type = 'view'
            ) as research_views,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'product_page_view'
            ) as product_page_views,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'trial_access_click'
            ) as trial_access_clicks,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'install_click'
            ) as install_clicks,
            (
              select count(*)::int
              from post_events
              where post_slug = 'tools/leadradar'
                and event_type = 'review_complete'
            ) as review_completions,
            (select count(*)::int from feedback) as feedback_count
        `,
        sql<Subscriber[]>`select * from subscribers order by created_at desc limit 5`,
        sql<WaitlistEntry[]>`select * from waitlists order by created_at desc limit 5`,
        sql<DemandRow[]>`select * from demands order by created_at desc limit 5`,
        sql<{ path: string | null; referrer: string | null; clicks: number; last_event_at: string }[]>`
          select
            coalesce(nullif(path, ''), '/tools/leadradar') as path,
            coalesce(nullif(referrer, ''), 'Direct / unknown') as referrer,
            count(*)::int as clicks,
            max(created_at)::text as last_event_at
          from post_events
          where post_slug = 'tools/leadradar'
            and event_type in ('cta_click', 'demo_open')
          group by
            coalesce(nullif(path, ''), '/tools/leadradar'),
            coalesce(nullif(referrer, ''), 'Direct / unknown')
          order by clicks desc, max(created_at) desc
          limit 10
        `
      ]), ADMIN_DB_TIMEOUT_MS)
    );
    const metrics = counts[0];
    const activeSubscribers = metrics.active_subscribers;
    const resourceSignups = metrics.resource_signups;
    const waitlistSubscribers = metrics.waitlist_subscribers;

    return {
      totalDemands: metrics.total_demands,
      publishedPosts: metrics.published_posts,
      totalSubscribers: metrics.total_subscribers,
      qualifiedSubscribers: metrics.qualified_subscribers,
      resourceSignups,
      waitlistCount: metrics.waitlist_count,
      leadRadarDemoClicks: metrics.leadradar_demo_clicks,
      researchViews: metrics.research_views,
      productPageViews: metrics.product_page_views,
      trialAccessClicks: metrics.trial_access_clicks,
      installClicks: metrics.install_clicks,
      reviewCompletions: metrics.review_completions,
      feedbackCount: metrics.feedback_count,
      leadRadarDemoTraffic: leadRadarDemoReferrers.map((item) => ({
        path: item.path ?? "/tools/leadradar",
        referrer: item.referrer ?? "Direct / unknown",
        clicks: item.clicks,
        lastEventAt: item.last_event_at
      })),
      emailToWaitlistRate: activeSubscribers ? waitlistSubscribers / activeSubscribers : 0,
      resourceToEmailRate: activeSubscribers ? resourceSignups / activeSubscribers : 0,
      activeSubscribers,
      latestSubscribers: latestSubscribers.map(mapSubscriberRow),
      latestWaitlists: latestWaitlists.map(mapWaitlistRow),
      latestDemands: latestDemands.map(mapDemandRow)
    };
  }

  const db = await readLocalDbSafe();
  const activeSubscribers = db.subscribers.filter((item) => item.status === "active");
  const resourceSubscribers = activeSubscribers.filter((item) => item.source_type === "resource");
  const waitlistEmails = new Set(db.waitlists.map((item) => item.email.toLowerCase()));
  const waitlistSubscribers = activeSubscribers.filter((item) => waitlistEmails.has(item.email.toLowerCase()));
  const leadRadarDemoEvents = db.post_events.filter(
    (event) => event.post_slug === "tools/leadradar" && ["cta_click", "demo_open"].includes(event.event_type)
  );
  const leadRadarDemoTrafficMap = new Map<string, ToolTrafficMetric>();

  for (const event of leadRadarDemoEvents) {
    const path = event.path || "/tools/leadradar";
    const referrer = event.referrer || "Direct / unknown";
    const key = `${path}::${referrer}`;
    const current = leadRadarDemoTrafficMap.get(key) ?? { path, referrer, clicks: 0, lastEventAt: undefined };
    current.clicks += 1;
    if (!current.lastEventAt || event.created_at > current.lastEventAt) {
      current.lastEventAt = event.created_at;
    }
    leadRadarDemoTrafficMap.set(key, current);
  }

  return {
    totalDemands: db.demands.filter((item) => item.status !== "archived").length,
    publishedPosts: db.posts.filter((item) => item.status === "published").length,
    totalSubscribers: db.subscribers.length,
    qualifiedSubscribers: activeSubscribers.filter((item) => item.persona_tag).length,
    resourceSignups: resourceSubscribers.length,
    waitlistCount: db.waitlists.length,
    leadRadarDemoClicks: leadRadarDemoEvents.length,
    researchViews: db.post_events.filter((event) => event.event_type === "view").length,
    productPageViews: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "product_page_view"
    ).length,
    trialAccessClicks: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "trial_access_click"
    ).length,
    installClicks: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "install_click"
    ).length,
    reviewCompletions: db.post_events.filter(
      (event) => event.post_slug === "tools/leadradar" && event.event_type === "review_complete"
    ).length,
    feedbackCount: db.feedback.length,
    leadRadarDemoTraffic: Array.from(leadRadarDemoTrafficMap.values())
      .sort((a, b) => b.clicks - a.clicks || (b.lastEventAt ?? "").localeCompare(a.lastEventAt ?? ""))
      .slice(0, 10),
    emailToWaitlistRate: activeSubscribers.length ? waitlistSubscribers.length / activeSubscribers.length : 0,
    resourceToEmailRate: activeSubscribers.length ? resourceSubscribers.length / activeSubscribers.length : 0,
    activeSubscribers: activeSubscribers.length,
    latestSubscribers: db.subscribers.slice(0, 5),
    latestWaitlists: db.waitlists.slice(0, 5),
    latestDemands: db.demands.slice(0, 5)
  };
}

export async function getPostPerformance() {
  const db = shouldReadLiveAdminDb()
    ? await readAdminPostPerformanceData()
    : await readLocalDbSafe();
  const publishedOrDraftPosts = [...db.posts]
    .sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));

  const counters = new Map<string, {
    views: number;
    lastEventAt?: string;
  }>();

  const ensureCounter = (slug: string) => {
    const existing = counters.get(slug);
    if (existing) return existing;
    const created = { views: 0, lastEventAt: undefined as string | undefined };
    counters.set(slug, created);
    return created;
  };

  for (const event of db.post_events) {
    const counter = ensureCounter(event.post_slug);
    if (event.event_type === "view") counter.views += 1;
    if (!counter.lastEventAt || event.created_at > counter.lastEventAt) {
      counter.lastEventAt = event.created_at;
    }
  }

  return publishedOrDraftPosts.map<PostPerformance>((post) => {
    const counter = counters.get(post.slug) ?? {
      views: 0,
      lastEventAt: undefined
    };

    return {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      publishedAt: post.published_at,
      views: counter.views,
      lastEventAt: counter.lastEventAt
    };
  });
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

export async function getProductPayments(): Promise<ProductPayment[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product payments read",
        () => withTimeout(sql<ProductPaymentRow[]>`
          select * from product_payments
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductPaymentRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "product_payments")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_payments;
}

export async function getProductEntitlements(): Promise<ProductEntitlement[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product entitlements read",
        () => withTimeout(sql<ProductEntitlementRow[]>`
          select * from product_entitlements
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductEntitlementRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "product_entitlements")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_entitlements;
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

export async function getTrialEvents(): Promise<TrialEvent[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Trial events read",
        () => withTimeout(sql<TrialEventRow[]>`
          select * from trial_events
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapTrialEventRow).filter((event) => !isInternalTrialEvent(event));
    } catch (error) {
      if (isMissingOptionalTable(error, "trial_events")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.trial_events.filter((event) => !isInternalTrialEvent(event));
}

export async function getProductAdminMetrics() {
  const [accessRequests, trials, configs, events, payments, entitlements] = await Promise.all([
    getProductAccessRequests(),
    getProductTrials(),
    getLeadRadarConfigs(),
    getTrialEvents(),
    getProductPayments(),
    getProductEntitlements()
  ]);

  const eventCount = (eventType: TrialEvent["event_type"]) => events.filter((event) => event.event_type === eventType).length;
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const paidRevenueCents = paidPayments.reduce((total, payment) => total + (payment.amount_total ?? 0), 0);

  return {
    accessRequests: accessRequests.length,
    activeTrials: trials.filter((trial) => trial.status === "active" || trial.status === "requested").length,
    paidPayments: paidPayments.length,
    paidRevenueCents,
    activeEntitlements: entitlements.filter((entitlement) => entitlement.status === "active").length,
    completedConfigs: configs.filter((config) => config.status === "completed").length,
    productPageVisits: eventCount("product_page_visit"),
    trialAccessRequested: eventCount("trial_access_requested"),
    paypalAccessStarted: eventCount("paypal_access_started"),
    partnerPreviewRequested: eventCount("partner_preview_requested"),
    installClicked: eventCount("install_clicked"),
    configStarted: eventCount("radar_config_started"),
    configCompleted: eventCount("radar_config_completed"),
    keywordsAdded: eventCount("keywords_added"),
    reviewCompleted: eventCount("review_completed"),
    csvExported: eventCount("csv_exported"),
    calibrationFeedbackSubmitted: eventCount("calibration_feedback_submitted"),
    paidPilotRequested: eventCount("paid_pilot_requested"),
    latestEvents: events.slice(0, 12)
  };
}

export async function resetCacheUnsafe() {
  // Next.js cache invalidation is handled via revalidatePath in actions.
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

export async function getFeedbackSourcePageOptions(): Promise<string[]> {
  if (shouldReadLiveAdminDb()) {
    const rows = await readFeedbackRows();
    return Array.from(new Set(rows.map((entry) => entry.source_page).filter((value): value is string => Boolean(value))));
  }

  const db = await readLocalDbSafe();
  return Array.from(new Set(db.feedback.map((entry) => entry.source_page).filter((value): value is string => Boolean(value))));
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
