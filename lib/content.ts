import type { TopicTag } from "@/lib/types";

export const siteName = "SoloClientLab.com";
export const siteDescription =
  "Focused tools that help consultants, freelancers, creators, and one-person businesses find opportunities, organize client work, and reduce repetitive tasks.";

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
      "Subscription access and co-build access for CNC and manufacturing teams that want to turn social comments into reviewable, exportable demand signals.",
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
    title: "Find useful opportunities",
    body: "Turn scattered public conversations into clearer signals worth a closer look."
  },
  {
    title: "Keep client context together",
    body: "Make it easier to keep decisions, files, and next steps where they can be found."
  },
  {
    title: "Follow up consistently",
    body: "Reduce the small pieces of remembering and re-sorting that make good work harder to run."
  },
  {
    title: "Automate the repetitive",
    body: "Move recurring sorting and handoffs out of your head without adding a giant software suite."
  }
];

export const aboutMethodSteps = [
  {
    step: "1",
    title: "Start with a repeated problem",
    body: "We look for a task that independent professionals already repeat and understand where the context gets lost."
  },
  {
    step: "2",
    title: "Keep the useful context",
    body: "We preserve the source language and the practical detail needed to decide whether a signal is worth acting on."
  },
  {
    step: "3",
    title: "Try a small workflow",
    body: "We test a focused tool or preview before adding more setup, automation, or product surface area."
  },
  {
    step: "4",
    title: "Make the next step clear",
    body: "The result should help someone review, organize, follow up, or decide without needing a new methodology."
  },
  {
    step: "5",
    title: "Keep only what earns its place",
    body: "When a workflow is useful, it becomes a small product with honest limits and a clear path to try it.",
    activeExperiment: "Current product: LeadRadar for CNC / Manufacturing →",
    activeExperimentHref: "/products/leadradar"
  }
];
