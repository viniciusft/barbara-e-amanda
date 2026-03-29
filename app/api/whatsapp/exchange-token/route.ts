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
  const { code, wabaId, phoneNumberId } = body as {
    code: string;
    wabaId?: string;
    phoneNumberId?: string;
  };

  if (!code) {
    return NextResponse.json({ error: "code obrigatório" }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_WHATSAPP_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_WHATSAPP_APP_ID e WHATSAPP_APP_SECRET não configurados" },
      { status: 500 }
    );
  }

  // Trocar o code pelo access token
  const params = new URLSearchParams({ client_id: appId, client_secret: appSecret, code });
  const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?${params.toString()}`;

  let tokenRes: Response;
  try {
    tokenRes = await fetch(tokenUrl, { cache: "no-store" });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error("[WhatsApp] Erro de rede ao chamar Graph API:", msg);
    return NextResponse.json(
      { error: "Erro de rede ao contatar a Meta", details: msg },
      { status: 502 }
    );
  }

  const rawBody = await tokenRes.text();
  console.log(`[WhatsApp] Graph API status: ${tokenRes.status}`);
  console.log("[WhatsApp] Graph API body:", rawBody);

  let tokenData: { access_token?: string; token_type?: string; error?: unknown };
  try {
    tokenData = JSON.parse(rawBody);
  } catch {
    console.error("[WhatsApp] Resposta não é JSON:", rawBody);
    return NextResponse.json(
      { error: "Resposta inesperada da Meta (não é JSON)", raw: rawBody },
      { status: 502 }
    );
  }

  // DEBUG TEMPORÁRIO — sempre retorna 200 com resposta bruta da Meta
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("[WhatsApp] Falha ao trocar token:", tokenData);
    return NextResponse.json(
      { debug: true, http_status: tokenRes.status, meta_response: tokenData },
      { status: 200 }
    );
  }

  // Salvar WABA ID e Phone Number ID no banco
  if (wabaId || phoneNumberId) {
    const supabase = createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("admin_config")
      .select("id")
      .limit(1)
      .single();

    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (wabaId) updates.whatsapp_waba_id = wabaId;
    if (phoneNumberId) updates.whatsapp_phone_number_id = phoneNumberId;

    const op = existing
      ? supabase.from("admin_config").update(updates).eq("id", existing.id)
      : supabase.from("admin_config").insert(updates);

    const { error: dbError } = await op;
    if (dbError) {
      console.error("[WhatsApp] Erro ao salvar no banco:", dbError.message);
    }
  }

  return NextResponse.json({
    success: true,
    access_token: tokenData.access_token,
    token_type: tokenData.token_type,
    waba_id: wabaId ?? null,
    phone_number_id: phoneNumberId ?? null,
  });
}
