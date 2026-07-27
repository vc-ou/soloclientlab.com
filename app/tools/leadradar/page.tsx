import type { Metadata } from "next";
import { LeadRadarDemo } from "@/components/leadradar-demo";

export const metadata: Metadata = {
  title: {
    absolute: "LeadRadar for TikTok: Comment Signal Review Demo"
  },
  description:
    "Try an early Chrome workflow for reviewing visible TikTok comments, preserving source context, and sorting potential B2B buying signals for human review.",
  alternates: {
    canonical: "/tools/leadradar"
  }
};

const faqItems = [
  {
    question: "How does LeadRadar identify buying intent in social media comments?",
    answer:
      "The current MVP uses local rules to identify visible commercial signals such as pricing, MOQ, sample, lead-time, and supplier questions. Higher-value comments can be reviewed with a DeepSeek-assisted semantic check, and uncertain cases still require human judgment."
  },
  {
    question: "Which platform does the current LeadRadar experiment support?",
    answer:
      "The current Chrome extension MVP is focused on visible TikTok comments. The broader workflow may be researched on other public platforms later, but those platforms are not presented as current product support."
  },
  {
    question: "What can the LeadRadar demo tell me?",
    answer:
      "The demo shows how a comment-review workflow can preserve context and separate likely commercial signals from noise. It does not guarantee leads, automate outreach, or replace a human decision about whether to follow up."
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
  name: "LeadRadar for TikTok",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "B2B comment signal review workflow",
  operatingSystem: "Chrome",
  browserRequirements: "Requires Google Chrome",
  url: "https://www.soloclientlab.com/tools/leadradar",
  description:
    "An early Chrome extension MVP for reviewing visible TikTok comments, preserving source context, and sorting potential B2B buying signals for human review.",
  featureList: [
    "Review visible TikTok comments",
    "Preserve comment and source context",
    "Flag potential commercial signals for human review",
    "Export a local review list"
  ]
};

function LeadRadarSeoContent() {
  return (
    <section className="container leadradar-seo-content" aria-label="LeadRadar product information">
      <div className="leadradar-seo-intro">
        <p className="eyebrow">Early TikTok workflow experiment</p>
        <p>
          LeadRadar is an early Chrome extension MVP for B2B operators who review TikTok comments for commercial
          signals. It keeps visible comments and their context together, then helps a human reviewer decide what may
          deserve a closer look.
        </p>
      </div>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-audience-title">
        <h2 id="leadradar-audience-title">Who LeadRadar is for</h2>
        <p>
          LeadRadar is being tested with B2B teams that already review TikTok comments and want a lighter way to
          separate possible commercial interest from casual engagement.
        </p>
        <div className="leadradar-seo-grid">
          <article>
            <h3>Solo consultants and agencies</h3>
            <p>
              Review questions about pricing, suppliers, and operational fit without losing the original TikTok context.
            </p>
          </article>
          <article>
            <h3>B2B sourcing and manufacturing teams</h3>
            <p>
              Review requests about MOQ, samples, private label, shipping, lead times, and supplier comparisons before
              deciding whether they warrant follow-up.
            </p>
          </article>
          <article>
            <h3>Operators building demand workflows</h3>
            <p>
              Preserve the language people use in real conversations and turn repeated questions into research notes,
              content ideas, or FAQ candidates.
            </p>
          </article>
        </div>
      </section>

      <section className="leadradar-seo-section" aria-labelledby="leadradar-comparison-title">
        <h2 id="leadradar-comparison-title">Manual comment scanning vs LeadRadar</h2>
        <p>
          Manual scanning is useful for early research, but it becomes slow and inconsistent when you need to repeat it.
          LeadRadar focuses on the repeated part: capturing visible TikTok comments, preserving context, and sorting
          possible signals for human review.
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
                <td>Capture visible comments while you browse a TikTok thread.</td>
              </tr>
              <tr>
                <th scope="row">Capturing context</th>
                <td>Copy comments into notes or spreadsheets by hand.</td>
                <td>Keep the original wording, account, source, and signal context together.</td>
              </tr>
              <tr>
                <th scope="row">Prioritizing leads</th>
                <td>Use personal judgment with inconsistent standards.</td>
                <td>Group possible buying signals, review items, and low-value noise for faster inspection.</td>
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
          The strongest use cases begin with a visible TikTok comment containing a practical business question, not just
          a like or a general compliment.
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
        <h2 id="leadradar-how-it-works-title">How the current experiment works</h2>
        <div className="leadradar-steps">
          <article>
            <span>01</span>
            <h3>Open a relevant TikTok thread</h3>
            <p>Browse a TikTok comment thread where prospective buyers may already be discussing a real sourcing or service need.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Capture visible comments</h3>
            <p>LeadRadar preserves useful comments and their source context without requiring manual copy-pasting.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Review possible signals</h3>
            <p>Sort possible leads, human-review items, and noise before choosing whether the comment informs research, content, or a follow-up.</p>
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
