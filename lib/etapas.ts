export interface EtapaConfig {
  label: string;
  hex: string;
  badgeClass: string;
}

export const ETAPA_CONFIG: Record<string, EtapaConfig> = {
  solicitacao:            { label: "Solicitação",         hex: "#6B7280", badgeClass: "text-gray-400 border-gray-700 bg-gray-900/50" },
  aguardando_sinal:       { label: "Aguardando Sinal",    hex: "#D97706", badgeClass: "text-amber-400 border-amber-700 bg-amber-950/30" },
  whatsapp_sinal_enviado: { label: "WhatsApp enviado",    hex: "#D97706", badgeClass: "text-amber-400 border-amber-700 bg-amber-950/30" },
  sinal_pago:             { label: "Sinal pago",          hex: "#2563EB", badgeClass: "text-blue-400 border-blue-800 bg-blue-950/30" },
  confirmado:             { label: "Confirmado",          hex: "#2563EB", badgeClass: "text-blue-400 border-blue-800 bg-blue-950/30" },
  confirmacao_enviada:    { label: "Conf. enviada",       hex: "#4F46E5", badgeClass: "text-indigo-400 border-indigo-700 bg-indigo-950/30" },
  concluido:              { label: "Concluído",           hex: "#16A34A", badgeClass: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
  avaliacao_enviada:      { label: "Avaliação enviada",   hex: "#059669", badgeClass: "text-teal-400 border-teal-800 bg-teal-950/30" },
  nao_compareceu:         { label: "Não compareceu",      hex: "#DC2626", badgeClass: "text-red-500 border-red-900 bg-red-950/40" },
  cancelado:              { label: "Cancelado",           hex: "#9CA3AF", badgeClass: "text-gray-400 border-gray-600 bg-gray-900/30" },
};

export function getEtapaConfig(etapa: string): EtapaConfig {
  return ETAPA_CONFIG[etapa] ?? ETAPA_CONFIG.solicitacao;
}

// Ordered stages for progress bar (terminal states not included)
export const ETAPA_ORDER = [
  "solicitacao",
  "whatsapp_sinal_enviado",
  "sinal_pago",
  "confirmado",
  "confirmacao_enviada",
  "concluido",
  "avaliacao_enviada",
];

export function getEtapaProgress(etapa: string): number {
  const idx = ETAPA_ORDER.indexOf(etapa);
  if (idx === -1) return 0;
  return Math.round((idx / (ETAPA_ORDER.length - 1)) * 100);
}
