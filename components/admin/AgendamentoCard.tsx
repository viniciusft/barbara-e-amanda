"use client";

import { useState } from "react";
import { Agendamento, AdminConfig } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { calcSinal } from "@/lib/sinal";
import {
  ClipboardCheck, TrendingDown, TrendingUp, MessageCircle,
  CheckCircle2, UserX, AlertTriangle,
} from "lucide-react";
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
  nao_compareceu: { label: "Não compareceu", color: "text-red-700 border-red-900 bg-red-950/40" },
  pendente: { label: "Pendente", color: "text-yellow-400 border-yellow-800 bg-yellow-950/30" },
};

const PAGAMENTO_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  credito: "Cartão Crédito",
  debito: "Cartão Débito",
  outro: "Outro",
};

const DEFAULT_TEMPLATE = `Ola {nome_cliente}! Sou {nome_secretaria} do {nome_studio}.

Sua solicitacao para *{servico}* em *{data}* as *{horario}* foi recebida!

Para confirmar seu horario, solicitamos um sinal de *{sinal_percentual}%* do valor total.

Valor total: R$ {valor_total}
Sinal ({sinal_percentual}%): R$ {valor_sinal}
Restante no dia: R$ {valor_restante}

Chave PIX: {chave_pix}
Nome: {nome_recebedor}

Apos o pagamento, envie o comprovante por aqui. Obrigada!`;

function buildWhatsAppMessage(
  agendamento: Agendamento,
  config: AdminConfig | null | undefined,
  sinalPct: number
): string {
  const template = config?.mensagem_whatsapp_template || DEFAULT_TEMPLATE;
  const valorTotal = agendamento.servico?.preco ?? 0;
  const valorSinal = Math.round((valorTotal * sinalPct) / 100 * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorSinal) * 100) / 100;

  let dataFormatada = agendamento.data ?? "";
  if (dataFormatada) {
    const [y, m, d] = dataFormatada.split("-");
    dataFormatada = `${d}/${m}/${y}`;
  }

  return template
    .replace(/\{nome_cliente\}/g, agendamento.nome_cliente)
    .replace(/\{nome_secretaria\}/g, config?.nome_secretaria || "Secretaria")
    .replace(/\{nome_studio\}/g, config?.nome_studio || "Studio")
    .replace(/\{data\}/g, dataFormatada)
    .replace(/\{horario\}/g, agendamento.hora_inicio || "")
    .replace(/\{servico\}/g, agendamento.servico?.nome || agendamento.servico_nome)
    .replace(/\{valor_total\}/g, valorTotal.toFixed(2).replace(".", ","))
    .replace(/\{sinal_percentual\}/g, String(sinalPct))
    .replace(/\{valor_sinal\}/g, valorSinal.toFixed(2).replace(".", ","))
    .replace(/\{chave_pix\}/g, config?.chave_pix || "—")
    .replace(/\{nome_recebedor\}/g, config?.nome_recebedor_pix || "—")
    .replace(/\{valor_restante\}/g, valorRestante.toFixed(2).replace(".", ","));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-3">
      {children}
    </p>
  );
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">
            {label}
          </p>
          <div className="text-sm font-sans text-[rgba(245,240,232,0.85)]">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function AgendamentoCard({ agendamento, onStatusChange, onUpdated, adminConfig }: Props) {
  const [loading, setLoading] = useState(false);
  const [showExecucao, setShowExecucao] = useState(false);
  const [current, setCurrent] = useState<Agendamento>(agendamento);

  // Sinal section state — initialize using per-service config if available
  const valorTotalInit = agendamento.servico?.preco ?? 0;
  const { sinalPct: defaultSinalPct } = calcSinal(
    valorTotalInit,
    agendamento,
    agendamento.servico,
    adminConfig
  );
  const [sinalPct, setSinalPct] = useState<number>(defaultSinalPct);
  const [showSinalForm, setShowSinalForm] = useState(false);
  const [sinalValorInput, setSinalValorInput] = useState("");
  const [sinalForma, setSinalForma] = useState("pix");
  const [savingSinal, setSavingSinal] = useState(false);

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reembolsoObs, setReembolsoObs] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);

  const statusCfg = STATUS_CONFIG[current.status] ?? STATUS_CONFIG.solicitacao;
  const valorTotal = current.servico?.preco ?? 0;
  const valorSinal = Math.round((valorTotal * sinalPct) / 100 * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorSinal) * 100) / 100;

  const isPast = current.data_hora_fim ? new Date(current.data_hora_fim) < new Date() : false;
  const hasSinalPago = current.sinal_status === "pago";

  function mergeUpdated(updated: Partial<Agendamento>): Agendamento {
    return {
      ...current,
      ...updated,
      servico: current.servico,
      data: current.data,
      hora_inicio: current.hora_inicio,
      hora_fim: current.hora_fim,
      hora_inicio_cabelo: current.hora_inicio_cabelo,
      hora_inicio_maquiagem: current.hora_inicio_maquiagem,
    };
  }

  async function patchAndUpdate(body: Record<string, unknown>) {
    const res = await fetch(`/api/agendamentos/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return false;
    const updated = await res.json();
    const merged = mergeUpdated(updated);
    setCurrent(merged);
    onUpdated?.(merged);
    return true;
  }

  async function handleSimpleStatus(status: string) {
    setLoading(true);
    await patchAndUpdate({ status });
    onStatusChange(current.id, status);
    setLoading(false);
  }

  function handleClickCancel() {
    if (hasSinalPago) {
      setShowCancelDialog(true);
    } else {
      handleSimpleStatus("cancelado");
    }
  }

  async function handleCancelWithReembolso(devolvido: boolean) {
    setSavingCancel(true);
    const body: Record<string, unknown> = { status: "cancelado" };
    if (devolvido) {
      body.sinal_status = "reembolsado";
      body.sinal_reembolsado_em = new Date().toISOString();
      if (reembolsoObs.trim()) body.sinal_reembolso_obs = reembolsoObs.trim();
    }
    const ok = await patchAndUpdate(body);
    setSavingCancel(false);
    if (ok) {
      setShowCancelDialog(false);
      onStatusChange(current.id, "cancelado");
    }
  }

  async function handleWhatsApp() {
    const telefone = current.telefone.replace(/\D/g, "");
    const msg = buildWhatsAppMessage(current, adminConfig, sinalPct);
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    await patchAndUpdate({
      status: "aguardando_sinal",
      sinal_percentual: sinalPct,
      whatsapp_enviado_em: new Date().toISOString(),
    });
    onStatusChange(current.id, "aguardando_sinal");
  }

  async function handleConfirmSinal() {
    setSavingSinal(true);
    const sinalValorNum = parseFloat(sinalValorInput.replace(",", ".")) || valorSinal;
    const restante = Math.round((valorTotal - sinalValorNum) * 100) / 100;
    const ok = await patchAndUpdate({
      status: "confirmado",
      sinal_status: "pago",
      sinal_valor: sinalValorNum,
      sinal_forma_pagamento: sinalForma,
      sinal_pago_em: new Date().toISOString(),
      valor_restante: restante,
    });
    setSavingSinal(false);
    if (ok) {
      setShowSinalForm(false);
      onStatusChange(current.id, "confirmado");
    }
  }

  function handleExecucaoSaved(updated: Agendamento) {
    const merged = mergeUpdated(updated);
    setCurrent(merged);
    setShowExecucao(false);
    onUpdated?.(merged);
  }

  // Computed display values
  const precoCobrado = current.preco_cobrado;
  const precoOriginal = current.preco_original ?? current.servico?.preco;
  const tipoAjuste = current.tipo_ajuste_preco;

  // Format date/time for display
  let dataDisplay = "";
  if (current.data) {
    const [y, m, d] = current.data.split("-");
    dataDisplay = `${d}/${m}/${y}`;
  }

  const terminalStatus = current.status === "cancelado" || current.status === "concluido" || current.status === "nao_compareceu";

  return (
    <>
      <div className="space-y-5">
        {/* ── Header: name + service + status ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-[#F5F0E8] font-light leading-tight">
              {current.nome_cliente}
            </h3>
            <p className="text-[#C9A84C] text-sm font-sans mt-0.5">
              {current.servico?.nome ?? current.servico_nome}
            </p>
          </div>
          <span className={`border px-2.5 py-1 text-xs font-sans shrink-0 mt-1 ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* ── Appointment info ── */}
        <div className="border-t border-[rgba(201,168,76,0.08)] pt-4">
          <SectionTitle>Agendamento</SectionTitle>
          <InfoGrid items={[
            { label: "Data", value: dataDisplay || "—" },
            { label: "Horário", value: current.hora_inicio ? `${current.hora_inicio} – ${current.hora_fim ?? ""}` : "—" },
            { label: "Duração", value: current.servico ? formatDuration(current.servico.duracao_minutos) : `${current.servico_duracao}min` },
            { label: "Valor", value: current.servico ? formatCurrency(current.servico.preco) : "—" },
            { label: "Telefone", value: <a href={`tel:${current.telefone}`} className="hover:text-[#C9A84C] transition-colors">{current.telefone}</a> },
            ...(current.email ? [{ label: "Email", value: current.email }] : []),
          ]} />
          {current.observacoes && (
            <p className="mt-3 text-sm font-sans text-[rgba(245,240,232,0.4)] italic border-l-2 border-[rgba(201,168,76,0.2)] pl-3">
              {current.observacoes}
            </p>
          )}
        </div>

        {/* ── Sinal & Pagamento (solicitacao / aguardando_sinal) ── */}
        {(current.status === "solicitacao" || current.status === "aguardando_sinal") && valorTotal > 0 && (
          <div className="border-t border-[rgba(201,168,76,0.08)] pt-4">
            <SectionTitle>Sinal & Pagamento</SectionTitle>

            {/* Percentage slider */}
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10} max={100} step={5}
                  value={sinalPct}
                  onChange={(e) => setSinalPct(Number(e.target.value))}
                  className="flex-1 accent-[#C9A84C]"
                />
                <span className="text-[#C9A84C] text-sm font-sans font-medium w-10 text-right shrink-0">
                  {sinalPct}%
                </span>
              </div>
              <div className="grid grid-cols-3 text-[rgba(245,240,232,0.4)] text-xs font-sans mt-1.5">
                <span>Total: {formatCurrency(valorTotal)}</span>
                <span className="text-center">Sinal: {formatCurrency(valorSinal)}</span>
                <span className="text-right">Restante: {formatCurrency(valorRestante)}</span>
              </div>
            </div>

            {/* Sinal waiting info */}
            {current.status === "aguardando_sinal" && (
              <div className="mb-3 p-3 bg-orange-950/20 border border-orange-800/40 text-xs font-sans text-orange-300 space-y-0.5">
                <p className="font-medium text-orange-400 mb-1">Aguardando comprovante do sinal</p>
                {current.whatsapp_enviado_em && (
                  <p>WhatsApp enviado em {new Date(current.whatsapp_enviado_em).toLocaleString("pt-BR")}</p>
                )}
              </div>
            )}

            {/* WhatsApp button */}
            {current.status === "solicitacao" && (
              <button
                onClick={handleWhatsApp}
                disabled={loading}
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#25D366]/10 border border-[#25D366]/40 text-[#25D366] text-sm font-sans hover:bg-[#25D366]/20 transition-colors disabled:opacity-50 mb-2"
              >
                <MessageCircle size={15} />
                Enviar WhatsApp com cobrança do sinal
              </button>
            )}

            {/* Confirm sinal received */}
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
                  <div className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] space-y-2.5">
                    <p className="text-[rgba(245,240,232,0.5)] text-xs font-sans uppercase tracking-wider">Sinal recebido</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[rgba(245,240,232,0.35)] text-[10px] font-sans block mb-1">Valor (R$)</label>
                        <input
                          type="text"
                          value={sinalValorInput}
                          onChange={(e) => setSinalValorInput(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.8)] text-sm font-sans px-2.5 py-1.5 focus:outline-none focus:border-[#C9A84C]"
                        />
                      </div>
                      <div>
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

        {/* ── Sinal info when confirmed (with sinal pago) ── */}
        {current.status === "confirmado" && hasSinalPago && (
          <div className="border-t border-[rgba(201,168,76,0.08)] pt-4">
            <SectionTitle>Sinal Recebido</SectionTitle>
            <div className="p-3 bg-green-950/20 border border-green-800/40 text-sm font-sans space-y-1">
              <p className="text-green-400 font-medium">Sinal confirmado ✓</p>
              {current.sinal_valor !== null && current.sinal_valor !== undefined && (
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Valor sinal</p>
                    <p className="text-[rgba(245,240,232,0.8)]">{formatCurrency(Number(current.sinal_valor))}</p>
                  </div>
                  {current.sinal_forma_pagamento && (
                    <div>
                      <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Via</p>
                      <p className="text-[rgba(245,240,232,0.8)]">{PAGAMENTO_LABEL[current.sinal_forma_pagamento] ?? current.sinal_forma_pagamento}</p>
                    </div>
                  )}
                  {current.valor_restante !== null && current.valor_restante !== undefined && (
                    <div>
                      <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Restante</p>
                      <p className="text-[rgba(245,240,232,0.8)]">{formatCurrency(Number(current.valor_restante))}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Execution info (concluido) ── */}
        {current.status === "concluido" && (
          <div className="border-t border-[rgba(201,168,76,0.08)] pt-4">
            <SectionTitle>Execução</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {precoCobrado !== null && precoCobrado !== undefined && (
                <div>
                  <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Cobrado</p>
                  <p className="text-emerald-400 font-medium">{formatCurrency(precoCobrado)}</p>
                </div>
              )}
              {tipoAjuste && (
                <div>
                  <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Ajuste</p>
                  <span className={`flex items-center gap-1 text-xs font-sans border px-2 py-0.5 w-fit ${tipoAjuste === "desconto" ? "text-yellow-400 border-yellow-800 bg-yellow-950/30" : "text-blue-400 border-blue-800 bg-blue-950/30"}`}>
                    {tipoAjuste === "desconto" ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {tipoAjuste === "desconto" ? "Desconto" : "Acréscimo"}
                    {precoOriginal && precoCobrado !== null && precoCobrado !== undefined && (
                      <span className="ml-0.5">{formatCurrency(Math.abs(precoCobrado - precoOriginal))}</span>
                    )}
                  </span>
                </div>
              )}
              {current.forma_pagamento && (
                <div>
                  <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Pagamento</p>
                  <p className="text-[rgba(245,240,232,0.8)] text-sm">{PAGAMENTO_LABEL[current.forma_pagamento] ?? current.forma_pagamento}</p>
                </div>
              )}
            </div>
            {current.motivo_ajuste && (
              <p className="mt-2 text-[rgba(245,240,232,0.4)] text-xs font-sans italic">{current.motivo_ajuste}</p>
            )}
            {hasSinalPago && current.sinal_valor !== null && current.sinal_valor !== undefined && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[rgba(255,255,255,0.05)] pt-3">
                <div>
                  <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Sinal pago</p>
                  <p className="text-[rgba(245,240,232,0.7)] text-sm">{formatCurrency(Number(current.sinal_valor))}</p>
                </div>
                {current.valor_restante !== null && current.valor_restante !== undefined && (
                  <div>
                    <p className="text-[10px] text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-0.5">Restante cobrado</p>
                    <p className="text-[rgba(245,240,232,0.7)] text-sm">{formatCurrency(Number(current.valor_restante))}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        {!terminalStatus && (
          <div className="border-t border-[rgba(201,168,76,0.08)] pt-4 flex flex-wrap gap-2">
            {/* Confirm directly (bypass WhatsApp flow) */}
            {(current.status === "solicitacao" || current.status === "aguardando_sinal") && (
              <button
                onClick={() => handleSimpleStatus("confirmado")}
                disabled={loading}
                className="px-4 py-2 text-xs font-sans border border-green-800 text-green-400 hover:bg-green-950/30 transition-colors disabled:opacity-50"
              >
                Confirmar direto
              </button>
            )}

            {/* Register execution */}
            {current.status === "confirmado" && (
              <button
                onClick={() => setShowExecucao(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans border border-[#C9A84C] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
              >
                <ClipboardCheck size={13} />
                Registrar execução
              </button>
            )}

            {/* Nao compareceu */}
            {current.status === "confirmado" && isPast && (
              <button
                onClick={() => handleSimpleStatus("nao_compareceu")}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans border border-red-900 text-red-600 hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                <UserX size={13} />
                Não compareceu
              </button>
            )}

            {/* Cancel */}
            <button
              onClick={handleClickCancel}
              disabled={loading}
              className="px-4 py-2 text-xs font-sans border border-red-900/60 text-red-500 hover:bg-red-950/30 transition-colors disabled:opacity-50 ml-auto"
            >
              Cancelar agendamento
            </button>
          </div>
        )}
      </div>

      {/* ── Cancel + Sinal Reembolso Dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1a1a1a] border border-red-800/60 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display text-lg text-[#F5F0E8] font-light">Cancelar agendamento</h4>
                <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mt-1">
                  Este agendamento tem um sinal pago de{" "}
                  <span className="text-[#C9A84C]">{formatCurrency(Number(current.sinal_valor))}</span>.
                  O sinal foi reembolsado para a cliente?
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-1.5">
                Motivo do cancelamento (opcional)
              </label>
              <input
                type="text"
                value={reembolsoObs}
                onChange={(e) => setReembolsoObs(e.target.value)}
                placeholder="Ex: cliente desmarcou, emergência..."
                className="w-full bg-[#0f0f0f] border border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.8)] text-sm font-sans px-3 py-2 focus:outline-none focus:border-[rgba(201,168,76,0.4)]"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleCancelWithReembolso(true)}
                disabled={savingCancel}
                className="w-full px-4 py-2.5 text-sm font-sans bg-blue-950/30 border border-blue-800/60 text-blue-400 hover:bg-blue-950/50 transition-colors disabled:opacity-50"
              >
                Sim, sinal foi devolvido para a cliente
              </button>
              <button
                onClick={() => handleCancelWithReembolso(false)}
                disabled={savingCancel}
                className="w-full px-4 py-2.5 text-sm font-sans bg-red-950/20 border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
              >
                Não, sinal foi retido (virou receita)
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={savingCancel}
                className="w-full px-4 py-2.5 text-sm font-sans border border-[rgba(255,255,255,0.08)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

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
