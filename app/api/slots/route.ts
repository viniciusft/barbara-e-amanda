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

  // Fetch service with category and durations
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
  // For combos these must be set; fall back to half/half if null (should not happen with correct data)
  const duracaoMaquiagemMin: number = servico.duracao_maquiagem_min ?? Math.ceil(duracaoTotal / 2);
  const duracaoCabeloMin: number = servico.duracao_cabelo_min ?? Math.floor(duracaoTotal / 2);

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

  // Fetch all non-cancelled appointments for the day, with service durations via join
  const startOfDayUTC = fromZonedTime(`${data}T00:00:00`, TZ).toISOString();
  const endOfDayUTC = fromZonedTime(`${data}T23:59:59`, TZ).toISOString();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(`
      data_hora,
      data_hora_fim,
      data_hora_cabelo,
      categoria_servico,
      servico:servicos(duracao_maquiagem_min, duracao_cabelo_min, duracao_minutos)
    `)
    .neq("status", "cancelado")
    .gte("data_hora", startOfDayUTC)
    .lte("data_hora", endOfDayUTC);

  const appts = agendamentos ?? [];

  // Build busy blocks per professional track using explicit service durations.
  // Maquiagem track: blocked from data_hora → data_hora + duracao_maquiagem_min
  // Cabelo track: blocked from data_hora_cabelo → data_hora_cabelo + duracao_cabelo_min
  // This works for BOTH Ordem A and Ordem B without relying on timestamp relationships.
  const maquiagemBusy: BusyBlock[] = [];
  const cabeloBusy: BusyBlock[] = [];

  for (const a of appts) {
    const cat = a.categoria_servico ?? "maquiagem";
    const maqStart = new Date(a.data_hora);
    const overallEnd = new Date(a.data_hora_fim);

    if (cat === "maquiagem") {
      maquiagemBusy.push({ start: maqStart, end: overallEnd });
    } else if (cat === "cabelo") {
      cabeloBusy.push({ start: maqStart, end: overallEnd });
    } else if (cat === "combo") {
      // Use service's stored durations for precise block computation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = a.servico as any;
      const maqDur: number = svc?.duracao_maquiagem_min ?? null;
      const cabDur: number = svc?.duracao_cabelo_min ?? null;

      // Maquiagem block: always starts at data_hora
      const maqEnd = maqDur ? addMinutes(maqStart, maqDur) : overallEnd;
      maquiagemBusy.push({ start: maqStart, end: maqEnd });

      // Cabelo block: starts at data_hora_cabelo (always the explicit cabelo start)
      if (a.data_hora_cabelo) {
        const cabStart = new Date(a.data_hora_cabelo);
        const cabEnd = cabDur ? addMinutes(cabStart, cabDur) : overallEnd;
        cabeloBusy.push({ start: cabStart, end: cabEnd });
      }
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

  type SlotResult = {
    hora_inicio: string;
    hora_fim: string;
    combo_ordem?: "maquiagem_primeiro" | "cabelo_primeiro";
    hora_maquiagem?: string;
    hora_cabelo?: string;
  };

  const slots: SlotResult[] = [];

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
      // Break when even the shorter first block can't fit in either schedule
      const shortDur = Math.min(duracaoMaquiagemMin, duracaoCabeloMin);
      if (
        addMinutes(current, shortDur) > dayEndUTC &&
        addMinutes(current, shortDur) > cabeloDayEndUTC
      ) {
        break;
      }

      if (!isBefore(current, nowUTC)) {
        const totalEnd = addMinutes(current, duracaoMaquiagemMin + duracaoCabeloMin);

        // --- Ordem A: maquiagem first [current → current+maqDur], cabelo after [current+maqDur → current+total] ---
        const maqEndA = addMinutes(current, duracaoMaquiagemMin);
        const cabStartA = maqEndA;
        const cabEndA = addMinutes(cabStartA, duracaoCabeloMin);
        const ordenA =
          maqEndA <= dayEndUTC &&                     // maquiagem fits in maquiagem schedule
          cabStartA >= cabeloDayStartUTC &&            // cabelo block starts within cabelo schedule
          cabEndA <= cabeloDayEndUTC &&               // cabelo fits in cabelo schedule
          !overlaps(current, maqEndA, maquiagemBusy) &&
          !overlaps(cabStartA, cabEndA, cabeloBusy);

        if (ordenA) {
          slots.push({
            hora_inicio: format(toZonedTime(current, TZ), "HH:mm"),
            hora_fim: format(toZonedTime(totalEnd, TZ), "HH:mm"),
            combo_ordem: "maquiagem_primeiro",
            hora_maquiagem: format(toZonedTime(current, TZ), "HH:mm"),
            hora_cabelo: format(toZonedTime(cabStartA, TZ), "HH:mm"),
          });
        } else {
          // --- Ordem B: cabelo first [current → current+cabDur], maquiagem after [current+cabDur → current+total] ---
          const cabEndB = addMinutes(current, duracaoCabeloMin);
          const maqStartB = cabEndB;
          const maqEndB = addMinutes(maqStartB, duracaoMaquiagemMin);
          const ordenB =
            current >= cabeloDayStartUTC &&             // cabelo block starts within cabelo schedule
            cabEndB <= cabeloDayEndUTC &&              // cabelo fits in cabelo schedule
            maqEndB <= dayEndUTC &&                    // maquiagem fits in maquiagem schedule
            !overlaps(current, cabEndB, cabeloBusy) &&
            !overlaps(maqStartB, maqEndB, maquiagemBusy);

          if (ordenB) {
            slots.push({
              hora_inicio: format(toZonedTime(current, TZ), "HH:mm"),
              hora_fim: format(toZonedTime(totalEnd, TZ), "HH:mm"),
              combo_ordem: "cabelo_primeiro",
              hora_maquiagem: format(toZonedTime(maqStartB, TZ), "HH:mm"),
              hora_cabelo: format(toZonedTime(current, TZ), "HH:mm"),
            });
          }
        }
      }
    }

    current = addMinutes(current, intervalo);
  }

  return NextResponse.json(slots);
}
