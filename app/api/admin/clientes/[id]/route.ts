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

  // Fetch agendamentos by client phone
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, data_hora, servico_nome, preco_cobrado, preco_original, status, sinal_valor, sinal_status, forma_pagamento, servico_executado, servico_id, servicos(nome)")
    .eq("telefone", cliente.telefone)
    .order("data_hora", { ascending: false });

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

  return NextResponse.json({ cliente, agendamentos: history });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { observacoes } = await req.json();

  const { data, error } = await supabase
    .from("clientes")
    .update({ observacoes: observacoes ?? null, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
