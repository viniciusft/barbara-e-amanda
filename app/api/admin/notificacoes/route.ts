import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const countOnly = searchParams.get("count") === "1";

  const supabase = createServerSupabaseClient();

  if (countOnly) {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("lida", false);
    if (error) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: count ?? 0 });
  }

  // Always fetch all — client filters locally for pill counters
  let query = supabase
    .from("notificacoes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const naoLidas = (data ?? []).filter((n) => !n.lida).length;

  return NextResponse.json({ notificacoes: data ?? [], nao_lidas: naoLidas });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const supabase = createServerSupabaseClient();

  // Create a notification
  if (body.tipo) {
    const { tipo, titulo, descricao, agendamento_id } = body;
    const { data, error } = await supabase
      .from("notificacoes")
      .insert({
        tipo,
        titulo,
        descricao,
        agendamento_id: agendamento_id ?? null,
        lida: false,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Mark all as read
  if (body.action === "mark_all_read") {
    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq("lida", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

// Resolve (mark as read) notifications by tipo + agendamento_id
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { tipo, agendamento_id } = await req.json();
  if (!tipo || !agendamento_id) {
    return NextResponse.json({ error: "tipo e agendamento_id são obrigatórios" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("tipo", tipo)
    .eq("agendamento_id", agendamento_id)
    .eq("lida", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
