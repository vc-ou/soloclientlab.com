import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to import seed data.");
}

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1
});

const dataPath = path.join(process.cwd(), ".data", "db.json");
const raw = await readFile(dataPath, "utf8");
const db = JSON.parse(raw);

async function importTable(tableName, rows, mapper) {
  if (!rows.length) return;

  for (const row of rows) {
    await mapper(row);
  }

  console.log(`Imported ${rows.length} rows into ${tableName}.`);
}

try {
  await importTable("demands", db.demands ?? [], async (row) => {
    await sql`
      insert into demands (
        id, title, source_url, source_platform, user_quote, persona, job_to_be_done,
        problem_stage, solution_attempted, keyword, pain_score, frequency_score,
        payment_score, evidence_strength, status, tags, next_action, topic_tag,
        created_at, updated_at
      ) values (
        ${row.id}, ${row.title}, ${row.source_url ?? null}, ${row.source_platform ?? null}, ${row.user_quote ?? null},
        ${row.persona ?? null}, ${row.job_to_be_done ?? null}, ${row.problem_stage ?? null},
        ${row.solution_attempted ?? null}, ${row.keyword ?? null}, ${row.pain_score ?? null},
        ${row.frequency_score ?? null}, ${row.payment_score ?? null}, ${row.evidence_strength ?? null},
        ${row.status}, ${sql.json(row.tags ?? [])}, ${row.next_action ?? null}, ${row.topic_tag ?? null},
        ${row.created_at}, ${row.updated_at}
      )
      on conflict (id) do update set
        title = excluded.title,
        source_url = excluded.source_url,
        source_platform = excluded.source_platform,
        user_quote = excluded.user_quote,
        persona = excluded.persona,
        job_to_be_done = excluded.job_to_be_done,
        problem_stage = excluded.problem_stage,
        solution_attempted = excluded.solution_attempted,
        keyword = excluded.keyword,
        pain_score = excluded.pain_score,
        frequency_score = excluded.frequency_score,
        payment_score = excluded.payment_score,
        evidence_strength = excluded.evidence_strength,
        status = excluded.status,
        tags = excluded.tags,
        next_action = excluded.next_action,
        topic_tag = excluded.topic_tag,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `;
  });

  await importTable("posts", db.posts ?? [], async (row) => {
    await sql`
      insert into posts (
        id, title, slug, summary, content, related_persona, related_demand_ids,
        topic_tag, seo_title, seo_description, cta_type, cta_target, status,
        published_at, created_at, updated_at, read_time, hero_label
      ) values (
        ${row.id}, ${row.title}, ${row.slug}, ${row.summary ?? null}, ${row.content ?? null},
        ${row.related_persona ?? null}, ${sql.json(row.related_demand_ids ?? [])}, ${row.topic_tag ?? null},
        ${row.seo_title ?? null}, ${row.seo_description ?? null}, ${row.cta_type}, ${row.cta_target ?? null},
        ${row.status}, ${row.published_at ?? null}, ${row.created_at}, ${row.updated_at},
        ${row.read_time ?? null}, ${row.hero_label ?? null}
      )
      on conflict (id) do update set
        title = excluded.title,
        slug = excluded.slug,
        summary = excluded.summary,
        content = excluded.content,
        related_persona = excluded.related_persona,
        related_demand_ids = excluded.related_demand_ids,
        topic_tag = excluded.topic_tag,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        cta_type = excluded.cta_type,
        cta_target = excluded.cta_target,
        status = excluded.status,
        published_at = excluded.published_at,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        read_time = excluded.read_time,
        hero_label = excluded.hero_label
    `;
  });

  await importTable("resources", db.resources ?? [], async (row) => {
    await sql`
      insert into resources (
        id, title, slug, type, audience, related_topic, landing_page_slug,
        delivery_mode, delivery_url, status, created_at, updated_at
      ) values (
        ${row.id}, ${row.title}, ${row.slug}, ${row.type}, ${row.audience ?? null},
        ${row.related_topic ?? null}, ${row.landing_page_slug ?? null}, ${row.delivery_mode ?? null},
        ${row.delivery_url ?? null}, ${row.status}, ${row.created_at}, ${row.updated_at}
      )
      on conflict (id) do update set
        title = excluded.title,
        slug = excluded.slug,
        type = excluded.type,
        audience = excluded.audience,
        related_topic = excluded.related_topic,
        landing_page_slug = excluded.landing_page_slug,
        delivery_mode = excluded.delivery_mode,
        delivery_url = excluded.delivery_url,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `;
  });

  await importTable("subscribers", db.subscribers ?? [], async (row) => {
    await sql`
      insert into subscribers (
        id, email, source_page, source_type, lead_magnet, persona_tag,
        topic_tag, note, status, mailerlite_id, created_at, updated_at
      ) values (
        ${row.id}, ${row.email}, ${row.source_page ?? null}, ${row.source_type ?? null},
        ${row.lead_magnet ?? null}, ${row.persona_tag ?? null}, ${row.topic_tag ?? null},
        ${row.note ?? null},
        ${row.status}, ${row.mailerlite_id ?? null}, ${row.created_at}, ${row.updated_at}
      )
      on conflict (id) do update set
        email = excluded.email,
        source_page = excluded.source_page,
        source_type = excluded.source_type,
        lead_magnet = excluded.lead_magnet,
        persona_tag = excluded.persona_tag,
        topic_tag = excluded.topic_tag,
        note = excluded.note,
        status = excluded.status,
        mailerlite_id = excluded.mailerlite_id,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `;
  });

  await importTable("waitlists", db.waitlists ?? [], async (row) => {
    await sql`
      insert into waitlists (
        id, project_name, page_slug, email, source_page, interest_tag, note, created_at
      ) values (
        ${row.id}, ${row.project_name}, ${row.page_slug}, ${row.email}, ${row.source_page ?? null},
        ${row.interest_tag ?? null}, ${row.note ?? null}, ${row.created_at}
      )
      on conflict (id) do update set
        project_name = excluded.project_name,
        page_slug = excluded.page_slug,
        email = excluded.email,
        source_page = excluded.source_page,
        interest_tag = excluded.interest_tag,
        note = excluded.note,
        created_at = excluded.created_at
    `;
  });

  await importTable("post_events", db.post_events ?? [], async (row) => {
    await sql`
      insert into post_events (
        id, post_id, post_slug, event_type, cta_type, path, referrer, created_at
      ) values (
        ${row.id}, ${row.post_id ?? null}, ${row.post_slug}, ${row.event_type},
        ${row.cta_type ?? null}, ${row.path ?? null}, ${row.referrer ?? null}, ${row.created_at}
      )
      on conflict (id) do update set
        post_id = excluded.post_id,
        post_slug = excluded.post_slug,
        event_type = excluded.event_type,
        cta_type = excluded.cta_type,
        path = excluded.path,
        referrer = excluded.referrer,
        created_at = excluded.created_at
    `;
  });

  await importTable("products", db.products ?? [], async (row) => {
    await sql`
      insert into products (
        id, slug, name, short_description, hero_title, hero_description, audience,
        problem, promise, delivery_mode, development_status, price_cents, currency,
        payment_enabled, status, seo_title, seo_description, published_at,
        created_at, updated_at
      ) values (
        ${row.id}, ${row.slug}, ${row.name}, ${row.short_description ?? null},
        ${row.hero_title ?? null}, ${row.hero_description ?? null}, ${row.audience ?? null},
        ${row.problem ?? null}, ${row.promise ?? null}, ${row.delivery_mode},
        ${row.development_status}, ${row.price_cents}, ${row.currency ?? "USD"},
        ${row.payment_enabled ?? false}, ${row.status}, ${row.seo_title ?? null},
        ${row.seo_description ?? null}, ${row.published_at ?? null},
        ${row.created_at}, ${row.updated_at}
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
    `;
  });

  console.log("Seed data import complete.");
} finally {
  await sql.end();
}
