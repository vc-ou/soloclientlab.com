const leadRadarExtensionUrl = process.env.NEXT_PUBLIC_LEADRADAR_EXTENSION_URL?.trim();

export function getLeadRadarExtensionHref() {
  return leadRadarExtensionUrl || "/waitlist/leadradar-for-tiktok";
}

export function hasLeadRadarExtensionListing() {
  return Boolean(leadRadarExtensionUrl);
}

export function getLeadRadarExtensionCtaLabel() {
  return hasLeadRadarExtensionListing() ? "Install Chrome Extension →" : "Join the early interest list →";
}

export function getLeadRadarExtensionSupportCopy() {
  return hasLeadRadarExtensionListing()
    ? "Available through a private Chrome Web Store link."
    : "Join the list to get access when the private Chrome Web Store link is ready.";
}
