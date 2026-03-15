import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// PATCH /api/admin/galeria/reorder
// Body: { items: [{ id: string, ordem: number }] }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const items: { id: string; ordem: number }[] = body.items;

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "items inválidos" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const updates = items.map(({ id, ordem }) =>
    supabase.from("galeria").update({ ordem }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error)
    return NextResponse.json({ error: failed.error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
