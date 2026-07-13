export type TopicTag =
  | "client_acquisition"
  | "marketing_positioning"
  | "ai_automation"
  | "offer_validation"
  | "operations";

export type PostStatus = "draft" | "published" | "archived";
export type PostCtaType = "newsletter" | "lead_magnet" | "waitlist" | "none";
export type EventCtaType = PostCtaType | "tool_demo";
export type PostEventType = "view" | "cta_click" | "subscription";
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
  | "waitlist";

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

export type Post = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  cover_image_url?: string;
  related_persona?: string;
  related_demand_ids?: string[];
  topic_tag?: TopicTag;
  seo_title?: string;
  seo_description?: string;
  cta_type: PostCtaType;
  cta_target?: string;
  status: PostStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  read_time?: string;
  hero_label?: string;
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
  cta_type?: EventCtaType;
  path?: string;
  referrer?: string;
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
  ctaType: PostCtaType;
  views: number;
  ctaClicks: number;
  subscriptions: number;
  ctaClickRate: number;
  subscriptionRate: number;
  lastEventAt?: string;
};

export type Database = {
  demands: Demand[];
  posts: Post[];
  resources: Resource[];
  subscribers: Subscriber[];
  waitlists: WaitlistEntry[];
  post_events: PostEvent[];
  feedback: FeedbackEntry[];
};

export type ActionState = {
  success: boolean;
  message: string;
  redirectUrl?: string;
  redirectLabel?: string;
  eventName?: "newsletter_signup" | "resource_signup" | "waitlist_signup" | "tool_feedback_submitted";
};
