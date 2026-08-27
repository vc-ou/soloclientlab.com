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
    idea: "Concept",
    presale: "Pre-order",
    building: "In development",
    ready: "Ready",
    paused: "Paused"
  };

  return labels[status];
}

function formatDeliveryMode(mode: Product["delivery_mode"]) {
  const labels: Record<Product["delivery_mode"], string> = {
    presale: "Pre-order delivery",
    digital_file: "Digital download",
    extension: "Browser extension",
    service: "Service delivery",
    manual_delivery: "Manual delivery"
  };

  return labels[mode];
}

function getProductCategory(product: Product) {
  if (product.delivery_mode === "extension") return "Browser extension";
  if (product.delivery_mode === "service") return "Productized service";
  return "Focused workflow tool";
}

function getFeatureItems(product: Product) {
  if (product.features?.length) {
    return product.features.map((feature, index) => [
      ["⌾", "⌘", "◇", "ϟ"][index % 4],
      feature.title,
      feature.body ?? ""
    ]);
  }

  if (product.slug === "leadradar") {
    return [
      ["⌾", "Spot intent", "Identify buying, quoting, and custom-order signals from public manufacturing conversations."],
      ["⌘", "Manage the workflow", "Automatically organize and score leads so teams can follow up with more focus."],
      ["◇", "Respect platform rules", "Work from public content without automated scraping."],
      ["ϟ", "Get started quickly", "Install the browser extension and begin capturing leads in minutes."]
    ];
  }

  return [
    ["⌾", "Centralize research", "Bring comments, search queries, and field notes into one reusable workflow."],
    ["⌘", "Cluster demand", "Find recurring problems, urgent needs, and possible paid opportunities faster."],
    ["◇", "Keep the context", "Preserve original language and sources so you can return to the evidence when deciding."],
    ["ϟ", "Validate lightly", "Start with one research question instead of building a complex system first."]
  ];
}

function getBenefits(product: Product) {
  return [
    ["Clear fit", product.audience ?? "For people who want a more focused way to handle this recurring workflow."],
    ["Defined outcome", product.promise ?? product.short_description ?? "A practical next step for the problem described above."],
    ["Delivery", formatDeliveryMode(product.delivery_mode)],
    ["Product stage", formatDevelopmentStatus(product.development_status)]
  ];
}

function getProductDisplayName(product: Product) {
  return product.name.split(/[（(]/)[0].trim();
}

function ProductWindow({ product }: { product: Product }) {
  const isLeadRadar = product.slug === "leadradar";
  const displayName = getProductDisplayName(product);
  const featureRows = product.features?.slice(0, 4).map((feature, index) => [
    feature.title,
    feature.body ?? "A focused workflow step",
    "Signal",
    String(88 - index * 6)
  ]);
  const rows = isLeadRadar
    ? [
        ["Looking for a CNC supplier", "who can handle small batch...", "MOQ", "85"],
        ["Need a quote for aluminum", "parts, about 100pcs", "Quote", "78"],
        ["Can you do 5-axis machining", "for titanium?", "5-axis", "92"],
        ["Looking for custom parts", "manufacturer", "Custom", "80"]
      ]
    : featureRows?.length
      ? featureRows
      : [
        ["Need a better way to cluster", "research notes from Reddit", "Cluster", "88"],
        ["How do I compare repeated", "customer problems?", "Demand", "82"],
        ["Looking for a lightweight", "validation workflow", "Validate", "76"],
        ["Can I turn comments into", "a usable research brief?", "Research", "91"]
      ];

  return (
    <div className={`product-detail-window${isLeadRadar ? "" : " is-needradar"}`} aria-label={`${product.name} preview`}>
      <div className="product-detail-window-top">
        <span className="product-detail-window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="product-detail-window-title">{displayName}</span>
        <span className="product-detail-window-action">Review signals</span>
      </div>
      <div className="product-detail-window-body">
        <aside className="product-detail-window-sidebar" aria-hidden="true">
          <span>⌂</span>
          <span>▤</span>
          <span className="is-active">▣</span>
          <span>◷</span>
        </aside>
        <div className="product-detail-window-content">
          <div className="product-detail-search">⌕ <span>{isLeadRadar ? "Public intent" : "Workflow queue"}</span></div>
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
            <div><span>Today</span><strong>128</strong></div>
            <div><span>High intent</span><strong>32</strong></div>
            <div><span>To follow up</span><strong>18</strong></div>
            <div><span>Converted</span><strong>5</strong></div>
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
  const landingPageUrl = product.landing_page_url;
  const displayName = getProductDisplayName(product);

  return (
    <div className="product-detail-page">
      <TrackProductPageView productSlug={product.slug} />

      <section className="container product-detail-hero">
        <Link href="/products" className="product-detail-back" prefetch={false}>← Back to products</Link>
        <div className="product-detail-hero-grid">
          <div className="product-detail-hero-copy">
            <span className="product-detail-category">{getProductCategory(product)}</span>
            <h1>{product.hero_title ?? product.name}</h1>
            <p>{product.hero_description ?? product.short_description ?? product.promise ?? ""}</p>
            <div className="product-detail-actions">
              {product.payment_enabled ? (
                <PayPalCheckoutButton productSlug={product.slug} sourcePage={`/products/${product.slug}#hero`}>
                  Buy now {price}
                </PayPalCheckoutButton>
              ) : null}
              {landingPageUrl ? (
                <Link href={landingPageUrl} className="button ghost" target="_blank" rel="noreferrer">
                  <span aria-hidden="true">↗</span> View full landing page
                </Link>
              ) : (
                <Link href={product.slug === "leadradar" ? "/tools/leadradar" : "/products"} className="button ghost" prefetch={false}>
                  <span aria-hidden="true">▷</span> {product.slug === "leadradar" ? "Watch demo" : "Back to products"}
                </Link>
              )}
            </div>
          </div>
          <ProductWindow product={product} />
        </div>
      </section>

      <section className="container product-detail-features" aria-label="Product features">
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
          <h2>Product details</h2>
          <dl className="product-detail-table">
            <div><dt>Price</dt><dd>{price}</dd></div>
            <div><dt>Stage</dt><dd>{formatDevelopmentStatus(product.development_status)}</dd></div>
            <div><dt>Delivery</dt><dd>{formatDeliveryMode(product.delivery_mode)}</dd></div>
            <div><dt>Best for</dt><dd>{product.audience ?? "Independent operators and small teams who want to make recurring work clearer."}</dd></div>
            <div><dt>What it solves</dt><dd>{product.problem ?? product.short_description ?? "Turn scattered information into a practical next-step workflow."}</dd></div>
            <div><dt>Expected outcome</dt><dd>{product.promise ?? "A clearer next step from the problem described above."}</dd></div>
          </dl>
        </div>

        <div className="product-detail-card">
          <h2>What you get</h2>
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
            <h2>Start using {displayName}</h2>
            <p>Turn public conversations into evidence you can act on.</p>
            <ul>
              <li>One-time payment with lifetime access</li>
              <li>7-day money-back guarantee</li>
              <li>Secure payment with multiple options</li>
            </ul>
            {landingPageUrl ? (
              <Link href={landingPageUrl} target="_blank" rel="noreferrer" className="product-detail-inline-link">
                Read the full product story ↗
              </Link>
            ) : null}
          </div>
        </div>
        <div className="product-detail-purchase-action">
          <strong>{price}</strong>
          {product.payment_enabled ? (
            <PayPalCheckoutButton productSlug={product.slug} sourcePage={`/products/${product.slug}#checkout`}>
              {isPresale ? "Continue to payment" : "Buy now"}
            </PayPalCheckoutButton>
          ) : (
            <Link href="mailto:soloclientlab.com@gmail.com" className="button primary">Contact us</Link>
          )}
        </div>
      </section>
    </div>
  );
}
