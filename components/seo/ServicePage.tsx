import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServicePageProps {
  // Meta / Schema
  serviceName: string;
  serviceDescription: string;
  serviceUrl: string;
  // Hero
  heroTitle: string; // H1
  heroSubtitle: string;
  // Sections
  whatIsText: string; // 150-200 words
  idealFor: string[]; // list of occasions
  howItWorks: string[]; // steps
  faqs: FaqItem[];
  // CTA
  ctaLabel: string; // e.g. "Agendar maquiagem de noiva agora"
  // Breadcrumb
  breadcrumb: { name: string; url: string }[];
}

export default function ServicePage({
  serviceName,
  serviceDescription,
  serviceUrl,
  heroTitle,
  heroSubtitle,
  whatIsText,
  idealFor,
  howItWorks,
  faqs,
  ctaLabel,
  breadcrumb,
}: ServicePageProps) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: {
      "@type": "BeautySalon",
      name: "Âmbar Beauty Studio",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Passos",
        addressRegion: "MG",
        addressCountry: "BR",
      },
    },
    areaServed: "Passos, MG",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb nav */}
      <nav className="max-w-5xl mx-auto px-5 pt-6 pb-2">
        <ol className="flex items-center gap-2 text-xs font-sans text-[#F5F0E8]/40 flex-wrap">
          {breadcrumb.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {i < breadcrumb.length - 1 ? (
                <Link href={item.url} className="hover:text-[#C9A84C] transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className="text-[#F5F0E8]/70">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-4">
            Âmbar Beauty Studio · Passos MG
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-[#F5F0E8] font-light leading-tight mb-6">
            {heroTitle}
          </h1>
          <p className="text-[#F5F0E8]/60 font-sans text-lg leading-relaxed mb-10">
            {heroSubtitle}
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-3 bg-[#C9A84C] text-[#0a0a0a] px-8 py-4 font-sans font-semibold text-sm uppercase tracking-widest hover:bg-[#E2C97E] transition-colors rounded-btn"
          >
            <Sparkles size={16} />
            Agendar agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 space-y-20 pb-20">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.3)] to-transparent" />

        {/* ── O que é ────────────────────────────────────────────────── */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
            Sobre o serviço
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-8">
            O que é {serviceName}?
          </h2>
          <div className="max-w-3xl">
            {whatIsText.split("\n\n").map((para, i) => (
              <p key={i} className="text-[#F5F0E8]/65 font-sans text-base leading-relaxed mb-4">
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* ── Para quem é ideal ──────────────────────────────────────── */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
            Indicações
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-8">
            Para quem é ideal?
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {idealFor.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-4"
              >
                <span className="text-[#C9A84C] mt-0.5 shrink-0">✦</span>
                <span className="text-[#F5F0E8]/70 font-sans text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Como funciona ──────────────────────────────────────────── */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
            Passo a passo
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-8">
            Como funciona o atendimento?
          </h2>
          <ol className="space-y-4">
            {howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-5">
                <span className="shrink-0 w-9 h-9 rounded-full border border-[rgba(201,168,76,0.4)] text-[#C9A84C] font-display text-lg flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-[#F5F0E8]/70 font-sans text-sm leading-relaxed pt-1.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Galeria placeholder ────────────────────────────────────── */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
            Galeria
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-8">
            Nosso trabalho
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="aspect-square bg-[#111] border border-[rgba(201,168,76,0.1)] rounded-card flex items-center justify-center"
              >
                <div className="text-center">
                  <Sparkles size={24} className="text-[rgba(201,168,76,0.2)] mx-auto mb-2" strokeWidth={1} />
                  <p className="text-[#F5F0E8]/15 text-[10px] font-sans">foto em breve</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.3)] to-transparent" />

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
            Dúvidas
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-8">
            Perguntas frequentes
          </h2>
          <div className="max-w-3xl space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                  <span className="font-sans font-medium text-sm text-[#F5F0E8]/90">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className="text-[#C9A84C] shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-5 pb-5 text-[#F5F0E8]/55 font-sans text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA Final ──────────────────────────────────────────────── */}
        <section className="border border-[rgba(201,168,76,0.2)] bg-[#111] rounded-card p-10 md:p-16 text-center">
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-4">
            Âmbar Beauty Studio · Passos MG
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-4">
            Pronta para se sentir incrível?
          </h2>
          <p className="text-[#F5F0E8]/50 font-sans text-sm mb-8 max-w-md mx-auto">
            Agende agora pelo nosso sistema online. Rápido, fácil e sem precisar ligar.
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-3 bg-[#C9A84C] text-[#0a0a0a] px-8 py-4 font-sans font-semibold text-sm uppercase tracking-widest hover:bg-[#E2C97E] transition-colors rounded-btn"
          >
            <Sparkles size={16} />
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
