import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabase as publicSupabase } from "@/lib/supabase";

// GET /api/servicos — public (active only) or admin (all)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Admin gets all services including inactive
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .order("ordem", { ascending: true })
      .order("nome");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Public: only active services
  const { data, error } = await publicSupabase
    .from("servicos")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("nome");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/servicos — admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { nome, descricao, duracao_minutos, preco } = body;

  if (!nome || !duracao_minutos || preco === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("servicos")
    .insert({ nome, descricao: descricao || null, duracao_minutos, preco, ativo: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
