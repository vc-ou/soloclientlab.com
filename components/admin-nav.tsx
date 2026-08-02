"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/product-access", label: "Product Access" },
  { href: "/admin/trials", label: "Trials" },
  { href: "/admin/leadradar-configs", label: "LeadRadar Configs" },
  { href: "/admin/post-analytics", label: "Post Analytics" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/subscribers", label: "Contacts" },
  { href: "/admin/waitlists", label: "Access Leads" },
  { href: "/admin/feedback", label: "Feedback" }
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <nav aria-label="Admin navigation">
      {adminNavItems.map((item) => {
        const active = isActive(pathname, item.href);
        const pending = pendingHref === item.href && !active;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-link${active ? " is-active" : ""}${pending ? " is-pending" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-busy={pending ? "true" : undefined}
            onFocus={() => router.prefetch(item.href)}
            onMouseEnter={() => router.prefetch(item.href)}
            onClick={() => setPendingHref(item.href)}
          >
            <span>{item.label}</span>
            {pending ? <span className="admin-nav-status">Loading...</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
