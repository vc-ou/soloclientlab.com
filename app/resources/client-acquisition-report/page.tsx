import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Hub Redirect",
  description: "Redirects to the main research hub.",
  alternates: {
    canonical: "/resources/client-acquisition-report"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function ResourcePage() {
  redirect("/research");
}
