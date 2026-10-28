import type { Metadata } from "next";
import { PageHero } from "@/components/site";
import { LicenseLookupForm } from "@/components/license-lookup-form";

export const metadata: Metadata = {
  title: "Find your license key",
  description: "Recover the license key for a SoloClientLab product using the email and order you purchased with.",
  alternates: { canonical: "/license" },
  robots: { index: false, follow: false }
};

export default function LicenseLookupPage() {
  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="License lookup"
        title="Find your license key"
        description="If you closed the payment page before saving your key, you can look it up here. You need the email you paid with and either the order number or the last 8 characters of the key."
      />
      <section className="container page-section">
        <LicenseLookupForm />
      </section>
    </>
  );
}
