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

  let query = supabase
    .from("notificacoes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo);

  if (countOnly) {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("lida", false);
    if (error) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: count ?? 0 });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const naoLidas = (data ?? []).filter((n) => !n.lida).length;

  return NextResponse.json({ notificacoes: data ?? [], nao_lidas: naoLidas });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { action } = await req.json();

  if (action !== "mark_all_read") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("lida", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
