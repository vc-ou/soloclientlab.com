import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPosts } from "@/lib/db";

const leadRadarProductHref = "/products/leadradar";

export const metadata: Metadata = {
  title: {
    absolute: "Practical Tools for Independent Work | SoloClientLab"
  },
  description:
    "Practical software that helps independent professionals find opportunities, organize client work, and spend less time on repetitive tasks.",
  alternates: {
    canonical: "/"
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
  const guideCards = [
    {
      meta: "Client acquisition · 3 min",
      title: "How to get your first clients when you don't have a network",
      summary: "Start with visible problems, small proof, and low-pressure conversations.",
      href: posts[0] ? `/research/${posts[0].slug}` : "/research"
    },
    {
      meta: "SEO · 6 min",
      title: "Solo practitioner SEO without content volume",
      summary: "Build a small search-driven acquisition system around judgment and proof.",
      href: posts[1] ? `/research/${posts[1].slug}` : "/research"
    },
    {
      meta: "Client acquisition · 4 min",
      title: "How to get SEO clients without cold calling",
      summary: "Use real context to make the first conversation easier.",
      href: posts[2] ? `/research/${posts[2].slug}` : "/research"
    }
  ];

  return (
    <div className="home-reference" id="top">
      <section className="scl-hero container">
        <div className="scl-hero-copy">
          <div className="scl-mono">SoloClientLab · Practical work tools</div>
          <h1>Small tools for getting solo work done.</h1>
          <p>Practical software that helps independent professionals find opportunities, organize client work, and spend less time on repetitive tasks.</p>
          <div className="scl-actions">
            <Link className="button primary" href="/products">Explore tools <span aria-hidden="true">→</span></Link>
            <Link className="button secondary" href={leadRadarProductHref}>See LeadRadar in action</Link>
          </div>
          <div className="scl-microcopy">Focused workflows · Clear next steps · No bloated setup</div>
        </div>
        <ProductWindow />
      </section>

      <div className="scl-trust container">
        <div><b>01</b> Independent and focused</div>
        <div><b>02</b> One useful workflow at a time</div>
        <div><b>03</b> Try the workflow before committing</div>
      </div>

      <section className="scl-section container" id="leadradar">
        <div className="scl-section-heading">
          <div><div className="scl-mono">Featured tool · Available now</div><h2>One focused tool for a recurring problem.</h2></div>
          <p>Start with a real workflow. If it helps, keep it. If it doesn&apos;t, move on without a bloated setup.</p>
        </div>
        <div className="scl-featured">
          <div>
            <div className="scl-mono">LeadRadar · CNC / manufacturing</div>
            <h3>Find useful demand signals before they disappear.</h3>
            <p>Turn scattered public conversations into a reviewable list of opportunities, so you can decide what deserves a follow-up.</p>
            <Link className="button primary" href={leadRadarProductHref}>See LeadRadar in action <span aria-hidden="true">→</span></Link>
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
        <div className="scl-guide-grid">
          <Link className="scl-guide" href={leadRadarProductHref}><div className="scl-mono">Available now</div><h3>LeadRadar</h3><p>Review public buying and sourcing signals before they get buried.</p><div className="scl-guide-meta">CNC · MANUFACTURING · → VIEW TOOL</div></Link>
          <Link className="scl-guide" href="/research"><div className="scl-mono">Guides</div><h3>Practical notes for solo work</h3><p>Short explanations for finding clients, organizing work, and deciding what to automate.</p><div className="scl-guide-meta">READ THE GUIDES →</div></Link>
          <div className="scl-guide"><div className="scl-mono">In progress</div><h3>More focused tools</h3><p>New products will appear here when they solve a real, repeated bottleneck.</p><div className="scl-guide-meta">NO PRETEND LAUNCH DATES</div></div>
        </div>
      </section>

      <section className="scl-section container" id="guides">
        <div className="scl-section-heading scl-guides-heading">
          <div><div className="scl-mono">Guides</div><h2>Useful ideas for the work between the work.</h2></div>
          <Link className="button secondary" href="/research">Browse practical guides <span aria-hidden="true">→</span></Link>
        </div>
        <div className="scl-guide-grid">
          {guideCards.map((guide) => (
            <Link className="scl-guide" href={guide.href} key={guide.title}>
              <div className="scl-mono">{guide.meta}</div>
              <h3>{guide.title}</h3>
              <p>{guide.summary}</p>
              <div className="scl-guide-meta">PRACTICAL GUIDE →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="scl-closing container">
        <div className="scl-mono">Start small</div>
        <h2>Start with one useful workflow.</h2>
        <p>Try the tool that solves today&apos;s bottleneck. Add nothing you don&apos;t need.</p>
        <Link className="button primary" href="/products">Explore tools <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
