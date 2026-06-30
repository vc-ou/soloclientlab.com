"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/post-analytics", label: "Post Analytics" },
  { href: "/admin/demands", label: "Demands" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/waitlists", label: "Waitlists" }
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
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
