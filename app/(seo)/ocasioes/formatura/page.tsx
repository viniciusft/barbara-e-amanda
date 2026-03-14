import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import ServicePage from "@/components/seo/ServicePage";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Maquiagem para Formatura em Passos MG | Âmbar Beauty Studio",
  description:
    "Maquiagem e penteado para formatura em Passos MG. Look completo para o dia mais especial da sua jornada acadêmica. Agende no Âmbar Beauty Studio.",
  keywords: [
    "maquiagem formatura passos mg",
    "make formatura passos",
    "penteado formatura passos mg",
    "maquiagem colação grau passos",
    "formatura make passos mg",
  ],
  openGraph: {
    title: "Maquiagem para Formatura em Passos MG | Âmbar Beauty Studio",
    description:
      "Look completo para formatura em Passos MG: maquiagem e penteado profissional para o dia mais especial da sua jornada acadêmica. Âmbar Beauty Studio.",
    url: `${siteUrl}/ocasioes/formatura`,
  },
  alternates: { canonical: `${siteUrl}/ocasioes/formatura` },
};

async function getWhatsapp(): Promise<string | null> {
  try {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("admin_config")
      .select("whatsapp")
      .limit(1)
      .single();
    return data?.whatsapp ?? null;
  } catch {
    return null;
  }
}

export default async function FormaturaPage() {
  const whatsapp = await getWhatsapp();
  const whatsappNumber = whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de informações sobre maquiagem e penteado para formatura.")}`
    : null;

  return (
    <>
      <ServicePage
        serviceName="Maquiagem para Formatura"
        serviceDescription="Serviço completo de maquiagem e penteado para formatura em Passos MG. Look impecável e duradouro para a colação de grau e a festa de formatura."
        serviceUrl={`${siteUrl}/ocasioes/formatura`}
        heroTitle="Maquiagem para Formatura em Passos MG"
        heroSubtitle="Anos de dedicação merecem um look à altura. Maquiagem e penteado profissional para a sua formatura — do palco da colação à última foto da festa."
        whatIsText={`A formatura é um marco inesquecível: o fim de uma jornada longa e o início de uma nova fase. E para um momento tão significativo, você merece um look que transmita exatamente isso — conquista, elegância e personalidade.

No Âmbar Beauty Studio, atendemos formatandas que querem chegar à colação de grau e à festa radiantes, com uma maquiagem que dure horas sem retoque e um penteado que resista à emoção e à comemoração. Trabalhamos com diferentes estilos: do look mais clássico e sofisticado ao mais moderno e dramático — sempre respeitando o seu gosto e combinando com o seu vestido.

O atendimento inclui uma consultoria rápida no dia ou um agendamento prévio para alinhar o look. Também atendemos grupos de formatandas, ideal para turmas que querem se produzir juntas e chegar ao evento com a mesma energia.`}
        idealFor={[
          "Formatandas de qualquer curso em Passos MG e região",
          "Quem quer um look clássico e elegante para a colação",
          "Quem prefere make mais ousada e marcante para a festa",
          "Grupos de formatandas que querem se produzir juntas",
          "Quem precisa de make e penteado em combo com horário apertado",
          "Pais, madrinhas e familiares que também querem se produzir para a formatura",
        ]}
        howItWorks={[
          "Agende seu horário pelo sistema online com antecedência — especialmente para turmas que se formam no mesmo período.",
          "No dia do atendimento, chegue com o rosto limpo e hidratado. Informe o estilo do vestido e o visual que deseja.",
          "A maquiagem é aplicada com produtos de longa duração ideais para fotos e para o calor da festa.",
          "Penteado criado para durar horas, resistindo à emoção da colação e ao agito da festa.",
          "Você sai do studio pronta para o seu momento mais celebrado.",
        ]}
        faqs={[
          {
            question: "Posso agendar maquiagem de formatura em cima da hora?",
            answer:
              "Recomendamos agendar com pelo menos 1 semana de antecedência para garantir o horário. Em períodos de alta demanda (outubro a dezembro), os horários lotam rápido. Verifique disponibilidade no nosso sistema online.",
          },
          {
            question: "Atendem várias formatandas da mesma turma no mesmo dia?",
            answer:
              "Sim! Atendemos grupos de formatandas. É importante agendar todas as pessoas juntas e com bastante antecedência para garantir que o cronograma se encaixe antes dos compromissos da formatura. Entre em contato para organizar o grupo.",
          },
          {
            question: "Com quanto tempo de antecedência devo chegar para o atendimento no dia da formatura?",
            answer:
              "Planeje chegar ao studio com a maquiagem e o penteado prontos pelo menos 1 hora antes da colação ou do horário das fotos. O atendimento completo (make + penteado) dura em média 1h30 a 2h.",
          },
          {
            question: "A maquiagem aguenta a emoção e o calor da festa?",
            answer:
              "Sim! Utilizamos produtos de altíssima fixação, à prova d'água e com longa duração. Com os produtos certos, a maquiagem resiste às lágrimas da colação e ao calor e agito da festa por 8 a 12 horas.",
          },
          {
            question: "Qual o valor da maquiagem para formatura?",
            answer:
              "O valor varia conforme os serviços escolhidos (só maquiagem, só penteado ou combo). Entre em contato pelo WhatsApp ou acesse nossa página de agendamento para consultar os valores atualizados.",
          },
        ]}
        ctaLabel="Agendar maquiagem de formatura agora"
        breadcrumb={[
          { name: "Início", url: siteUrl },
          { name: "Ocasiões", url: `${siteUrl}/ocasioes` },
          { name: "Formatura", url: `${siteUrl}/ocasioes/formatura` },
        ]}
      />

      {/* Internal links + WhatsApp CTA */}
      <div className="max-w-5xl mx-auto px-5 pb-20 space-y-10">
        {/* WhatsApp secondary CTA */}
        {whatsappUrl && (
          <div className="text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-[rgba(201,168,76,0.4)] text-[#C9A84C] px-8 py-4 font-sans font-semibold text-sm uppercase tracking-widest hover:bg-[rgba(201,168,76,0.08)] transition-colors rounded-btn"
            >
              <MessageCircle size={16} />
              Falar pelo WhatsApp
            </a>
          </div>
        )}

        {/* Related service pages */}
        <section>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-4 text-center">
            Serviços relacionados
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/servicos/maquiagem-social"
              className="flex items-center justify-between gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-5 hover:border-[rgba(201,168,76,0.4)] transition-colors group"
            >
              <div>
                <p className="text-[#F5F0E8]/90 font-sans text-sm font-medium group-hover:text-[#C9A84C] transition-colors">
                  Maquiagem Social
                </p>
                <p className="text-[#F5F0E8]/40 font-sans text-xs mt-1">
                  Look completo para festas e eventos sociais
                </p>
              </div>
              <ArrowRight size={16} className="text-[#C9A84C] shrink-0" />
            </Link>
            <Link
              href="/servicos/maquiagem-e-penteado"
              className="flex items-center justify-between gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-5 hover:border-[rgba(201,168,76,0.4)] transition-colors group"
            >
              <div>
                <p className="text-[#F5F0E8]/90 font-sans text-sm font-medium group-hover:text-[#C9A84C] transition-colors">
                  Combo Maquiagem + Penteado
                </p>
                <p className="text-[#F5F0E8]/40 font-sans text-xs mt-1">
                  Produção completa em um único atendimento
                </p>
              </div>
              <ArrowRight size={16} className="text-[#C9A84C] shrink-0" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
