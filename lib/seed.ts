import type { Database } from "@/lib/types";

const now = "2026-06-13T12:00:00.000Z";

export const seedDatabase: Database = {
  demands: [
    {
      id: "demand-1",
      title: "Solo consultants rely too much on referrals and do not have a repeatable inbound system",
      source_platform: "Reddit",
      user_quote:
        "I get clients from word of mouth, but I have no idea how to create a steady pipeline without posting every day.",
      persona: "solo_consultant",
      job_to_be_done: "Create a predictable client acquisition system",
      problem_stage: "lead_generation",
      solution_attempted: "Posting on LinkedIn, inconsistent outreach",
      keyword: "consultants getting clients without referrals",
      pain_score: 5,
      frequency_score: 5,
      payment_score: 4,
      evidence_strength: "strong",
      status: "reviewed",
      tags: ["client_acquisition", "referrals", "content"],
      next_action: "Use in research post and lead magnet",
      topic_tag: "client_acquisition",
      created_at: now,
      updated_at: now
    },
    {
      id: "demand-2",
      title: "Freelancers want AI help with research and content, but do not trust generic prompts",
      source_platform: "Indie Hackers",
      user_quote:
        "Most AI advice feels too generic. I want workflows that fit a one-person service business.",
      persona: "freelancer",
      job_to_be_done: "Save time on research and content creation",
      problem_stage: "content",
      solution_attempted: "ChatGPT prompts, social templates",
      keyword: "ai workflows for freelancers",
      pain_score: 4,
      frequency_score: 4,
      payment_score: 4,
      evidence_strength: "medium",
      status: "clustered",
      tags: ["ai_automation", "content", "workflow"],
      next_action: "Explore waitlist angle",
      topic_tag: "ai_automation",
      created_at: now,
      updated_at: now
    }
  ],
  posts: [
    {
      id: "post-1",
      title: "How Consultants Get Clients in 2024 (Without Social Media)",
      slug: "how-consultants-get-clients-in-2024-without-social-media",
      summary:
        "Key findings from 320+ Reddit comments and interviews with independent consultants across different niches.",
      topic_tag: "client_acquisition",
      seo_title: "How Consultants Get Clients in 2024 Without Social Media",
      seo_description:
        "Research-backed findings on how independent consultants generate clients without relying on heavy social posting.",
      cta_type: "lead_magnet",
      cta_target: "/resources/client-acquisition-report",
      status: "published",
      published_at: "2026-05-12T12:00:00.000Z",
      created_at: now,
      updated_at: now,
      read_time: "8 min read",
      hero_label: "Research",
      related_demand_ids: ["demand-1"],
      content: `## Key Takeaways

- Referrals remain the #1 channel for consultants, but most growth comes from strategic positioning, not just asking for referrals.
- Niche clarity and a focused offer are critical for consistent inbound opportunities.
- Thought leadership works when it solves a specific problem for a specific audience.
- Email newsletters and long-form content outperform social media for lead generation.
- AI tools can help with research, content, and automation, but human trust closes deals.

## 1. Referrals Are Still the #1 Growth Channel

We analyzed 120+ Reddit comments and interviewed 25 consultants. The majority said referrals are their primary source of clients.

> "Most of my clients come from word of mouth. But it only started happening after I got super clear on who I help and how."

The key is becoming referable. Consultants who are easy to refer get more referrals.

## 2. Niche Clarity Beats General Positioning

Consultants with a clear niche and specific outcome get more inbound opportunities.

Examples of high-performing niches:

- LinkedIn outreach for B2B SaaS
- Financial forecasting for eCommerce brands
- SEO strategy for local service businesses

## 3. Thought Leadership That Solves Specific Problems

Publishing helpful content still works, but only when it is specific and actionable.

Top formats that drive clients:

- Case studies
- How-to guides
- Problem-solution frameworks

## 4. Email Outperforms Social Media

Consultants who run email newsletters or use email outreach get better results than those who rely on social media.

## 5. AI Tools Are a Force Multiplier

Consultants use AI to:

- Research problems and audiences
- Create content faster
- Automate repetitive tasks

But trust, relationships, and results still come from humans.`
    },
    {
      id: "post-2",
      title: "AI Tools That Actually Help Service Businesses Grow",
      slug: "ai-tools-that-actually-help-service-businesses-grow",
      summary:
        "7 AI tools that independent professionals use to save time, win clients, and deliver better results.",
      topic_tag: "ai_automation",
      seo_title: "AI Tools That Actually Help Service Businesses Grow",
      seo_description:
        "A practical guide to AI tools and workflows that support research, content, and delivery for solo service businesses.",
      cta_type: "newsletter",
      status: "published",
      published_at: "2026-04-28T12:00:00.000Z",
      created_at: now,
      updated_at: now,
      read_time: "7 min read",
      hero_label: "Research",
      content: `## What makes an AI tool useful?

Useful AI tools help solo professionals get leverage without adding operational complexity.

## What the best workflows have in common

- They save time on research and first drafts.
- They keep a human in the loop for trust-sensitive work.
- They support client acquisition, not just content volume.

## Recommended categories

1. Research summarizers
2. Content drafting assistants
3. CRM and follow-up automation
4. Offer validation workflows`
    },
    {
      id: "post-3",
      title: "How to Validate a High-Ticket Offer Before You Build It",
      slug: "how-to-validate-a-high-ticket-offer-before-you-build-it",
      summary:
        "A step-by-step framework to test demand, price, and messaging without building your full offer.",
      topic_tag: "offer_validation",
      seo_title: "How to Validate a High-Ticket Offer Before You Build It",
      seo_description:
        "Learn how solo professionals can validate a high-ticket service or product idea before investing time in building it.",
      cta_type: "waitlist",
      cta_target: "/waitlist/client-acquisition-ai-workflow",
      status: "published",
      published_at: "2026-04-20T12:00:00.000Z",
      created_at: now,
      updated_at: now,
      read_time: "8 min read",
      hero_label: "Research",
      content: `## Why validation matters

Validation reduces the risk of spending months building something nobody wants.

## What to test first

- The problem
- The audience
- The promise
- The price

## A simple validation flow

1. Collect pain point evidence
2. Write a clear point-of-view
3. Publish focused research
4. Offer a useful free resource
5. Invite the best-fit people onto a waitlist`
    },
    {
      id: "post-4",
      title: "How solo service businesses get clients without relying on referrals",
      slug: "how-solo-service-businesses-get-clients-without-relying-on-referrals",
      summary: "Draft research post focused on non-referral acquisition paths for solo professionals.",
      topic_tag: "client_acquisition",
      cta_type: "lead_magnet",
      status: "draft",
      created_at: now,
      updated_at: now
    },
    {
      id: "post-5",
      title: "25 client acquisition pain points from solo professionals",
      slug: "25-client-acquisition-pain-points-from-solo-professionals",
      summary: "Draft roundup of recurring acquisition pain points from interviews and public discussions.",
      topic_tag: "client_acquisition",
      cta_type: "newsletter",
      status: "draft",
      created_at: now,
      updated_at: now
    },
    {
      id: "post-6",
      title: "Why most marketing advice fails for one-person service businesses",
      slug: "why-most-marketing-advice-fails-for-one-person-service-businesses",
      summary: "Draft post contrasting generic advice with the constraints of a one-person business.",
      topic_tag: "marketing_positioning",
      cta_type: "waitlist",
      cta_target: "/waitlist/client-acquisition-ai-workflow",
      status: "draft",
      created_at: now,
      updated_at: now
    }
  ],
  resources: [
    {
      id: "resource-1",
      title: "Client Acquisition Report for Solo Professionals",
      slug: "client-acquisition-report",
      type: "report",
      audience: "solo_service_businesses",
      related_topic: "client_acquisition",
      landing_page_slug: "client-acquisition-report",
      delivery_mode: "file",
      delivery_url: "/downloads/client-acquisition-report.pdf",
      status: "published",
      created_at: now,
      updated_at: now
    }
  ],
  subscribers: [],
  waitlists: [],
  post_events: []
};
