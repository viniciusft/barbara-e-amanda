import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";

const STATUS_EMOJI: Record<string, string> = {
  pendente: "⏳",
  confirmado: "✅",
  concluido: "✓",
  cancelado: "✗",
};

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
  const { status, ...executionFields } = body;

  const updatePayload: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!["confirmado", "cancelado", "pendente", "concluido"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    updatePayload.status = status;
  }

  const allowedExecutionFields = [
    "servico_executado",
    "preco_cobrado",
    "preco_original",
    "tipo_ajuste_preco",
    "motivo_ajuste",
    "forma_pagamento",
    "observacoes_execucao",
    "executado_em",
  ];
  for (const field of allowedExecutionFields) {
    if (field in executionFields) {
      updatePayload[field] = executionFields[field];
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

    if (status === "cancelado") {
      // Delete calendar events
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

  return NextResponse.json(updated);
}
