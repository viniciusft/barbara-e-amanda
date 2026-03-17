import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Âmbar Beauty Studio | Maquiagem e Penteado em Passos MG",
    template: "%s | Âmbar Beauty Studio — Passos MG",
  },
  description:
    "Studio de maquiagem e penteado em Passos MG. Maquiagem social, noiva, penteado, babyliss e combos. Agende online com facilidade!",
  keywords: [
    "maquiagem passos mg",
    "penteado passos mg",
    "maquiagem social passos",
    "babyliss passos",
    "studio beleza passos minas gerais",
  ],
  authors: [{ name: "Âmbar Beauty Studio" }],
  creator: "Âmbar Beauty Studio",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Âmbar Beauty Studio",
    title: "Âmbar Beauty Studio | Maquiagem e Penteado em Passos MG",
    description: "Studio de maquiagem e penteado em Passos MG. Agende online!",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "BeautySalon"],
  name: "Âmbar Beauty Studio",
  description:
    "Studio especializado em maquiagem social, maquiagem de noiva, penteados, babyliss e combos maquiagem + penteado em Passos, MG.",
  url: siteUrl,
  telephone: "",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Passos",
    addressRegion: "MG",
    addressCountry: "BR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -20.7189,
    longitude: -46.6108,
  },
  areaServed: {
    "@type": "City",
    name: "Passos",
  },
  priceRange: "$$",
  hasMap: "",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "09:00",
      closes: "14:00",
    },
  ],
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = headers().get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="pt-BR">
      <head>
        {/* Anti-FOUC: apply admin theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==='/admin'||p.startsWith('/admin/')){var t=localStorage.getItem('admin-tema')||'dark';document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {!isAdmin && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        )}
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#F5F0E8]">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
