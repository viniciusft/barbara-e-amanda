import type { Metadata } from "next";
import ServicePage from "@/components/seo/ServicePage";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbara-e-amanda.vercel.app";

export const metadata: Metadata = {
  title: "Maquiagem de Noiva em Passos MG",
  description:
    "Maquiagem de noiva profissional em Passos MG. Atendimento exclusivo, teste de maquiagem e dia da noiva completo. Âmbar Beauty Studio.",
  keywords: ["maquiagem noiva passos mg", "maquiagem casamento passos", "dia da noiva passos mg", "make noiva passos"],
  openGraph: {
    title: "Maquiagem de Noiva em Passos MG | Âmbar Beauty Studio",
    description: "Maquiagem de noiva profissional em Passos MG. Atendimento exclusivo com teste de make. Âmbar Beauty Studio.",
    url: `${siteUrl}/servicos/maquiagem-noiva`,
  },
  alternates: { canonical: `${siteUrl}/servicos/maquiagem-noiva` },
};

export default function MaquiagemNoivaPage() {
  return (
    <ServicePage
      serviceName="Maquiagem de Noiva"
      serviceDescription="Serviço especializado de maquiagem de noiva em Passos MG com teste de make, atendimento exclusivo e alta durabilidade."
      serviceUrl={`${siteUrl}/servicos/maquiagem-noiva`}
      heroTitle="Maquiagem de Noiva em Passos MG"
      heroSubtitle="O dia mais importante da sua vida merece a maquiagem mais especial. Atendimento exclusivo, com teste prévio e produtos premium de altíssima durabilidade."
      whatIsText={`A maquiagem de noiva é um serviço diferenciado e exclusivo, pensado para um dos momentos mais emocionantes da vida de uma mulher. Diferente da maquiagem social, o atendimento de noiva inclui um processo mais detalhado, com teste de maquiagem prévio, uso de produtos premium e técnicas específicas para garantir durabilidade de 12 a 16 horas.

No Âmbar Beauty Studio, entendemos que cada noiva é única. Por isso, o processo começa com uma conversa aprofundada sobre o estilo do casamento, a iluminação do espaço, a paleta de cores da festa e, claro, o que você sonha para o seu look. Trabalhamos para que você se sinta a versão mais linda de si mesma — reconhecível e autêntica.

Usamos técnicas como airbrush, primer de longa duração, fixadores e bases com alta cobertura que resistem a lágrimas, calor e emoção. O resultado é uma maquiagem impecável do início ao fim da cerimônia e da festa.`}
      idealFor={[
        "Noivas em casamentos civis, religiosos ou ao ar livre",
        "Cerimônias diurnas e noturnas",
        "Casamentos em Passos MG e região",
        "Noivas que querem um look natural e delicado",
        "Noivas que preferem um visual mais glamouroso e marcante",
        "Debutantes de 15 anos com atendimento especial",
        "Madrinhas de honra que desejam look diferenciado",
      ]}
      howItWorks={[
        "Contato inicial e agendamento do teste de maquiagem com antecedência de 30 a 60 dias do casamento.",
        "Teste de maquiagem: sessão de prova completa para definir o look, os produtos e as cores ideais para o seu rosto.",
        "No dia do casamento, o atendimento começa com skin care e preparação da pele para potencializar a durabilidade.",
        "Aplicação completa da maquiagem com os produtos e técnicas definidos no teste.",
        "Finalização, fotos de aprovação e kit de retoque entregue para a noiva.",
      ]}
      faqs={[
        {
          question: "Quando devo marcar o teste de maquiagem de noiva?",
          answer: "O ideal é fazer o teste entre 30 e 60 dias antes do casamento. Isso dá tempo para eventuais ajustes e para você se acostumar com o look. Evite fazer o teste muito próximo ao casamento para não haver surpresas.",
        },
        {
          question: "Quanto tempo dura o atendimento de maquiagem de noiva no dia?",
          answer: "O atendimento completo de maquiagem de noiva leva entre 1h30 e 2 horas, dependendo da complexidade do look. Recomendamos reservar pelo menos 3 horas no seu cronograma da manhã para maquiagem + penteado com tranquilidade.",
        },
        {
          question: "O serviço inclui penteado?",
          answer: "A maquiagem de noiva e o penteado podem ser contratados separadamente ou em combo. Recomendamos o combo completo para garantir coerência visual e praticidade no dia. Entre em contato para verificar a disponibilidade do pacote noiva completo.",
        },
        {
          question: "Qual a diferença entre maquiagem de noiva e maquiagem social?",
          answer: "A maquiagem de noiva inclui o teste prévio, uso de produtos de altíssima durabilidade (resistentes a lágrimas e calor por 12 a 16h), técnicas mais elaboradas e um processo de atendimento mais completo. A maquiagem social é mais rápida e adequada para eventos do dia a dia.",
        },
        {
          question: "A maquiagem de noiva realmente resiste às lágrimas e ao calor?",
          answer: "Sim! Utilizamos fixadores e produtos à prova d'água especialmente selecionados para isso. Com os produtos certos e a técnica adequada, a maquiagem resiste a emoções, calor e uma longa jornada de celebração.",
        },
      ]}
      ctaLabel="Agendar maquiagem de noiva agora"
      breadcrumb={[
        { name: "Início", url: siteUrl },
        { name: "Serviços", url: `${siteUrl}/servicos` },
        { name: "Maquiagem de Noiva", url: `${siteUrl}/servicos/maquiagem-noiva` },
      ]}
    />
  );
}
