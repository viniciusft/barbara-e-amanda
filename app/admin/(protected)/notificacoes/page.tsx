"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Notificacao } from "@/types";

const TIPOS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "nova_solicitacao", label: "Nova solicitação" },
  { value: "sinal_pendente", label: "Sinal pendente" },
  { value: "sem_confirmacao", label: "Sem confirmação" },
  { value: "agendamento_hoje", label: "Agendamento hoje" },
  { value: "contato_casamento", label: "Contato casamento" },
  { value: "contato_destination", label: "Destination Beauty" },
  { value: "contato_duvida", label: "Dúvida" },
];

const TIPO_ICONS: Record<string, string> = {
  nova_solicitacao: "🆕",
  sinal_pendente: "💰",
  sem_confirmacao: "📩",
  agendamento_hoje: "📅",
  contato_casamento: "💍",
  contato_destination: "✈️",
  contato_duvida: "💬",
};

const TIPO_LABELS: Record<string, string> = {
  nova_solicitacao: "Nova solicitação",
  sinal_pendente: "Sinal pendente",
  sem_confirmacao: "Sem confirmação",
  agendamento_hoje: "Agendamento hoje",
  contato_casamento: "Contato casamento",
  contato_destination: "Destination Beauty",
  contato_duvida: "Dúvida",
};

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

export default function NotificacoesPage() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotificacoes = useCallback(async (tipo: string) => {
    setLoading(true);
    const url = `/api/admin/notificacoes${tipo ? `?tipo=${tipo}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setNotificacoes(data.notificacoes ?? []);
    setNaoLidas(data.nao_lidas ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotificacoes(tipoFiltro);
  }, [tipoFiltro, fetchNotificacoes]);

  async function markAsRead(n: Notificacao) {
    if (!n.lida) {
      await fetch(`/api/admin/notificacoes/${n.id}`, { method: "PATCH" });
      setNotificacoes((prev) => prev.map((x) => x.id === n.id ? { ...x, lida: true } : x));
      setNaoLidas((c) => Math.max(0, c - 1));
    }
    if (n.agendamento_id) {
      router.push(`/admin?agendamento=${n.agendamento_id}`);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch("/api/admin/notificacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    setMarkingAll(false);
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-3xl text-foreground font-light">Notificações</h2>
            {naoLidas > 0 && (
              <span className="bg-gold text-[#0a0a0a] text-xs font-sans font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {naoLidas}
              </span>
            )}
          </div>
          <p className="text-foreground/40 font-sans text-sm">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas !== 1 ? "s" : ""}` : "Tudo em dia"}
          </p>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 border border-surface-border px-4 py-2 text-sm font-sans text-foreground/60 hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <CheckCheck size={15} strokeWidth={1.5} />
            {markingAll ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      {/* Filtro por tipo */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTipoFiltro(t.value)}
            className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
              tipoFiltro === t.value
                ? "border-gold text-gold bg-gold-muted"
                : "border-surface-border text-foreground/50 hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="border border-surface-border p-16 text-center">
          <Bell size={32} className="text-foreground/15 mx-auto mb-3" strokeWidth={1} />
          <p className="text-foreground/40 font-sans text-sm">Nenhuma notificação encontrada.</p>
        </div>
      ) : (
        <div className="border border-surface-border divide-y divide-surface-border">
          {notificacoes.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n)}
              className={`w-full text-left flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-elevated ${
                !n.lida ? "bg-gold/[0.03]" : ""
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{TIPO_ICONS[n.tipo] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-sans font-medium text-sm text-foreground">{n.titulo}</span>
                  {!n.lida && (
                    <span className="text-[9px] font-sans border border-gold/50 text-gold px-1.5 py-0.5 uppercase tracking-wider">
                      Nova
                    </span>
                  )}
                  <span className="text-[10px] font-sans border border-surface-border text-foreground/30 px-1.5 py-0.5 uppercase tracking-wider">
                    {TIPO_LABELS[n.tipo] ?? n.tipo}
                  </span>
                </div>
                <p className="text-foreground/50 font-sans text-xs leading-snug">{n.descricao}</p>
              </div>
              <span className="text-foreground/30 text-[10px] font-sans shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
