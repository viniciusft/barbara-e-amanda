import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("admin_config")
      .select(
        "nome_studio, bio, instagram, whatsapp, endereco, foto_url, foto_header_url, foto_header_mobile_url, chave_pix, tipo_chave_pix, nome_recebedor_pix, nome_secretaria, mensagem_whatsapp_template, mensagem_confirmacao_template, google_meu_negocio_url, mensagem_avaliacao_template, tema, titulo_casamento, descricao_casamento, mensagem_casamento, titulo_destination_beauty, descricao_destination_beauty, mensagem_destination_beauty, mensagem_horario_personalizado"
      )
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    nome_studio,
    bio,
    instagram,
    whatsapp,
    endereco,
    foto_url,
    foto_header_url,
    foto_header_mobile_url,
    chave_pix,
    tipo_chave_pix,
    nome_recebedor_pix,
    nome_secretaria,
    mensagem_whatsapp_template,
    mensagem_confirmacao_template,
    google_meu_negocio_url,
    mensagem_avaliacao_template,
    tema,
    titulo_casamento,
    descricao_casamento,
    mensagem_casamento,
    titulo_destination_beauty,
    descricao_destination_beauty,
    mensagem_destination_beauty,
    mensagem_horario_personalizado,
  } = body;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("admin_config")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const updates: Record<string, unknown> = {
    nome_studio: nome_studio ?? null,
    bio: bio ?? null,
    instagram: instagram ?? null,
    whatsapp: whatsapp ?? null,
    endereco: endereco ?? null,
    foto_url: foto_url ?? null,
    foto_header_url: foto_header_url ?? null,
    foto_header_mobile_url: foto_header_mobile_url ?? null,
    chave_pix: chave_pix ?? null,
    tipo_chave_pix: tipo_chave_pix ?? null,
    nome_recebedor_pix: nome_recebedor_pix ?? null,
    nome_secretaria: nome_secretaria ?? null,
    mensagem_whatsapp_template: mensagem_whatsapp_template ?? null,
    mensagem_confirmacao_template: mensagem_confirmacao_template ?? null,
    google_meu_negocio_url: google_meu_negocio_url ?? null,
    mensagem_avaliacao_template: mensagem_avaliacao_template ?? null,
    tema: tema ?? "dark",
    updated_at: new Date().toISOString(),
  };

  // Only update special service fields if explicitly provided
  if (titulo_casamento !== undefined) updates.titulo_casamento = titulo_casamento ?? null;
  if (descricao_casamento !== undefined) updates.descricao_casamento = descricao_casamento ?? null;
  if (mensagem_casamento !== undefined) updates.mensagem_casamento = mensagem_casamento ?? null;
  if (titulo_destination_beauty !== undefined) updates.titulo_destination_beauty = titulo_destination_beauty ?? null;
  if (descricao_destination_beauty !== undefined) updates.descricao_destination_beauty = descricao_destination_beauty ?? null;
  if (mensagem_destination_beauty !== undefined) updates.mensagem_destination_beauty = mensagem_destination_beauty ?? null;
  if (mensagem_horario_personalizado !== undefined) updates.mensagem_horario_personalizado = mensagem_horario_personalizado ?? null;

  let result;
  if (existing) {
    result = await supabase
      .from("admin_config")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("admin_config")
      .insert(updates)
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin/perfil");
  revalidatePath("/admin");

  return NextResponse.json(result.data);
}
