import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested SoloClientLab page is not available."
};

export default function NotFound() {
  return (
    <>
      <PageHero
        align="center"
        className="public-route-hero"
        eyebrow="Not found"
        title="Page not found"
        description="This page may have moved, or the link may no longer point to a published resource."
      />

      <section className="container">
        <div className="empty-state-card">
          <h2>Try the latest guides instead.</h2>
          <p>Browse current research notes and product workflows from SoloClientLab.</p>
          <div className="empty-state-actions">
            <Link href="/research" className="button primary">
              Browse guides
            </Link>
            <Link href="/" className="button ghost">
              Go home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
