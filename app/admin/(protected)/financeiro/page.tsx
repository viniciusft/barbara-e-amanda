"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, DollarSign, Users, TrendingDown, RotateCcw, Download,
  Zap, Banknote, CreditCard, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import MultiSelectDropdown, { SelectOption } from "@/components/admin/MultiSelectDropdown";
import { formatCurrency } from "@/lib/utils";
import { exportarXlsx } from "@/lib/exportar-xlsx";
import type { Lancamento } from "@/app/api/financeiro/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Totais {
  receita: number;
  receita_sinal: number;
  receita_restante: number;
  count: number;
  ticket_medio: number;
  total_descontos: number;
  nao_compareceram: number;
  sinais_retidos: number;
  reembolsos: number;
}

interface PorServico { nome: string; count: number; receita: number; }
interface PorPagamento { forma: string; count: number; receita: number; }
interface PorPeriodo { periodo: string; receita: number; receita_sinal: number; receita_restante: number; count: number; }

interface ApiResponse {
  lancamentos: Lancamento[];
  totais: Totais;
  por_servico: PorServico[];
  por_pagamento: PorPagamento[];
  por_periodo: PorPeriodo[];
  granularidade: "dia" | "semana" | "mes";
}

interface ServicoSimples { id: string; nome: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const PIE_COLORS = ["#C9A84C","#B8956E","#9B7E5C","#7A6B52","#6B8C9E","#8B9EA0","#C4A882","#A0937D"];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "concluido", label: "Concluído" },
  { value: "nao_compareceu", label: "Não compareceu" },
  { value: "confirmado", label: "Confirmado" },
  { value: "aguardando_sinal", label: "Aguardando sinal" },
  { value: "solicitacao", label: "Solicitação" },
];

const PAGAMENTO_OPTIONS: SelectOption[] = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "outro", label: "Outro" },
];

const TIPO_LABEL: Record<string, string> = {
  sinal: "Sinal",
  restante: "Restante",
  sinal_retido: "Sinal retido",
  sinal_reembolsado: "Sinal reembolsado",
};

const TIPO_COLOR: Record<string, string> = {
  sinal: "text-gold border-[var(--gold-muted-border)] bg-[var(--gold-muted)]",
  restante: "text-emerald-400 border-emerald-800 bg-emerald-950/20",
  sinal_retido: "text-red-700 border-red-900 bg-red-950/30",
  sinal_reembolsado: "text-blue-400 border-blue-800 bg-blue-950/20",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getMonthRange(offset = 0) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { inicio: start.toISOString().slice(0, 10), fim: end.toISOString().slice(0, 10) };
}

function getWeekRange() {
  const d = new Date();
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { inicio: monday.toISOString().slice(0, 10), fim: sunday.toISOString().slice(0, 10) };
}

function formatPeriodLabel(periodo: string, granularidade: "dia" | "semana" | "mes") {
  if (granularidade === "mes") {
    const [year, month] = periodo.split("-");
    const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  }
  if (granularidade === "semana") {
    const d = new Date(periodo + "T12:00:00");
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`;
  }
  const [, m, day] = periodo.split("-");
  return `${day}/${m}`;
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAGAMENTO_ICONS: Record<string, React.ComponentType<any>> = {
  pix: Zap, dinheiro: Banknote, credito: CreditCard, debito: CreditCard, outro: MoreHorizontal,
};

const PAGAMENTO_LABELS: Record<string, string> = {
  pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito", outro: "Outro",
};

type SortDir = "asc" | "desc";
type SortCol = "data" | "cliente" | "servico" | "tipo" | "valor" | "pagamento";

function sortLancamentos(rows: Lancamento[], col: SortCol, dir: SortDir) {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (col) {
      case "data": av = a.data ?? ""; bv = b.data ?? ""; break;
      case "cliente": av = a.nome_cliente ?? ""; bv = b.nome_cliente ?? ""; break;
      case "servico": av = (a.servico_nome_atual ?? a.servico_nome) ?? ""; bv = (b.servico_nome_atual ?? b.servico_nome) ?? ""; break;
      case "tipo": av = a.tipo ?? ""; bv = b.tipo ?? ""; break;
      case "valor": av = Number(a.valor || 0); bv = Number(b.valor || 0); break;
      case "pagamento": av = a.forma_pagamento ?? ""; bv = b.forma_pagamento ?? ""; break;
    }
    if (typeof av === "number") return (av - (bv as number)) * factor;
    return av.localeCompare(bv as string) * factor;
  });
}

function formatDateBR(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function exportXlsx(rows: Lancamento[]) {
  const dados = rows.map((l) => ({
    data:            formatDateBR(l.data),
    nome_cliente:    l.nome_cliente,
    servico_nome:    l.servico_nome_atual ?? l.servico_nome,
    tipo:            TIPO_LABEL[l.tipo] ?? l.tipo,
    valor:           l.valor != null ? Number(l.valor) : null,
    forma_pagamento: l.forma_pagamento ?? "",
    status:          l.status,
  }));
  exportarXlsx(dados, `financeiro-${todayStr()}`, {
    data:            { label: "Data",           largura: 14 },
    nome_cliente:    { label: "Cliente",         largura: 25 },
    servico_nome:    { label: "Serviço",         largura: 22 },
    tipo:            { label: "Tipo",            largura: 14 },
    valor:           { label: "Valor (R$)",      largura: 14 },
    forma_pagamento: { label: "Pagamento",       largura: 16 },
    status:          { label: "Status",          largura: 16 },
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const thisMonth = getMonthRange(0);

  const [dataInicio, setDataInicio] = useState(thisMonth.inicio);
  const [dataFim, setDataFim] = useState(thisMonth.fim);
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  const [selectedFormas, setSelectedFormas] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["concluido"]);

  const [servicos, setServicos] = useState<ServicoSimples[]>([]);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortCol, setSortCol] = useState<SortCol>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((d) => setServicos(Array.isArray(d) ? d : []));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1);
    const params = new URLSearchParams();
    params.set("data_inicio", dataInicio);
    params.set("data_fim", dataFim);
    selectedServicos.forEach((s) => params.append("servicos", s));
    selectedFormas.forEach((f) => params.append("formas_pagamento", f));
    selectedStatus.forEach((s) => params.append("status", s));

    try {
      const res = await fetch(`/api/financeiro?${params}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao carregar dados");
        return;
      }
      const d: ApiResponse = await res.json();
      setData(d);
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, selectedServicos, selectedFormas, selectedStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedRows = useMemo(
    () => sortLancamentos(data?.lancamentos ?? [], sortCol, sortDir),
    [data?.lancamentos, sortCol, sortDir]
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pageRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
    setPage(1);
  }

  function resetFilters() {
    const m = getMonthRange(0);
    setDataInicio(m.inicio);
    setDataFim(m.fim);
    setSelectedServicos([]);
    setSelectedFormas([]);
    setSelectedStatus(["concluido"]);
  }

  const servicoOptions: SelectOption[] = servicos.map((s) => ({ value: s.id, label: s.nome }));
  const totais = data?.totais;
  const porServico = data?.por_servico ?? [];
  const porPagamento = data?.por_pagamento ?? [];
  const porPeriodo = data?.por_periodo ?? [];
  const granularidade = data?.granularidade ?? "dia";
  const totalReceita = totais?.receita ?? 0;

  const chartTooltipStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid rgba(201,168,76,0.25)",
    borderRadius: 0,
    fontFamily: "sans-serif",
    fontSize: 12,
  };

  // Group lancamentos by agendamento_id for alternating row colors
  const agendamentoIds = useMemo(() => {
    const seen: string[] = [];
    for (const l of sortedRows) {
      if (!seen.includes(l.agendamento_id)) seen.push(l.agendamento_id);
    }
    return seen;
  }, [sortedRows]);

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={22} className="text-gold" strokeWidth={1.5} />
          <div>
            <p className="text-gold text-[9px] tracking-[0.4em] uppercase font-sans">Admin</p>
            <h1 className="font-display text-2xl text-foreground font-light">Financeiro</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-foreground/30 hover:text-foreground/70 border border-surface-border hover:border-foreground/20 transition-colors"
            title="Recarregar"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
          </button>
          {data && data.lancamentos.length > 0 && (
            <button
              onClick={() => exportXlsx(data.lancamentos)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-sans border border-[rgba(201,168,76,0.3)] text-gold hover:bg-[rgba(201,168,76,0.08)] transition-colors"
            >
              <Download size={13} strokeWidth={1.5} />
              Exportar planilha
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-card border border-surface-border rounded-card p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Hoje", action: () => { const t = todayStr(); setDataInicio(t); setDataFim(t); } },
            { label: "Esta semana", action: () => { const r = getWeekRange(); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Este mês", action: () => { const r = getMonthRange(0); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Mês anterior", action: () => { const r = getMonthRange(-1); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Este ano", action: () => { const year = new Date().getFullYear(); setDataInicio(`${year}-01-01`); setDataFim(`${year}-12-31`); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              className="px-3 py-1 text-xs font-sans border border-surface-border text-gray-500 rounded-btn hover:border-gold hover:text-gold transition-colors">
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <p className="text-foreground/35 text-[10px] font-sans uppercase tracking-wider mb-1.5">De</p>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="bg-surface-card border border-surface-border text-foreground text-sm font-sans px-3 py-1.5 rounded-btn focus:outline-none" />
          </div>
          <div>
            <p className="text-foreground/35 text-[10px] font-sans uppercase tracking-wider mb-1.5">Até</p>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="bg-surface-card border border-surface-border text-foreground text-sm font-sans px-3 py-1.5 rounded-btn focus:outline-none" />
          </div>
          <MultiSelectDropdown label="Serviços" options={servicoOptions} selected={selectedServicos} onChange={setSelectedServicos} allLabel="Todos os serviços" />
          <MultiSelectDropdown label="Pagamento" options={PAGAMENTO_OPTIONS} selected={selectedFormas} onChange={setSelectedFormas} allLabel="Todas as formas" />
          <MultiSelectDropdown label="Status" options={STATUS_OPTIONS} selected={selectedStatus} onChange={setSelectedStatus} allLabel="Todos" />
          <div className="flex items-end">
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-foreground/35 hover:text-foreground/60 border border-surface-border hover:border-foreground/20 transition-colors">
              <RotateCcw size={12} strokeWidth={1.5} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 border border-red-800 bg-red-950/20 text-red-400 text-sm font-sans">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={<DollarSign size={17} className="text-gold" strokeWidth={1.5} />}
          label="Receita Total" value={totais ? formatCurrency(totais.receita) : "—"} loading={loading} />
        <KPICard icon={<TrendingUp size={17} className="text-gold" strokeWidth={1.5} />}
          label="Ticket Médio" value={totais ? formatCurrency(totais.ticket_medio) : "—"} loading={loading} />
        <KPICard icon={<Users size={17} className="text-gold" strokeWidth={1.5} />}
          label="Execuções" value={totais ? String(totais.count) : "—"} loading={loading} />
        <KPICard icon={<Zap size={17} className="text-gold" strokeWidth={1.5} />}
          label="Sinais Recebidos" value={totais ? formatCurrency(totais.receita_sinal) : "—"} loading={loading} />
        <KPICard icon={<AlertCircle size={17} className="text-gold" strokeWidth={1.5} />}
          label="Não compareceram"
          value={totais ? `${totais.nao_compareceram}x · ${formatCurrency(totais.sinais_retidos)}` : "—"}
          loading={loading} highlight={!!totais && totais.nao_compareceram > 0} />
        <KPICard icon={<TrendingDown size={17} className="text-gold" strokeWidth={1.5} />}
          label="Descontos" value={totais ? formatCurrency(totais.total_descontos) : "—"}
          loading={loading} highlight={!!totais && totais.total_descontos > 0} />
      </div>

      {/* Charts */}
      {!loading && (porPeriodo.length > 0 || porServico.length > 0) && (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Stacked bar chart */}
          <div className="lg:col-span-3 bg-surface-card border border-surface-border rounded-card p-5">
            <h2 className="font-display text-base text-foreground font-light mb-1">
              Receita por {granularidade === "dia" ? "dia" : granularidade === "semana" ? "semana" : "mês"}
            </h2>
            <div className="flex items-center gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-[10px] font-sans text-foreground/40">
                <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: "#C9A84C" }} />Sinal
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-sans text-foreground/40">
                <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: "#6B8C6E" }} />Restante
              </span>
            </div>
            {porPeriodo.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-foreground/20 text-sm font-sans">Nenhum dado no período</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porPeriodo} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="periodo" tickFormatter={(v) => formatPeriodLabel(String(v), granularidade)}
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `R$${Number(v).toFixed(0)}`}
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "sans-serif" }} axisLine={false} tickLine={false} width={60} />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "receita_sinal" ? "Sinal" : "Restante",
                      ]}
                      labelFormatter={(v) => formatPeriodLabel(String(v), granularidade)}
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: "#C9A84C" }}
                      labelStyle={{ color: "var(--text-secondary)" }}
                      cursor={{ fill: "rgba(201,168,76,0.05)" }}
                    />
                    <Bar dataKey="receita_sinal" stackId="a" fill="#C9A84C" radius={[0,0,0,0]} />
                    <Bar dataKey="receita_restante" stackId="a" fill="#6B8C6E" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Donut por servico */}
          <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-card p-5">
            <h2 className="font-display text-base text-foreground font-light mb-4">Por serviço</h2>
            {porServico.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-foreground/20 text-sm font-sans">Sem dados</div>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porServico} cx="50%" cy="50%" innerRadius={42} outerRadius={66}
                        dataKey="receita" paddingAngle={2} strokeWidth={0}>
                        {porServico.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, _name, entry) => {
                          const pct = totalReceita > 0 ? ((Number(value) / totalReceita) * 100).toFixed(1) : "0";
                          return [`${formatCurrency(Number(value))} (${pct}%)`, (entry.payload as PorServico)?.nome ?? ""];
                        }}
                        contentStyle={chartTooltipStyle} itemStyle={{ color: "#C9A84C" }}
                      />
                      <Legend content={() => null} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-1">
                  {porServico.map((s, i) => (
                    <div key={s.nome} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-foreground/60 text-xs font-sans flex-1 truncate">{s.nome}</span>
                      <span className="text-foreground/40 text-xs font-sans">{totalReceita > 0 ? `${((s.receita/totalReceita)*100).toFixed(0)}%` : "—"}</span>
                      <span className="text-gold text-xs font-sans shrink-0">{formatCurrency(s.receita)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment breakdown */}
      {!loading && porPagamento.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {porPagamento.map((p) => {
            const Icon = PAGAMENTO_ICONS[p.forma] ?? MoreHorizontal;
            const pct = totalReceita > 0 ? ((p.receita / totalReceita) * 100).toFixed(0) : "0";
            return (
              <div key={p.forma} className="bg-surface-card border border-surface-border rounded-card px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-gold" strokeWidth={1.5} />
                  <span className="text-foreground/50 text-xs font-sans uppercase tracking-wider">{PAGAMENTO_LABELS[p.forma] ?? p.forma}</span>
                </div>
                <p className="font-display text-lg text-foreground font-light">{formatCurrency(p.receita)}</p>
                <p className="text-foreground/30 text-xs font-sans mt-0.5">{p.count}x · {pct}%</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base text-foreground font-light">Lançamentos</h2>
          {!loading && <span className="text-foreground/30 text-xs font-sans">{sortedRows.length} lançamentos</span>}
        </div>

        {loading ? (
          <div className="py-12 text-center text-foreground/20 text-sm font-sans">Carregando...</div>
        ) : sortedRows.length === 0 ? (
          <div className="py-12 text-center text-foreground/20 text-sm font-sans">Nenhum lançamento no período</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans min-w-[600px]">
                <thead>
                  <tr className="bg-surface-elevated border-b border-surface-border">
                    {([
                      { key: "data" as SortCol, label: "Data" },
                      { key: "cliente" as SortCol, label: "Cliente" },
                      { key: "servico" as SortCol, label: "Serviço" },
                      { key: "tipo" as SortCol, label: "Tipo" },
                      { key: "valor" as SortCol, label: "Valor" },
                      { key: "pagamento" as SortCol, label: "Pagamento" },
                    ] as const).map((col) => (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        className="text-left text-foreground/30 text-xs uppercase tracking-wider pb-2 pr-3 font-normal cursor-pointer select-none hover:text-foreground/55 transition-colors">
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortCol === col.key ? (
                            sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : <ArrowUpDown size={11} className="opacity-25" strokeWidth={1.5} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pageRows.map((l) => {
                    const agIdx = agendamentoIds.indexOf(l.agendamento_id);
                    const isEvenGroup = agIdx % 2 === 0;
                    const isReembolsado = l.tipo === "sinal_reembolsado";
                    const isNaoCompareceu = l.status === "nao_compareceu";
                    const rowBg = isReembolsado
                      ? "bg-blue-950/10"
                      : isNaoCompareceu
                      ? "bg-red-950/10"
                      : isEvenGroup
                      ? ""
                      : "bg-[rgba(255,255,255,0.01)]";

                    return (
                      <tr key={l.key} className={`hover:bg-surface-elevated transition-colors ${rowBg}`}>
                        <td className="py-2.5 pr-3 text-foreground/45 whitespace-nowrap text-xs">
                          {formatShortDate(l.data)}
                        </td>
                        <td className="py-2.5 pr-3 text-foreground/80 max-w-[130px] truncate">
                          {l.nome_cliente}
                        </td>
                        <td className="py-2.5 pr-3 text-foreground/50 max-w-[150px] truncate text-xs">
                          {l.servico_nome_atual ?? l.servico_nome}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`border px-1.5 py-0.5 text-[10px] font-sans ${TIPO_COLOR[l.tipo] ?? ""}`}>
                            {TIPO_LABEL[l.tipo] ?? l.tipo}
                          </span>
                        </td>
                        <td className={`py-2.5 pr-3 font-medium text-sm ${isReembolsado ? "text-foreground/30 line-through" : l.tipo === "restante" ? "text-emerald-400" : "text-gold"}`}>
                          {isReembolsado ? "—" : formatCurrency(l.valor)}
                        </td>
                        <td className="py-2.5 text-foreground/45 text-xs capitalize">
                          {l.forma_pagamento ? (PAGAMENTO_LABELS[l.forma_pagamento] ?? l.forma_pagamento) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--gold-muted-border)]">
                    <td colSpan={3} className="pt-3 text-foreground/35 text-xs font-sans uppercase tracking-wider">
                      {totais?.count ?? 0} execuções · {totais?.nao_compareceram ?? 0} não compareceram
                    </td>
                    <td className="pt-3 text-foreground/30 text-xs font-sans">
                      {totais ? `${formatCurrency(totais.receita_sinal)} sinal` : ""}
                    </td>
                    <td className="pt-3 text-gold font-medium text-sm">
                      {totais ? formatCurrency(totais.receita) : "—"}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-border">
                <span className="text-gray-600 text-xs font-sans">Página {page} de {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
                    className="p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold disabled:opacity-30 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}
                    className="p-1.5 border border-surface-border text-gray-400 rounded-btn hover:border-gold hover:text-gold disabled:opacity-30 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, loading, highlight }: {
  icon: React.ReactNode; label: string; value: string; loading: boolean; highlight?: boolean;
}) {
  return (
    <div className={`border rounded-card p-5 shadow-card ${highlight ? "border-yellow-800/60 bg-yellow-950/10" : "bg-surface-card border-surface-border"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-surface-elevated p-2 rounded-btn shrink-0">
          {icon}
        </div>
        <span className="text-gray-500 text-[10px] font-sans uppercase tracking-wider mt-1.5">{label}</span>
      </div>
      <p className={`font-display text-2xl font-light ${loading ? "text-gray-700" : highlight ? "text-yellow-400" : "text-foreground"}`}>
        {loading ? "..." : value}
      </p>
    </div>
  );
}
