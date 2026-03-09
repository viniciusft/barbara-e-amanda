"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Agendamento } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  agendamento: Agendamento;
  onClose: () => void;
  onSaved: (updated: Agendamento) => void;
}

const FORMAS_PAGAMENTO = [
  { label: "PIX", value: "pix" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Crédito", value: "credito" },
  { label: "Débito", value: "debito" },
  { label: "Outro", value: "outro" },
];

export default function ExecucaoModal({ agendamento, onClose, onSaved }: Props) {
  const precoOriginal = agendamento.servico?.preco ?? 0;

  const [servicoExecutado, setServicoExecutado] = useState(true);
  const [precoCobrado, setPrecoCobrado] = useState(
    String(agendamento.preco_cobrado ?? precoOriginal)
  );
  const [motivoAjuste, setMotivoAjuste] = useState(agendamento.motivo_ajuste ?? "");
  const [formaPagamento, setFormaPagamento] = useState(agendamento.forma_pagamento ?? "pix");
  const [observacoes, setObservacoes] = useState(agendamento.observacoes_execucao ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const precoNum = parseFloat(precoCobrado) || 0;
  const diff = precoNum - precoOriginal;
  const tipoAjuste =
    diff < -0.01 ? "desconto" : diff > 0.01 ? "acrescimo" : null;

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agendamentos/${agendamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "concluido",
          servico_executado: servicoExecutado,
          preco_cobrado: precoNum,
          preco_original: precoOriginal,
          tipo_ajuste_preco: tipoAjuste,
          motivo_ajuste: motivoAjuste || null,
          forma_pagamento: formaPagamento,
          observacoes_execucao: observacoes || null,
          executado_em: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar");
      }
      const updated = await res.json();
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#141414] border border-[rgba(201,168,76,0.2)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,168,76,0.12)]">
          <div>
            <p className="text-[#C9A84C] text-[9px] tracking-[0.3em] uppercase font-sans mb-0.5">
              Confirmar Execução
            </p>
            <h3 className="font-display text-lg text-[#F5F0E8] font-light">
              Como foi o atendimento?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[rgba(245,240,232,0.3)] hover:text-[rgba(245,240,232,0.7)] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Cliente + Serviço resumo */}
          <div className="bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.1)] px-4 py-3">
            <p className="text-[#F5F0E8] font-sans text-sm font-medium">
              {agendamento.nome_cliente}
            </p>
            <p className="text-[#C9A84C] font-sans text-xs mt-0.5">
              {agendamento.servico?.nome ?? agendamento.servico_nome}
            </p>
          </div>

          {/* Serviço executado toggle */}
          <div>
            <p className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider mb-2">
              Serviço executado?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setServicoExecutado(true)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-sans border transition-colors ${
                  servicoExecutado
                    ? "border-green-700 bg-green-950/40 text-green-400"
                    : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)]"
                }`}
              >
                <CheckCircle size={14} /> Sim
              </button>
              <button
                onClick={() => setServicoExecutado(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-sans border transition-colors ${
                  !servicoExecutado
                    ? "border-red-800 bg-red-950/40 text-red-400"
                    : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)]"
                }`}
              >
                <XCircle size={14} /> Não
              </button>
            </div>
          </div>

          {/* Preço cobrado */}
          <div>
            <label className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Preço cobrado
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.4)] text-sm font-sans">
                  R$
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={precoCobrado}
                  onChange={(e) => setPrecoCobrado(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#F5F0E8] font-sans text-sm px-4 py-2 pl-10 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>
              {tipoAjuste === "desconto" && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs font-sans border border-yellow-800 bg-yellow-950/30 px-2 py-1 whitespace-nowrap">
                  <TrendingDown size={12} />
                  Desconto {formatCurrency(Math.abs(diff))}
                </span>
              )}
              {tipoAjuste === "acrescimo" && (
                <span className="flex items-center gap-1 text-blue-400 text-xs font-sans border border-blue-800 bg-blue-950/30 px-2 py-1 whitespace-nowrap">
                  <TrendingUp size={12} />
                  Acréscimo {formatCurrency(diff)}
                </span>
              )}
              {!tipoAjuste && (
                <span className="text-[rgba(245,240,232,0.25)] text-xs font-sans whitespace-nowrap">
                  Tabela: {formatCurrency(precoOriginal)}
                </span>
              )}
            </div>
          </div>

          {/* Motivo ajuste (se houver) */}
          {tipoAjuste && (
            <div>
              <label className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider block mb-1.5">
                Motivo do ajuste
              </label>
              <input
                type="text"
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
                placeholder="Ex: cliente fidelidade, serviço adicional..."
                className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#F5F0E8] font-sans text-sm px-3 py-2 focus:outline-none focus:border-[#C9A84C] placeholder-[rgba(245,240,232,0.2)]"
              />
            </div>
          )}

          {/* Forma de pagamento */}
          <div>
            <label className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Forma de pagamento
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMAS_PAGAMENTO.map((forma) => (
                <button
                  key={forma.value}
                  onClick={() => setFormaPagamento(forma.value)}
                  className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
                    formaPagamento === forma.value
                      ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                      : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.25)]"
                  }`}
                >
                  {forma.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Anotações sobre o atendimento..."
              className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#F5F0E8] font-sans text-sm px-3 py-2 focus:outline-none focus:border-[#C9A84C] placeholder-[rgba(245,240,232,0.2)] resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-sans">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-sans border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-sans bg-[#C9A84C] text-[#0a0a0a] font-medium hover:bg-[#d4b563] transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Registrar Execução"}
          </button>
        </div>
      </div>
    </div>
  );
}
