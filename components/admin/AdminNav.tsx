"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  CalendarDays, Scissors, Clock, Ban, User, LogOut,
  TrendingUp, Users, Sun, Moon, Bell, UserRound, LayoutDashboard,
} from "lucide-react";
import { useTema } from "@/hooks/use-tema";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard",   icon: LayoutDashboard, exact: false },
  { href: "/admin",           label: "Agenda",       icon: CalendarDays,    exact: true  },
  { href: "/admin/financeiro",label: "Financeiro",   icon: TrendingUp,      exact: false },
  { href: "/admin/leads",     label: "Leads",        icon: Users,           exact: false },
  { href: "/admin/clientes",  label: "Clientes",     icon: UserRound,       exact: false },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell,         exact: false },
  { href: "/admin/servicos",  label: "Serviços",     icon: Scissors,        exact: false },
  { href: "/admin/horarios",  label: "Horários",     icon: Clock,           exact: false },
  { href: "/admin/bloqueios", label: "Bloqueios",    icon: Ban,             exact: false },
  { href: "/admin/perfil",    label: "Perfil",       icon: User,            exact: false },
];

// Mobile bottom nav: show the most relevant subset
const MOBILE_NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard",    icon: LayoutDashboard, exact: false },
  { href: "/admin",           label: "Agenda",       icon: CalendarDays,    exact: true  },
  { href: "/admin/clientes",  label: "Clientes",     icon: UserRound,       exact: false },
  { href: "/admin/notificacoes", label: "Notif.",    icon: Bell,            exact: false },
  { href: "/admin/financeiro",label: "Finanças",     icon: TrendingUp,      exact: false },
  { href: "/admin/perfil",    label: "Perfil",       icon: User,            exact: false },
];

const PAGE_NAMES: Record<string, string> = {
  "/admin": "Agenda",
  "/admin/dashboard": "Dashboard",
  "/admin/financeiro": "Financeiro",
  "/admin/leads": "Leads",
  "/admin/clientes": "Clientes",
  "/admin/notificacoes": "Notificações",
  "/admin/servicos": "Serviços",
  "/admin/horarios": "Horários",
  "/admin/bloqueios": "Bloqueios",
  "/admin/perfil": "Perfil",
};

function NavLink({
  href, label, icon: Icon, exact, mobile, notifCount,
}: (typeof NAV_LINKS)[0] & { mobile?: boolean; notifCount?: number }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex-1 min-w-[52px] flex flex-col items-center gap-1 py-2 text-[10px] font-sans transition-colors relative ${
          active ? "text-gold" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        <span className="relative">
          <Icon size={18} strokeWidth={1.5} />
          {notifCount != null && notifCount > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-gold text-[#0a0a0a] text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-sans rounded-btn transition-colors relative ${
        active
          ? "bg-gold-muted text-gold font-medium"
          : "text-gray-400 hover:text-foreground hover:bg-surface-elevated"
      }`}
      style={active ? { boxShadow: "var(--shadow-inset-gold)" } : undefined}
    >
      <span className="relative shrink-0">
        <Icon size={20} strokeWidth={1.5} />
        {notifCount != null && notifCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold text-[#0a0a0a] text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {notifCount > 99 ? "99+" : notifCount}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const { tema, alternarTema } = useTema();
  const [notifCount, setNotifCount] = useState(0);

  // Poll notification count every 60s
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/notificacoes?count=1");
        if (res.ok) {
          const data = await res.json();
          setNotifCount(data.count ?? 0);
        }
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Derive page name — handle dynamic routes like /admin/clientes/[id]
  const pageName =
    PAGE_NAMES[pathname] ??
    (pathname.startsWith("/admin/clientes/") ? "Cliente" : "Admin");

  return (
    <>
      {/* SIDEBAR (desktop) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-surface border-r border-surface-border z-40">
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
            <NavLink
              key={link.href}
              {...link}
              notifCount={link.href === "/admin/notificacoes" ? notifCount : undefined}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-surface-border space-y-1">
          <button
            onClick={alternarTema}
            className="flex items-center gap-3 mx-2 px-3 py-2.5 w-full text-sm font-sans text-gray-500 hover:text-gold hover:bg-surface-elevated rounded-btn transition-colors"
            title={tema === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {tema === "dark"
              ? <Sun size={20} strokeWidth={1.5} />
              : <Moon size={20} strokeWidth={1.5} />}
            {tema === "dark" ? "Modo claro" : "Modo escuro"}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 mx-2 px-3 py-2.5 w-full text-sm font-sans text-gray-500 hover:text-foreground hover:bg-surface-elevated rounded-btn transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 bg-surface-card border-b border-surface-border h-14">
        <h1 className="font-sans text-lg font-semibold text-foreground">{pageName}</h1>
        <div className="flex items-center gap-1">
          {/* Bell icon with badge */}
          <Link
            href="/admin/notificacoes"
            className="relative w-9 h-9 rounded-btn flex items-center justify-center text-gray-400 hover:text-gold hover:bg-surface-elevated transition-colors"
          >
            <Bell size={18} strokeWidth={1.5} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 bg-gold text-[#0a0a0a] text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>
          <button
            onClick={alternarTema}
            className="w-9 h-9 rounded-btn flex items-center justify-center text-gray-400 hover:text-gold hover:bg-surface-elevated transition-colors"
          >
            {tema === "dark"
              ? <Sun size={18} strokeWidth={1.5} />
              : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-9 h-9 rounded-btn flex items-center justify-center text-gray-400 hover:text-foreground transition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV — scrollable for smaller screens */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-card border-t border-surface-border flex overflow-x-auto scrollbar-none">
        {MOBILE_NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            {...link}
            mobile
            notifCount={link.href === "/admin/notificacoes" ? notifCount : undefined}
          />
        ))}
      </nav>
    </>
  );
}
