"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, Scissors, Clock, Ban, User, LogOut, TrendingUp } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Agenda", icon: CalendarDays, exact: true },
  { href: "/admin/financeiro", label: "Financeiro", icon: TrendingUp, exact: false },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors, exact: false },
  { href: "/admin/horarios", label: "Horários", icon: Clock, exact: false },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: Ban, exact: false },
  { href: "/admin/perfil", label: "Perfil", icon: User, exact: false },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  mobile,
}: (typeof NAV_LINKS)[0] & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-sans transition-colors ${
          active ? "text-[#C9A84C]" : "text-[rgba(245,240,232,0.35)]"
        }`}
      >
        <Icon size={18} strokeWidth={1.5} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-colors rounded-sm ${
        active
          ? "bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
          : "text-[rgba(245,240,232,0.45)] hover:text-[rgba(245,240,232,0.8)] hover:bg-[rgba(255,255,255,0.03)]"
      }`}
    >
      <Icon size={16} strokeWidth={1.5} />
      {label}
    </Link>
  );
}

export default function AdminNav() {
  return (
    <>
      {/* SIDEBAR (desktop) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-[#0d0d0d] border-r border-[rgba(201,168,76,0.12)] z-40">
        <div className="px-6 py-6 border-b border-[rgba(201,168,76,0.1)]">
          <p className="text-[#C9A84C] text-[9px] tracking-[0.4em] uppercase font-sans mb-1">
            Admin
          </p>
          <h1 className="font-display text-lg text-[#F5F0E8] font-light leading-snug">
            Studio Amanda
            <br />& Barbara
          </h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[rgba(201,168,76,0.1)]">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-sans text-[rgba(245,240,232,0.3)] hover:text-[rgba(245,240,232,0.6)] transition-colors rounded-sm"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border-b border-[rgba(201,168,76,0.15)]">
        <div>
          <p className="text-[#C9A84C] text-[8px] tracking-[0.4em] uppercase font-sans">
            Admin
          </p>
          <h1 className="font-display text-base text-[#F5F0E8] font-light leading-tight">
            Studio Amanda & Barbara
          </h1>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-[rgba(245,240,232,0.35)] hover:text-[#C9A84C] transition-colors p-1"
        >
          <LogOut size={18} strokeWidth={1.5} />
        </button>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0d0d] border-t border-[rgba(201,168,76,0.15)] flex">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} mobile />
        ))}
      </nav>
    </>
  );
}
