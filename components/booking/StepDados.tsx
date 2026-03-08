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
      <h2 className="font-display text-3xl text-[#F5F0E8] font-light mb-2">
        Seus Dados
      </h2>
      <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8">
        Preencha suas informações para concluir o agendamento
      </p>

      <div className="space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
            Nome completo <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder="Seu nome"
            className={`input-luxury ${errors.nome ? "border-red-600" : ""}`}
          />
          {errors.nome && (
            <p className="text-red-400 text-xs font-sans mt-1">{errors.nome}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
            Telefone / WhatsApp <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => onChange({ telefone: e.target.value })}
            placeholder="(11) 99999-9999"
            className={`input-luxury ${errors.telefone ? "border-red-600" : ""}`}
          />
          {errors.telefone && (
            <p className="text-red-400 text-xs font-sans mt-1">{errors.telefone}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
            Email <span className="text-[rgba(245,240,232,0.3)]">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="seu@email.com"
            className={`input-luxury ${errors.email ? "border-red-600" : ""}`}
          />
          {errors.email && (
            <p className="text-red-400 text-xs font-sans mt-1">{errors.email}</p>
          )}
        </div>

        {/* Observações (optional) */}
        <div>
          <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
            Observações <span className="text-[rgba(245,240,232,0.3)]">(opcional)</span>
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => onChange({ observacoes: e.target.value })}
            placeholder="Alguma preferência ou informação adicional?"
            rows={3}
            className="input-luxury resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="border border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.6)] px-6 py-3 font-sans text-sm hover:border-[rgba(201,168,76,0.5)] transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          className="btn-gold flex-1"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
