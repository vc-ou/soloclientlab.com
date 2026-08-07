import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { getPostBySlug, getRelatedPosts } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";
const titleSuffix = " | SoloClientLab.com";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

function getSeoDescription(post: { seo_description?: string | null; summary?: string; title: string }) {
  const description =
    post.seo_description?.trim() ||
    post.summary?.trim() ||
    `Practical guide: ${post.title}.`;

  if (description.length >= 120) {
    return description;
  }

  return `${description} Includes practical examples and next steps for consultants, freelancers, and solo service businesses.`;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const title = post.seo_title ?? post.title;
  const description = getSeoDescription(post);

  return {
    title: title.length + titleSuffix.length > 70 ? { absolute: title } : title,
    description,
    alternates: {
      canonical: `/research/${post.slug}`
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/research/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined
    }
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.slug, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}/research/${post.slug}#article`,
    mainEntityOfPage: `${siteUrl}/research/${post.slug}`,
    headline: post.title,
    description: getSeoDescription(post),
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    author: {
      "@type": "Organization",
      name: "SoloClientLab.com",
      url: siteUrl
    },
    publisher: {
      "@id": `${siteUrl}/#organization`
    },
    image: post.cover_image_url
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <PostDetail post={post} related={related} />
    </>
  );
}
