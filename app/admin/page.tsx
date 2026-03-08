"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento } from "@/types";
import AgendamentoCard from "@/components/admin/AgendamentoCard";

type ViewMode = "dia" | "semana";

export default function AdminDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("dia");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAgendamentos() {
    setLoading(true);
    let url = "/api/agendamentos?";
    if (viewMode === "dia") {
      url += `data=${selectedDate}`;
    } else {
      const weekStart = format(
        startOfWeek(new Date(selectedDate + "T12:00:00"), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      url += `semana=${weekStart}`;
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setAgendamentos(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate]);

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAgendamentos();
  }

  const grouped: Record<string, Agendamento[]> = {};
  for (const a of agendamentos) {
    const dateKey = a.data ?? a.data_hora.substring(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(a);
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
            Agendamentos
          </h2>
          <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm mt-1">
            {agendamentos.length} agendamento{agendamentos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-[rgba(201,168,76,0.2)]">
            {(["dia", "semana"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 text-sm font-sans capitalize transition-colors ${
                  viewMode === v
                    ? "bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                    : "text-[rgba(245,240,232,0.5)] hover:text-[rgba(245,240,232,0.8)]"
                }`}
              >
                {v === "dia" ? "Hoje" : "Semana"}
              </button>
            ))}
          </div>
          {/* Date picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.7)] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Carregando...</span>
        </div>
      )}

      {!loading && agendamentos.length === 0 && (
        <div className="border border-[rgba(201,168,76,0.1)] p-12 text-center">
          <p className="text-[rgba(245,240,232,0.3)] font-sans">
            Nenhum agendamento para este período.
          </p>
        </div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-8">
          {Object.keys(grouped)
            .sort()
            .map((date) => (
              <div key={date}>
                <h3 className="font-display text-xl text-[#C9A84C] mb-4">
                  {format(new Date(date + "T12:00:00"), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </h3>
                <div className="grid gap-3">
                  {grouped[date].map((a) => (
                    <AgendamentoCard
                      key={a.id}
                      agendamento={a}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
