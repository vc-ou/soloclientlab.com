import type {
  Demand,
  FeedbackEntry,
  LeadRadarConfig,
  Post,
  PostEvent,
  Product,
  ProductAccessRequest,
  ProductEntitlement,
  ProductLicenseActivation,
  ProductLicenseKey,
  ProductPayment,
  ProductTrial,
  Resource,
  Subscriber,
  TrialEvent,
  WaitlistEntry
} from "@/lib/types";
import type {
  DemandRow,
  FeedbackRow,
  LeadRadarConfigRow,
  PostEventRow,
  PostRow,
  ProductAccessRequestRow,
  ProductEntitlementRow,
  ProductLicenseActivationRow,
  ProductLicenseKeyRow,
  ProductPaymentRow,
  ProductRow,
  ProductTrialRow,
  TrialEventRow
} from "./types";

export function normalizeTopicTag(topic?: string | null) {
  if (topic === "client_acquisition" || topic === "marketing_positioning") {
    return "solo_worker_client_acquisition";
  }
  if (topic === "ai_automation" || topic === "offer_validation" || topic === "operations") {
    return "workflow_signal_research";
  }

  return topic ?? undefined;
}

export function toIsoString(value?: string | null) {
  return value ? new Date(value).toISOString() : undefined;
}

export function markTestValue(value?: string | null) {
  if (!value) return value ?? undefined;
  if (process.env.NODE_ENV === "production") return value;
  return value.includes("[TEST]") ? value : `${value} [TEST]`;
}

export function mapDemandRow(row: DemandRow): Demand {
  return {
    ...row,
    topic_tag: normalizeTopicTag(row.topic_tag) as Demand["topic_tag"],
    tags: row.tags ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapPostRow(row: PostRow): Post {
  return {
    ...row,
    topic_tag: normalizeTopicTag(row.topic_tag) as Post["topic_tag"],
    published_at: toIsoString(row.published_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductRow(row: ProductRow): Product {
  return {
    ...row,
    features: row.features ?? [],
    published_at: toIsoString(row.published_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function toPostListItem(post: Post): Post {
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

export function mapResourceRow(row: Resource): Resource {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapSubscriberRow(row: Subscriber): Subscriber {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapWaitlistRow(row: WaitlistEntry): WaitlistEntry {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

export function mapPostEventRow(row: PostEventRow): PostEvent {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

export function mapFeedbackRow(row: FeedbackRow): FeedbackEntry {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

export function mapProductAccessRequestRow(row: ProductAccessRequestRow): ProductAccessRequest {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductTrialRow(row: ProductTrialRow): ProductTrial {
  return {
    ...row,
    trial_started_at: toIsoString(row.trial_started_at),
    trial_ends_at: toIsoString(row.trial_ends_at),
    co_build_unlock_ends_at: toIsoString(row.co_build_unlock_ends_at),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductPaymentRow(row: ProductPaymentRow): ProductPayment {
  return {
    ...row,
    paid_at: toIsoString(row.paid_at),
    refunded_at: toIsoString(row.refunded_at),
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductEntitlementRow(row: ProductEntitlementRow): ProductEntitlement {
  return {
    ...row,
    starts_at: new Date(row.starts_at).toISOString(),
    ends_at: toIsoString(row.ends_at),
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductLicenseKeyRow(row: ProductLicenseKeyRow): ProductLicenseKey {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapProductLicenseActivationRow(row: ProductLicenseActivationRow): ProductLicenseActivation {
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

export function mapLeadRadarConfigRow(row: LeadRadarConfigRow): LeadRadarConfig {
  return {
    ...row,
    keywords: row.keywords ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

export function mapTrialEventRow(row: TrialEventRow): TrialEvent {
  return {
    ...row,
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString()
  };
}

export function isMissingOptionalTable(error: unknown, tableName: string) {
  const databaseError = error as { code?: string; message?: string } | undefined;
  return databaseError?.code === "42P01" || Boolean(databaseError?.message?.includes(tableName));
}
