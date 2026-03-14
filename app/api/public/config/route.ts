import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("admin_config")
      .select("nome_studio, whatsapp, instagram, endereco, google_meu_negocio_url")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({}, { status: 500 });
    }

    return NextResponse.json(data ?? {});
  } catch {
    return NextResponse.json({});
  }
}
