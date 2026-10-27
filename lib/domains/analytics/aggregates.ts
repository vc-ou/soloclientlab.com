/**
 * analytics 域 · 跨域只读聚合（例外 E-003：可依赖 leads/commerce 的读接口）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { getLeadRadarConfigs, getProductAccessRequests, getProductTrials } from "@/lib/domains/leads";
import { getProductEntitlements, getProductPayments } from "@/lib/domains/commerce";
import { getTrialEvents } from "./service";
import type {
  TrialEvent
} from "@/lib/types";
export async function getProductAdminMetrics() {
  const [accessRequests, trials, configs, events, payments, entitlements] = await Promise.all([
    getProductAccessRequests(),
    getProductTrials(),
    getLeadRadarConfigs(),
    getTrialEvents(),
    getProductPayments(),
    getProductEntitlements()
  ]);

  const eventCount = (eventType: TrialEvent["event_type"]) => events.filter((event) => event.event_type === eventType).length;
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const paidRevenueCents = paidPayments.reduce((total, payment) => total + (payment.amount_total ?? 0), 0);

  return {
    accessRequests: accessRequests.length,
    activeTrials: trials.filter((trial) => trial.status === "active" || trial.status === "requested").length,
    paidPayments: paidPayments.length,
    paidRevenueCents,
    activeEntitlements: entitlements.filter((entitlement) => entitlement.status === "active").length,
    completedConfigs: configs.filter((config) => config.status === "completed").length,
    productPageVisits: eventCount("product_page_visit"),
    trialAccessRequested: eventCount("trial_access_requested"),
    paypalAccessStarted: eventCount("paypal_access_started"),
    partnerPreviewRequested: eventCount("partner_preview_requested"),
    installClicked: eventCount("install_clicked"),
    configStarted: eventCount("radar_config_started"),
    configCompleted: eventCount("radar_config_completed"),
    keywordsAdded: eventCount("keywords_added"),
    reviewCompleted: eventCount("review_completed"),
    csvExported: eventCount("csv_exported"),
    calibrationFeedbackSubmitted: eventCount("calibration_feedback_submitted"),
    paidPilotRequested: eventCount("paid_pilot_requested"),
    latestEvents: events.slice(0, 12)
  };
}
