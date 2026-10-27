/**
 * 整库快照 —— readDb() 的实现：优先 Postgres，失败回落本地 JSON
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

import { getReadSql } from "@/lib/postgres";
import { hasDatabaseUrl } from "@/lib/env";
import { seedDatabase } from "@/lib/seed";
import { isInternalProductTrial, isInternalTrialEvent } from "@/lib/analytics-filters";
import type { Database, Product } from "@/lib/types";
import {
  isMissingOptionalTable,
  mapDemandRow,
  mapFeedbackRow,
  mapLeadRadarConfigRow,
  mapPostEventRow,
  mapPostRow,
  mapProductAccessRequestRow,
  mapProductEntitlementRow,
  mapProductLicenseActivationRow,
  mapProductLicenseKeyRow,
  mapProductRow,
  mapProductPaymentRow,
  mapProductTrialRow,
  mapResourceRow,
  mapSubscriberRow,
  mapTrialEventRow,
  mapWaitlistRow
} from "./rows";
import { readLocalDbSafe } from "./storage";
import { withTimeout, readWithRetry } from "./sql";
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
  ProductRow,
  ProductPaymentRow,
  ProductTrialRow,
  TrialEventRow
} from "./types";
import type { Resource, Subscriber, WaitlistEntry } from "@/lib/types";

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
