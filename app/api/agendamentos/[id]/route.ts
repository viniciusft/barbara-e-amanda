import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deleteCalendarEvent } from "@/lib/google-calendar";

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

  // Build update payload
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

  // Fetch current appointment
  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  // If cancelling, delete from Google Calendar
  if (status === "cancelado" && agendamento.gcal_event_id) {
    try {
      await deleteCalendarEvent(agendamento.gcal_event_id);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
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
