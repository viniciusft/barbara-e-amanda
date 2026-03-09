export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  cor_agenda: string | null;
  ordem: number | null;
  imagem_url: string | null;
  // Category system
  categoria: "maquiagem" | "cabelo" | "combo";
  duracao_maquiagem_min: number | null;
  duracao_cabelo_min: number | null;
  // Sinal config per service
  sinal_tipo: "percentual" | "fixo" | null;
  sinal_percentual_custom: number | null;
  sinal_valor_fixo: number | null;
  created_at: string;
}

export interface HorarioDisponivel {
  id: string;
  dia_semana: number; // 0=domingo, 1=segunda, ..., 6=sábado
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  ativo: boolean;
  intervalo_minutos: number | null;
  horarios_customizados: string[] | null;
  // Per-category schedule
  hora_inicio_cabelo: string | null; // HH:MM — used when modo_horario = 'separado'
  hora_fim_cabelo: string | null;
  modo_horario: "ambos" | "separado";
  created_at?: string;
}

export interface Bloqueio {
  id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  motivo: string | null;
  created_at: string;
}

export interface Agendamento {
  id: string;
  servico_id: string | null;
  servico_nome: string;
  servico_duracao: number;
  nome_cliente: string;
  telefone: string;
  email: string | null;
  observacoes: string | null;
  data_hora: string; // ISO timestamptz (maquiagem start for combos)
  data_hora_fim: string; // ISO timestamptz
  // Combo fields
  categoria_servico: "maquiagem" | "cabelo" | "combo" | null;
  data_hora_cabelo: string | null; // ISO — start of cabelo block for combos
  gcal_event_id: string | null;
  gcal_event_id_cabelo: string | null;
  combo_ordem: string | null;
  status: "solicitacao" | "aguardando_sinal" | "confirmado" | "cancelado" | "concluido" | "nao_compareceu";
  created_at: string;
  updated_at: string;
  // Execution fields
  servico_executado: boolean | null;
  preco_cobrado: number | null;
  preco_original: number | null;
  tipo_ajuste_preco: string | null;
  motivo_ajuste: string | null;
  forma_pagamento: string | null;
  observacoes_execucao: string | null;
  executado_em: string | null;
  // Sinal (deposit) fields
  sinal_percentual: number | null;
  sinal_valor: number | null;
  sinal_status: "aguardando" | "pago" | "nao_compareceu" | "dispensado" | "reembolsado" | null;
  sinal_pago_em: string | null;
  sinal_forma_pagamento: string | null;
  valor_restante: number | null;
  whatsapp_enviado_em: string | null;
  sinal_reembolsado_em: string | null;
  confirmacao_enviada_em: string | null;
  servico?: Servico;
  // Computed display fields added by API
  data?: string; // YYYY-MM-DD (BRT)
  hora_inicio?: string; // HH:MM (BRT)
  hora_fim?: string; // HH:MM (BRT)
  hora_inicio_cabelo?: string; // HH:MM (BRT) — cabelo start for combos
  hora_inicio_maquiagem?: string; // HH:MM (BRT) — maquiagem start for combos
}

export interface AdminConfig {
  id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  google_calendar_id: string | null;
  nome_studio: string | null;
  bio: string | null;
  instagram: string | null;
  whatsapp: string | null;
  endereco: string | null;
  foto_url: string | null;
  foto_header_url: string | null;
  foto_header_mobile_url: string | null;
  // Payment & sinal config
  chave_pix: string | null;
  tipo_chave_pix: string | null;
  nome_recebedor_pix: string | null;
  sinal_percentual_padrao: number | null;
  nome_secretaria: string | null;
  mensagem_whatsapp_template: string | null;
  mensagem_confirmacao_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotDisponivel {
  hora_inicio: string; // HH:MM — overall start (first service)
  hora_fim: string; // HH:MM — overall end
  // For combos:
  combo_ordem?: "maquiagem_primeiro" | "cabelo_primeiro";
  hora_maquiagem?: string; // HH:MM — when maquiagem block starts
  hora_cabelo?: string; // HH:MM — when cabelo block starts
}
