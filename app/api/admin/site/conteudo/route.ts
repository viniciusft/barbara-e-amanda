import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/admin/site/conteudo?pagina=maquiagem-social
// Returns { conteudo, fotos }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pagina = req.nextUrl.searchParams.get("pagina") ?? "maquiagem-social";
  const db = createServerSupabaseClient();

  const [conteudoRes, fotosRes, servicoRes] = await Promise.allSettled([
    db.from("conteudo_paginas").select("*").eq("pagina", pagina).single(),
    db
      .from("galeria")
      .select("id, titulo, imagem_url, tipo_exibicao, ativo, ordem")
      .eq("pagina", pagina)
      .order("ordem", { ascending: true }),
    db
      .from("servicos")
      .select("id, nome, preco, duracao_minutos")
      .ilike("nome", "%social%")
      .eq("categoria", "maquiagem")
      .limit(1)
      .single(),
  ]);

  const conteudo = conteudoRes.status === "fulfilled" ? conteudoRes.value.data : null;
  const fotos = fotosRes.status === "fulfilled" ? (fotosRes.value.data ?? []) : [];
  const servico = servicoRes.status === "fulfilled" ? servicoRes.value.data : null;

  return NextResponse.json({ conteudo, fotos, servico });
}

// PATCH /api/admin/site/conteudo
// Body: { pagina, ...fields } — saves any subset of conteudo_paginas fields
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { pagina = "maquiagem-social", ...fields } = body;

  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("conteudo_paginas")
    .upsert(
      { pagina, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "pagina" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conteudo: data });
}
