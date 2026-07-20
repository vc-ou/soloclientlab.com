import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy for SoloClientLab Research and Tools",
  description:
    "Privacy policy for SoloClientLab.com, including how newsletter, resource, waitlist, analytics, and site operation data is handled.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <section className="container">
      <div className="section-panel legal-page">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p>
          SoloClientLab.com collects limited contact information you voluntarily submit through newsletter, resource, and waitlist forms. We use this information to deliver requested resources, send research updates, and improve the site experience.
        </p>
        <p>
          We do not sell personal data. We may use privacy-respecting analytics and trusted infrastructure providers to run the site, store submissions, and deliver emails.
        </p>
        <p>
          If you want your information removed or updated, contact us through the email address used to subscribe and we will process the request within a reasonable timeframe.
        </p>
      </div>
    </section>
  );
}
