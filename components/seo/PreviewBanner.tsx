"use client";

import { useSearchParams } from "next/navigation";

export default function PreviewBanner() {
  const params = useSearchParams();
  if (params.get("preview") !== "1") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#C9A84C",
        color: "#111",
        padding: "6px 16px",
        fontSize: "12px",
        textAlign: "center",
        fontFamily: "sans-serif",
        fontWeight: 600,
      }}
    >
      Modo preview — esta página não está sendo indexada
    </div>
  );
}
