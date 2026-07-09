import type { Resource } from "@/lib/types";

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getResourceLandingPath(resource: Pick<Resource, "landing_page_slug" | "slug">) {
  return `/resources/${resource.landing_page_slug ?? resource.slug}`;
}

export function getResourceDeliveryPath(resource: Pick<Resource, "slug" | "landing_page_slug" | "delivery_mode" | "delivery_url">) {
  if (resource.delivery_mode === "external") {
    return resource.delivery_url && isExternalUrl(resource.delivery_url) ? resource.delivery_url : undefined;
  }

  if (resource.delivery_mode === "file") {
    return `/resources/${resource.slug}/download`;
  }

  if (resource.delivery_url) {
    return resource.delivery_url;
  }

  return `${getResourceLandingPath(resource)}/delivery`;
}

export function getResourceDeliveryLabel(resource: Pick<Resource, "delivery_mode">) {
  switch (resource.delivery_mode) {
    case "file":
      return "Download the file";
    case "external":
      return "Open the hosted page";
    case "page":
    default:
      return "Open the page";
  }
}

export function getResourceDeliveryNote(resource: Pick<Resource, "delivery_mode">) {
  switch (resource.delivery_mode) {
    case "file":
      return "After subscribing, the file will download from a managed route.";
    case "external":
      return "After subscribing, you will be sent straight to the hosted page.";
    case "page":
    default:
      return "After subscribing, you can open the page instantly on the delivery route.";
  }
}
