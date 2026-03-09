"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  TrendingDown,
  RotateCcw,
  Download,
  Zap,
  Banknote,
  CreditCard,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import MultiSelectDropdown, { SelectOption } from "@/components/admin/MultiSelectDropdown";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Atendimento {
  id: string;
  nome_cliente: string;
  telefone: string;
  servico_nome: string;
  servico_nome_atual: string | null;
  servico_id: string | null;
  data_brt: string;
  data_hora_brt: string;
  hora_inicio: string | null;
  status: string;
  preco_original: number | null;
  preco_cobrado: number | null;
  receita: number | null;
  tipo_ajuste_preco: string | null;
  motivo_ajuste: string | null;
  forma_pagamento: string | null;
  diferenca_preco: number;
}

interface Totais {
  receita: number;
  count: number;
  ticket_medio: number;
  total_descontos: number;
  pendentes_execucao: number;
  total_sinais: number;
  nao_compareceram: number;
  sinais_retidos: number;
}

interface PorServico {
  nome: string;
  count: number;
  receita: number;
}

interface PorPagamento {
  forma: string;
  count: number;
  receita: number;
}

interface PorPeriodo {
  periodo: string;
  receita: number;
  count: number;
}

interface ApiResponse {
  atendimentos: Atendimento[];
  totais: Totais;
  por_servico: PorServico[];
  por_pagamento: PorPagamento[];
  por_periodo: PorPeriodo[];
  granularidade: "dia" | "semana" | "mes";
}

interface ServicoSimples {
  id: string;
  nome: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const PIE_COLORS = [
  "#C9A84C",
  "#B8956E",
  "#9B7E5C",
  "#7A6B52",
  "#6B8C9E",
  "#8B9EA0",
  "#C4A882",
  "#A0937D",
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthRange(offset = 0) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    inicio: start.toISOString().slice(0, 10),
    fim: end.toISOString().slice(0, 10),
  };
}

function getWeekRange() {
  const d = new Date();
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    inicio: monday.toISOString().slice(0, 10),
    fim: sunday.toISOString().slice(0, 10),
  };
}

function formatPeriodLabel(periodo: string, granularidade: "dia" | "semana" | "mes") {
  if (granularidade === "mes") {
    const [year, month] = periodo.split("-");
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  }
  if (granularidade === "semana") {
    const d = new Date(periodo + "T12:00:00");
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  }
  // dia
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
  pix: Zap,
  dinheiro: Banknote,
  credito: CreditCard,
  debito: CreditCard,
  outro: MoreHorizontal,
};

const PAGAMENTO_LABELS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  outro: "Outro",
};

// ─── Sort column helper ───────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

function sortAtendimentos(rows: Atendimento[], col: string, dir: SortDir) {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (col) {
      case "data": av = a.data_brt ?? ""; bv = b.data_brt ?? ""; break;
      case "cliente": av = a.nome_cliente ?? ""; bv = b.nome_cliente ?? ""; break;
      case "servico": av = (a.servico_nome_atual ?? a.servico_nome) ?? ""; bv = (b.servico_nome_atual ?? b.servico_nome) ?? ""; break;
      case "preco_original": av = Number(a.preco_original ?? 0); bv = Number(b.preco_original ?? 0); break;
      case "preco_cobrado": av = Number(a.preco_cobrado ?? 0); bv = Number(b.preco_cobrado ?? 0); break;
      case "ajuste": av = Number(a.diferenca_preco ?? 0); bv = Number(b.diferenca_preco ?? 0); break;
      case "pagamento": av = a.forma_pagamento ?? ""; bv = b.forma_pagamento ?? ""; break;
      case "status": av = a.status ?? ""; bv = b.status ?? ""; break;
    }
    if (typeof av === "number") return (av - (bv as number)) * factor;
    return av.localeCompare(bv as string) * factor;
  });
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: Atendimento[]) {
  const headers = [
    "Data", "Hora", "Cliente", "Telefone", "Serviço",
    "Preço Original", "Preço Cobrado", "Ajuste (R$)", "Motivo Ajuste",
    "Forma Pagamento", "Status",
  ];
  const csvRows = rows.map((a) => [
    a.data_brt ?? "",
    a.hora_inicio ?? "",
    a.nome_cliente,
    a.telefone,
    a.servico_nome_atual ?? a.servico_nome,
    a.preco_original != null ? String(a.preco_original) : "",
    a.preco_cobrado != null ? String(a.preco_cobrado) : "",
    a.diferenca_preco != null ? String(a.diferenca_preco) : "",
    a.motivo_ajuste ?? "",
    a.forma_pagamento ?? "",
    a.status,
  ]);
  const csv = [headers, ...csvRows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financeiro_${todayStr()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const thisMonth = getMonthRange(0);

  // Filter state
  const [dataInicio, setDataInicio] = useState(thisMonth.inicio);
  const [dataFim, setDataFim] = useState(thisMonth.fim);
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  const [selectedFormas, setSelectedFormas] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["concluido"]);

  // Servicos list for filter
  const [servicos, setServicos] = useState<ServicoSimples[]>([]);

  // API data
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Table state
  const [sortCol, setSortCol] = useState("data");
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sorted + paginated table rows
  const sortedRows = useMemo(
    () => sortAtendimentos(data?.atendimentos ?? [], sortCol, sortDir),
    [data?.atendimentos, sortCol, sortDir]
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pageRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
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

  const servicoOptions: SelectOption[] = servicos.map((s) => ({
    value: s.id,
    label: s.nome,
  }));

  const totais = data?.totais;
  const porServico = data?.por_servico ?? [];
  const porPagamento = data?.por_pagamento ?? [];
  const porPeriodo = data?.por_periodo ?? [];
  const granularidade = data?.granularidade ?? "dia";
  const totalReceita = totais?.receita ?? 0;

  // Chart tooltip formatted
  const chartTooltipStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid rgba(201,168,76,0.25)",
    borderRadius: 0,
    fontFamily: "sans-serif",
    fontSize: 12,
  };

  return (
    <div className="py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={22} className="text-[#C9A84C]" strokeWidth={1.5} />
          <div>
            <p className="text-[#C9A84C] text-[9px] tracking-[0.4em] uppercase font-sans">
              Admin
            </p>
            <h1 className="font-display text-2xl text-[#F5F0E8] font-light">
              Financeiro
            </h1>
          </div>
        </div>
        {data && data.atendimentos.length > 0 && (
          <button
            onClick={() => exportCSV(data.atendimentos)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.08)] transition-colors"
          >
            <Download size={13} strokeWidth={1.5} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.1)] p-5 space-y-4">
        {/* Period shortcuts */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Hoje", action: () => { const t = todayStr(); setDataInicio(t); setDataFim(t); } },
            { label: "Esta semana", action: () => { const r = getWeekRange(); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Este mês", action: () => { const r = getMonthRange(0); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Mês anterior", action: () => { const r = getMonthRange(-1); setDataInicio(r.inicio); setDataFim(r.fim); } },
            { label: "Este ano", action: () => { const year = new Date().getFullYear(); setDataInicio(`${year}-01-01`); setDataFim(`${year}-12-31`); } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="px-3 py-1 text-xs font-sans border border-[rgba(255,255,255,0.08)] text-[rgba(245,240,232,0.45)] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date pickers + multi-selects */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <p className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans uppercase tracking-wider mb-1.5">
              De
            </p>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.7)] text-sm font-sans px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <p className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans uppercase tracking-wider mb-1.5">
              Até
            </p>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.7)] text-sm font-sans px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <MultiSelectDropdown
            label="Serviços"
            options={servicoOptions}
            selected={selectedServicos}
            onChange={setSelectedServicos}
            allLabel="Todos os serviços"
          />
          <MultiSelectDropdown
            label="Pagamento"
            options={PAGAMENTO_OPTIONS}
            selected={selectedFormas}
            onChange={setSelectedFormas}
            allLabel="Todas as formas"
          />
          <MultiSelectDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={selectedStatus}
            onChange={setSelectedStatus}
            allLabel="Todos"
          />
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.6)] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 border border-red-800 bg-red-950/20 text-red-400 text-sm font-sans">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          icon={<DollarSign size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Receita Total"
          value={totais ? formatCurrency(totais.receita) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<Users size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Atendimentos"
          value={totais ? String(totais.count) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<TrendingUp size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Ticket Médio"
          value={totais ? formatCurrency(totais.ticket_medio) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<TrendingDown size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Descontos"
          value={totais ? formatCurrency(totais.total_descontos) : "—"}
          loading={loading}
          highlight={!!totais && totais.total_descontos > 0}
        />
        <KPICard
          icon={<Zap size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Sinais Recebidos"
          value={totais ? formatCurrency(totais.total_sinais) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<AlertCircle size={17} className="text-[#C9A84C]" strokeWidth={1.5} />}
          label="Não compareceram"
          value={totais ? `${totais.nao_compareceram}x · ${formatCurrency(totais.sinais_retidos)}` : "—"}
          loading={loading}
          highlight={!!totais && totais.nao_compareceram > 0}
        />
      </div>

      {/* ── Charts ── */}
      {!loading && (porPeriodo.length > 0 || porServico.length > 0) && (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-3 bg-[#0f0f0f] border border-[rgba(201,168,76,0.1)] p-5">
            <h2 className="font-display text-base text-[#F5F0E8] font-light mb-4">
              Receita por{" "}
              {granularidade === "dia"
                ? "dia"
                : granularidade === "semana"
                ? "semana"
                : "mês"}
            </h2>
            {porPeriodo.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[rgba(245,240,232,0.2)] text-sm font-sans">
                Nenhum atendimento no período
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={porPeriodo}
                    margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="periodo"
                      tickFormatter={(v) => formatPeriodLabel(String(v), granularidade)}
                      tick={{
                        fill: "rgba(245,240,232,0.35)",
                        fontSize: 11,
                        fontFamily: "sans-serif",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `R$${Number(v).toFixed(0)}`}
                      tick={{
                        fill: "rgba(245,240,232,0.35)",
                        fontSize: 11,
                        fontFamily: "sans-serif",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <RechartsTooltip
                      formatter={(value, _name, entry) => {
                        const count = (entry.payload as PorPeriodo)?.count;
                        return [
                          `${formatCurrency(Number(value))} · ${count} atend.`,
                          "Receita",
                        ];
                      }}
                      labelFormatter={(v) => formatPeriodLabel(String(v), granularidade)}
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: "#C9A84C" }}
                      labelStyle={{ color: "rgba(245,240,232,0.6)" }}
                      cursor={{ fill: "rgba(201,168,76,0.05)" }}
                    />
                    <Bar dataKey="receita" fill="#C9A84C" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Donut chart */}
          <div className="lg:col-span-2 bg-[#0f0f0f] border border-[rgba(201,168,76,0.1)] p-5">
            <h2 className="font-display text-base text-[#F5F0E8] font-light mb-4">
              Por serviço
            </h2>
            {porServico.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[rgba(245,240,232,0.2)] text-sm font-sans">
                Sem dados
              </div>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porServico}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={66}
                        dataKey="receita"
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {porServico.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, _name, entry) => {
                          const pct =
                            totalReceita > 0
                              ? ((Number(value) / totalReceita) * 100).toFixed(1)
                              : "0";
                          return [
                            `${formatCurrency(Number(value))} (${pct}%)`,
                            (entry.payload as PorServico)?.nome ?? "",
                          ];
                        }}
                        contentStyle={chartTooltipStyle}
                        itemStyle={{ color: "#C9A84C" }}
                      />
                      <Legend
                        content={() => null}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom legend */}
                <div className="space-y-1.5 mt-1">
                  {porServico.map((s, i) => (
                    <div key={s.nome} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[rgba(245,240,232,0.6)] text-xs font-sans flex-1 truncate">
                        {s.nome}
                      </span>
                      <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans">
                        {totalReceita > 0
                          ? `${((s.receita / totalReceita) * 100).toFixed(0)}%`
                          : "—"}
                      </span>
                      <span className="text-[#C9A84C] text-xs font-sans shrink-0">
                        {formatCurrency(s.receita)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Payment breakdown ── */}
      {!loading && porPagamento.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {porPagamento.map((p) => {
            const Icon = PAGAMENTO_ICONS[p.forma] ?? MoreHorizontal;
            const pct = totalReceita > 0 ? ((p.receita / totalReceita) * 100).toFixed(0) : "0";
            return (
              <div
                key={p.forma}
                className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.08)] px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-[#C9A84C]" strokeWidth={1.5} />
                  <span className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider">
                    {PAGAMENTO_LABELS[p.forma] ?? p.forma}
                  </span>
                </div>
                <p className="font-display text-lg text-[#F5F0E8] font-light">
                  {formatCurrency(p.receita)}
                </p>
                <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans mt-0.5">
                  {p.count}x · {pct}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.1)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base text-[#F5F0E8] font-light">
            Atendimentos
          </h2>
          {!loading && (
            <span className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
              {sortedRows.length} registros
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-[rgba(245,240,232,0.2)] text-sm font-sans">
            Carregando...
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="py-12 text-center text-[rgba(245,240,232,0.2)] text-sm font-sans">
            Nenhum atendimento no período com os filtros selecionados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans min-w-[700px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    {[
                      { key: "data", label: "Data" },
                      { key: "cliente", label: "Cliente" },
                      { key: "servico", label: "Serviço" },
                      { key: "preco_original", label: "Tabela" },
                      { key: "preco_cobrado", label: "Cobrado" },
                      { key: "ajuste", label: "Ajuste" },
                      { key: "pagamento", label: "Pagamento" },
                      { key: "status", label: "Status" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left text-[rgba(245,240,232,0.3)] text-xs uppercase tracking-wider pb-2 pr-3 font-normal cursor-pointer select-none hover:text-[rgba(245,240,232,0.55)] transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortCol === col.key ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={11} />
                            ) : (
                              <ArrowDown size={11} />
                            )
                          ) : (
                            <ArrowUpDown
                              size={11}
                              className="opacity-25"
                              strokeWidth={1.5}
                            />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                  {pageRows.map((a) => {
                    const diff = Number(a.diferenca_preco) || 0;
                    const diffColor =
                      diff > 0.01
                        ? "text-blue-400"
                        : diff < -0.01
                        ? "text-yellow-400"
                        : "text-[rgba(245,240,232,0.25)]";
                    const precoColor =
                      a.status === "concluido"
                        ? diff > 0.01
                          ? "text-blue-400"
                          : diff < -0.01
                          ? "text-yellow-400"
                          : "text-[#C9A84C]"
                        : "text-[rgba(245,240,232,0.5)]";

                    const statusCfg: Record<string, string> = {
                      concluido: "text-emerald-400 border-emerald-800 bg-emerald-950/30",
                      nao_compareceu: "text-red-800 border-red-900 bg-red-950/40",
                      confirmado: "text-green-400 border-green-800 bg-green-950/20",
                      aguardando_sinal: "text-orange-400 border-orange-700 bg-orange-950/20",
                      solicitacao: "text-amber-400 border-amber-700 bg-amber-950/20",
                      pendente: "text-yellow-400 border-yellow-800 bg-yellow-950/20",
                    };
                    const statusLabel: Record<string, string> = {
                      concluido: "Concluído",
                      nao_compareceu: "Não compareceu",
                      confirmado: "Confirmado",
                      aguardando_sinal: "Ag. Sinal",
                      solicitacao: "Solicitação",
                      pendente: "Pendente",
                    };

                    return (
                      <tr key={a.id} className={`hover:bg-[rgba(255,255,255,0.015)] transition-colors ${a.status === "nao_compareceu" ? "bg-red-950/10" : ""}`}>
                        <td className="py-2.5 pr-3 text-[rgba(245,240,232,0.45)] whitespace-nowrap">
                          {formatShortDate(a.data_brt)}
                          {a.hora_inicio && (
                            <span className="text-[rgba(245,240,232,0.2)] ml-1 text-xs">
                              {a.hora_inicio}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-[rgba(245,240,232,0.8)] max-w-[140px] truncate">
                          {a.nome_cliente}
                        </td>
                        <td className="py-2.5 pr-3 text-[rgba(245,240,232,0.5)] max-w-[160px] truncate">
                          {a.servico_nome_atual ?? a.servico_nome}
                        </td>
                        <td className="py-2.5 pr-3 text-[rgba(245,240,232,0.35)]">
                          {a.preco_original != null
                            ? formatCurrency(Number(a.preco_original))
                            : "—"}
                        </td>
                        <td className={`py-2.5 pr-3 font-medium ${precoColor}`}>
                          {a.preco_cobrado != null
                            ? formatCurrency(Number(a.preco_cobrado))
                            : a.receita != null
                            ? formatCurrency(Number(a.receita))
                            : "—"}
                        </td>
                        <td className={`py-2.5 pr-3 text-xs ${diffColor}`}>
                          {diff > 0.01
                            ? `+${formatCurrency(diff)}`
                            : diff < -0.01
                            ? formatCurrency(diff)
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-[rgba(245,240,232,0.45)] capitalize">
                          {a.forma_pagamento
                            ? PAGAMENTO_LABELS[a.forma_pagamento] ?? a.forma_pagamento
                            : "—"}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`border px-1.5 py-0.5 text-xs ${statusCfg[a.status] ?? ""}`}
                          >
                            {statusLabel[a.status] ?? a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[rgba(201,168,76,0.15)]">
                    <td
                      colSpan={4}
                      className="pt-3 text-[rgba(245,240,232,0.35)] text-xs font-sans uppercase tracking-wider"
                    >
                      {totais?.count ?? 0} concluídos · {totais?.nao_compareceram ?? 0} não compareceram
                    </td>
                    <td className="pt-3 text-[#C9A84C] font-medium text-sm">
                      {totais ? formatCurrency(totais.receita) : "—"}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <span className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-[rgba(255,255,255,0.08)] text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-[rgba(255,255,255,0.08)] text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.7)] disabled:opacity-30 transition-colors"
                  >
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

function KPICard({
  icon,
  label,
  value,
  loading,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-[#0f0f0f] border p-5 ${
        highlight
          ? "border-yellow-800/60 bg-yellow-950/10"
          : "border-[rgba(201,168,76,0.1)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`font-display text-2xl font-light ${
          loading
            ? "text-[rgba(245,240,232,0.15)]"
            : highlight
            ? "text-yellow-400"
            : "text-[#F5F0E8]"
        }`}
      >
        {loading ? "..." : value}
      </p>
    </div>
  );
}
