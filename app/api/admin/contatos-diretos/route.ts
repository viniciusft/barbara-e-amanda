import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const etapa = searchParams.get("etapa");
  const search = searchParams.get("search")?.trim() ?? "";

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("contatos_diretos")
    .select("*")
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo);
  if (etapa) query = query.eq("etapa_funil", etapa);
  if (search) query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
