/**
 * 自愈建表 —— 启动或首次写入时补齐缺失的表/列（幂等）
 *
 * 从 lib/db.ts 抽出（S2c）。代码逐字搬移，未改逻辑。
 * 只有 lib/domains/** 与 lib/platform/** 内部可以引用本文件（BOUNDARIES R1）。
 */

import { getWriteSql } from "@/lib/postgres";
import { hasDatabaseUrl } from "@/lib/env";

let productLicenseTablesReady: Promise<void> | null = null;

export async function ensureProductLicenseTables() {
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
let ensuredSubscriberNoteColumn = false;
let ensuredPostsTable = false;
let ensuredProductsTable = false;
let ensuredProductPaymentsEmailNullable = false;

export async function ensureSubscriberNoteColumn() {
  if (ensuredSubscriberNoteColumn || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`alter table subscribers add column if not exists note text`;
  ensuredSubscriberNoteColumn = true;
}

export async function ensurePostsTable() {
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

export async function ensureProductsTable() {
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

export async function ensureProductPaymentsEmailNullable() {
  if (ensuredProductPaymentsEmailNullable || !hasDatabaseUrl()) {
    return;
  }

  const writeSql = getWriteSql();
  await writeSql`alter table product_payments alter column email drop not null`;
  ensuredProductPaymentsEmailNullable = true;
}
