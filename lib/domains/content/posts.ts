/**
 * content 域 · 文章实现
 * 从 lib/db.ts 搬移（S2c-2），逻辑未改。域外只可见 ../index.ts。
 */
import { randomUUID } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { hasDatabaseUrl } from "@/lib/env";
import {
  getReadSql,
  getWriteSql,
  ADMIN_DB_TIMEOUT_MS,
  ensurePostsTable,
  mapPostRow,
  mapResourceRow,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldMirrorDatabaseToLocalFile,
  shouldReadLiveAdminDb,
  toPostListItem,
  withTimeout,
  writeLocalDb,
  PostRow,
  ResourcePerformance
} from "@/lib/platform";
import type {
  Post,
  Resource
} from "@/lib/types";
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
          cta_type = ${input.cta_type ?? null},
          cta_target = ${input.cta_target ?? null},
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
