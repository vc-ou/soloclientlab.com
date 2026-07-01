import type { Metadata } from "next";
import "./globals.css";
import { PlausibleScript } from "@/components/plausible-script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter, SiteHeader } from "@/components/site";
import { siteDescription, siteName } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.soloclientlab.com"),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no">
      <body>
        <PlausibleScript />
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
