import { describe, expect, it } from "vitest";
import { useIsolatedDataDir } from "./setup";

const env = useIsolatedDataDir();

const leads = await import("@/lib/domains/leads");
const analytics = await import("@/lib/domains/analytics");
const platform = await import("@/lib/platform");

describe("leads · 订阅者去重", () => {
  it("同一邮箱再次订阅只保留一条，并更新来源", async () => {
    await leads.saveSubscriber({
      email: "Reader@Example.com",
      source_page: "/",
      source_type: "home"
    });
    await leads.saveSubscriber({
      email: "reader@example.com",
      source_page: "/research/x",
      source_type: "post",
      persona_tag: "consultant"
    });

    const db = await platform.readDb();
    const matches = db.subscribers.filter((s) => s.email === "reader@example.com");
    expect(matches).toHaveLength(1);
    expect(matches[0].source_type).toBe("post");
    // markTestValue()：非生产环境会给标签打 [TEST] 后缀，便于后台识别测试数据
    expect(matches[0].persona_tag).toBe("consultant [TEST]");
    expect(matches[0].status).toBe("active");
  });

  it("按 email 查得到，且能更新备注", async () => {
    const found = await leads.getSubscriberByEmail("reader@example.com");
    expect(found).not.toBeNull();
    if (!found) return;

    await leads.updateSubscriberNote(found.id, "follow up next week");
    const again = await leads.getSubscriberByEmail("reader@example.com");
    expect(again?.note).toBe("follow up next week");
  });

  it("筛选器按来源类型过滤", async () => {
    const posts = await leads.getFilteredSubscribers({ source_type: "post" });
    expect(posts.length).toBe(1);
    const resources = await leads.getFilteredSubscribers({ source_type: "resource" });
    expect(resources.length).toBe(0);
  });
});

describe("leads · 等待名单与反馈", () => {
  it("等待名单允许同一邮箱多次提交（不同页面）", async () => {
    await leads.addWaitlistEntry({
      project_name: "LeadRadar",
      page_slug: "leadradar-for-tiktok",
      email: "lead@example.com"
    });
    await leads.addWaitlistEntry({
      project_name: "LeadRadar",
      page_slug: "leadradar-for-tiktok",
      email: "lead@example.com"
    });
    const db = await platform.readDb();
    expect(db.waitlists.filter((w) => w.email === "lead@example.com")).toHaveLength(2);
  });

  it("反馈落库，且来源页可用于筛选", async () => {
    await leads.addFeedbackEntry({
      tool_slug: "leadradar",
      source_page: "/products/leadradar",
      is_useful: false,
      problem_context: "comment queue too noisy"
    });
    const filtered = await leads.getFilteredFeedback({ tool_slug: "leadradar" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].problem_context).toContain("noisy");
  });
});

describe("analytics · 事件与会话过滤", () => {
  it("内部来源的事件不写入（避免污染漏斗）", async () => {
    await analytics.trackTrialEvent({
      product_slug: "leadradar",
      event_type: "product_page_visit",
      path: "http://localhost:3000/products/leadradar"
    });
    const db = await platform.readDb();
    expect(db.trial_events).toHaveLength(0);
  });

  it("外部来源的事件正常写入", async () => {
    await analytics.trackTrialEvent({
      product_slug: "leadradar",
      event_type: "product_page_visit",
      path: "/products/leadradar",
      source_page: "/research/how-to-get-cnc-machining-customers"
    });
    const db = await platform.readDb();
    expect(db.trial_events).toHaveLength(1);
  });
});

describe("analytics · 跨域聚合（E-003）", () => {
  it("空库时各计数为 0，不会抛错", async () => {
    const metrics = await analytics.getProductAdminMetrics();
    expect(metrics.paidPayments).toBe(0);
    expect(metrics.accessRequests).toBe(0);
    expect(metrics.activeEntitlements).toBe(0);
    expect(Array.isArray(metrics.latestEvents)).toBe(true);
  });
});

process.on("exit", () => env.cleanup());
