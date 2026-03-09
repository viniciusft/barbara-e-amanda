import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import { addMinutes, addDays, parseISO, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

const STATUS_EMOJI: Record<string, string> = {
  pendente: "⏳",
  confirmado: "✅",
  concluido: "✓",
  cancelado: "✗",
};

function buildEventTitle(status: string, servicoNome: string, clienteNome: string): string {
  const emoji = STATUS_EMOJI[status] ?? "⏳";
  return `${emoji} ${servicoNome} — ${clienteNome}`;
}

// GET /api/agendamentos — admin only
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const semana = searchParams.get("semana");

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("agendamentos")
    .select("*, servico:servicos(*)")
    .order("data_hora", { ascending: true });

  if (data) {
    const startUTC = fromZonedTime(`${data}T00:00:00`, TZ).toISOString();
    const endUTC = fromZonedTime(`${data}T23:59:59`, TZ).toISOString();
    query = query.gte("data_hora", startUTC).lte("data_hora", endUTC);
  } else if (semana) {
    const endDateStr = format(addDays(parseISO(semana), 6), "yyyy-MM-dd");
    const startUTC = fromZonedTime(`${semana}T00:00:00`, TZ).toISOString();
    const endUTC = fromZonedTime(`${endDateStr}T23:59:59`, TZ).toISOString();
    query = query.gte("data_hora", startUTC).lte("data_hora", endUTC);
  } else {
    const todayBRT = format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
    const todayStartUTC = fromZonedTime(`${todayBRT}T00:00:00`, TZ).toISOString();
    query = query.gte("data_hora", todayStartUTC);
  }

  const { data: agendamentos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (agendamentos || []).map((a) => {
    const startBRT = toZonedTime(new Date(a.data_hora), TZ);
    const endBRT = toZonedTime(new Date(a.data_hora_fim), TZ);
    const extra: Record<string, string> = {
      data: format(startBRT, "yyyy-MM-dd"),
      hora_inicio: format(startBRT, "HH:mm"),
      hora_fim: format(endBRT, "HH:mm"),
    };
    if (a.data_hora_cabelo) {
      extra.hora_inicio_cabelo = format(toZonedTime(new Date(a.data_hora_cabelo), TZ), "HH:mm");
    }
    return { ...a, ...extra };
  });

  return NextResponse.json(enriched);
}

// POST /api/agendamentos — public (booking wizard) + admin (with status_inicial)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      servico_id,
      nome_cliente,
      telefone_cliente,
      email_cliente,
      observacoes,
      data,
      hora_inicio,
      status_inicial,  // admin only
    } = body;

    if (!servico_id || !nome_cliente || !telefone_cliente || !data || !hora_inicio) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    // Determine initial status — admin can set it
    const session = await getServerSession(authOptions);
    const statusInicial =
      session && (status_inicial === "confirmado" || status_inicial === "pendente")
        ? status_inicial
        : "pendente";

    const supabase = createServerSupabaseClient();

    // Fetch service
    const { data: servico, error: servicoError } = await supabase
      .from("servicos")
      .select("*")
      .eq("id", servico_id)
      .eq("ativo", true)
      .single();

    if (servicoError || !servico) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    const categoria: string = servico.categoria ?? "maquiagem";
    const duracaoTotal: number = servico.duracao_minutos;
    const duracaoMaquiagem: number = servico.duracao_maquiagem_min ?? duracaoTotal;
    const duracaoCabelo: number = servico.duracao_cabelo_min ?? duracaoTotal;

    // Build UTC datetimes
    const startLocal = `${data}T${hora_inicio}:00`;
    const startUTC = fromZonedTime(parseISO(startLocal), TZ);
    const endUTC = addMinutes(startUTC, duracaoTotal);

    // For combos: cabelo starts right after maquiagem
    const cabeloStartUTC = categoria === "combo" ? addMinutes(startUTC, duracaoMaquiagem) : null;

    // Conflict check based on category
    if (categoria === "maquiagem" || categoria === "combo") {
      // Check maquiagem track
      const maqEnd = categoria === "combo" ? addMinutes(startUTC, duracaoMaquiagem) : endUTC;
      const { data: maqConflicts } = await supabase
        .from("agendamentos")
        .select("id")
        .neq("status", "cancelado")
        .in("categoria_servico", ["maquiagem", "combo"])
        .lt("data_hora", maqEnd.toISOString())
        .gt("data_hora_fim", startUTC.toISOString());

      if (maqConflicts && maqConflicts.length > 0) {
        return NextResponse.json({ error: "Horário de maquiagem não disponível" }, { status: 409 });
      }
    }

    if (categoria === "cabelo" || categoria === "combo") {
      const cabStart = cabeloStartUTC ?? startUTC;
      const cabEnd = categoria === "combo" ? endUTC : addMinutes(startUTC, duracaoCabelo);
      const { data: cabConflicts } = await supabase
        .from("agendamentos")
        .select("id, data_hora_cabelo, data_hora_fim, categoria_servico")
        .neq("status", "cancelado")
        .in("categoria_servico", ["cabelo", "combo"]);

      const hasConflict = (cabConflicts ?? []).some((a) => {
        const aStart = a.categoria_servico === "combo" && a.data_hora_cabelo
          ? new Date(a.data_hora_cabelo)
          : new Date(a.data_hora_cabelo ?? a.data_hora_fim);
        const aEnd = new Date(a.data_hora_fim);
        return cabStart < aEnd && cabEnd > aStart;
      });

      if (hasConflict) {
        return NextResponse.json({ error: "Horário de cabelo não disponível" }, { status: 409 });
      }
    }

    // Insert agendamento
    const insertData: Record<string, unknown> = {
      servico_id,
      servico_nome: servico.nome,
      servico_duracao: duracaoTotal,
      nome_cliente,
      telefone: telefone_cliente,
      email: email_cliente || null,
      observacoes: observacoes || null,
      data_hora: startUTC.toISOString(),
      data_hora_fim: endUTC.toISOString(),
      categoria_servico: categoria,
      status: statusInicial,
    };

    if (cabeloStartUTC) {
      insertData.data_hora_cabelo = cabeloStartUTC.toISOString();
    }

    const { data: agendamento, error: insertError } = await supabase
      .from("agendamentos")
      .insert(insertData)
      .select()
      .single();

    if (insertError || !agendamento) {
      return NextResponse.json(
        { error: insertError?.message || "Erro ao criar agendamento" },
        { status: 500 }
      );
    }

    // Google Calendar event(s)
    const descricaoBase = `Telefone: ${telefone_cliente}${observacoes ? `\nObservações: ${observacoes}` : ""}`;

    try {
      if (categoria === "combo") {
        // Two events: maquiagem + cabelo
        const maqEnd = cabeloStartUTC!;
        const maqEvent = await createCalendarEvent({
          summary: buildEventTitle(statusInicial, `💄 Maquiagem — ${servico.nome}`, nome_cliente),
          description: `${descricaoBase}\n⚠️ Parte de um combo: ${servico.nome}`,
          startDateTime: startUTC.toISOString(),
          endDateTime: maqEnd.toISOString(),
        });

        const cabEvent = await createCalendarEvent({
          summary: buildEventTitle(statusInicial, `💇 Cabelo — ${servico.nome}`, nome_cliente),
          description: `${descricaoBase}\n⚠️ Parte de um combo: ${servico.nome}`,
          startDateTime: maqEnd.toISOString(),
          endDateTime: endUTC.toISOString(),
        });

        await supabase
          .from("agendamentos")
          .update({ gcal_event_id: maqEvent.id, gcal_event_id_cabelo: cabEvent.id })
          .eq("id", agendamento.id);
      } else {
        const icon = categoria === "cabelo" ? "💇" : "💄";
        const event = await createCalendarEvent({
          summary: buildEventTitle(statusInicial, `${icon} ${servico.nome}`, nome_cliente),
          description: descricaoBase,
          startDateTime: startUTC.toISOString(),
          endDateTime: endUTC.toISOString(),
        });

        await supabase
          .from("agendamentos")
          .update({ gcal_event_id: event.id })
          .eq("id", agendamento.id);
      }
    } catch (calError: unknown) {
      const err = calError as { message?: string; response?: { status?: number; data?: unknown } };
      console.error("[GCal] createCalendarEvent failed:", err?.message);
    }

    return NextResponse.json(agendamento, { status: 201 });
  } catch (err) {
    console.error("POST /api/agendamentos error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
