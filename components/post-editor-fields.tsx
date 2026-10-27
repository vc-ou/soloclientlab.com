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
          <span>标题</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Slug（网址标识）</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugManuallyEdited(true);
              setSlug(event.target.value);
            }}
            required
          />
          <small className="field-help">默认由标题生成，直到你手动修改为止。</small>
        </label>
        <label className="field">
          <span>状态</span>
          <select name="status" defaultValue={post?.status ?? "draft"}>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <label className="field">
          <span>主题 / 分类</span>
          <select name="topic_tag" defaultValue={post?.topic_tag ?? "manufacturing_social_lead_discovery"}>
            {topicOptions.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>发布时间</span>
          <input
            name="published_at"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(post?.published_at)}
          />
          <small className="field-help">留空则自动使用发布时间。</small>
        </label>
        <label className="field">
          <span>SEO 标题</span>
          <input name="seo_title" defaultValue={post?.seo_title ?? ""} />
        </label>
        <label className="field">
          <span>阅读时长</span>
          <input name="read_time" defaultValue={post?.read_time ?? ""} />
        </label>
      </div>
      <label className="field">
        <span>摘要</span>
        <textarea name="summary" rows={3} defaultValue={post?.summary ?? ""} />
      </label>
      <label className="field">
        <span>封面图片 URL</span>
        <input name="cover_image_url" type="url" defaultValue={post?.cover_image_url ?? ""} placeholder="https://..." />
        <small className="field-help">可选。用于社交分享；研究卡片仍以文字为主。</small>
      </label>
      <label className="field">
        <span>SEO 描述</span>
        <textarea name="seo_description" rows={3} defaultValue={post?.seo_description ?? ""} />
      </label>
      <div className="admin-fields-2">
        <label className="field">
          <span>文末 CTA 类型</span>
          <select name="cta_type" defaultValue={post?.cta_type ?? ""}>
            <option value="">不显示 CTA</option>
            <option value="waitlist">产品访问（waitlist）</option>
            <option value="lead_magnet">资料 / 指南（lead_magnet）</option>
            <option value="product">商品页（product）</option>
            <option value="newsletter">邮件订阅（newsletter）</option>
          </select>
          <small className="field-help">渲染在正文之后、FAQ 之前。</small>
        </label>
        <label className="field">
          <span>文末 CTA 链接</span>
          <input name="cta_target" defaultValue={post?.cta_target ?? ""} placeholder="/products/leadradar" />
          <small className="field-help">
            只接受站内路径（以 / 开头）。/resources/* 已下线，会自动回落到 /research。
          </small>
        </label>
      </div>
      <label className="field">
        <span>FAQ（JSON 数组，用于 Google 富摘要）</span>
        <textarea
          name="faq"
          rows={6}
          defaultValue={post?.faq ? JSON.stringify(post.faq, null, 2) : ""}
          placeholder='[{"question":"问题","answer":"回答"}]'
        />
        <small className="field-help">
          {'可选。格式：[{"question":"问题","answer":"回答"}]。留空则不生成 FAQPage 结构化数据。'}
        </small>
      </label>
      <MarkdownEditor name="content" initialValue={post?.content ?? ""} linkablePosts={linkablePosts} />
    </>
  );
}
