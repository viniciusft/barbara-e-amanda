import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const supabase = createServerSupabaseClient();

  // 1. Fetch clients (with optional search filter)
  let clienteQuery = supabase.from("clientes").select("*");
  if (q) {
    clienteQuery = clienteQuery.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`);
  }
  const { data: clientes, error } = await clienteQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clientes || clientes.length === 0) return NextResponse.json([]);

  // 2. Fetch agendamentos stats aggregated by cliente_id
  const clienteIds = clientes.map((c) => c.id);
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("cliente_id, status, preco_cobrado, servico_executado, nome_cliente, data_hora")
    .in("cliente_id", clienteIds);

  // 3. Aggregate in-process
  interface Stats {
    total_concluidos: number;
    total_gasto_real: number;
    total_todos: number;
    nomes_usados: Set<string>;
    ultima_data: string | null;
  }
  const statsMap = new Map<string, Stats>();

  for (const a of agendamentos ?? []) {
    if (!a.cliente_id) continue;
    if (!statsMap.has(a.cliente_id)) {
      statsMap.set(a.cliente_id, {
        total_concluidos: 0,
        total_gasto_real: 0,
        total_todos: 0,
        nomes_usados: new Set(),
        ultima_data: null,
      });
    }
    const s = statsMap.get(a.cliente_id)!;
    s.total_todos++;
    if (a.status === "concluido" && a.servico_executado) {
      s.total_concluidos++;
      s.total_gasto_real += Number(a.preco_cobrado) || 0;
    }
    if (a.nome_cliente) s.nomes_usados.add(a.nome_cliente);
    if (!s.ultima_data || new Date(a.data_hora) > new Date(s.ultima_data)) {
      s.ultima_data = a.data_hora;
    }
  }

  // 4. Merge and sort by most recent
  const result = clientes
    .map((c) => {
      const s = statsMap.get(c.id);
      return {
        ...c,
        total_concluidos: s?.total_concluidos ?? 0,
        total_gasto_real: s?.total_gasto_real ?? 0,
        total_todos_agendamentos: s?.total_todos ?? 0,
        nomes_usados: s ? Array.from(s.nomes_usados) : [],
        ultima_data_hora: s?.ultima_data ?? null,
      };
    })
    .sort((a, b) => {
      if (!a.ultima_data_hora && !b.ultima_data_hora) return 0;
      if (!a.ultima_data_hora) return 1;
      if (!b.ultima_data_hora) return -1;
      return new Date(b.ultima_data_hora).getTime() - new Date(a.ultima_data_hora).getTime();
    });

  return NextResponse.json(result);
}
