import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { format, addMinutes, parseISO, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

interface BusyBlock { start: Date; end: Date }

function overlaps(slotStart: Date, slotEnd: Date, busy: BusyBlock[]): boolean {
  return busy.some((b) => slotStart < b.end && slotEnd > b.start);
}

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

  // Fetch service with new fields
  const { data: servico, error: servicoError } = await supabase
    .from("servicos")
    .select("duracao_minutos, categoria, duracao_maquiagem_min, duracao_cabelo_min")
    .eq("id", servico_id)
    .eq("ativo", true)
    .single();

  if (servicoError || !servico) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  const categoria: string = servico.categoria ?? "maquiagem";
  const duracaoTotal: number = servico.duracao_minutos;
  const duracaoMaquiagemMin: number = servico.duracao_maquiagem_min ?? duracaoTotal;
  const duracaoCabeloMin: number = servico.duracao_cabelo_min ?? duracaoTotal;

  // Day of week
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

  // Fetch all non-cancelled appointments for the day
  const startOfDayUTC = fromZonedTime(`${data}T00:00:00`, TZ).toISOString();
  const endOfDayUTC = fromZonedTime(`${data}T23:59:59`, TZ).toISOString();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("data_hora, data_hora_fim, data_hora_cabelo, categoria_servico")
    .neq("status", "cancelado")
    .gte("data_hora", startOfDayUTC)
    .lte("data_hora", endOfDayUTC);

  const appts = agendamentos ?? [];

  // Build busy blocks per track
  // For maquiagem track: appointments where categoria_servico IN ('maquiagem', 'combo')
  //   - maquiagem block = data_hora → data_hora_cabelo (for combo) or data_hora_fim (for single)
  // For cabelo track: appointments where categoria_servico IN ('cabelo', 'combo')
  //   - cabelo block = data_hora_cabelo → data_hora_fim (for combo) or data_hora → data_hora_fim (for single)

  const maquiagemBusy: BusyBlock[] = [];
  const cabeloBusy: BusyBlock[] = [];

  for (const a of appts) {
    const cat = a.categoria_servico ?? "maquiagem";
    const start = new Date(a.data_hora);
    const end = new Date(a.data_hora_fim);

    if (cat === "maquiagem") {
      maquiagemBusy.push({ start, end });
    } else if (cat === "cabelo") {
      cabeloBusy.push({ start, end });
    } else if (cat === "combo") {
      // Maquiagem portion: data_hora → data_hora_cabelo
      const cabeloStart = a.data_hora_cabelo ? new Date(a.data_hora_cabelo) : end;
      maquiagemBusy.push({ start, end: cabeloStart });
      // Cabelo portion: data_hora_cabelo → data_hora_fim
      cabeloBusy.push({ start: cabeloStart, end });
    }
  }

  // Schedule window
  const horaInicioStr = (horario.hora_inicio as string).substring(0, 5);
  const horaFimStr = (horario.hora_fim as string).substring(0, 5);
  const dayStartUTC = fromZonedTime(`${data}T${horaInicioStr}:00`, TZ);
  const dayEndUTC = fromZonedTime(`${data}T${horaFimStr}:00`, TZ);

  // Cabelo schedule (may differ when modo_horario = 'separado')
  const modoHorario = horario.modo_horario ?? "ambos";
  let cabeloDayStartUTC = dayStartUTC;
  let cabeloDayEndUTC = dayEndUTC;
  if (modoHorario === "separado" && horario.hora_inicio_cabelo && horario.hora_fim_cabelo) {
    const ciStr = (horario.hora_inicio_cabelo as string).substring(0, 5);
    const cfStr = (horario.hora_fim_cabelo as string).substring(0, 5);
    cabeloDayStartUTC = fromZonedTime(`${data}T${ciStr}:00`, TZ);
    cabeloDayEndUTC = fromZonedTime(`${data}T${cfStr}:00`, TZ);
  }

  const intervalo = horario.intervalo_minutos ?? 30;
  const nowUTC = new Date();

  const slots: { hora_inicio: string; hora_fim: string; hora_inicio_cabelo?: string }[] = [];

  let current = dayStartUTC;

  while (true) {
    if (categoria === "maquiagem") {
      const slotEnd = addMinutes(current, duracaoTotal);
      if (slotEnd > dayEndUTC) break;
      if (!isBefore(current, nowUTC)) {
        if (!overlaps(current, slotEnd, maquiagemBusy)) {
          slots.push({
            hora_inicio: format(toZonedTime(current, TZ), "HH:mm"),
            hora_fim: format(toZonedTime(slotEnd, TZ), "HH:mm"),
          });
        }
      }
    } else if (categoria === "cabelo") {
      // Use cabelo schedule boundaries
      const cabeloSlotStart = current < cabeloDayStartUTC ? cabeloDayStartUTC : current;
      const cabeloSlotEnd = addMinutes(cabeloSlotStart, duracaoTotal);
      if (cabeloSlotEnd > cabeloDayEndUTC) break;
      if (!isBefore(cabeloSlotStart, nowUTC)) {
        if (!overlaps(cabeloSlotStart, cabeloSlotEnd, cabeloBusy)) {
          slots.push({
            hora_inicio: format(toZonedTime(cabeloSlotStart, TZ), "HH:mm"),
            hora_fim: format(toZonedTime(cabeloSlotEnd, TZ), "HH:mm"),
          });
        }
      }
      current = addMinutes(current, intervalo);
      continue;
    } else if (categoria === "combo") {
      // Maquiagem block: current → current + duracao_maquiagem_min
      const maqEnd = addMinutes(current, duracaoMaquiagemMin);
      // Cabelo block starts right after: maqEnd → maqEnd + duracao_cabelo_min
      const cabStart = maqEnd;
      const cabEnd = addMinutes(cabStart, duracaoCabeloMin);

      // Both blocks must fit within their respective schedules
      if (maqEnd > dayEndUTC) break;
      if (cabEnd > cabeloDayEndUTC) {
        current = addMinutes(current, intervalo);
        continue;
      }

      if (!isBefore(current, nowUTC)) {
        const maqFree = !overlaps(current, maqEnd, maquiagemBusy);
        const cabFree = !overlaps(cabStart, cabEnd, cabeloBusy);

        if (maqFree && cabFree) {
          slots.push({
            hora_inicio: format(toZonedTime(current, TZ), "HH:mm"),
            hora_fim: format(toZonedTime(cabEnd, TZ), "HH:mm"),
            hora_inicio_cabelo: format(toZonedTime(cabStart, TZ), "HH:mm"),
          });
        }
      }
    }

    current = addMinutes(current, intervalo);
  }

  return NextResponse.json(slots);
}
