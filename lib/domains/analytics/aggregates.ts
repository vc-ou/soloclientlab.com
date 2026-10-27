/**
 * analytics 域 · 跨域只读聚合（例外 E-003：可依赖 leads/commerce 的读接口）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { getLeadRadarConfigs, getProductAccessRequests, getProductTrials } from "@/lib/domains/leads";
import { getProductEntitlements, getProductPayments } from "@/lib/domains/commerce";
import { getTrialEvents } from "./service";
import type {
  TrialEvent
} from "@/lib/types";
export async function getProductAdminMetrics() {
  const [accessRequests, trials, configs, events, payments, entitlements] = await Promise.all([
    getProductAccessRequests(),
    getProductTrials(),
    getLeadRadarConfigs(),
    getTrialEvents(),
    getProductPayments(),
    getProductEntitlements()
  ]);

  const eventCount = (eventType: TrialEvent["event_type"]) => events.filter((event) => event.event_type === eventType).length;
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const paidRevenueCents = paidPayments.reduce((total, payment) => total + (payment.amount_total ?? 0), 0);

  return {
    accessRequests: accessRequests.length,
    activeTrials: trials.filter((trial) => trial.status === "active" || trial.status === "requested").length,
    paidPayments: paidPayments.length,
    paidRevenueCents,
    activeEntitlements: entitlements.filter((entitlement) => entitlement.status === "active").length,
    completedConfigs: configs.filter((config) => config.status === "completed").length,
    productPageVisits: eventCount("product_page_visit"),
    trialAccessRequested: eventCount("trial_access_requested"),
    paypalAccessStarted: eventCount("paypal_access_started"),
    partnerPreviewRequested: eventCount("partner_preview_requested"),
    installClicked: eventCount("install_clicked"),
    configStarted: eventCount("radar_config_started"),
    configCompleted: eventCount("radar_config_completed"),
    keywordsAdded: eventCount("keywords_added"),
    reviewCompleted: eventCount("review_completed"),
    csvExported: eventCount("csv_exported"),
    calibrationFeedbackSubmitted: eventCount("calibration_feedback_submitted"),
    paidPilotRequested: eventCount("paid_pilot_requested"),
    latestEvents: events.slice(0, 12)
  };
}

/* ------------------------------------------------------------------ *
 * 今日快照：把"今天该做什么"算出来，而不是只给一堆绝对值。
 *
 * 每个数字都带上周同期对比；每条队列都给出可点的下一步。
 * 跨域读取（leads / commerce / content）在 analytics 内完成（例外 E-003）。
 * ------------------------------------------------------------------ */

import { readDb } from "@/lib/platform";
import { getOrderRows } from "@/lib/domains/commerce";

export type TodayMetric = {
  key: string;
  label: string;
  value: number;
  previous: number;
  unit: "count" | "money";
  hint: string;
};

export type TodayQueueItem = {
  title: string;
  detail: string;
  href?: string;
  tone?: "danger" | "warn" | "muted";
};

export type TodayQueue = {
  key: string;
  title: string;
  question: string;
  count: number;
  items: TodayQueueItem[];
  emptyHint: string;
  href: string;
};

export type TodaySnapshot = {
  metrics: TodayMetric[];
  queues: TodayQueue[];
  generatedAt: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function inWindow(iso: string | undefined, from: number, to: number) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= from && t < to;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const now = Date.now();
  const weekAgo = now - WEEK_MS;
  const twoWeeksAgo = now - WEEK_MS * 2;

  const [db, orders] = await Promise.all([readDb(), getOrderRows()]);

  const countViews = (from: number, to: number) =>
    db.post_events.filter((e) => e.event_type === "view" && inWindow(e.created_at, from, to)).length;

  const countNewLeads = (from: number, to: number) =>
    db.subscribers.filter((r) => inWindow(r.created_at, from, to)).length +
    db.waitlists.filter((r) => inWindow(r.created_at, from, to)).length +
    db.product_access_requests.filter((r) => inWindow(r.created_at, from, to)).length +
    db.product_trials.filter((r) => inWindow(r.created_at, from, to)).length +
    db.leadradar_configs.filter((r) => inWindow(r.created_at, from, to)).length;

  const paidIn = (from: number, to: number) =>
    db.product_payments.filter((p) => p.status === "paid" && inWindow(p.paid_at ?? p.created_at, from, to));

  const paidThisWeek = paidIn(weekAgo, now);
  const paidLastWeek = paidIn(twoWeeksAgo, weekAgo);

  const payingCustomers = new Set(
    db.product_entitlements.filter((e) => e.status === "active").map((e) => e.email.toLowerCase())
  );

  const metrics: TodayMetric[] = [
    {
      key: "views",
      label: "本周文章访问",
      value: countViews(weekAgo, now),
      previous: countViews(twoWeeksAgo, weekAgo),
      unit: "count",
      hint: "只统计 view 事件；内部流量已排除"
    },
    {
      key: "leads",
      label: "本周新增线索",
      value: countNewLeads(weekAgo, now),
      previous: countNewLeads(twoWeeksAgo, weekAgo),
      unit: "count",
      hint: "订阅 + 等待名单 + 访问申请 + 试用 + 问卷"
    },
    {
      key: "paid",
      label: "本周付款",
      value: paidThisWeek.reduce((sum, p) => sum + (p.amount_total ?? 0), 0),
      previous: paidLastWeek.reduce((sum, p) => sum + (p.amount_total ?? 0), 0),
      unit: "money",
      hint: `${paidThisWeek.length} 笔（上周 ${paidLastWeek.length} 笔）`
    },
    {
      key: "customers",
      label: "累计付费客户",
      value: payingCustomers.size,
      previous: 0,
      unit: "count",
      hint: "权益状态为 active 的去重邮箱"
    }
  ];

  const toItem = (order: (typeof orders)[number]): TodayQueueItem => ({
    title: `${order.payment.product_slug} · ${formatCents(order.payment.amount_total ?? 0)}`,
    detail: `${order.payment.provider} · ${order.payment.email ?? "无邮箱"} · ${order.ageHours}h · ${order.flags.join(" / ") || order.payment.status}`,
    href: `/admin/orders/${order.payment.id}`,
    tone: order.flags.includes("paid_without_entitlement")
      ? "danger"
      : order.flags.includes("pending_expired")
        ? "danger"
        : "warn"
  });

  const stuckOrders = orders.filter((o) => o.flags.includes("pending_stale") || o.flags.includes("pending_expired"));
  const anomalyOrders = orders.filter((o) =>
    o.flags.some((f) => f === "paid_without_entitlement" || f === "entitlement_without_key" || f === "key_never_activated")
  );

  const newLeadItems: TodayQueueItem[] = [
    ...db.product_access_requests
      .filter((r) => r.status === "new")
      .map((r) => ({
        title: r.email,
        detail: `访问申请 · ${r.access_type} · ${r.product_slug}`,
        href: `/admin/product-access`,
        tone: "warn" as const
      })),
    ...db.leadradar_configs
      .filter((c) => c.status === "started")
      .map((c) => ({
        title: c.email,
        detail: "配置问卷未完成 · LeadRadar",
        href: `/admin/leadradar-configs`,
        tone: "warn" as const
      })),
    ...db.subscribers
      .filter((s) => inWindow(s.created_at, weekAgo, now))
      .map((s) => ({
        title: s.email,
        detail: `新订阅 · ${s.source_type ?? "未知来源"} · ${s.source_page ?? "-"}`,
        href: `/admin/subscribers`,
        tone: "muted" as const
      }))
  ];

  const draftPosts = db.posts.filter((p) => p.status === "draft");

  const queues: TodayQueue[] = [
    {
      key: "stuck_payments",
      title: "待付款超时",
      question: "有人创建了订单但没付钱，要不要跟进？",
      count: stuckOrders.length,
      items: stuckOrders.slice(0, 5).map(toItem),
      emptyHint: "没有卡住的付款。去「内容」发一篇新文章，或检查商品页 CTA 是否清晰。",
      href: "/admin/orders"
    },
    {
      key: "new_leads",
      title: "新线索未处理",
      question: "谁在表达兴趣，而我还没回应？",
      count: newLeadItems.length,
      items: newLeadItems.slice(0, 5),
      emptyHint: "本周没有新线索。文章 CTA 与订阅表单是否已配置？",
      href: "/admin/subscribers"
    },
    {
      key: "drafts",
      title: "草稿待发布",
      question: "有没有写完但没发的东西？",
      count: draftPosts.length,
      items: draftPosts.slice(0, 5).map((p) => ({
        title: p.title,
        detail: `更新于 ${new Date(p.updated_at).toISOString().slice(0, 10)} · ${p.topic_tag ?? "未分类"}`,
        href: `/admin/posts/${p.id}`,
        tone: "muted" as const
      })),
      emptyHint: "没有草稿。下一篇文章可以从「选题池」里挑一条需求。",
      href: "/admin/posts"
    },
    {
      key: "anomalies",
      title: "订单异常",
      question: "有没有收了钱却没给东西的？",
      count: anomalyOrders.length,
      items: anomalyOrders.slice(0, 5).map(toItem),
      emptyHint: "没有异常。这是最该保持为空的一条队列。",
      href: "/admin/orders"
    }
  ];

  return { metrics, queues, generatedAt: new Date().toISOString() };
}
