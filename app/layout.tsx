import type { Metadata } from "next";
import "./globals.css";
import { PlausibleScript } from "@/components/plausible-script";
import { SiteFooter, SiteHeader } from "@/components/site";
import { siteDescription, siteName } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlausibleScript />
        <div className="site-shell">
          <SiteHeader />
          <main className="main-content">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
