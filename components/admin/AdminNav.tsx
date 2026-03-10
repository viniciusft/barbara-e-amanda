"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, Scissors, Clock, Ban, User, LogOut, TrendingUp, Users } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin",            label: "Agenda",     icon: CalendarDays, exact: true  },
  { href: "/admin/financeiro", label: "Financeiro",  icon: TrendingUp,   exact: false },
  { href: "/admin/leads",      label: "Leads",       icon: Users,        exact: false },
  { href: "/admin/servicos",   label: "Serviços",    icon: Scissors,     exact: false },
  { href: "/admin/horarios",   label: "Horários",    icon: Clock,        exact: false },
  { href: "/admin/bloqueios",  label: "Bloqueios",   icon: Ban,          exact: false },
  { href: "/admin/perfil",     label: "Perfil",      icon: User,         exact: false },
];

const PAGE_NAMES: Record<string, string> = {
  "/admin": "Agenda",
  "/admin/financeiro": "Financeiro",
  "/admin/leads": "Leads",
  "/admin/servicos": "Serviços",
  "/admin/horarios": "Horários",
  "/admin/bloqueios": "Bloqueios",
  "/admin/perfil": "Perfil",
};

function NavLink({
  href, label, icon: Icon, exact, mobile,
}: (typeof NAV_LINKS)[0] & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-sans transition-colors ${
          active ? "text-gold" : "text-gray-500 hover:text-gray-300"
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
      className={`flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-sans rounded-btn transition-colors ${
        active
          ? "bg-gold-muted text-gold font-medium shadow-[inset_2px_0_0_#C9A84C]"
          : "text-gray-400 hover:text-white hover:bg-surface-elevated"
      }`}
    >
      <Icon size={20} strokeWidth={1.5} />
      {label}
    </Link>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] ?? "Admin";

  return (
    <>
      {/* SIDEBAR (desktop) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-[#0D0D0D] border-r border-surface-border z-40">
        <div className="px-6 py-6 border-b border-surface-border">
          <p className="text-gold text-[9px] tracking-[0.4em] uppercase font-sans mb-1">
            Admin
          </p>
          <h1 className="font-display text-xl text-gold font-semibold leading-snug">
            Studio Amanda
            <br />& Barbara
          </h1>
        </div>

        <nav className="flex-1 px-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-surface-border">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 mx-2 px-3 py-2.5 w-full text-sm font-sans text-gray-500 hover:text-white hover:bg-surface-elevated rounded-btn transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 bg-surface-card border-b border-surface-border h-14">
        <h1 className="font-sans text-lg font-semibold text-white">{pageName}</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <LogOut size={18} strokeWidth={1.5} />
        </button>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-card border-t border-surface-border flex">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} mobile />
        ))}
      </nav>
    </>
  );
}
