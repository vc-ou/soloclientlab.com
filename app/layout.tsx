import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/500.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { PlausibleScript } from "@/components/plausible-script";
import { UmamiScript } from "@/components/umami-script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter, SiteHeader } from "@/components/site";
import { siteDescription, siteName } from "@/lib/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        email: "soloclientlab.com@gmail.com",
        description: siteDescription
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        inLanguage: "en",
        publisher: {
          "@id": `${siteUrl}/#organization`
        }
      }
    ]
  };

  return (
    <html lang="en" translate="no">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <PlausibleScript />
        <UmamiScript />
        <div className="site-shell">
          <SiteHeader />
          <main className="main-content">{children}</main>
          <SiteFooter />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
