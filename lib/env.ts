import "server-only";

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseUrl() {
  return getRequiredEnv("DATABASE_URL");
}

export function getOptionalEnv(name: string) {
  return process.env[name];
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com").replace(/\/+$/, "");
}
