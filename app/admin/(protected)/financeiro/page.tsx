"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Agendamento, Servico } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Totais {
  receita: number;
  count: number;
  ticketMedio: number;
  pendentesExecucao: number;
}

interface PorServico {
  nome: string;
  count: number;
  receita: number;
}

interface GraficoPonto {
  data: string;
  valor: number;
}

const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Crédito", "Débito", "Outro"];

function formatDateLabel(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function FinanceiroPage() {
  // Filters — default to current month
  const hoje = new Date();
  const mesInicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
  const mesFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [dataInicio, setDataInicio] = useState(mesInicio);
  const [dataFim, setDataFim] = useState(mesFim);
  const [servicoId, setServicoid] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const [totais, setTotais] = useState<Totais | null>(null);
  const [atendimentos, setAtendimentos] = useState<Agendamento[]>([]);
  const [porServico, setPorServico] = useState<PorServico[]>([]);
  const [grafico, setGrafico] = useState<GraficoPonto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((data) => setServicos(Array.isArray(data) ? data : []));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    if (servicoId) params.set("servico_id", servicoId);
    if (formaPagamento) params.set("forma_pagamento", formaPagamento);

    const res = await fetch(`/api/financeiro?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTotais(data.totais);
      setAtendimentos(data.atendimentos ?? []);
      setPorServico(data.porServico ?? []);
      setGrafico(data.grafico ?? []);
    }
    setLoading(false);
  }, [dataInicio, dataFim, servicoId, formaPagamento]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxReceita = Math.max(...porServico.map((s) => s.receita), 1);

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
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

      {/* Filters */}
      <div className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.12)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-[rgba(245,240,232,0.4)]" />
          <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans uppercase tracking-wider">
            Filtros
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[rgba(245,240,232,0.4)] text-xs font-sans">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#F5F0E8] text-sm font-sans px-2 py-1 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[rgba(245,240,232,0.4)] text-xs font-sans">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#F5F0E8] text-sm font-sans px-2 py-1 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <select
            value={servicoId}
            onChange={(e) => setServicoid(e.target.value)}
            className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.7)] text-sm font-sans px-2 py-1 focus:outline-none focus:border-[#C9A84C]"
          >
            <option value="">Todos os serviços</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.7)] text-sm font-sans px-2 py-1 focus:outline-none focus:border-[#C9A84C]"
          >
            <option value="">Todas as formas</option>
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<DollarSign size={18} className="text-[#C9A84C]" />}
          label="Receita do Período"
          value={totais ? formatCurrency(totais.receita) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<Users size={18} className="text-[#C9A84C]" />}
          label="Atendimentos"
          value={totais ? String(totais.count) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<TrendingUp size={18} className="text-[#C9A84C]" />}
          label="Ticket Médio"
          value={totais ? formatCurrency(totais.ticketMedio) : "—"}
          loading={loading}
        />
        <KPICard
          icon={<Clock size={18} className="text-[#C9A84C]" />}
          label="Pendente Execução"
          value={totais ? String(totais.pendentesExecucao) : "—"}
          loading={loading}
          highlight={!!totais && totais.pendentesExecucao > 0}
        />
      </div>

      {/* Chart */}
      {grafico.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.12)] p-5">
          <h2 className="font-display text-base text-[#F5F0E8] font-light mb-4">
            Receita por dia
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafico} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatDateLabel}
                  tick={{ fill: "rgba(245,240,232,0.35)", fontSize: 11, fontFamily: "sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fill: "rgba(245,240,232,0.35)", fontSize: 11, fontFamily: "sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                  labelFormatter={(label) => formatDateLabel(String(label))}
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: 0,
                    fontFamily: "sans-serif",
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#C9A84C" }}
                  labelStyle={{ color: "rgba(245,240,232,0.6)" }}
                />
                <Bar dataKey="valor" fill="#C9A84C" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Per-service summary */}
        {porServico.length > 0 && (
          <div className="bg-[#0f0f0f] border border-[rgba(201,168,76,0.12)] p-5">
            <h2 className="font-display text-base text-[#F5F0E8] font-light mb-4">
              Por serviço
            </h2>
            <div className="space-y-4">
              {porServico.map((s) => (
                <div key={s.nome}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[rgba(245,240,232,0.7)] text-sm font-sans truncate">
                      {s.nome}
                    </span>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[#C9A84C] text-sm font-sans">
                        {formatCurrency(s.receita)}
                      </span>
                      <span className="text-[rgba(245,240,232,0.3)] text-xs font-sans ml-1.5">
                        ({s.count}x)
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[rgba(255,255,255,0.06)] w-full">
                    <div
                      className="h-1 bg-[#C9A84C]"
                      style={{ width: `${(s.receita / maxReceita) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atendimentos table */}
        <div className={`bg-[#0f0f0f] border border-[rgba(201,168,76,0.12)] p-5 ${porServico.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <h2 className="font-display text-base text-[#F5F0E8] font-light mb-4">
            Atendimentos concluídos
          </h2>
          {loading ? (
            <p className="text-[rgba(245,240,232,0.3)] text-sm font-sans">Carregando...</p>
          ) : atendimentos.length === 0 ? (
            <p className="text-[rgba(245,240,232,0.3)] text-sm font-sans">
              Nenhum atendimento encontrado no período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left text-[rgba(245,240,232,0.35)] text-xs uppercase tracking-wider pb-2 pr-4 font-normal">
                      Data
                    </th>
                    <th className="text-left text-[rgba(245,240,232,0.35)] text-xs uppercase tracking-wider pb-2 pr-4 font-normal">
                      Cliente
                    </th>
                    <th className="text-left text-[rgba(245,240,232,0.35)] text-xs uppercase tracking-wider pb-2 pr-4 font-normal hidden sm:table-cell">
                      Serviço
                    </th>
                    <th className="text-left text-[rgba(245,240,232,0.35)] text-xs uppercase tracking-wider pb-2 pr-4 font-normal hidden sm:table-cell">
                      Pagamento
                    </th>
                    <th className="text-right text-[rgba(245,240,232,0.35)] text-xs uppercase tracking-wider pb-2 font-normal">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {atendimentos.map((a) => {
                    const preco = a.preco_cobrado ?? a.servico?.preco ?? 0;
                    const tipo = a.tipo_ajuste_preco;
                    const dt = a.data ?? a.data_hora?.slice(0, 10) ?? "";
                    const dtDisplay = dt
                      ? `${dt.slice(8, 10)}/${dt.slice(5, 7)}`
                      : "";
                    return (
                      <tr key={a.id} className="group">
                        <td className="py-2.5 pr-4 text-[rgba(245,240,232,0.45)] whitespace-nowrap">
                          {dtDisplay}
                          {a.hora_inicio && (
                            <span className="text-[rgba(245,240,232,0.25)] ml-1">
                              {a.hora_inicio}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-[rgba(245,240,232,0.8)]">
                          {a.nome_cliente}
                        </td>
                        <td className="py-2.5 pr-4 text-[rgba(245,240,232,0.5)] hidden sm:table-cell">
                          {a.servico?.nome ?? a.servico_nome}
                        </td>
                        <td className="py-2.5 pr-4 text-[rgba(245,240,232,0.45)] hidden sm:table-cell">
                          {a.forma_pagamento ?? "—"}
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <span
                            className={
                              tipo === "desconto"
                                ? "text-yellow-400"
                                : tipo === "acrescimo"
                                ? "text-blue-400"
                                : "text-[#C9A84C]"
                            }
                          >
                            {formatCurrency(preco)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[rgba(201,168,76,0.2)]">
                    <td
                      colSpan={4}
                      className="pt-3 text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider"
                    >
                      Total ({atendimentos.length} atendimentos)
                    </td>
                    <td className="pt-3 text-right text-[#C9A84C] font-medium">
                      {totais ? formatCurrency(totais.receita) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
          ? "border-yellow-800 bg-yellow-950/10"
          : "border-[rgba(201,168,76,0.12)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">{icon}
        <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`font-display text-2xl font-light ${loading ? "text-[rgba(245,240,232,0.2)]" : highlight ? "text-yellow-400" : "text-[#F5F0E8]"}`}>
        {loading ? "..." : value}
      </p>
    </div>
  );
}
