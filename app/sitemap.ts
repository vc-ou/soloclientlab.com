import type { MetadataRoute } from "next";
import { getPublicPosts, getPublicProducts } from "@/lib/db";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, products] = await Promise.all([getPublicPosts(), getPublicProducts()]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: staticLastModified.home,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/research`,
      lastModified: staticLastModified.research,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/products`,
      lastModified: staticLastModified.products,
      changeFrequency: "weekly",
      priority: 0.95
    },
    {
      url: `${siteUrl}/tools/leadradar`,
      lastModified: staticLastModified.leadRadar,
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
