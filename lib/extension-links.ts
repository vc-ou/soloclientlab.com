const leadRadarExtensionUrl = process.env.NEXT_PUBLIC_LEADRADAR_EXTENSION_URL?.trim();
const leadRadarEdgeAddonsUrl = process.env.NEXT_PUBLIC_LEADRADAR_EDGE_ADDONS_URL?.trim();
const leadRadarChromeWebStoreUrl = process.env.NEXT_PUBLIC_LEADRADAR_CHROME_WEBSTORE_URL?.trim();
const leadRadarTrialPackageUrl = process.env.NEXT_PUBLIC_LEADRADAR_TRIAL_PACKAGE_URL?.trim();

function firstConfiguredUrl(...urls: Array<string | undefined>) {
  return urls.find((url) => Boolean(url)) ?? "";
}

const publicTrialUrl = firstConfiguredUrl(
  leadRadarEdgeAddonsUrl,
  leadRadarTrialPackageUrl,
  leadRadarChromeWebStoreUrl,
  leadRadarExtensionUrl
);

export function hasLeadRadarEdgeAddonsListing() {
  return Boolean(leadRadarEdgeAddonsUrl);
}

export function getLeadRadarExtensionHref() {
  return publicTrialUrl || "/products/leadradar#product-access";
}

export function hasLeadRadarExtensionListing() {
  return Boolean(publicTrialUrl);
}

export function getLeadRadarExtensionCtaLabel() {
  if (leadRadarEdgeAddonsUrl) return "Install from Microsoft Edge Add-ons";
  if (leadRadarTrialPackageUrl) return "Request product access";
  if (leadRadarChromeWebStoreUrl || leadRadarExtensionUrl) return "Request product access";
  return "Request product access";
}

export function getLeadRadarExtensionSupportCopy() {
  if (leadRadarEdgeAddonsUrl) return "Public self-serve trial through Microsoft Edge Add-ons.";
  return "Microsoft Edge Add-ons submission is currently under review. Public installation opens after approval; product access requests are open now.";
}

export function getLeadRadarPublicTrialChannel() {
  if (leadRadarEdgeAddonsUrl) return "Edge Add-ons";
  return "Edge Add-ons under review";
}

export function getLeadRadarPartnerPreviewHref() {
  return "/products/leadradar#partner-preview";
}
