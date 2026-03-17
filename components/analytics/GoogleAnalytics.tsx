"use client";

import Script from "next/script";

// AÇÃO NECESSÁRIA: Adicionar NEXT_PUBLIC_GA_MEASUREMENT_ID nas variáveis de
// ambiente da Vercel após criar conta no GA4 em analytics.google.com →
// criar propriedade → copiar Measurement ID (G-XXXXXXXX)
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_ID || GA_ID === "G-XXXXXXXXXX") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
