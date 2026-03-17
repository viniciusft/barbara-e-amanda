"use client";

import Link from "next/link";
import { analytics } from "@/lib/analytics";

// Used in SEO pages (server components) to wrap CTA buttons with analytics tracking.

interface AgendarProps {
  className?: string;
  children: React.ReactNode;
  pagina: string;
}

interface WhatsAppProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  pagina: string;
}

/** Link "Agendar agora" for SEO pages — fires begin_checkout event */
export function SeoAgendarLink({ className, children, pagina }: AgendarProps) {
  return (
    <Link
      href="/agendar"
      className={className}
      onClick={() => analytics.clicouAgendarPaginaSEO(pagina)}
    >
      {children}
    </Link>
  );
}

/** Anchor "Falar pelo WhatsApp" for SEO pages — fires contact/whatsapp event */
export function SeoWhatsAppLink({ href, className, children, pagina }: WhatsAppProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => analytics.clicouWhatsAppPaginaSEO(pagina)}
    >
      {children}
    </a>
  );
}

/** Link "Agendar" for the home page hero/nav — fires begin_checkout/home_cta event */
export function HomeAgendarLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/agendar"
      className={className}
      onClick={() => analytics.clicouAgendar()}
    >
      {children}
    </Link>
  );
}
