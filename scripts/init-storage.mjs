import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Supabase Storage.");
}

const bucketName = process.env.SUPABASE_POSTS_BUCKET || "posts";

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1
});

async function ensurePolicy(policyName, command, definition) {
  const existing = await sql`
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = ${policyName}
    limit 1
  `;

  if (!existing.length) {
    await sql.unsafe(`create policy "${policyName}" on storage.objects for ${command} ${definition}`);
  }
}

try {
  await sql`
    insert into storage.buckets (id, name, public)
    values (${bucketName}, ${bucketName}, true)
    on conflict (id) do update set
      name = excluded.name,
      public = excluded.public
  `;

  await ensurePolicy(
    "Public read posts bucket",
    "select",
    `to public using (bucket_id = '${bucketName}')`
  );

  await ensurePolicy(
    "Authenticated upload posts bucket",
    "insert",
    `to authenticated with check (bucket_id = '${bucketName}')`
  );

  await ensurePolicy(
    "Authenticated update posts bucket",
    "update",
    `to authenticated using (bucket_id = '${bucketName}') with check (bucket_id = '${bucketName}')`
  );

  await ensurePolicy(
    "Authenticated delete posts bucket",
    "delete",
    `to authenticated using (bucket_id = '${bucketName}')`
  );

  const buckets = await sql`
    select id, name, public
    from storage.buckets
    where id = ${bucketName}
  `;

  const policies = await sql`
    select policyname, cmd, roles
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Public read posts bucket',
        'Authenticated upload posts bucket',
        'Authenticated update posts bucket',
        'Authenticated delete posts bucket'
      )
    order by policyname
  `;

  console.log(JSON.stringify({ bucket: buckets[0], policies }, null, 2));
} finally {
  await sql.end();
}
