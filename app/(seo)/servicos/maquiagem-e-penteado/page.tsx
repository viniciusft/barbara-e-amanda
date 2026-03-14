import type { Metadata } from "next";
import ServicePage from "@/components/seo/ServicePage";
import ServicoLinks from "@/components/seo/ServicoLinks";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Maquiagem e Penteado em Passos MG — Combo Completo",
  description:
    "Combo maquiagem + penteado em Passos MG. Atendimento completo para noivas, formaturas e eventos. Melhor custo-benefício. Agende no Âmbar Beauty Studio.",
  keywords: ["maquiagem e penteado passos mg", "combo make penteado passos", "maquiagem penteado casamento passos", "producao completa passos mg"],
  openGraph: {
    title: "Maquiagem e Penteado em Passos MG | Âmbar Beauty Studio",
    description: "Combo maquiagem + penteado em Passos MG para noivas, formaturas e eventos. Âmbar Beauty Studio.",
    url: `${siteUrl}/servicos/maquiagem-e-penteado`,
  },
  alternates: { canonical: `${siteUrl}/servicos/maquiagem-e-penteado` },
};

export default function MaquiagemPenteadoPage() {
  return (
    <>
    <ServicePage
      serviceName="Combo Maquiagem e Penteado"
      serviceDescription="Combo completo de maquiagem + penteado profissional em Passos MG para noivas, formaturas e eventos com coerência visual e melhor custo-benefício."
      serviceUrl={`${siteUrl}/servicos/maquiagem-e-penteado`}
      heroTitle="Maquiagem e Penteado em Passos MG — Combo Completo"
      heroSubtitle="O look completo — make + cabelo — em um só atendimento. Mais praticidade, mais economia e um resultado visualmente harmonioso do primeiro ao último detalhe."
      whatIsText={`O combo maquiagem + penteado é a solução completa para quem quer um visual impecável sem a preocupação de coordenar diferentes profissionais e studios. No Âmbar Beauty Studio, maquiagem e penteado são pensados juntos, garantindo que as cores, a textura e o estilo do cabelo complementem perfeitamente o look da maquiagem.

A grande vantagem do combo está na coerência visual: quando a mesma equipe cria o penteado e a maquiagem, o resultado final é muito mais harmonioso. A maquiagem mais glamourosa pede um penteado mais elaborado; a make natural combina com um penteado mais solto e romântico. Essa sintonia é difícil de alcançar quando cada serviço é contratado em lugares diferentes.

Além da harmonia estética, o combo oferece praticidade (tudo em um só lugar e horário) e economia em relação à contratação separada dos dois serviços. É especialmente indicado para noivas, formandas e qualquer pessoa que queira uma produção completa e sem estresse.`}
      idealFor={[
        "Noivas que desejam dia da noiva completo",
        "Formandas que querem produção total para a cerimônia",
        "Madrinhas de casamento e damas de honra",
        "Debutantes de 15 anos",
        "Aniversariantes que querem uma produção especial",
        "Convidadas de festas e eventos importantes",
        "Qualquer pessoa que prefere resolver maquiagem e cabelo em um só lugar",
      ]}
      howItWorks={[
        "Agende o combo online selecionando o serviço 'Maquiagem + Penteado' e o horário disponível.",
        "No dia, chegue com o rosto limpo, hidratado e com o cabelo limpo e seco.",
        "A equipe faz uma consultoria rápida para alinhar o estilo da maquiagem e do penteado com seu look total.",
        "O atendimento começa pelo penteado (para evitar que o spray afete a maquiagem) e em seguida a maquiagem é aplicada.",
        "Finalização e aprovação do look completo. Você sai pronta e impecável!",
      ]}
      faqs={[
        {
          question: "As duas profissionais trabalham juntas no mesmo momento?",
          answer: "O atendimento é sequencial: geralmente começamos pelo penteado e depois fazemos a maquiagem. Isso garante que o fixador do cabelo não interfira na maquiagem. Em alguns casos, com equipe disponível, é possível ter penteado e maquiagem sendo feitos simultaneamente — verifique a disponibilidade ao agendar.",
        },
        {
          question: "Quanto tempo dura o atendimento do combo?",
          answer: "O combo completo leva em média 2 a 3 horas, dependendo do estilo de penteado e maquiagem escolhidos. Para noivas, reservamos um tempo maior para garantir tranquilidade. Planeje seu cronograma considerando pelo menos 3h antes do evento.",
        },
        {
          question: "Qual a diferença de contratar o combo versus contratar separado?",
          answer: "Além da economia financeira (o combo costuma ser mais vantajoso que contratar cada serviço separadamente), o principal diferencial é a coerência visual. Quando a mesma equipe cuida da make e do cabelo, os dois elementos se complementam de forma muito mais harmoniosa.",
        },
        {
          question: "O combo vale a pena para um evento simples, não apenas para casamentos?",
          answer: "Absolutamente! O combo é excelente para qualquer evento em que você queira se sentir completamente produzida — aniversários, formaturas, eventos corporativos ou simplesmente uma ocasião especial. Não precisa ser casamento para merecer o look completo.",
        },
        {
          question: "Qual o valor do combo maquiagem + penteado?",
          answer: "O valor varia de acordo com os serviços específicos escolhidos dentro do combo. Para verificar os preços atualizados e a disponibilidade, acesse nosso sistema de agendamento online.",
        },
      ]}
      galeriaPagina="maquiagem-e-penteado"
      galeriaSubtitulo="Combos completos"
      ctaLabel="Agendar combo maquiagem + penteado agora"
      breadcrumb={[
        { name: "Início", url: siteUrl },
        { name: "Serviços", url: `${siteUrl}/servicos` },
        { name: "Maquiagem e Penteado", url: `${siteUrl}/servicos/maquiagem-e-penteado` },
      ]}
    />
    <ServicoLinks />
    </>
  );
}
