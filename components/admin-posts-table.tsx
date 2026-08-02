"use client";

import { useState } from "react";
import Link from "next/link";
import { SimpleTable } from "@/components/admin";
import { PostRowActions } from "@/components/post-row-actions";
import type { Post } from "@/lib/types";

export function AdminPostsTable({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);

  return (
    <SimpleTable
      headers={["Title", "Slug", "Status", "Topic", "SEO", "Published", "Actions"]}
      rows={posts.map((post) => [
        <Link key={post.id} href={`/admin/posts/${post.id}`}>
          {post.title}
        </Link>,
        post.slug,
        post.status,
        post.topic_tag ?? "—",
        post.seo_title || post.seo_description ? "Ready" : "Needs SEO",
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
