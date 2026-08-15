import { ProductEventLink } from "@/components/product-events";
import {
  getLeadRadarExtensionCtaLabel,
  getLeadRadarExtensionHref,
  getNeedRadarExtensionCtaLabel,
  getNeedRadarExtensionHref,
  hasLeadRadarEdgeAddonsListing,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";
import type { ProductSlug } from "@/lib/types";
import type { ReactNode } from "react";

type ExtensionInstallLinkProps = {
  productSlug?: ProductSlug;
  sourcePage: string;
  className?: string;
  children?: ReactNode;
};

function getInstallLinkConfig(productSlug: ProductSlug) {
  if (productSlug === "needradar-workflow-lab") {
    return {
      href: getNeedRadarExtensionHref(),
      label: getNeedRadarExtensionCtaLabel(),
      isLive: hasNeedRadarEdgeAddonsListing()
    };
  }

  return {
    href: getLeadRadarExtensionHref(),
    label: getLeadRadarExtensionCtaLabel(),
    isLive: hasLeadRadarEdgeAddonsListing()
  };
}

export function ExtensionInstallLink({
  productSlug = "leadradar",
  sourcePage,
  className = "button primary",
  children
}: ExtensionInstallLinkProps) {
  const { href, label, isLive } = getInstallLinkConfig(productSlug);
  const separator = href.includes("?") ? "&" : "?";
  const trackedHref = isLive
    ? `${href}${separator}utm_source=soloclientlab&utm_medium=product_page&utm_campaign=${encodeURIComponent(sourcePage)}`
    : href;

  return (
    <ProductEventLink
      href={trackedHref}
      eventType={isLive ? "install_clicked" : "trial_access_click"}
      productSlug={productSlug}
      className={className}
    >
      {children ?? label}
    </ProductEventLink>
  );
}
