"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { topicOptions } from "@/lib/content";
import { labelForTopic, slugify, toDateTimeLocalValue } from "@/lib/format";
import type { Demand, Post } from "@/lib/types";

const ctaTargetPresets = {
  newsletter: "",
  lead_magnet: "/resources/client-acquisition-report#resource-form",
  waitlist: "/waitlist/client-acquisition-ai-workflow",
  none: ""
} as const;

type CtaType = keyof typeof ctaTargetPresets;

export function PostEditorFields({
  post,
  demands,
  posts
}: {
  post: Post | null;
  demands: Demand[];
  posts: Post[];
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [ctaType, setCtaType] = useState<CtaType>((post?.cta_type ?? "none") as CtaType);
  const [ctaTarget, setCtaTarget] = useState(post?.cta_target ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(post?.slug));
  const previousPresetRef = useRef(ctaTargetPresets[ctaType]);
  const selectedDemandIds = new Set(post?.related_demand_ids ?? []);
  const linkablePosts = posts
    .filter((item) => item.status === "published" && item.slug !== post?.slug)
    .map((item) => ({ title: item.title, slug: item.slug }));

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  useEffect(() => {
    const nextPreset = ctaTargetPresets[ctaType];
    if (!ctaTarget || ctaTarget === previousPresetRef.current) {
      setCtaTarget(nextPreset);
    }
    previousPresetRef.current = nextPreset;
  }, [ctaTarget, ctaType]);

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
          <span>Topic tag</span>
          <select name="topic_tag" defaultValue={post?.topic_tag ?? "client_acquisition"}>
            {topicOptions.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>CTA type</span>
          <select
            name="cta_type"
            value={ctaType}
            onChange={(event) => setCtaType(event.target.value as CtaType)}
          >
            {["newsletter", "lead_magnet", "waitlist", "none"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <small className="field-help">Newsletter shows the inline signup form, lead magnet points to the secondary updates page, and waitlist links to the validation page.</small>
        </label>
        <label className="field">
          <span>CTA target</span>
          <input
            name="cta_target"
            value={ctaTarget}
            onChange={(event) => setCtaTarget(event.target.value)}
          />
          <small className="field-help">Recommended target updates automatically when the CTA type changes.</small>
        </label>
        <label className="field">
          <span>Related persona</span>
          <input name="related_persona" defaultValue={post?.related_persona ?? ""} />
        </label>
        <label className="field">
          <span>Hero label</span>
          <input name="hero_label" defaultValue={post?.hero_label ?? "Research"} placeholder="Research" />
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
        <span>SEO description</span>
        <textarea name="seo_description" rows={3} defaultValue={post?.seo_description ?? ""} />
      </label>
      <section className="admin-card">
        <div className="demand-picker-header">
          <div>
            <h2>Cover image</h2>
            <p>Upload the image shown on research cards and at the top of the article page.</p>
          </div>
        </div>
        <input type="hidden" name="existing_cover_image_url" value={post?.cover_image_url ?? ""} />
        {post?.cover_image_url ? (
          <div className="admin-image-preview">
            <img src={post.cover_image_url} alt={post.title} />
          </div>
        ) : null}
        <label className="field">
          <span>Upload image</span>
          <input name="cover_image" type="file" accept="image/*" />
          <small className="field-help">Recommended: wide landscape image, at least 1200px wide.</small>
        </label>
        {post?.cover_image_url ? (
          <label className="checkbox-field">
            <input type="checkbox" name="remove_cover_image" />
            <span>Remove current cover image</span>
          </label>
        ) : null}
      </section>
      <section className="admin-card demand-picker">
        <div className="demand-picker-header">
          <div>
            <h2>Related demands</h2>
            <p>Pick the demand records this post should reference in the evidence section.</p>
          </div>
          <span className="admin-pill">{selectedDemandIds.size} selected</span>
        </div>
        <div className="demand-picker-list">
          {demands.map((demand) => (
            <label key={demand.id} className="demand-option">
              <input
                type="checkbox"
                name="related_demand_ids"
                value={demand.id}
                defaultChecked={selectedDemandIds.has(demand.id)}
              />
              <div>
                <strong>{demand.title}</strong>
                <p>{labelForTopic(demand.topic_tag)} · {demand.status} · {demand.persona ?? "Unknown persona"}</p>
              </div>
            </label>
          ))}
        </div>
      </section>
      <MarkdownEditor name="content" initialValue={post?.content ?? ""} linkablePosts={linkablePosts} />
    </>
  );
}
