import { unstable_cache } from "next/cache";
import { getReadSql, readDb, readWithRetry, withTimeout } from "@/lib/platform";
import { hasDatabaseUrl } from "@/lib/env";
import type { FeedbackEntry } from "@/lib/types";

/**
 * 「客户」读模型：以 email 为主键，聚合 5 张线索表。
 *
 * 后台原来把同一封邮件分散在 5 个页面（联系人 / 等待名单 / 访问申请 / 试用 / 问卷），
 * 处理一个人要来回切。这里只做读取聚合，不改表。
 *
 * 注意：feedback 没有 email 字段，无法归人，只能按 source_page 作为旁证。
 */

const ADMIN_READ_TIMEOUT_MS = 20_000;

type AccessRow = {
  id: string;
  email: string;
  access_type: string;
  product_slug: string;
  status: string;
  use_case?: string | null;
  created_at: string;
};

type TrialRow = {
  id: string;
  email: string;
  product_slug: string;
  status: string;
  trial_ends_at?: string | null;
  created_at: string;
};

type ConfigRow = {
  id: string;
  email: string;
  status: string;
  target_market?: string | null;
  keywords?: string[] | null;
  created_at: string;
};

type SubscriberRow = {
  id: string;
  email: string;
  source_page?: string | null;
  source_type?: string | null;
  lead_magnet?: string | null;
  persona_tag?: string | null;
  topic_tag?: string | null;
  note?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type WaitlistRow = {
  id: string;
  email: string;
  project_name: string;
  page_slug: string;
  interest_tag?: string | null;
  source_page?: string | null;
  created_at: string;
};

type RawCollections = {
  subscribers: SubscriberRow[];
  waitlists: WaitlistRow[];
  accessRequests: AccessRow[];
  trials: TrialRow[];
  configs: ConfigRow[];
  feedback: FeedbackEntry[];
};

export type PersonRow = {
  email: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sourcePage?: string;
  sourceType?: string;
  personaTags: string[];
  topicTags: string[];
  interests: string[];
  note?: string;
  subscriberStatus?: string;
  accessRequests: AccessRow[];
  trials: TrialRow[];
  configs: ConfigRow[];
  suggestedAction: string;
  suggestedTone: "danger" | "warn" | "muted";
};

async function loadRaw(): Promise<RawCollections> {
  if (!hasDatabaseUrl()) {
    const db = await readDb();
    return {
      subscribers: db.subscribers as unknown as SubscriberRow[],
      waitlists: db.waitlists as unknown as WaitlistRow[],
      accessRequests: db.product_access_requests as unknown as AccessRow[],
      trials: db.product_trials as unknown as TrialRow[],
      configs: db.leadradar_configs as unknown as ConfigRow[],
      feedback: db.feedback
    };
  }

  const sql = getReadSql();
  const rows = await readWithRetry("Admin people read", () =>
    withTimeout(sql<Array<{
      subscribers: SubscriberRow[];
      waitlists: WaitlistRow[];
      access_requests: AccessRow[];
      trials: TrialRow[];
      configs: ConfigRow[];
      feedback: FeedbackEntry[];
    }>>`
      select
        coalesce((select json_agg(s order by s.created_at desc) from subscribers s), '[]'::json) as subscribers,
        coalesce((select json_agg(w order by w.created_at desc) from waitlists w), '[]'::json) as waitlists,
        coalesce((select json_agg(r order by r.created_at desc) from product_access_requests r), '[]'::json) as access_requests,
        coalesce((select json_agg(t order by t.created_at desc) from product_trials t), '[]'::json) as trials,
        coalesce((select json_agg(c order by c.created_at desc) from leadradar_configs c), '[]'::json) as configs,
        coalesce((select json_agg(f order by f.created_at desc) from feedback f), '[]'::json) as feedback
    `, ADMIN_READ_TIMEOUT_MS)
  );

  const row = rows[0];
  return {
    subscribers: row?.subscribers ?? [],
    waitlists: row?.waitlists ?? [],
    accessRequests: row?.access_requests ?? [],
    trials: row?.trials ?? [],
    configs: row?.configs ?? [],
    feedback: row?.feedback ?? []
  };
}

function suggestAction(input: {
  accessRequests: AccessRow[];
  trials: TrialRow[];
  configs: ConfigRow[];
}): { action: string; tone: "danger" | "warn" | "muted" } {
  if (input.accessRequests.some((r) => r.status === "new")) {
    return { action: "回复访问申请", tone: "warn" };
  }
  const expiringTrial = input.trials.find(
    (t) => (t.status === "active" || t.status === "requested") && t.trial_ends_at
      ? new Date(t.trial_ends_at).getTime() - Date.now() < 3 * 24 * 3600_000
      : false
  );
  if (expiringTrial) {
    return { action: "试用即将到期，跟进", tone: "warn" };
  }
  if (input.configs.some((c) => c.status === "started")) {
    return { action: "问卷未完成，提醒", tone: "warn" };
  }
  return { action: "培养：发内容 / 观察", tone: "muted" };
}

function buildPeople(raw: RawCollections): PersonRow[] {
  const byEmail = new Map<string, PersonRow>();
  const uniq = (values: Array<string | null | undefined>) =>
    Array.from(new Set(values.filter((v): v is string => Boolean(v))));

  const touch = (email: string, createdAt: string) => {
    const key = email.trim().toLowerCase();
    if (!key) return null;
    let person = byEmail.get(key);
    if (!person) {
      person = {
        email: key,
        firstSeenAt: createdAt,
        lastSeenAt: createdAt,
        personaTags: [],
        topicTags: [],
        interests: [],
        accessRequests: [],
        trials: [],
        configs: [],
        suggestedAction: "",
        suggestedTone: "muted"
      };
      byEmail.set(key, person);
    }
    if (createdAt < person.firstSeenAt) person.firstSeenAt = createdAt;
    if (createdAt > person.lastSeenAt) person.lastSeenAt = createdAt;
    return person;
  };

  for (const s of raw.subscribers) {
    const person = touch(s.email, s.created_at);
    if (!person) continue;
    if (!person.sourcePage && s.source_page) person.sourcePage = s.source_page;
    if (!person.sourceType && s.source_type) person.sourceType = s.source_type;
    if (s.persona_tag) person.personaTags.push(s.persona_tag);
    if (s.topic_tag) person.topicTags.push(s.topic_tag);
    if (s.note) person.note = s.note;
    person.subscriberStatus = s.status;
  }

  for (const w of raw.waitlists) {
    const person = touch(w.email, w.created_at);
    if (!person) continue;
    if (!person.sourcePage && w.source_page) person.sourcePage = w.source_page;
    if (w.interest_tag) person.interests.push(w.interest_tag);
  }

  for (const r of raw.accessRequests) {
    const person = touch(r.email, r.created_at);
    if (person) person.accessRequests.push(r);
  }

  for (const t of raw.trials) {
    const person = touch(t.email, t.created_at);
    if (person) person.trials.push(t);
  }

  for (const c of raw.configs) {
    const person = touch(c.email, c.created_at);
    if (person) person.configs.push(c);
  }

  return Array.from(byEmail.values())
    .map((person) => {
      const { action, tone } = suggestAction(person);
      return {
        ...person,
        personaTags: uniq(person.personaTags),
        topicTags: uniq(person.topicTags),
        interests: uniq(person.interests),
        suggestedAction: action,
        suggestedTone: tone
      };
    })
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

async function loadPeople(): Promise<PersonRow[]> {
  return buildPeople(await loadRaw());
}

const cachedPeople = unstable_cache(loadPeople, ["admin-people-v1"], {
  tags: ["admin-people"],
  revalidate: 60
});

export async function getPeopleRows(): Promise<PersonRow[]> {
  try {
    if (!hasDatabaseUrl()) return await loadPeople();
    return await cachedPeople();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`客户视图读取失败（${message}）`);
  }
}

export async function getPersonDetail(email: string): Promise<{
  person: PersonRow | null;
  relatedFeedback: FeedbackEntry[];
}> {
  const raw = await loadRaw();
  const people = buildPeople(raw);
  const key = email.trim().toLowerCase();
  const person = people.find((item) => item.email === key) ?? null;
  const relatedFeedback = person?.sourcePage
    ? raw.feedback.filter((entry) => entry.source_page === person.sourcePage)
    : [];
  return { person, relatedFeedback };
}

/** 列表筛选：关键字 / 是否可跟进 / 来源类型 */
export function filterPeople(
  people: PersonRow[],
  filters: { q?: string; actionable?: string; sourceType?: string }
): PersonRow[] {
  const q = filters.q?.trim().toLowerCase();
  return people.filter((person) => {
    if (q) {
      const haystack = [
        person.email,
        person.sourcePage ?? "",
        person.sourceType ?? "",
        person.personaTags.join(" "),
        person.topicTags.join(" "),
        person.interests.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.actionable === "1" && person.suggestedTone === "muted") return false;
    if (filters.sourceType && person.sourceType !== filters.sourceType) return false;
    return true;
  });
}
