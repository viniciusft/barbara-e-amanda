"use client";

import { useState } from "react";
import { BookingData } from "./BookingWizard";
import { formatCurrency, formatDuration, formatDateBR } from "@/lib/utils";

interface Props {
  data: BookingData;
  booked: boolean;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  onReset: () => void;
}

export default function StepConfirmacao({
  data,
  booked,
  onConfirm,
  onBack,
  onReset,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setError("");
    setLoading(true);
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao realizar agendamento");
    } finally {
      setLoading(false);
    }
  }

  if (booked) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-4xl text-[#F5F0E8] font-light mb-3">
          Solicitação Enviada! ✨
        </h2>
        <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8 max-w-sm mx-auto">
          Nossa equipe entrará em contato pelo WhatsApp para confirmar seu horário mediante o pagamento do sinal.
        </p>

        <div className="border border-[rgba(201,168,76,0.2)] bg-[#141414] p-6 text-left mb-8 max-w-sm mx-auto">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest">Serviço</p>
              <p className="text-[#F5F0E8] font-display text-lg">{data.servico?.nome}</p>
            </div>
            <div>
              <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest">Data & Horário</p>
              <p className="text-[#F5F0E8] font-sans">{formatDateBR(data.data)} às {data.slot?.hora_inicio}</p>
            </div>
            <div>
              <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest">Nome</p>
              <p className="text-[#F5F0E8] font-sans">{data.nome}</p>
            </div>
          </div>
        </div>

        <button onClick={onReset} className="btn-outline-gold">
          Fazer Nova Solicitação
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#F5F0E8] font-light mb-2">
        Confirmar Solicitação
      </h2>
      <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8">
        Revise os detalhes antes de enviar sua solicitação de agendamento
      </p>

      <div className="border border-[rgba(201,168,76,0.2)] bg-[#141414] p-6 space-y-5 mb-6">
        {/* Serviço */}
        <div className="flex justify-between items-start pb-4 border-b border-[rgba(201,168,76,0.1)]">
          <div>
            <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
              Serviço
            </p>
            <p className="text-[#F5F0E8] font-display text-xl">{data.servico?.nome}</p>
            <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans">
              {formatDuration(data.servico?.duracao_minutos ?? 0)}
            </p>
          </div>
          <p className="text-[#C9A84C] font-display text-xl">
            {formatCurrency(data.servico?.preco ?? 0)}
          </p>
        </div>

        {/* Data & Horário */}
        <div className="pb-4 border-b border-[rgba(201,168,76,0.1)]">
          <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
            Data & Horário
          </p>
          <p className="text-[#F5F0E8] font-sans">
            {formatDateBR(data.data)} às {data.slot?.hora_inicio}
          </p>
        </div>

        {/* Dados do cliente */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
              Nome
            </p>
            <p className="text-[#F5F0E8] font-sans">{data.nome}</p>
          </div>
          <div>
            <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
              Telefone
            </p>
            <p className="text-[#F5F0E8] font-sans">{data.telefone}</p>
          </div>
          {data.email && (
            <div>
              <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
                Email
              </p>
              <p className="text-[#F5F0E8] font-sans">{data.email}</p>
            </div>
          )}
          {data.observacoes && (
            <div>
              <p className="text-xs text-[rgba(245,240,232,0.4)] font-sans uppercase tracking-widest mb-1">
                Observações
              </p>
              <p className="text-[#F5F0E8] font-sans text-sm">{data.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-800 bg-red-950/20 p-4 text-red-400 text-sm font-sans mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="border border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.6)] px-6 py-3 font-sans text-sm hover:border-[rgba(201,168,76,0.5)] transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="btn-gold flex-1 flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </button>
      </div>
    </div>
  );
}
