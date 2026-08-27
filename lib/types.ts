export type TopicTag =
  | "manufacturing_social_lead_discovery"
  | "workflow_signal_research"
  | "solo_worker_client_acquisition";

export type PostStatus = "draft" | "published" | "archived";
export type PostEventType =
  | "view"
  | "cta_click"
  | "article_internal_link_click"
  | "product_page_view"
  | "trial_access_click"
  | "install_click"
  | "demo_open"
  | "review_complete";
export type ProductSlug = string;
export type ProductStatus = "draft" | "published" | "archived";
export type ProductDeliveryMode = "presale" | "digital_file" | "extension" | "service" | "manual_delivery";
export type ProductDevelopmentStatus = "idea" | "presale" | "building" | "ready" | "paused";
export type ProductAccessType =
  | "product_access"
  | "trial_access"
  | "co_build_access"
  | "partner_preview"
  | "paid_pilot"
  | "monthly_subscription"
  | "lifetime_access";
export type ProductAccessStatus = "new" | "reviewing" | "invited" | "declined" | "paid";
export type ProductTrialStatus = "requested" | "active" | "completed" | "expired" | "paid_pilot_requested";
export type LeadRadarConfigStatus = "started" | "completed";
export type PaymentProvider = "stripe" | "paypal";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "canceled";
export type EntitlementStatus = "pending" | "active" | "expired" | "revoked";
export type ProductLicenseStatus = "active" | "revoked";
export type ProductLicenseActivationStatus = "active" | "revoked";
export type TrialEventType =
  | "product_page_visit"
  | "trial_access_requested"
  | "partner_preview_requested"
  | "install_clicked"
  | "radar_config_started"
  | "radar_config_completed"
  | "keywords_added"
  | "review_completed"
  | "csv_exported"
  | "calibration_feedback_submitted"
  | "paid_pilot_requested"
  | "monthly_subscription_checkout_started"
  | "paypal_access_started"
  | "demo_open";
export type DemandStatus =
  | "raw"
  | "reviewed"
  | "clustered"
  | "used_in_post"
  | "archived";
export type EvidenceStrength = "weak" | "medium" | "strong";
export type ResourceType = "report" | "checklist" | "template" | "prompt_pack";
export type ResourceStatus = "draft" | "published" | "archived";
export type ResourceDeliveryMode = "page" | "file" | "external";
export type SubscriberStatus = "active" | "unsubscribed" | "bounced";
export type FeedbackSourceTool = "leadradar";
export type SourceType =
  | "home"
  | "post"
  | "resource"
  | "newsletter_page"
  | "waitlist"
  | "product_access";

export type Demand = {
  id: string;
  title: string;
  source_url?: string;
  source_platform?: string;
  user_quote?: string;
  persona?: string;
  job_to_be_done?: string;
  problem_stage?: string;
  solution_attempted?: string;
  keyword?: string;
  pain_score?: number;
  frequency_score?: number;
  payment_score?: number;
  evidence_strength?: EvidenceStrength;
  status: DemandStatus;
  tags?: string[];
  next_action?: string;
  topic_tag?: TopicTag;
  created_at: string;
  updated_at: string;
};

export type PostFaqItem = {
  question: string;
  answer: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  cover_image_url?: string;
  topic_tag?: TopicTag;
  seo_title?: string;
  seo_description?: string;
  cta_type?: string;
  cta_target?: string;
  status: PostStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  read_time?: string;
  faq?: PostFaqItem[];
};

export type Resource = {
  id: string;
  title: string;
  slug: string;
  type: ResourceType;
  audience?: string;
  related_topic?: TopicTag;
  landing_page_slug?: string;
  delivery_mode?: ResourceDeliveryMode;
  delivery_url?: string;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: ProductSlug;
  name: string;
  short_description?: string;
  hero_title?: string;
  hero_description?: string;
  audience?: string;
  problem?: string;
  promise?: string;
  landing_page_url?: string;
  features?: ProductFeature[];
  delivery_mode: ProductDeliveryMode;
  development_status: ProductDevelopmentStatus;
  price_cents: number;
  currency: string;
  payment_enabled: boolean;
  status: ProductStatus;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type ProductFeature = {
  title: string;
  body?: string;
};

export type Subscriber = {
  id: string;
  email: string;
  source_page?: string;
  source_type?: SourceType;
  lead_magnet?: string;
  persona_tag?: string;
  topic_tag?: string;
  note?: string;
  status: SubscriberStatus;
  mailerlite_id?: string;
  created_at: string;
  updated_at: string;
};

export type WaitlistEntry = {
  id: string;
  project_name: string;
  page_slug: string;
  email: string;
  source_page?: string;
  interest_tag?: string;
  note?: string;
  created_at: string;
};

export type PostEvent = {
  id: string;
  post_id?: string;
  post_slug: string;
  event_type: PostEventType;
  path?: string;
  referrer?: string;
  target_url?: string;
  created_at: string;
};

export type ProductAccessRequest = {
  id: string;
  product_slug: ProductSlug;
  access_type: ProductAccessType;
  email: string;
  company_name?: string;
  role?: string;
  source_page?: string;
  use_case?: string;
  status: ProductAccessStatus;
  created_at: string;
  updated_at: string;
};

export type ProductTrial = {
  id: string;
  product_slug: ProductSlug;
  email: string;
  access_request_id?: string;
  status: ProductTrialStatus;
  trial_started_at?: string;
  trial_ends_at?: string;
  co_build_unlock_ends_at?: string;
  source_page?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type LeadRadarConfig = {
  id: string;
  email: string;
  company_name?: string;
  target_market?: string;
  platforms?: string;
  keywords: string[];
  countries?: string;
  capabilities?: string;
  lead_types?: string;
  notes?: string;
  status: LeadRadarConfigStatus;
  created_at: string;
  updated_at: string;
};

export type ProductPayment = {
  id: string;
  product_slug: ProductSlug;
  provider: PaymentProvider;
  status: PaymentStatus;
  access_request_id?: string;
  email?: string;
  currency?: string;
  amount_subtotal?: number;
  amount_total?: number;
  provider_checkout_session_id?: string;
  provider_payment_intent_id?: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  checkout_url?: string;
  paid_at?: string;
  refunded_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProductEntitlement = {
  id: string;
  product_slug: ProductSlug;
  access_type: ProductAccessType;
  email: string;
  status: EntitlementStatus;
  source_payment_id?: string;
  access_request_id?: string;
  starts_at: string;
  ends_at?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProductLicenseKey = {
  id: string;
  product_slug: ProductSlug;
  entitlement_id: string;
  source_payment_id?: string;
  key_hash: string;
  key_suffix: string;
  status: ProductLicenseStatus;
  max_activations: number;
  created_at: string;
  updated_at: string;
};

export type ProductLicenseActivation = {
  id: string;
  license_key_id: string;
  product_slug: ProductSlug;
  device_id_hash: string;
  token_hash: string;
  status: ProductLicenseActivationStatus;
  activated_at: string;
  last_verified_at?: string;
  revoked_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TrialEvent = {
  id: string;
  product_slug: ProductSlug;
  event_type: TrialEventType;
  email?: string;
  source_page?: string;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type FeedbackEntry = {
  id: string;
  tool_slug: FeedbackSourceTool;
  source_page?: string;
  is_useful: boolean;
  problem_context: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
};

export type PostPerformance = {
  postId: string;
  title: string;
  slug: string;
  status: PostStatus;
  publishedAt?: string;
  views: number;
  lastEventAt?: string;
};

export type Database = {
  demands: Demand[];
  posts: Post[];
  products: Product[];
  resources: Resource[];
  subscribers: Subscriber[];
  waitlists: WaitlistEntry[];
  post_events: PostEvent[];
  feedback: FeedbackEntry[];
  product_access_requests: ProductAccessRequest[];
  product_trials: ProductTrial[];
  leadradar_configs: LeadRadarConfig[];
  product_payments: ProductPayment[];
  product_entitlements: ProductEntitlement[];
  product_license_keys: ProductLicenseKey[];
  product_license_activations: ProductLicenseActivation[];
  trial_events: TrialEvent[];
};

export type ActionState = {
  success: boolean;
  message: string;
  redirectUrl?: string;
  redirectLabel?: string;
  eventName?:
    | "newsletter_signup"
    | "resource_signup"
    | "waitlist_signup"
    | "tool_feedback_submitted"
    | "trial_access_requested"
    | "partner_preview_requested"
    | "radar_config_completed"
    | "paid_pilot_requested"
    | "monthly_subscription_checkout_started";
};
