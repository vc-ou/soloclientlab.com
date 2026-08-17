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
  topic_tag text,
  seo_title text,
  seo_description text,
  cta_type text,
  cta_target text,
  status text not null,
  published_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  read_time text
);

alter table posts add column if not exists cover_image_url text;
alter table posts add column if not exists cta_type text;
alter table posts add column if not exists cta_target text;
alter table posts drop column if exists related_persona;
alter table posts drop column if exists related_demand_ids;
alter table posts drop column if exists hero_label;

update posts
set topic_tag = case topic_tag
  when 'client_acquisition' then 'solo_worker_client_acquisition'
  when 'marketing_positioning' then 'solo_worker_client_acquisition'
  when 'ai_automation' then 'workflow_signal_research'
  when 'offer_validation' then 'workflow_signal_research'
  when 'operations' then 'workflow_signal_research'
  else topic_tag
end
where topic_tag in (
  'client_acquisition',
  'marketing_positioning',
  'ai_automation',
  'offer_validation',
  'operations'
);

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
  note text,
  status text not null,
  mailerlite_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table subscribers add column if not exists note text;

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

create table if not exists post_events (
  id text primary key,
  post_id text references posts(id) on delete set null,
  post_slug text not null,
  event_type text not null,
  path text,
  referrer text,
  target_url text,
  created_at timestamptz not null
);

alter table post_events drop column if exists cta_type;
alter table post_events add column if not exists target_url text;

create table if not exists feedback (
  id text primary key,
  tool_slug text not null,
  source_page text,
  is_useful boolean not null,
  problem_context text not null,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null
);

create table if not exists product_access_requests (
  id text primary key,
  product_slug text not null,
  access_type text not null,
  email text not null,
  company_name text,
  role text,
  source_page text,
  use_case text,
  status text not null default 'new',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists product_trials (
  id text primary key,
  product_slug text not null,
  email text not null,
  access_request_id text references product_access_requests(id) on delete set null,
  status text not null,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  co_build_unlock_ends_at timestamptz,
  source_page text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists product_payments (
  id text primary key,
  product_slug text not null,
  provider text not null,
  status text not null,
  access_request_id text references product_access_requests(id) on delete set null,
  email text not null,
  currency text,
  amount_subtotal integer,
  amount_total integer,
  provider_checkout_session_id text,
  provider_payment_intent_id text,
  provider_customer_id text,
  provider_subscription_id text,
  checkout_url text,
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists product_entitlements (
  id text primary key,
  product_slug text not null,
  access_type text not null,
  email text not null,
  status text not null,
  source_payment_id text references product_payments(id) on delete set null,
  access_request_id text references product_access_requests(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

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
);

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
);

create table if not exists leadradar_configs (
  id text primary key,
  email text not null,
  company_name text,
  target_market text,
  platforms text,
  keywords jsonb not null default '[]'::jsonb,
  countries text,
  capabilities text,
  lead_types text,
  notes text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists trial_events (
  id text primary key,
  product_slug text not null,
  event_type text not null,
  email text,
  source_page text,
  path text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
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
create index if not exists idx_post_events_post_slug on post_events (post_slug);
create index if not exists idx_post_events_event_type on post_events (event_type);
create index if not exists idx_feedback_tool_slug on feedback (tool_slug);
create index if not exists idx_feedback_created_at on feedback (created_at desc);
create index if not exists idx_product_access_requests_product_slug on product_access_requests (product_slug);
create index if not exists idx_product_access_requests_email on product_access_requests (email);
create index if not exists idx_product_trials_product_slug on product_trials (product_slug);
create index if not exists idx_product_trials_status on product_trials (status);
create index if not exists idx_product_payments_product_slug on product_payments (product_slug);
create index if not exists idx_product_payments_status on product_payments (status);
create unique index if not exists idx_product_payments_checkout_session on product_payments (provider_checkout_session_id) where provider_checkout_session_id is not null;
create index if not exists idx_product_entitlements_product_slug on product_entitlements (product_slug);
create index if not exists idx_product_entitlements_status on product_entitlements (status);
create index if not exists idx_product_entitlements_email on product_entitlements (email);
create unique index if not exists idx_product_entitlements_source_payment on product_entitlements (source_payment_id) where source_payment_id is not null;
create index if not exists idx_product_license_keys_product_slug on product_license_keys (product_slug);
create index if not exists idx_product_license_keys_entitlement on product_license_keys (entitlement_id);
create index if not exists idx_product_license_keys_source_payment on product_license_keys (source_payment_id);
create index if not exists idx_product_license_keys_status on product_license_keys (status);
create index if not exists idx_product_license_activations_license_key on product_license_activations (license_key_id);
create index if not exists idx_product_license_activations_product_slug on product_license_activations (product_slug);
create index if not exists idx_product_license_activations_device on product_license_activations (device_id_hash);
create index if not exists idx_product_license_activations_status on product_license_activations (status);
create index if not exists idx_leadradar_configs_email on leadradar_configs (email);
create index if not exists idx_trial_events_product_slug on trial_events (product_slug);
create index if not exists idx_trial_events_event_type on trial_events (event_type);
create index if not exists idx_trial_events_created_at on trial_events (created_at desc);
`;
