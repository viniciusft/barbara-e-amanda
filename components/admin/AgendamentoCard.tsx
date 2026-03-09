"use client";

import { useState } from "react";
import { Agendamento, AdminConfig } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { ClipboardCheck, TrendingDown, TrendingUp, MessageCircle, CheckCircle2, UserX } from "lucide-react";
import ExecucaoModal from "./ExecucaoModal";

interface Props {
  agendamento: Agendamento;
  onStatusChange: (id: string, status: string) => void;
  onUpdated?: (updated: Agendamento) => void;
  adminConfig?: AdminConfig | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  solicitacao: { label: "Solicitação", color: "text-amber-400 border-amber-700 bg-amber-950/30" },
  aguardando_sinal: { label: "Aguardando Sinal", color: "text-orange-400 border-orange-700 bg-orange-950/30" },
  confirmado: { label: "Confirmado", color: "text-green-400 border-green-800 bg-green-950/30" },
  cancelado: { label: "Cancelado", color: "text-red-400 border-red-800 bg-red-950/30" },
  concluido: { label: "Concluído", color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
  nao_compareceu: { label: "Não compareceu", color: "text-red-800 border-red-900 bg-red-950/40" },
  // legacy
  pendente: { label: "Pendente", color: "text-yellow-400 border-yellow-800 bg-yellow-950/30" },
};

const PAGAMENTO_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  credito: "Cartão Crédito",
  debito: "Cartão Débito",
  outro: "Outro",
};

const DEFAULT_TEMPLATE = `Olá {nome_cliente}! Sou {nome_secretaria} do {nome_studio}.

Sua solicitação para *{servico}* em *{data}* às *{horario}* foi recebida! ✨

Para confirmar seu horário, solicitamos um sinal de *{sinal_percentual}%* do valor total.

💰 Valor total: R$ {valor_total}
💳 Sinal: R$ {valor_sinal}
💵 Restante no dia: R$ {valor_restante}

📲 Chave PIX: {chave_pix}
👤 Nome: {nome_recebedor}

Após o pagamento, envie o comprovante por aqui para confirmarmos seu agendamento. 💕`;

function buildWhatsAppMessage(
  agendamento: Agendamento,
  config: AdminConfig | null | undefined,
  sinalPct: number
): string {
  const template = config?.mensagem_whatsapp_template || DEFAULT_TEMPLATE;
  const valorTotal = agendamento.servico?.preco ?? 0;
  const valorSinal = Math.round((valorTotal * sinalPct) / 100 * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorSinal) * 100) / 100;

  // Format date nicely
  let dataFormatada = agendamento.data ?? "";
  if (dataFormatada) {
    const [y, m, d] = dataFormatada.split("-");
    dataFormatada = `${d}/${m}/${y}`;
  }

  return template
    .replace(/{nome_cliente}/g, agendamento.nome_cliente)
    .replace(/{nome_secretaria}/g, config?.nome_secretaria || "Secretaria")
    .replace(/{nome_studio}/g, config?.nome_studio || "Studio")
    .replace(/{data}/g, dataFormatada)
    .replace(/{horario}/g, agendamento.hora_inicio || "")
    .replace(/{servico}/g, agendamento.servico?.nome || agendamento.servico_nome)
    .replace(/{valor_total}/g, valorTotal.toFixed(2).replace(".", ","))
    .replace(/{sinal_percentual}/g, String(sinalPct))
    .replace(/{valor_sinal}/g, valorSinal.toFixed(2).replace(".", ","))
    .replace(/{chave_pix}/g, config?.chave_pix || "—")
    .replace(/{nome_recebedor}/g, config?.nome_recebedor_pix || "—")
    .replace(/{valor_restante}/g, valorRestante.toFixed(2).replace(".", ","));
}

export default function AgendamentoCard({ agendamento, onStatusChange, onUpdated, adminConfig }: Props) {
  const [loading, setLoading] = useState(false);
  const [showExecucao, setShowExecucao] = useState(false);
  const [current, setCurrent] = useState<Agendamento>(agendamento);

  // Sinal section state
  const defaultPct = adminConfig?.sinal_percentual_padrao ?? 50;
  const [sinalPct, setSinalPct] = useState<number>(current.sinal_percentual ?? defaultPct);
  const [showSinalForm, setShowSinalForm] = useState(false);
  const [sinalValorInput, setSinalValorInput] = useState("");
  const [sinalForma, setSinalForma] = useState("pix");
  const [savingSinal, setSavingSinal] = useState(false);

  const config = STATUS_CONFIG[current.status] ?? STATUS_CONFIG.solicitacao;

  const canRegisterExecution = current.status === "confirmado";
  const valorTotal = current.servico?.preco ?? 0;
  const valorSinal = Math.round((valorTotal * sinalPct) / 100 * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorSinal) * 100) / 100;

  // Is appointment past its end time?
  const isPast = current.data_hora_fim ? new Date(current.data_hora_fim) < new Date() : false;

  async function handleAction(status: string) {
    setLoading(true);
    await onStatusChange(current.id, status);
    setLoading(false);
  }

  function handleExecucaoSaved(updated: Agendamento) {
    const merged: Agendamento = {
      ...current,
      status: updated.status ?? current.status,
      servico_executado: updated.servico_executado,
      preco_cobrado: updated.preco_cobrado,
      preco_original: updated.preco_original ?? current.preco_original,
      tipo_ajuste_preco: updated.tipo_ajuste_preco,
      motivo_ajuste: updated.motivo_ajuste,
      forma_pagamento: updated.forma_pagamento,
      observacoes_execucao: updated.observacoes_execucao,
      executado_em: updated.executado_em,
    };
    setCurrent(merged);
    setShowExecucao(false);
    onUpdated?.(merged);
  }

  async function handleWhatsApp() {
    // Send WhatsApp and update status to aguardando_sinal
    const telefone = current.telefone.replace(/\D/g, "");
    const msg = buildWhatsAppMessage(current, adminConfig, sinalPct);
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    // Save whatsapp_enviado_em, sinal_percentual, and move to aguardando_sinal
    const res = await fetch(`/api/agendamentos/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "aguardando_sinal",
        sinal_percentual: sinalPct,
        whatsapp_enviado_em: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      const merged: Agendamento = { ...current, ...updated, servico: current.servico, data: current.data, hora_inicio: current.hora_inicio, hora_fim: current.hora_fim };
      setCurrent(merged);
      onUpdated?.(merged);
      onStatusChange(current.id, "aguardando_sinal");
    }
  }

  async function handleConfirmSinal() {
    setSavingSinal(true);
    const sinalValorNum = parseFloat(sinalValorInput.replace(",", ".")) || valorSinal;
    const restante = Math.round((valorTotal - sinalValorNum) * 100) / 100;
    const res = await fetch(`/api/agendamentos/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "confirmado",
        sinal_status: "pago",
        sinal_valor: sinalValorNum,
        sinal_forma_pagamento: sinalForma,
        sinal_pago_em: new Date().toISOString(),
        valor_restante: restante,
      }),
    });
    setSavingSinal(false);
    if (res.ok) {
      const updated = await res.json();
      const merged: Agendamento = {
        ...current,
        ...updated,
        servico: current.servico,
        data: current.data,
        hora_inicio: current.hora_inicio,
        hora_fim: current.hora_fim,
      };
      setCurrent(merged);
      setShowSinalForm(false);
      onUpdated?.(merged);
      onStatusChange(current.id, "confirmado");
    }
  }

  const precoCobrado = current.preco_cobrado;
  const precoOriginal = current.preco_original ?? current.servico?.preco;
  const tipoAjuste = current.tipo_ajuste_preco;

  return (
    <>
      <div className="border border-[rgba(201,168,76,0.15)] bg-[#141414] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Horário */}
          <div className="shrink-0 text-center sm:w-20">
            <p className="font-display text-2xl text-[#C9A84C]">
              {current.hora_inicio}
            </p>
            <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
              até {current.hora_fim}
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="font-display text-lg text-[#F5F0E8]">
                  {current.nome_cliente}
                </h4>
                <p className="text-[#C9A84C] text-sm font-sans">
                  {current.servico?.nome ?? current.servico_nome}
                </p>
              </div>
              <span className={`border px-2 py-1 text-xs font-sans shrink-0 ${config.color}`}>
                {config.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-sans text-[rgba(245,240,232,0.5)]">
              <span>{current.telefone}</span>
              {current.email && <span>{current.email}</span>}
              {current.servico && (
                <span>
                  {formatDuration(current.servico.duracao_minutos)} ·{" "}
                  {formatCurrency(current.servico.preco)}
                </span>
              )}
            </div>

            {current.observacoes && (
              <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans mt-2 italic">
                &ldquo;{current.observacoes}&rdquo;
              </p>
            )}

            {/* Sinal info (aguardando_sinal) */}
            {current.status === "aguardando_sinal" && (
              <div className="mt-3 p-3 bg-orange-950/20 border border-orange-800/40 text-xs font-sans text-orange-300 space-y-0.5">
                <p className="font-medium text-orange-400 mb-1">Aguardando comprovante do sinal</p>
                {current.whatsapp_enviado_em && (
                  <p>WhatsApp enviado · {new Date(current.whatsapp_enviado_em).toLocaleString("pt-BR")}</p>
                )}
                {valorTotal > 0 && (
                  <p>Sinal de {sinalPct}%: {formatCurrency(valorSinal)} · Restante: {formatCurrency(valorRestante)}</p>
                )}
              </div>
            )}

            {/* Sinal paid info (confirmado with sinal_status=pago) */}
            {current.status === "confirmado" && current.sinal_status === "pago" && (
              <div className="mt-3 p-3 bg-green-950/20 border border-green-800/40 text-xs font-sans space-y-0.5">
                <p className="text-green-400 font-medium">Sinal recebido ✓</p>
                {current.sinal_valor !== null && current.sinal_valor !== undefined && (
                  <p className="text-[rgba(245,240,232,0.5)]">
                    {formatCurrency(Number(current.sinal_valor))}
                    {current.sinal_forma_pagamento ? ` via ${PAGAMENTO_LABEL[current.sinal_forma_pagamento] ?? current.sinal_forma_pagamento}` : ""}
                    {current.valor_restante !== null && current.valor_restante !== undefined
                      ? ` · Restante: ${formatCurrency(Number(current.valor_restante))}`
                      : ""}
                  </p>
                )}
              </div>
            )}

            {/* Execution info (concluido) */}
            {current.status === "concluido" && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {precoCobrado !== null && precoCobrado !== undefined && (
                  <span className="text-emerald-400 text-sm font-sans font-medium">
                    {formatCurrency(precoCobrado)}
                  </span>
                )}
                {tipoAjuste === "desconto" && (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs font-sans border border-yellow-800 bg-yellow-950/30 px-2 py-0.5">
                    <TrendingDown size={11} />
                    Desconto
                    {precoOriginal && precoCobrado !== null && precoCobrado !== undefined
                      ? ` ${formatCurrency(precoOriginal - precoCobrado)}`
                      : ""}
                  </span>
                )}
                {tipoAjuste === "acrescimo" && (
                  <span className="flex items-center gap-1 text-blue-400 text-xs font-sans border border-blue-800 bg-blue-950/30 px-2 py-0.5">
                    <TrendingUp size={11} />
                    Acréscimo
                    {precoOriginal && precoCobrado !== null && precoCobrado !== undefined
                      ? ` ${formatCurrency(precoCobrado - precoOriginal)}`
                      : ""}
                  </span>
                )}
                {current.forma_pagamento && (
                  <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans border border-[rgba(255,255,255,0.08)] px-2 py-0.5">
                    {PAGAMENTO_LABEL[current.forma_pagamento] ?? current.forma_pagamento}
                  </span>
                )}
                {current.motivo_ajuste && (
                  <span className="text-[rgba(245,240,232,0.35)] text-xs font-sans italic">
                    {current.motivo_ajuste}
                  </span>
                )}
              </div>
            )}

            {/* ── Sinal & Pagamento section ── */}
            {(current.status === "solicitacao" || current.status === "aguardando_sinal") && valorTotal > 0 && (
              <div className="mt-4 border border-[rgba(201,168,76,0.15)] p-3 space-y-3">
                <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans">
                  Sinal & Pagamento
                </p>

                {/* Sinal % */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={sinalPct}
                        onChange={(e) => setSinalPct(Number(e.target.value))}
                        className="flex-1 accent-[#C9A84C]"
                      />
                      <span className="text-[#C9A84C] text-sm font-sans font-medium w-10 text-right shrink-0">
                        {sinalPct}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[rgba(245,240,232,0.4)] text-xs font-sans mt-1">
                      <span>Total: {formatCurrency(valorTotal)}</span>
                      <span>Sinal: {formatCurrency(valorSinal)}</span>
                      <span>Restante: {formatCurrency(valorRestante)}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp button */}
                {current.status === "solicitacao" && (
                  <button
                    onClick={handleWhatsApp}
                    disabled={loading}
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#25D366]/10 border border-[#25D366]/40 text-[#25D366] text-sm font-sans hover:bg-[#25D366]/20 transition-colors disabled:opacity-50"
                  >
                    <MessageCircle size={15} />
                    Enviar WhatsApp com cobrança do sinal
                  </button>
                )}

                {/* Confirm sinal received (aguardando_sinal) */}
                {current.status === "aguardando_sinal" && (
                  <>
                    {!showSinalForm ? (
                      <button
                        onClick={() => { setSinalValorInput(valorSinal.toFixed(2).replace(".", ",")); setShowSinalForm(true); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 bg-green-950/20 border border-green-800/60 text-green-400 text-sm font-sans hover:bg-green-950/40 transition-colors"
                      >
                        <CheckCircle2 size={15} />
                        Confirmar sinal recebido
                      </button>
                    ) : (
                      <div className="space-y-2.5 p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
                        <p className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider">Sinal recebido</p>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans block mb-1">Valor (R$)</label>
                            <input
                              type="text"
                              value={sinalValorInput}
                              onChange={(e) => setSinalValorInput(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.8)] text-sm font-sans px-2.5 py-1.5 focus:outline-none focus:border-[#C9A84C]"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans block mb-1">Forma</label>
                            <select
                              value={sinalForma}
                              onChange={(e) => setSinalForma(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.8)] text-sm font-sans px-2.5 py-1.5 focus:outline-none focus:border-[#C9A84C]"
                            >
                              <option value="pix">PIX</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="credito">Crédito</option>
                              <option value="debito">Débito</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowSinalForm(false)}
                            className="flex-1 py-1.5 text-xs font-sans border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleConfirmSinal}
                            disabled={savingSinal}
                            className="flex-1 py-1.5 text-xs font-sans bg-green-900/60 border border-green-700 text-green-300 hover:bg-green-900/80 transition-colors disabled:opacity-50"
                          >
                            {savingSinal ? "Salvando..." : "Confirmar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {canRegisterExecution && (
              <button
                onClick={() => setShowExecucao(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans border border-[#C9A84C] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
              >
                <ClipboardCheck size={13} />
                Registrar execução
              </button>
            )}
            {/* Não compareceu — only for confirmado after the appointment time */}
            {current.status === "confirmado" && isPast && (
              <button
                onClick={() => handleAction("nao_compareceu")}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans border border-red-900 text-red-600 hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                <UserX size={13} />
                Não compareceu
              </button>
            )}
            {current.status !== "cancelado" && current.status !== "concluido" && current.status !== "nao_compareceu" && (
              <div className="flex gap-2">
                {(current.status === "solicitacao" || current.status === "aguardando_sinal") && (
                  <button
                    onClick={() => handleAction("confirmado")}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-sans border border-green-800 text-green-400 hover:bg-green-950/30 transition-colors disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                )}
                <button
                  onClick={() => handleAction("cancelado")}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-sans border border-red-900 text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExecucao && (
        <ExecucaoModal
          agendamento={current}
          onClose={() => setShowExecucao(false)}
          onSaved={handleExecucaoSaved}
        />
      )}
    </>
  );
}
