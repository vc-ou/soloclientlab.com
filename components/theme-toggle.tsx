"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("scl-theme");
    const useDark = savedTheme === "dark";
    document.documentElement.dataset.theme = useDark ? "dark" : "light";
    setDark(useDark);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.localStorage.setItem("scl-theme", nextDark ? "dark" : "light");
  }

  return (
    <button className="theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed={dark} onClick={toggleTheme}>
      <span aria-hidden="true">☼ / ◐</span>
    </button>
  );
}
