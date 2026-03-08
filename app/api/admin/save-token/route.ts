import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { refresh_token, access_token, token_expiry } = body;

  if (!refresh_token) {
    return NextResponse.json({ error: "refresh_token obrigatório" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Get existing row
  const { data: existing } = await supabase
    .from("admin_config")
    .select("id")
    .limit(1)
    .single();

  const updates: Record<string, string | null> = {
    google_refresh_token: refresh_token,
    updated_at: new Date().toISOString(),
  };

  if (access_token) {
    updates.google_access_token = access_token;
  }

  if (token_expiry) {
    updates.google_token_expiry = token_expiry;
  }

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("admin_config")
      .update(updates)
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase.from("admin_config").insert(updates));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
