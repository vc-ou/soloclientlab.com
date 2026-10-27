import type { Post } from "@/lib/types";

type CtaCopy = {
  label: string;
  title: string;
  description: string;
};

export type PostCta = CtaCopy & {
  href: string;
};

/**
 * 前台已下线的路径前缀。
 * `/resources/*` 页面已移除，`next.config.ts` 只保留了到 `/research` 的 301，
 * 因此旧的 lead_magnet CTA 需要在这里回落到存活路径，避免死链。
 */
const RETIRED_PREFIXES = ["/resources"];

const CTA_COPY: Record<string, CtaCopy> = {
  waitlist: {
    label: "Request product access",
    title: "Want this as a repeatable workflow?",
    description: "Request access and start with one focused workflow instead of building a system from scratch."
  },
  lead_magnet: {
    label: "Browse practical guides",
    title: "Keep reading",
    description: "Short, practical guides on finding opportunities, organising client work, and deciding what to automate."
  },
  product: {
    label: "View the product",
    title: "See the workflow in practice",
    description: "Open the product page to see how this becomes a repeatable, reviewable process."
  },
  products: {
    label: "Explore the tools",
    title: "Want a repeatable way to run this?",
    description: "Small, focused tools for finding demand signals and organising client work. No bloated setup."
  },
  newsletter: {
    label: "Get new guides by email",
    title: "Get the next guide",
    description: "One practical email when a new guide is published. No sequence, no upsell."
  }
};

const RETIRED_COPY: CtaCopy = {
  label: "Browse practical guides",
  title: "Keep reading",
  description: "The original resource page has moved. The guide index lists everything currently available."
};

const FALLBACK_COPY: CtaCopy = {
  label: "Continue",
  title: "Next step",
  description: "Keep going with the next practical guide."
};

/** 只接受站内绝对路径，避免 `//evil.com` 这类开放跳转。 */
function isSafeInternalHref(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function isRetiredTarget(value: string) {
  return RETIRED_PREFIXES.some((prefix) => value === prefix || value.startsWith(`${prefix}/`));
}

/**
 * 把 `posts.cta_type` / `posts.cta_target` 解析成可直接渲染的 CTA。
 * 返回 `null` 表示这篇文章不该有 CTA（未配置或配置非法）。
 */
export function resolvePostCta(post: Pick<Post, "cta_type" | "cta_target">): PostCta | null {
  const rawTarget = post.cta_target?.trim();

  if (!rawTarget || !isSafeInternalHref(rawTarget)) {
    return null;
  }

  if (isRetiredTarget(rawTarget)) {
    return { href: "/research", ...RETIRED_COPY };
  }

  const type = post.cta_type?.trim();
  const copy = (type && CTA_COPY[type]) || FALLBACK_COPY;

  return { href: rawTarget, ...copy };
}
