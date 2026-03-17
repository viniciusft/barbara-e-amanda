import { NextRequest, NextResponse } from "next/server";
import { enviarEventoCAPI } from "@/lib/meta-capi";

// POST /api/analytics/meta — dispara eventos CAPI com dados do cliente
// Usado para enriquecer eventos com IP e user-agent reais
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evento, dados, url, extra } = body;

    await enviarEventoCAPI(
      {
        event_name: evento,
        event_time: 0,
        event_source_url: url,
        user_data: {
          client_ip_address:
            req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
            undefined,
          client_user_agent: req.headers.get("user-agent") ?? undefined,
        },
        ...extra,
      },
      dados
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Sempre retorna 200 — erro de analytics nunca deve afetar o usuário
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
