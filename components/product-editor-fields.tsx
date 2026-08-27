"use client";

import { useEffect, useState } from "react";
import { slugify, toDateTimeLocalValue } from "@/lib/format";
import type { Product } from "@/lib/types";

const deliveryModeOptions = [
  { value: "presale", label: "预售" },
  { value: "digital_file", label: "数字文件" },
  { value: "extension", label: "扩展程序" },
  { value: "service", label: "服务" },
  { value: "manual_delivery", label: "人工交付" }
] as const;

const developmentStatusOptions = [
  { value: "idea", label: "想法" },
  { value: "presale", label: "预售中" },
  { value: "building", label: "开发中" },
  { value: "ready", label: "已准备好" },
  { value: "paused", label: "暂停" }
] as const;

const productStatusOptions = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" }
] as const;

export function ProductEditorFields({
  product
}: {
  product: Product | null;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(product?.slug));
  const [priceAmount, setPriceAmount] = useState(product ? (product.price_cents / 100).toFixed(2) : "0.00");

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugManuallyEdited]);

  return (
    <>
      <div className="admin-fields-2">
        <label className="field">
          <span>商品名</span>
          <input name="name" value={name} onChange={(event) => setName(event.target.value)} required />
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
          <small className="field-help">默认由商品名生成，必要时可手动修改。</small>
        </label>
        <label className="field">
          <span>落地页地址</span>
          <input
            name="landing_page_url"
            inputMode="url"
            placeholder="https://... 或 /products/..."
            defaultValue={product?.landing_page_url ?? ""}
          />
          <small className="field-help">已做好的独立落地页可直接填这里，公开商品页会显示入口。</small>
        </label>
        <label className="field">
          <span>状态</span>
          <select name="status" defaultValue={product?.status ?? "published"}>
            {productStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>开发阶段</span>
          <select name="development_status" defaultValue={product?.development_status ?? "idea"}>
            {developmentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>交付方式</span>
          <select name="delivery_mode" defaultValue={product?.delivery_mode ?? "presale"}>
            {deliveryModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>价格（美元）</span>
          <input
            name="price_amount"
            inputMode="decimal"
            value={priceAmount}
            onChange={(event) => setPriceAmount(event.target.value)}
            required
          />
          <small className="field-help">用于公开页展示和 PayPal 订单金额。</small>
        </label>
        <label className="field">
          <span>币种</span>
          <input name="currency" defaultValue={product?.currency ?? "USD"} required />
        </label>
        <div className="field">
          <span>支付已启用</span>
          <label className="checkbox-inline">
            <input type="checkbox" name="payment_enabled" defaultChecked={product?.payment_enabled ?? false} />
            <span>启用 PayPal 收款</span>
          </label>
        </div>
        <label className="field">
          <span>发布时间</span>
          <input name="published_at" type="datetime-local" defaultValue={toDateTimeLocalValue(product?.published_at)} />
        </label>
      </div>

      <label className="field">
        <span>简介</span>
        <textarea name="short_description" rows={3} defaultValue={product?.short_description ?? ""} />
      </label>
      <label className="field">
        <span>Hero 标题</span>
        <input name="hero_title" defaultValue={product?.hero_title ?? ""} />
      </label>
      <label className="field">
        <span>Hero 描述</span>
        <textarea name="hero_description" rows={3} defaultValue={product?.hero_description ?? ""} />
      </label>
      <label className="field">
        <span>适合谁</span>
        <textarea name="audience" rows={3} defaultValue={product?.audience ?? ""} />
      </label>
      <label className="field">
        <span>问题</span>
        <textarea name="problem" rows={3} defaultValue={product?.problem ?? ""} />
      </label>
      <label className="field">
        <span>购买承诺</span>
        <textarea name="promise" rows={3} defaultValue={product?.promise ?? ""} />
      </label>
      <label className="field">
        <span>核心卖点</span>
        <textarea
          name="features"
          rows={5}
          defaultValue={product?.features?.map((feature) => `${feature.title}${feature.body ? ` | ${feature.body}` : ""}`).join("\n") ?? ""}
          placeholder={"自动扫描整页评论 | 不需要逐条阅读\n只高亮 A / B 级线索 | 保留上下文和判断理由"}
        />
        <small className="field-help">每行一个卖点；用“标题 | 解释”写两段，公开页会自动排版。</small>
      </label>
      <label className="field">
        <span>SEO 标题</span>
        <input name="seo_title" defaultValue={product?.seo_title ?? ""} />
      </label>
      <label className="field">
        <span>SEO 描述</span>
        <textarea name="seo_description" rows={3} defaultValue={product?.seo_description ?? ""} />
      </label>
    </>
  );
}
