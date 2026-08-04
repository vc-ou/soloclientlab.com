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

        <h2 id="needradar-extension">NeedRadar Microsoft Edge extension</h2>
        <p>
          NeedRadar accesses the visible title, text, comments, public author names, community name, page URL, and text
          you select on supported Reddit and Xiaohongshu pages. It uses this information only to build the workflow
          signals that you review in the Microsoft Edge side panel.
        </p>
        <p>
          Captured page content and saved workflow signals are stored locally in Microsoft Edge extension storage.
          NeedRadar does not transmit this research data to SoloClientLab, analytics providers, advertising services,
          or other third parties. Data leaves extension storage only when you choose to export a Markdown or CSV file
          through Microsoft Edge.
        </p>
        <p>
          You control this data. You can remove saved signals with the clear action in NeedRadar, remove exported files
          from your device, or uninstall the extension to remove its extension storage. NeedRadar does not access
          authentication credentials, payment information, health data, precise location, private messages, or pages
          outside its declared Reddit and Xiaohongshu support patterns.
        </p>
        <p>
          If a future version adds cloud sync, an AI service, account features, or extension analytics that receive
          captured content, this policy and the Microsoft Edge Add-ons data-use disclosure will be updated before that
          functionality is released. Questions can be sent to soloclientlab.com@gmail.com.
        </p>
      </div>
    </section>
  );
}
