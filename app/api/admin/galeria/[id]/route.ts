import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// PATCH /api/admin/galeria/[id] — { titulo?, ativo? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.titulo !== undefined) updates.titulo = body.titulo || null;
  if (body.ativo !== undefined) updates.ativo = body.ativo;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("galeria")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ foto: data });
}

// DELETE /api/admin/galeria/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // Fetch item to get storage URL
  const { data: foto } = await supabase
    .from("galeria")
    .select("imagem_url")
    .eq("id", params.id)
    .single();

  if (foto?.imagem_url) {
    // Extract storage path from public URL
    const marker = "/storage/v1/object/public/studio-images/";
    const idx = foto.imagem_url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = foto.imagem_url.slice(idx + marker.length);
      // Best-effort delete from storage (ignore errors)
      await supabase.storage.from("studio-images").remove([storagePath]);
    }
  }

  const { error } = await supabase.from("galeria").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
