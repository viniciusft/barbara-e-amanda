/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Eventos específicos do agendamento
export const analytics = {
  // Página inicial — clicou em Agendar agora
  clicouAgendar: () =>
    trackEvent("begin_checkout", "agendamento", "home_cta"),

  // Step 1 — selecionou um serviço
  selecionouServico: (nomeServico: string) =>
    trackEvent("select_item", "agendamento", nomeServico),

  // Step 1 — clicou em Casamento
  clicouCasamento: () =>
    trackEvent("contact", "whatsapp", "casamento"),

  // Step 1 — clicou em Destination Beauty
  clicouDestinationBeauty: () =>
    trackEvent("contact", "whatsapp", "destination_beauty"),

  // Step 1 — clicou em Falar com equipe
  clicouFalarEquipe: () =>
    trackEvent("contact", "whatsapp", "falar_equipe"),

  // Step 2 — selecionou uma data
  selecionouData: (data: string) =>
    trackEvent("select_date", "agendamento", data),

  // Step 2 — selecionou horário
  selecionouHorario: (horario: string) =>
    trackEvent("select_time", "agendamento", horario),

  // Step 2 — clicou em horário personalizado
  clicouHorarioPersonalizado: () =>
    trackEvent("contact", "whatsapp", "horario_personalizado"),

  // Step 4 — confirmou o agendamento (evento mais importante!)
  agendamentoConcluido: (servico: string, valor: number) =>
    trackEvent("purchase", "agendamento", servico, valor),

  // Páginas SEO — clicou em Agendar agora
  clicouAgendarPaginaSEO: (pagina: string) =>
    trackEvent("begin_checkout", "seo_page", pagina),

  // Páginas SEO — clicou em WhatsApp
  clicouWhatsAppPaginaSEO: (pagina: string) =>
    trackEvent("contact", "whatsapp", pagina),
};
