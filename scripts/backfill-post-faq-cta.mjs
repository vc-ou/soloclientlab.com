#!/usr/bin/env node
/**
 * 回填文章的文末 CTA（posts.cta_type / cta_target）与 FAQ（posts.faq）。
 *
 * 背景：线上 10 篇文章这三列全为空。CTA 与 FAQPage 结构化数据已在代码里接好，
 * 缺的只是内容。本脚本只改这三列，绝不触碰 title / content / seo_* 等字段。
 *
 * 用法：
 *   node --env-file=.env.local scripts/backfill-post-faq-cta.mjs            # dry-run，只打印差异
 *   node --env-file=.env.local scripts/backfill-post-faq-cta.mjs --apply    # 写入（先自动备份）
 *
 * 特性：
 *   - 写入前把受影响文章的原值备份到 .data/backups/
 *   - 幂等：已经一致的文章会跳过
 *   - 按 slug 定位，找不到或非 published 的文章会报错退出，不会静默跳过
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");

/**
 * CTA 分配原则：
 *   - 制造 / 线索发现聚类 → LeadRadar 商品页
 *   - 其余（需求研究、获客、独立站 / SEO 方法论）→ 商品目录页
 *
 * 说明：需求研究类 3 篇原计划直连 NeedRadar，后统一改为目录页。
 * 若要改回直连，把这三篇的 cta_type 改回 "product"、cta_target 改成
 * "/products/needradar-workflow-lab" 再跑一次 --apply 即可（脚本是幂等的）。
 */
const POST_ENRICHMENT = {
  "how-to-get-cnc-machining-customers": {
    cta_type: "product",
    cta_target: "/products/leadradar",
    faq: [
      {
        question: "How do CNC machining shops find new customers without referrals?",
        answer:
          "Start with evidence of demand instead of a company list. Buyers already ask \"Can you make this part?\", \"What is your MOQ?\" or \"Looking for a CNC supplier\" in public comments under machining videos. Finding those conversations first gives a stronger starting point than emailing companies that may not be sourcing right now."
      },
      {
        question: "Where do CNC buyers actually ask for quotes online?",
        answer:
          "Most do not search for \"I need a CNC machining company\". They watch machining videos, compare processes, and ask about materials, MOQ, lead time, and international shipping in comments on TikTok, YouTube, Reddit, and LinkedIn. Those questions are early buying signals."
      },
      {
        question: "What is the difference between a high-intent and a low-intent comment?",
        answer:
          "\"Nice machine\" or \"great video\" is engagement. \"Need a supplier for aluminum parts\", \"Can you quote this?\" or \"What is your MOQ?\" points to a specific purchasing need — material, volume, or project. Only the second group deserves follow-up time."
      },
      {
        question: "Can referrals and demand discovery work together?",
        answer:
          "Yes. Referrals remain one of the best sources of B2B work; the goal is to stop depending on them as the only source. A workable mix is capability visibility, demand discovery in public conversations, lead qualification, and outreach based on the buyer's own question."
      }
    ]
  },
  "how-to-find-manufacturing-clients": {
    cta_type: "product",
    cta_target: "/products/leadradar",
    faq: [
      {
        question: "How do small manufacturers find new clients without referrals?",
        answer:
          "Look for buyers who are already describing a manufacturing need. They ask about materials, MOQ, samples, and suppliers in comments and communities long before they submit an RFQ. Saving those conversations with their context lets a small manufacturer start from the buyer's own question."
      },
      {
        question: "Why does cold prospecting perform poorly for manufacturers?",
        answer:
          "A company list tells you who might need machining, not who is sourcing right now. Without evidence of demand you try to create interest from scratch, which makes outreach expensive. Searching conversations instead starts with people who already raised the problem."
      },
      {
        question: "What should a manufacturing lead record include?",
        answer:
          "At minimum the original comment, the account, the source video or post, the industry context, the type of demand (MOQ, sample, quote, supplier search), and the follow-up status. Without that context the signal loses most of its value within a day."
      },
      {
        question: "How does AI fit into manufacturing lead research?",
        answer:
          "It handles the repetitive analysis: extracting commercial keywords, flagging buyer intent, classifying lead quality, and summarising the need. The human still decides who is worth contacting. A workable chain is: human finds conversations, tool collects signals, AI classifies, manufacturer reviews, relevant conversation starts."
      }
    ]
  },
  "manual-comment-research-demand-discovery-workflow": {
    cta_type: "product",
    cta_target: "/products/leadradar",
    faq: [
      {
        question: "Why does manual comment research stop working?",
        answer:
          "It works as observation, not as an operating workflow. Attention fades after about half an hour, source context such as the video, account, and surrounding replies is lost within a day, and two people scanning the same comments apply different standards. The output stays personal instead of becoming repeatable."
      },
      {
        question: "What are the first signs that comment scanning has become unsustainable?",
        answer:
          "You start skimming within the first hour, saved comments no longer carry their source, and every session begins from zero. If you cannot explain why a comment was kept, the workflow is already leaking value."
      },
      {
        question: "What should a comment-to-signal workflow actually capture?",
        answer:
          "The original wording, the account, the source content, and the type of intent — sourcing, quoting, sampling, small batch, or supplier search. That is enough to judge whether to follow up, and to reuse the raw language for content, FAQs, and offer positioning."
      },
      {
        question: "Does turning comments into demand signals require a CRM?",
        answer:
          "No. A narrow workflow — capture visible comments, preserve context, flag intent, review, export — already answers the early question: who is expressing demand, how, and which comments deserve follow-up. A CRM can come later."
      }
    ]
  },
  "find-b2b-leads-on-tiktok-manual-scanning-vs-workflow": {
    cta_type: "product",
    cta_target: "/products/leadradar",
    faq: [
      {
        question: "How do you find B2B leads on TikTok?",
        answer:
          "Read the comments under videos your buyers already watch. Signals look like \"Can this be customized?\", \"What is the MOQ?\", \"Can this material be used?\", or \"Where can I buy this?\" — informal, but specific about a purchasing need."
      },
      {
        question: "Why does manual comment scanning break down for a team?",
        answer:
          "It depends on individual attention and judgment. One person spends an hour and finds a few leads; the next day nobody continues, and there is no shared standard for what counts as high intent. The process cannot be repeated, delegated, or compared over time."
      },
      {
        question: "What information should be captured from a comment before sales follows up?",
        answer:
          "The comment itself, the account, the source video, and whatever the buyer revealed: material, process, quantity, tolerance, lead time, or budget. For custom work, missing front-end details push the same questions onto sales and engineering later."
      },
      {
        question: "Do you need a full AI sales system to start?",
        answer:
          "No. The smallest useful step is turning visible comments into a reviewable list with context preserved. That is a concrete result a team can trust, and it does not require changing how anyone works — which is why it is a better starting point than a large automation project."
      }
    ]
  },
  "how-freelancers-can-find-client-leads-on-social-media": {
    cta_type: "product",
    cta_target: "/products/leadradar",
    faq: [
      {
        question: "Can freelancers really find clients on social media?",
        answer:
          "Yes, but not by posting more. The work is searching conversations where someone describes a problem, compares options, or asks for help, then responding with context. That produces fewer but far better conversations than cold outreach."
      },
      {
        question: "Which platforms work best for finding freelance leads?",
        answer:
          "Wherever your buyers already ask questions: Reddit threads, TikTok comments, LinkedIn posts, and niche communities. The platform matters less than whether people describe specific problems in public."
      },
      {
        question: "How is this different from cold outreach?",
        answer:
          "Cold outreach starts without knowing whether a need exists. Reading public conversations starts with evidence — someone already said their site gets traffic but no leads, or asked where to find a supplier. The first message can then reference their actual problem."
      },
      {
        question: "How much time does manual social lead research take?",
        answer:
          "Doing it once is manageable; repeating it weekly is not. The real cost is attention: searching keywords, opening posts, reading hundreds of comments, and judging each one. That repetition is the part worth systematising."
      }
    ]
  },
  "how-to-get-first-clients-without-network": {
    cta_type: "products",
    cta_target: "/products",
    faq: [
      {
        question: "Can you get clients without a network or referrals?",
        answer:
          "Yes, by starting from visible problems instead of a contact list. Pick one narrow situation, find people describing it in public, and make your judgment visible before asking for a commitment. It is slower at first, but it does not depend on who you already know."
      },
      {
        question: "What is \"small proof\" and why does it work better than a pitch?",
        answer:
          "A short, specific artefact: one page that may be hurting conversion, a summary of the bottleneck someone described publicly, or a small teardown. It shows you understand the situation before you ask for a project, which is much harder to ignore than \"I can help you grow\"."
      },
      {
        question: "How should the first message read?",
        answer:
          "Short, specific, and easy to decline. Reference what they published, name one concrete observation, and leave the next step optional. No package, no calendar link in the first line."
      },
      {
        question: "Where do you find people describing problems in public?",
        answer:
          "Reddit, LinkedIn, industry communities, product reviews, job posts, and founder discussions. The filter is not \"might need my service\" but \"already describing the problem, trying to solve it, or asking for help\"."
      }
    ]
  },
  "how-to-get-seo-clients-without-cold-calling": {
    cta_type: "products",
    cta_target: "/products",
    faq: [
      {
        question: "How do SEO consultants get clients without cold calling?",
        answer:
          "Find public signs of an SEO problem first: a founder saying traffic brings no leads, a local business whose Maps ranking dropped, a SaaS team publishing content with no demo bookings. Then lead with that specific problem instead of a generic \"I can help your rankings\" pitch."
      },
      {
        question: "Why does generic SEO outreach perform poorly?",
        answer:
          "Clients rarely buy rankings in isolation. They buy a fix for slowing inquiries, competitors outranking them, or traffic that never converts. A pitch that does not name the problem sounds like every other SEO message."
      },
      {
        question: "What should an SEO consultant automate first?",
        answer:
          "The early steps, not the sending: finding companies with visible SEO pain, saving their public language, tagging the problem type, matching a past case, and drafting a first message. The judgment about who is worth contacting should stay human."
      },
      {
        question: "Does this replace outreach entirely?",
        answer:
          "No — it replaces blind outreach. The loop is public problem, lead judgment, mini audit, first message, follow-up record. You still reach out; you just stop guessing whether a need exists."
      }
    ]
  },
  "solo-practitioner-seo-a-practical-guide-for-independent-consultants": {
    cta_type: "products",
    cta_target: "/products",
    faq: [
      {
        question: "How much content does a solo consultant need for SEO?",
        answer:
          "Far less than an agency or a media site. A small set of pages that answer who you help, what you fix, and what to do next usually beats a large archive, because the goal is a better client judgment rather than traffic volume."
      },
      {
        question: "Where should a solo consultant start with SEO?",
        answer:
          "With one offer page, not with blog posts. It should explain who you help, the problem you solve, why it happens, your process, the outcome, and the next step. Then add problem pages that match how clients describe what feels broken."
      },
      {
        question: "Why build proof pages before scaling content?",
        answer:
          "Search visitors need a reason to trust a solo practitioner with a high-context project. Short case studies, before-and-after examples, and teardown notes do that work. More articles without proof mostly add volume."
      },
      {
        question: "What should each page point to?",
        answer:
          "Exactly one next step. A page that offers four routes asks the reader to decide too much; one clear next action is what turns a search visit into a conversation."
      }
    ]
  },
  "how-solo-service-businesses-get-clients-without-relying-on-referrals": {
    cta_type: "products",
    cta_target: "/products",
    faq: [
      {
        question: "Why are referrals not enough for a solo service business?",
        answer:
          "Because you cannot control when they arrive, how many come, whether the referred client fits, or whether the source keeps sending opportunities. Referrals are the outcome of past trust, not an acquisition system."
      },
      {
        question: "What should replace referrals?",
        answer:
          "One clear offer, one searchable channel where buyers already look, a way to show judgment before a sales call, and a follow-up record. Four pieces run consistently produce a pipeline you can actually describe."
      },
      {
        question: "Why does common advice like posting daily or cold calling fail?",
        answer:
          "Those are tactics, not systems. Without positioning and a conversion path, content creates visibility with no next step, outreach has nothing to reference, and effort scatters. The result is feeling busy without knowing where the next client comes from."
      },
      {
        question: "How do you know the bottleneck is overreliance on referrals?",
        answer:
          "Income is unpredictable, quiet months follow good ones with no change in effort, and you cannot say where the next three clients would come from. That is the signal to build a system rather than wait for the next introduction."
      }
    ]
  },
  "can-you-get-clients-without-social-media": {
    cta_type: "products",
    cta_target: "/products",
    faq: [
      {
        question: "Can a solo business get clients without social media?",
        answer:
          "Yes. In many English-speaking markets buyers still search when they have a concrete problem: a service they need, a process that is failing, a supplier comparison. A research-driven site can meet that intent without daily posting."
      },
      {
        question: "Is SEO still worth doing, or has search changed too much?",
        answer:
          "Search behaviour did not disappear; it narrowed. People still search around specific problems even as general browsing moved to feeds. For solo businesses that narrower intent is often more useful than a broad audience."
      },
      {
        question: "What should each article do for an independent site?",
        answer:
          "Address one real problem, match a question people actually search, offer a clear point of view, and guide the reader to one next step. An article without a next step is a brand page, not an acquisition asset."
      },
      {
        question: "What if the real bottleneck is not channel choice?",
        answer:
          "Then switching channels will not fix it. Check four things first: unclear positioning, overreliance on referrals, no search-focused content, and no follow-up system. Channel choice only helps once those are clear."
      }
    ]
  }
};

const MIN_FAQ = 3;
const MAX_FAQ = 5;

function normalizeFaq(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
    .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }));
}

function faqEqual(a, b) {
  return JSON.stringify(normalizeFaq(a)) === JSON.stringify(normalizeFaq(b));
}

function assertEntry(slug, entry) {
  const problems = [];
  const faq = normalizeFaq(entry.faq);
  if (faq.length < MIN_FAQ || faq.length > MAX_FAQ) {
    problems.push(`faq 数量 ${faq.length}，应在 ${MIN_FAQ}-${MAX_FAQ} 之间`);
  }
  faq.forEach((item, index) => {
    if (!item.question.endsWith("?")) problems.push(`faq[${index}].question 应以 ? 结尾`);
    if (item.question.length < 15 || item.question.length > 120) problems.push(`faq[${index}].question 长度异常`);
    if (item.answer.length < 80 || item.answer.length > 400) problems.push(`faq[${index}].answer 长度异常（${item.answer.length}）`);
    if (!/[.!?]$/.test(item.answer)) problems.push(`faq[${index}].answer 应以句号结尾`);
  });
  if (!["product", "products", "waitlist", "lead_magnet", "newsletter"].includes(entry.cta_type)) {
    problems.push(`cta_type 非法：${entry.cta_type}`);
  }
  if (!entry.cta_target.startsWith("/") || entry.cta_target.startsWith("//")) {
    problems.push(`cta_target 必须是站内路径：${entry.cta_target}`);
  }
  if (entry.cta_target.startsWith("/resources")) {
    problems.push("cta_target 指向已下线的 /resources");
  }
  if (problems.length) {
    throw new Error(`${slug}:\n  - ${problems.join("\n  - ")}`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置（用 --env-file=.env.local 运行）");
  }

  for (const [slug, entry] of Object.entries(POST_ENRICHMENT)) {
    assertEntry(slug, entry);
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    const existing = await sql`
      select slug, status, cta_type, cta_target, faq, updated_at
      from posts
      where slug in ${sql(Object.keys(POST_ENRICHMENT))}
    `;
    const bySlug = new Map(existing.map((row) => [row.slug, row]));

    const missing = Object.keys(POST_ENRICHMENT).filter((slug) => !bySlug.has(slug));
    if (missing.length) {
      throw new Error(`数据库里找不到这些 slug，已中止：\n  ${missing.join("\n  ")}`);
    }
    const notPublished = existing.filter((row) => row.status !== "published").map((row) => row.slug);
    if (notPublished.length) {
      throw new Error(`以下文章不是 published，已中止：\n  ${notPublished.join("\n  ")}`);
    }

    const plan = [];
    for (const [slug, entry] of Object.entries(POST_ENRICHMENT)) {
      const current = bySlug.get(slug);
      const faqChanged = !faqEqual(current.faq, entry.faq);
      const ctaChanged = current.cta_type !== entry.cta_type || current.cta_target !== entry.cta_target;
      plan.push({
        slug,
        faqChanged,
        ctaChanged,
        before: {
          cta_type: current.cta_type,
          cta_target: current.cta_target,
          faqCount: normalizeFaq(current.faq).length
        },
        after: {
          cta_type: entry.cta_type,
          cta_target: entry.cta_target,
          faqCount: normalizeFaq(entry.faq).length
        }
      });
    }

    const changed = plan.filter((item) => item.faqChanged || item.ctaChanged);

    console.log(`模式：${APPLY ? "APPLY（写入）" : "DRY-RUN（只读）"}`);
    console.log(`文章：${plan.length} 篇，待改动：${changed.length} 篇\n`);
    for (const item of plan) {
      const mark = item.faqChanged || item.ctaChanged ? "*" : " ";
      console.log(
        `${mark} ${item.slug}\n    cta: ${item.before.cta_type ?? "-"} ${item.before.cta_target ?? ""} -> ${item.after.cta_type} ${item.after.cta_target}` +
          `\n    faq: ${item.before.faqCount} -> ${item.after.faqCount}`
      );
    }

    if (!APPLY) {
      console.log("\n未写入。确认无误后加 --apply 执行。");
      return;
    }

    if (!changed.length) {
      console.log("\n所有文章已是最新，无需写入。");
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(process.cwd(), ".data", "backups", `posts-faq-cta-${stamp}.json`);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await writeFile(
      backupPath,
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          scope: "posts.cta_type / posts.cta_target / posts.faq（回填前原值）",
          rows: changed.map((item) => {
            const row = bySlug.get(item.slug);
            return {
              slug: row.slug,
              cta_type: row.cta_type,
              cta_target: row.cta_target,
              faq: row.faq,
              updated_at: row.updated_at
            };
          })
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`\n已备份原值：${path.relative(process.cwd(), backupPath)}`);

    const now = new Date().toISOString();
    for (const item of changed) {
      const entry = POST_ENRICHMENT[item.slug];
      // 注意：必须用 sql.json() 传数组。写成 `${JSON.stringify(arr)}::jsonb` 会被
      // postgres.js 按 json 参数再序列化一次，存成 jsonb 字符串而不是数组，
      // 前端 post.faq.map() 会直接崩。lib/db.ts 的 savePost 也是用 sql.json()。
      await sql`
        update posts
        set faq = ${sql.json(normalizeFaq(entry.faq))},
            cta_type = ${entry.cta_type},
            cta_target = ${entry.cta_target},
            updated_at = ${now}
        where slug = ${item.slug}
      `;
      console.log(`  写入 ${item.slug}`);
    }

    const verify = await sql`
      select slug, cta_type, cta_target,
             jsonb_typeof(faq) as faq_type,
             case when jsonb_typeof(faq) = 'array' then jsonb_array_length(faq) else 0 end as faq_count
      from posts
      where slug in ${sql(Object.keys(POST_ENRICHMENT))}
      order by slug
    `;
    console.log("\n回读校验：");
    let bad = 0;
    for (const row of verify) {
      const entry = POST_ENRICHMENT[row.slug];
      const ok =
        row.faq_type === "array" &&
        row.cta_type === entry.cta_type &&
        row.cta_target === entry.cta_target &&
        row.faq_count === normalizeFaq(entry.faq).length;
      if (!ok) bad += 1;
      console.log(`  ${ok ? "OK  " : "FAIL"} ${row.slug} | ${row.cta_type} ${row.cta_target} | faq ${row.faq_type}:${row.faq_count}`);
    }
    if (bad) throw new Error(`${bad} 篇文章回读不一致`);
    console.log("\n完成。");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`\n失败：${error.message}`);
  process.exit(1);
});
