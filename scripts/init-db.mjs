import postgres from "postgres";
import { readFile } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize the database.");
}

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1
});

try {
  const schemaPath = path.join(process.cwd(), "lib", "db-schema.ts");
  const source = await readFile(schemaPath, "utf8");
  const match = source.match(/`([\s\S]*)`;/);

  if (!match) {
    throw new Error("Could not locate schema SQL in lib/db-schema.ts");
  }

  const statements = match[1]
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.unsafe(`${statement};`);
  }

  console.log("Database schema initialized.");
} finally {
  await sql.end();
}
