"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { Cliente } from "@/types";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    solicitacao: { label: "Solicitação", color: "text-amber-400 border-amber-700/40" },
    aguardando_sinal: { label: "Ag. Sinal", color: "text-yellow-400 border-yellow-700/40" },
    confirmado: { label: "Confirmado", color: "text-green-400 border-green-700/40" },
    cancelado: { label: "Cancelado", color: "text-red-400 border-red-700/40" },
    concluido: { label: "Concluído", color: "text-emerald-400 border-emerald-700/40" },
    nao_compareceu: { label: "Não compareceu", color: "text-gray-400 border-gray-700/40" },
  };
  return map[s] ?? { label: s, color: "text-foreground/40 border-surface-border" };
}

interface AgendamentoHistorico {
  id: string;
  data_brt: string | null;
  hora_brt: string | null;
  servico_nome: string;
  preco_cobrado: number | null;
  status: string;
  sinal_status: string | null;
}

export default function ClientePerfilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [savedObs, setSavedObs] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/clientes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCliente(data.cliente);
        setObservacoes(data.cliente?.observacoes ?? "");
        setAgendamentos(data.agendamentos ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveObservacoes() {
    if (!cliente) return;
    setSavingObs(true);
    await fetch(`/api/admin/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacoes }),
    });
    setSavingObs(false);
    setSavedObs(true);
    setTimeout(() => setSavedObs(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="py-12 text-center">
        <p className="text-foreground/40 font-sans text-sm">Cliente não encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-gold text-sm font-sans hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  const isFrequente = cliente.total_agendamentos >= 5;
  const dataNasc = cliente.data_nascimento
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(cliente.data_nascimento + "T12:00:00"))
    : null;

  return (
    <div className="py-6 max-w-2xl">
      <button
        onClick={() => router.push("/admin/clientes")}
        className="flex items-center gap-2 text-foreground/50 hover:text-foreground text-sm font-sans mb-6 transition-colors"
      >
        <ArrowLeft size={15} strokeWidth={1.5} />
        Clientes
      </button>

      {/* Header */}
      <div className="border border-surface-border bg-surface-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-3xl text-foreground font-light">{cliente.nome}</h2>
              {isFrequente && (
                <span className="flex items-center gap-1 border border-gold/50 text-gold text-[10px] font-sans px-2 py-0.5 uppercase tracking-wider">
                  <Star size={9} strokeWidth={2} />
                  Frequente
                </span>
              )}
            </div>
            <p className="text-foreground/50 font-sans text-sm mt-1">{cliente.telefone}</p>
            {cliente.email && <p className="text-foreground/40 font-sans text-xs mt-0.5">{cliente.email}</p>}
            {dataNasc && <p className="text-foreground/35 font-sans text-xs mt-0.5">Nascimento: {dataNasc}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-sans text-foreground/40 uppercase tracking-widest mb-1">Total gasto</p>
            <p className="font-display text-2xl text-gold">{formatCurrency(cliente.total_gasto)}</p>
            <p className="text-foreground/40 text-xs font-sans mt-0.5">{cliente.total_agendamentos} atendimento{cliente.total_agendamentos !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="border border-surface-border bg-surface-card p-5 mb-6">
        <h3 className="font-sans text-xs uppercase tracking-widest text-foreground/40 mb-3">
          Observações (alergias, tipo de pele/cabelo, preferências)
        </h3>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={4}
          className="input-luxury resize-none w-full"
          placeholder="Adicione observações sobre esta cliente..."
        />
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-sans transition-colors ${savedObs ? "text-green-400" : "text-transparent"}`}>
            Salvo!
          </span>
          <button
            onClick={saveObservacoes}
            disabled={savingObs}
            className="btn-gold px-4 py-2 text-sm flex items-center gap-2"
          >
            {savingObs && <div className="w-3 h-3 border border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />}
            {savingObs ? "Salvando..." : "Salvar observações"}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="font-display text-xl text-foreground font-light mb-4">
          Histórico de Agendamentos
        </h3>

        {agendamentos.length === 0 ? (
          <div className="border border-surface-border p-8 text-center">
            <p className="text-foreground/40 font-sans text-sm">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {agendamentos.map((ag) => {
              const { label, color } = statusLabel(ag.status);
              return (
                <div key={ag.id} className="border border-surface-border bg-surface-card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-sans text-sm font-medium text-foreground">{ag.servico_nome}</span>
                      <span className={`text-[10px] font-sans border px-1.5 py-0.5 uppercase tracking-wider ${color}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-foreground/40 text-xs font-sans">
                      {ag.data_brt ?? "—"} às {ag.hora_brt ?? "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {ag.preco_cobrado != null ? (
                      <span className="text-gold font-medium font-sans text-sm">
                        {formatCurrency(ag.preco_cobrado)}
                      </span>
                    ) : (
                      <span className="text-foreground/30 text-sm font-sans">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
