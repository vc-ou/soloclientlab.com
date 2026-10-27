/**
 * analytics 域 · 站内事件聚合
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { isInternalTrialEvent } from "@/lib/analytics-filters";
import {
  ADMIN_DB_TIMEOUT_MS,
  isMissingOptionalTable,
  mapDemandRow,
  mapSubscriberRow,
  mapTrialEventRow,
  mapWaitlistRow,
  readAdminPostPerformanceData,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  withTimeout,
  getReadSql,
  DemandRow,
  TrialEventRow,
  ToolTrafficMetric
} from "@/lib/platform";
import type {
  PostPerformance,
  Subscriber,
  TrialEvent,
  WaitlistEntry
} from "@/lib/types";
export async function getDashboardMetrics() {
  if (shouldReadLiveAdminDb()) {
    const sql = getReadSql();
    const [counts, latestSubscribers, latestWaitlists, latestDemands, leadRadarDemoReferrers] = await readWithRetry(
      "Dashboard metrics read",
      () => withTimeout(Promise.all([
        sql<{
          total_demands: number;
          published_posts: number;
          total_subscribers: number;
          active_subscribers: number;
          qualified_subscribers: number;
          resource_signups: number;
          waitlist_count: number;
          waitlist_subscribers: number;
          leadradar_demo_clicks: number;
          research_views: number;
          product_page_views: number;
          trial_access_clicks: number;
          install_clicks: number;
          review_completions: number;
          feedback_count: number;
        }[]>`
          select
            (select count(*)::int from demands where status <> 'archived') as total_demands,
            (select count(*)::int from posts where status = 'published') as published_posts,
            (select count(*)::int from subscribers) as total_subscribers,
            (select count(*)::int from subscribers where status = 'active') as active_subscribers,
            (select count(*)::int from subscribers where status = 'active' and persona_tag is not null) as qualified_subscribers,
            (select count(*)::int from subscribers where status = 'active' and source_type = 'resource') as resource_signups,
            (select count(*)::int from waitlists) as waitlist_count,
            (
              select count(*)::int
              from subscribers
              where status = 'active'
                and lower(email) in (select lower(email) from waitlists)
            ) as waitlist_subscribers,
            (
              select count(*)::int
              from post_events
              where post_slug = 'tools/leadradar'
                and event_type in ('cta_click', 'demo_open')
            ) as leadradar_demo_clicks
            ,
            (
              select count(*)::int
              from post_events
              where event_type = 'view'
            ) as research_views,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'product_page_view'
            ) as product_page_views,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'trial_access_click'
            ) as trial_access_clicks,
            (
              select count(*)::int
              from post_events
              where post_slug = 'products/leadradar'
                and event_type = 'install_click'
            ) as install_clicks,
            (
              select count(*)::int
              from post_events
              where post_slug = 'tools/leadradar'
                and event_type = 'review_complete'
            ) as review_completions,
            (select count(*)::int from feedback) as feedback_count
        `,
        sql<Subscriber[]>`select * from subscribers order by created_at desc limit 5`,
        sql<WaitlistEntry[]>`select * from waitlists order by created_at desc limit 5`,
        sql<DemandRow[]>`select * from demands order by created_at desc limit 5`,
        sql<{ path: string | null; referrer: string | null; clicks: number; last_event_at: string }[]>`
          select
            coalesce(nullif(path, ''), '/tools/leadradar') as path,
            coalesce(nullif(referrer, ''), 'Direct / unknown') as referrer,
            count(*)::int as clicks,
            max(created_at)::text as last_event_at
          from post_events
          where post_slug = 'tools/leadradar'
            and event_type in ('cta_click', 'demo_open')
          group by
            coalesce(nullif(path, ''), '/tools/leadradar'),
            coalesce(nullif(referrer, ''), 'Direct / unknown')
          order by clicks desc, max(created_at) desc
          limit 10
        `
      ]), ADMIN_DB_TIMEOUT_MS)
    );
    const metrics = counts[0];
    const activeSubscribers = metrics.active_subscribers;
    const resourceSignups = metrics.resource_signups;
    const waitlistSubscribers = metrics.waitlist_subscribers;

    return {
      totalDemands: metrics.total_demands,
      publishedPosts: metrics.published_posts,
      totalSubscribers: metrics.total_subscribers,
      qualifiedSubscribers: metrics.qualified_subscribers,
      resourceSignups,
      waitlistCount: metrics.waitlist_count,
      leadRadarDemoClicks: metrics.leadradar_demo_clicks,
      researchViews: metrics.research_views,
      productPageViews: metrics.product_page_views,
      trialAccessClicks: metrics.trial_access_clicks,
      installClicks: metrics.install_clicks,
      reviewCompletions: metrics.review_completions,
      feedbackCount: metrics.feedback_count,
      leadRadarDemoTraffic: leadRadarDemoReferrers.map((item) => ({
        path: item.path ?? "/tools/leadradar",
        referrer: item.referrer ?? "Direct / unknown",
        clicks: item.clicks,
        lastEventAt: item.last_event_at
      })),
      emailToWaitlistRate: activeSubscribers ? waitlistSubscribers / activeSubscribers : 0,
      resourceToEmailRate: activeSubscribers ? resourceSignups / activeSubscribers : 0,
      activeSubscribers,
      latestSubscribers: latestSubscribers.map(mapSubscriberRow),
      latestWaitlists: latestWaitlists.map(mapWaitlistRow),
      latestDemands: latestDemands.map(mapDemandRow)
    };
  }

  const db = await readLocalDbSafe();
  const activeSubscribers = db.subscribers.filter((item) => item.status === "active");
  const resourceSubscribers = activeSubscribers.filter((item) => item.source_type === "resource");
  const waitlistEmails = new Set(db.waitlists.map((item) => item.email.toLowerCase()));
  const waitlistSubscribers = activeSubscribers.filter((item) => waitlistEmails.has(item.email.toLowerCase()));
  const leadRadarDemoEvents = db.post_events.filter(
    (event) => event.post_slug === "tools/leadradar" && ["cta_click", "demo_open"].includes(event.event_type)
  );
  const leadRadarDemoTrafficMap = new Map<string, ToolTrafficMetric>();

  for (const event of leadRadarDemoEvents) {
    const path = event.path || "/tools/leadradar";
    const referrer = event.referrer || "Direct / unknown";
    const key = `${path}::${referrer}`;
    const current = leadRadarDemoTrafficMap.get(key) ?? { path, referrer, clicks: 0, lastEventAt: undefined };
    current.clicks += 1;
    if (!current.lastEventAt || event.created_at > current.lastEventAt) {
      current.lastEventAt = event.created_at;
    }
    leadRadarDemoTrafficMap.set(key, current);
  }

  return {
    totalDemands: db.demands.filter((item) => item.status !== "archived").length,
    publishedPosts: db.posts.filter((item) => item.status === "published").length,
    totalSubscribers: db.subscribers.length,
    qualifiedSubscribers: activeSubscribers.filter((item) => item.persona_tag).length,
    resourceSignups: resourceSubscribers.length,
    waitlistCount: db.waitlists.length,
    leadRadarDemoClicks: leadRadarDemoEvents.length,
    researchViews: db.post_events.filter((event) => event.event_type === "view").length,
    productPageViews: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "product_page_view"
    ).length,
    trialAccessClicks: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "trial_access_click"
    ).length,
    installClicks: db.post_events.filter(
      (event) => event.post_slug === "products/leadradar" && event.event_type === "install_click"
    ).length,
    reviewCompletions: db.post_events.filter(
      (event) => event.post_slug === "tools/leadradar" && event.event_type === "review_complete"
    ).length,
    feedbackCount: db.feedback.length,
    leadRadarDemoTraffic: Array.from(leadRadarDemoTrafficMap.values())
      .sort((a, b) => b.clicks - a.clicks || (b.lastEventAt ?? "").localeCompare(a.lastEventAt ?? ""))
      .slice(0, 10),
    emailToWaitlistRate: activeSubscribers.length ? waitlistSubscribers.length / activeSubscribers.length : 0,
    resourceToEmailRate: activeSubscribers.length ? resourceSubscribers.length / activeSubscribers.length : 0,
    activeSubscribers: activeSubscribers.length,
    latestSubscribers: db.subscribers.slice(0, 5),
    latestWaitlists: db.waitlists.slice(0, 5),
    latestDemands: db.demands.slice(0, 5)
  };
}

export async function getPostPerformance() {
  const db = shouldReadLiveAdminDb()
    ? await readAdminPostPerformanceData()
    : await readLocalDbSafe();
  const publishedOrDraftPosts = [...db.posts]
    .sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));

  const counters = new Map<string, {
    views: number;
    lastEventAt?: string;
  }>();

  const ensureCounter = (slug: string) => {
    const existing = counters.get(slug);
    if (existing) return existing;
    const created = { views: 0, lastEventAt: undefined as string | undefined };
    counters.set(slug, created);
    return created;
  };

  for (const event of db.post_events) {
    const counter = ensureCounter(event.post_slug);
    if (event.event_type === "view") counter.views += 1;
    if (!counter.lastEventAt || event.created_at > counter.lastEventAt) {
      counter.lastEventAt = event.created_at;
    }
  }

  return publishedOrDraftPosts.map<PostPerformance>((post) => {
    const counter = counters.get(post.slug) ?? {
      views: 0,
      lastEventAt: undefined
    };

    return {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      publishedAt: post.published_at,
      views: counter.views,
      lastEventAt: counter.lastEventAt
    };
  });
}

export async function getTrialEvents(): Promise<TrialEvent[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Trial events read",
        () => withTimeout(sql<TrialEventRow[]>`
          select * from trial_events
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapTrialEventRow).filter((event) => !isInternalTrialEvent(event));
    } catch (error) {
      if (isMissingOptionalTable(error, "trial_events")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.trial_events.filter((event) => !isInternalTrialEvent(event));
}
