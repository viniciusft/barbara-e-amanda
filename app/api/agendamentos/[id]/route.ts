import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { metaEvents } from "@/lib/meta-capi";

const TZ = "America/Sao_Paulo";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*, servico:servicos(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const maqStartBRT = toZonedTime(new Date(data.data_hora), TZ);
  const endBRT = toZonedTime(new Date(data.data_hora_fim), TZ);
  let displayStart = maqStartBRT;
  if (data.data_hora_cabelo && new Date(data.data_hora_cabelo) < new Date(data.data_hora)) {
    displayStart = toZonedTime(new Date(data.data_hora_cabelo), TZ);
  }
  const extra: Record<string, string> = {
    data: format(displayStart, "yyyy-MM-dd"),
    hora_inicio: format(displayStart, "HH:mm"),
    hora_fim: format(endBRT, "HH:mm"),
  };
  if (data.data_hora_cabelo) {
    extra.hora_inicio_cabelo = format(toZonedTime(new Date(data.data_hora_cabelo), TZ), "HH:mm");
    extra.hora_inicio_maquiagem = format(maqStartBRT, "HH:mm");
  }
  return NextResponse.json({ ...data, ...extra });
}

const STATUS_EMOJI: Record<string, string> = {
  solicitacao: "⏳",
  aguardando_sinal: "💳",
  confirmado: "✅",
  concluido: "✓",
  nao_compareceu: "✗",
  cancelado: "✗",
};

const VALID_STATUSES = [
  "solicitacao",
  "aguardando_sinal",
  "confirmado",
  "cancelado",
  "concluido",
  "nao_compareceu",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { status, ...rest } = body;

  const updatePayload: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    updatePayload.status = status;
  }

  const allowedFields = [
    // Execution fields
    "servico_executado",
    "preco_cobrado",
    "preco_original",
    "tipo_ajuste_preco",
    "motivo_ajuste",
    "forma_pagamento",
    "observacoes_execucao",
    "executado_em",
    // Sinal / payment fields
    "sinal_percentual",
    "sinal_valor",
    "sinal_status",
    "sinal_pago_em",
    "sinal_forma_pagamento",
    "valor_restante",
    "whatsapp_enviado_em",
    "sinal_reembolsado_em",
    "sinal_reembolso_obs",
    // Confirmation fields
    "confirmacao_enviada_em",
    // Avaliacao fields
    "avaliacao_enviada_em",
  ];

  for (const field of allowedFields) {
    if (field in rest) {
      updatePayload[field] = rest[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  // Handle calendar updates when status changes
  if (status !== undefined && status !== agendamento.status) {
    const novoEmoji = STATUS_EMOJI[status] ?? "⏳";
    const categoria = agendamento.categoria_servico ?? "maquiagem";

    if (status === "cancelado" || status === "nao_compareceu") {
      // Delete calendar events on terminal negative statuses
      if (agendamento.gcal_event_id) {
        try { await deleteCalendarEvent(agendamento.gcal_event_id); } catch { /* non-fatal */ }
      }
      if (agendamento.gcal_event_id_cabelo) {
        try { await deleteCalendarEvent(agendamento.gcal_event_id_cabelo); } catch { /* non-fatal */ }
      }
    } else {
      // Update title on calendar events
      if (agendamento.gcal_event_id) {
        try {
          const icon = categoria === "combo" ? "💄" : categoria === "cabelo" ? "💇" : "💄";
          const partLabel = categoria === "combo" ? ` Maquiagem — ${agendamento.servico_nome}` : ` ${agendamento.servico_nome}`;
          await updateCalendarEvent(agendamento.gcal_event_id, {
            summary: `${novoEmoji} ${icon}${partLabel} — ${agendamento.nome_cliente}`,
          });
        } catch { /* non-fatal */ }
      }
      if (agendamento.gcal_event_id_cabelo) {
        try {
          await updateCalendarEvent(agendamento.gcal_event_id_cabelo, {
            summary: `${novoEmoji} 💇 Cabelo — ${agendamento.servico_nome} — ${agendamento.nome_cliente}`,
          });
        } catch { /* non-fatal */ }
      }
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("agendamentos")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Facebook CAPI: Purchase event quando serviço é marcado como executado
  if (rest.servico_executado === true && !agendamento.servico_executado) {
    const preco = rest.preco_cobrado ?? agendamento.preco_cobrado ?? agendamento.servico_preco ?? 0;
    metaEvents.servicoExecutado(
      agendamento.servico_nome,
      preco,
      {
        email: agendamento.email,
        telefone: agendamento.telefone,
        nome: agendamento.nome_cliente,
      },
      {
        fbp: agendamento.meta_fbp ?? undefined,
        fbc: agendamento.meta_fbc ?? undefined,
        client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? undefined,
        client_user_agent: req.headers.get("user-agent") ?? undefined,
      }
    ).catch(() => { /* non-fatal */ });
  }

  return NextResponse.json(updated);
}
