import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dataInicio = searchParams.get("data_inicio");
  const dataFim = searchParams.get("data_fim");
  const servicoId = searchParams.get("servico_id");
  const formaPagamento = searchParams.get("forma_pagamento");

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("agendamentos")
    .select("*, servico:servicos(*)")
    .eq("status", "concluido")
    .order("data_hora", { ascending: false });

  if (dataInicio) {
    // Filter from start of day in BRT (UTC-3)
    query = query.gte("data_hora", new Date(dataInicio + "T03:00:00Z").toISOString());
  }
  if (dataFim) {
    // Filter to end of day in BRT
    query = query.lte("data_hora", new Date(dataFim + "T26:59:59Z").toISOString());
  }
  if (servicoId) {
    query = query.eq("servico_id", servicoId);
  }
  if (formaPagamento) {
    query = query.eq("forma_pagamento", formaPagamento);
  }

  const { data: atendimentos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate totals
  const receita = atendimentos.reduce((sum, a) => {
    return sum + (a.preco_cobrado ?? a.servico?.preco ?? 0);
  }, 0);

  const ticketMedio = atendimentos.length > 0 ? receita / atendimentos.length : 0;

  // Per-service summary
  const servicoMap: Record<string, { nome: string; count: number; receita: number }> = {};
  for (const a of atendimentos) {
    const nome = a.servico?.nome ?? a.servico_nome;
    const sid = a.servico_id ?? a.servico_nome;
    if (!servicoMap[sid]) {
      servicoMap[sid] = { nome, count: 0, receita: 0 };
    }
    servicoMap[sid].count++;
    servicoMap[sid].receita += a.preco_cobrado ?? a.servico?.preco ?? 0;
  }
  const porServico = Object.values(servicoMap).sort((a, b) => b.receita - a.receita);

  // Pending execution count (confirmado + past)
  const now = new Date().toISOString();
  const { count: pendentesExecucao } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmado")
    .lt("data_hora_fim", now);

  // Daily revenue for chart (last 30 days by default)
  const receitaDiaria: Record<string, number> = {};
  for (const a of atendimentos) {
    // Convert data_hora to BRT date
    const dt = new Date(a.data_hora);
    const brtDate = new Date(dt.getTime() - 3 * 60 * 60 * 1000);
    const day = brtDate.toISOString().slice(0, 10);
    receitaDiaria[day] = (receitaDiaria[day] ?? 0) + (a.preco_cobrado ?? a.servico?.preco ?? 0);
  }
  const grafico = Object.entries(receitaDiaria)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, valor]) => ({ data, valor }));

  return NextResponse.json({
    atendimentos,
    totais: {
      receita,
      count: atendimentos.length,
      ticketMedio,
      pendentesExecucao: pendentesExecucao ?? 0,
    },
    porServico,
    grafico,
  });
}
