export const schemaSql = `
create extension if not exists pgcrypto;

create table if not exists demands (
  id text primary key,
  title text not null,
  source_url text,
  source_platform text,
  user_quote text,
  persona text,
  job_to_be_done text,
  problem_stage text,
  solution_attempted text,
  keyword text,
  pain_score integer,
  frequency_score integer,
  payment_score integer,
  evidence_strength text,
  status text not null,
  tags jsonb not null default '[]'::jsonb,
  next_action text,
  topic_tag text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists posts (
  id text primary key,
  title text not null,
  slug text not null unique,
  summary text,
  content text,
  cover_image_url text,
  related_persona text,
  related_demand_ids jsonb not null default '[]'::jsonb,
  topic_tag text,
  seo_title text,
  seo_description text,
  cta_type text not null,
  cta_target text,
  status text not null,
  published_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  read_time text,
  hero_label text
);

alter table posts add column if not exists cover_image_url text;

create table if not exists resources (
  id text primary key,
  title text not null,
  slug text not null unique,
  type text not null,
  audience text,
  related_topic text,
  landing_page_slug text,
  delivery_mode text,
  delivery_url text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists subscribers (
  id text primary key,
  email text not null unique,
  source_page text,
  source_type text,
  lead_magnet text,
  persona_tag text,
  topic_tag text,
  status text not null,
  mailerlite_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists waitlists (
  id text primary key,
  project_name text not null,
  page_slug text not null,
  email text not null,
  source_page text,
  interest_tag text,
  note text,
  created_at timestamptz not null
);

create index if not exists idx_demands_status on demands (status);
create index if not exists idx_demands_topic_tag on demands (topic_tag);
create index if not exists idx_posts_status on posts (status);
create index if not exists idx_posts_topic_tag on posts (topic_tag);
create index if not exists idx_resources_status on resources (status);
create index if not exists idx_subscribers_source_type on subscribers (source_type);
create index if not exists idx_subscribers_lead_magnet on subscribers (lead_magnet);
create index if not exists idx_waitlists_page_slug on waitlists (page_slug);
`;
