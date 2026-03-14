import type { Metadata } from "next";
import ServicePage from "@/components/seo/ServicePage";
import ServicoLinks from "@/components/seo/ServicoLinks";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Babyliss em Passos MG — Cabelo com Ondas Perfeitas",
  description:
    "Babyliss profissional em Passos MG. Ondas perfeitas, naturais e duradouras para qualquer ocasião. Studio Âmbar Beauty em Passos MG.",
  keywords: ["babyliss passos mg", "ondas babyliss passos", "cabelo ondulado passos", "babyliss profissional passos mg"],
  openGraph: {
    title: "Babyliss em Passos MG | Âmbar Beauty Studio",
    description: "Babyliss profissional em Passos MG. Ondas naturais e duradouras. Agende no Âmbar Beauty Studio.",
    url: `${siteUrl}/servicos/babyliss`,
  },
  alternates: { canonical: `${siteUrl}/servicos/babyliss` },
};

export default function BabylissPage() {
  return (
    <>
    <ServicePage
      serviceName="Babyliss"
      serviceDescription="Serviço profissional de babyliss em Passos MG com ondas naturais, duradouras e perfeitas para festas, eventos e o dia a dia."
      serviceUrl={`${siteUrl}/servicos/babyliss`}
      heroTitle="Babyliss em Passos MG — Cabelo com Ondas Perfeitas"
      heroSubtitle="Ondas naturais, volumosas e duradouras que transformam qualquer visual. O babyliss profissional é o toque final que faz toda a diferença no seu look."
      whatIsText={`O babyliss é uma técnica de ondulação de cabelo que utiliza um modelador de cachos ou ondas — o babyliss profissional — para criar ondas e cachos com aspecto natural e longa duração. Diferente da chapinha (que alisa) ou do secador comum, o babyliss cria volume, movimento e textura de forma suave e controlada.

Existem diferentes tipos de onda que podem ser criadas com o babyliss: ondas soltas e naturais (mais leves e com movimento), cachos definidos (mais pronunciados e volumosos), beach waves (o estilo "saída da praia" descontraído), e ondas soft (suaves e elegantes para eventos formais). Cada estilo é adaptado ao seu tipo de cabelo e à ocasião.

No Âmbar Beauty Studio, o babyliss é feito com protetor térmico profissional para preservar a saúde do cabelo, e fixado com produtos que garantem durabilidade por horas. O resultado é um cabelo com movimento, brilho e um acabamento que eleva qualquer produção.`}
      idealFor={[
        "Festas, eventos sociais e aniversários",
        "Casamentos como convidada ou madrinha",
        "Formaturas e colações de grau",
        "Ensaios fotográficos e books",
        "Dia a dia especial e encontros",
        "Qualquer ocasião em que você quer um cabelo impecável",
        "Quem tem cabelo liso e quer adicionar volume e movimento",
      ]}
      howItWorks={[
        "Agende seu horário no sistema online. O babyliss pode ser feito sozinho ou combinado com maquiagem.",
        "No atendimento, chegue com o cabelo limpo e seco. Nossa profissional avaliará o tipo e a textura do seu cabelo.",
        "Aplicação de protetor térmico profissional para proteger os fios durante o processo.",
        "Modelagem das ondas com o babyliss, seção por seção, no estilo escolhido por você.",
        "Finalização com finalizador e fixador para garantir durabilidade e brilho.",
      ]}
      faqs={[
        {
          question: "Quanto tempo dura o babyliss?",
          answer: "Com os produtos certos e dependendo do tipo de cabelo, o babyliss pode durar de 6 a 12 horas. Cabelos naturalmente mais lisos podem perder as ondas mais rápido — nesses casos, usamos técnicas de preparação e fixação específicas para prolongar a durabilidade.",
        },
        {
          question: "Precisa usar algum produto no cabelo antes?",
          answer: "Não é necessário usar produto antes. Chegue com o cabelo limpo e seco. Nossa profissional aplica o protetor térmico profissional antes de iniciar o processo.",
        },
        {
          question: "O babyliss serve para cabelo liso?",
          answer: "Sim! Na verdade, o babyliss é especialmente popular em quem tem cabelo liso, pois adiciona volume, movimento e textura de forma rápida. Para cabelos muito lisos, usamos técnicas de fixação adicionais para garantir que as ondas durem mais.",
        },
        {
          question: "Qual a diferença entre babyliss e ondas com chapinha?",
          answer: "O babyliss cria ondas cilíndricas, mais naturais e com mais volume. A chapinha cria ondas mais planas e angulares. O babyliss tende a dar um resultado mais 'solto' e descontraído, enquanto as ondas de chapinha são mais formais. Os dois são feitos com calor — a diferença está na ferramenta e na forma das ondas.",
        },
        {
          question: "Qual o valor do babyliss?",
          answer: "O valor varia conforme o comprimento e o volume do cabelo. Para verificar os preços atualizados e disponibilidade, acesse nosso sistema de agendamento online ou entre em contato conosco.",
        },
      ]}
      ctaLabel="Agendar babyliss agora"
      breadcrumb={[
        { name: "Início", url: siteUrl },
        { name: "Serviços", url: `${siteUrl}/servicos` },
        { name: "Babyliss", url: `${siteUrl}/servicos/babyliss` },
      ]}
    />
    <ServicoLinks />
    </>
  );
}
