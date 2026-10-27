"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNavItems = [
  { href: "/admin", label: "今日" },
  { href: "/admin/content", label: "内容" },
  { href: "/admin/catalog", label: "商品" },
  { href: "/admin/people", label: "客户" },
  { href: "/admin/orders", label: "订单" },
  { href: "/admin/insights", label: "数据" },
  { href: "/admin/settings", label: "设置" }
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
    <nav aria-label="后台导航">
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
            {pending ? <span className="admin-nav-status">加载中...</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
