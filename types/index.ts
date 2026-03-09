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
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
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
  servico?: Servico;
  // Computed display fields added by API
  data?: string; // YYYY-MM-DD (BRT)
  hora_inicio?: string; // HH:MM (BRT)
  hora_fim?: string; // HH:MM (BRT)
  hora_inicio_cabelo?: string; // HH:MM (BRT) — for combos
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
  created_at: string;
  updated_at: string;
}

export interface SlotDisponivel {
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  hora_inicio_cabelo?: string; // HH:MM — only for combos
}
