import type { Metadata } from "next";
import ServicePage from "@/components/seo/ServicePage";
import ServicoLinks from "@/components/seo/ServicoLinks";
import { getConteudo } from "@/lib/conteudo";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getConteudo("maquiagem-social");
  return {
    title: "Maquiagem Social em Passos MG",
    description:
      c?.descricao_curta ??
      "Maquiagem social profissional em Passos MG. Para festas, eventos, aniversários e ocasiões especiais. Agende online no Âmbar Beauty Studio.",
    keywords: ["maquiagem social passos mg", "make social passos", "maquiagem para festa passos", "maquiagem eventos passos mg"],
    openGraph: {
      title: "Maquiagem Social em Passos MG | Âmbar Beauty Studio",
      description: "Maquiagem social profissional em Passos MG. Agende online no Âmbar Beauty Studio.",
      url: `${siteUrl}/servicos/maquiagem-social`,
    },
    alternates: { canonical: `${siteUrl}/servicos/maquiagem-social` },
  };
}

export default async function MaquiagemSocialPage() {
  const c = await getConteudo("maquiagem-social");
  return (
    <>
    <ServicePage
      serviceName="Maquiagem Social"
      serviceDescription="Serviço de maquiagem social profissional em Passos MG para festas, eventos, aniversários e ocasiões especiais."
      serviceUrl={`${siteUrl}/servicos/maquiagem-social`}
      heroTitle={c?.titulo ?? "Maquiagem Social em Passos MG"}
      heroSubtitle={c?.subtitulo ?? "Look perfeito para festas, aniversários, formaturas e qualquer ocasião especial. Realce sua beleza natural com a maquiagem profissional do Âmbar Beauty Studio."}
      whatIsText={`A maquiagem social é o serviço ideal para quem deseja um look impecável em eventos e ocasiões especiais sem o peso de uma maquiagem de noiva. É uma produção completa e profissional, porém com um toque mais leve e versátil, adaptada ao clima, ao tipo do evento e ao seu estilo pessoal.

No Âmbar Beauty Studio, cada maquiagem social é personalizada de acordo com seu tom de pele, o horário do evento, a iluminação do ambiente e — claro — sua preferência de estilo. Trabalhamos com produtos de alta performance que garantem durabilidade e acabamento impecável por horas.

A maquiagem social é diferente da maquiagem do dia a dia: ela é feita para durar, para fotografar bem e para resistir às emoções e à temperatura do evento. Nossas profissionais têm experiência em diferentes tons de pele e estilos, do look mais natural ao mais glamouroso. O resultado é sempre uma versão mais radiante de você mesma.`}
      idealFor={[
        "Festas de aniversário (debutante, 15 anos, adulto)",
        "Formaturas e colações de grau",
        "Eventos corporativos e confraternizações",
        "Festas de família e reuniões sociais",
        "Ensaios fotográficos e books",
        "Apresentações, shows e eventos artísticos",
        "Casamentos como madrinha ou convidada",
        "Qualquer ocasião em que você queira se sentir especial",
      ]}
      howItWorks={[
        "Agende seu horário pelo nosso sistema online em poucos cliques, escolhendo o dia e horário disponível.",
        "No dia do atendimento, chegue com o rosto limpo e hidratado. Nossa profissional fará uma breve consultoria sobre o look desejado.",
        "A maquiagem é aplicada com produtos profissionais de alta fixação, com atenção ao seu tipo de pele, tom e preferências.",
        "Finalização e ajustes para garantir que o look está exatamente como você imaginou.",
        "Você sai do studio pronta para arrasar no evento!",
      ]}
      faqs={[
        {
          question: "Quanto tempo dura o atendimento de maquiagem social?",
          answer: "O atendimento de maquiagem social dura em média 45 a 60 minutos, dependendo da complexidade do look desejado. Recomendamos agendar com pelo menos 1h30 de antecedência ao evento para ter tempo de sobra.",
        },
        {
          question: "A maquiagem dura o dia (e a noite) toda?",
          answer: "Sim! Trabalhamos com produtos de alta fixação e longa duração. Uma maquiagem social bem feita pode durar 8 a 12 horas dependendo do tipo de pele e das condições do ambiente. Em dias muito quentes ou úmidos, orientamos sobre cuidados para manter o look por mais tempo.",
        },
        {
          question: "Preciso agendar com antecedência?",
          answer: "Recomendamos agendar com pelo menos 2 a 3 dias de antecedência, especialmente para datas próximas a feriados ou finais de semana. Nosso sistema online mostra os horários disponíveis em tempo real.",
        },
        {
          question: "Qual a diferença entre maquiagem social e maquiagem profissional?",
          answer: "Toda maquiagem feita por uma maquiadora profissional é 'profissional'. O termo 'maquiagem social' se refere ao tipo de evento — é uma produção para ocasiões sociais, diferente da maquiagem de noiva (que é mais elaborada e exclusiva) ou da maquiagem artística (para teatro, TV, etc.).",
        },
        {
          question: "Posso combinar maquiagem social com penteado?",
          answer: "Sim! Oferecemos o combo maquiagem + penteado com desconto em relação à contratação separada. Informe no agendamento que deseja o combo para verificar os horários disponíveis.",
        },
      ]}
      galeriaPagina="maquiagem-social"
      galeriaSubtitulo="Makes sociais feitas por nós"
      ctaLabel="Agendar maquiagem social agora"
      breadcrumb={[
        { name: "Início", url: siteUrl },
        { name: "Serviços", url: `${siteUrl}/servicos` },
        { name: "Maquiagem Social", url: `${siteUrl}/servicos/maquiagem-social` },
      ]}
    />
    <ServicoLinks />
    </>
  );
}
