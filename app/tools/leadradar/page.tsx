import type { Metadata } from "next";
import { LeadRadarDemo } from "@/components/leadradar-demo";

export const metadata: Metadata = {
  title: {
    absolute: "LeadRadar: B2B Lead Generation from Social Comments"
  },
  description:
    "Monitor LinkedIn, Reddit, and TikTok comments for B2B buying signals. Automatically filter noise and identify high-intent leads without manual scraping.",
  alternates: {
    canonical: "/tools/leadradar"
  }
};

const faqItems = [
  {
    question: "How does LeadRadar identify buying intent in social media comments?",
    answer:
      "LeadRadar uses an AI-assisted workflow to analyze social media threads for context rather than relying only on keywords. It looks for commercial intent, supply chain indicators, and project validation signals such as pricing requests, MOQ questions, sample requirements, lead times, and vendor comparisons."
  },
  {
    question: "Which platforms does LeadRadar support for lead generation?",
    answer:
      "LeadRadar is designed for B2B conversations on LinkedIn, Reddit, and TikTok. The workflow can also be applied to other public discussion channels where potential clients discuss business problems, sourcing needs, or procurement requirements."
  },
  {
    question: "Why use LeadRadar instead of traditional social selling?",
    answer:
      "Traditional social selling often depends on noisy manual scrolling, copy-pasting, and algorithm-driven reach. LeadRadar helps you find demand that is already being expressed in public comments, so you can review warmer opportunities without manually collecting every comment."
  }
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LeadRadar",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "B2B lead generation software",
  operatingSystem: "Chrome",
  browserRequirements: "Requires Google Chrome",
  url: "https://www.soloclientlab.com/tools/leadradar",
  description:
    "Monitor LinkedIn, Reddit, and TikTok comments for B2B buying signals. Automatically filter noise and identify high-intent leads without manual scraping.",
  featureList: [
    "Monitor public social media comments",
    "Identify B2B buying signals",
    "Filter commercial intent from engagement noise",
    "Review pricing, MOQ, supplier, sample, and lead-time signals"
  ]
};

function LeadRadarSeoContent() {
  return (
    <section className="container leadradar-seo-content" aria-label="LeadRadar product information">
      <div className="leadradar-seo-intro">
        <p className="eyebrow">B2B lead generation workflow</p>
        <p>
          LeadRadar helps consultants, agencies, and B2B operators monitor public social media comments for buying
          signals. It turns scattered conversations into a focused review queue, so you can spend less time copying
          comments into spreadsheets and more time deciding which opportunities deserve a response.
        </p>
      </div>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-audience-title">
        <h2 id="leadradar-audience-title">Who LeadRadar is for</h2>
        <p>
          LeadRadar is built for teams that already look for demand in public conversations and need a repeatable way to
          separate commercial intent from casual engagement.
        </p>
        <div className="leadradar-seo-grid">
          <article>
            <h3>Solo consultants and agencies</h3>
            <p>
              Find client conversations about pricing, implementation, suppliers, or operational problems without
              manually reviewing every comment.
            </p>
          </article>
          <article>
            <h3>B2B sourcing and manufacturing teams</h3>
            <p>
              Surface requests about MOQ, samples, private label, shipping, lead times, and supplier comparisons before
              they become formal inquiries.
            </p>
          </article>
          <article>
            <h3>Operators building demand workflows</h3>
            <p>
              Preserve the language people use in real conversations and turn repeated questions into outreach angles,
              content ideas, and FAQs.
            </p>
          </article>
        </div>
      </section>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-comparison-title">
        <h2 id="leadradar-comparison-title">Manual comment scanning vs LeadRadar</h2>
        <p>
          Manual scanning is useful for early research, but it becomes slow and inconsistent when you need to repeat it
          every day. LeadRadar focuses on the repeated part: capturing visible comments, preserving context, and sorting
          signals for human review.
        </p>
        <div className="leadradar-comparison-wrap">
          <table className="leadradar-comparison">
            <thead>
              <tr>
                <th scope="col">Workflow step</th>
                <th scope="col">Manual scanning</th>
                <th scope="col">LeadRadar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Finding comments</th>
                <td>Search, open threads, and scroll one page at a time.</td>
                <td>Monitor public conversations while you browse supported platforms.</td>
              </tr>
              <tr>
                <th scope="row">Capturing context</th>
                <td>Copy comments into notes or spreadsheets by hand.</td>
                <td>Keep the original wording, account, source, and signal context together.</td>
              </tr>
              <tr>
                <th scope="row">Prioritizing leads</th>
                <td>Use personal judgment with inconsistent standards.</td>
                <td>Group likely buying signals, review items, and low-value noise for faster inspection.</td>
              </tr>
              <tr>
                <th scope="row">Next action</th>
                <td>Start follow-up from scattered notes.</td>
                <td>Use the signal type to decide whether to research, respond, or turn the question into content.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-use-cases-title">
        <h2 id="leadradar-use-cases-title">Use cases</h2>
        <p>
          The strongest use cases begin with a public comment that contains a practical business question, not just a
          like or a general compliment.
        </p>
        <div className="leadradar-seo-grid">
          <article>
            <h3>Find quote and pricing requests</h3>
            <p>Prioritize comments asking for catalogs, quotes, price lists, unit pricing, or commercial terms.</p>
          </article>
          <article>
            <h3>Identify supplier and vendor searches</h3>
            <p>Spot people looking for manufacturing partners, service providers, distributors, or backup suppliers.</p>
          </article>
          <article>
            <h3>Capture MOQ, sample, and lead-time signals</h3>
            <p>Recognize practical evaluation questions that often appear before a formal B2B buying request.</p>
          </article>
          <article>
            <h3>Turn repeated questions into content</h3>
            <p>Use recurring comment language to create useful landing pages, FAQs, outreach messages, and guides.</p>
          </article>
        </div>
      </section>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-how-it-works-title">
        <h2 id="leadradar-how-it-works-title">How it works</h2>
        <div className="leadradar-steps">
          <article>
            <span>01</span>
            <h3>Monitor public conversations</h3>
            <p>Browse LinkedIn, Reddit, or TikTok conversations where your target buyers already discuss real needs.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Capture visible comments</h3>
            <p>LeadRadar preserves useful comments and their source context without requiring manual copy-pasting.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Review high-intent signals</h3>
            <p>Filter likely leads, human-review items, and noise before choosing the right follow-up or content action.</p>
          </article>
        </div>
      </section>

      <section className="leadradar-seo-section leadradar-seo-faq leadradar-faq" aria-labelledby="leadradar-faq-title">
        <h2 id="leadradar-faq-title">Frequently asked questions</h2>
        {faqItems.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}

export default function LeadRadarDemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema)
        }}
      />
      <LeadRadarDemo />
      <LeadRadarSeoContent />
    </>
  );
}
