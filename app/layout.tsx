import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Amanda & Barbara — Beleza com Elegância",
  description: "Agende seu horário de maquiagem e cabelo com Amanda e Barbara. Experiência de beleza exclusiva e personalizada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#F5F0E8]">
        {children}
      </body>
    </html>
  );
}
