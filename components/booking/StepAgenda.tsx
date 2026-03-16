"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
  addDays,
  startOfDay,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Servico, SlotDisponivel, HorarioDisponivel, Bloqueio } from "@/types";
import { PublicConfig } from "./BookingWizard";

interface Props {
  servico: Servico;
  selectedData: string;
  selectedSlot: SlotDisponivel | null;
  config: PublicConfig;
  onSelect: (data: string, slot: SlotDisponivel) => void;
  onBack: () => void;
}

const DAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

export default function StepAgenda({
  servico,
  selectedData,
  selectedSlot,
  config,
  onSelect,
  onBack,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedData) {
      return startOfMonth(parseISO(selectedData + "T12:00:00"));
    }
    return startOfMonth(new Date());
  });

  const [activeDate, setActiveDate] = useState<string>(selectedData || "");
  const [slots, setSlots] = useState<SlotDisponivel[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotLocal, setSelectedSlotLocal] = useState<SlotDisponivel | null>(
    selectedSlot
  );
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  // Load schedule and blockages once
  useEffect(() => {
    Promise.all([
      fetch("/api/horarios").then((r) => r.json()),
      fetch("/api/bloqueios").then((r) => r.json()),
    ])
      .then(([h, b]) => {
        if (Array.isArray(h)) setHorarios(h);
        if (Array.isArray(b)) setBloqueios(b);
      })
      .finally(() => setLoadingCalendar(false));
  }, []);

  // Active weekdays from schedule (0=Sun ... 6=Sat)
  const activeDaysOfWeek = useMemo(
    () => new Set(horarios.filter((h) => h.ativo).map((h) => h.dia_semana)),
    [horarios]
  );

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 365);

  // Calendar days for current month view (Mon-first grid)
  const calDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  function isDayBlocked(date: Date): boolean {
    const ds = format(date, "yyyy-MM-dd");
    return bloqueios.some((b) => b.data_inicio && b.data_fim && ds >= b.data_inicio && ds <= b.data_fim);
  }

  function isDayDisabled(date: Date): boolean {
    if (isBefore(date, today)) return true;
    if (isAfter(date, maxDate)) return true;
    if (!activeDaysOfWeek.has(date.getDay())) return true;
    if (isDayBlocked(date)) return true;
    return false;
  }

  function isInCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  }

  // Fetch slots when date changes
  const fetchSlots = useCallback(async () => {
    if (!activeDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlotLocal(null);
    try {
      const res = await fetch(
        `/api/slots?data=${activeDate}&servico_id=${servico.id}`
      );
      const d = await res.json();
      if (Array.isArray(d)) setSlots(d);
    } finally {
      setLoadingSlots(false);
    }
  }, [activeDate, servico.id]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function handleDayClick(date: Date) {
    if (isDayDisabled(date)) return;
    setActiveDate(format(date, "yyyy-MM-dd"));
  }

  function handleSlotSelect(slot: SlotDisponivel) {
    setSelectedSlotLocal(slot);
    onSelect(activeDate, slot);
  }

  const todayStr = format(today, "yyyy-MM-dd");
  const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
  const nextMonthStart = startOfMonth(addMonths(currentMonth, 1));

  return (
    <div>
      <h2 className="font-display text-3xl text-[#111111] font-light mb-2">
        Data & Horário
      </h2>
      <p className="text-[#6B7280] font-sans text-sm mb-6">
        Serviço: <span className="text-[#A07830] font-medium">{servico.nome}</span>
      </p>

      {/* Calendar */}
      <div className="mb-8">
        {loadingCalendar ? (
          <div className="flex items-center gap-3 py-10">
            <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#9CA3AF] font-sans text-sm">
              Carregando calendário...
            </span>
          </div>
        ) : (
          <>
            {/* Month header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                disabled={isBefore(prevMonthEnd, today)}
                className="p-2 text-[#6B7280] hover:text-[#111111] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-display text-xl text-[#111111] font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                disabled={isAfter(nextMonthStart, maxDate)}
                className="p-2 text-[#6B7280] hover:text-[#111111] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[9px] font-sans text-[#9CA3AF] uppercase tracking-widest py-1.5"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((day) => {
                const ds = format(day, "yyyy-MM-dd");
                const disabled = isDayDisabled(day);
                const inMonth = isInCurrentMonth(day);
                const isToday = ds === todayStr;
                const isSelected = activeDate === ds;

                return (
                  <button
                    key={ds}
                    onClick={() => handleDayClick(day)}
                    disabled={disabled}
                    className={[
                      "relative h-10 sm:h-11 text-sm font-sans transition-all duration-150 rounded-sm",
                      !inMonth ? "opacity-20" : "",
                      isSelected
                        ? "bg-[#111111] text-white font-semibold rounded-full"
                        : disabled
                        ? "text-[#D4CFC5] cursor-not-allowed"
                        : isToday
                        ? "border border-[#C9A84C] text-[#C9A84C] hover:bg-[#F5F4F0] rounded-full"
                        : "text-[#111111] hover:bg-[#EDEAE4] cursor-pointer",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 pl-1">
              <span className="flex items-center gap-1.5 text-[10px] font-sans text-[#9CA3AF]">
                <span className="inline-block w-3 h-3 border border-[#C9A84C] rounded-sm" />
                Hoje
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-sans text-[#9CA3AF]">
                <span className="inline-block w-3 h-3 bg-[#111111] rounded-sm" />
                Selecionado
              </span>
            </div>
          </>
        )}
      </div>

      {/* Slots */}
      {activeDate && !loadingCalendar && (
        <div>
          <p className="text-[#9CA3AF] text-xs font-sans uppercase tracking-widest mb-4">
            Horários disponíveis — {format(parseISO(activeDate + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
          </p>

          {loadingSlots && (
            <div className="flex items-center gap-3 py-6">
              <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#9CA3AF] text-sm font-sans">
                Carregando horários...
              </span>
            </div>
          )}

          {!loadingSlots && slots.length === 0 && (
            <p className="text-[#6B7280] font-sans text-sm py-4 border border-[#E5E0D8] px-4 rounded-lg">
              Nenhum horário disponível para esta data. Escolha outro dia.
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected =
                selectedSlotLocal?.hora_inicio === slot.hora_inicio;
              return (
                <button
                  key={slot.hora_inicio}
                  onClick={() => handleSlotSelect(slot)}
                  className={`py-3 text-sm font-sans border rounded-lg transition-all duration-200 ${
                    isSelected
                      ? "border-[#C9A84C] bg-[#C9A84C] text-white font-medium"
                      : "border-[#E5E0D8] bg-white text-[#111111] hover:border-[#C9A84C]"
                  }`}
                >
                  {slot.hora_inicio}
                </button>
              );
            })}
          </div>

          {/* Combo schedule summary — shown after selecting a combo slot */}
          {selectedSlotLocal?.combo_ordem && (
            <div className="mt-4 p-4 border border-[#E5E0D8] bg-white rounded-lg">
              <p className="text-[#9CA3AF] font-sans text-xs uppercase tracking-widest mb-3">
                Seu atendimento será organizado assim:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💄</span>
                  <div>
                    <p className="font-sans text-sm text-[#111111]">Maquiagem</p>
                    <p className="font-sans text-xs text-[#A07830]">
                      {selectedSlotLocal.hora_maquiagem} –{" "}
                      {selectedSlotLocal.combo_ordem === "maquiagem_primeiro"
                        ? selectedSlotLocal.hora_cabelo
                        : selectedSlotLocal.hora_fim}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">💇</span>
                  <div>
                    <p className="font-sans text-sm text-[#111111]">Cabelo</p>
                    <p className="font-sans text-xs text-[#A07830]">
                      {selectedSlotLocal.hora_cabelo} –{" "}
                      {selectedSlotLocal.combo_ordem === "cabelo_primeiro"
                        ? selectedSlotLocal.hora_maquiagem
                        : selectedSlotLocal.hora_fim}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!activeDate && !loadingCalendar && (
        <div className="border border-[#E5E0D8] p-8 text-center rounded-lg">
          <p className="text-[#9CA3AF] font-sans text-sm">
            Selecione um dia no calendário para ver os horários disponíveis
          </p>
        </div>
      )}

      {/* Horário personalizado */}
      {!loadingCalendar && (
        <div className="mt-8 pt-6 border-t border-[#E5E0D8] text-center">
          <p className="text-[#9CA3AF] text-xs font-sans mb-3">
            Não encontrou um horário disponível?
          </p>
          <a
            href={
              config.whatsapp
                ? `https://wa.me/55${config.whatsapp}?text=${encodeURIComponent(config.mensagem_horario_personalizado)}`
                : `https://wa.me/?text=${encodeURIComponent(config.mensagem_horario_personalizado)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#A07830] text-sm font-sans underline transition-colors"
          >
            <MessageCircle size={14} strokeWidth={1.5} />
            Solicitar horário personalizado
          </a>
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="border border-[#E5E0D8] text-[#6B7280] px-6 py-3 font-sans text-sm hover:border-[#C9A84C] hover:text-[#A07830] transition-colors rounded-lg"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
