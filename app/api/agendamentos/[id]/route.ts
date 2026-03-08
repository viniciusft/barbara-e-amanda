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
  const { status } = body;

  if (!["confirmado", "cancelado", "pendente"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
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
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
