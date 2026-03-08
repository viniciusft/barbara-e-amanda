import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import { addMinutes, addDays, parseISO, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

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
    // Exact BRT date: equivalent to WHERE (data_hora AT TIME ZONE 'America/Sao_Paulo')::date = data
    const startUTC = fromZonedTime(`${data}T00:00:00`, TZ).toISOString();
    const endUTC = fromZonedTime(`${data}T23:59:59`, TZ).toISOString();
    query = query.gte("data_hora", startUTC).lte("data_hora", endUTC);
  } else if (semana) {
    // 7-day window starting from semana date (inclusive), all in BRT
    const endDateStr = format(addDays(parseISO(semana), 6), "yyyy-MM-dd");
    const startUTC = fromZonedTime(`${semana}T00:00:00`, TZ).toISOString();
    const endUTC = fromZonedTime(`${endDateStr}T23:59:59`, TZ).toISOString();
    query = query.gte("data_hora", startUTC).lte("data_hora", endUTC);
  } else {
    // Default (Todos): all future appointments from start of today in BRT
    const todayBRT = format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
    const todayStartUTC = fromZonedTime(`${todayBRT}T00:00:00`, TZ).toISOString();
    query = query.gte("data_hora", todayStartUTC);
  }

  const { data: agendamentos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add computed display fields in BRT (server runs in UTC on Vercel)
  const enriched = (agendamentos || []).map((a) => {
    const startBRT = toZonedTime(new Date(a.data_hora), TZ);
    const endBRT = toZonedTime(new Date(a.data_hora_fim), TZ);
    return {
      ...a,
      data: format(startBRT, "yyyy-MM-dd"),
      hora_inicio: format(startBRT, "HH:mm"),
      hora_fim: format(endBRT, "HH:mm"),
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/agendamentos — public
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
    } = body;

    if (!servico_id || !nome_cliente || !telefone_cliente || !data || !hora_inicio) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch service to get duration
    const { data: servico, error: servicoError } = await supabase
      .from("servicos")
      .select("*")
      .eq("id", servico_id)
      .eq("ativo", true)
      .single();

    if (servicoError || !servico) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    // Convert local time (BRT) to UTC for storage
    const startLocal = `${data}T${hora_inicio}:00`;
    const startUTC = fromZonedTime(parseISO(startLocal), TZ);
    const endUTC = addMinutes(startUTC, servico.duracao_minutos);

    // Check for conflicts
    const { data: conflitos } = await supabase
      .from("agendamentos")
      .select("id")
      .neq("status", "cancelado")
      .lt("data_hora", endUTC.toISOString())
      .gt("data_hora_fim", startUTC.toISOString());

    if (conflitos && conflitos.length > 0) {
      return NextResponse.json(
        { error: "Horário não disponível" },
        { status: 409 }
      );
    }

    // Create appointment
    const { data: agendamento, error: insertError } = await supabase
      .from("agendamentos")
      .insert({
        servico_id,
        servico_nome: servico.nome,
        servico_duracao: servico.duracao_minutos,
        nome_cliente,
        telefone: telefone_cliente,
        email: email_cliente || null,
        observacoes: observacoes || null,
        data_hora: startUTC.toISOString(),
        data_hora_fim: endUTC.toISOString(),
        status: "pendente",
      })
      .select()
      .single();

    if (insertError || !agendamento) {
      return NextResponse.json(
        { error: insertError?.message || "Erro ao criar agendamento" },
        { status: 500 }
      );
    }

    // Try to create Google Calendar event
    try {
      const event = await createCalendarEvent({
        summary: `${servico.nome} — ${nome_cliente}`,
        description: `Telefone: ${telefone_cliente}${observacoes ? `\nObservações: ${observacoes}` : ""}`,
        startDateTime: startUTC.toISOString(),
        endDateTime: endUTC.toISOString(),
      });

      // Update with event ID
      await supabase
        .from("agendamentos")
        .update({ gcal_event_id: event.id })
        .eq("id", agendamento.id);

      console.log("[GCal] Event created:", event.id);
    } catch (calError: unknown) {
      // Log full error details so we can debug from Vercel function logs
      const err = calError as {
        message?: string;
        response?: { status?: number; data?: unknown };
      };
      console.error("[GCal] createCalendarEvent failed — message:", err?.message);
      console.error("[GCal] HTTP status:", err?.response?.status);
      console.error("[GCal] Response data:", JSON.stringify(err?.response?.data ?? null));
      // Booking is saved — calendar failure is non-fatal
    }

    return NextResponse.json(agendamento, { status: 201 });
  } catch (err) {
    console.error("POST /api/agendamentos error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
