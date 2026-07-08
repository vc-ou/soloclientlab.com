import type { Metadata } from "next";
import { NewsletterForm } from "@/components/forms";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";
import { newsletterBenefits, publicSocialProof } from "@/lib/content";

export const metadata: Metadata = {
  title: "Weekly Client Acquisition Research for Solo Professionals",
  description: "Weekly client acquisition research for solo professionals, with validated growth ideas, offer insights, and automated workflows that do not rely on social media."
};

export default async function NewsletterPage() {
  const posts = await getPublicPosts("client_acquisition");

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="Weekly research"
        title="Weekly Client Acquisition Research for Solo Professionals"
        description="Powered by SoloClientLab.com. We analyze hundreds of B2B consultant conversations every week to deliver validated client acquisition frameworks, organic lead generation tactics, and automated workflows for solo experts."
        aside={
          <NewsletterForm
            sourceType="newsletter_page"
            sourcePage="/newsletter"
            title={publicSocialProof.newsletterJoinCopy}
            subtitle="Get weekly client acquisition research, next-step ideas, and practical AI workflows."
            buttonLabel="Get Free Access →"
          />
        }
      />

      <section className="container">
        <div className="grid-3">
          {newsletterBenefits.map((item) => (
            <div key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <SectionHeading title="Recent client acquisition research" />
        <div className="post-grid">
          {posts.slice(0, 4).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
