export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  cor_agenda: string | null;
  ordem: number | null;
  created_at: string;
}

export interface HorarioDisponivel {
  id: string;
  dia_semana: number; // 0=domingo, 1=segunda, ..., 6=sábado
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  ativo: boolean;
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
  data_hora: string; // ISO timestamptz
  data_hora_fim: string; // ISO timestamptz
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
  gcal_event_id: string | null;
  created_at: string;
  updated_at: string;
  servico?: Servico;
  // Computed display fields added by API
  data?: string; // YYYY-MM-DD (BRT)
  hora_inicio?: string; // HH:MM (BRT)
  hora_fim?: string; // HH:MM (BRT)
}

export interface AdminConfig {
  id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  google_calendar_id: string | null;
  nome_studio: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotDisponivel {
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
}
