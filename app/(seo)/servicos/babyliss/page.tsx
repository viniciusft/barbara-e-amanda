import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Clock, Check, ArrowRight, Sparkles, MessageCircle,
  PartyPopper, Briefcase, Camera,
} from "lucide-react";
import Carrossel, { type CarrosselFoto } from "@/components/seo/Carrossel";
import FaqAccordion, { type FaqItem } from "@/components/seo/FaqAccordion";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-static";

const SLUG = "babyliss";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

// ── Static metadata ───────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Babyliss em Passos MG — Cabelo com Ondas Perfeitas | Âmbar Beauty Studio",
  description:
    "Babyliss profissional em Passos MG. Ondas perfeitas, naturais e duradouras para qualquer ocasião. Agende no Âmbar Beauty Studio.",
  alternates: {
    canonical: `${siteUrl}/servicos/babyliss`,
  },
  openGraph: {
    title: "Babyliss em Passos MG — Cabelo com Ondas Perfeitas | Âmbar Beauty Studio",
    description: "Babyliss profissional em Passos MG. Ondas perfeitas, naturais e duradouras para qualquer ocasião.",
    type: "website",
  },
};

// ── Fallback content ──────────────────────────────────────────────────────────

const DEFAULT_TITULO = "Babyliss em Passos MG — Ondas Perfeitas";
const DEFAULT_SUBTITULO =
  "Ondas naturais, volumosas e duradouras que transformam qualquer visual. O babyliss profissional é o toque final que faz toda a diferença no seu look.";
const DEFAULT_TEXTO = `O babyliss é uma técnica de ondulação de cabelo que utiliza um modelador de cachos ou ondas para criar ondas e cachos com aspecto natural e longa duração. Diferente da chapinha ou do secador comum, o babyliss cria volume, movimento e textura de forma suave e controlada.

Existem diferentes tipos de onda: ondas soltas e naturais, cachos definidos, beach waves e ondas soft para eventos formais. Cada estilo é adaptado ao seu tipo de cabelo e à ocasião, sempre com protetor térmico profissional para preservar a saúde dos fios.

No Âmbar Beauty Studio, o babyliss é feito com protetor térmico profissional para preservar a saúde do cabelo, e fixado com produtos que garantem durabilidade por horas. O resultado é um cabelo com movimento, brilho e um acabamento que eleva qualquer produção.`;

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "Quanto tempo dura o babyliss?",
    answer:
      "Com os produtos certos e dependendo do tipo de cabelo, o babyliss pode durar de 6 a 12 horas. Cabelos naturalmente mais lisos podem perder as ondas mais rápido — nesses casos, usamos técnicas de preparação e fixação específicas para prolongar a durabilidade.",
  },
  {
    question: "Precisa usar algum produto no cabelo antes?",
    answer:
      "Não é necessário usar produto antes. Chegue com o cabelo limpo e seco. Nossa profissional aplica o protetor térmico profissional antes de iniciar o processo.",
  },
  {
    question: "O babyliss serve para cabelo liso?",
    answer:
      "Sim! Na verdade, o babyliss é especialmente popular em quem tem cabelo liso, pois adiciona volume, movimento e textura de forma rápida. Para cabelos muito lisos, usamos técnicas de fixação adicionais.",
  },
  {
    question: "Qual a diferença entre babyliss e ondas com chapinha?",
    answer:
      "O babyliss cria ondas cilíndricas, mais naturais e com mais volume. A chapinha cria ondas mais planas e angulares. O babyliss tende a dar um resultado mais 'solto' e descontraído.",
  },
  {
    question: "Qual o valor do babyliss?",
    answer:
      "O valor varia conforme o comprimento e o volume do cabelo. Para verificar os preços atualizados e disponibilidade, acesse nosso sistema de agendamento online.",
  },
];

const PARA_QUEM = [
  {
    icon: PartyPopper,
    titulo: "Festas e Eventos",
    descricao: "Para aniversários, casamentos e celebrações em que o visual precisa estar impecável.",
  },
  {
    icon: Briefcase,
    titulo: "Eventos Corporativos",
    descricao: "Ondas sofisticadas e elegantes para confraternizações, premiações e eventos profissionais.",
  },
  {
    icon: Camera,
    titulo: "Ensaios Fotográficos",
    descricao: "Movimento e volume que fotografam lindamente em qualquer tipo de iluminação.",
  },
  {
    icon: Sparkles,
    titulo: "Encontros Especiais",
    descricao: "Para jantares, encontros e qualquer ocasião em que você quer se sentir especial.",
  },
];

// ── Data fetching ─────────────────────────────────────────────────────────────

interface GaleriaRow {
  id: string;
  imagem_url: string;
  titulo: string | null;
  tipo_exibicao: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConteudoRow = Record<string, any> | null;

async function getData() {
  try {
    const db = createServerSupabaseClient();

    const [conteudoRes, galeriaRes, configRes] = await Promise.allSettled([
      db
        .from("conteudo_paginas")
        .select("*, servico:servico_id(preco, duracao_minutos)")
        .eq("pagina", SLUG)
        .single(),
      db
        .from("galeria")
        .select("id, imagem_url, titulo, tipo_exibicao")
        .eq("pagina", SLUG)
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
      db.from("admin_config").select("whatsapp, nome_studio").limit(1).single(),
    ]);

    const rawConteudo =
      conteudoRes.status === "fulfilled" ? conteudoRes.value.data : null;
    const conteudo: ConteudoRow = rawConteudo;
    const galeria: GaleriaRow[] =
      galeriaRes.status === "fulfilled" ? (galeriaRes.value.data ?? []) : [];
    const config =
      configRes.status === "fulfilled" ? configRes.value.data : null;
    const servico = rawConteudo?.servico ?? null;

    return { conteudo, galeria, config, servico };
  } catch {
    return { conteudo: null, galeria: [], config: null, servico: null };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BabylissPage() {
  const { conteudo, galeria, config, servico } = await getData();

  // Derived content (with fallbacks)
  const titulo: string = conteudo?.titulo ?? DEFAULT_TITULO;
  const subtitulo: string = conteudo?.subtitulo ?? DEFAULT_SUBTITULO;
  const textoPrincipal: string = conteudo?.texto_principal ?? DEFAULT_TEXTO;
  const preco: number = servico?.preco ?? conteudo?.preco_a_partir_de ?? 80;
  const duracao: number = servico?.duracao_minutos ?? 45;

  // Parse FAQ from conteudo (JSONB column) or fallback
  let faqs: FaqItem[] = DEFAULT_FAQS;
  if (conteudo?.faq) {
    try {
      const parsed =
        typeof conteudo.faq === "string" ? JSON.parse(conteudo.faq) : conteudo.faq;
      if (Array.isArray(parsed) && parsed.length > 0) faqs = parsed;
    } catch { /* keep default */ }
  }

  // Separate gallery by tipo_exibicao
  const heroFoto = galeria.find((f) => f.tipo_exibicao === "hero") ?? null;
  const carrosselFotos: CarrosselFoto[] = galeria
    .filter((f) => f.tipo_exibicao === "carrossel")
    .map(({ id, imagem_url, titulo: t }) => ({ id, url: imagem_url, titulo: t }));
  const gridFotos = galeria.filter((f) => f.tipo_exibicao === "grid").slice(0, 6);

  // WhatsApp
  const wanum = config?.whatsapp?.replace(/\D/g, "") ?? "";
  const waUrl = wanum
    ? `https://wa.me/55${wanum}?text=${encodeURIComponent("Olá! Gostaria de informações sobre babyliss.")}`
    : "#";

  // ── JSON-LD schemas ──────────────────────────────────────────────────────────

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Serviços", item: `${siteUrl}/servicos` },
      {
        "@type": "ListItem",
        position: 3,
        name: "Babyliss",
        item: `${siteUrl}/servicos/babyliss`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const imageGallerySchema =
    carrosselFotos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Babyliss — Resultados com babyliss",
          associatedMedia: carrosselFotos.map((f) => ({
            "@type": "ImageObject",
            contentUrl: f.url,
            description: f.titulo ?? "Babyliss - Âmbar Beauty Studio - Passos MG",
          })),
        }
      : null;

  return (
    <div className="bg-white text-neutral-800">
      {/* Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 1 — HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[420px] md:min-h-[500px] flex items-center"
        style={
          heroFoto
            ? {
                backgroundImage: `url(${heroFoto.imagem_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Background overlay */}
        {heroFoto ? (
          <div className="absolute inset-0 bg-black/55" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800" />
        )}

        <div className="relative z-10 w-full max-w-5xl mx-auto px-5 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-2 text-sm text-white/70 flex-wrap">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li className="text-white/40">/</li>
              <li>
                <Link href="/servicos" className="hover:text-white transition-colors">
                  Serviços
                </Link>
              </li>
              <li className="text-white/40">/</li>
              <li className="text-white/90">Babyliss</li>
            </ol>
          </nav>

          <h1 className="font-display text-4xl md:text-5xl text-white font-semibold leading-tight mb-3 max-w-2xl">
            {titulo}
          </h1>
          <p className="text-lg text-white/80 mb-6 max-w-xl font-sans">{subtitulo}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 bg-[#C9A84C] text-black font-semibold rounded-lg px-6 py-3 text-sm hover:bg-[#E2C97E] transition-colors"
            >
              <Sparkles size={15} />
              Agendar agora
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/50 text-white rounded-lg px-6 py-3 text-sm hover:bg-white/10 transition-colors font-sans"
            >
              <MessageCircle size={15} />
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 2 — CARROSSEL DE FOTOS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        {imageGallerySchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGallerySchema) }}
          />
        )}
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">
              Galeria
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">
              Resultados com babyliss
            </h2>
            <p className="text-neutral-500 font-sans mt-2 text-sm">
              Cada detalhe feito para você
            </p>
          </div>
          <Carrossel fotos={carrosselFotos} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 3 — SOBRE + CARD DE AGENDAMENTO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-neutral-100 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Text — second on mobile, first on desktop */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
                Sobre o serviço
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold mb-6">
                O que é babyliss?
              </h2>
              <div className="space-y-4">
                {textoPrincipal.split("\n\n").map((para, i) => (
                  <p key={i} className="text-neutral-600 leading-relaxed font-sans">
                    {para}
                  </p>
                ))}
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Protetor térmico profissional incluído",
                  "Diferentes tipos de onda para cada ocasião",
                  "Produtos de fixação de longa duração",
                  "Resultado com movimento, brilho e volume",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-neutral-700 font-sans text-sm">
                    <Check size={16} className="text-[#C9A84C] shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Booking card — first on mobile for conversion */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
                <p className="font-semibold text-neutral-900 text-lg mb-1">
                  Babyliss
                </p>
                <p className="text-2xl font-bold text-[#C9A84C] mb-4">
                  A partir de R$&nbsp;{preco}
                </p>
                <div className="flex items-center gap-2 text-neutral-500 text-sm font-sans mb-5">
                  <Clock size={15} className="text-[#C9A84C]" />
                  {duracao} minutos de atendimento
                </div>
                <hr className="border-neutral-100 mb-5" />
                <Link
                  href="/agendar"
                  className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] text-black font-semibold rounded-lg py-3 text-sm hover:bg-[#E2C97E] transition-colors mb-3"
                >
                  <Sparkles size={14} />
                  Agendar agora
                </Link>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-[#C9A84C] text-[#C9A84C] rounded-lg py-3 text-sm hover:bg-[rgba(201,168,76,0.06)] transition-colors font-sans"
                >
                  <MessageCircle size={14} />
                  Tirar dúvidas
                </a>
                <p className="text-xs text-neutral-400 text-center mt-4 font-sans">
                  Agendamento 100% online · Sem taxa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 4 — PARA QUEM É IDEAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">
              Indicações
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">
              Para quem é ideal?
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PARA_QUEM.map(({ icon: Icon, titulo: t, descricao }) => (
              <div
                key={t}
                className="bg-white rounded-xl p-5 border border-neutral-100 hover:border-[rgba(201,168,76,0.4)] hover:shadow-sm transition-all"
              >
                <Icon size={24} className="text-[#C9A84C] mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-neutral-800 text-sm mb-1.5">{t}</p>
                <p className="text-neutral-500 text-xs leading-relaxed font-sans">{descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 5 — GRID DE FOTOS (só renderiza se houver fotos tipo "grid")
      ═══════════════════════════════════════════════════════════════════════ */}
      {gridFotos.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-5">
            <div className="mb-8">
              <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">
                Portfólio
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">
                Mais trabalhos
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gridFotos.map((foto) => {
                const alt = foto.titulo ?? "Babyliss - Âmbar Beauty Studio - Passos MG";
                return (
                  <div key={foto.id}>
                    <script
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                          "@context": "https://schema.org",
                          "@type": "ImageObject",
                          contentUrl: foto.imagem_url,
                          description: alt,
                        }),
                      }}
                    />
                    <div className="relative aspect-square rounded-xl overflow-hidden group">
                      <Image
                        src={foto.imagem_url}
                        alt={alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        unoptimized
                      />
                      {foto.titulo && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                          <p className="px-3 pb-3 text-white text-xs font-sans opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                            {foto.titulo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 6 — FAQ
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">
              Dúvidas
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">
              Perguntas frequentes
            </h2>
            <p className="text-neutral-500 font-sans text-sm mt-2">
              Tudo o que você precisa saber antes de agendar
            </p>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 7a — CTA FINAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-900 py-16">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">
            Pronta para arrasar?
          </h2>
          <p className="text-white/70 font-sans mb-8 max-w-md mx-auto">
            Agende seu babyliss em Passos MG com facilidade
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 bg-[#C9A84C] text-black font-semibold rounded-lg px-8 py-4 text-sm hover:bg-[#E2C97E] transition-colors"
          >
            <Sparkles size={16} />
            Agendar agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÃO 7b — LINKS PARA OUTROS SERVIÇOS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-50 py-12">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-neutral-500 text-sm uppercase tracking-wider font-sans text-center mb-8">
            Conheça também
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
            {[
              {
                label: "Maquiagem Social",
                descricao: "Para festas, eventos e ocasiões especiais",
                href: "/servicos/maquiagem-social",
              },
              {
                label: "Penteado",
                descricao: "Coque, trança e ondas profissionais",
                href: "/servicos/penteado",
              },
              {
                label: "Maquiagem + Penteado",
                descricao: "Combo completo em um só atendimento",
                href: "/servicos/maquiagem-e-penteado",
              },
              {
                label: "Maquiagem de Noiva",
                descricao: "Atendimento exclusivo com teste prévio",
                href: "/servicos/maquiagem-noiva",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 w-56 snap-start bg-white border border-neutral-200 rounded-xl p-4 hover:border-[#C9A84C] transition-colors group"
              >
                <p className="font-semibold text-neutral-800 text-sm group-hover:text-[#C9A84C] transition-colors mb-1">
                  {item.label}
                </p>
                <p className="text-neutral-500 text-xs font-sans mb-3">{item.descricao}</p>
                <span className="text-[#C9A84C] text-xs font-sans flex items-center gap-1">
                  Ver mais <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
