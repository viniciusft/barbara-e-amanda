import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const TIPO_NOTIF = {
  casamento: { tipo: "contato_casamento", titulo: "Novo contato de casamento", descricao: "Alguém clicou no botão de casamento no site. Verifique o WhatsApp." },
  destination_beauty: { tipo: "contato_destination", titulo: "Novo contato Destination Beauty", descricao: "Alguém clicou no botão de Destination Beauty no site. Verifique o WhatsApp." },
  duvida: { tipo: "contato_duvida", titulo: "Nova dúvida de cliente", descricao: "Alguém clicou em 'Falar com equipe' no site. Verifique o WhatsApp." },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { tipo } = await req.json();

    if (!["casamento", "destination_beauty", "duvida"].includes(tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: contato } = await supabase
      .from("contatos_diretos")
      .insert({ tipo, etapa_funil: "novo", nome: "", telefone: "" })
      .select("id")
      .single();

    const notif = TIPO_NOTIF[tipo as keyof typeof TIPO_NOTIF];
    await supabase.from("notificacoes").insert({
      tipo: notif.tipo,
      titulo: notif.titulo,
      descricao: notif.descricao,
      lead_id: contato?.id ?? null,
      lida: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fail silently — non-critical
  }
}
