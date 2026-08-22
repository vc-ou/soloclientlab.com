"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNavItems = [
  { href: "/admin", label: "总览" },
  { href: "/admin/metrics", label: "转化漏斗" },
  { href: "/admin/umami", label: "访问分析" },
  { href: "/admin/products", label: "商品与销售" },
  { href: "/admin/product-access", label: "商品访问" },
  { href: "/admin/payments", label: "支付记录" },
  { href: "/admin/trials", label: "试用记录" },
  { href: "/admin/leadradar-configs", label: "LeadRadar 配置" },
  { href: "/admin/post-analytics", label: "文章分析" },
  { href: "/admin/posts", label: "文章管理" },
  { href: "/admin/subscribers", label: "联系人" },
  { href: "/admin/waitlists", label: "访问线索" },
  { href: "/admin/feedback", label: "反馈" }
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
