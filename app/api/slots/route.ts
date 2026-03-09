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
    const maqStart = new Date(a.data_hora);
    const end = new Date(a.data_hora_fim);

    if (cat === "maquiagem") {
      maquiagemBusy.push({ start: maqStart, end });
    } else if (cat === "cabelo") {
      cabeloBusy.push({ start: maqStart, end });
    } else if (cat === "combo") {
      const cabStart = a.data_hora_cabelo ? new Date(a.data_hora_cabelo) : end;
      if (maqStart <= cabStart) {
        // Ordem A (maquiagem first): maquiagem = [data_hora, data_hora_cabelo], cabelo = [data_hora_cabelo, fim]
        maquiagemBusy.push({ start: maqStart, end: cabStart });
        cabeloBusy.push({ start: cabStart, end });
      } else {
        // Ordem B (cabelo first): cabelo = [data_hora_cabelo, data_hora], maquiagem = [data_hora, fim]
        cabeloBusy.push({ start: cabStart, end: maqStart });
        maquiagemBusy.push({ start: maqStart, end });
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

        // Ordem A: maquiagem first, then cabelo
        const maqEndA = addMinutes(current, duracaoMaquiagemMin);
        const cabStartA = maqEndA;
        const cabEndA = addMinutes(cabStartA, duracaoCabeloMin);
        const ordenA =
          maqEndA <= dayEndUTC &&
          cabEndA <= cabeloDayEndUTC &&
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
          // Ordem B: cabelo first, then maquiagem
          const cabEndB = addMinutes(current, duracaoCabeloMin);
          const maqStartB = cabEndB;
          const maqEndB = addMinutes(maqStartB, duracaoMaquiagemMin);
          const ordenB =
            cabEndB <= cabeloDayEndUTC &&
            maqEndB <= dayEndUTC &&
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
