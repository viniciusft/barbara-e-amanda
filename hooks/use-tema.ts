"use client";

import { useState, useEffect } from "react";

export type Tema = "dark" | "light";

function applyTema(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

export function useTema() {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    // Read from localStorage first for instant apply
    const saved = (localStorage.getItem("admin-tema") as Tema) ?? "dark";
    setTema(saved);
    applyTema(saved);

    // If localStorage had nothing, sync from DB
    if (!localStorage.getItem("admin-tema")) {
      fetch("/api/admin/perfil")
        .then((r) => r.json())
        .then((d) => {
          const temaBanco: Tema = d?.tema === "light" ? "light" : "dark";
          localStorage.setItem("admin-tema", temaBanco);
          setTema(temaBanco);
          applyTema(temaBanco);
        })
        .catch(() => {});
    }
  }, []);

  const alternarTema = async () => {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    setTema(novo);
    localStorage.setItem("admin-tema", novo);
    applyTema(novo);
    // Persist to DB in background
    fetch("/api/admin/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema: novo }),
    }).catch(() => {});
  };

  return { tema, alternarTema };
}
