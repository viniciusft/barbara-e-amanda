import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import ServicePage from "@/components/seo/ServicePage";
import ServicoLinks from "@/components/seo/ServicoLinks";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Maquiagem para Casamento em Passos MG | Âmbar Beauty Studio",
  description:
    "Maquiagem e penteado para noivas em Passos MG. Dia da noiva completo, teste de maquiagem, atendimento exclusivo. Reserve sua data no Âmbar Beauty Studio.",
  keywords: [
    "maquiagem casamento passos mg",
    "dia da noiva passos mg",
    "maquiagem noiva passos",
    "penteado noiva passos mg",
    "casamento passos mg make",
  ],
  openGraph: {
    title: "Maquiagem e Penteado para Casamento em Passos MG | Âmbar Beauty Studio",
    description:
      "Dia da noiva completo com maquiagem e penteado profissional em Passos MG. Teste de make, atendimento exclusivo. Âmbar Beauty Studio.",
    url: `${siteUrl}/ocasioes/casamento`,
  },
  alternates: { canonical: `${siteUrl}/ocasioes/casamento` },
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

export default async function CasamentoPage() {
  const whatsapp = await getWhatsapp();
  const whatsappNumber = whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de informações sobre maquiagem e penteado para casamento.")}`
    : null;

  return (
    <>
      <ServicePage
        serviceName="Maquiagem e Penteado para Casamento"
        serviceDescription="Serviço completo de dia da noiva em Passos MG: maquiagem e penteado com teste prévio, atendimento exclusivo e produtos de altíssima durabilidade."
        serviceUrl={`${siteUrl}/ocasioes/casamento`}
        heroTitle="Maquiagem e Penteado para Casamento em Passos MG"
        heroSubtitle="O seu dia mais especial merece um atendimento à altura. Dia da noiva completo — maquiagem e penteado — com teste prévio, produtos premium e dedicação exclusiva ao seu look."
        whatIsText={`O casamento é um dos momentos mais marcantes da vida, e o visual da noiva precisa ser impecável do início ao fim da celebração. O serviço de dia da noiva no Âmbar Beauty Studio é pensado para que você viva cada instante com leveza e confiança, sabendo que sua beleza está em boas mãos.

O processo começa com uma consulta detalhada e um teste de maquiagem e penteado, feitos com antecedência para garantir que o look do grande dia já foi validado e aprovado por você. Usamos produtos de altíssima fixação — à prova de lágrimas, calor e emoção — para que a maquiagem dure da cerimônia até a última dança.

Além da noiva, atendemos madrinhas, mãe da noiva e convidadas, tornando a preparação do dia ainda mais especial e integrada. Cada detalhe é pensado para que você chegue ao altar se sentindo a versão mais radiante de si mesma.`}
        idealFor={[
          "Noivas com casamento civil, religioso ou ao ar livre em Passos MG",
          "Casamentos diurnos e noturnos com look duradouro",
          "Noivas que desejam um visual natural, clássico ou glamouroso",
          "Madrinhas de honra que querem produção integrada",
          "Mãe da noiva e convidadas especiais",
          "Noivas que valorizam teste prévio e atendimento exclusivo",
        ]}
        howItWorks={[
          "Entre em contato para verificar a disponibilidade da data do casamento e agendar o teste de maquiagem e penteado.",
          "Teste completo: sessão de experimentação do look com no mínimo 30 dias de antecedência para eventuais ajustes.",
          "Confirmação do pacote e das pessoas incluídas no atendimento (noiva, madrinhas, mãe da noiva).",
          "No dia do casamento, a equipe chega no horário combinado para iniciar o cronograma de atendimento.",
          "Maquiagem e penteado aplicados com os produtos e técnicas definidos no teste, entrega de kit de retoque.",
        ]}
        faqs={[
          {
            question: "Com quanto tempo de antecedência devo reservar minha data de casamento?",
            answer:
              "Recomendamos reservar com pelo menos 3 a 6 meses de antecedência, especialmente para datas em alta temporada (outubro a dezembro). O teste de maquiagem e penteado é feito entre 30 e 60 dias antes do casamento.",
          },
          {
            question: "O teste de maquiagem e penteado está incluído no pacote?",
            answer:
              "Sim! O teste de maquiagem e penteado faz parte do serviço de dia da noiva. É durante o teste que definimos o look final, os produtos ideais para o seu tipo de pele e o estilo do penteado. Recomendamos usar a roupa ou acessórios próximos ao visual do casamento.",
          },
          {
            question: "Atendem também madrinhas e familiares no mesmo dia?",
            answer:
              "Sim! Montamos um cronograma completo para noiva, madrinhas, mãe da noiva e convidadas especiais. Quanto mais pessoas incluídas, mais cedo iniciamos o atendimento — nosso time é organizado para que todos fiquem prontas no horário ideal.",
          },
          {
            question: "Fazem atendimento no local do casamento ou apenas no studio?",
            answer:
              "Atendemos tanto no Âmbar Beauty Studio em Passos MG quanto no local do casamento — hotel, haras, sítio ou salão. Consulte as condições de deslocamento para eventos fora de Passos.",
          },
          {
            question: "Como funciona o valor do pacote de casamento?",
            answer:
              "O valor varia conforme o número de pessoas e os serviços contratados (só maquiagem, só penteado ou combo completo). Entre em contato para receber uma proposta personalizada para o seu casamento.",
          },
        ]}
        galeriaPagina="casamento"
        galeriaSubtitulo="Noivas inesquecíveis"
        ctaLabel="Agendar dia da noiva agora"
        breadcrumb={[
          { name: "Início", url: siteUrl },
          { name: "Ocasiões", url: `${siteUrl}/ocasioes` },
          { name: "Casamento", url: `${siteUrl}/ocasioes/casamento` },
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
              href="/servicos/maquiagem-noiva"
              className="flex items-center justify-between gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-5 hover:border-[rgba(201,168,76,0.4)] transition-colors group"
            >
              <div>
                <p className="text-[#F5F0E8]/90 font-sans text-sm font-medium group-hover:text-[#C9A84C] transition-colors">
                  Maquiagem de Noiva
                </p>
                <p className="text-[#F5F0E8]/40 font-sans text-xs mt-1">
                  Make exclusivo com teste prévio e alta durabilidade
                </p>
              </div>
              <ArrowRight size={16} className="text-[#C9A84C] shrink-0" />
            </Link>
            <Link
              href="/servicos/penteado"
              className="flex items-center justify-between gap-3 border border-[rgba(201,168,76,0.15)] bg-[#111] rounded-card p-5 hover:border-[rgba(201,168,76,0.4)] transition-colors group"
            >
              <div>
                <p className="text-[#F5F0E8]/90 font-sans text-sm font-medium group-hover:text-[#C9A84C] transition-colors">
                  Penteado para Noiva
                </p>
                <p className="text-[#F5F0E8]/40 font-sans text-xs mt-1">
                  Coque, trança, ondas e todos os estilos para o grande dia
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
