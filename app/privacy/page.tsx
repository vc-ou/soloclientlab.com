import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for SoloClientLab.com, including how product access, trial feedback, analytics, and site operation data is handled.",
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
          SoloClientLab.com collects limited contact information you voluntarily submit for product access, trial access, co-build access, or other requests. We use this information to deliver the requested access, support product calibration, and improve the site experience.
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
