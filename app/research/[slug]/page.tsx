import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { getPostBySlug, getRelatedPosts } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.summary,
    alternates: {
      canonical: `/research/${post.slug}`
    },
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.summary,
      url: `${siteUrl}/research/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined
    },
    twitter: {
      card: "summary",
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.summary,
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
    description: post.seo_description ?? post.summary,
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
