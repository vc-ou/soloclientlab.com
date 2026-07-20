"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" }
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="header-nav">
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onFocus={() => router.prefetch(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
