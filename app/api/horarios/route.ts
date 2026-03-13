import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabase as publicSupabase } from "@/lib/supabase";

// GET /api/horarios — public
export async function GET() {
  const { data, error } = await publicSupabase
    .from("horarios_disponiveis")
    .select("*")
    .order("dia_semana");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/horarios — admin only
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body: Record<string, unknown>[] = await req.json();
  const supabase = createServerSupabaseClient();

  // Split into new rows (no id) and existing rows (have id)
  const toInsert = body.filter((h) => !h.id);
  const toUpdate = body.filter((h) => !!h.id);

  const results: unknown[] = [];

  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("horarios_disponiveis")
      .insert(toInsert)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    results.push(...(data ?? []));
  }

  if (toUpdate.length > 0) {
    const { data, error } = await supabase
      .from("horarios_disponiveis")
      .upsert(toUpdate, { onConflict: "id" })
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    results.push(...(data ?? []));
  }

  return NextResponse.json(results);
}
