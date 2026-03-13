import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// Brazil is permanently UTC-3 since 2019 (no DST)
function brtDay(offset = 0): string {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("sv", { timeZone: "America/Sao_Paulo" }).format(d);
}

function dayUTCRange(dateStr: string): [string, string] {
  // BRT midnight = UTC 03:00:00
  const start = `${dateStr}T03:00:00.000Z`;
  const end = new Date(new Date(start).getTime() + 86400000).toISOString();
  return [start, end];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const todayStr = brtDay();
  const [dayStart, dayEnd] = dayUTCRange(todayStr);

  const monthStr = todayStr.slice(0, 7); // YYYY-MM
  const [monthStart, monthEnd] = dayUTCRange(`${monthStr}-01`);
  const nextMonthStr =
    Number(monthStr.slice(5)) === 12
      ? `${Number(monthStr.slice(0, 4)) + 1}-01-01`
      : `${monthStr.slice(0, 4)}-${String(Number(monthStr.slice(5)) + 1).padStart(2, "0")}-01`;
  const [monthEndActual] = dayUTCRange(nextMonthStr);

  // Parallel queries
  const [
    agendamentosHojeRes,
    proximoRes,
    receitaDiaRes,
    mesExecRes,
    sinaisPendentesRes,
    notifRecentesRes,
  ] = await Promise.all([
    // Agendamentos hoje (list for mini-card)
    supabase
      .from("agendamentos")
      .select("id, nome_cliente, servico_nome, data_hora, status, sinal_status")
      .gte("data_hora", dayStart)
      .lt("data_hora", dayEnd)
      .not("status", "in", '("cancelado")')
      .order("data_hora", { ascending: true }),

    // Próximo agendamento
    supabase
      .from("agendamentos")
      .select("id, nome_cliente, servico_nome, data_hora")
      .gt("data_hora", new Date().toISOString())
      .lt("data_hora", dayEnd)
      .not("status", "in", '("cancelado","concluido","nao_compareceu")')
      .order("data_hora", { ascending: true })
      .limit(1),

    // Receita do dia (execuções concluídas hoje)
    supabase
      .from("agendamentos")
      .select("preco_cobrado")
      .gte("executado_em", dayStart)
      .lt("executado_em", dayEnd)
      .eq("servico_executado", true),

    // Mês: execuções concluídas
    supabase
      .from("agendamentos")
      .select("preco_cobrado")
      .gte("executado_em", monthStart)
      .lt("executado_em", monthEndActual)
      .eq("servico_executado", true),

    // Sinais pendentes (aguardando_sinal, não cancelado)
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("status", "aguardando_sinal"),

    // 5 most recent unread notifications
    supabase
      .from("notificacoes")
      .select("*")
      .eq("lida", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // ── Generate automatic notifications ──────────────────────────────────────

  // 1. agendamento_hoje: generate for each today's agendamento if not already done today
  const agendamentosHoje = agendamentosHojeRes.data ?? [];
  try {
    for (const ag of agendamentosHoje) {
      const horaBRT = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ag.data_hora));

      // Check if notification already exists for today
      const { data: existing } = await supabase
        .from("notificacoes")
        .select("id")
        .eq("tipo", "agendamento_hoje")
        .eq("agendamento_id", ag.id)
        .gte("created_at", dayStart)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notificacoes").insert({
          tipo: "agendamento_hoje",
          titulo: "Agendamento hoje",
          descricao: `${horaBRT} — ${ag.nome_cliente} • ${ag.servico_nome}`,
          agendamento_id: ag.id,
          lida: false,
        });
      }
    }
  } catch { /* non-fatal */ }

  // 2. sinal_pendente: aguardando_sinal > 24h
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pendentes } = await supabase
      .from("agendamentos")
      .select("id, nome_cliente, servico_nome")
      .eq("status", "aguardando_sinal")
      .lte("updated_at", cutoff);

    for (const ag of pendentes ?? []) {
      const { data: existing } = await supabase
        .from("notificacoes")
        .select("id")
        .eq("tipo", "sinal_pendente")
        .eq("agendamento_id", ag.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notificacoes").insert({
          tipo: "sinal_pendente",
          titulo: "Sinal pendente há mais de 24h",
          descricao: `${ag.nome_cliente} — ${ag.servico_nome} aguardando pagamento do sinal.`,
          agendamento_id: ag.id,
          lida: false,
        });
      }
    }
  } catch { /* non-fatal */ }

  // 3. sem_confirmacao: confirmados sem mensagem de confirmação nas próximas 48h
  try {
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { data: semConfirmacao } = await supabase
      .from("agendamentos")
      .select("id, nome_cliente, servico_nome, data_hora")
      .eq("status", "confirmado")
      .is("confirmacao_enviada_em", null)
      .gt("data_hora", new Date().toISOString())
      .lte("data_hora", in48h);

    for (const ag of semConfirmacao ?? []) {
      const dataBRT = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ag.data_hora));

      const { data: existing } = await supabase
        .from("notificacoes")
        .select("id")
        .eq("tipo", "sem_confirmacao")
        .eq("agendamento_id", ag.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notificacoes").insert({
          tipo: "sem_confirmacao",
          titulo: "Confirmação não enviada",
          descricao: `${ag.nome_cliente} — ${ag.servico_nome} em ${dataBRT}. Confirmação ainda não foi enviada.`,
          agendamento_id: ag.id,
          lida: false,
        });
      }
    }
  } catch { /* non-fatal */ }

  // ── KPI calculations ──────────────────────────────────────────────────────

  const receitaDia = (receitaDiaRes.data ?? []).reduce(
    (s, r) => s + (Number(r.preco_cobrado) || 0), 0
  );

  const execucoesMes = mesExecRes.data ?? [];
  const receitaMes = execucoesMes.reduce((s, r) => s + (Number(r.preco_cobrado) || 0), 0);
  const totalAtendimentosMes = execucoesMes.length;
  const ticketMedio = totalAtendimentosMes > 0 ? receitaMes / totalAtendimentosMes : 0;

  const proximoAgendamento = (proximoRes.data ?? [])[0] ?? null;
  let proximoDisplay = null;
  if (proximoAgendamento) {
    const horaBRT = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(proximoAgendamento.data_hora));
    proximoDisplay = {
      ...proximoAgendamento,
      hora_brt: horaBRT,
    };
  }

  // Enrich today's list with BRT time
  const agendamentosHojeEnriched = agendamentosHoje.map((ag) => ({
    ...ag,
    hora_brt: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ag.data_hora)),
  }));

  return NextResponse.json({
    hoje: {
      count: agendamentosHoje.length,
      receita: receitaDia,
      proximo: proximoDisplay,
      agendamentos: agendamentosHojeEnriched,
    },
    mes: {
      total_atendimentos: totalAtendimentosMes,
      receita: receitaMes,
      ticket_medio: ticketMedio,
      sinais_pendentes: sinaisPendentesRes.count ?? 0,
    },
    notificacoes_recentes: notifRecentesRes.data ?? [],
  });
}
