import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Mapeamento pagina → rota pública para revalidação
const ROTAS: Record<string, string> = {
  home: "/",
  "maquiagem-social": "/servicos/maquiagem-social",
  "maquiagem-noiva": "/servicos/maquiagem-noiva",
  penteado: "/servicos/penteado",
  babyliss: "/servicos/babyliss",
  "maquiagem-e-penteado": "/servicos/maquiagem-e-penteado",
  casamento: "/ocasioes/casamento",
  formatura: "/ocasioes/formatura",
  eventos: "/ocasioes/eventos",
};

// GET /api/admin/conteudo-paginas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("conteudo_paginas")
    .select("pagina, titulo, subtitulo, descricao_curta, updated_at")
    .order("pagina");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paginas: data ?? [] });
}

// PATCH /api/admin/conteudo-paginas
// Body: { pagina, titulo, subtitulo, descricao_curta }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { pagina, titulo, subtitulo, descricao_curta } = body;

  if (!pagina) return NextResponse.json({ error: "pagina obrigatória" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("conteudo_paginas")
    .upsert(
      { pagina, titulo, subtitulo, descricao_curta, updated_at: new Date().toISOString() },
      { onConflict: "pagina" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revalidate the corresponding public page
  const rota = ROTAS[pagina];
  if (rota) revalidatePath(rota);

  return NextResponse.json({ pagina: data });
}
