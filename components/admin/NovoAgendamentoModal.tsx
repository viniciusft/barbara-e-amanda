"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Servico, SlotDisponivel } from "@/types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function addMins(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const CATEGORIA_LABEL: Record<string, string> = {
  maquiagem: "💄 Maquiagem",
  cabelo: "💇 Cabelo",
  combo: "✨ Combo",
};

export default function NovoAgendamentoModal({ onClose, onCreated }: Props) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [slots, setSlots] = useState<SlotDisponivel[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponivel | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [statusInicial, setStatusInicial] = useState<"pendente" | "confirmado">("pendente");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((d) => setServicos(Array.isArray(d) ? d.filter((s: Servico) => s.ativo) : []));
  }, []);

  useEffect(() => {
    if (!servicoId || !data) { setSlots([]); setSelectedSlot(null); return; }
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    fetch(`/api/slots?data=${data}&servico_id=${servicoId}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d) ? d : []))
      .finally(() => setLoadingSlots(false));
  }, [servicoId, data]);

  const servico = servicos.find((s) => s.id === servicoId);

  async function handleSubmit() {
    const horaInicio = selectedSlot?.hora_inicio ?? "";
    if (!servicoId || !data || !horaInicio || !nomeCliente || !telefone) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servico_id: servicoId,
          nome_cliente: nomeCliente,
          telefone_cliente: telefone,
          observacoes: observacoes || null,
          data,
          hora_inicio: horaInicio,
          status_inicial: statusInicial,
          ...(selectedSlot?.combo_ordem && {
            combo_ordem: selectedSlot.combo_ordem,
            hora_maquiagem: selectedSlot.hora_maquiagem,
            hora_cabelo: selectedSlot.hora_cabelo,
          }),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao criar");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-elevated border border-surface-border rounded-card shadow-modal max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border rounded-t-card">
          <div>
            <p className="text-[#C9A84C] text-[9px] tracking-[0.35em] uppercase font-sans mb-0.5">
              Admin
            </p>
            <h3 className="font-display text-xl text-[#F5F0E8] font-light">
              Novo Agendamento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[rgba(245,240,232,0.3)] hover:text-[rgba(245,240,232,0.7)] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Serviço */}
          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Serviço <span className="text-[#C9A84C]">*</span>
            </label>
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className="w-full bg-surface-card border border-surface-border text-foreground font-sans text-sm px-3 py-2 rounded-btn focus:outline-none"
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {CATEGORIA_LABEL[s.categoria] ?? s.categoria} — {s.nome}
                </option>
              ))}
            </select>
            {servico && (
              <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans mt-1">
                {servico.categoria === "combo"
                  ? `💄 ${servico.duracao_maquiagem_min}min + 💇 ${servico.duracao_cabelo_min}min = ${servico.duracao_minutos}min total`
                  : `${servico.duracao_minutos} min`}
              </p>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Data <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="date"
              value={data}
              min={today}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-surface-card border border-surface-border text-foreground font-sans text-sm px-3 py-2 rounded-btn focus:outline-none"
            />
          </div>

          {/* Horário */}
          {(servicoId && data) && (
            <div>
              <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
                Horário <span className="text-[#C9A84C]">*</span>
              </label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-2 text-[rgba(245,240,232,0.3)] text-sm font-sans">
                  <Loader2 size={14} className="animate-spin" />
                  Carregando horários...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-[rgba(245,240,232,0.3)] text-sm font-sans py-1">
                  Nenhum horário disponível nessa data
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.hora_inicio}
                      onClick={() => setSelectedSlot(s)}
                      className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
                        selectedSlot?.hora_inicio === s.hora_inicio
                          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                          : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(255,255,255,0.25)]"
                      }`}
                    >
                      {s.hora_inicio}
                      {s.combo_ordem && (
                        <span className="text-[rgba(245,240,232,0.4)] ml-1">
                          {s.combo_ordem === "maquiagem_primeiro" ? "· 💄→💇" : "· 💇→💄"}
                        </span>
                      )}
                    </button>
                  ))}
                  {/* Combo summary */}
                  {selectedSlot?.combo_ordem && (
                    <div className="w-full mt-2 p-2.5 bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.2)] text-xs font-sans text-[rgba(245,240,232,0.6)] space-y-0.5">
                      <p className="text-[#C9A84C] mb-1">Organização do atendimento:</p>
                      <p>💄 Maquiagem: {selectedSlot.hora_maquiagem} – {addMins(selectedSlot.hora_maquiagem!, servico?.duracao_maquiagem_min ?? 0)}</p>
                      <p>💇 Cabelo: {selectedSlot.hora_cabelo} – {selectedSlot.hora_fim}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Nome do cliente <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome completo"
              className="w-full bg-surface-card border border-surface-border text-foreground font-sans text-sm px-3 py-2 rounded-btn focus:outline-none placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Telefone <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-surface-card border border-surface-border text-foreground font-sans text-sm px-3 py-2 rounded-btn focus:outline-none placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Observações opcionais..."
              className="w-full bg-surface-card border border-surface-border text-foreground font-sans text-sm px-3 py-2 rounded-btn focus:outline-none placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Status inicial */}
          <div>
            <label className="text-[rgba(245,240,232,0.45)] text-xs font-sans uppercase tracking-wider block mb-1.5">
              Status inicial
            </label>
            <div className="flex gap-2">
              {(["pendente", "confirmado"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusInicial(s)}
                  className={`px-4 py-1.5 text-xs font-sans border transition-colors capitalize ${
                    statusInicial === s
                      ? s === "confirmado"
                        ? "border-green-700 bg-green-950/30 text-green-400"
                        : "border-yellow-700 bg-yellow-950/30 text-yellow-400"
                      : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)]"
                  }`}
                >
                  {s === "pendente" ? "Pendente" : "Confirmado"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-sans">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-sans border border-surface-border text-gray-400 hover:border-gray-500 rounded-btn transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-sans bg-gold text-[#111] font-semibold hover:bg-gold-light rounded-btn transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Criando..." : "Criar Agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
