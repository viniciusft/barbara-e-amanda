import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import ServicePage from "@/components/seo/ServicePage";
import ServicoLinks from "@/components/seo/ServicoLinks";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getConteudo } from "@/lib/conteudo";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getConteudo("eventos");
  return {
    title: "Maquiagem para Festas e Eventos em Passos MG | Âmbar Beauty Studio",
    description:
      c?.descricao_curta ??
      "Maquiagem e penteado para festas, aniversários, eventos corporativos e ocasiões especiais em Passos MG. Agende com facilidade no Âmbar Beauty Studio.",
    keywords: [
      "maquiagem eventos passos mg",
      "maquiagem festa passos mg",
      "make aniversário passos",
      "maquiagem evento corporativo passos",
      "make ensaio fotográfico passos mg",
    ],
    openGraph: {
      title: "Maquiagem para Festas e Eventos em Passos MG | Âmbar Beauty Studio",
      description:
        "Maquiagem e penteado profissional para festas, aniversários, eventos corporativos e ocasiões especiais em Passos MG. Âmbar Beauty Studio.",
      url: `${siteUrl}/ocasioes/eventos`,
    },
    alternates: { canonical: `${siteUrl}/ocasioes/eventos` },
  };
}

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

export default async function EventosPage() {
  const [whatsapp, c] = await Promise.all([getWhatsapp(), getConteudo("eventos")]);
  const whatsappNumber = whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de informações sobre maquiagem para um evento especial.")}`
    : null;

  return (
    <>
      <ServicePage
        serviceName="Maquiagem para Eventos"
        serviceDescription="Serviço de maquiagem e penteado para festas, aniversários, eventos corporativos e ocasiões especiais em Passos MG, com produção adaptada a cada tipo de evento."
        serviceUrl={`${siteUrl}/ocasioes/eventos`}
        heroTitle={c?.titulo ?? "Maquiagem para Eventos em Passos MG"}
        heroSubtitle={c?.subtitulo ?? "De festas de aniversário a eventos corporativos, de ensaios fotográficos a jantares especiais — um look profissional para cada ocasião, criado especialmente para você."}
        whatIsText={`Todo evento tem o seu tom, e a maquiagem certa transforma qualquer ocasião em um momento ainda mais especial. No Âmbar Beauty Studio, atendemos mulheres que querem chegar ao evento com o visual impecável — sem a correria de tentar se maquiar em casa na última hora.

Cada tipo de evento pede um look diferente: um aniversário pede brilho e personalidade; um evento corporativo pede sofisticação discreta; um ensaio fotográfico exige produtos que fotografem bem sob qualquer luz. Nossa equipe entende essas nuances e adapta a maquiagem e o penteado ao estilo do evento e ao seu gosto pessoal.

Atendemos tanto no studio em Passos MG quanto em locação para grupos. Para festas em que várias convidadas desejam se produzir juntas — como aniversários de debutante e confraternizações — é possível montar um cronograma de atendimento em grupo. Entre em contato para mais informações.`}
        idealFor={[
          "Festas de aniversário: 15 anos, adulto, debutante",
          "Eventos corporativos: confraternizações, premiações, congressos",
          "Ensaios fotográficos: books, fotos de gestante, família",
          "Jantares, casamentos como convidada e festas de família",
          "Apresentações artísticas, shows e eventos culturais",
          "Qualquer ocasião em que você queira se sentir extraordinária",
        ]}
        howItWorks={[
          "Agende pelo nosso sistema online ou entre em contato pelo WhatsApp. Informe o tipo de evento e o horário.",
          "Chegue ao studio com o rosto limpo e hidratado. Conte para a profissional sobre o estilo do evento e o look que imagina.",
          "Maquiagem aplicada com produtos de longa duração, adaptada ao evento (iluminação, ambiente, formalidade).",
          "Penteado criado para combinar com o look e durar toda a celebração.",
          "Você sai do studio pronta para brilhar em qualquer ocasião.",
        ]}
        faqs={[
          {
            question: "Atendem grupos para festas e eventos?",
            answer:
              "Sim! Para festas de aniversário, debutantes e eventos em grupo, podemos montar um cronograma de atendimento para várias pessoas. Entre em contato com antecedência para organizar os horários e garantir que todas fiquem prontas no tempo ideal.",
          },
          {
            question: "Fazem atendimento domiciliar para eventos?",
            answer:
              "O atendimento é feito preferencialmente no Âmbar Beauty Studio em Passos MG. Para grupos ou ocasiões especiais, consulte a disponibilidade de atendimento externo. Entre em contato pelo WhatsApp para verificar as condições.",
          },
          {
            question: "Com quanto tempo de antecedência devo agendar para um evento?",
            answer:
              "Para eventos individuais, recomendamos agendar com 2 a 5 dias de antecedência. Para grupos ou eventos em datas concorridas (feriados, fim de semana de alta demanda), planeje com pelo menos 2 a 3 semanas de antecedência.",
          },
          {
            question: "A maquiagem para evento dura até o final da festa?",
            answer:
              "Sim! Trabalhamos com produtos de alta fixação e longa duração, ideais para resistir ao calor, à iluminação e às horas de festa. Uma maquiagem bem feita pode durar 8 a 12 horas, dependendo do tipo de pele e das condições do ambiente.",
          },
          {
            question: "O valor muda de acordo com o tipo de evento?",
            answer:
              "O valor do serviço é baseado nos procedimentos contratados (maquiagem, penteado ou combo), não necessariamente no tipo de evento. Acesse nossa página de agendamento ou entre em contato para verificar os valores atualizados.",
          },
        ]}
        galeriaPagina="eventos"
        galeriaSubtitulo="Looks para cada ocasião"
        ctaLabel="Agendar maquiagem para evento agora"
        breadcrumb={[
          { name: "Início", url: siteUrl },
          { name: "Ocasiões", url: `${siteUrl}/ocasioes` },
          { name: "Eventos", url: `${siteUrl}/ocasioes/eventos` },
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
                  Look profissional para festas e ocasiões especiais
                </p>
              </div>
              <ArrowRight size={16} className="text-[#C9A84C] shrink-0" />
            </Link>
            <Link
              href="/ocasioes/formatura"
              className="flex items-center justify-between gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-5 hover:border-[rgba(201,168,76,0.4)] transition-colors group"
            >
              <div>
                <p className="text-[#F5F0E8]/90 font-sans text-sm font-medium group-hover:text-[#C9A84C] transition-colors">
                  Maquiagem para Formatura
                </p>
                <p className="text-[#F5F0E8]/40 font-sans text-xs mt-1">
                  Look impecável para a colação de grau e a festa
                </p>
              </div>
              <ArrowRight size={16} className="text-[#C9A84C] shrink-0" />
            </Link>
          </div>
        </section>
      </div>
      <ServicoLinks />
    </>
  );
}
