import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPosts } from "@/lib/domains/content";
import { labelForTopic } from "@/lib/format";

const leadRadarProductHref = "/products/leadradar";
const homeTitle = "Why a Product Doesn't Sell — Listing Autopsies | SoloClientLab";
const homeDescription =
  "Real product autopsies from Pinduoduo, the most price-competitive e-commerce channel in China: which single element is actually killing the sale, and what to change first — with the numbers behind every call.";

export const metadata: Metadata = {
  title: {
    absolute: homeTitle
  },
  description: homeDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SoloClientLab listing autopsy preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/opengraph-image"]
  }
};

function ProductWindow({ compact = false }: { compact?: boolean }) {
  const signals = compact
    ? [
        ["Prototype quote requested", "Source language captured with context"],
        ["Supplier recommendation needed", "Matched to a saved buying pattern"]
      ]
    : [
        ["Looking for a small-batch CNC partner", "Public thread · 2h ago · request for quote"],
        ["Need a faster way to source anodized parts", "Forum reply · Yesterday · vendor search"],
        ["Comparing lead times for prototype work", "Community post · 2d ago · follow-up"]
      ];

  return (
    <div className={`scl-product-window${compact ? " is-compact" : ""}`} aria-label="LeadRadar sample workflow preview">
      <div className="scl-window-bar">
        <div className="scl-window-dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="scl-window-label">{compact ? "LEADRADAR" : "SAMPLE DATA · LEADRADAR"}</div>
      </div>
      <div className="scl-window-body">
        <div className="scl-app-top">
          <span className="scl-app-name">{compact ? "Review queue" : "Buying signals"}</span>
          <span className="scl-app-action">{compact ? "Export" : "Review queue ↗"}</span>
        </div>
        {!compact ? (
          <div className="scl-metrics">
            <div><small>NEW SIGNALS</small><strong>18</strong></div>
            <div><small>HIGH INTENT</small><strong>06</strong></div>
            <div><small>TO REVIEW</small><strong>12</strong></div>
          </div>
        ) : null}
        <div className="scl-signal-list">
          {signals.map(([title, detail], index) => (
            <div className="scl-signal" key={title}>
              <span className="scl-signal-dot" />
              <div><h3>{title}</h3><p>{detail}</p></div>
              {!compact ? <span className="scl-signal-tag">{["HIGH", "NEW", "REVIEW"][index]}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const posts = await getPublicPosts();
  // 专注点改为「商品拆解」（listing autopsy）后，首页卡片不再需要按旧主题优先排序，
  // 直接取最新即可：读者关心的是最近判了什么，不是题材归属。
  const guideCards = posts.slice(0, 3).map((post) => ({
    meta: `${labelForTopic(post.topic_tag)} · ${post.read_time ?? "6 min read"}`,
    title: post.title,
    summary: post.summary ?? "",
    href: `/research/${post.slug}`
  }));

  return (
    <div className="home-reference" id="top">
      <section className="scl-hero container">
        <div className="scl-hero-copy">
          <div className="scl-mono">SoloClientLab · Listing autopsies for independent sellers</div>
          <h1>Why a product doesn&apos;t sell — and what to change first.</h1>
          <p>I take real products from Pinduoduo, the most price-competitive e-commerce channel in China, price them against a 20-item benchmark, and write down the one element that is actually killing the sale — including where my own judgment could be wrong.</p>
          <div className="scl-actions">
            <Link className="button primary" href="/research" prefetch={false}>Read the latest autopsies <span aria-hidden="true">→</span></Link>
            <Link className="button secondary" href="/products" prefetch={false}>See the tools</Link>
          </div>
          <div className="scl-microcopy">Real products. Real numbers. Including the calls I got wrong.</div>
        </div>
        <ProductWindow />
      </section>

      <div className="scl-trust container">
        <div><b>01</b> One product at a time</div>
        <div><b>02</b> Numbers before opinions</div>
        <div><b>03</b> Wrong calls stay published</div>
      </div>

      <section className="scl-section container" id="leadradar">
        <div className="scl-section-heading">
          <div><div className="scl-mono">Featured tool · Beta · Access requests open</div><h2>One focused tool for a recurring problem.</h2></div>
          <p>Start with a real workflow. If it helps, keep it. If it doesn&apos;t, move on without a bloated setup.</p>
        </div>
        <div className="scl-featured">
          <div>
            <div className="scl-mono">LeadRadar · A tool built earlier, still available</div>
            <h3>Find useful demand signals before they disappear.</h3>
            <p>Turn scattered public conversations into a reviewable list of opportunities, so you can decide what deserves a follow-up.</p>
            <Link className="button primary" href={leadRadarProductHref} prefetch={false}>See LeadRadar in action <span aria-hidden="true">→</span></Link>
          </div>
          <ProductWindow compact />
        </div>
      </section>

      <section className="scl-section container" id="about">
        <div className="scl-section-heading">
          <div><div className="scl-mono">Problems we work on</div><h2>Make the repetitive parts of solo work easier to run.</h2></div>
          <p>The tools may change. The goal stays simple: less sorting, less remembering, more useful work.</p>
        </div>
        <div className="scl-problem-list">
          {[
            ["Find opportunities", "Spot the useful request inside a noisy stream of information."],
            ["Organize client work", "Keep context, decisions, and next steps where you can find them."],
            ["Follow up consistently", "Turn a good intention into a small, visible action."],
            ["Automate the repetitive", "Move recurring sorting and handoffs out of your head."]
          ].map(([title, body], index) => (
            <div className="scl-problem" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="scl-section container" id="tools">
        <div className="scl-section-heading">
          <div><div className="scl-mono">Tool shelf</div><h2>Focused software, not a giant suite.</h2></div>
          <p>Every product should earn its place by making one part of independent work noticeably easier.</p>
        </div>
        <div className="scl-tool-shelf">
          <Link className="scl-guide scl-tool-card" href={leadRadarProductHref} prefetch={false}><div className="scl-mono">Beta · Access requests open</div><h3>LeadRadar</h3><p>Review public buying and sourcing signals before they get buried.</p><div className="scl-guide-meta">EARLIER TOOL · → VIEW TOOL</div></Link>
          <div className="scl-tool-note"><div className="scl-mono">What we&apos;re working on</div><h3>More focused tools, only when they earn their place.</h3><p>New products will appear here when they solve a real, repeated bottleneck. No pretend launch dates.</p></div>
        </div>
      </section>

      <section className="scl-section container" id="how-it-helps">
        <div className="scl-section-heading">
          <div><div className="scl-mono">How it helps</div><h2>Turn scattered conversations into a review queue.</h2></div>
          <p>Find the signal, keep the context, and decide what deserves a follow-up without sorting the same information twice.</p>
        </div>
        <div className="scl-workflow">
          <div className="scl-workflow-copy">
            <ol className="scl-workflow-steps">
              <li><b>01</b><span><strong>Find the signal</strong><small>Spot a relevant request inside a noisy public conversation.</small></span></li>
              <li><b>02</b><span><strong>Review the context</strong><small>Keep the source language and buying detail together.</small></span></li>
              <li><b>03</b><span><strong>Decide the next step</strong><small>Follow up when the opportunity actually makes sense.</small></span></li>
            </ol>
            <Link className="button primary" href={leadRadarProductHref} prefetch={false}>See LeadRadar in action <span aria-hidden="true">→</span></Link>
          </div>
          <ProductWindow compact />
        </div>
      </section>

      <section className="scl-section container" id="guides">
        <div className="scl-section-heading scl-guides-heading">
          <div><div className="scl-mono">Autopsies &amp; notes</div><h2>What I got right, and what I got wrong.</h2></div>
          <Link className="button secondary" href="/research" prefetch={false}>Browse all writing <span aria-hidden="true">→</span></Link>
        </div>
        {guideCards.length ? (
          <div className="scl-guide-grid">
            {guideCards.map((guide) => (
              <Link className="scl-guide" href={guide.href} key={guide.href} prefetch={false}>
                <div className="scl-mono">{guide.meta}</div>
                <h3>{guide.title}</h3>
                <p>{guide.summary}</p>
                <div className="scl-guide-meta">PRACTICAL GUIDE →</div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="scl-closing container">
        <div className="scl-mono">Start small</div>
        <h2>Start with one useful workflow.</h2>
        <p>Try the tool that solves today&apos;s bottleneck. Add nothing you don&apos;t need.</p>
        <Link className="button primary" href="/products" prefetch={false}>Explore tools <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
