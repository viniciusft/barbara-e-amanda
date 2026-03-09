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
  const search = searchParams.get("search") ?? "";
  const etapas = searchParams.getAll("etapa");
  const servico_id = searchParams.get("servico_id");
  const data_inicio = searchParams.get("data_inicio");
  const data_fim = searchParams.get("data_fim");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`);
  }
  if (etapas.length > 0) {
    query = query.in("etapa", etapas);
  }
  if (servico_id) {
    query = query.eq("servico_id", servico_id);
  }
  if (data_inicio) {
    query = query.gte("created_at", `${data_inicio}T00:00:00`);
  }
  if (data_fim) {
    query = query.lte("created_at", `${data_fim}T23:59:59`);
  }

  const { data: leads, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads ?? [], total: count ?? 0 });
}
