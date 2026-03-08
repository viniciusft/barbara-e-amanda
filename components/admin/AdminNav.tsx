"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/admin", label: "Agendamentos" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/horarios", label: "Horários" },
  { href: "/admin/bloqueios", label: "Bloqueios" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[rgba(201,168,76,0.2)] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 border-b border-[rgba(201,168,76,0.1)]">
          <div>
            <p className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-sans">
              Admin
            </p>
            <h1 className="font-display text-xl text-[#F5F0E8] font-light">
              Studio Amanda & Barbara
            </h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-[rgba(245,240,232,0.4)] text-xs font-sans hover:text-[#C9A84C] transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex gap-1 py-2 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-sans whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-[#C9A84C] border-b border-[#C9A84C]"
                    : "text-[rgba(245,240,232,0.5)] hover:text-[rgba(245,240,232,0.8)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
