"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { sendProductEvent } from "@/components/product-events";
import { submitLeadRadarFeedback } from "@/lib/actions";
import type { ActionState } from "@/lib/types";

type DemoComment = {
  author: string;
  text: string;
  intent: "high" | "medium" | "low";
  reason: string;
  tags: string[];
};

type ReviewFilter = "all" | "strong" | "review";
type DemoStep = 1 | 2 | 3;

const initialFeedbackState: ActionState = {
  success: false,
  message: ""
};

function comment(
  author: string,
  text: string,
  intent: DemoComment["intent"],
  reason: string,
  tags: string[]
): DemoComment {
  return { author, text, intent, reason, tags };
}

const sampleComments: DemoComment[] = [
  comment("@procurement_daily", "Can you do private label for stainless tumblers and what is the MOQ?", "high", "Contains direct buying signals: private label + MOQ.", ["MOQ", "Private label", "Buying intent"]),
  comment("@brandlaunch_us", "Do you have a catalog and price list for wholesale orders to the US?", "high", "Asks for catalog and pricing for wholesale shipment.", ["Wholesale", "Pricing", "US market"]),
  comment("@opsmaria", "How long does custom packaging usually take if we need samples first?", "medium", "Shows project exploration with packaging and sample questions.", ["Samples", "Packaging", "Timeline"]),
  comment("@justwatching88", "This factory tour is satisfying to watch.", "low", "No sourcing, buying, or project signal.", ["Low signal"]),
  comment("@founder_nick", "We need a supplier for a small trial run before Q4. Do you ship to Canada?", "high", "Mentions supplier search, trial order, timing, and destination.", ["Supplier search", "Trial run", "Canada"]),
  comment("@sourcing_jenny", "Can you send MOQ, FOB price, and lead time for 5k units?", "high", "Direct request for pricing, MOQ, and operational terms.", ["FOB", "MOQ", "Lead time"]),
  comment("@curiousviewer01", "Love the machines in this video.", "low", "Pure engagement with no commercial intent.", ["Engagement only"]),
  comment("@agency_buyer", "Do you support OEM for pet accessories and can you share your product catalog?", "high", "Asks about OEM scope and catalog access.", ["OEM", "Catalog", "Pet accessories"]),
  comment("@retailtestlab", "We are comparing 3 factories for a holiday gift line. What is your sample turnaround?", "medium", "Vendor comparison and sampling suggest active evaluation.", ["Vendor comparison", "Samples", "Holiday line"]),
  comment("@spammy_growth", "DM us to grow your page fast!!!", "low", "Spam and irrelevant to purchasing intent.", ["Spam"]),
  comment("@wholesale_alex", "Need landed pricing to Germany for 2 container options. Can you quote both?", "high", "Clear quote request with logistics scope.", ["Quote", "Germany", "Containers"]),
  comment("@factoryfan333", "The editing is so clean.", "low", "Compliment only.", ["Compliment"]),
  comment("@launchpadamy", "Can you do custom inserts and branded boxes for a skincare starter kit?", "medium", "Customization request shows interest but not yet a buying commitment.", ["Custom packaging", "Branding", "Skincare"]),
  comment("@b2b_hunter", "Do you have clients in the UK already? Need someone familiar with Boots requirements.", "medium", "Signals qualification and vendor research for a live retail channel.", ["UK market", "Compliance", "Vendor research"]),
  comment("@coffeegear_co", "Can you share pricing for 500, 1000, and 3000 units?", "high", "Explicit volume-based pricing request.", ["Tiered pricing", "Unit volume"]),
  comment("@justlurkinghere", "Subbed for more content.", "low", "Follower-style engagement only.", ["Low signal"]),
  comment("@ops_chris", "If we move forward, what are standard payment terms for first orders?", "high", "Uses commitment language and asks operational buying question.", ["Payment terms", "First order"]),
  comment("@newbrand_mila", "Do you offer low MOQ options for market testing?", "medium", "Shows exploratory purchase interest for a pilot run.", ["Low MOQ", "Market test"]),
  comment("@whitelabelworks", "Can we use your existing mold but add our logo and packaging?", "high", "Commercial white-label request with packaging scope.", ["White label", "Logo", "Packaging"]),
  comment("@viralclipfan", "This deserves way more views.", "low", "No lead signal.", ["Chatter"]),
  comment("@logistics_andy", "Can you handle DDP shipping into California warehouses?", "high", "Direct logistics qualification before purchase.", ["DDP", "California", "Warehousing"]),
  comment("@procurement_sara", "Need a quote for bamboo cutlery sets. What is your MOQ and production capacity?", "high", "Quote plus MOQ plus capacity indicate active procurement.", ["Quote", "Capacity", "MOQ"]),
  comment("@designstudio_lee", "Do you have dieline templates for custom gift boxes?", "medium", "Packaging prep indicates serious evaluation, but not a full buying request yet.", ["Dieline", "Packaging", "Design prep"]),
  comment("@emoji_only_lol", "🔥🔥🔥", "low", "Emoji-only engagement.", ["Emoji response"]),
  comment("@regionalbuyer_mx", "Do you export to Mexico and can you include Spanish carton labeling?", "medium", "Market entry and localization questions show possible demand.", ["Mexico", "Labeling", "Export"]),
  comment("@beautychain_ops", "What certifications do you have for cosmetic packaging materials?", "medium", "Compliance validation often appears mid-funnel.", ["Certification", "Compliance", "Cosmetics"]),
  comment("@outdoorbrandtom", "Can you send your latest wholesale catalog and ex-works price list?", "high", "Direct request for commercial sales materials.", ["Wholesale", "Catalog", "EXW"]),
  comment("@freetipsdaily", "Post more behind-the-scenes please.", "low", "Content suggestion, not demand.", ["Content request"]),
  comment("@supplychainmia", "We need 2 suppliers as backup for Q1. Can you handle recurring monthly orders?", "high", "Recurring order discussion indicates live sourcing need.", ["Recurring orders", "Q1 planning", "Supplier backup"]),
  comment("@trialrunlab", "Would you do a paid sample before a 10k unit order?", "high", "Paid sample tied to a projected order is a strong signal.", ["Paid sample", "10k units"]),
  comment("@amazonlaunchben", "Can you help with FNSKU labeling and pallet specs for FBA prep?", "medium", "Operational prep suggests commerce use case, but not a direct buy yet.", ["Amazon FBA", "Labeling", "Pallet specs"]),
  comment("@memesandcoffee", "I thought this was a cooking video at first.", "low", "Irrelevant chatter.", ["Irrelevant"]),
  comment("@procure_now", "Please send MOQ, tooling cost, and sample fee for silicone lids.", "high", "Clear request for commercial decision inputs.", ["Tooling", "Sample fee", "MOQ"]),
  comment("@brandops_erin", "How long from deposit to shipment for custom color runs?", "high", "Detailed order-timing question shows live purchase evaluation.", ["Deposit", "Shipment", "Custom color"]),
  comment("@startupfoundry", "Still validating this product. Can you share rough pricing brackets?", "medium", "Early-stage commercial exploration with budget qualification.", ["Pricing brackets", "Validation"]),
  comment("@watchingfromny", "Amazing quality honestly.", "low", "Praise only.", ["Praise"]),
  comment("@ecomteam_jp", "Can you do mixed SKUs in one shipment for a Japan launch?", "medium", "Complex logistics question implies real distribution planning.", ["Japan", "Mixed SKUs", "Launch"]),
  comment("@buyingdesk_uk", "Need 3 quotes this week for insulated bottles. Can you email specs and pricing?", "high", "Time-bound quote request is a strong buying signal.", ["Urgent quote", "Specs", "UK"]),
  comment("@creatorfanclub", "Your voiceover is so calming.", "low", "Non-commercial engagement.", ["Low signal"]),
  comment("@importmanager_lia", "What is your current lead time if we reserve capacity for September?", "high", "Capacity reservation language suggests late-stage planning.", ["Capacity", "Lead time", "September"]),
  comment("@samplepackaging", "Could you share carton dimensions and drop-test standards?", "medium", "Technical evaluation supports supplier screening.", ["Carton dimensions", "Testing", "Screening"]),
  comment("@randomscrollguy", "Anyone know the background song?", "low", "Question unrelated to product procurement.", ["Off-topic"]),
  comment("@hospitalitybuyer", "Looking for private label amenity kits for hotel chains. What are your minimums?", "high", "Private-label and minimum order question indicates procurement.", ["Hospitality", "Private label", "Minimums"]),
  comment("@launchpilotco", "Do you offer plain samples in stock colors before custom development?", "medium", "Sample-stage validation with practical constraints.", ["Stock samples", "Custom development"]),
  comment("@freelancecopygal", "This hook was really smart.", "low", "Marketing feedback only.", ["Marketing feedback"]),
  comment("@distributionmax", "Need CIF pricing for Dubai and Riyadh. Can you handle both ports?", "high", "Specific destination pricing request with shipping terms.", ["CIF", "Dubai", "Riyadh"]),
  comment("@brandtesters", "What is the usual defect rate tolerance in your QC process?", "medium", "QC diligence suggests vendor evaluation, but not direct intent yet.", ["QC", "Defect rate", "Supplier screening"]),
  comment("@ugcqueen7", "Can you send me one for free to review?", "low", "Influencer/free sample ask, not B2B buying demand.", ["Free sample"]),
  comment("@procurement_taipei", "Can you support bilingual packaging and retail-ready barcode placement?", "medium", "Retail-readiness signals possible demand but not yet order-ready.", ["Bilingual packaging", "Barcode", "Retail"]),
  comment("@brandhouse_ceo", "Need a long-term manufacturing partner for our Q4 gift set line. Let's discuss capacity.", "high", "Partnership and capacity discussion indicate strategic sourcing intent.", ["Q4", "Manufacturing partner", "Capacity"]),
  comment("@wholesalehunter_ca", "Could you quote 2k / 5k / 8k pcs and share sample lead time?", "high", "Structured quote request tied to sampling.", ["Volume quote", "Samples"]),
  comment("@somebodylol", "First!", "low", "Comment noise only.", ["Noise"]),
  comment("@beautyops_nina", "If we need secondary packaging assembled before shipment, can you handle that in-house?", "medium", "Assembly workflow question shows operational fit validation.", ["Assembly", "Secondary packaging", "Operations"]),
  comment("@fmcg_sourcing", "Please confirm whether you can match this spec sheet and provide an MOQ estimate.", "high", "Specification matching with MOQ estimate is direct sourcing behavior.", ["Spec sheet", "MOQ estimate"]),
  comment("@gadgetretail_io", "We are launching on Shopify first. Do you have low-risk starter MOQs?", "medium", "Commercial exploration with early-stage risk constraints.", ["Starter MOQ", "Shopify launch"]),
  comment("@discountguru88", "How much for one piece shipped to my house?", "low", "Consumer retail inquiry, not a B2B lead.", ["B2C inquiry"]),
  comment("@operations_frank", "Need to know if you can hold inventory for staggered releases across 3 months.", "high", "Inventory planning for staged releases indicates mature demand.", ["Inventory holding", "Release schedule"]),
  comment("@annawatchesstuff", "This machine is so satisfying to watch all day.", "low", "Entertainment-only response.", ["Entertainment"]),
  comment("@privatebrand_de", "Can you share your latest private label brochure and sample policy?", "high", "Requests commercial collateral and sample terms.", ["Private label", "Brochure", "Sample policy"])
];

const flowSteps = [
  "Scroll the comments",
  "Sidebar capture live",
  "Review qualified leads"
] as const;

function arraysMatch(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function trackLeadRadarDemoClick() {
  try {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        toolSlug: "tools/leadradar",
        eventType: "demo_open",
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined
      }),
      keepalive: true
    });
  } catch {
    // Demo analytics should never block the interaction.
  }
}

function ResultBadge({ intent }: { intent: DemoComment["intent"] }) {
  const labelMap = {
    high: "HIGH intent",
    medium: "REVIEW",
    low: "NON-LEAD"
  } satisfies Record<DemoComment["intent"], string>;

  return <span className={`leadradar-intent leadradar-intent-${intent}`}>{labelMap[intent]}</span>;
}

export function LeadRadarDemo() {
  const [feedbackState, feedbackAction, feedbackPending] = useActionState(submitLeadRadarFeedback, initialFeedbackState);
  const [demoVisible, setDemoVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<DemoStep>(1);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [hasScrolledFeed, setHasScrolledFeed] = useState(false);
  const [capturedIndexes, setCapturedIndexes] = useState<number[]>([]);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [feedback, setFeedback] = useState<"useful" | "not_useful" | null>(null);
  const [problem, setProblem] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const feedbackFormRef = useRef<HTMLFormElement | null>(null);
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const feedListRef = useRef<HTMLDivElement | null>(null);
  const commentRefs = useRef<Array<HTMLElement | null>>([]);
  const capturedComments = useMemo(
    () => capturedIndexes.map((index) => sampleComments[index]),
    [capturedIndexes]
  );

  const summary = useMemo(() => {
    const high = capturedComments.filter((item) => item.intent === "high").length;
    const medium = capturedComments.filter((item) => item.intent === "medium").length;
    const low = capturedComments.filter((item) => item.intent === "low").length;

    return { high, medium, low };
  }, [capturedComments]);

  const prioritizedComments = useMemo(() => {
    return [...capturedComments].sort((left, right) => {
      const priority = { high: 0, medium: 1, low: 2 } as const;
      return priority[left.intent] - priority[right.intent];
    });
  }, [capturedComments]);

  const sidebarHighIntentComments = useMemo(
    () => capturedComments.filter((comment) => comment.intent === "high"),
    [capturedComments]
  );

  const reviewViewComments = useMemo(() => {
    const filteredBase = prioritizedComments.filter((comment) => comment.intent !== "low");
    if (reviewFilter === "strong") {
      return filteredBase.filter((comment) => comment.intent === "high");
    }
    if (reviewFilter === "review") {
      return filteredBase.filter((comment) => comment.intent === "medium");
    }

    return filteredBase;
  }, [prioritizedComments, reviewFilter]);

  const stepStates = useMemo(
    () => [
      { step: 1 as DemoStep, label: flowSteps[0], done: hasScrolledFeed },
      { step: 2 as DemoStep, label: flowSteps[1], done: capturedComments.length > 0 },
      { step: 3 as DemoStep, label: flowSteps[2], done: reviewUnlocked }
    ],
    [capturedComments.length, hasScrolledFeed, reviewUnlocked]
  );

  useEffect(() => {
    function syncDemoHash() {
      if (window.location.hash === "#leadradar-demo") {
        setDemoVisible(true);
      }
    }

    syncDemoHash();
    window.addEventListener("hashchange", syncDemoHash);

    return () => window.removeEventListener("hashchange", syncDemoHash);
  }, []);

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    window.history.replaceState(null, "", "#leadradar-demo");
    requestAnimationFrame(() => {
      demoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [demoVisible]);

  function revealDemo() {
    setDemoVisible(true);
    setActiveStep(1);
  }

  function handleTryDemoClick() {
    trackPlausibleEvent("tool_demo_clicked");
    void trackLeadRadarDemoClick();
    revealDemo();
  }

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    setCaptureStarted(false);
    setHasScrolledFeed(false);
    setCapturedIndexes([]);
    setVisibleIndexes([]);
    setReviewUnlocked(false);
    setActiveStep(1);
  }, [demoVisible]);

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    const target = activeStep === 3 ? reviewSectionRef.current : demoSectionRef.current;
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeStep, demoVisible]);

  useEffect(() => {
    if (feedbackState.success) {
      setFeedback(null);
      setProblem("");
      setAttachmentLabel("");
      feedbackFormRef.current?.reset();
      trackPlausibleEvent("tool_feedback_submitted");
    }
  }, [feedbackState.success]);

  function handleFlowStepClick(step: DemoStep) {
    if (step === 3 && !reviewUnlocked) {
      return;
    }

    setActiveStep(step);
  }

  function syncVisibleComments() {
    const feedNode = feedListRef.current;
    if (!feedNode) {
      return;
    }

    const feedRect = feedNode.getBoundingClientRect();
    const nextVisibleIndexes = sampleComments.reduce<number[]>((indexes, _comment, index) => {
      const commentNode = commentRefs.current[index];
      if (!commentNode) {
        return indexes;
      }

      const rect = commentNode.getBoundingClientRect();
      const isVisible = rect.bottom > feedRect.top + 24 && rect.top < feedRect.bottom - 24;
      if (isVisible) {
        indexes.push(index);
      }

      return indexes;
    }, []);

    setVisibleIndexes((current) => (arraysMatch(current, nextVisibleIndexes) ? current : nextVisibleIndexes));
    setCapturedIndexes((current) => {
      const merged = Array.from(new Set([...current, ...nextVisibleIndexes])).sort((left, right) => left - right);
      return arraysMatch(current, merged) ? current : merged;
    });
  }

  function handleFeedScroll() {
    if (!captureStarted) {
      setCaptureStarted(true);
      setReviewUnlocked(false);
      trackPlausibleEvent("tool_started");
    }

    if (!hasScrolledFeed) {
      setHasScrolledFeed(true);
    }

    if (activeStep === 1) {
      setActiveStep(2);
    }

    syncVisibleComments();
  }

  function unlockReview() {
    setReviewUnlocked(true);
    setReviewFilter("all");
    setActiveStep(3);
    trackPlausibleEvent("tool_completed");
    void fetch("/api/tool-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        toolSlug: "tools/leadradar",
        eventType: "review_completed",
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined
      }),
      keepalive: true
    }).catch(() => undefined);
  }

  function handleFeedback(nextFeedback: "useful" | "not_useful") {
    setFeedback(nextFeedback);
  }

  function exportReviewCsv() {
    const rows = [
      ["author", "intent", "reason", "text", "tags"],
      ...reviewViewComments.map((comment) => [
        comment.author,
        comment.intent,
        comment.reason,
        comment.text,
        comment.tags.join("; ")
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leadradar-review.csv";
    link.click();
    URL.revokeObjectURL(url);
    trackPlausibleEvent("csv_exported");
    void sendProductEvent("csv_exported", { row_count: reviewViewComments.length });
  }

  function getReviewTone(intent: DemoComment["intent"]) {
    if (intent === "high") return "tone-strong";
    if (intent === "medium") return "tone-medium";
    return "tone-neutral";
  }

  function getReviewPriorityLabel(intent: DemoComment["intent"]) {
    if (intent === "high") return "Strong Intent";
    if (intent === "medium") return "Review";
    return "Non-Lead";
  }

  function getIntentScore(intent: DemoComment["intent"]) {
    if (intent === "high") return 72;
    if (intent === "medium") return 41;
    return 10;
  }

  function getDemandTypeLabel(comment: DemoComment) {
    if (comment.tags.some((tag) => /quote|pricing|FOB|EXW|CIF/i.test(tag))) return "Quote Request";
    if (comment.tags.some((tag) => /supplier|vendor/i.test(tag))) return "Supplier Search";
    if (comment.tags.some((tag) => /sample/i.test(tag))) return "Prototype / Sample";
    if (comment.tags.some((tag) => /MOQ|volume|units|capacity/i.test(tag))) return "Order Sizing";
    if (comment.tags.some((tag) => /packaging|label/i.test(tag))) return "Custom Packaging";
    return "Manual Review";
  }

  function getLeadStageLabel(intent: DemoComment["intent"]) {
    if (intent === "high") return "Ready to Reach Out";
    if (intent === "medium") return "Needs Human Review";
    return "Ignore";
  }

  function getNegotiationHint(comment: DemoComment) {
    if (comment.intent === "high") {
      return "Reply with pricing, MOQ, lead time, and the fastest path to a sample or supplier call.";
    }

    if (comment.intent === "medium") {
      return "Keep this in review, confirm commercial context, and check whether the request points to an active buying project.";
    }

    return "No follow-up needed unless a later comment adds commercial context.";
  }

  return (
    <div className="leadradar-demo-shell">
      <section className="container">
        <div className="leadradar-hero">
          <div className="leadradar-hero-copy">
            <p className="eyebrow">Illustrative workflow demo</p>
            <h1>LeadRadar: Social Comment Review Demo</h1>
            <p className="hero-description">
              Scroll a sample TikTok-style comment feed, let LeadRadar capture visible comments, and review possible
              B2B buying signals before deciding whether they deserve follow-up.
            </p>
            <div className="leadradar-hero-points" aria-label="LeadRadar quick value points">
              <span>Sample data, no signup</span>
              <span>Demo source: TikTok-style comments</span>
              <span>Human review stays in the loop</span>
            </div>
            <section className="leadradar-keyword-section" aria-label="LeadRadar semantic keyword summary">
              <p>
                <strong>LeadRadar:</strong> a product workflow for preserving visible
                comments, flagging possible commercial signals, and preparing a local review list. It does not automate
                outreach or guarantee leads.
              </p>
            </section>
            <section className="how-it-works-seo" aria-labelledby="how-it-works-seo-title">
              <h3 id="how-it-works-seo-title">How LeadRadar Flags Comments for Review</h3>
              <p>
                This demo reads visible TikTok-style comments and flags context that may deserve human review. Example
                signals include:
              </p>
              <ul className="signal-list">
                <li><strong>Pricing inquiries:</strong> Detecting requests for quotes, catalogs, or price lists.</li>
                <li><strong>MOQ questions:</strong> Identifying potential clients asking about Minimum Order Quantities.</li>
                <li><strong>Supplier search terms:</strong> Finding users actively looking for manufacturing or service partners.</li>
                <li><strong>Shipping requests:</strong> Capturing specific logistics and distribution requirements.</li>
              </ul>
            </section>
            <div className="hero-actions">
              <button type="button" className="button primary" onClick={handleTryDemoClick}>
                Try the workflow
              </button>
              <Link href="/products/leadradar" className="button ghost" prefetch={false}>
                View product page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {demoVisible ? (
        <section className="container leadradar-flow-shell">
          <div className="leadradar-flow-status" aria-label="LeadRadar workflow preview status">
            {stepStates.map((step, index) => (
              <button
                key={step.label}
                type="button"
                className={`leadradar-flow-step${step.done ? " is-done" : ""}${activeStep === step.step ? " is-active" : ""}`}
                onClick={() => handleFlowStepClick(step.step)}
                disabled={step.step === 3 && !reviewUnlocked}
              >
                <span className="leadradar-flow-node">{index + 1}</span>
                <p>{step.label}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {demoVisible && activeStep !== 3 ? (
        <section id="leadradar-demo" className="container" ref={demoSectionRef}>
          <div className="leadradar-workbench">
            {activeStep === 1 || activeStep === 2 ? (
              <div className="form-card leadradar-input-card">
                <span className="eyebrow">Live comment feed</span>
                <h2>1. Scroll the comments. LeadRadar captures the signals.</h2>
                <p className="form-intro">
                  The real plugin does not require manual copy-paste. As you scroll a comment feed, LeadRadar watches visible
                  comments, extracts potential buying signals, and organizes them into a reviewable sidebar.
                </p>
                <div className="leadradar-capture-hint">
                  <strong>{hasScrolledFeed ? "Capture is live." : "Scroll this feed to start live capture."}</strong>
                  <p>
                    {hasScrolledFeed
                      ? "As visible comments enter the viewport, the sidebar on the right classifies and stores them automatically."
                      : "The right-side plugin panel will begin collecting visible comments as soon as you scroll this list."}
                  </p>
                </div>
                <div className="leadradar-feed-preview" aria-label="LeadRadar live comment capture preview">
                  <div className="leadradar-feed-topbar">
                    <span className="leadradar-feed-dot" />
                    <span className="leadradar-feed-dot" />
                    <span className="leadradar-feed-dot" />
                    <p>Sample comment stream</p>
                  </div>
                  <p className="form-feedback">These illustrative comments are sample data, not captured customer leads.</p>
                  <div className="leadradar-feed-list leadradar-feed-list-live" onScroll={handleFeedScroll} ref={feedListRef}>
                    {sampleComments.map((comment, index) => {
                      const isVisible = visibleIndexes.includes(index);
                      const isCaptured = capturedIndexes.includes(index);

                      return (
                        <article
                          key={`${comment.author}-${comment.text}`}
                          className={`leadradar-feed-comment${isVisible ? " is-visible" : ""}${isCaptured ? " is-captured" : ""}`}
                          ref={(node) => {
                            commentRefs.current[index] = node;
                          }}
                        >
                          <div className="leadradar-feed-comment-top">
                            <strong>{comment.author}</strong>
                            {isCaptured ? <span className="leadradar-feed-captured-badge">Captured</span> : null}
                          </div>
                          <p>{comment.text}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className={`leadradar-results-panel${captureStarted ? "" : " is-locked"}`}>
                <div className="section-panel leadradar-summary-panel leadradar-sidebar-panel">
                  <span className="eyebrow">{captureStarted ? "Sidebar live" : "Waiting for scroll"}</span>
                  <div className="section-heading">
                    <h2>2. The plugin sidebar updates while you browse</h2>
                  </div>
                  {captureStarted ? (
                    <>
                      <div className="grid-3 leadradar-summary-grid">
                        <div className="card">
                          <p className="leadradar-summary-label">Strong Intent</p>
                          <h3>{summary.high}</h3>
                        </div>
                        <div className="card">
                          <p className="leadradar-summary-label">Review Queue</p>
                          <h3>{summary.medium}</h3>
                        </div>
                        <div className="card">
                          <p className="leadradar-summary-label">Noise Captured</p>
                          <h3>{summary.low}</h3>
                        </div>
                      </div>
                      <div className="leadradar-sidebar-stream">
                        <div className="leadradar-sidebar-stream-head">
                          <h3>Captured in the sidebar</h3>
                          <span>{sidebarHighIntentComments.length} shown</span>
                        </div>
                        <div className="leadradar-sidebar-list">
                          {sidebarHighIntentComments.map((comment) => (
                            <article key={`${comment.author}-${comment.text}`} className="card leadradar-result-card leadradar-sidebar-card">
                              <div className="leadradar-result-top">
                                <strong>{comment.author}</strong>
                                <ResultBadge intent={comment.intent} />
                              </div>
                              <p className="leadradar-comment-text">{comment.text}</p>
                              <p className="leadradar-reason">{comment.reason}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                      <div className="leadradar-step-actions">
                        <button type="button" className="button primary" onClick={unlockReview}>
                          Review captured leads
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="leadradar-locked-state">
                      <strong>The sidebar starts empty, just like the real plugin.</strong>
                      <p>Scroll the left comment feed and LeadRadar will begin capturing the visible comments automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {reviewUnlocked && activeStep === 3 ? (
        <section className="container" ref={reviewSectionRef}>
          <div className="section-panel leadradar-review-shell">
            <p className="eyebrow">Review view</p>
            <div className="section-heading">
              <h2>3. Review the qualified comments like the real LeadRadar workflow</h2>
            </div>
            <p className="form-intro">
              This view separates likely leads from human-review items. It is designed for quick inspection before export or outreach.
            </p>
            <section className="leadradar-review-toolbar">
              <div className="leadradar-filter-pills" aria-label="LeadRadar review filter">
                <button
                  type="button"
                  className={reviewFilter === "all" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={reviewFilter === "strong" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("strong")}
                >
                  Strong Intent
                </button>
                <button
                  type="button"
                  className={reviewFilter === "review" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("review")}
                >
                  Review Queue
                </button>
              </div>
              <button type="button" className="button ghost" onClick={exportReviewCsv}>
                Export CSV
              </button>
              <p className="form-feedback">Cards are sorted by intent strength so the best follow-up opportunities stay visible first.</p>
            </section>

            <section className="leadradar-review-grid">
              {reviewViewComments.map((comment) => (
                <article key={`${comment.author}-${comment.text}`} className="leadradar-review-card">
                  <div className="leadradar-review-card-top">
                    <div className="leadradar-chip-group">
                      <span className={`leadradar-priority-chip ${getReviewTone(comment.intent)}`}>
                        {getReviewPriorityLabel(comment.intent)}
                      </span>
                      <span className="leadradar-plain-chip">{getDemandTypeLabel(comment)}</span>
                      <span className="leadradar-plain-chip">{getLeadStageLabel(comment.intent)}</span>
                      {comment.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="leadradar-plain-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="leadradar-score-chip">Intent Score {getIntentScore(comment.intent)}</span>
                  </div>

                  <p className="leadradar-review-comment">{comment.text}</p>

                  <div className="leadradar-review-details">
                    <div>
                      <span className="leadradar-detail-label">Lead assessment</span>
                      <strong>{comment.reason}</strong>
                    </div>
                    <div>
                      <span className="leadradar-detail-label">Suggested next step</span>
                      <strong>{getNegotiationHint(comment)}</strong>
                    </div>
                  </div>

                  <div className="leadradar-review-footer">
                    <span>{comment.author}</span>
                    <span>{getDemandTypeLabel(comment)}</span>
                    <span>{comment.tags.length} tags</span>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </section>
      ) : null}

      {reviewUnlocked ? (
        <section className="container">
          <div className="two-column leadradar-feedback-grid">
            <form action={feedbackAction} className="section-panel" ref={feedbackFormRef}>
              <p className="eyebrow">Lightweight feedback</p>
              <h2>4. Tell us if this result was useful</h2>
              <p className="form-intro">
                No account needed. We only want to know whether this kind of signal review is worth building deeper.
              </p>
              <input type="hidden" name="tool_slug" value="leadradar" />
              <input type="hidden" name="source_page" value="/tools/leadradar" />
              <input type="hidden" name="is_useful" value={feedback ?? ""} />
              <div className="leadradar-feedback-actions">
                <button
                  type="button"
                  className={`button ${feedback === "useful" ? "primary" : "ghost"}`}
                  onClick={() => handleFeedback("useful")}
                >
                  This was useful
                </button>
                <button
                  type="button"
                  className={`button ${feedback === "not_useful" ? "primary" : "ghost"}`}
                  onClick={() => handleFeedback("not_useful")}
                >
                  Not useful yet
                </button>
              </div>
              <label className="field">
                <span>What were you originally trying to solve?</span>
                <textarea
                  name="problem_context"
                  rows={5}
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="Example: I wanted to quickly separate casual comments from custom-order questions."
                />
              </label>
              <label className="field">
                <span>Attach the original user screenshot or file (optional)</span>
                <input
                  name="attachment"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    setAttachmentLabel(file?.name ?? "");
                  }}
                />
                {attachmentLabel ? <p className="form-feedback success">Attached: {attachmentLabel}</p> : null}
              </label>
              <button
                type="submit"
                className="button primary"
                disabled={feedbackPending || !feedback || !problem.trim()}
              >
                {feedbackPending ? "Submitting..." : "Send feedback"}
              </button>
              <p className={`form-feedback${feedbackState.success ? " success" : ""}`}>
                {feedbackState.message || "Choose useful / not useful, describe the original problem, and optionally attach context."}
              </p>
            </form>

            <div className="form-card">
              <h3>Continue if you want the full workflow</h3>
              <p className="form-intro">
                After the on-site workflow preview, the next step is the Edge extension flow for live capture, filtering, and export.
              </p>
              <div className="activity-list">
                <div>
                  <strong>Step 1</strong>
                  <p>Use the workflow preview to confirm whether comment filtering is valuable in your real workflow.</p>
                </div>
                <div>
                  <strong>Step 2</strong>
                  <p>Start PayPal checkout, then install from Edge after approval or follow the setup path provided after payment.</p>
                </div>
                <div>
                  <strong>Step 3</strong>
                  <p>Use the paid access path for setup support, access, and release timing.</p>
                </div>
              </div>
              <div className="leadradar-next-actions">
                <Link
                  href="/products/leadradar#subscription"
                  className="button primary"
                  prefetch={false}
                  onClick={() => void sendProductEvent("paypal_access_started")}
                >
                  Continue to PayPal checkout
                </Link>
              </div>
              <p className="form-feedback">Payment opens PayPal checkout immediately.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
