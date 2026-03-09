import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST — sync lead etapa from an agendamento action
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { agendamento_id, etapa, obs } = body;

  if (!agendamento_id || !etapa) {
    return NextResponse.json({ error: "agendamento_id e etapa são obrigatórios" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Find existing lead
  const { data: existing } = await supabase
    .from("leads")
    .select("id, historico, etapa")
    .eq("agendamento_id", agendamento_id)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    // Skip if already at this etapa
    if (existing.etapa === etapa) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Append to historico
    const historico = Array.isArray(existing.historico) ? existing.historico : [];
    historico.push({ etapa, em: now, ...(obs ? { obs } : {}) });

    const { error } = await supabase
      .from("leads")
      .update({ etapa, historico, updated_at: now })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } else {
    // Lead doesn't exist — fetch agendamento data to create it
    const { data: agendamento } = await supabase
      .from("agendamentos")
      .select("nome_cliente, telefone, email, servico_id, servico_nome")
      .eq("id", agendamento_id)
      .maybeSingle();

    if (!agendamento) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const historico = [{ etapa, em: now, ...(obs ? { obs } : {}) }];

    const { error } = await supabase.from("leads").insert({
      agendamento_id,
      nome: agendamento.nome_cliente,
      telefone: agendamento.telefone,
      email: agendamento.email,
      servico_id: agendamento.servico_id,
      servico_nome: agendamento.servico_nome,
      etapa,
      historico,
      origem: "agendamento",
      created_at: now,
      updated_at: now,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, created: true });
  }
}
