"use client";

import type { ActionState } from "@/lib/types";

/**
 * LeadRadar 演示页的静态数据与纯辅助函数。
 * 拆分自原 components/leadradar-demo.tsx（788 行），逻辑未改。
 */

export type DemoComment = {
  author: string;
  text: string;
  intent: "high" | "medium" | "low";
  reason: string;
  tags: string[];
};

export type ReviewFilter = "all" | "strong" | "review";
export type DemoStep = 1 | 2 | 3;

export const initialFeedbackState: ActionState = {
  success: false,
  message: ""
};

export function comment(
  author: string,
  text: string,
  intent: DemoComment["intent"],
  reason: string,
  tags: string[]
): DemoComment {
  return { author, text, intent, reason, tags };
}

export const sampleComments: DemoComment[] = [
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

export const flowSteps = [
  "Scroll the comments",
  "Sidebar capture live",
  "Review qualified leads"
] as const;

export function arraysMatch(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function trackLeadRadarDemoClick() {
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

export function ResultBadge({ intent }: { intent: DemoComment["intent"] }) {
  const labelMap = {
    high: "HIGH intent",
    medium: "REVIEW",
    low: "NON-LEAD"
  } satisfies Record<DemoComment["intent"], string>;

  return <span className={`leadradar-intent leadradar-intent-${intent}`}>{labelMap[intent]}</span>;
}
