"use client";

import { useState } from "react";
import Link from "next/link";
import { SimpleTable } from "@/components/admin";
import { PostRowActions } from "@/components/post-row-actions";
import { formatAdminLabel } from "@/lib/admin-labels";
import type { Post } from "@/lib/types";

export function AdminPostsTable({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);

  return (
    <SimpleTable
      headers={["标题", "Slug", "状态", "主题", "SEO", "发布时间", "操作"]}
      rows={posts.map((post) => [
        <Link key={post.id} href={`/admin/posts/${post.id}`}>
          {post.title}
        </Link>,
        post.slug,
        formatAdminLabel(post.status),
        post.topic_tag ?? "—",
        post.seo_title || post.seo_description ? "已填写" : "待补充",
        post.published_at?.slice(0, 10) ?? "—",
        <PostRowActions
          key={`${post.id}-actions`}
          postId={post.id}
          postSlug={post.slug}
          onDeleteSuccess={(deletedPostId) => {
            setPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost.id !== deletedPostId));
          }}
        />
      ])}
    />
  );
}
