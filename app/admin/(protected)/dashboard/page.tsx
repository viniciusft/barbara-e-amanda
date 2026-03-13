"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  TrendingUp,
  Clock,
  Bell,
  Users,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Notificacao } from "@/types";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    solicitacao: { label: "Solicitação", color: "bg-amber-900/30 text-amber-400" },
    aguardando_sinal: { label: "Ag. Sinal", color: "bg-yellow-900/30 text-yellow-400" },
    confirmado: { label: "Confirmado", color: "bg-green-900/30 text-green-400" },
    concluido: { label: "Concluído", color: "bg-emerald-900/30 text-emerald-400" },
    cancelado: { label: "Cancelado", color: "bg-red-900/30 text-red-400" },
    nao_compareceu: { label: "Não compareceu", color: "bg-gray-800 text-gray-400" },
  };
  return map[status] ?? { label: status, color: "bg-surface-elevated text-foreground/50" };
}

function notifIcon(tipo: string) {
  const map: Record<string, string> = {
    nova_solicitacao: "🆕",
    sinal_pendente: "💰",
    sem_confirmacao: "📩",
    agendamento_hoje: "📅",
    contato_casamento: "💍",
    contato_destination: "✈️",
    contato_duvida: "💬",
  };
  return map[tipo] ?? "🔔";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

interface AgendamentoHoje {
  id: string;
  nome_cliente: string;
  servico_nome: string;
  hora_brt: string;
  status: string;
}

interface ProximoAgendamento {
  id: string;
  nome_cliente: string;
  servico_nome: string;
  hora_brt: string;
}

interface DashboardData {
  hoje: {
    count: number;
    receita: number;
    proximo: ProximoAgendamento | null;
    agendamentos: AgendamentoHoje[];
  };
  mes: {
    total_atendimentos: number;
    receita: number;
    ticket_medio: number;
    sinais_pendentes: number;
  };
  notificacoes_recentes: Notificacao[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-6">
        <h2 className="font-display text-3xl text-foreground font-light mb-8">Dashboard</h2>
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 font-sans text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  const { hoje, mes, notificacoes_recentes } = data!;
  const hoje_brt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="py-6 space-y-8">
      <div>
        <h2 className="font-display text-3xl text-foreground font-light">Dashboard</h2>
        <p className="text-foreground/40 font-sans text-sm mt-1 capitalize">{hoje_brt}</p>
      </div>

      {/* ── KPIs do dia ──────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-sans uppercase tracking-widest text-foreground/40 mb-3">Hoje</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Agendamentos hoje */}
          <div className="border border-surface-border bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={14} className="text-gold" strokeWidth={1.5} />
              <span className="text-xs font-sans text-foreground/40 uppercase tracking-wider">Agendamentos</span>
            </div>
            <p className="font-display text-3xl text-foreground">{hoje.count}</p>
          </div>

          {/* Receita do dia */}
          <div className="border border-surface-border bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-gold" strokeWidth={1.5} />
              <span className="text-xs font-sans text-foreground/40 uppercase tracking-wider">Receita</span>
            </div>
            <p className="font-display text-2xl text-gold">{formatCurrency(hoje.receita)}</p>
          </div>

          {/* Próximo agendamento */}
          <div className="border border-surface-border bg-surface-card p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gold" strokeWidth={1.5} />
              <span className="text-xs font-sans text-foreground/40 uppercase tracking-wider">Próximo</span>
            </div>
            {hoje.proximo ? (
              <>
                <p className="font-sans text-foreground font-medium text-sm leading-tight">{hoje.proximo.nome_cliente}</p>
                <p className="text-foreground/50 text-xs font-sans mt-0.5">{hoje.proximo.servico_nome}</p>
                <p className="text-gold text-sm font-sans mt-1">{hoje.proximo.hora_brt}</p>
              </>
            ) : (
              <p className="text-foreground/30 text-sm font-sans">Nenhum agendamento pendente</p>
            )}
          </div>
        </div>
      </section>

      {/* ── KPIs do mês ─────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-sans uppercase tracking-widest text-foreground/40 mb-3">Este mês</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-surface-border bg-surface-card p-4">
            <p className="text-xs font-sans text-foreground/40 uppercase tracking-wider mb-2">Atendimentos</p>
            <p className="font-display text-2xl text-foreground">{mes.total_atendimentos}</p>
          </div>
          <div className="border border-surface-border bg-surface-card p-4">
            <p className="text-xs font-sans text-foreground/40 uppercase tracking-wider mb-2">Receita</p>
            <p className="font-display text-xl text-gold">{formatCurrency(mes.receita)}</p>
          </div>
          <div className="border border-surface-border bg-surface-card p-4">
            <p className="text-xs font-sans text-foreground/40 uppercase tracking-wider mb-2">Ticket médio</p>
            <p className="font-display text-xl text-foreground">{formatCurrency(mes.ticket_medio)}</p>
          </div>
          <div className="border border-surface-border bg-surface-card p-4">
            <p className="text-xs font-sans text-foreground/40 uppercase tracking-wider mb-2">Sinais pendentes</p>
            <p className={`font-display text-2xl ${mes.sinais_pendentes > 0 ? "text-amber-400" : "text-foreground"}`}>
              {mes.sinais_pendentes}
            </p>
          </div>
        </div>
      </section>

      {/* ── Agendamentos de hoje ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-sans uppercase tracking-widest text-foreground/40">Agenda de hoje</h3>
          <Link href="/admin" className="text-xs font-sans text-gold hover:underline flex items-center gap-1">
            Ver agenda completa <ChevronRight size={11} />
          </Link>
        </div>

        {hoje.agendamentos.length === 0 ? (
          <div className="border border-surface-border p-6 text-center">
            <p className="text-foreground/30 font-sans text-sm">Nenhum agendamento para hoje.</p>
          </div>
        ) : (
          <div className="border border-surface-border divide-y divide-surface-border">
            {hoje.agendamentos.map((ag) => {
              const { label, color } = statusBadge(ag.status);
              return (
                <div
                  key={ag.id}
                  onClick={() => router.push(`/admin?agendamento=${ag.id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated cursor-pointer transition-colors"
                >
                  <span className="text-gold font-sans text-sm font-medium w-12 shrink-0">{ag.hora_brt}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground font-sans text-sm">{ag.nome_cliente}</span>
                    <span className="text-foreground/40 font-sans text-xs ml-2">{ag.servico_nome}</span>
                  </div>
                  <span className={`text-[10px] font-sans px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${color}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Notificações recentes ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-sans uppercase tracking-widest text-foreground/40">Notificações recentes</h3>
          <Link href="/admin/notificacoes" className="text-xs font-sans text-gold hover:underline flex items-center gap-1">
            Ver todas <ChevronRight size={11} />
          </Link>
        </div>

        {notificacoes_recentes.length === 0 ? (
          <div className="border border-surface-border p-6 text-center">
            <p className="text-foreground/30 font-sans text-sm">Nenhuma notificação não lida.</p>
          </div>
        ) : (
          <div className="border border-surface-border divide-y divide-surface-border">
            {notificacoes_recentes.map((n) => (
              <Link
                key={n.id}
                href={n.agendamento_id ? `/admin?agendamento=${n.agendamento_id}` : "/admin/notificacoes"}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors"
              >
                <span className="text-lg shrink-0">{notifIcon(n.tipo)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-sans text-sm font-medium leading-tight">{n.titulo}</p>
                  <p className="text-foreground/40 font-sans text-xs mt-0.5 leading-snug">{n.descricao}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-foreground/30 text-[10px] font-sans">{timeAgo(n.created_at)}</span>
                  {!n.lida && (
                    <span className="w-2 h-2 rounded-full bg-gold" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Atalhos rápidos ─────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-sans uppercase tracking-widest text-foreground/40 mb-3">Atalhos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin"
            className="border border-surface-border bg-surface-card px-4 py-3 flex items-center gap-3 hover:bg-surface-elevated transition-colors"
          >
            <CalendarDays size={18} className="text-gold shrink-0" strokeWidth={1.5} />
            <span className="font-sans text-sm text-foreground">Ver agenda da semana</span>
          </Link>
          <Link
            href="/admin/financeiro"
            className="border border-surface-border bg-surface-card px-4 py-3 flex items-center gap-3 hover:bg-surface-elevated transition-colors"
          >
            <TrendingUp size={18} className="text-gold shrink-0" strokeWidth={1.5} />
            <span className="font-sans text-sm text-foreground">Financeiro do mês</span>
          </Link>
          <Link
            href="/admin/clientes"
            className="border border-surface-border bg-surface-card px-4 py-3 flex items-center gap-3 hover:bg-surface-elevated transition-colors"
          >
            <Users size={18} className="text-gold shrink-0" strokeWidth={1.5} />
            <span className="font-sans text-sm text-foreground">Ver clientes</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
