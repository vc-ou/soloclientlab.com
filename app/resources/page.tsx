import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Hub Redirect",
  description: "Redirects to the main research hub.",
  alternates: {
    canonical: "/resources"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function ResourcesPage() {
  redirect("/research");
}
