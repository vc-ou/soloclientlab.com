/**
 * 平台行类型 —— 数据库行 → 领域对象的中间形态
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

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

export type DemandRow = Omit<Demand, "tags"> & {
  tags: string[] | null;
};

export type PostRow = Post;
export type ProductRow = Product;

export type PostEventRow = PostEvent;
export type FeedbackRow = FeedbackEntry;
export type ProductAccessRequestRow = ProductAccessRequest;
export type ProductTrialRow = ProductTrial;
export type ProductPaymentRow = Omit<ProductPayment, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
export type ProductEntitlementRow = Omit<ProductEntitlement, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
export type ProductLicenseKeyRow = ProductLicenseKey;
export type ProductLicenseActivationRow = Omit<ProductLicenseActivation, "metadata"> & {
  metadata: Record<string, unknown> | null;
};
export type LeadRadarConfigRow = Omit<LeadRadarConfig, "keywords"> & {
  keywords: string[] | null;
};
export type TrialEventRow = Omit<TrialEvent, "metadata"> & {
  metadata: Record<string, unknown> | null;
};

export type SubscriberFilters = {
  source_type?: string;
  lead_magnet?: string;
  persona_tag?: string;
  topic_tag?: string;
  status?: string;
};

export type WaitlistFilters = {
  project_name?: string;
  page_slug?: string;
  interest_tag?: string;
  source_page?: string;
};

export type FeedbackFilters = {
  tool_slug?: string;
  is_useful?: string;
  has_attachment?: string;
  source_page?: string;
};

export type DemandFilters = {
  query?: string;
  source_platform?: string;
  persona?: string;
  status?: string;
  topic_tag?: string;
  sort?: string;
};

export type ResourcePerformance = Resource & {
  subscriberCount: number;
  conversionRate: number;
};

export type ToolTrafficMetric = {
  path: string;
  referrer: string;
  clicks: number;
  lastEventAt?: string;
};
