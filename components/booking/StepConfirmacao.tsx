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
        <h2 className="font-display text-4xl text-[#111111] font-light mb-3">
          Solicitação Enviada! ✨
        </h2>
        <p className="text-[#6B7280] font-sans text-sm mb-8 max-w-sm mx-auto">
          Nossa equipe entrará em contato pelo WhatsApp para confirmar seu horário mediante o pagamento do sinal.
        </p>

        <div className="border border-[#E5E0D8] bg-white rounded-xl p-6 text-left mb-8 max-w-sm mx-auto">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest">Serviço</p>
              <p className="text-[#111111] font-display text-lg">{data.servico?.nome}</p>
            </div>
            <div className="border-t border-[#E5E0D8] pt-3">
              <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest">Data & Horário</p>
              <p className="text-[#111111] font-sans">{formatDateBR(data.data)} às {data.slot?.hora_inicio}</p>
            </div>
            <div className="border-t border-[#E5E0D8] pt-3">
              <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest">Nome</p>
              <p className="text-[#111111] font-sans">{data.nome}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="border border-[#E5E0D8] text-[#6B7280] px-6 py-3 font-sans font-medium rounded-lg hover:border-[#C9A84C] hover:text-[#A07830] transition-colors"
        >
          Fazer Nova Solicitação
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#111111] font-light mb-2">
        Confirmar Solicitação
      </h2>
      <p className="text-[#6B7280] font-sans text-sm mb-8">
        Revise os detalhes antes de enviar sua solicitação de agendamento
      </p>

      <div className="border border-[#E5E0D8] bg-white rounded-xl p-6 space-y-5 mb-6">
        {/* Serviço */}
        <div className="flex justify-between items-start pb-4 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
              Serviço
            </p>
            <p className="text-[#111111] font-display text-xl">{data.servico?.nome}</p>
            <p className="text-[#6B7280] text-sm font-sans">
              {formatDuration(data.servico?.duracao_minutos ?? 0)}
            </p>
          </div>
          <p className="text-[#A07830] font-bold text-xl">
            {formatCurrency(data.servico?.preco ?? 0)}
          </p>
        </div>

        {/* Data & Horário */}
        <div className="pb-4 border-b border-[#E5E0D8]">
          <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
            Data & Horário
          </p>
          <p className="text-[#111111] font-sans font-medium">
            {formatDateBR(data.data)} às {data.slot?.hora_inicio}
          </p>
        </div>

        {/* Dados do cliente */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
              Nome
            </p>
            <p className="text-[#111111] font-sans font-medium">{data.nome}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
              Telefone
            </p>
            <p className="text-[#111111] font-sans font-medium">{data.telefone}</p>
          </div>
          {data.email && (
            <div>
              <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
                Email
              </p>
              <p className="text-[#111111] font-sans font-medium">{data.email}</p>
            </div>
          )}
          {data.observacoes && (
            <div>
              <p className="text-xs text-[#6B7280] font-sans uppercase tracking-widest mb-1">
                Observações
              </p>
              <p className="text-[#111111] font-sans text-sm">{data.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 p-4 text-red-600 text-sm font-sans mb-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="border border-[#E5E0D8] text-[#6B7280] px-6 py-3 font-sans text-sm hover:border-[#C9A84C] hover:text-[#A07830] transition-colors disabled:opacity-50 rounded-lg"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 bg-[#C9A84C] text-[#111111] font-sans font-semibold py-3 rounded-lg hover:bg-[#A07830] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </button>
      </div>
    </div>
  );
}
