import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderCta } from "@/components/header-cta";
import { HeaderNav } from "@/components/header-nav";
import { labelForTopic, formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-mark">
          <span className="brand-title">
            SoloClientLab<span className="footer-brand-accent">.com</span>
          </span>
          <span className="brand-subtitle">Research and products for turning public demand signals into client opportunities.</span>
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
              Research and practical products for discovering public demand signals and turning them into work that can be reviewed.
            </p>
          </div>

          <div className="footer-nav-columns">
            <div>
              <h3 className="footer-heading">Explore</h3>
              <div className="footer-links">
                <Link href="/research">Research</Link>
                <Link href="/products">Products</Link>
                <Link href="/about">About</Link>
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
            <h4>Research + Product Lab</h4>
            <p>
              We study real workflow friction, publish the evidence, and build focused tools only where a repeated problem deserves a product loop.
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
  return (
    <article className={`post-card${horizontal ? " horizontal" : ""}`}>
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
