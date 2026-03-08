import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { format, addMinutes, parseISO, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

// GET /api/slots?data=YYYY-MM-DD&servico_id=X
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const servico_id = searchParams.get("servico_id");

  if (!data || !servico_id) {
    return NextResponse.json(
      { error: "Parâmetros data e servico_id são obrigatórios" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  // Get service duration
  const { data: servico, error: servicoError } = await supabase
    .from("servicos")
    .select("duracao_minutos")
    .eq("id", servico_id)
    .eq("ativo", true)
    .single();

  if (servicoError || !servico) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  const duracaoMinutos: number = servico.duracao_minutos;

  // Parse date and get day of week (0=Sun)
  const dateParsed = parseISO(data);
  const diaSemana = dateParsed.getDay();

  // Get schedule for this day
  const { data: horario } = await supabase
    .from("horarios_disponiveis")
    .select("*")
    .eq("dia_semana", diaSemana)
    .eq("ativo", true)
    .single();

  if (!horario) {
    return NextResponse.json([]);
  }

  // Check if date is blocked
  const { data: bloqueios } = await supabase
    .from("bloqueios")
    .select("*")
    .lte("data_inicio", data)
    .gte("data_fim", data);

  if (bloqueios && bloqueios.length > 0) {
    return NextResponse.json([]);
  }

  // Get existing appointments for the day (using UTC range for BRT day)
  const startOfDayUTC = fromZonedTime(`${data}T00:00:00`, TZ).toISOString();
  const endOfDayUTC = fromZonedTime(`${data}T23:59:59`, TZ).toISOString();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("data_hora, data_hora_fim")
    .neq("status", "cancelado")
    .gte("data_hora", startOfDayUTC)
    .lte("data_hora", endOfDayUTC);

  // hora_inicio/hora_fim stored as "HH:MM:SS" in Postgres time type
  const horaInicioStr = (horario.hora_inicio as string).substring(0, 5);
  const horaFimStr = (horario.hora_fim as string).substring(0, 5);

  // Build day boundaries as UTC datetimes (treating schedule times as BRT)
  const dayStartUTC = fromZonedTime(`${data}T${horaInicioStr}:00`, TZ);
  const dayEndUTC = fromZonedTime(`${data}T${horaFimStr}:00`, TZ);

  const nowUTC = new Date();

  const slots: { hora_inicio: string; hora_fim: string }[] = [];

  let current = dayStartUTC;
  while (true) {
    const slotEnd = addMinutes(current, duracaoMinutos);
    if (slotEnd > dayEndUTC) break;

    // Skip slots in the past
    if (isBefore(current, nowUTC)) {
      current = addMinutes(current, 30);
      continue;
    }

    // Display time in BRT
    const horaInicioBRT = format(toZonedTime(current, TZ), "HH:mm");
    const horaFimBRT = format(toZonedTime(slotEnd, TZ), "HH:mm");

    // Check overlap with existing appointments
    const hasConflict = (agendamentos || []).some((a) => {
      const aStart = new Date(a.data_hora);
      const aEnd = new Date(a.data_hora_fim);
      return current < aEnd && slotEnd > aStart;
    });

    if (!hasConflict) {
      slots.push({ hora_inicio: horaInicioBRT, hora_fim: horaFimBRT });
    }

    current = addMinutes(current, 30);
  }

  return NextResponse.json(slots);
}
