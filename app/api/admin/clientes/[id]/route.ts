import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { id } = params;

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (clienteError || !cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  // Fetch ALL agendamentos linked by cliente_id (authoritative join)
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, data_hora, servico_nome, preco_cobrado, preco_original, status, sinal_valor, sinal_status, forma_pagamento, servico_executado, nome_cliente")
    .eq("cliente_id", id)
    .order("data_hora", { ascending: false });

  // Collect all names used by this client across bookings
  const nomesUsados = Array.from(
    new Set(
      (agendamentos ?? [])
        .map((a) => a.nome_cliente)
        .filter((n): n is string => !!n && n !== cliente.nome)
    )
  );

  // Compute real totals
  const totalGastoReal = (agendamentos ?? [])
    .filter((a) => a.status === "concluido" && a.servico_executado)
    .reduce((s, a) => s + (Number(a.preco_cobrado) || 0), 0);

  const totalConcluidos = (agendamentos ?? []).filter(
    (a) => a.status === "concluido" && a.servico_executado
  ).length;

  // Compute BRT display date for each agendamento
  const history = (agendamentos ?? []).map((a) => {
    const dataBRT = a.data_hora
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(a.data_hora))
      : null;
    const horaBRT = a.data_hora
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(a.data_hora))
      : null;
    return { ...a, data_brt: dataBRT, hora_brt: horaBRT };
  });

  return NextResponse.json({
    cliente,
    agendamentos: history,
    nomes_usados: nomesUsados,
    total_gasto_real: totalGastoReal,
    total_concluidos: totalConcluidos,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const body = await req.json();

  const allowed = ["nome", "observacoes"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] ?? null;
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
