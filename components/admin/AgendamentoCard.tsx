"use client";

import { useState } from "react";
import { Agendamento } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface Props {
  agendamento: Agendamento;
  onStatusChange: (id: string, status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "text-yellow-400 border-yellow-800 bg-yellow-950/30" },
  confirmado: { label: "Confirmado", color: "text-green-400 border-green-800 bg-green-950/30" },
  cancelado: { label: "Cancelado", color: "text-red-400 border-red-800 bg-red-950/30" },
  concluido: { label: "Concluído", color: "text-blue-400 border-blue-800 bg-blue-950/30" },
};

export default function AgendamentoCard({ agendamento, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const config = STATUS_CONFIG[agendamento.status] ?? STATUS_CONFIG.pendente;

  async function handleAction(status: string) {
    setLoading(true);
    await onStatusChange(agendamento.id, status);
    setLoading(false);
  }

  return (
    <div className="border border-[rgba(201,168,76,0.15)] bg-[#141414] p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Horário */}
        <div className="shrink-0 text-center sm:w-20">
          <p className="font-display text-2xl text-[#C9A84C]">
            {agendamento.hora_inicio}
          </p>
          <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
            até {agendamento.hora_fim}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h4 className="font-display text-lg text-[#F5F0E8]">
                {agendamento.nome_cliente}
              </h4>
              <p className="text-[#C9A84C] text-sm font-sans">
                {agendamento.servico?.nome ?? agendamento.servico_nome}
              </p>
            </div>
            <span
              className={`border px-2 py-1 text-xs font-sans shrink-0 ${config.color}`}
            >
              {config.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-sans text-[rgba(245,240,232,0.5)]">
            <span>{agendamento.telefone}</span>
            {agendamento.email && (
              <span>{agendamento.email}</span>
            )}
            {agendamento.servico && (
              <span>
                {formatDuration(agendamento.servico.duracao_minutos)} ·{" "}
                {formatCurrency(agendamento.servico.preco)}
              </span>
            )}
          </div>

          {agendamento.observacoes && (
            <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans mt-2 italic">
              &ldquo;{agendamento.observacoes}&rdquo;
            </p>
          )}
        </div>

        {/* Actions */}
        {agendamento.status !== "cancelado" && (
          <div className="flex gap-2 shrink-0">
            {agendamento.status === "pendente" && (
              <button
                onClick={() => handleAction("confirmado")}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-sans border border-green-800 text-green-400 hover:bg-green-950/30 transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            )}
            <button
              onClick={() => handleAction("cancelado")}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-sans border border-red-900 text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
