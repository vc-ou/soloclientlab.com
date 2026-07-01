import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { getAnyPostById, getDemandsByIds, getRelatedPosts } from "@/lib/db";

type PostPreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPreviewPage({ params }: PostPreviewPageProps) {
  const { id } = await params;
  const preferLocal = process.env.NODE_ENV !== "production";
  const post = await getAnyPostById(id, { preferLocal, timeoutMs: 1500 });

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.slug, 3, { preferLocal });
  const relatedDemands = await getDemandsByIds(post.related_demand_ids ?? [], { preferLocal });

  return <PostDetail post={post} related={related} relatedDemands={relatedDemands} trackAnalytics={false} />;
}
