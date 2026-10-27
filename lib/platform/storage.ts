/**
 * 本地兜底存储 —— 无 DATABASE_URL 时的 .data/db.json 读写与运行模式判定
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabaseUrl } from "@/lib/env";
import { seedDatabase } from "@/lib/seed";
import type { Database, Post } from "@/lib/types";
import { normalizeTopicTag } from "./rows";

export // 测试或隔离环境可用 SCL_DATA_DIR 指定兜底库目录（默认 <cwd>/.data）
const dataDir = process.env.SCL_DATA_DIR ? path.resolve(process.env.SCL_DATA_DIR) : path.join(process.cwd(), ".data");
export const dataFile = path.join(dataDir, "db.json");
export async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedDatabase, null, 2), "utf8");
  }
}

export async function readLocalDb(): Promise<Database> {
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

export async function readLocalDbSafe(): Promise<Database> {
  try {
    return await readLocalDb();
  } catch (error) {
    console.error("Local data fallback is unavailable, using in-memory seed data:", error);
    return createInMemoryFallbackDb();
  }
}

export async function writeLocalDb(db: Database) {
  await writeFile(dataFile, JSON.stringify(db, null, 2), "utf8");
}

export function createInMemoryFallbackDb(): Database {
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

export function shouldMirrorDatabaseToLocalFile() {
  return process.env.NODE_ENV !== "production";
}
export function shouldReadLiveAdminDb() {
  return process.env.NODE_ENV === "production" && hasDatabaseUrl();
}

export function shouldReadLiveProducts() {
  return hasDatabaseUrl();
}
