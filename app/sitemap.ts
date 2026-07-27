import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";
const staticLastModified = {
  home: "2026-07-27",
  research: "2026-07-27",
  leadRadar: "2026-07-27",
  about: "2026-07-27",
  privacy: "2026-07-10",
  terms: "2026-07-10"
} as const;

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublicPosts();

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

  return [...staticPages, ...postPages];
}
