/**
 * catalog 域 · 商品与定价实现
 * 从 lib/db.ts 搬移（S2c-2），逻辑未改。
 */
import { randomUUID } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { hasDatabaseUrl } from "@/lib/env";
import { seedDatabase } from "@/lib/seed";
import {
  getReadSql,
  getWriteSql,
  ADMIN_DB_TIMEOUT_MS,
  ensureProductsTable,
  mapProductRow,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldMirrorDatabaseToLocalFile,
  shouldReadLiveProducts,
  withTimeout,
  writeLocalDb,
  ProductRow
} from "@/lib/platform";
import type {
  Product
} from "@/lib/types";
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
