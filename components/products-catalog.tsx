"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { startPayPalCheckout, subscribeUser } from "@/lib/actions";
import type { Product } from "@/lib/types";

type ProductGroup = "all" | "extension" | "tool" | "experiment";
type ProductSort = "newest" | "price-asc" | "price-desc";

type ActionState = {
  success: boolean;
  message: string;
};

const initialState: ActionState = {
  success: false,
  message: ""
};

const heroPoints = [
  {
    title: "Built for solopreneurs",
    body: "Focused on real needs of solo service businesses",
    glyph: "◎"
  },
  {
    title: "Save time",
    body: "Automate repetitive work and focus on growth",
    glyph: "⚡"
  },
  {
    title: "Privacy first",
    body: "Your data stays private and secure",
    glyph: "◫"
  },
  {
    title: "Easy to use",
    body: "No learning curve, get started in minutes",
    glyph: "✦"
  }
] as const;

function formatPrice(product: Product) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency
  }).format(product.price_cents / 100);
}

function groupForProduct(product: Product): Exclude<ProductGroup, "all"> {
  if (product.delivery_mode === "extension") return "extension";
  if (product.development_status === "idea" || product.development_status === "paused") return "experiment";
  return "tool";
}

function sortProducts(products: Product[], sort: ProductSort) {
  const next = [...products];

  if (sort === "price-asc") {
    return next.sort((a, b) => a.price_cents - b.price_cents);
  }

  if (sort === "price-desc") {
    return next.sort((a, b) => b.price_cents - a.price_cents);
  }

  return next.sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));
}

function productHighlights(product: Product) {
  return [product.short_description, product.problem, product.promise]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

function ProductPreview({ product }: { product: Product }) {
  return (
    <div className={`product-preview product-preview-${product.slug}`} data-kind={product.slug}>
      {product.slug === "leadradar" ? (
        <>
          <div className="product-preview-window product-preview-window-dark">
            <div className="product-preview-side">
              <span />
              <span className="is-active" />
              <span />
              <span />
            </div>
            <div className="product-preview-main">
              <div className="product-preview-search">
                <span>search intent</span>
              </div>
              <div className="product-preview-panel">
                <h4>Signal review</h4>
                <div className="product-preview-row" />
                <div className="product-preview-row" />
                <div className="product-preview-row short" />
              </div>
            </div>
          </div>
          <div className="product-preview-footer" aria-label="LeadRadar preview summary">
            <div className="product-preview-chip">TikTok comments</div>
            <div className="product-preview-chip">Lead signals</div>
          </div>
        </>
      ) : (
        <>
          <div className="product-preview-window">
            <div className="product-preview-dashboard">
              <div className="product-preview-stat">
                <strong>128</strong>
                <span>comments</span>
              </div>
              <div className="product-preview-stat">
                <strong>25</strong>
                <span>clusters</span>
              </div>
              <div className="product-preview-stat">
                <strong>12</strong>
                <span>signals</span>
              </div>
            </div>
            <div className="product-preview-map">
              <span />
              <span />
              <span />
              <span className="highlight" />
              <span />
              <span />
            </div>
          </div>
          <div className="product-preview-footer" aria-label="NeedRadar preview summary">
            <div className="product-preview-chip">Need clusters</div>
            <div className="product-preview-chip">Workflow lab</div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsNewsletterSignup() {
  const [state, action, pending] = useActionState(subscribeUser, initialState);

  return (
    <form action={action} className="products-newsletter-form">
      <input type="hidden" name="source_type" value="newsletter_page" />
      <input type="hidden" name="source_page" value="/products" />
      <label className="products-newsletter-input">
        <span className="sr-only">Email address</span>
        <input name="email" type="email" placeholder="Enter your email" required />
      </label>
      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Sending..." : "Notify me"}
      </button>
      {state.message ? <p className={`products-newsletter-feedback${state.success ? " is-success" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

export function ProductsCatalog({ products }: { products: Product[] }) {
  const [group, setGroup] = useState<ProductGroup>("all");
  const [sort, setSort] = useState<ProductSort>("newest");

  const visibleProducts = useMemo(() => {
    const filtered = group === "all" ? products : products.filter((product) => groupForProduct(product) === group);
    return sortProducts(filtered, sort);
  }, [group, products, sort]);

  return (
    <div className="products-page">
      <section className="container products-hero-shell">
        <div className="products-hero">
          <p className="eyebrow">Products</p>
          <h1>
            Tools built for
            <span className="products-hero-accent"> solo clients & builders</span>
          </h1>
          <p className="products-hero-copy">
            Practical tools to help you find leads, validate demand, and grow your business faster.
          </p>

          <div className="products-points">
            {heroPoints.map((item) => (
              <div key={item.title} className="products-point">
                <div className="products-point-icon" aria-hidden="true">
                  {item.glyph}
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container products-toolbar-shell">
        <div className="products-toolbar">
          <div className="products-tabs" role="tablist" aria-label="Product filters">
            {[
              { label: "All products", value: "all" },
              { label: "Extensions", value: "extension" },
              { label: "Tools", value: "tool" },
              { label: "Experiments", value: "experiment" }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`products-tab${group === item.value ? " is-active" : ""}`}
                onClick={() => setGroup(item.value as ProductGroup)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="products-sort">
            <span>Sort by:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as ProductSort)}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </section>

      <section className="container products-grid-shell">
        <div className="products-grid">
          {visibleProducts.map((product) => {
            const highlights = productHighlights(product);

            return (
              <article key={product.id} className="product-feature-card">
                <ProductPreview product={product} />

                <div className="product-feature-copy">
                  <p className="eyebrow">{product.delivery_mode === "extension" ? "EXTENSION" : "TOOL"}</p>
                  <h2>{product.name}</h2>
                  <p className="product-feature-summary">{product.short_description ?? product.hero_description ?? product.promise ?? "—"}</p>
                  <ul className="product-feature-list">
                    {highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <div className="product-feature-meta">
                    <span>{formatPrice(product)}</span>
                    <span>{product.development_status}</span>
                  </div>

                  <div className="product-feature-actions">
                    <Link href={`/products/${product.slug}`} className="button ghost" prefetch={false}>
                      View details
                    </Link>
                    {product.payment_enabled ? (
                      <form action={startPayPalCheckout} className="products-pay-form">
                        <input type="hidden" name="product_slug" value={product.slug} />
                        <input type="hidden" name="source_page" value={`/products#${product.slug}`} />
                        <button type="submit" className="button primary">
                          Pay now
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container products-newsletter-shell">
        <div className="products-newsletter-band">
          <div className="products-newsletter-copy-block">
            <div className="products-newsletter-icon" aria-hidden="true">
              ✉
            </div>
            <div>
              <h3>Get early access to new tools</h3>
              <p>Join our newsletter to get notified when new tools are released and get exclusive early access.</p>
            </div>
          </div>
          <ProductsNewsletterSignup />
        </div>
      </section>
    </div>
  );
}
