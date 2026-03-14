"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Notificacao } from "@/types";

// Pills matching the task spec
const PILLS: { value: string; label: string; tipos: string[] }[] = [
  { value: "",              label: "Todas",           tipos: [] },
  { value: "solicitacoes",  label: "Solicitações",    tipos: ["nova_solicitacao"] },
  { value: "sinal",         label: "Sinal Pendente",  tipos: ["sinal_pendente"] },
  { value: "confirmacao",   label: "Sem Confirmação", tipos: ["sem_confirmacao"] },
  { value: "hoje",          label: "Hoje",            tipos: ["agendamento_hoje"] },
  { value: "nao_veio",      label: "Não Compareceu",  tipos: ["nao_compareceu"] },
  { value: "contatos",      label: "Contatos",        tipos: ["contato_casamento", "contato_destination", "contato_duvida"] },
];

const TIPO_ICONS: Record<string, string> = {
  nova_solicitacao:    "🆕",
  sinal_pendente:      "💰",
  sem_confirmacao:     "📩",
  agendamento_hoje:    "📅",
  nao_compareceu:      "🚫",
  contato_casamento:   "💍",
  contato_destination: "✈️",
  contato_duvida:      "💬",
};

const TIPO_LABELS: Record<string, string> = {
  nova_solicitacao:    "Nova solicitação",
  sinal_pendente:      "Sinal pendente",
  sem_confirmacao:     "Sem confirmação",
  agendamento_hoje:    "Agendamento hoje",
  nao_compareceu:      "Não compareceu",
  contato_casamento:   "Contato casamento",
  contato_destination: "Destination Beauty",
  contato_duvida:      "Dúvida",
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
  const [all, setAll] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [pill, setPill] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notificacoes");
    const data = await res.json();
    setAll(data.notificacoes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Compute counts of unread per pill
  const pillCounts = useMemo(() => {
    return PILLS.map((p) => {
      if (p.value === "") return { value: "", count: all.filter((n) => !n.lida).length };
      return {
        value: p.value,
        count: all.filter((n) => !n.lida && p.tipos.includes(n.tipo)).length,
      };
    });
  }, [all]);

  // Filter notifications for current pill
  const visible = useMemo(() => {
    if (!pill) return all;
    const tipos = PILLS.find((p) => p.value === pill)?.tipos ?? [];
    return all.filter((n) => tipos.includes(n.tipo));
  }, [all, pill]);

  const naoLidas = all.filter((n) => !n.lida).length;

  async function markAsRead(n: Notificacao) {
    if (!n.lida) {
      await fetch(`/api/admin/notificacoes/${n.id}`, { method: "PATCH" });
      setAll((prev) => prev.map((x) => x.id === n.id ? { ...x, lida: true } : x));
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
    setAll((prev) => prev.map((n) => ({ ...n, lida: true })));
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

      {/* Pills with counters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {PILLS.map((p) => {
          const countObj = pillCounts.find((c) => c.value === p.value);
          const count = countObj?.count ?? 0;
          const active = pill === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPill(p.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans border transition-colors ${
                active
                  ? "border-gold text-gold bg-gold-muted"
                  : "border-surface-border text-foreground/50 hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {p.label}
              {count > 0 && (
                <span className={`font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center text-[9px] px-1 ${
                  active ? "bg-gold text-[#0a0a0a]" : "bg-foreground/15 text-foreground/60"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-surface-border rounded-card p-16 text-center">
          <Bell size={32} className="text-foreground/15 mx-auto mb-3" strokeWidth={1} />
          <p className="text-foreground/40 font-sans text-sm">Nenhuma notificação encontrada.</p>
        </div>
      ) : (
        <div className="border border-surface-border rounded-card divide-y divide-surface-border overflow-hidden">
          {visible.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n)}
              className={`w-full text-left flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-elevated relative ${
                !n.lida ? "bg-gold/[0.04]" : ""
              }`}
            >
              {/* Unread indicator stripe */}
              {!n.lida && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />
              )}
              <span className={`text-xl shrink-0 mt-0.5 ${!n.lida ? "" : "opacity-50"}`}>{TIPO_ICONS[n.tipo] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`font-sans text-sm ${!n.lida ? "font-semibold text-foreground" : "font-medium text-foreground/60"}`}>
                    {n.titulo}
                  </span>
                  <span className="text-[10px] font-sans border border-surface-border text-foreground/30 px-1.5 py-0.5 uppercase tracking-wider">
                    {TIPO_LABELS[n.tipo] ?? n.tipo}
                  </span>
                </div>
                <p className={`font-sans text-xs leading-snug ${!n.lida ? "text-foreground/60" : "text-foreground/35"}`}>{n.descricao}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-foreground/30 text-[10px] font-sans">{timeAgo(n.created_at)}</span>
                {!n.lida && (
                  <span className="w-2 h-2 rounded-full bg-gold block" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
