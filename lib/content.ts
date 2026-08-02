import type { TopicTag } from "@/lib/types";

export const siteName = "SoloClientLab.com";
export const siteDescription =
  "Research and products for solo consultants, service businesses, and manufacturing teams working on client acquisition and public demand signals.";

export const publicSocialProof = {
  newsletterJoinCopy:
    "Research notes for solo experts looking for lower-noise client acquisition workflows. Updated as new field notes and experiments are reviewed.",
  demandSignalsLabel: "Research status",
  demandSignalsDisplay: "Early field notes"
} as const;

export const homepageBottlenecks = [
  {
    title: "Signals disappear in noisy public threads",
    body: "Useful buying, sourcing, and workflow questions get buried inside comments, accounts, and keyword paths before anyone can review them."
  },
  {
    title: "Manual review does not scale",
    body: "Teams can scan comments by hand for a while, but the process becomes inconsistent when volume rises or multiple people need to review the same signal."
  },
  {
    title: "Research needs a product loop",
    body: "A pattern is only useful when it can move from article insight into a real workflow, configuration, review, export, and follow-up decision."
  }
] as const;

export const homepageNextSteps = [
  {
    title: "Name the signal source",
    body: "Start from the public threads, keywords, accounts, or comments where real demand language already appears."
  },
  {
    title: "Connect research to a workflow",
    body: "Use research to explain the repeated friction, then test whether a lightweight product can make that step easier."
  },
  {
    title: "Review before claiming validation",
    body: "Treat page views and self-tests as weak signals; product use, configuration, export, and business feedback are stronger."
  }
] as const;

export const topicLabels: Record<TopicTag, string> = {
  manufacturing_social_lead_discovery: "Manufacturing Social Lead Discovery",
  workflow_signal_research: "Workflow Signal Research",
  solo_worker_client_acquisition: "Solo Worker Client Acquisition"
};

export const topicOptions = [
  { value: "all", label: "All topics" },
  { value: "manufacturing_social_lead_discovery", label: topicLabels.manufacturing_social_lead_discovery },
  { value: "workflow_signal_research", label: topicLabels.workflow_signal_research },
  { value: "solo_worker_client_acquisition", label: topicLabels.solo_worker_client_acquisition }
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
    name: "LeadRadar",
    headline: "LeadRadar Product Access for Manufacturing Teams",
    subtitle:
      "Trial access and co-build access for CNC and manufacturing teams that want to turn social comments into reviewable, exportable demand signals.",
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
    body: "We review public conversations, operator notes, and early tool feedback to find problems that show up in real workflows."
  },
  {
    title: "Turn research into next steps",
    body: "We turn repeated pain patterns into product experiments that can be tried, configured, and reviewed."
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
    body: "We review public discussions, founder notes, article analytics, and small workflow experiments, while separating self-test data from stronger external signals.",
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
    title: "Client Workflows & AI Automation",
    body: "Building practical, automated workflows that help solo experts improve the real client workflows they already run - from finding demand signals and outreach to client conversations, onboarding, follow-up, and delivery."
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
    body: "We collect public conversations from places like Reddit, X, LinkedIn, forums, and operator interviews when they reveal a concrete workflow problem."
  },
  {
    step: "2",
    title: "Analyze",
    body: "We preserve the original context, tag recurring pain points, and separate vague interest from clearer demand signals."
  },
  {
    step: "3",
    title: "Validate",
    body: "We compare research notes with GSC search data, product-page visits, workflow usage, direct replies, and user feedback while marking self-test activity separately."
  },
  {
    step: "4",
    title: "Share",
    body: "We publish research notes only when the pattern can help a solo service business make a clearer next decision."
  },
  {
    step: "5",
    title: "Build & Validate Workflows",
    body: "When research uncovers a repeatable workflow gap, we build small demos or MVPs before claiming a broader product category.",
    activeExperiment: "Current product: LeadRadar for CNC / Manufacturing →",
    activeExperimentHref: "/products/leadradar"
  }
];
