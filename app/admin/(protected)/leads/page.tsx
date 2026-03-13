"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Search, Download, ChevronLeft, ChevronRight, Clock, X,
  Pencil, Check, CalendarPlus,
} from "lucide-react";
import { getEtapaConfig, getEtapaProgress, ETAPA_CONFIG } from "@/lib/etapas";
import { exportarXlsx } from "@/lib/exportar-xlsx";
import { Agendamento, AdminConfig } from "@/types";
import AgendamentoCard from "@/components/admin/AgendamentoCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoricoEntry { etapa: string; em: string; obs?: string; }

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

interface ContatoDireto {
  id: string;
  tipo: "casamento" | "destination_beauty" | "duvida";
  nome: string;
  telefone: string;
  etapa_funil: "novo" | "em_conversa" | "orcamento_enviado" | "convertido" | "perdido";
  observacoes: string | null;
  convertido_em_agendamento_id: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ETAPA_OPTIONS = Object.entries(ETAPA_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));
const PAGE_SIZE = 50;

const ETAPAS_FUNIL: { value: ContatoDireto["etapa_funil"]; label: string; color: string; bg: string }[] = [
  { value: "novo",              label: "Novo",           color: "text-sky-400",     bg: "bg-sky-900/30" },
  { value: "em_conversa",       label: "Em conversa",    color: "text-amber-400",   bg: "bg-amber-900/30" },
  { value: "orcamento_enviado", label: "Orç. enviado",   color: "text-yellow-400",  bg: "bg-yellow-900/30" },
  { value: "convertido",        label: "Convertido",     color: "text-emerald-400", bg: "bg-emerald-900/30" },
  { value: "perdido",           label: "Perdido",        color: "text-red-400",     bg: "bg-red-900/30" },
];

const TIPO_CONFIG = {
  casamento:          { label: "Casamento 💍",    color: "text-pink-300 border-pink-700/40" },
  destination_beauty: { label: "Destination ✈️", color: "text-sky-300 border-sky-700/40" },
  duvida:             { label: "Dúvida 💬",       color: "text-foreground/50 border-surface-border" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function etapaFunilCfg(v: string) {
  return ETAPAS_FUNIL.find((e) => e.value === v) ?? ETAPAS_FUNIL[0];
}

// ─── Export ───────────────────────────────────────────────────────────────────

function exportarUnificado(leads: Lead[], contatos: ContatoDireto[]) {
  const dadosLeads = leads.map((l) => ({
    origem: "Agendamento",
    tipo: l.servico_nome ?? "",
    nome: l.nome,
    telefone: l.telefone,
    etapa: getEtapaConfig(l.etapa).label,
    historico: (l.historico ?? []).map((h) => `${getEtapaConfig(h.etapa).label} (${h.em.slice(0, 10)})`).join(" → "),
    observacoes: "",
    created_at: formatDatetime(l.created_at),
  }));
  const dadosContatos = contatos.map((c) => ({
    origem: "Contato Direto",
    tipo: TIPO_CONFIG[c.tipo]?.label ?? c.tipo,
    nome: c.nome,
    telefone: c.telefone,
    etapa: etapaFunilCfg(c.etapa_funil).label,
    historico: "",
    observacoes: c.observacoes ?? "",
    created_at: formatDatetime(c.created_at),
  }));
  exportarXlsx([...dadosLeads, ...dadosContatos], `leads-${new Date().toISOString().slice(0, 10)}`, {
    origem:      { label: "Origem",          largura: 18 },
    tipo:        { label: "Tipo / Serviço",  largura: 22 },
    nome:        { label: "Nome",            largura: 25 },
    telefone:    { label: "Telefone",        largura: 18 },
    etapa:       { label: "Etapa",           largura: 22 },
    historico:   { label: "Histórico",       largura: 60 },
    observacoes: { label: "Observações",     largura: 40 },
    created_at:  { label: "Data de entrada", largura: 20 },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ etapa }: { etapa: string }) {
  const pct = getEtapaProgress(etapa);
  const isNegative = etapa === "cancelado" || etapa === "nao_compareceu";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-surface-border rounded-full overflow-hidden" style={{ minWidth: 48 }}>
        {isNegative
          ? <div className="h-full bg-red-700 rounded-full w-full" />
          : <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getEtapaConfig(etapa).hex }} />}
      </div>
      {!isNegative && <span className="text-foreground/30 text-[10px] font-sans shrink-0">{pct}%</span>}
    </div>
  );
}

function HistoricoPopover({ historico }: { historico: HistoricoEntry[] | null }) {
  const [open, setOpen] = useState(false);
  if (!historico || historico.length === 0) return <span className="text-foreground/20 text-xs font-sans">—</span>;
  return (
    <div className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }} className="flex items-center gap-1 text-gold/70 hover:text-gold text-xs font-sans transition-colors">
        <Clock size={11} strokeWidth={1.5} />
        {historico.length} etapa{historico.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-50 bg-surface-elevated border border-surface-border shadow-modal rounded-card p-3 w-64">
            <div className="space-y-2">
              {historico.map((h, i) => {
                const cfg = getEtapaConfig(h.etapa);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
                    <div>
                      <p className="text-foreground/80 text-xs font-sans">{cfg.label}</p>
                      <p className="text-foreground/30 text-[10px] font-sans">{new Date(h.em).toLocaleString("pt-BR")}</p>
                      {h.obs && <p className="text-foreground/40 text-[10px] font-sans italic">{h.obs}</p>}
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

function AgendamentoDrawer({ agendamentoId, onClose, adminConfig }: { agendamentoId: string; onClose: () => void; adminConfig: AdminConfig | null }) {
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/agendamento/" + agendamentoId)
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setAgendamento(data); })
      .finally(() => setLoading(false));
  }, [agendamentoId]);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/70" onClick={onClose} />
      <div className="w-full max-w-xl bg-surface border-l border-surface-border h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <p className="text-gold text-xs font-sans uppercase tracking-widest">Agendamento</p>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground/70 transition-colors"><X size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-12"><div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" /></div>
          ) : agendamento ? (
            <AgendamentoCard agendamento={agendamento} onStatusChange={() => {}} onUpdated={(u) => setAgendamento(u)} adminConfig={adminConfig} />
          ) : (
            <p className="text-foreground/40 font-sans text-sm">Agendamento não encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline editable cell ─────────────────────────────────────────────────────

function EditableCell({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          className="input-luxury py-0.5 px-1.5 text-xs w-full min-w-[80px]"
          placeholder={placeholder}
        />
        <button onClick={commit} className="text-gold shrink-0"><Check size={12} /></button>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 text-left w-full">
      <span className={`text-sm font-sans ${value ? "text-foreground/80" : "text-foreground/25 italic"}`}>{value || (placeholder ?? "—")}</span>
      <Pencil size={10} className="shrink-0 text-foreground/20 group-hover:text-gold transition-colors" />
    </button>
  );
}

// ─── Funil summary bar ────────────────────────────────────────────────────────

function FunilSummary({ contatos }: { contatos: ContatoDireto[] }) {
  const total = contatos.length;
  if (total === 0) return null;
  return (
    <div className="grid grid-cols-5 gap-2 mb-5">
      {ETAPAS_FUNIL.map((e) => {
        const count = contatos.filter((c) => c.etapa_funil === e.value).length;
        return (
          <div key={e.value} className={`border border-surface-border p-2 text-center ${count > 0 ? e.bg : ""}`}>
            <p className={`font-display text-xl ${count > 0 ? e.color : "text-foreground/20"}`}>{count}</p>
            <p className="text-[9px] font-sans text-foreground/40 uppercase tracking-wider mt-0.5 leading-tight">{e.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Contatos Diretos Tab ─────────────────────────────────────────────────────

function ContatosTab() {
  const [contatos, setContatos] = useState<ContatoDireto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState("");
  const [searchLocal, setSearchLocal] = useState("");
  const [expandedObs, setExpandedObs] = useState<string | null>(null);

  const fetchContatos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchLocal) params.set("search", searchLocal);
    if (tipoFiltro) params.set("tipo", tipoFiltro);
    if (etapaFiltro) params.set("etapa", etapaFiltro);
    const res = await fetch(`/api/admin/contatos-diretos?${params}`);
    const data = await res.json();
    setContatos(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [searchLocal, tipoFiltro, etapaFiltro]);

  useEffect(() => { fetchContatos(); }, [fetchContatos]);

  async function patchContato(id: string, updates: Partial<ContatoDireto>) {
    const res = await fetch(`/api/admin/contatos-diretos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setContatos((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input type="text" value={searchLocal} onChange={(e) => setSearchLocal(e.target.value)} placeholder="Buscar nome ou telefone..." className="input-luxury text-sm pl-8 w-full" />
        </div>
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="input-luxury text-xs py-1.5 pr-7 w-auto">
          <option value="">Todos os tipos</option>
          <option value="casamento">Casamento 💍</option>
          <option value="destination_beauty">Destination ✈️</option>
          <option value="duvida">Dúvida 💬</option>
        </select>
        <select value={etapaFiltro} onChange={(e) => setEtapaFiltro(e.target.value)} className="input-luxury text-xs py-1.5 pr-7 w-auto">
          <option value="">Todas as etapas</option>
          {ETAPAS_FUNIL.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      <FunilSummary contatos={contatos} />

      {loading ? (
        <div className="flex items-center gap-3 py-12"><div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : contatos.length === 0 ? (
        <div className="border border-surface-border p-12 text-center">
          <Users size={28} className="text-foreground/15 mx-auto mb-2" strokeWidth={1} />
          <p className="text-foreground/30 font-sans text-sm">Nenhum contato direto encontrado.</p>
        </div>
      ) : (
        <div className="border border-surface-border divide-y divide-surface-border">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[120px_1fr_1fr_160px_80px_60px] gap-3 px-4 py-2 bg-surface-card">
            {["Tipo", "Nome", "Telefone", "Etapa", "Data", ""].map((h, i) => (
              <p key={i} className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest">{h}</p>
            ))}
          </div>

          {contatos.map((c) => {
            const tipoCfg = TIPO_CONFIG[c.tipo] ?? TIPO_CONFIG.duvida;
            const etapaCfg = etapaFunilCfg(c.etapa_funil);
            const obsExpanded = expandedObs === c.id;
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_160px_80px_60px] gap-3 items-center">
                  <span className={`border px-2 py-0.5 text-[10px] font-sans inline-block w-fit ${tipoCfg.color}`}>{tipoCfg.label}</span>
                  <EditableCell value={c.nome} onSave={(v) => patchContato(c.id, { nome: v })} placeholder="Adicionar nome" />
                  <EditableCell value={c.telefone} onSave={(v) => patchContato(c.id, { telefone: v })} placeholder="Adicionar telefone" />
                  <select
                    value={c.etapa_funil}
                    onChange={(e) => patchContato(c.id, { etapa_funil: e.target.value as ContatoDireto["etapa_funil"] })}
                    className={`input-luxury text-xs py-1 ${etapaCfg.color}`}
                  >
                    {ETAPAS_FUNIL.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                  <span className="text-foreground/35 text-xs font-sans">{formatDate(c.created_at)}</span>
                  <button onClick={() => setExpandedObs(obsExpanded ? null : c.id)} className="text-xs font-sans text-foreground/30 hover:text-gold transition-colors whitespace-nowrap">
                    {obsExpanded ? "▲" : "▼ obs"}
                  </button>
                </div>

                {obsExpanded && (
                  <div className="mt-3 pl-0 md:pl-[calc(120px+12px)]">
                    <textarea
                      key={c.id + "-obs"}
                      defaultValue={c.observacoes ?? ""}
                      rows={3}
                      className="input-luxury resize-none w-full text-xs"
                      placeholder="Observações sobre este contato..."
                      onBlur={(e) => {
                        if (e.target.value !== (c.observacoes ?? "")) {
                          patchContato(c.id, { observacoes: e.target.value });
                        }
                      }}
                    />
                    {c.etapa_funil === "convertido" && !c.convertido_em_agendamento_id && (
                      <a
                        href={`/admin?novo=true${c.nome ? `&nome=${encodeURIComponent(c.nome)}` : ""}${c.telefone ? `&telefone=${encodeURIComponent(c.telefone)}` : ""}`}
                        className="mt-2 inline-flex items-center gap-2 border border-gold/50 text-gold text-xs font-sans px-3 py-1.5 hover:bg-gold/10 transition-colors"
                      >
                        <CalendarPlus size={13} strokeWidth={1.5} />
                        Criar agendamento
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [aba, setAba] = useState<"agendamentos" | "contatos">("agendamentos");

  // Agendamentos state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [drawerAgendamentoId, setDrawerAgendamentoId] = useState<string | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);

  // Contatos (for unified export)
  const [contatosExport, setContatosExport] = useState<ContatoDireto[]>([]);

  useEffect(() => {
    fetch("/api/admin/perfil").then((r) => r.json()).then((d) => { if (d && !d.error) setAdminConfig(d); }).catch(() => {});
    fetch("/api/admin/contatos-diretos").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setContatosExport(d); }).catch(() => {});
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

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [search, etapaFilter, dataInicio, dataFim]);

  function toggleEtapa(v: string) {
    setEtapaFilter((prev) => prev.includes(v) ? prev.filter((e) => e !== v) : [...prev, v]);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-gold" strokeWidth={1.5} />
            <h2 className="font-display text-3xl text-foreground font-light">Leads</h2>
          </div>
          <p className="text-foreground/40 font-sans text-sm">
            {aba === "agendamentos"
              ? `${total} lead${total !== 1 ? "s" : ""} de agendamento`
              : "Contatos diretos via WhatsApp"}
          </p>
        </div>
        <button
          onClick={() => exportarUnificado(leads, contatosExport)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-sans border border-[var(--gold-muted-border)] text-gold/70 hover:border-[#C9A84C] hover:text-gold transition-colors"
        >
          <Download size={13} strokeWidth={1.5} />
          Exportar planilha
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-6">
        {(["agendamentos", "contatos"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`px-5 py-2.5 text-sm font-sans border-b-2 -mb-px transition-colors ${
              aba === tab ? "border-gold text-gold" : "border-transparent text-foreground/40 hover:text-foreground/70"
            }`}
          >
            {tab === "agendamentos" ? "Agendamentos" : "Contatos Diretos"}
          </button>
        ))}
      </div>

      {/* ── Agendamentos Tab ── */}
      {aba === "agendamentos" && (
        <>
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="input-luxury pl-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-1">Data início</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-luxury text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-1">Data fim</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-luxury text-sm" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-2">Filtrar por etapa</p>
              <div className="flex flex-wrap gap-2">
                {ETAPA_OPTIONS.map(({ value, label }) => {
                  const active = etapaFilter.includes(value);
                  const cfg = getEtapaConfig(value);
                  return (
                    <button key={value} onClick={() => toggleEtapa(value)} className={`px-2.5 py-1 text-[10px] font-sans border transition-colors ${active ? cfg.badgeClass : "border-surface-border text-foreground/35 hover:border-foreground/20"}`}>
                      {label}
                    </button>
                  );
                })}
                {etapaFilter.length > 0 && (
                  <button onClick={() => setEtapaFilter([])} className="px-2.5 py-1 text-[10px] font-sans text-foreground/30 hover:text-foreground/60 transition-colors">Limpar</button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-12">
              <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground/40 font-sans text-sm">Carregando...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="border border-surface-border rounded-card p-12 text-center">
              <Users size={32} className="text-gold/20 mx-auto mb-3" strokeWidth={1} />
              <p className="text-foreground/30 font-sans text-sm">Nenhum lead encontrado.</p>
            </div>
          ) : (
            <div className="border border-surface-border rounded-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-2.5 bg-surface-card border-b border-surface-border">
                {["Cliente", "Serviço", "Etapa", "Progresso", "Entrada", "Histórico"].map((h) => (
                  <p key={h} className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-surface-border">
                {leads.map((lead) => {
                  const cfg = getEtapaConfig(lead.etapa);
                  return (
                    <div key={lead.id} onClick={() => lead.agendamento_id && setDrawerAgendamentoId(lead.agendamento_id)} className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-3 transition-colors ${lead.agendamento_id ? "cursor-pointer hover:bg-surface-elevated" : ""}`}>
                      <div>
                        <p className="text-foreground/85 text-sm font-sans">{lead.nome}</p>
                        <p className="text-foreground/35 text-xs font-sans">{lead.telefone}</p>
                      </div>
                      <p className="text-foreground/50 text-xs font-sans self-center">{lead.servico_nome ?? "—"}</p>
                      <div className="self-center"><span className={`border px-2 py-0.5 text-[10px] font-sans ${cfg.badgeClass}`}>{cfg.label}</span></div>
                      <div className="self-center"><ProgressBar etapa={lead.etapa} /></div>
                      <p className="text-foreground/35 text-xs font-sans self-center">{formatDate(lead.created_at)}</p>
                      <div className="self-center"><HistoricoPopover historico={lead.historico} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-foreground/30 text-xs font-sans">Página {page} de {totalPages} ({total} total)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Contatos Diretos Tab ── */}
      {aba === "contatos" && <ContatosTab />}

      {drawerAgendamentoId && (
        <AgendamentoDrawer agendamentoId={drawerAgendamentoId} onClose={() => setDrawerAgendamentoId(null)} adminConfig={adminConfig} />
      )}
    </div>
  );
}
