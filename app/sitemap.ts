import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/agendar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/servicos/maquiagem-social`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/servicos/maquiagem-noiva`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/servicos/penteado`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/servicos/babyliss`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/servicos/maquiagem-e-penteado`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/ocasioes/casamento`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/ocasioes/formatura`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/ocasioes/eventos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
