import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Check, ArrowRight, Sparkles, MessageCircle,
  Briefcase, PartyPopper, Camera,
} from "lucide-react";
import Carrossel, { type CarrosselFoto } from "@/components/seo/Carrossel";
import FaqAccordion, { type FaqItem } from "@/components/seo/FaqAccordion";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Maquiagem para Festas e Eventos em Passos MG | Âmbar Beauty Studio",
  description:
    "Maquiagem e penteado para festas, aniversários, eventos corporativos e ocasiões especiais em Passos MG. Agende com facilidade no Âmbar Beauty Studio.",
  alternates: { canonical: `${siteUrl}/ocasioes/eventos` },
  openGraph: {
    title: "Maquiagem para Festas e Eventos em Passos MG | Âmbar Beauty Studio",
    description: "Maquiagem e penteado profissional para festas, aniversários e eventos em Passos MG.",
    type: "website",
  },
};

const DEFAULT_TITULO = "Maquiagem para Eventos em Passos MG";
const DEFAULT_SUBTITULO =
  "De festas de aniversário a eventos corporativos, de ensaios fotográficos a jantares especiais — um look profissional para cada ocasião, criado especialmente para você.";
const DEFAULT_TEXTO = `Todo evento tem o seu tom, e a maquiagem certa transforma qualquer ocasião em um momento ainda mais especial. No Âmbar Beauty Studio, atendemos mulheres que querem chegar ao evento com o visual impecável — sem a correria de tentar se maquiar em casa na última hora.

Cada tipo de evento pede um look diferente: um aniversário pede brilho e personalidade; um evento corporativo pede sofisticação discreta; um ensaio fotográfico exige produtos que fotografem bem sob qualquer luz. Nossa equipe entende essas nuances e adapta a maquiagem e o penteado ao estilo do evento e ao seu gosto pessoal.

Atendemos tanto no studio em Passos MG quanto em locação para grupos. Para festas em que várias convidadas desejam se produzir juntas — como aniversários de debutante e confraternizações — é possível montar um cronograma de atendimento em grupo. Entre em contato para mais informações.`;

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "Quais tipos de eventos vocês atendem?",
    answer:
      "Atendemos todos os tipos de evento: festas de aniversário (15 anos, adulto, debutante), eventos corporativos, ensaios fotográficos, jantares especiais, apresentações artísticas e muito mais. Se você tem um evento especial, temos o look ideal para ele.",
  },
  {
    question: "Posso agendar atendimento em grupo para um aniversário?",
    answer:
      "Sim! Atendemos grupos para festas de aniversário e outros eventos. É necessário organizar o cronograma com antecedência. Entre em contato pelo WhatsApp para planejar o atendimento em grupo.",
  },
  {
    question: "Qual o tempo de duração do atendimento para eventos?",
    answer:
      "A maquiagem social dura em média 45 a 60 minutos. O penteado varia de 30 a 60 minutos dependendo do estilo. Para eventos com hora marcada, sempre recomendamos agendar com folga no horário.",
  },
  {
    question: "A maquiagem dura o evento todo?",
    answer:
      "Sim! Trabalhamos com produtos de alta fixação e longa duração. Uma maquiagem bem feita pode durar 8 a 12 horas dependendo do tipo de pele e das condições do ambiente.",
  },
];

const PARA_QUEM = [
  { icon: Briefcase, titulo: "Eventos Corporativos", descricao: "Sofisticação e elegância para confraternizações, premiações, congressos e eventos profissionais." },
  { icon: PartyPopper, titulo: "Festas e Celebrações", descricao: "Brilho, personalidade e durabilidade para aniversários, 15 anos e qualquer celebração especial." },
  { icon: Camera, titulo: "Ensaios e Books", descricao: "Maquiagem profissional que fotografia bem sob qualquer iluminação, para books e ensaios artísticos." },
  { icon: Sparkles, titulo: "Ocasiões Especiais", descricao: "Para jantares, encontros e qualquer momento em que você quer se sentir extraordinária." },
];

interface GaleriaRow { id: string; imagem_url: string; titulo: string | null; tipo_exibicao: string | null; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConteudoRow = Record<string, any> | null;

async function getData() {
  try {
    const db = createServerSupabaseClient();
    const [conteudoRes, galeriaRes, configRes] = await Promise.allSettled([
      db.from("conteudo_paginas").select("*").eq("pagina", "eventos").single(),
      db.from("galeria").select("id, imagem_url, titulo, tipo_exibicao").eq("pagina", "eventos").eq("ativo", true).order("ordem", { ascending: true }),
      db.from("admin_config").select("whatsapp, nome_studio").limit(1).single(),
    ]);
    const conteudo: ConteudoRow = conteudoRes.status === "fulfilled" ? conteudoRes.value.data : null;
    const galeria: GaleriaRow[] = galeriaRes.status === "fulfilled" ? (galeriaRes.value.data ?? []) : [];
    const config = configRes.status === "fulfilled" ? configRes.value.data : null;
    return { conteudo, galeria, config };
  } catch {
    return { conteudo: null, galeria: [], config: null };
  }
}

export default async function EventosPage() {
  const { conteudo, galeria, config } = await getData();
  const titulo: string = conteudo?.titulo ?? DEFAULT_TITULO;
  const subtitulo: string = conteudo?.subtitulo ?? DEFAULT_SUBTITULO;
  const textoPrincipal: string = conteudo?.texto_principal ?? DEFAULT_TEXTO;
  let faqs: FaqItem[] = DEFAULT_FAQS;
  if (conteudo?.faq) {
    try {
      const parsed = typeof conteudo.faq === "string" ? JSON.parse(conteudo.faq) : conteudo.faq;
      if (Array.isArray(parsed) && parsed.length > 0) faqs = parsed;
    } catch { /* keep default */ }
  }
  const heroFoto = galeria.find((f) => f.tipo_exibicao === "hero") ?? null;
  const carrosselFotos: CarrosselFoto[] = galeria.filter((f) => f.tipo_exibicao === "carrossel").map(({ id, imagem_url, titulo: t }) => ({ id, url: imagem_url, titulo: t }));
  const gridFotos = galeria.filter((f) => f.tipo_exibicao === "grid").slice(0, 6);
  const wanum = config?.whatsapp?.replace(/\D/g, "") ?? "";
  const waUrl = wanum ? `https://wa.me/55${wanum}?text=${encodeURIComponent("Olá! Gostaria de informações sobre maquiagem para um evento especial.")}` : "#";

  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Ocasiões", item: `${siteUrl}/ocasioes` }, { "@type": "ListItem", position: 3, name: "Eventos", item: `${siteUrl}/ocasioes/eventos` }] };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const imageGallerySchema = carrosselFotos.length > 0 ? { "@context": "https://schema.org", "@type": "ImageGallery", name: "Maquiagem para Eventos — Nosso Trabalho", associatedMedia: carrosselFotos.map((f) => ({ "@type": "ImageObject", contentUrl: f.url, description: f.titulo ?? "Maquiagem para eventos - Âmbar Beauty Studio - Passos MG" })) } : null;

  return (
    <div className="bg-white text-neutral-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HERO ── */}
      <section className="relative min-h-[420px] md:min-h-[500px] flex items-center" style={heroFoto ? { backgroundImage: `url(${heroFoto.imagem_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        {heroFoto ? <div className="absolute inset-0 bg-black/55" /> : <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800" />}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-5 py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-5"><ol className="flex items-center gap-2 text-sm text-white/70 flex-wrap"><li><Link href="/" className="hover:text-white transition-colors">Início</Link></li><li className="text-white/40">/</li><li><Link href="/ocasioes" className="hover:text-white transition-colors">Ocasiões</Link></li><li className="text-white/40">/</li><li className="text-white/90">Eventos</li></ol></nav>
          <h1 className="font-display text-4xl md:text-5xl text-white font-semibold leading-tight mb-3 max-w-2xl">{titulo}</h1>
          <p className="text-lg text-white/80 mb-6 max-w-xl font-sans">{subtitulo}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/agendar" className="inline-flex items-center gap-2 bg-[#C9A84C] text-black font-semibold rounded-lg px-6 py-3 text-sm hover:bg-[#E2C97E] transition-colors"><Sparkles size={15} />Agendar agora</Link>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/50 text-white rounded-lg px-6 py-3 text-sm hover:bg-white/10 transition-colors font-sans"><MessageCircle size={15} />Falar pelo WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ── CARROSSEL ── */}
      <section className="bg-white py-16">
        {imageGallerySchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGallerySchema) }} />}
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">Galeria</p>
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">Nosso Trabalho</h2>
            <p className="text-neutral-500 font-sans mt-2 text-sm">Cada detalhe feito para você</p>
          </div>
          <Carrossel fotos={carrosselFotos} />
        </div>
      </section>

      {/* ── SOBRE + CTA CARD (sem preço) ── */}
      <section className="bg-white border-t border-neutral-100 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3 order-2 lg:order-1">
              <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">Sobre o serviço</p>
              <h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold mb-6">Maquiagem para qualquer evento</h2>
              <div className="space-y-4">{textoPrincipal.split("\n\n").map((para, i) => <p key={i} className="text-neutral-600 leading-relaxed font-sans">{para}</p>)}</div>
              <ul className="mt-8 space-y-3">{["Make adaptado ao estilo e horário do evento","Produtos de alta fixação e longa duração","Atendimento individual ou em grupo","Horários flexíveis para se encaixar na sua agenda"].map((item) => <li key={item} className="flex items-center gap-3 text-neutral-700 font-sans text-sm"><Check size={16} className="text-[#C9A84C] shrink-0" strokeWidth={2.5} />{item}</li>)}</ul>
            </div>
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
                <p className="font-semibold text-neutral-900 text-lg mb-1">Maquiagem para Eventos</p>
                <p className="text-neutral-500 font-sans text-sm mb-5">Consulte disponibilidade</p>
                <hr className="border-neutral-100 mb-5" />
                <Link href="/agendar" className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] text-black font-semibold rounded-lg py-3 text-sm hover:bg-[#E2C97E] transition-colors mb-3"><Sparkles size={14} />Agendar agora</Link>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full border border-[#C9A84C] text-[#C9A84C] rounded-lg py-3 text-sm hover:bg-[rgba(201,168,76,0.06)] transition-colors font-sans"><MessageCircle size={14} />Tirar dúvidas</a>
                <p className="text-xs text-neutral-400 text-center mt-4 font-sans">Agendamento 100% online · Sem taxa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM ── */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10"><p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">Indicações</p><h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">Para quem é ideal?</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{PARA_QUEM.map(({ icon: Icon, titulo: t, descricao }) => <div key={t} className="bg-white rounded-xl p-5 border border-neutral-100 hover:border-[rgba(201,168,76,0.4)] hover:shadow-sm transition-all"><Icon size={24} className="text-[#C9A84C] mb-3" strokeWidth={1.5} /><p className="font-semibold text-neutral-800 text-sm mb-1.5">{t}</p><p className="text-neutral-500 text-xs leading-relaxed font-sans">{descricao}</p></div>)}</div>
        </div>
      </section>

      {/* ── GRID ── */}
      {gridFotos.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-5">
            <div className="mb-8"><p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">Portfólio</p><h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">Mais trabalhos</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{gridFotos.map((foto) => { const alt = foto.titulo ?? "Maquiagem para eventos - Âmbar Beauty Studio - Passos MG"; return <div key={foto.id}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ImageObject", contentUrl: foto.imagem_url, description: alt }) }} /><div className="relative aspect-square rounded-xl overflow-hidden group"><Image src={foto.imagem_url} alt={alt} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" sizes="(max-width: 768px) 50vw, 33vw" unoptimized />{foto.titulo && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end"><p className="px-3 pb-3 text-white text-xs font-sans opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">{foto.titulo}</p></div>}</div></div>; })}</div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="bg-white border-t border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10"><p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-2">Dúvidas</p><h2 className="font-display text-3xl md:text-4xl text-neutral-900 font-semibold">Perguntas frequentes</h2><p className="text-neutral-500 font-sans text-sm mt-2">Tudo o que você precisa saber antes de agendar</p></div>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-neutral-900 py-16">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white font-semibold mb-3">Pronta para arrasar?</h2>
          <p className="text-white/70 font-sans mb-8 max-w-md mx-auto">Agende sua maquiagem para eventos em Passos MG com facilidade</p>
          <Link href="/agendar" className="inline-flex items-center gap-2 bg-[#C9A84C] text-black font-semibold rounded-lg px-8 py-4 text-sm hover:bg-[#E2C97E] transition-colors"><Sparkles size={16} />Agendar agora<ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ── LINKS ── */}
      <section className="bg-neutral-50 py-12">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-neutral-500 text-sm uppercase tracking-wider font-sans text-center mb-8">Conheça também</p>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
            {[{ label: "Maquiagem Social", descricao: "Para festas, eventos e ocasiões especiais", href: "/servicos/maquiagem-social" }, { label: "Babyliss", descricao: "Ondas naturais e duradouras", href: "/servicos/babyliss" }, { label: "Penteado", descricao: "Coque, trança e ondas profissionais", href: "/servicos/penteado" }].map((item) => (
              <Link key={item.href} href={item.href} className="flex-shrink-0 w-56 snap-start bg-white border border-neutral-200 rounded-xl p-4 hover:border-[#C9A84C] transition-colors group">
                <p className="font-semibold text-neutral-800 text-sm group-hover:text-[#C9A84C] transition-colors mb-1">{item.label}</p>
                <p className="text-neutral-500 text-xs font-sans mb-3">{item.descricao}</p>
                <span className="text-[#C9A84C] text-xs font-sans flex items-center gap-1">Ver mais <ArrowRight size={12} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
