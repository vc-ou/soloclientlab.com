import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/domains/content";
import { getPublicProducts } from "@/lib/domains/catalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";
const staticLastModified = {
  home: "2026-07-27",
  research: "2026-07-27",
  products: "2026-07-30",
  leadRadarProduct: "2026-07-31",
  needRadarWorkflowLab: "2026-07-31",
  leadRadar: "2026-07-27",
  about: "2026-07-27",
  privacy: "2026-07-10",
  terms: "2026-07-10"
} as const;

export const revalidate = 300;

/** 只取日期部分，避免 "2026-11-05" 与 "2026-11-05T10:00:00Z" 混排时比较失真。 */
function toDateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : null;
}

/** 取一组日期里最新的一个，全部为空时回落到 fallback。 */
function latestDateOnly(values: Array<string | null | undefined>, fallback: string) {
  const dates = values.map(toDateOnly).filter((value): value is string => Boolean(value));

  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : fallback;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, products] = await Promise.all([getPublicPosts(), getPublicProducts()]);

  // lastmod 必须反映真实最后修改时间：写死的日期会让 Google 逐渐不信任整份 sitemap。
  const researchLastModified = latestDateOnly(
    posts.map((post) => post.updated_at ?? post.published_at),
    staticLastModified.research
  );
  const productsLastModified = latestDateOnly(
    products.map((product) => product.updated_at ?? product.published_at),
    staticLastModified.products
  );
  const siteLastModified = latestDateOnly(
    [researchLastModified, productsLastModified],
    staticLastModified.home
  );
  const leadRadarLastModified = latestDateOnly(
    products.filter((product) => product.slug === "leadradar").map((product) => product.updated_at ?? product.published_at),
    productsLastModified
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: siteLastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/research`,
      lastModified: researchLastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/products`,
      lastModified: productsLastModified,
      changeFrequency: "weekly",
      priority: 0.95
    },
    {
      url: `${siteUrl}/tools/leadradar`,
      lastModified: leadRadarLastModified,
      changeFrequency: "weekly",
      priority: 0.95
    },
    {
      url: `${siteUrl}/about`,
      lastModified: staticLastModified.about,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: staticLastModified.privacy,
      changeFrequency: "yearly",
      priority: 0.2
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: staticLastModified.terms,
      changeFrequency: "yearly",
      priority: 0.2
    }
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/research/${post.slug}`,
    lastModified: post.updated_at ?? post.published_at ?? new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.8
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: product.updated_at ?? product.published_at ?? new Date().toISOString(),
    changeFrequency: "weekly",
    priority: product.slug === "leadradar" ? 0.95 : 0.8
  }));

  return [...staticPages, ...productPages, ...postPages];
}
