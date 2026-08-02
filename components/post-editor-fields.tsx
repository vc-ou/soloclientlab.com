"use client";

import { useEffect, useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { topicOptions } from "@/lib/content";
import { slugify, toDateTimeLocalValue } from "@/lib/format";
import type { Post } from "@/lib/types";

export function PostEditorFields({
  post,
  posts
}: {
  post: Post | null;
  posts: Post[];
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(post?.slug));
  const linkablePosts = posts
    .filter((item) => item.status === "published" && item.slug !== post?.slug)
    .map((item) => ({ title: item.title, slug: item.slug }));

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  return (
    <>
      <div className="admin-fields-2">
        <label className="field">
          <span>Title</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Slug</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugManuallyEdited(true);
              setSlug(event.target.value);
            }}
            required
          />
          <small className="field-help">Generated from the title until you edit it manually.</small>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={post?.status ?? "draft"}>
            {["draft", "published", "archived"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Topic / category</span>
          <select name="topic_tag" defaultValue={post?.topic_tag ?? "manufacturing_social_lead_discovery"}>
            {topicOptions.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Published at</span>
          <input
            name="published_at"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(post?.published_at)}
          />
          <small className="field-help">Leave blank to use the publish time automatically.</small>
        </label>
        <label className="field">
          <span>SEO title</span>
          <input name="seo_title" defaultValue={post?.seo_title ?? ""} />
        </label>
        <label className="field">
          <span>Read time</span>
          <input name="read_time" defaultValue={post?.read_time ?? ""} />
        </label>
      </div>
      <label className="field">
        <span>Summary</span>
        <textarea name="summary" rows={3} defaultValue={post?.summary ?? ""} />
      </label>
      <label className="field">
        <span>Cover image URL</span>
        <input name="cover_image_url" type="url" defaultValue={post?.cover_image_url ?? ""} placeholder="https://..." />
        <small className="field-help">Optional. Stored for social sharing; Research cards stay text-first.</small>
      </label>
      <label className="field">
        <span>SEO description</span>
        <textarea name="seo_description" rows={3} defaultValue={post?.seo_description ?? ""} />
      </label>
      <MarkdownEditor name="content" initialValue={post?.content ?? ""} linkablePosts={linkablePosts} />
    </>
  );
}
