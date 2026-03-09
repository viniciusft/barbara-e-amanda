"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, addWeeks, subWeeks, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Agendamento } from "@/types";
import AgendamentoCard from "@/components/admin/AgendamentoCard";
import NovoAgendamentoModal from "@/components/admin/NovoAgendamentoModal";

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

const STATUS_COLORS: Record<string, string> = {
  pendente: "rgba(201,168,76,0.85)",
  confirmado: "rgba(76,175,80,0.85)",
  cancelado: "rgba(100,100,100,0.7)",
  concluido: "rgba(30,100,30,0.85)",
};

// Left border colors by category
const CATEGORIA_BORDER: Record<string, string> = {
  maquiagem: "#9B2335",
  cabelo: "#2E86AB",
  combo: "#C9A84C",
};
const CATEGORIA_ICON: Record<string, string> = {
  maquiagem: "💄",
  cabelo: "💇",
  combo: "✨",
};

const DAY_LABELS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function getTopPx(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
}

function getHeightPx(duracao: number): number {
  return Math.max((duracao / 60) * HOUR_HEIGHT, 28);
}

// A "visual block" — one renderable rectangle on the calendar
interface CalBlock {
  id: string;       // unique key (agendamento id + suffix for combos)
  top: number;
  height: number;
  agendamento: Agendamento;
  label: string;
  borderColor: string;
}

// Assign side-by-side column positions to overlapping blocks.
// Returns array of { block, colIndex, numCols }.
function assignColumns(blocks: CalBlock[]): { block: CalBlock; colIndex: number; numCols: number }[] {
  if (blocks.length === 0) return [];

  // Sort by top (start time)
  const sorted = [...blocks].sort((a, b) => a.top - b.top);

  // Greedy column assignment: keep track of when each column becomes free
  const colEnds: number[] = [];
  const assigned: { block: CalBlock; colIndex: number }[] = [];

  for (const block of sorted) {
    // Find first column whose end <= block.top
    let col = colEnds.findIndex((end) => end <= block.top);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(0);
    }
    colEnds[col] = block.top + block.height;
    assigned.push({ block, colIndex: col });
  }

  // Determine numCols for each block: find all blocks that overlap with it
  // and use the max column count within each connected component.
  // Simple: for each block, numCols = max(colIndex+1) of all blocks it overlaps with.
  const numColsMap = new Map<string, number>();
  for (const a of assigned) {
    let maxCols = a.colIndex + 1;
    for (const b of assigned) {
      if (a.block.top < b.block.top + b.block.height && a.block.top + a.block.height > b.block.top) {
        maxCols = Math.max(maxCols, b.colIndex + 1);
      }
    }
    numColsMap.set(a.block.id, maxCols);
  }

  return assigned.map(({ block, colIndex }) => ({
    block,
    colIndex,
    numCols: numColsMap.get(block.id) ?? 1,
  }));
}

export default function AdminDashboard() {
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agendamento | null>(null);
  const [showNovoModal, setShowNovoModal] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart + "T12:00:00"), i), "yyyy-MM-dd")
  );

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agendamentos?semana=${weekStart}`);
      const data = await res.json();
      if (Array.isArray(data)) setAgendamentos(data);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAgendamentos();
    setSelected(null);
  }

  function handleAgendamentoUpdated(updated: Agendamento) {
    setAgendamentos((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  }

  const prevWeek = () =>
    setWeekStart(
      format(subWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd")
    );
  const nextWeek = () =>
    setWeekStart(
      format(addWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd")
    );
  const goToday = () =>
    setWeekStart(
      format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    );

  const today = format(new Date(), "yyyy-MM-dd");

  function getForDay(dateStr: string) {
    return agendamentos.filter((a) => a.data === dateStr);
  }

  const weekLabel = `${format(new Date(weekStart + "T12:00:00"), "dd MMM", { locale: ptBR })} - ${format(addDays(new Date(weekStart + "T12:00:00"), 6), "dd MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
          Agenda
        </h2>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowNovoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans bg-[#C9A84C] text-[#0a0a0a] font-medium hover:bg-[#d4b563] transition-colors"
          >
            <Plus size={13} strokeWidth={2} />
            Novo
          </button>
          {/* Calendar jump picker */}
          <div className="relative">
            <button
              type="button"
              className="p-1.5 text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)] transition-colors rounded-sm cursor-pointer"
              title="Ir para data"
            >
              <Calendar size={18} strokeWidth={1.5} />
            </button>
            <input
              type="date"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  setWeekStart(
                    format(
                      startOfWeek(parseISO(e.target.value + "T12:00:00"), {
                        weekStartsOn: 1,
                      }),
                      "yyyy-MM-dd"
                    )
                  );
                }
              }}
            />
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-sans border border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.6)] hover:border-[rgba(201,168,76,0.5)] transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={prevWeek}
            className="p-1.5 border border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,168,76,0.5)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="relative min-w-[150px] text-center">
            <span className="text-sm font-sans text-[rgba(245,240,232,0.6)] cursor-pointer hover:text-[rgba(245,240,232,0.9)] transition-colors select-none">
              {weekLabel}
            </span>
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              onChange={(e) => {
                if (e.target.value) {
                  setWeekStart(
                    format(
                      startOfWeek(parseISO(e.target.value + "T12:00:00"), {
                        weekStartsOn: 1,
                      }),
                      "yyyy-MM-dd"
                    )
                  );
                }
              }}
            />
          </div>
          <button
            onClick={nextWeek}
            className="p-1.5 border border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,168,76,0.5)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Mobile: list only */}
      <div className="lg:hidden">
        {loading && (
          <div className="flex items-center gap-3 py-8">
            <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">
              Carregando...
            </span>
          </div>
        )}
        {!loading && agendamentos.length === 0 && (
          <div className="border border-[rgba(201,168,76,0.1)] p-12 text-center">
            <p className="text-[rgba(245,240,232,0.3)] font-sans">
              Nenhum agendamento esta semana.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {agendamentos
            .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
            .map((a) => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                onStatusChange={handleStatusChange}
                onUpdated={handleAgendamentoUpdated}
              />
            ))}
        </div>
      </div>

      {/* Desktop: two-column calendar */}
      <div
        className="hidden lg:flex gap-4"
        style={{ height: "calc(100vh - 220px)" }}
      >
        {/* Left: list panel */}
        <div className="w-72 flex flex-col border border-[rgba(201,168,76,0.12)] bg-[#141414] overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-[rgba(201,168,76,0.1)] shrink-0">
            <p className="text-xs font-sans text-[rgba(245,240,232,0.4)] uppercase tracking-widest">
              {agendamentos.length} agendamento
              {agendamentos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && agendamentos.length === 0 && (
              <p className="text-[rgba(245,240,232,0.3)] font-sans text-sm text-center py-8">
                Nenhum agendamento.
              </p>
            )}
            {agendamentos
              .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
              .map((a) => {
                const statusColor: Record<string, string> = {
                  pendente: "border-yellow-800/40 bg-yellow-950/20",
                  confirmado: "border-green-800/40 bg-green-950/20",
                  cancelado: "border-[rgba(255,255,255,0.05)] opacity-60",
                  concluido: "border-blue-800/40 bg-blue-950/20",
                };
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`w-full text-left border p-3 transition-all hover:border-[rgba(201,168,76,0.3)] ${
                      statusColor[a.status] ?? ""
                    } ${selected?.id === a.id ? "border-[rgba(201,168,76,0.4)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-display text-[#F5F0E8] text-base leading-tight truncate">
                        {a.nome_cliente}
                      </p>
                      <p className="font-sans text-xs text-[#C9A84C] shrink-0">
                        {a.hora_inicio}
                      </p>
                    </div>
                    <p className="font-sans text-xs text-[rgba(245,240,232,0.45)] truncate">
                      {a.servico_nome}
                    </p>
                    <p className="font-sans text-[10px] text-[rgba(245,240,232,0.3)] mt-0.5">
                      {a.data
                        ? format(new Date(a.data + "T12:00:00"), "EEE dd/MM", {
                            locale: ptBR,
                          })
                        : ""}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right: calendar grid */}
        <div className="flex-1 border border-[rgba(201,168,76,0.12)] bg-[#141414] overflow-auto scrollbar-thin">
          {/* Day headers sticky */}
          <div
            className="sticky top-0 z-10 bg-[#141414] grid border-b border-[rgba(201,168,76,0.1)]"
            style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
          >
            <div className="border-r border-[rgba(201,168,76,0.06)]" />
            {weekDays.map((day, i) => {
              const isToday = day === today;
              const dayDate = new Date(day + "T12:00:00");
              return (
                <div
                  key={day}
                  className={`text-center py-2.5 border-l border-[rgba(201,168,76,0.06)] ${
                    isToday ? "bg-[rgba(201,168,76,0.05)]" : ""
                  }`}
                >
                  <p
                    className={`text-[9px] font-sans uppercase tracking-widest ${
                      isToday
                        ? "text-[#C9A84C]"
                        : "text-[rgba(245,240,232,0.3)]"
                    }`}
                  >
                    {DAY_LABELS_SHORT[i]}
                  </p>
                  <p
                    className={`font-display text-xl font-light ${
                      isToday ? "text-[#C9A84C]" : "text-[#F5F0E8]"
                    }`}
                  >
                    {format(dayDate, "dd")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
          >
            {/* Time labels */}
            <div className="border-r border-[rgba(201,168,76,0.06)]">
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="flex items-start justify-end pr-2 pt-1.5"
                >
                  <span className="text-[10px] text-[rgba(245,240,232,0.2)] font-sans tabular-nums">
                    {h.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const isToday = day === today;
              const dayAgendamentos = getForDay(day);

              // Build visual blocks (combos → two blocks each)
              const rawBlocks: CalBlock[] = dayAgendamentos.flatMap((a) => {
                const cat = a.categoria_servico ?? "maquiagem";

                if (cat === "combo" && a.hora_inicio_cabelo) {
                  const maqHora = a.hora_inicio_maquiagem ?? a.hora_inicio ?? "08:00";
                  const cabHora = a.hora_inicio_cabelo;
                  const maqDur = a.servico?.duracao_maquiagem_min ?? Math.floor(a.servico_duracao / 2);
                  const cabDur = a.servico?.duracao_cabelo_min ?? (a.servico_duracao - maqDur);
                  return [
                    {
                      id: `${a.id}-maq`,
                      top: getTopPx(maqHora),
                      height: getHeightPx(maqDur),
                      agendamento: a,
                      label: `💄 ${maqHora}\n${a.nome_cliente}`,
                      borderColor: CATEGORIA_BORDER.maquiagem,
                    } as CalBlock,
                    {
                      id: `${a.id}-cab`,
                      top: getTopPx(cabHora),
                      height: getHeightPx(cabDur),
                      agendamento: a,
                      label: `💇 ${cabHora}\n↑ combo`,
                      borderColor: CATEGORIA_BORDER.cabelo,
                    } as CalBlock,
                  ];
                }

                return [
                  {
                    id: a.id,
                    top: getTopPx(a.hora_inicio ?? "08:00"),
                    height: getHeightPx(a.servico_duracao),
                    agendamento: a,
                    label: `${CATEGORIA_ICON[cat] ?? "💄"} ${a.hora_inicio}\n${a.nome_cliente}`,
                    borderColor: CATEGORIA_BORDER[cat] ?? CATEGORIA_BORDER.maquiagem,
                  } as CalBlock,
                ];
              });

              const positioned = assignColumns(rawBlocks);

              return (
                <div
                  key={day}
                  className={`relative border-l border-[rgba(201,168,76,0.06)] ${
                    isToday ? "bg-[rgba(201,168,76,0.02)]" : ""
                  }`}
                  style={{ height: HOURS.length * HOUR_HEIGHT }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-[rgba(201,168,76,0.05)]"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}
                  {positioned.map(({ block, colIndex, numCols }) => {
                    const widthPct = 100 / numCols;
                    const leftPct = colIndex * widthPct;
                    const lines = block.label.split("\n");
                    return (
                      <button
                        key={block.id}
                        className="absolute text-left overflow-hidden hover:brightness-125 transition-all z-10"
                        style={{
                          top: block.top,
                          height: block.height,
                          left: `calc(${leftPct}% + 1px)`,
                          width: `calc(${widthPct}% - 2px)`,
                          backgroundColor: STATUS_COLORS[block.agendamento.status] ?? STATUS_COLORS.pendente,
                          borderLeft: `3px solid ${block.borderColor}`,
                        }}
                        onClick={() => setSelected(block.agendamento)}
                      >
                        <div className="px-1 py-0.5">
                          {lines.map((line, i) => (
                            <p key={i} className={`font-sans truncate leading-tight ${i === 0 ? "text-[9px] text-white/90 font-semibold" : "text-[9px] text-white/70"}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Novo agendamento modal */}
      {showNovoModal && (
        <NovoAgendamentoModal
          onClose={() => setShowNovoModal(false)}
          onCreated={() => { setShowNovoModal(false); fetchAgendamentos(); }}
        />
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#141414] border border-[rgba(201,168,76,0.3)] max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-1">
                  Detalhes
                </p>
                <h3 className="font-display text-2xl text-[#F5F0E8] font-light">
                  {selected.nome_cliente}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.8)] transition-colors mt-1"
              >
                <X size={20} />
              </button>
            </div>
            <AgendamentoCard
              agendamento={selected}
              onStatusChange={handleStatusChange}
              onUpdated={handleAgendamentoUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
