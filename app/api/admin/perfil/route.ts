import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("admin_config")
      .select("nome_studio, bio, instagram, whatsapp, endereco, foto_url")
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
  const { nome_studio, bio, instagram, whatsapp, endereco, foto_url } = body;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("admin_config")
    .select("id")
    .limit(1)
    .single();

  const updates = {
    nome_studio: nome_studio ?? null,
    bio: bio ?? null,
    instagram: instagram ?? null,
    whatsapp: whatsapp ?? null,
    endereco: endereco ?? null,
    foto_url: foto_url ?? null,
    updated_at: new Date().toISOString(),
  };

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

  return NextResponse.json(result.data);
}
