import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { getDemandsByIds, getPostBySlug, getRelatedPosts } from "@/lib/db";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preferLocal = process.env.NODE_ENV !== "production";
  const post = await getPostBySlug(slug, { preferLocal });

  if (!post) {
    return {};
  }

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.summary
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const preferLocal = process.env.NODE_ENV !== "production";
  const post = await getPostBySlug(slug, { preferLocal });

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.slug, 3, { preferLocal });
  const relatedDemands = await getDemandsByIds(post.related_demand_ids ?? [], { preferLocal });
  return <PostDetail post={post} related={related} relatedDemands={relatedDemands} />;
}
