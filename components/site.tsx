import Link from "next/link";
import type { ReactNode } from "react";
import { NewsletterForm } from "@/components/forms";
import { HeaderCta } from "@/components/header-cta";
import { HeaderNav } from "@/components/header-nav";
import { labelForTopic, formatDate } from "@/lib/format";
import { getOptimizedStorageImageUrl } from "@/lib/image-url";
import type { Post } from "@/lib/types";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-mark">
          <span className="brand-title">
            SoloClientLab<span className="footer-brand-accent">.com</span>
          </span>
          <span className="brand-subtitle">Research-backed client acquisition insights for solo service businesses.</span>
        </Link>
        <HeaderNav />
        <HeaderCta />
      </div>
    </header>
  );
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <Link href="/" className="footer-brand-link">
              <span className="footer-brand">SoloClientLab</span>
              <span className="footer-brand-accent">.com</span>
            </Link>
            <p className="footer-copy">
              Data-backed client acquisition strategies and automation workflows for solo professional service businesses.
            </p>
          </div>

          <div className="footer-nav-columns">
            <div>
              <h3 className="footer-heading">Explore</h3>
              <div className="footer-links">
                <Link href="/research">Research Notes</Link>
                <Link href="/newsletter">Newsletter</Link>
              </div>
            </div>
            <div>
              <h3 className="footer-heading">Legal</h3>
              <div className="footer-links">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="footer-principle">
            <h4>Our Research Principle</h4>
            <p>
              We focus on identifying real market demands and structural acquisition problems before breaking them down into practical, automated workflows. No fluff, just data.
            </p>
          </div>
        </div>

        <div className="footer-meta">
          <div>&copy; {currentYear} SoloClientLab.com. All rights reserved.</div>
          <div>Built for Solo Consultants, Freelancers, and One-Person Service Agencies.</div>
        </div>
      </div>
    </footer>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  aside,
  align = "split",
  className
}: {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  aside?: ReactNode;
  align?: "split" | "center";
  className?: string;
}) {
  return (
    <section className="hero-panel">
      <div className={`container hero-grid hero-${align}${className ? ` ${className}` : ""}`}>
        <div className="hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p className="hero-description">{description}</p>
        </div>
        {aside ? <div className="hero-aside">{aside}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function PostCard({ post, horizontal = false }: { post: Post; horizontal?: boolean }) {
  const coverImageUrl = getOptimizedStorageImageUrl(post.cover_image_url, {
    width: horizontal ? 520 : 900,
    quality: 75
  });

  return (
    <article className={`post-card${horizontal ? " horizontal" : ""}`}>
      <div
        className={`post-media${coverImageUrl ? " has-image" : ""}`}
        style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : undefined}
      >
        <span>{labelForTopic(post.topic_tag)}</span>
      </div>
      <div className="post-body">
        <p className="tag">{labelForTopic(post.topic_tag)}</p>
        <h3>
          <Link href={`/research/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.summary}</p>
        <div className="post-meta">
          <span>{formatDate(post.published_at)}</span>
          <span>{post.read_time ?? "6 min read"}</span>
        </div>
      </div>
    </article>
  );
}

export function NewsletterPanel({
  title = "Weekly Client Acquisition Research",
  body = "Weekly client acquisition research, validation ideas, and practical AI workflows.",
  sourcePage,
  compact = false
}: {
  title?: string;
  body?: string;
  sourcePage: string;
  compact?: boolean;
}) {
  return (
    <aside className="newsletter-panel">
      <h3>{title}</h3>
      <p>{body}</p>
      <NewsletterForm
        sourceType="newsletter_page"
        sourcePage={sourcePage}
        buttonLabel="Subscribe"
        compact={compact}
      />
    </aside>
  );
}
