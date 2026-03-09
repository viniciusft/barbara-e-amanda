import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ViewRow {
  id: string;
  nome_cliente: string;
  telefone: string;
  servico_nome: string;
  servico_id: string | null;
  servico_nome_atual: string | null;
  status: string;
  data_brt: string;
  data_hora_brt: string;
  preco_original: number | null;
  preco_cobrado: number | null;
  diferenca_preco: number;
  tipo_ajuste_preco: string | null;
  motivo_ajuste: string | null;
  forma_pagamento: string | null;
  sinal_status: string | null;
  sinal_valor: number | null;
  sinal_forma_pagamento: string | null;
  receita_sinal: number;
  data_receita_sinal: string | null;
  receita_restante: number;
  data_receita_restante: string | null;
  receita_total_realizada: number;
  servico_executado: boolean | null;
}

export interface Lancamento {
  key: string;
  agendamento_id: string;
  nome_cliente: string;
  telefone: string;
  servico_nome: string;
  servico_nome_atual: string | null;
  servico_id: string | null;
  tipo: "sinal" | "restante" | "sinal_retido" | "sinal_reembolsado";
  valor: number;
  data: string; // YYYY-MM-DD (data do lançamento)
  data_brt: string; // data do agendamento
  data_hora_brt: string;
  forma_pagamento: string | null;
  status: string;
  preco_original: number | null;
  preco_cobrado: number | null;
  diferenca_preco: number;
  tipo_ajuste_preco: string | null;
  motivo_ajuste: string | null;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function rowToLancamentos(row: ViewRow): Lancamento[] {
  const base = {
    agendamento_id: row.id,
    nome_cliente: row.nome_cliente,
    telefone: row.telefone,
    servico_nome: row.servico_nome,
    servico_nome_atual: row.servico_nome_atual,
    servico_id: row.servico_id,
    data_brt: row.data_brt,
    data_hora_brt: row.data_hora_brt,
    status: row.status,
    preco_original: row.preco_original,
    preco_cobrado: row.preco_cobrado,
    diferenca_preco: row.diferenca_preco,
    tipo_ajuste_preco: row.tipo_ajuste_preco,
    motivo_ajuste: row.motivo_ajuste,
  };

  const result: Lancamento[] = [];

  // Sinal lancamento
  if (row.sinal_status === "pago" || row.sinal_status === "reembolsado") {
    const dataLanc = row.data_receita_sinal || row.data_brt;
    const tipo =
      row.sinal_status === "reembolsado"
        ? "sinal_reembolsado"
        : row.status === "nao_compareceu"
        ? "sinal_retido"
        : "sinal";
    result.push({
      ...base,
      key: `${row.id}-sinal`,
      tipo,
      valor: Number(row.receita_sinal) || 0,
      data: dataLanc,
      forma_pagamento: row.sinal_forma_pagamento,
    });
  }

  // Restante lancamento
  if (Number(row.receita_restante) > 0 && row.data_receita_restante) {
    result.push({
      ...base,
      key: `${row.id}-restante`,
      tipo: "restante",
      valor: Number(row.receita_restante),
      data: row.data_receita_restante,
      forma_pagamento: row.forma_pagamento,
    });
  }

  return result;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dataInicio = searchParams.get("data_inicio");
  const dataFim = searchParams.get("data_fim");
  const servicoIds = searchParams.getAll("servicos");
  const formasPagamento = searchParams.getAll("formas_pagamento");
  const statusList = searchParams.getAll("status");
  const statusFiltro = statusList.length > 0 ? statusList : ["concluido"];

  const supabase = createServerSupabaseClient();

  // Fetch all matching rows (status + servico filters).
  // Date filtering is done in JS because a single agendamento can generate
  // lancamentos on different dates (sinal on one day, restante on another).
  let query = supabase
    .from("vw_faturamento")
    .select("*")
    .in("status", statusFiltro)
    .order("data_hora_brt", { ascending: false });

  if (servicoIds.length > 0) query = query.in("servico_id", servicoIds);

  const { data: rows, error } = await query;

  if (error) {
    console.error("[financeiro] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate all lancamentos from rows
  const allLancamentos: Lancamento[] = (rows ?? []).flatMap((r) =>
    rowToLancamentos(r as ViewRow)
  );

  // Filter lancamentos by date range (if provided)
  const lancamentos = allLancamentos.filter((l) => {
    if (!dataInicio && !dataFim) return true;
    const d = l.data;
    if (!d) return false;
    if (dataInicio && d < dataInicio) return false;
    if (dataFim && d > dataFim) return false;
    return true;
  });

  // Apply forma_pagamento filter to lancamentos
  const filtered =
    formasPagamento.length > 0
      ? lancamentos.filter(
          (l) => l.forma_pagamento && formasPagamento.includes(l.forma_pagamento)
        )
      : lancamentos;

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const receitaSinal = filtered
    .filter((l) => l.tipo === "sinal" || l.tipo === "sinal_retido")
    .reduce((s, l) => s + l.valor, 0);

  const receitaRestante = filtered
    .filter((l) => l.tipo === "restante")
    .reduce((s, l) => s + l.valor, 0);

  const receitaTotal = receitaSinal + receitaRestante;

  const naoCompareceramSet = new Set(
    filtered.filter((l) => l.status === "nao_compareceu").map((l) => l.agendamento_id)
  );

  const reembolsosValor = filtered
    .filter((l) => l.tipo === "sinal_reembolsado")
    .reduce((s, l) => s + (Number((rows ?? []).find((r) => r.id === l.agendamento_id)?.sinal_valor) || 0), 0);

  // Concluidos count (unique agendamento_ids with restante lancamento)
  const concluidosSet = new Set(
    filtered.filter((l) => l.tipo === "restante").map((l) => l.agendamento_id)
  );

  const totalDescontos = filtered
    .filter((l) => l.tipo === "restante" && (l.diferenca_preco || 0) < 0)
    .reduce((s, l) => s + Math.abs(l.diferenca_preco || 0), 0);

  const ticketMedio = concluidosSet.size > 0
    ? filtered.filter((l) => l.tipo === "restante").reduce((s, l) => s + l.valor, 0) / concluidosSet.size
    : 0;

  // ── Por-serviço (using restante lancamentos) ──────────────────────────────

  const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {};
  for (const l of filtered.filter((l) => l.tipo === "restante")) {
    const sid = l.servico_id ?? l.servico_nome;
    const nome = l.servico_nome_atual ?? l.servico_nome;
    if (!servicoMap[sid]) servicoMap[sid] = { nome, count: 0, receita: 0 };
    servicoMap[sid].count++;
    servicoMap[sid].receita += l.valor;
  }
  const porServico = Object.values(servicoMap).sort((a, b) => b.receita - a.receita);

  // ── Por-pagamento (all lancamentos) ──────────────────────────────────────

  const pagtoMap: Record<string, { forma: string; count: number; receita: number }> = {};
  for (const l of filtered.filter((l) => l.tipo === "sinal" || l.tipo === "restante" || l.tipo === "sinal_retido")) {
    const forma = l.forma_pagamento ?? "outro";
    if (!pagtoMap[forma]) pagtoMap[forma] = { forma, count: 0, receita: 0 };
    pagtoMap[forma].count++;
    pagtoMap[forma].receita += l.valor;
  }
  const porPagamento = Object.values(pagtoMap).sort((a, b) => b.receita - a.receita);

  // ── Granularidade ─────────────────────────────────────────────────────────

  let rangeDays = 30;
  if (dataInicio && dataFim) {
    rangeDays =
      Math.ceil(
        (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
  }
  const granularidade: "dia" | "semana" | "mes" =
    rangeDays <= 31 ? "dia" : rangeDays <= 90 ? "semana" : "mes";

  // ── Por-período (stacked: sinal + restante) ───────────────────────────────

  const periodoMap: Record<string, { periodo: string; receita: number; receita_sinal: number; receita_restante: number; count: number }> = {};
  for (const l of filtered.filter((l) => l.tipo !== "sinal_reembolsado")) {
    let key = l.data;
    if (granularidade === "semana") key = getWeekMonday(l.data);
    else if (granularidade === "mes") key = l.data.slice(0, 7);
    if (!periodoMap[key]) periodoMap[key] = { periodo: key, receita: 0, receita_sinal: 0, receita_restante: 0, count: 0 };
    periodoMap[key].receita += l.valor;
    if (l.tipo === "sinal" || l.tipo === "sinal_retido") periodoMap[key].receita_sinal += l.valor;
    if (l.tipo === "restante") periodoMap[key].receita_restante += l.valor;
    if (l.tipo === "restante") periodoMap[key].count++;
  }
  const porPeriodo = Object.values(periodoMap).sort((a, b) => a.periodo.localeCompare(b.periodo));

  return NextResponse.json({
    lancamentos: filtered,
    totais: {
      receita: receitaTotal,
      receita_sinal: receitaSinal,
      receita_restante: receitaRestante,
      count: concluidosSet.size,
      ticket_medio: ticketMedio,
      total_descontos: totalDescontos,
      nao_compareceram: naoCompareceramSet.size,
      sinais_retidos: receitaSinal - reembolsosValor,
      reembolsos: reembolsosValor,
    },
    por_servico: porServico,
    por_pagamento: porPagamento,
    por_periodo: porPeriodo,
    granularidade,
  });
}
