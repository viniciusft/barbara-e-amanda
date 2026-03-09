"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Download, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { getEtapaConfig, getEtapaProgress, ETAPA_CONFIG } from "@/lib/etapas";
import { Agendamento, AdminConfig } from "@/types";
import AgendamentoCard from "@/components/admin/AgendamentoCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoricoEntry {
  etapa: string;
  em: string;
  obs?: string;
}

interface Lead {
  id: string;
  agendamento_id: string | null;
  nome: string;
  telefone: string;
  email: string | null;
  servico_id: string | null;
  servico_nome: string | null;
  etapa: string;
  historico: HistoricoEntry[] | null;
  origem: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ETAPA_OPTIONS = Object.entries(ETAPA_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function exportCSV(leads: Lead[]) {
  const headers = ["Nome", "Telefone", "Email", "Serviço", "Etapa", "Data entrada", "Histórico"];
  const rows = leads.map((l) => [
    l.nome,
    l.telefone,
    l.email ?? "",
    l.servico_nome ?? "",
    getEtapaConfig(l.etapa).label,
    formatDate(l.created_at),
    (l.historico ?? []).map((h) => `${h.etapa}@${h.em.slice(0, 10)}`).join(" → "),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ etapa }: { etapa: string }) {
  const pct = getEtapaProgress(etapa);
  const isNegative = etapa === "cancelado" || etapa === "nao_compareceu";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden" style={{ minWidth: 48 }}>
        {isNegative ? (
          <div className="h-full bg-red-700 rounded-full" style={{ width: "100%" }} />
        ) : (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: getEtapaConfig(etapa).hex }}
          />
        )}
      </div>
      {!isNegative && (
        <span className="text-[rgba(245,240,232,0.3)] text-[10px] font-sans shrink-0">{pct}%</span>
      )}
    </div>
  );
}

function HistoricoPopover({ historico }: { historico: HistoricoEntry[] | null }) {
  const [open, setOpen] = useState(false);
  if (!historico || historico.length === 0) {
    return <span className="text-[rgba(245,240,232,0.2)] text-xs font-sans">—</span>;
  }
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="flex items-center gap-1 text-[rgba(201,168,76,0.7)] hover:text-[#C9A84C] text-xs font-sans transition-colors"
      >
        <Clock size={11} strokeWidth={1.5} />
        {historico.length} etapa{historico.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-50 bg-[#1a1a1a] border border-[rgba(201,168,76,0.2)] shadow-2xl p-3 w-64">
            <div className="space-y-2">
              {historico.map((h, i) => {
                const cfg = getEtapaConfig(h.etapa);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="mt-1 w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.hex }}
                    />
                    <div>
                      <p className="text-[rgba(245,240,232,0.8)] text-xs font-sans">{cfg.label}</p>
                      <p className="text-[rgba(245,240,232,0.3)] text-[10px] font-sans">
                        {new Date(h.em).toLocaleString("pt-BR")}
                      </p>
                      {h.obs && (
                        <p className="text-[rgba(245,240,232,0.4)] text-[10px] font-sans italic">{h.obs}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Agendamento drawer ───────────────────────────────────────────────────────

function AgendamentoDrawer({
  agendamentoId,
  onClose,
  adminConfig,
}: {
  agendamentoId: string;
  onClose: () => void;
  adminConfig: AdminConfig | null;
}) {
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/agendamento/" + agendamentoId)
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setAgendamento(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agendamentoId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/70" onClick={onClose} />
      <div className="w-full max-w-xl bg-[#111111] border-l border-[rgba(201,168,76,0.15)] h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(201,168,76,0.1)]">
          <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest">Agendamento</p>
          <button onClick={onClose} className="text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)] transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-12">
              <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Carregando...</span>
            </div>
          ) : agendamento ? (
            <AgendamentoCard
              agendamento={agendamento}
              onStatusChange={() => {}}
              onUpdated={(u) => setAgendamento(u)}
              adminConfig={adminConfig}
            />
          ) : (
            <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Agendamento não encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Drawer
  const [drawerAgendamentoId, setDrawerAgendamentoId] = useState<string | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    fetch("/api/admin/perfil")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setAdminConfig(d); })
      .catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    etapaFilter.forEach((e) => params.append("etapa", e));
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim) params.set("data_fim", dataFim);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, etapaFilter, dataInicio, dataFim, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, etapaFilter, dataInicio, dataFim]);

  function toggleEtapa(v: string) {
    setEtapaFilter((prev) =>
      prev.includes(v) ? prev.filter((e) => e !== v) : [...prev, v]
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-[#C9A84C]" strokeWidth={1.5} />
            <h2 className="font-display text-3xl text-[#F5F0E8] font-light">Leads</h2>
          </div>
          <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm">
            {total} lead{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => exportCSV(leads)}
          disabled={leads.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-sans border border-[rgba(201,168,76,0.3)] text-[rgba(201,168,76,0.7)] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors disabled:opacity-40"
        >
          <Download size={13} strokeWidth={1.5} />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="input-luxury pl-9 text-sm"
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-1">
              Data início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-luxury text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-1">
              Data fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input-luxury text-sm"
            />
          </div>
        </div>

        {/* Etapa filter */}
        <div>
          <p className="text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-2">
            Filtrar por etapa
          </p>
          <div className="flex flex-wrap gap-2">
            {ETAPA_OPTIONS.map(({ value, label }) => {
              const active = etapaFilter.includes(value);
              const cfg = getEtapaConfig(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleEtapa(value)}
                  className={`px-2.5 py-1 text-[10px] font-sans border transition-colors ${
                    active ? cfg.badgeClass : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.35)] hover:border-[rgba(255,255,255,0.2)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {etapaFilter.length > 0 && (
              <button
                onClick={() => setEtapaFilter([])}
                className="px-2.5 py-1 text-[10px] font-sans text-[rgba(245,240,232,0.3)] hover:text-[rgba(245,240,232,0.6)] transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Carregando...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="border border-[rgba(255,255,255,0.06)] p-12 text-center">
          <Users size={32} className="text-[rgba(201,168,76,0.2)] mx-auto mb-3" strokeWidth={1} />
          <p className="text-[rgba(245,240,232,0.3)] font-sans text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="border border-[rgba(201,168,76,0.1)] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-2.5 bg-[rgba(201,168,76,0.04)] border-b border-[rgba(201,168,76,0.1)]">
            {["Cliente", "Serviço", "Etapa", "Progresso", "Entrada", "Histórico"].map((h) => (
              <p key={h} className="text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest">
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {leads.map((lead) => {
              const cfg = getEtapaConfig(lead.etapa);
              return (
                <div
                  key={lead.id}
                  onClick={() => lead.agendamento_id && setDrawerAgendamentoId(lead.agendamento_id)}
                  className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-3 transition-colors ${
                    lead.agendamento_id
                      ? "cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                      : ""
                  }`}
                >
                  {/* Cliente */}
                  <div>
                    <p className="text-[rgba(245,240,232,0.85)] text-sm font-sans">{lead.nome}</p>
                    <p className="text-[rgba(245,240,232,0.35)] text-xs font-sans">{lead.telefone}</p>
                  </div>

                  {/* Serviço */}
                  <p className="text-[rgba(245,240,232,0.5)] text-xs font-sans self-center">
                    {lead.servico_nome ?? "—"}
                  </p>

                  {/* Etapa badge */}
                  <div className="self-center">
                    <span className={`border px-2 py-0.5 text-[10px] font-sans ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progresso */}
                  <div className="self-center">
                    <ProgressBar etapa={lead.etapa} />
                  </div>

                  {/* Data entrada */}
                  <p className="text-[rgba(245,240,232,0.35)] text-xs font-sans self-center">
                    {formatDate(lead.created_at)}
                  </p>

                  {/* Histórico */}
                  <div className="self-center">
                    <HistoricoPopover historico={lead.historico} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
            Página {page} de {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Agendamento drawer */}
      {drawerAgendamentoId && (
        <AgendamentoDrawer
          agendamentoId={drawerAgendamentoId}
          onClose={() => setDrawerAgendamentoId(null)}
          adminConfig={adminConfig}
        />
      )}
    </div>
  );
}
