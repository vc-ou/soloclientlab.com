import { getReadSql, readDb, readWithRetry, withTimeout, ADMIN_DB_TIMEOUT_MS } from "@/lib/platform";
import { hasDatabaseUrl } from "@/lib/env";
import { getOrderRows } from "@/lib/domains/commerce";

/**
 * 今日快照：把"今天该做什么"算出来，而不是只给一堆绝对值。
 *
 * 性能约束：**不要用 readDb()**（16 张表全量并行，4 秒预算，生产环境超时会抛错直接 500）。
 * 这里全部走定向查询，使用后台的 10 秒预算；无数据库时（本地/测试）回落到本地快照。
 */

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

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type TodayRaw = {
  views: { current: number; previous: number };
  leads: { current: number; previous: number };
  paid: { count: number; cents: number; prevCount: number; prevCents: number };
  customers: number;
  newLeadItems: TodayQueueItem[];
  draftItems: TodayQueueItem[];
  draftCount: number;
};

function inWindow(iso: string | undefined, from: number, to: number) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= from && t < to;
}

async function loadRaw(): Promise<TodayRaw> {
  const now = Date.now();
  const weekAgoIso = new Date(now - WEEK_MS).toISOString();
  const twoWeeksAgoIso = new Date(now - WEEK_MS * 2).toISOString();

  if (!hasDatabaseUrl()) {
    return loadRawFromLocal(now);
  }

  const sql = getReadSql();
  return readWithRetry("Admin today snapshot read", async () => {
    // 尽量少的往返：一个合并计数查询 + 三个"最多 5 条"的列表查询
    const [counts, requests, subscribers, drafts] = await Promise.all([
      withTimeout(sql<{ views_cur: number; views_prev: number; leads_cur: number; leads_prev: number; paid_n: number; paid_cents: number; paid_prev_n: number; paid_prev_cents: number; customers: number }[]>`
        select
          (select count(*)::int from post_events where event_type='view' and created_at >= ${weekAgoIso}) as views_cur,
          (select count(*)::int from post_events where event_type='view' and created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso}) as views_prev,
          ((select count(*)::int from subscribers where created_at >= ${weekAgoIso})
           + (select count(*)::int from waitlists where created_at >= ${weekAgoIso})
           + (select count(*)::int from product_access_requests where created_at >= ${weekAgoIso})
           + (select count(*)::int from product_trials where created_at >= ${weekAgoIso})
           + (select count(*)::int from leadradar_configs where created_at >= ${weekAgoIso})) as leads_cur,
          ((select count(*)::int from subscribers where created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso})
           + (select count(*)::int from waitlists where created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso})
           + (select count(*)::int from product_access_requests where created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso})
           + (select count(*)::int from product_trials where created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso})
           + (select count(*)::int from leadradar_configs where created_at >= ${twoWeeksAgoIso} and created_at < ${weekAgoIso})) as leads_prev,
          (select count(*)::int from product_payments where status='paid' and coalesce(paid_at, created_at) >= ${weekAgoIso}) as paid_n,
          (select coalesce(sum(amount_total),0)::int from product_payments where status='paid' and coalesce(paid_at, created_at) >= ${weekAgoIso}) as paid_cents,
          (select count(*)::int from product_payments where status='paid' and coalesce(paid_at, created_at) >= ${twoWeeksAgoIso} and coalesce(paid_at, created_at) < ${weekAgoIso}) as paid_prev_n,
          (select coalesce(sum(amount_total),0)::int from product_payments where status='paid' and coalesce(paid_at, created_at) >= ${twoWeeksAgoIso} and coalesce(paid_at, created_at) < ${weekAgoIso}) as paid_prev_cents,
          (select count(distinct lower(email))::int from product_entitlements where status='active') as customers
      `, ADMIN_DB_TIMEOUT_MS),
      withTimeout(sql<{ email: string; detail: string; href: string }[]>`
        select email, '访问申请 · ' || access_type || ' · ' || product_slug as detail, '/admin/product-access' as href
        from product_access_requests where status='new' order by created_at desc limit 5
      `, ADMIN_DB_TIMEOUT_MS),
      withTimeout(sql<{ email: string; detail: string; href: string }[]>`
        select email, '新订阅 · ' || coalesce(source_type,'未知来源') || ' · ' || coalesce(source_page,'-') as detail, '/admin/subscribers' as href
        from subscribers where created_at >= ${weekAgoIso} order by created_at desc limit 5
      `, ADMIN_DB_TIMEOUT_MS),
      withTimeout(sql<{ id: string; title: string; updated_at: string; topic_tag: string | null }[]>`
        select id, title, updated_at, topic_tag from posts where status='draft' order by updated_at desc limit 5
      `, ADMIN_DB_TIMEOUT_MS)
    ]);

    const row = counts[0];
    return {
      views: { current: row?.views_cur ?? 0, previous: row?.views_prev ?? 0 },
      leads: { current: row?.leads_cur ?? 0, previous: row?.leads_prev ?? 0 },
      paid: {
        count: row?.paid_n ?? 0,
        cents: row?.paid_cents ?? 0,
        prevCount: row?.paid_prev_n ?? 0,
        prevCents: row?.paid_prev_cents ?? 0
      },
      customers: row?.customers ?? 0,
      newLeadItems: [
        ...requests.map((r) => ({ title: r.email, detail: r.detail, href: r.href, tone: "warn" as const })),
        ...subscribers.map((s) => ({ title: s.email, detail: s.detail, href: s.href, tone: "muted" as const }))
      ],
      draftItems: drafts.map((p) => ({
        title: p.title,
        detail: `更新于 ${new Date(p.updated_at).toISOString().slice(0, 10)} · ${p.topic_tag ?? "未分类"}`,
        href: `/admin/posts/${p.id}`,
        tone: "muted" as const
      })),
      draftCount: drafts.length
    };
  });
}

async function loadRawFromLocal(now: number): Promise<TodayRaw> {
  const db = await readDb();
  const weekAgo = now - WEEK_MS;
  const twoWeeksAgo = now - WEEK_MS * 2;
  const countIn = (items: { created_at: string }[], from: number, to: number) =>
    items.filter((item) => inWindow(item.created_at, from, to)).length;

  const leadsCurrent =
    countIn(db.subscribers, weekAgo, now) +
    countIn(db.waitlists, weekAgo, now) +
    countIn(db.product_access_requests, weekAgo, now) +
    countIn(db.product_trials, weekAgo, now) +
    countIn(db.leadradar_configs, weekAgo, now);
  const leadsPrevious =
    countIn(db.subscribers, twoWeeksAgo, weekAgo) +
    countIn(db.waitlists, twoWeeksAgo, weekAgo) +
    countIn(db.product_access_requests, twoWeeksAgo, weekAgo) +
    countIn(db.product_trials, twoWeeksAgo, weekAgo) +
    countIn(db.leadradar_configs, twoWeeksAgo, weekAgo);

  const paidIn = (from: number, to: number) =>
    db.product_payments.filter((p) => p.status === "paid" && inWindow(p.paid_at ?? p.created_at, from, to));

  const drafts = db.posts.filter((p) => p.status === "draft");

  return {
    views: {
      current: db.post_events.filter((e) => e.event_type === "view" && inWindow(e.created_at, weekAgo, now)).length,
      previous: db.post_events.filter((e) => e.event_type === "view" && inWindow(e.created_at, twoWeeksAgo, weekAgo)).length
    },
    leads: { current: leadsCurrent, previous: leadsPrevious },
    paid: {
      count: paidIn(weekAgo, now).length,
      cents: paidIn(weekAgo, now).reduce((sum, p) => sum + (p.amount_total ?? 0), 0),
      prevCount: paidIn(twoWeeksAgo, weekAgo).length,
      prevCents: paidIn(twoWeeksAgo, weekAgo).reduce((sum, p) => sum + (p.amount_total ?? 0), 0)
    },
    customers: new Set(
      db.product_entitlements.filter((e) => e.status === "active").map((e) => e.email.toLowerCase())
    ).size,
    newLeadItems: [
      ...db.product_access_requests
        .filter((r) => r.status === "new")
        .slice(0, 5)
        .map((r) => ({
          title: r.email,
          detail: `访问申请 · ${r.access_type} · ${r.product_slug}`,
          href: "/admin/product-access",
          tone: "warn" as const
        })),
      ...db.leadradar_configs
        .filter((c) => c.status === "started")
        .slice(0, 5)
        .map((c) => ({
          title: c.email,
          detail: "配置问卷未完成 · LeadRadar",
          href: "/admin/leadradar-configs",
          tone: "warn" as const
        })),
      ...db.subscribers
        .filter((s) => inWindow(s.created_at, weekAgo, now))
        .slice(0, 5)
        .map((s) => ({
          title: s.email,
          detail: `新订阅 · ${s.source_type ?? "未知来源"} · ${s.source_page ?? "-"}`,
          href: "/admin/subscribers",
          tone: "muted" as const
        }))
    ],
    draftItems: drafts.slice(0, 5).map((p) => ({
      title: p.title,
      detail: `更新于 ${new Date(p.updated_at).toISOString().slice(0, 10)} · ${p.topic_tag ?? "未分类"}`,
      href: `/admin/posts/${p.id}`,
      tone: "muted" as const
    })),
    draftCount: drafts.length
  };
}

export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const [raw, orders] = await Promise.all([loadRaw(), getOrderRows()]);

  const stuckOrders = orders.filter((o) => o.flags.includes("pending_stale") || o.flags.includes("pending_expired"));
  const anomalyOrders = orders.filter((o) =>
    o.flags.some((f) => f === "paid_without_entitlement" || f === "entitlement_without_key" || f === "key_never_activated")
  );

  const toItem = (order: (typeof orders)[number]): TodayQueueItem => ({
    title: `${order.payment.product_slug} · ${formatCents(order.payment.amount_total ?? 0)}`,
    detail: `${order.payment.provider} · ${order.payment.email ?? "无邮箱"} · ${order.ageHours}h · ${
      order.flags.join(" / ") || order.payment.status
    }`,
    href: `/admin/orders/${order.payment.id}`,
    tone: order.flags.includes("paid_without_entitlement")
      ? "danger"
      : order.flags.includes("pending_expired")
        ? "danger"
        : "warn"
  });

  const metrics: TodayMetric[] = [
    {
      key: "views",
      label: "本周文章访问",
      value: raw.views.current,
      previous: raw.views.previous,
      unit: "count",
      hint: "只统计 view 事件"
    },
    {
      key: "leads",
      label: "本周新增线索",
      value: raw.leads.current,
      previous: raw.leads.previous,
      unit: "count",
      hint: "订阅 + 等待名单 + 申请 + 试用 + 问卷"
    },
    {
      key: "paid",
      label: "本周付款",
      value: raw.paid.cents,
      previous: raw.paid.prevCents,
      unit: "money",
      hint: `${raw.paid.count} 笔（上周 ${raw.paid.prevCount} 笔）`
    },
    {
      key: "customers",
      label: "累计付费客户",
      value: raw.customers,
      previous: 0,
      unit: "count",
      hint: "权益 active 的去重邮箱"
    }
  ];

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
      count: raw.newLeadItems.length,
      items: raw.newLeadItems.slice(0, 5),
      emptyHint: "本周没有新线索。文章 CTA 与订阅表单是否已配置？",
      href: "/admin/subscribers"
    },
    {
      key: "drafts",
      title: "草稿待发布",
      question: "有没有写完但没发的东西？",
      count: raw.draftCount,
      items: raw.draftItems,
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

export { getOrderRows };
