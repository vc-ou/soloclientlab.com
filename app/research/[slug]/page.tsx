import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { getPostBySlug, getPublicPosts, getRelatedPosts } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";

export const revalidate = 300;
export const dynamicParams = false;

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

export async function generateStaticParams() {
  const posts = await getPublicPosts();

  return posts.map((post) => ({
    slug: post.slug
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const title = post.seo_title ?? post.title;
  const description = getSeoDescription(post);
  const image = post.cover_image_url ?? `/research/${post.slug}/opengraph-image`;

  return {
    title,
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
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
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
  const articleImage = post.cover_image_url ?? `${siteUrl}/research/${post.slug}/opengraph-image`;

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
    image: articleImage
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
