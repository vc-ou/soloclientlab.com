import type { Metadata } from "next";
import { NewsletterForm } from "@/components/forms";
import { PageHero } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: "Learn who runs SoloClientLab.com, what the site studies, and how the research process works."
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="About SoloClientLab.com"
        title="We study how solo service businesses get clients."
        description="SoloClientLab.com turns real-world research into clearer decisions on client acquisition, offer validation, and practical AI workflows."
      />

      <section className="container">
        <div className="grid-3">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>Who runs SoloClientLab.com</h2>
            <p>Hi, here is SoloClientLab. As an indie builder and researcher, I specialize in solo service business growth.</p>
            <p>I&apos;ve built and sold online businesses and spent years decoding the client acquisition strategies that actually work. My work helps independent professionals move away from random lead sources to a predictable, data-backed client acquisition system.</p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What we study</h2>
            <div className="activity-list">
              {aboutStudyAreas.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>Our research method</h2>
            <div className="activity-list">
              {aboutMethodSteps.map((item) => (
                <div key={item.step}>
                  <strong>{item.step}. {item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <NewsletterForm
          sourceType="newsletter_page"
          sourcePage="/about"
          title="Get weekly client acquisition research"
          subtitle="Join savvy solo consultants and independent experts getting practical insights on client acquisition, offer validation, and AI workflows."
          buttonLabel="Subscribe"
        />
      </section>
    </>
  );
}
