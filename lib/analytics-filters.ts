import { ANALYTICS_DISABLED_COOKIE } from "@/lib/analytics-preferences";
import { getVisitorIp, isIgnoredVisitorIp } from "@/lib/visitor-ip";
import type { ProductTrial, TrialEvent } from "@/lib/types";

const DEFAULT_INTERNAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
const DEFAULT_INTERNAL_MARKERS = ["codex-test"];

type TrialEventLike = Pick<TrialEvent, "email" | "path" | "referrer" | "source_page" | "metadata">;
type TrialLike = Pick<ProductTrial, "email" | "source_page">;

function listFromEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizedListFromEnv(name: string) {
  return listFromEnv(name).map((value) => value.toLowerCase());
}

function getInternalEmails() {
  return normalizedListFromEnv("INTERNAL_ANALYTICS_EMAILS");
}

function getInternalHosts() {
  return [...DEFAULT_INTERNAL_HOSTS, ...normalizedListFromEnv("INTERNAL_ANALYTICS_HOSTS")];
}

function getInternalMarkers() {
  return [...DEFAULT_INTERNAL_MARKERS, ...normalizedListFromEnv("INTERNAL_ANALYTICS_REFERRERS")];
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function isInternalHost(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  return getInternalHosts().some((host) => normalizeHostname(host) === normalizedHostname);
}

function isInternalUrlOrMarker(value?: string) {
  if (!value) return false;

  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) return false;

  if (getInternalMarkers().some((marker) => normalizedValue === marker || normalizedValue.includes(marker))) {
    return true;
  }

  try {
    return isInternalHost(new URL(normalizedValue).hostname);
  } catch {
    return getInternalHosts().some((host) => normalizedValue.includes(host));
  }
}

function hasInternalEmail(email?: string) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return Boolean(normalizedEmail) && getInternalEmails().includes(normalizedEmail);
}

function hasInternalMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return false;
  return metadata.test === true || metadata.internal === true;
}

export function isAnalyticsDisabledBrowser(cookieHeader?: string | null) {
  return cookieHeader?.includes(`${ANALYTICS_DISABLED_COOKIE}=1`) ?? false;
}

export function isInternalAnalyticsRequest(request: Request, input: TrialEventLike) {
  const requestUrl = new URL(request.url);
  const visitorIp = getVisitorIp(request.headers);

  return (
    isInternalHost(requestUrl.hostname) ||
    isAnalyticsDisabledBrowser(request.headers.get("cookie")) ||
    isIgnoredVisitorIp(visitorIp) ||
    isInternalTrialEvent(input)
  );
}

export function isInternalTrialEvent(event: TrialEventLike) {
  return (
    hasInternalEmail(event.email) ||
    isInternalUrlOrMarker(event.path) ||
    isInternalUrlOrMarker(event.referrer) ||
    isInternalUrlOrMarker(event.source_page) ||
    hasInternalMetadata(event.metadata)
  );
}

export function isInternalProductTrial(trial: TrialLike) {
  return hasInternalEmail(trial.email) || isInternalUrlOrMarker(trial.source_page);
}
