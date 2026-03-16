"use client";

import { useState } from "react";
import { BookingData } from "./BookingWizard";

interface Props {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  onChange: (partial: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const inputClass =
  "px-4 py-2.5 w-full rounded-lg border border-[#E5E0D8] bg-white text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors";

export default function StepDados({
  nome,
  telefone,
  email,
  observacoes,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    else if (!/^[\d\s\(\)\-\+]{10,}$/.test(telefone.trim()))
      newErrors.telefone = "Telefone inválido";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#111111] font-light mb-2">
        Seus Dados
      </h2>
      <p className="text-[#6B7280] font-sans text-sm mb-8">
        Preencha suas informações para concluir o agendamento
      </p>

      <div className="space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-sm font-sans text-[#6B7280] font-medium mb-1.5">
            Nome completo <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder="Seu nome"
            className={`${inputClass} ${errors.nome ? "border-red-400" : ""}`}
          />
          {errors.nome && (
            <p className="text-red-500 text-xs font-sans mt-1">{errors.nome}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-sans text-[#6B7280] font-medium mb-1.5">
            Telefone / WhatsApp <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => onChange({ telefone: e.target.value })}
            placeholder="(11) 99999-9999"
            className={`${inputClass} ${errors.telefone ? "border-red-400" : ""}`}
          />
          {errors.telefone && (
            <p className="text-red-500 text-xs font-sans mt-1">{errors.telefone}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-sm font-sans text-[#6B7280] font-medium mb-1.5">
            Email <span className="text-[#9CA3AF] font-normal">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="seu@email.com"
            className={`${inputClass} ${errors.email ? "border-red-400" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs font-sans mt-1">{errors.email}</p>
          )}
        </div>

        {/* Observações (optional) */}
        <div>
          <label className="block text-sm font-sans text-[#6B7280] font-medium mb-1.5">
            Observações <span className="text-[#9CA3AF] font-normal">(opcional)</span>
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => onChange({ observacoes: e.target.value })}
            placeholder="Alguma preferência ou informação adicional?"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="border border-[#E5E0D8] text-[#6B7280] px-6 py-3 font-sans text-sm hover:border-[#C9A84C] hover:text-[#A07830] transition-colors rounded-lg"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-[#C9A84C] text-[#111111] font-sans font-semibold py-3 rounded-lg hover:bg-[#A07830] hover:text-white transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
