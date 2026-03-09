import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

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

  let query = supabase
    .from("vw_faturamento")
    .select("*")
    .in("status", statusFiltro)
    .order("data_hora_brt", { ascending: false });

  if (dataInicio) query = query.gte("data_brt", dataInicio);
  if (dataFim) query = query.lte("data_brt", dataFim);
  if (servicoIds.length > 0) query = query.in("servico_id", servicoIds);
  if (formasPagamento.length > 0) query = query.in("forma_pagamento", formasPagamento);

  const { data: rows, error } = await query;

  if (error) {
    console.error("[financeiro] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ViewRow = Record<string, unknown>;
  const atendimentos: ViewRow[] = (rows ?? []).map((r: ViewRow) => ({
    ...r,
    hora_inicio:
      typeof r.data_hora_brt === "string" ? r.data_hora_brt.slice(11, 16) : null,
  }));

  // KPI totals — only from concluido rows
  const concluidos = atendimentos.filter((a) => a.status === "concluido");
  const naoCompareceramRows = atendimentos.filter((a) => a.status === "nao_compareceu");

  const receita = concluidos.reduce(
    (sum: number, a) => sum + (Number(a.preco_cobrado) || 0),
    0
  );
  const totalDescontos = concluidos.reduce((sum: number, a) => {
    const diff = Number(a.diferenca_preco) || 0;
    return sum + (diff < 0 ? Math.abs(diff) : 0);
  }, 0);
  const ticketMedio = concluidos.length > 0 ? receita / concluidos.length : 0;

  // Sinal KPI — rows where sinal_status = 'pago'
  const sinaisQuery = supabase
    .from("agendamentos")
    .select("sinal_valor, sinal_forma_pagamento")
    .eq("sinal_status", "pago");
  if (dataInicio) {
    // Filter by data_hora roughly
  }
  const { data: sinaisRows } = await sinaisQuery;
  const totalSinais = (sinaisRows ?? []).reduce(
    (sum: number, a) => sum + (Number(a.sinal_valor) || 0),
    0
  );

  // Nao comparecimento — sinal retido
  const sinaisRetidos = naoCompareceramRows.reduce(
    (sum: number, a) => sum + (Number(a.sinal_valor) || 0),
    0
  );

  // Pending execution count
  const now = new Date().toISOString();
  const { count: pendentesExecucao } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmado")
    .lt("data_hora_fim", now);

  // Per-service summary (concluido only)
  const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {};
  for (const a of concluidos) {
    const sid = String(a.servico_id ?? a.servico_nome);
    const nome = String(a.servico_nome_atual ?? a.servico_nome);
    if (!servicoMap[sid]) servicoMap[sid] = { nome, count: 0, receita: 0 };
    servicoMap[sid].count++;
    servicoMap[sid].receita += Number(a.preco_cobrado) || 0;
  }
  const porServico = Object.values(servicoMap).sort((a, b) => b.receita - a.receita);

  // Per-payment summary (concluido only)
  const pagtoMap: Record<string, { forma: string; count: number; receita: number }> = {};
  for (const a of concluidos) {
    const forma = String(a.forma_pagamento ?? "outro");
    if (!pagtoMap[forma]) pagtoMap[forma] = { forma, count: 0, receita: 0 };
    pagtoMap[forma].count++;
    pagtoMap[forma].receita += Number(a.preco_cobrado) || 0;
  }
  const porPagamento = Object.values(pagtoMap).sort((a, b) => b.receita - a.receita);

  // Granularity
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

  // Per-period (concluido only)
  const periodoMap: Record<string, { periodo: string; receita: number; count: number }> = {};
  for (const a of concluidos) {
    const dataBrt = String(a.data_brt ?? "").slice(0, 10);
    let key = dataBrt;
    if (granularidade === "semana") key = getWeekMonday(dataBrt);
    else if (granularidade === "mes") key = dataBrt.slice(0, 7);
    if (!periodoMap[key]) periodoMap[key] = { periodo: key, receita: 0, count: 0 };
    periodoMap[key].receita += Number(a.preco_cobrado) || 0;
    periodoMap[key].count++;
  }
  const porPeriodo = Object.values(periodoMap).sort((a, b) =>
    a.periodo.localeCompare(b.periodo)
  );

  return NextResponse.json({
    atendimentos,
    totais: {
      receita,
      count: concluidos.length,
      ticket_medio: ticketMedio,
      total_descontos: totalDescontos,
      pendentes_execucao: pendentesExecucao ?? 0,
      total_sinais: totalSinais,
      nao_compareceram: naoCompareceramRows.length,
      sinais_retidos: sinaisRetidos,
    },
    por_servico: porServico,
    por_pagamento: porPagamento,
    por_periodo: porPeriodo,
    granularidade,
  });
}
