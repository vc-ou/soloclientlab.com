import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Hub Redirect",
  description: "Redirects to the main research hub.",
  alternates: {
    canonical: "/newsletter"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function NewsletterPage() {
  redirect("/research");
}
