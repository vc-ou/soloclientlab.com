import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service for SoloClientLab Research and Products",
  description:
    "Terms of Service for SoloClientLab.com research, product access, trial workflows, and product feedback.",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <section className="container">
      <div className="section-panel legal-page">
        <p className="eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p>
          SoloClientLab.com provides research, educational resources, and workflow ideas for solo professional service businesses. Content is provided for informational purposes and does not constitute legal, financial, or business guarantees.
        </p>
        <p>
          You may browse, subscribe, and download offered resources for your own evaluation and internal use. You may not resell, misrepresent, or abuse the site, its materials, or its forms.
        </p>
        <p>
          We may update, suspend, or remove content, resources, or site features at any time. Continued use of the site after updates means you accept the revised terms.
        </p>
      </div>
    </section>
  );
}
