import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderNav } from "@/components/header-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { labelForTopic, formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-mark">
          <span className="brand-symbol">S</span>
          <span className="brand-title">SoloClientLab</span>
        </Link>
        <HeaderNav />
        <ThemeToggle />
        <Link href="/products" className="button primary header-explore">
          Explore tools <span aria-hidden="true">→</span>
        </Link>
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
            <Link href="/" className="brand-mark footer-brand-link">
              <span className="brand-symbol">S</span>
              <span className="footer-brand">SoloClientLab</span>
            </Link>
            <p className="footer-copy">
              Focused tools that make independent work easier to run.
            </p>
          </div>

          <div>
            <h3 className="footer-heading">Tools</h3>
            <div className="footer-links"><Link href="/products/leadradar">LeadRadar</Link><Link href="/products">All tools</Link></div>
          </div>
          <div>
            <h3 className="footer-heading">Learn</h3>
            <div className="footer-links"><Link href="/research">Guides</Link><Link href="/products">Products</Link></div>
          </div>
          <div>
            <h3 className="footer-heading">Company</h3>
            <div className="footer-links"><Link href="/about">About</Link><a href="mailto:soloclientlab.com@gmail.com">Contact</a></div>
          </div>
          <div>
            <h3 className="footer-heading">Legal</h3>
            <div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          </div>
        </div>

        <div className="footer-meta">
          <div>&copy; {currentYear} SoloClientLab.com. All rights reserved.</div>
          <div>Focused tools for independent work.</div>
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
  description?: string;
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
          {description ? <p className="hero-description">{description}</p> : null}
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
