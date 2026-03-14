import type { Metadata } from "next";
import ServicePage from "@/components/seo/ServicePage";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Penteado em Passos MG",
  description:
    "Penteados profissionais em Passos MG. Para noivas, formaturas, festas e eventos. Penteado solto, preso, semi-preso e trança. Agende agora.",
  keywords: ["penteado passos mg", "penteado para festa passos", "penteado noiva passos", "penteado formatura passos mg"],
  openGraph: {
    title: "Penteado Profissional em Passos MG | Âmbar Beauty Studio",
    description: "Penteados profissionais em Passos MG para noivas, formaturas e festas. Agende no Âmbar Beauty Studio.",
    url: `${siteUrl}/servicos/penteado`,
  },
  alternates: { canonical: `${siteUrl}/servicos/penteado` },
};

export default function PenteadoPage() {
  return (
    <ServicePage
      serviceName="Penteado Profissional"
      serviceDescription="Penteados profissionais em Passos MG para festas, formaturas, casamentos e eventos. Estilos preso, semi-preso, solto com ondas e tranças."
      serviceUrl={`${siteUrl}/servicos/penteado`}
      heroTitle="Penteado Profissional em Passos MG"
      heroSubtitle="Do elegante coque para noiva às ondas soltas para festa — criamos o penteado que combina com você, com o evento e dura a noite toda."
      whatIsText={`O penteado profissional é muito mais do que apenas "arrumar o cabelo". É a finalização que completa o look, enquadra o rosto e garante que você esteja exatamente como imaginou para aquela ocasião especial. No Âmbar Beauty Studio, cada penteado é criado de forma personalizada, levando em conta seu tipo de cabelo, o estilo do evento e suas preferências.

Trabalhamos com os principais estilos de penteado: o elegante coque clássico ou moderno (perfeito para noivas e formaturas), o semi-preso com cachos ou ondas, o solto com babyliss ou ondas de ferro, e as tranças embutidas ou decorativas. Cada técnica usa produtos de fixação profissional para garantir que o penteado se mantenha impecável por toda a festa.

Nosso atendimento começa com uma conversa sobre o que você imagina e o que combina com seu cabelo. Cabelos lisos, ondulados, cacheados e crespos têm tratamentos específicos — e nossa equipe tem experiência com todos eles.`}
      idealFor={[
        "Noivas que desejam coque, trança ou solto com ondas",
        "Madrinhas e convidadas de casamentos",
        "Formaturas e colações de grau",
        "Festas de 15 anos e debutantes",
        "Festas de aniversário e eventos sociais",
        "Ensaios fotográficos e books",
        "Qualquer ocasião em que o cabelo importa",
      ]}
      howItWorks={[
        "Agende seu horário no sistema online escolhendo data e horário disponíveis.",
        "No dia, chegue com o cabelo limpo e seco (ou avise para lavagem no studio, se disponível).",
        "Nossa profissional conversa sobre o estilo desejado e faz uma avaliação do seu tipo de cabelo.",
        "O penteado é executado com produtos profissionais de fixação e acabamento.",
        "Finalização com fixador, ajustes e aprovação do resultado antes de você sair.",
      ]}
      faqs={[
        {
          question: "Qual penteado combina com meu tipo de cabelo?",
          answer: "Cada tipo de cabelo tem estilos que funcionam melhor. Cabelos finos ficam ótimos com coques elaborados e semi-presos. Cabelos volumosos se adaptam bem a penteados soltos com ondas. No atendimento, nossa profissional avalia seu cabelo e sugere as melhores opções para você.",
        },
        {
          question: "O penteado dura a noite toda?",
          answer: "Sim! Utilizamos produtos de fixação profissional (laquê, cera, finalizadores) que garantem que o penteado se mantenha por 6 a 12 horas, dependendo do estilo e das condições climáticas. Para noivas, usamos técnicas específicas de alta durabilidade.",
        },
        {
          question: "Preciso lavar o cabelo antes de fazer o penteado?",
          answer: "Sim, o ideal é vir com o cabelo lavado no dia anterior ou na manhã do atendimento, porém sem aplicar condicionadores pesados na raiz. Cabelos muito limpos e levemente texturizados seguram melhor a maioria dos penteados.",
        },
        {
          question: "Posso combinar penteado com maquiagem?",
          answer: "Sim! Temos o combo maquiagem + penteado que garante coerência no visual completo e é mais vantajoso financeiramente. Basta selecionar o serviço combo no agendamento online.",
        },
        {
          question: "Qual o valor do penteado?",
          answer: "O valor varia de acordo com o estilo e a complexidade do penteado. Para consultar os preços atualizados e verificar a disponibilidade, acesse nosso sistema de agendamento online ou entre em contato conosco.",
        },
      ]}
      ctaLabel="Agendar penteado agora"
      breadcrumb={[
        { name: "Início", url: siteUrl },
        { name: "Serviços", url: `${siteUrl}/servicos` },
        { name: "Penteado", url: `${siteUrl}/servicos/penteado` },
      ]}
    />
  );
}
