import type { Metadata } from "next";
import { LeadRadarDemo } from "@/components/leadradar-demo";

export const metadata: Metadata = {
  title: {
    absolute: "LeadRadar for B2B Lead Signals | SoloClientLab.com"
  },
  description:
    "Try LeadRadar directly in the site: scroll comment threads, review buying signals, and validate the workflow before installing anything.",
  alternates: {
    canonical: "/tools/leadradar"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does LeadRadar identify buying intent in social media comments?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "LeadRadar uses a specialized natural language processing (NLP) workflow to analyze social media threads. Instead of just looking for keywords, it detects contextual buying signals such as commercial intent, supply chain indicators, and project validation. By filtering out casual engagement and noise, LeadRadar allows solo consultants to focus only on high-value conversations that lead to billable projects."
      }
    },
    {
      "@type": "Question",
      name: "Which platforms does LeadRadar support for lead generation?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Currently, LeadRadar is optimized to capture and filter signals from high-traffic B2B discussion platforms including Reddit, LinkedIn, and TikTok. The workflow is designed to be platform-agnostic, so it can be applied to any social channel where potential clients discuss business problems or procurement needs."
      }
    },
    {
      "@type": "Question",
      name: "Why use LeadRadar instead of traditional social selling?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Traditional social selling often relies on noisy manual scrolling or expensive, algorithm-dependent ads. LeadRadar uses a research-backed approach to identify demand that is already being expressed in public comments, helping you reach warm leads who are actively looking for a solution instead of relying on cold outreach."
      }
    }
  ]
};

export default function LeadRadarDemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      <LeadRadarDemo />
    </>
  );
}
