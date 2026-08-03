import "server-only";

const DEFAULT_UMAMI_API_ENDPOINT = "https://api.umami.is/v1";
const UMAMI_API_TIMEOUT_MS = 10000;

type UmamiMetricValue = number | { value?: number; prev?: number };

type UmamiStatsResponse = {
  pageviews?: UmamiMetricValue;
  visitors?: UmamiMetricValue;
  visits?: UmamiMetricValue;
  bounces?: UmamiMetricValue;
  totaltime?: UmamiMetricValue;
};

type UmamiMetricRow = {
  x?: string;
  y?: number;
};

type UmamiMetricsResponse =
  | UmamiMetricRow[]
  | {
      data?: UmamiMetricRow[];
    };

type UmamiPageviewRow = {
  x?: string;
  y?: number;
};

type UmamiPageviewsResponse =
  | UmamiPageviewRow[]
  | {
      pageviews?: UmamiPageviewRow[];
      sessions?: UmamiPageviewRow[];
    };

export type UmamiPeriod = "7d" | "30d" | "90d";

export type UmamiAnalytics = {
  configured: boolean;
  error?: string;
  period: UmamiPeriod;
  startAt: number;
  endAt: number;
  stats: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    bounceRate: number;
    totalTimeSeconds: number;
    averageVisitSeconds: number;
  };
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ referrer: string; visits: number }>;
  browsers: Array<{ browser: string; visits: number }>;
  events: Array<{ event: string; count: number }>;
  pageviews: Array<{ date: string; views: number }>;
  dashboardUrl?: string;
};

const periodDays: Record<UmamiPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90
};

function getMetricValue(value: UmamiMetricValue | undefined) {
  if (typeof value === "number") return value;
  return value?.value ?? 0;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

function getConfig() {
  const websiteId = process.env.UMAMI_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY;
  const apiEndpoint = (process.env.UMAMI_API_ENDPOINT ?? DEFAULT_UMAMI_API_ENDPOINT).replace(/\/$/, "");
  const dashboardUrl = process.env.UMAMI_DASHBOARD_URL;

  return {
    websiteId,
    apiKey,
    apiEndpoint,
    dashboardUrl
  };
}

async function fetchUmami<T>(path: string, apiKey: string, apiEndpoint: string): Promise<T> {
  const response = await fetch(`${apiEndpoint}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(UMAMI_API_TIMEOUT_MS),
    next: {
      revalidate: 300
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Umami API ${response.status} ${response.statusText}: ${body}`);
  }

  return response.json() as Promise<T>;
}

function normalizeMetricRows(response: UmamiMetricsResponse | undefined, fallbackLabel: string) {
  const rows = Array.isArray(response) ? response : response?.data;

  return (rows ?? [])
    .map((row) => ({
      label: row.x || fallbackLabel,
      value: row.y ?? 0
    }))
    .filter((row) => row.value > 0)
    .slice(0, 10);
}

function normalizePageviewRows(response: UmamiPageviewsResponse | undefined) {
  const rows = Array.isArray(response) ? response : response?.pageviews;

  return (rows ?? [])
    .map((row) => ({
      date: row.x ?? "",
      views: row.y ?? 0
    }))
    .filter((row) => row.date)
    .slice(-14);
}

export async function getUmamiAnalytics(period: UmamiPeriod = "30d"): Promise<UmamiAnalytics> {
  const selectedPeriod = periodDays[period] ? period : "30d";
  const endAt = Date.now();
  const startAt = endAt - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000;
  const { websiteId, apiKey, apiEndpoint, dashboardUrl } = getConfig();

  const emptyStats = {
    pageviews: 0,
    visitors: 0,
    visits: 0,
    bounces: 0,
    bounceRate: 0,
    totalTimeSeconds: 0,
    averageVisitSeconds: 0
  };

  if (!websiteId || !apiKey) {
    return {
      configured: false,
      error: "Missing UMAMI_API_KEY or NEXT_PUBLIC_UMAMI_WEBSITE_ID.",
      period: selectedPeriod,
      startAt,
      endAt,
      stats: emptyStats,
      topPages: [],
      referrers: [],
      browsers: [],
      events: [],
      pageviews: [],
      dashboardUrl
    };
  }

  try {
    const baseParams = {
      startAt,
      endAt
    };
    const statsQuery = toQuery(baseParams);
    const metricsQuery = (type: string) => toQuery({ ...baseParams, type });

    const [stats, pages, referrers, browsers, events, pageviews] = await Promise.all([
      fetchUmami<UmamiStatsResponse>(`/websites/${websiteId}/stats?${statsQuery}`, apiKey, apiEndpoint),
      fetchUmami<UmamiMetricsResponse>(`/websites/${websiteId}/metrics?${metricsQuery("url")}`, apiKey, apiEndpoint),
      fetchUmami<UmamiMetricsResponse>(`/websites/${websiteId}/metrics?${metricsQuery("referrer")}`, apiKey, apiEndpoint),
      fetchUmami<UmamiMetricsResponse>(`/websites/${websiteId}/metrics?${metricsQuery("browser")}`, apiKey, apiEndpoint),
      fetchUmami<UmamiMetricsResponse>(`/websites/${websiteId}/metrics?${metricsQuery("event")}`, apiKey, apiEndpoint),
      fetchUmami<UmamiPageviewsResponse>(`/websites/${websiteId}/pageviews?${statsQuery}&unit=day`, apiKey, apiEndpoint)
    ]);

    const visits = getMetricValue(stats.visits);
    const bounces = getMetricValue(stats.bounces);
    const totalTimeSeconds = getMetricValue(stats.totaltime);

    return {
      configured: true,
      period: selectedPeriod,
      startAt,
      endAt,
      stats: {
        pageviews: getMetricValue(stats.pageviews),
        visitors: getMetricValue(stats.visitors),
        visits,
        bounces,
        bounceRate: visits > 0 ? Math.round((bounces / visits) * 100) : 0,
        totalTimeSeconds,
        averageVisitSeconds: visits > 0 ? Math.round(totalTimeSeconds / visits) : 0
      },
      topPages: normalizeMetricRows(pages, "/").map((row) => ({ path: row.label, views: row.value })),
      referrers: normalizeMetricRows(referrers, "Direct").map((row) => ({ referrer: row.label, visits: row.value })),
      browsers: normalizeMetricRows(browsers, "Unknown").map((row) => ({ browser: row.label, visits: row.value })),
      events: normalizeMetricRows(events, "Event").map((row) => ({ event: row.label, count: row.value })),
      pageviews: normalizePageviewRows(pageviews),
      dashboardUrl
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Unable to read Umami analytics.",
      period: selectedPeriod,
      startAt,
      endAt,
      stats: emptyStats,
      topPages: [],
      referrers: [],
      browsers: [],
      events: [],
      pageviews: [],
      dashboardUrl
    };
  }
}
