import Link from "next/link";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { TrackProductPageView } from "@/components/product-events";
import type { Product } from "@/lib/types";

function formatUsd(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDevelopmentStatus(status: Product["development_status"]) {
  const labels: Record<Product["development_status"], string> = {
    idea: "概念阶段",
    presale: "预售中",
    building: "开发中",
    ready: "ready",
    paused: "暂缓"
  };

  return labels[status];
}

function formatDeliveryMode(mode: Product["delivery_mode"]) {
  const labels: Record<Product["delivery_mode"], string> = {
    presale: "预售交付",
    digital_file: "数字文件",
    extension: "浏览器扩展",
    service: "服务交付",
    manual_delivery: "人工交付"
  };

  return labels[mode];
}

function getProductCategory(product: Product) {
  return product.slug === "leadradar" ? "团队协作工具" : "需求研究工具";
}

function getFeatureItems(product: Product) {
  if (product.slug === "leadradar") {
    return [
      ["⌾", "精准识别", "基于制造业高价值信号，识别采购、询价、定制等意愿"],
      ["⌘", "工作流管理", "线索自动归类与打分，团队协作跟进更高效"],
      ["◇", "安全合规", "仅采集公开内容，不自动爬取，守护平台规则"],
      ["ϟ", "快速上手", "浏览器扩展安装即用，几分钟开始捕获线索"]
    ];
  }

  return [
    ["⌾", "集中整理", "把评论、搜索词和一线记录放在一个可复用的工作流里"],
    ["⌘", "需求聚类", "更快发现重复问题、紧急需求和潜在付费场景"],
    ["◇", "保留上下文", "保留原始语言和来源，方便回到真实场景继续判断"],
    ["ϟ", "轻量验证", "从一个研究问题开始，不需要先搭建复杂系统"]
  ];
}

function getBenefits(product: Product) {
  const name = product.name.split("（")[0];

  return [
    [`${name} 访问权`, "购买后获得完整访问权限，立即开始使用。"],
    ["安装路径", "包含浏览器扩展安装包及详细安装指南。"],
    ["许可证", "个人或团队使用许可证，支持多设备使用。"],
    ["后续更新", "产品更新与功能迭代，持续优化使用体验。"]
  ];
}

function ProductWindow({ product }: { product: Product }) {
  const isLeadRadar = product.slug === "leadradar";
  const rows = isLeadRadar
    ? [
        ["Looking for a CNC supplier", "who can handle small batch...", "MOQ", "85"],
        ["Need a quote for aluminum", "parts, about 100pcs", "询价", "78"],
        ["Can you do 5-axis machining", "for titanium?", "五轴加工", "92"],
        ["Looking for custom parts", "manufacturer", "定制", "80"]
      ]
    : [
        ["Need a better way to cluster", "research notes from Reddit", "聚类", "88"],
        ["How do I compare repeated", "customer problems?", "需求", "82"],
        ["Looking for a lightweight", "validation workflow", "验证", "76"],
        ["Can I turn comments into", "a usable research brief?", "研究", "91"]
      ];

  return (
    <div className={`product-detail-window${isLeadRadar ? "" : " is-needradar"}`} aria-label={`${product.name} preview`}>
      <div className="product-detail-window-top">
        <span className="product-detail-window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="product-detail-window-title">{isLeadRadar ? "LeadRadar" : "NeedRadar"}</span>
        <span className="product-detail-window-action">New leads</span>
      </div>
      <div className="product-detail-window-body">
        <aside className="product-detail-window-sidebar" aria-hidden="true">
          <span>⌂</span>
          <span>▤</span>
          <span className="is-active">▣</span>
          <span>◷</span>
        </aside>
        <div className="product-detail-window-content">
          <div className="product-detail-search">⌕ <span>{isLeadRadar ? "Public intent" : "Research queue"}</span></div>
          <div className="product-detail-lead-list">
            {rows.map(([title, detail, tag, score]) => (
              <div className="product-detail-lead-row" key={title}>
                <span className="product-detail-avatar" aria-hidden="true">●</span>
                <div>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
                <em>{tag}</em>
                <b>{score}</b>
              </div>
            ))}
          </div>
          <div className="product-detail-window-stats">
            <div><span>今日线索</span><strong>128</strong></div>
            <div><span>高意向</span><strong>32</strong></div>
            <div><span>待跟进</span><strong>18</strong></div>
            <div><span>已转化</span><strong>5</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPage({ product }: { product: Product }) {
  const isPresale = product.delivery_mode === "presale";
  const price = formatUsd(product.price_cents, product.currency);
  const featureItems = getFeatureItems(product);
  const benefits = getBenefits(product);

  return (
    <div className="product-detail-page">
      <TrackProductPageView productSlug={product.slug} />

      <section className="container product-detail-hero">
        <Link href="/products" className="product-detail-back">← 返回工具网</Link>
        <div className="product-detail-hero-grid">
          <div className="product-detail-hero-copy">
            <span className="product-detail-category">{getProductCategory(product)}</span>
            <h1>{product.hero_title ?? product.name}</h1>
            <p>{product.hero_description ?? product.short_description ?? product.promise ?? ""}</p>
            <div className="product-detail-actions">
              {product.payment_enabled ? (
                <PayPalCheckoutButton productSlug={product.slug} sourcePage={`/products/${product.slug}#hero`}>
                  立即购买 {price}
                </PayPalCheckoutButton>
              ) : null}
              <Link href={product.slug === "leadradar" ? "/tools/leadradar" : "/products"} className="button ghost">
                <span aria-hidden="true">▷</span> {product.slug === "leadradar" ? "查看演示视频" : "返回工具网"}
              </Link>
            </div>
          </div>
          <ProductWindow product={product} />
        </div>
      </section>

      <section className="container product-detail-features" aria-label="产品特点">
        {featureItems.map(([icon, title, body]) => (
          <div className="product-detail-feature" key={title}>
            <span className="product-detail-feature-icon" aria-hidden="true">{icon}</span>
            <div>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="container product-detail-info-grid">
        <div className="product-detail-card">
          <h2>产品信息</h2>
          <dl className="product-detail-table">
            <div><dt>价格</dt><dd>{price}</dd></div>
            <div><dt>开发阶段</dt><dd>{formatDevelopmentStatus(product.development_status)}</dd></div>
            <div><dt>交付方式</dt><dd>{formatDeliveryMode(product.delivery_mode)}</dd></div>
            <div><dt>适合谁</dt><dd>{product.audience ?? "适合希望把重复工作变得更清晰的独立工作者和小团队。"}</dd></div>
            <div><dt>解决什么问题</dt><dd>{product.problem ?? product.short_description ?? "把分散的信息整理成下一步可执行的工作流。"}</dd></div>
          </dl>
        </div>

        <div className="product-detail-card">
          <h2>下单后获得什么</h2>
          <ul className="product-detail-benefits">
            {benefits.map(([title, body]) => (
              <li key={title}>
                <span className="product-detail-check" aria-hidden="true">✓</span>
                <div><strong>{title}</strong><p>{body}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container product-detail-purchase">
        <div className="product-detail-purchase-copy">
          <span className="product-detail-purchase-icon" aria-hidden="true">🛒</span>
          <div>
            <h2>开始使用 {product.name.split("（")[0]}</h2>
            <p>解锁从公开对话中发现有效线索的能力</p>
            <ul>
              <li>一次性付费，终身使用</li>
              <li>7 天内不满意可退款</li>
              <li>安全支付，多种方式支持</li>
            </ul>
          </div>
        </div>
        <div className="product-detail-purchase-action">
          <strong>{price}</strong>
          {product.payment_enabled ? (
            <PayPalCheckoutButton productSlug={product.slug} sourcePage={`/products/${product.slug}#checkout`}>
              {isPresale ? "继续支付" : "立即购买"}
            </PayPalCheckoutButton>
          ) : (
            <Link href="mailto:soloclientlab.com@gmail.com" className="button primary">联系获取</Link>
          )}
        </div>
      </section>
    </div>
  );
}
