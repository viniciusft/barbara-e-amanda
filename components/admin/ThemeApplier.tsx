"use client";

import { useEffect } from "react";

// Server layout can't access localStorage, so this client component
// applies the saved theme on mount to prevent flash.
export default function ThemeApplier() {
  useEffect(() => {
    const saved = localStorage.getItem("admin-tema") ?? "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  return null;
}
