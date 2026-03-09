"use client";

import { useState } from "react";
import { Agendamento } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { ClipboardCheck, TrendingDown, TrendingUp } from "lucide-react";
import ExecucaoModal from "./ExecucaoModal";

interface Props {
  agendamento: Agendamento;
  onStatusChange: (id: string, status: string) => void;
  onUpdated?: (updated: Agendamento) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "text-yellow-400 border-yellow-800 bg-yellow-950/30" },
  confirmado: { label: "Confirmado", color: "text-green-400 border-green-800 bg-green-950/30" },
  cancelado: { label: "Cancelado", color: "text-red-400 border-red-800 bg-red-950/30" },
  concluido: { label: "Concluído", color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
};

const PAGAMENTO_LABEL: Record<string, string> = {
  PIX: "PIX",
  Dinheiro: "Dinheiro",
  "Crédito": "Cartão Crédito",
  "Débito": "Cartão Débito",
  Outro: "Outro",
};

export default function AgendamentoCard({ agendamento, onStatusChange, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [showExecucao, setShowExecucao] = useState(false);
  const [current, setCurrent] = useState<Agendamento>(agendamento);

  const config = STATUS_CONFIG[current.status] ?? STATUS_CONFIG.pendente;

  // Show "Registrar execução" for confirmado appointments
  const canRegisterExecution = current.status === "confirmado";

  async function handleAction(status: string) {
    setLoading(true);
    await onStatusChange(current.id, status);
    setLoading(false);
  }

  function handleExecucaoSaved(updated: Agendamento) {
    // PATCH returns raw DB row — preserve computed fields (hora_inicio, hora_fim, data, servico)
    const merged: Agendamento = {
      ...current,
      status: updated.status ?? current.status,
      servico_executado: updated.servico_executado,
      preco_cobrado: updated.preco_cobrado,
      preco_original: updated.preco_original ?? current.preco_original,
      tipo_ajuste_preco: updated.tipo_ajuste_preco,
      motivo_ajuste: updated.motivo_ajuste,
      forma_pagamento: updated.forma_pagamento,
      observacoes_execucao: updated.observacoes_execucao,
      executado_em: updated.executado_em,
    };
    setCurrent(merged);
    setShowExecucao(false);
    onUpdated?.(merged);
  }

  const precoCobrado = current.preco_cobrado;
  const precoOriginal = current.preco_original ?? current.servico?.preco;
  const tipoAjuste = current.tipo_ajuste_preco;

  return (
    <>
      <div className="border border-[rgba(201,168,76,0.15)] bg-[#141414] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Horário */}
          <div className="shrink-0 text-center sm:w-20">
            <p className="font-display text-2xl text-[#C9A84C]">
              {current.hora_inicio}
            </p>
            <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
              até {current.hora_fim}
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="font-display text-lg text-[#F5F0E8]">
                  {current.nome_cliente}
                </h4>
                <p className="text-[#C9A84C] text-sm font-sans">
                  {current.servico?.nome ?? current.servico_nome}
                </p>
              </div>
              <span
                className={`border px-2 py-1 text-xs font-sans shrink-0 ${config.color}`}
              >
                {config.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-sans text-[rgba(245,240,232,0.5)]">
              <span>{current.telefone}</span>
              {current.email && <span>{current.email}</span>}
              {current.servico && (
                <span>
                  {formatDuration(current.servico.duracao_minutos)} ·{" "}
                  {formatCurrency(current.servico.preco)}
                </span>
              )}
            </div>

            {current.observacoes && (
              <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans mt-2 italic">
                &ldquo;{current.observacoes}&rdquo;
              </p>
            )}

            {/* Execution info (concluido) */}
            {current.status === "concluido" && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {precoCobrado !== null && precoCobrado !== undefined && (
                  <span className="text-emerald-400 text-sm font-sans font-medium">
                    {formatCurrency(precoCobrado)}
                  </span>
                )}
                {tipoAjuste === "desconto" && (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs font-sans border border-yellow-800 bg-yellow-950/30 px-2 py-0.5">
                    <TrendingDown size={11} />
                    Desconto
                    {precoOriginal && precoCobrado !== null && precoCobrado !== undefined
                      ? ` ${formatCurrency(precoOriginal - precoCobrado)}`
                      : ""}
                  </span>
                )}
                {tipoAjuste === "acrescimo" && (
                  <span className="flex items-center gap-1 text-blue-400 text-xs font-sans border border-blue-800 bg-blue-950/30 px-2 py-0.5">
                    <TrendingUp size={11} />
                    Acréscimo
                    {precoOriginal && precoCobrado !== null && precoCobrado !== undefined
                      ? ` ${formatCurrency(precoCobrado - precoOriginal)}`
                      : ""}
                  </span>
                )}
                {current.forma_pagamento && (
                  <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans border border-[rgba(255,255,255,0.08)] px-2 py-0.5">
                    {PAGAMENTO_LABEL[current.forma_pagamento] ?? current.forma_pagamento}
                  </span>
                )}
                {current.motivo_ajuste && (
                  <span className="text-[rgba(245,240,232,0.35)] text-xs font-sans italic">
                    {current.motivo_ajuste}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {canRegisterExecution && (
              <button
                onClick={() => setShowExecucao(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans border border-[#C9A84C] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
              >
                <ClipboardCheck size={13} />
                Registrar execução
              </button>
            )}
            {current.status !== "cancelado" && current.status !== "concluido" && (
              <div className="flex gap-2">
                {current.status === "pendente" && (
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
      </div>

      {showExecucao && (
        <ExecucaoModal
          agendamento={current}
          onClose={() => setShowExecucao(false)}
          onSaved={handleExecucaoSaved}
        />
      )}
    </>
  );
}
