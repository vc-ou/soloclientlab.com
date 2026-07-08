"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HOME_HERO_CTA_CARD_ID = "home-hero-cta-card";

export function HeaderCta() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isVisible, setIsVisible] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setIsVisible(true);
      return;
    }

    const heroCard = document.getElementById(HOME_HERO_CTA_CARD_ID);

    if (!heroCard) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.12
      }
    );

    observer.observe(heroCard);

    return () => observer.disconnect();
  }, [isHome, pathname]);

  return (
    <Link
      href="/research"
      className={`button primary header-cta${isVisible ? " is-visible" : ""}`}
      aria-hidden={isVisible ? undefined : "true"}
      tabIndex={isVisible ? undefined : -1}
    >
      Explore Research →
    </Link>
  );
}
