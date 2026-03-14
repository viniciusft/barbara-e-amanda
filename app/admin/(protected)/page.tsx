"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, addWeeks, subWeeks, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Agendamento, AdminConfig } from "@/types";
import AgendamentoCard from "@/components/admin/AgendamentoCard";
import NovoAgendamentoModal from "@/components/admin/NovoAgendamentoModal";
import { getEtapaConfig } from "@/lib/etapas";

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

const DAY_LABELS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_LABELS_TINY = ["S", "T", "Q", "Q", "S", "S", "D"];

function getTopPx(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
}

function getHeightPx(duracao: number): number {
  return Math.max((duracao / 60) * HOUR_HEIGHT, 28);
}

function getCurrentTimeTop(): number | null {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < START_HOUR || h >= END_HOUR) return null;
  return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
}

interface CalBlock {
  id: string;
  top: number;
  height: number;
  agendamento: Agendamento;
  label: string;
  borderColor: string;
}

function assignColumns(blocks: CalBlock[]): { block: CalBlock; colIndex: number; numCols: number }[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => a.top - b.top);
  const colEnds: number[] = [];
  const assigned: { block: CalBlock; colIndex: number }[] = [];
  for (const block of sorted) {
    let col = colEnds.findIndex((end) => end <= block.top);
    if (col === -1) { col = colEnds.length; colEnds.push(0); }
    colEnds[col] = block.top + block.height;
    assigned.push({ block, colIndex: col });
  }
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
    block, colIndex, numCols: numColsMap.get(block.id) ?? 1,
  }));
}

function buildBlocks(dayAgendamentos: Agendamento[]): CalBlock[] {
  return dayAgendamentos.flatMap((a) => {
    const cat = a.categoria_servico ?? "maquiagem";
    if (cat === "combo" && a.hora_inicio_cabelo) {
      const maqHora = a.hora_inicio_maquiagem ?? a.hora_inicio ?? "08:00";
      const cabHora = a.hora_inicio_cabelo;
      const maqDur = a.servico?.duracao_maquiagem_min ?? Math.floor(a.servico_duracao / 2);
      const cabDur = a.servico?.duracao_cabelo_min ?? (a.servico_duracao - maqDur);
      return [
        { id: `${a.id}-maq`, top: getTopPx(maqHora), height: getHeightPx(maqDur), agendamento: a, label: `💄 ${maqHora}\n${a.nome_cliente}`, borderColor: CATEGORIA_BORDER.maquiagem } as CalBlock,
        { id: `${a.id}-cab`, top: getTopPx(cabHora), height: getHeightPx(cabDur), agendamento: a, label: `💇 ${cabHora}\n↑ combo`, borderColor: CATEGORIA_BORDER.cabelo } as CalBlock,
      ];
    }
    return [{
      id: a.id,
      top: getTopPx(a.hora_inicio ?? "08:00"),
      height: getHeightPx(a.servico_duracao),
      agendamento: a,
      label: `${CATEGORIA_ICON[cat] ?? "💄"} ${a.hora_inicio}\n${a.nome_cliente}`,
      borderColor: CATEGORIA_BORDER[cat] ?? CATEGORIA_BORDER.maquiagem,
    } as CalBlock];
  });
}

function DayColumn({
  dayAgendamentos,
  onSelect,
  isToday,
  currentTimeTop,
}: {
  dayAgendamentos: Agendamento[];
  onSelect: (a: Agendamento) => void;
  isToday?: boolean;
  currentTimeTop?: number | null;
}) {
  const positioned = assignColumns(buildBlocks(dayAgendamentos));
  return (
    <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
      {HOURS.map((h) => (
        <div key={h} className="absolute w-full border-t border-surface-border/30" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
      ))}
      {/* Current time indicator */}
      {isToday && currentTimeTop != null && (
        <div
          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
          style={{ top: currentTimeTop }}
        >
          <div className="w-2 h-2 rounded-full bg-gold shrink-0 -ml-1" />
          <div className="flex-1 h-px bg-gold" />
        </div>
      )}
      {positioned.map(({ block, colIndex, numCols }) => {
        const etapaCfg = getEtapaConfig(block.agendamento.status);
        const widthPct = 100 / numCols;
        const leftPct = colIndex * widthPct;
        const lines = block.label.split("\n");
        return (
          <button
            key={block.id}
            className="absolute text-left overflow-hidden hover:brightness-110 transition-all z-10 rounded-r-badge"
            style={{
              top: block.top, height: block.height,
              left: `calc(${leftPct}% + 1px)`, width: `calc(${widthPct}% - 2px)`,
              backgroundColor: hexToRgba(etapaCfg.hex, 0.13),
              borderLeft: `4px solid ${etapaCfg.hex}`,
            }}
            onClick={() => onSelect(block.agendamento)}
          >
            <div className="px-1.5 py-0.5">
              {lines.map((line, i) => (
                <p
                  key={i}
                  className={`font-sans truncate leading-tight text-[9px] ${i === 0 ? "font-semibold" : "opacity-70"}`}
                  style={{ color: etapaCfg.hex }}
                >{line}</p>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agendamento | null>(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [activeDay, setActiveDay] = useState(today);
  const [currentTimeTop, setCurrentTimeTop] = useState<number | null>(getCurrentTimeTop);
  const pendingAgendamentoId = useRef<string | null>(searchParams.get("agendamento"));

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart + "T12:00:00"), i), "yyyy-MM-dd")
  );

  // Keep activeDay within the loaded week
  useEffect(() => {
    if (!weekDays.includes(activeDay)) {
      setActiveDay(weekDays.includes(today) ? today : weekDays[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // Update current time every minute
  useEffect(() => {
    const id = setInterval(() => setCurrentTimeTop(getCurrentTimeTop()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agendamentos?semana=${weekStart}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgendamentos(data);
        // Auto-open agendamento from ?agendamento= query param
        if (pendingAgendamentoId.current) {
          const target = data.find((a: Agendamento) => a.id === pendingAgendamentoId.current);
          if (target) {
            setSelected(target);
            if (target.data) setActiveDay(target.data);
            pendingAgendamentoId.current = null;
            router.replace("/admin");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart, router]);

  // If target agendamento not in current week, fetch it from API
  useEffect(() => {
    const id = searchParams.get("agendamento");
    if (!id) return;
    pendingAgendamentoId.current = id;
    // Fetch the agendamento to find its date and navigate to the right week
    fetch(`/api/agendamentos/${id}`)
      .then((r) => r.json())
      .then((ag: Agendamento) => {
        if (ag?.data) {
          const agDate = new Date(ag.data + "T12:00:00");
          const ws = format(startOfWeek(agDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
          setWeekStart(ws);
          setActiveDay(ag.data);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

  useEffect(() => {
    fetch("/api/admin/perfil")
      .then((r) => r.json())
      .then((d) => setAdminConfig(d))
      .catch(() => {});
  }, []);

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    if (status === "cancelado") {
      setAgendamentos((prev) => prev.filter((a) => a.id !== id));
      setSelected(null);
    } else {
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as Agendamento["status"] } : a))
      );
      setSelected((prev) => prev?.id === id ? { ...prev, status: status as Agendamento["status"] } : prev);
    }
  }

  function handleAgendamentoUpdated(updated: Agendamento) {
    setAgendamentos((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  }

  const prevWeek = () => setWeekStart(format(subWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd"));
  const nextWeek = () => setWeekStart(format(addWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd"));
  const goToday = () => {
    setWeekStart(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
    setActiveDay(today);
  };

  const activeDayIdx = weekDays.indexOf(activeDay);
  function prevDay() {
    if (activeDayIdx > 0) {
      setActiveDay(weekDays[activeDayIdx - 1]);
    } else {
      const newWS = format(subWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd");
      setWeekStart(newWS);
      setActiveDay(format(addDays(new Date(newWS + "T12:00:00"), 6), "yyyy-MM-dd"));
    }
  }
  function nextDay() {
    if (activeDayIdx < 6) {
      setActiveDay(weekDays[activeDayIdx + 1]);
    } else {
      const newWS = format(addWeeks(new Date(weekStart + "T12:00:00"), 1), "yyyy-MM-dd");
      setWeekStart(newWS);
      setActiveDay(newWS);
    }
  }

  const touchStartX = useRef<number | null>(null);

  function getForDay(dateStr: string) {
    return agendamentos.filter((a) => a.data === dateStr);
  }

  const weekLabel = `${format(new Date(weekStart + "T12:00:00"), "dd MMM", { locale: ptBR })} - ${format(addDays(new Date(weekStart + "T12:00:00"), 6), "dd MMM yyyy", { locale: ptBR })}`;
  const activeDayLabel = format(new Date(activeDay + "T12:00:00"), "EEE, dd 'de' MMM", { locale: ptBR });

  return (
    <div className="py-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="font-display text-3xl text-foreground font-light">Agenda</h2>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowNovoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans bg-gold text-[#111] font-semibold rounded-btn hover:bg-gold-light transition-colors"
          >
            <Plus size={13} strokeWidth={2} />
            Novo
          </button>
          {/* Calendar date picker */}
          <div className="relative">
            <button type="button" className="p-1.5 text-gold hover:bg-gold-muted rounded-btn cursor-pointer transition-colors" title="Ir para data">
              <Calendar size={18} strokeWidth={1.5} />
            </button>
            <input type="date" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  const ws = format(startOfWeek(parseISO(e.target.value + "T12:00:00"), { weekStartsOn: 1 }), "yyyy-MM-dd");
                  setWeekStart(ws);
                  setActiveDay(e.target.value);
                }
              }}
            />
          </div>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-sans border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold transition-colors">
            Hoje
          </button>
          <button onClick={prevWeek} className="hidden md:flex p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="hidden md:block relative min-w-[150px] text-center">
            <span className="text-sm font-sans text-gray-400 select-none">{weekLabel}</span>
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full"
              onChange={(e) => {
                if (e.target.value) {
                  setWeekStart(format(startOfWeek(parseISO(e.target.value + "T12:00:00"), { weekStartsOn: 1 }), "yyyy-MM-dd"));
                }
              }}
            />
          </div>
          <button onClick={nextWeek} className="hidden md:flex p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE — single day calendar (< md)
      ══════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Day navigation bar */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevDay} className="p-2 text-gray-500 hover:text-foreground transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-sans text-sm text-foreground capitalize">{activeDayLabel}</span>
          <button onClick={nextDay} className="p-2 text-gray-500 hover:text-foreground transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mini week strip */}
        <div className="grid grid-cols-7 mb-4 border border-surface-border bg-surface-card rounded-card overflow-hidden">
          {weekDays.map((day, i) => {
            const isToday = day === today;
            const isActive = day === activeDay;
            const hasAppts = getForDay(day).length > 0;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`py-2 flex flex-col items-center gap-0.5 transition-colors ${
                  isActive ? "bg-gold-muted" : "hover:bg-surface-elevated"
                }`}
              >
                <span className={`text-[9px] font-sans uppercase tracking-wider ${
                  isActive ? "text-gold" : isToday ? "text-gold/70" : "text-gray-600"
                }`}>{DAY_LABELS_TINY[i]}</span>
                <span className={`font-display text-base font-light leading-none ${
                  isActive ? "text-gold" : isToday ? "text-foreground" : "text-gray-500"
                }`}>{format(new Date(day + "T12:00:00"), "d")}</span>
                <span className={`w-1 h-1 rounded-full ${hasAppts ? "bg-gold" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>

        {/* Single day time grid with swipe support */}
        {loading ? (
          <div className="flex items-center gap-3 py-12 justify-center">
            <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 font-sans text-sm">Carregando...</span>
          </div>
        ) : (
          <div
            className="border border-surface-border bg-surface-card rounded-card overflow-auto"
            style={{ maxHeight: "calc(100vh - 300px)" }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) { if (diff > 0) nextDay(); else prevDay(); }
              touchStartX.current = null;
            }}
          >
            <div className="flex">
              {/* Time labels */}
              <div className="border-r border-surface-border shrink-0" style={{ width: 44 }}>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-1.5 pt-1.5">
                    <span className="text-[10px] text-gray-600 font-sans tabular-nums">
                      {h.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>
              {/* Day column */}
              <div className="flex-1 relative border-l border-surface-border">
                <DayColumn
                  dayAgendamentos={getForDay(activeDay)}
                  onSelect={setSelected}
                  isToday={activeDay === today}
                  currentTimeTop={currentTimeTop}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile appointment list for active day */}
        {!loading && getForDay(activeDay).length === 0 && (
          <p className="text-gray-600 font-sans text-sm text-center py-6 border border-surface-border bg-surface-card rounded-card mt-3">
            Nenhum agendamento neste dia.
          </p>
        )}
        {!loading && getForDay(activeDay).length > 0 && (
          <div className="mt-3 space-y-2">
            {getForDay(activeDay)
              .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
              .map((a) => {
                const etapaCfg = getEtapaConfig(a.status);
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="w-full text-left border border-surface-border bg-surface-card rounded-card p-3 hover:border-gold/40 hover:bg-surface-elevated transition-colors"
                    style={{ borderLeftColor: etapaCfg.hex, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-foreground text-base leading-tight truncate">{a.nome_cliente}</p>
                      <p className="font-sans text-xs text-gold shrink-0">{a.hora_inicio}</p>
                    </div>
                    <p className="font-sans text-xs text-gray-500 truncate mt-0.5">{a.servico_nome}</p>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP — 7-column week calendar (≥ md)
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* Left: list panel */}
        <div className="w-72 flex flex-col border border-surface-border bg-surface-card rounded-card overflow-hidden shadow-card shrink-0">
          <div className="px-4 py-3 border-b border-surface-border shrink-0">
            <p className="text-xs font-sans text-gray-500 uppercase tracking-widest">
              {agendamentos.length} agendamento{agendamentos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && agendamentos.length === 0 && (
              <p className="text-gray-600 font-sans text-sm text-center py-8">Nenhum agendamento.</p>
            )}
            {agendamentos
              .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
              .map((a) => {
                const etapaCfg = getEtapaConfig(a.status);
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`w-full text-left border border-surface-border bg-surface-elevated rounded-card p-3 transition-all hover:border-gold/40 ${selected?.id === a.id ? "border-gold/50 shadow-gold" : ""}`}
                    style={{ borderLeftColor: etapaCfg.hex, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-display text-foreground text-base leading-tight truncate">{a.nome_cliente}</p>
                      <p className="font-sans text-xs text-gold shrink-0">{a.hora_inicio}</p>
                    </div>
                    <p className="font-sans text-xs text-gray-500 truncate">{a.servico_nome}</p>
                    <p className="font-sans text-[10px] text-gray-600 mt-0.5">
                      {a.data ? format(new Date(a.data + "T12:00:00"), "EEE dd/MM", { locale: ptBR }) : ""}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right: 7-column calendar grid */}
        <div className="flex-1 border border-surface-border bg-surface-card rounded-card overflow-auto scrollbar-thin shadow-card">
          {/* Day headers sticky */}
          <div className="sticky top-0 z-10 bg-surface-card grid border-b border-surface-border" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            <div className="border-r border-surface-border" />
            {weekDays.map((day, i) => {
              const isToday = day === today;
              return (
                <div key={day} className={`text-center py-2.5 border-l border-surface-border ${isToday ? "bg-gold-muted" : ""}`}>
                  <p className={`text-[9px] font-sans uppercase tracking-widest ${isToday ? "text-gold" : "text-gray-600"}`}>
                    {DAY_LABELS_SHORT[i]}
                  </p>
                  <p className={`font-display text-xl font-light ${isToday ? "text-gold font-semibold" : "text-foreground"}`}>
                    {format(new Date(day + "T12:00:00"), "dd")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            {/* Time labels */}
            <div className="border-r border-surface-border">
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1.5">
                  <span className="text-[10px] text-gray-600 font-sans tabular-nums">
                    {h.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            {/* Day columns */}
            {weekDays.map((day) => {
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`border-l border-surface-border ${isToday ? "bg-gold-muted/30" : ""}`}
                >
                  <DayColumn
                    dayAgendamentos={getForDay(day)}
                    onSelect={setSelected}
                    isToday={isToday}
                    currentTimeTop={currentTimeTop}
                  />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            className="bg-surface-elevated border border-surface-border rounded-card shadow-modal max-w-2xl w-full overflow-y-auto"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-surface-elevated z-10 rounded-t-card">
              <p className="text-gold text-[10px] font-sans uppercase tracking-[0.3em]">Agendamento</p>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <AgendamentoCard
                agendamento={selected}
                onStatusChange={handleStatusChange}
                onUpdated={handleAgendamentoUpdated}
                adminConfig={adminConfig}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
