import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabase as publicSupabase } from "@/lib/supabase";

// GET /api/bloqueios — public (needed for slot calculation)
export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await publicSupabase
    .from("bloqueios")
    .select("*")
    .gte("data_fim", today)
    .order("data_inicio");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/bloqueios — admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { data_inicio, data_fim, motivo } = body;

  if (!data_inicio || !data_fim) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bloqueios")
    .insert({ data_inicio, data_fim, motivo: motivo || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
