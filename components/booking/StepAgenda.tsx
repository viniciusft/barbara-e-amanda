"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Servico, SlotDisponivel } from "@/types";

interface Props {
  servico: Servico;
  selectedData: string;
  selectedSlot: SlotDisponivel | null;
  onSelect: (data: string, slot: SlotDisponivel) => void;
  onBack: () => void;
}

function generateDays(count = 30): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

export default function StepAgenda({
  servico,
  selectedData,
  selectedSlot,
  onSelect,
  onBack,
}: Props) {
  const [days] = useState<Date[]>(generateDays(45));
  const [activeDate, setActiveDate] = useState<string>(selectedData || "");
  const [slots, setSlots] = useState<SlotDisponivel[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotLocal, setSelectedSlotLocal] = useState<SlotDisponivel | null>(
    selectedSlot
  );

  useEffect(() => {
    if (!activeDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlotLocal(null);

    fetch(`/api/slots?data=${activeDate}&servico_id=${servico.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSlots(d);
      })
      .finally(() => setLoadingSlots(false));
  }, [activeDate, servico.id]);

  function handleSlotSelect(slot: SlotDisponivel) {
    setSelectedSlotLocal(slot);
    onSelect(activeDate, slot);
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#F5F0E8] font-light mb-2">
        Data & Horário
      </h2>
      <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8">
        Serviço: <span className="text-[#C9A84C]">{servico.nome}</span>
      </p>

      {/* Calendar strip */}
      <div className="mb-8">
        <p className="text-[rgba(245,240,232,0.4)] text-xs font-sans uppercase tracking-widest mb-4">
          Selecione a data
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = activeDate === dateStr;
            const dayName = format(day, "EEE", { locale: ptBR });
            const dayNum = format(day, "d");
            const monthName = format(day, "MMM", { locale: ptBR });

            return (
              <button
                key={dateStr}
                onClick={() => setActiveDate(dateStr)}
                className={`flex flex-col items-center shrink-0 w-14 py-3 border transition-all duration-200 ${
                  isSelected
                    ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                    : "border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.6)] hover:border-[rgba(201,168,76,0.4)]"
                }`}
              >
                <span className="text-xs font-sans capitalize">{dayName}</span>
                <span className="text-xl font-display font-medium leading-tight">{dayNum}</span>
                <span className="text-xs font-sans capitalize">{monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {activeDate && (
        <div>
          <p className="text-[rgba(245,240,232,0.4)] text-xs font-sans uppercase tracking-widest mb-4">
            Horários disponíveis
          </p>

          {loadingSlots && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <span className="text-[rgba(245,240,232,0.4)] text-sm font-sans">Carregando horários...</span>
            </div>
          )}

          {!loadingSlots && slots.length === 0 && (
            <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm py-4 border border-[rgba(201,168,76,0.1)] px-4">
              Nenhum horário disponível para esta data. Por favor, escolha outra data.
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlotLocal?.hora_inicio === slot.hora_inicio;
              return (
                <button
                  key={slot.hora_inicio}
                  onClick={() => handleSlotSelect(slot)}
                  className={`py-3 text-sm font-sans border transition-all duration-200 ${
                    isSelected
                      ? "border-[#C9A84C] bg-[#C9A84C] text-[#0a0a0a] font-medium"
                      : "border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.7)] hover:border-[rgba(201,168,76,0.5)]"
                  }`}
                >
                  {slot.hora_inicio}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!activeDate && (
        <div className="border border-[rgba(201,168,76,0.1)] p-8 text-center">
          <p className="text-[rgba(245,240,232,0.3)] font-sans text-sm">
            Selecione uma data para ver os horários disponíveis
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="border border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.6)] px-6 py-3 font-sans text-sm hover:border-[rgba(201,168,76,0.5)] transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
