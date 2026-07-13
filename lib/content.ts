import type { TopicTag } from "@/lib/types";

export const siteName = "SoloClientLab.com";
export const siteDescription =
  "Research-backed client acquisition insights for solo service businesses, with practical validation guidance and AI workflows built for independent experts.";

export const publicSocialProof = {
  newsletterJoinCopy:
    "An invite-only database for solo experts looking for alternative client acquisition pathways. Updated every Monday.",
  demandSignalsLabel: "Demand signals tracked",
  demandSignalsDisplay: "100+"
} as const;

export const homepageBottlenecks = [
  {
    title: "Stop relying on random referrals",
    body: "You rely on word-of-mouth, but you lack a predictable, repeatable channel to generate inbound interest whenever you need it."
  },
  {
    title: "Fix your messaging to attract high-value clients",
    body: "Prospects don't immediately see why your offer fits their exact situation because your market positioning hasn't been validated by real-time demand data."
  },
  {
    title: "Automate your follow-up system for solo service businesses",
    body: "You have content drafts and occasional text conversations, but no practical, automated workflows to consistently turn silent interest into discovery calls."
  }
] as const;

export const homepageNextSteps = [
  {
    title: "Diagnose the bottleneck",
    body: "See which client acquisition problem is actually slowing growth right now instead of trying five tactics at once."
  },
  {
    title: "Pick a practical direction",
    body: "Use research and lightweight workflow tests to choose the next acquisition move that fits a solo business with limited time."
  },
  {
    title: "Build a lightweight system",
    body: "Turn one-off outreach, content, and follow-up into a simple workflow you can repeat every week."
  }
] as const;

export const topicLabels: Record<TopicTag, string> = {
  client_acquisition: "Client Acquisition",
  marketing_positioning: "Marketing & Positioning",
  ai_automation: "AI & Automation",
  offer_validation: "Offer Validation",
  operations: "Operations"
};

export const topicOptions = [
  { value: "all", label: "All topics" },
  { value: "client_acquisition", label: topicLabels.client_acquisition },
  { value: "marketing_positioning", label: topicLabels.marketing_positioning },
  { value: "ai_automation", label: topicLabels.ai_automation },
  { value: "offer_validation", label: topicLabels.offer_validation },
  { value: "operations", label: topicLabels.operations }
] as const;

export const personaOptions = [
  { value: "solo_consultant", label: "Solo consultant" },
  { value: "freelancer", label: "Freelancer" },
  { value: "fractional_operator", label: "Fractional operator" },
  { value: "small_studio_owner", label: "Small studio owner" },
  { value: "other", label: "Other" }
];

export const waitlistInterestOptions = [
  { value: "finding_leads", label: "Finding leads" },
  { value: "creating_content", label: "Creating content" },
  { value: "validating_offer", label: "Validating an offer" },
  { value: "following_up", label: "Following up" },
  { value: "other", label: "Other" }
];

export const waitlistProjects = {
  "client-acquisition-ai-workflow": {
    slug: "client-acquisition-ai-workflow",
    name: "AI Client Acquisition Workflow",
    headline: "AI Client Acquisition Workflow for Solo Service Businesses",
    subtitle:
      "A practical system for solo professionals who already know they need a clearer way to find leads, create trust-building content, and follow up consistently.",
    fitItems: [
      {
        title: "You rely too much on referrals",
        body: "You want a steadier pipeline, but you do not want to become a full-time content creator."
      },
      {
        title: "You know your work is good",
        body: "The problem is not delivery quality. The problem is turning your expertise into a repeatable client acquisition process."
      },
      {
        title: "You want a workflow, not more theory",
        body: "You are looking for a practical operating system you can run each week with limited time."
      }
    ],
    outcomeItems: [
      "Figure out where your acquisition process is leaking",
      "Choose outreach and content moves that match your business",
      "Start better client conversations with clearer positioning",
      "Follow up with a system instead of memory",
      "Turn scattered effort into a repeatable weekly workflow"
    ],
    whoThisIsFor:
      "Solo consultants, coaches, freelancers, and service providers who already know the issue is not effort alone. They need a clearer system for leads, trust, and follow-up."
  },
  "leadradar-for-tiktok": {
    slug: "leadradar-for-tiktok",
    name: "LeadRadarforTikTok",
    headline: "LeadRadarforTikTok Early Interest List",
    subtitle:
      "A small Chrome sidebar experiment for B2B teams who want to turn TikTok comments into filterable, exportable demand signals.",
    fitItems: [
      {
        title: "You already scan comments for leads",
        body: "You know useful signals can appear in TikTok or short-form video comments, but the manual process is tiring and inconsistent."
      },
      {
        title: "You sell a high-context B2B offer",
        body: "Your leads are not always formal form submissions. They often start as informal questions about pricing, sourcing, customization, samples, or suppliers."
      },
      {
        title: "You want a small workflow first",
        body: "You do not need a full CRM or automated outreach system yet. You need a cleaner way to identify, save, filter, and export promising comments."
      }
    ],
    outcomeItems: [
      "Capture visible TikTok comments while preserving the original wording and source",
      "Identify comments that look like buying, sourcing, customization, or quote intent",
      "Filter high-intent comments before spending time on manual follow-up",
      "Export a lightweight lead list for review, research, or sales handoff",
      "Learn which repeated questions should become content, FAQs, or outreach angles"
    ],
    whoThisIsFor:
      "B2B service businesses, custom manufacturing teams, and operators using TikTok or short-form video comments to spot overseas demand before it becomes a formal inquiry."
  }
} as const;

export const waitlistFitItems = [
  {
    title: "You rely too much on referrals",
    body: "You want a steadier pipeline, but you do not want to become a full-time content creator."
  },
  {
    title: "You know your work is good",
    body: "The problem is not delivery quality. The problem is turning your expertise into a repeatable client acquisition process."
  },
  {
    title: "You want a workflow, not more theory",
    body: "You are looking for a practical operating system you can run each week with limited time."
  }
] as const;

export const workflowOutcomeItems = [
  "Figure out where your acquisition process is leaking",
  "Choose outreach and content moves that match your business",
  "Start better client conversations with clearer positioning",
  "Follow up with a system instead of memory",
  "Turn scattered effort into a repeatable weekly workflow"
] as const;

export const homeProofItems = [
  {
    title: "Research real problems",
    body: "We analyze hundreds of conversations across Reddit, forums, and communities to find what actually matters."
  },
  {
    title: "Turn research into clients",
    body: "We turn repeated pain patterns into practical client acquisition ideas for solo service businesses."
  },
  {
    title: "Validate before you build",
    body: "We help you validate demand and refine offers before investing time and money into building."
  }
];

export const newsletterBenefits = [
  {
    title: "Diagnose Acquisition Bottlenecks",
    body: "Real client acquisition problems pulled from community conversations, so you can compare them with your own situation."
  },
  {
    title: "Discover Validated Growth Tactics",
    body: "Practical acquisition angles and validation ideas that help you decide what to test next."
  },
  {
    title: "Build Actionable AI Workflows",
    body: "Practical AI workflows and operating frameworks designed to help solo pros research, structure content, and build repeatable acquisition systems."
  }
] as const;

export const resourceHighlights = [
  {
    title: "Spot the real bottleneck",
    body: "Stop burning hours on cold emails that get ignored."
  },
  {
    title: "Recognize the repeated patterns",
    body: "Understand the 3-5 themes that keep blocking growth across different solo service businesses."
  },
  {
    title: "Filter out misleading advice",
    body: "Tired of 'post 3 times a day on LinkedIn' hype? Here is what actually works for introverted experts."
  },
  {
    title: "Choose lower-noise acquisition paths",
    body: "Review client acquisition directions that do not depend on constant posting or building an audience first."
  },
  {
    title: "Map an AI-assisted workflow",
    body: "Use AI for research, content, and validation in a way that supports your existing client work."
  },
  {
    title: "Decide what to do next",
    body: "Use a simple validation checklist to choose the next test before you invest more time or money."
  }
];

export const resourceCategoryTabs = [
  "Research Updates",
  "What You'll Learn",
  "Research Method"
] as const;

export const resourceFeatureCards = [
  {
    eyebrow: "Updates",
    title: "Client Acquisition Updates for Solo Professionals",
    body: "A practical stream of research notes, workflow experiments, and next-step ideas for solo professionals testing better acquisition systems.",
    cta: "Join the list for updates →"
  },
  {
    eyebrow: "Inside",
    title: "What this helps you diagnose and decide",
    body: "Repeated pain themes, lower-noise acquisition paths, AI-assisted workflows, and a validation checklist you can use right away.",
    cta: "See what's inside"
  },
  {
    eyebrow: "Method",
    title: "How SoloClientLab.com does the research",
    body: "We semantic-analyze 10,000+ real freelance dry-spell complaints from Reddit, X, and Google Business Profiles quarterly.",
    cta: "Why this is trustworthy"
  }
] as const;

export const aboutStudyAreas = [
  {
    title: "Client acquisition problems",
    body: "Identifying why independent consultants struggle to secure steady leads and why generic marketing advice fails to scale for solo professionals."
  },
  {
    title: "Client acquisition patterns",
    body: "Analyzing underserved market angles, emerging lead generation tactics, and repeatable growth frameworks worth testing."
  },
  {
    title: "AI tools & workflows",
    body: "Building automated AI workflows that save time, scale content production, and help solo experts grow without needing a large team."
  },
  {
    title: "Idea validation",
    body: "Transforming market pain points into validated business solutions before investing time and money into building."
  }
];

export const aboutMethodSteps = [
  {
    step: "1",
    title: "Discover",
    body: "We monitor unfiltered conversations across Reddit, industry forums, LinkedIn, and expert interviews."
  },
  {
    step: "2",
    title: "Analyze",
    body: "We extract recurring pain points, thematic demand signals, and client acquisition patterns."
  },
  {
    step: "3",
    title: "Validate",
    body: "We test these patterns against real market importance, frequency, and willingness to pay."
  },
  {
    step: "4",
    title: "Share",
    body: "We publish research-backed resources to help you make better decisions and build a more profitable service business."
  },
  {
    step: "5",
    title: "Build (Sometimes)",
    body: "When a problem is significant and the solution is clear, we build and test open-source tools in public.",
    activeExperiment: "Our current active experiment: LeadRadar (TikTok B2B Lead Automation) →",
    activeExperimentHref: "/tools/leadradar"
  }
];
