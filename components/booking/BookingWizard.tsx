"use client";

import { useEffect, useState } from "react";
import { Servico, SlotDisponivel } from "@/types";
import { tocarSom } from "@/lib/sons";
import StepServicos from "./StepServicos";
import StepAgenda from "./StepAgenda";
import StepDados from "./StepDados";
import StepConfirmacao from "./StepConfirmacao";

export interface BookingData {
  servico: Servico | null;
  data: string;
  slot: SlotDisponivel | null;
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
}

export interface PublicConfig {
  whatsapp: string;
  mensagem_casamento: string;
  mensagem_destination_beauty: string;
  mensagem_horario_personalizado: string;
  titulo_casamento: string;
  descricao_casamento: string;
  titulo_destination_beauty: string;
  descricao_destination_beauty: string;
}

const DEFAULT_CONFIG: PublicConfig = {
  whatsapp: "",
  mensagem_casamento: "Olá! Gostaria de saber mais sobre os pacotes para casamento e noivas. 💍",
  mensagem_destination_beauty: "Olá! Gostaria de saber mais sobre o serviço de Destination Beauty — atendimento no local de minha preferência. Podem me ajudar? ✨",
  mensagem_horario_personalizado: "Olá! Não encontrei um horário disponível que se encaixe na minha agenda. Gostaria de solicitar um horário personalizado. Podem me ajudar? 😊",
  titulo_casamento: "Casamento 💍",
  descricao_casamento: "Pacote exclusivo para noivas e madrinhas. Entre em contato para montar o seu look perfeito.",
  titulo_destination_beauty: "Destination Beauty ✈️",
  descricao_destination_beauty: "Levamos a experiência de maquiagem e penteado até você. Ideal para eventos, ensaios, casamentos ou qualquer ocasião especial no local de sua preferência.",
};

const INITIAL_DATA: BookingData = {
  servico: null,
  data: "",
  slot: null,
  nome: "",
  telefone: "",
  email: "",
  observacoes: "",
};

const STEPS = ["Serviço", "Data & Horário", "Seus Dados", "Solicitação"];

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>(INITIAL_DATA);
  const [booked, setBooked] = useState(false);
  const [slotTakenMsg, setSlotTakenMsg] = useState("");
  const [config, setConfig] = useState<PublicConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetch("/api/admin/perfil")
      .then((r) => r.json())
      .then((cfg) => {
        if (!cfg) return;
        setConfig({
          whatsapp: cfg.whatsapp?.replace(/\D/g, "") ?? "",
          mensagem_casamento: cfg.mensagem_casamento ?? DEFAULT_CONFIG.mensagem_casamento,
          mensagem_destination_beauty: cfg.mensagem_destination_beauty ?? DEFAULT_CONFIG.mensagem_destination_beauty,
          mensagem_horario_personalizado: cfg.mensagem_horario_personalizado ?? DEFAULT_CONFIG.mensagem_horario_personalizado,
          titulo_casamento: cfg.titulo_casamento ?? DEFAULT_CONFIG.titulo_casamento,
          descricao_casamento: cfg.descricao_casamento ?? DEFAULT_CONFIG.descricao_casamento,
          titulo_destination_beauty: cfg.titulo_destination_beauty ?? DEFAULT_CONFIG.titulo_destination_beauty,
          descricao_destination_beauty: cfg.descricao_destination_beauty ?? DEFAULT_CONFIG.descricao_destination_beauty,
        });
      })
      .catch(() => {});
  }, []);

  function updateData(partial: Partial<BookingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleReset() {
    setData(INITIAL_DATA);
    setStep(0);
    setBooked(false);
    setSlotTakenMsg("");
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8] py-8 px-6 text-center">
        <p className="text-[#A07830] text-sm tracking-[0.3em] uppercase font-sans mb-2">
          Studio
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-[#111111] font-light tracking-wide">
          Amanda & Barbara
        </h1>
        <p className="text-[#6B7280] text-sm mt-2 font-sans">
          Maquiagem • Cabelo
        </p>
      </header>

      {/* Progress */}
      {!booked && (
        <div className="bg-white border-b border-[#E5E0D8] py-6 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium border transition-all duration-300 ${
                        i < step
                          ? "bg-[#C9A84C] border-[#C9A84C] text-[#111111]"
                          : i === step
                          ? "border-[#C9A84C] text-[#C9A84C] bg-white"
                          : "border-[#E5E0D8] text-[#9CA3AF] bg-white"
                      }`}
                    >
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 font-sans hidden sm:block transition-colors ${
                        i === step
                          ? "text-[#C9A84C] font-semibold"
                          : i < step
                          ? "text-[#A07830]"
                          : "text-[#9CA3AF]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-2 transition-colors duration-300 ${
                        i < step ? "bg-[#C9A84C]" : "bg-[#E5E0D8]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          {step === 0 && (
            <StepServicos
              selected={data.servico}
              config={config}
              onSelect={(servico) => {
                tocarSom("selecao");
                updateData({ servico, slot: null, data: "" });
                goNext();
              }}
            />
          )}
          {step === 1 && (
            <>
              {slotTakenMsg && (
                <div className="mb-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-sans text-amber-700 rounded-lg">
                  {slotTakenMsg}
                </div>
              )}
              <StepAgenda
                servico={data.servico!}
                selectedData={data.data}
                selectedSlot={data.slot}
                config={config}
                onSelect={(date, slot) => {
                  tocarSom("selecao");
                  updateData({ data: date, slot });
                  setSlotTakenMsg("");
                  goNext();
                }}
                onBack={goBack}
              />
            </>
          )}
          {step === 2 && (
            <StepDados
              nome={data.nome}
              telefone={data.telefone}
              email={data.email}
              observacoes={data.observacoes}
              onChange={updateData}
              onNext={() => { tocarSom("avanco"); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <StepConfirmacao
              data={data}
              booked={booked}
              onConfirm={async () => {
                const res = await fetch("/api/agendamentos", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    servico_id: data.servico!.id,
                    nome_cliente: data.nome,
                    telefone_cliente: data.telefone,
                    email_cliente: data.email || undefined,
                    observacoes: data.observacoes || undefined,
                    data: data.data,
                    hora_inicio: data.slot!.hora_inicio,
                    ...(data.slot!.combo_ordem && {
                      combo_ordem: data.slot!.combo_ordem,
                      hora_maquiagem: data.slot!.hora_maquiagem,
                      hora_cabelo: data.slot!.hora_cabelo,
                    }),
                  }),
                });
                if (!res.ok) {
                  if (res.status === 409) {
                    updateData({ slot: null });
                    setSlotTakenMsg("Este horário acabou de ser reservado. Por favor selecione outro horário disponível.");
                    setStep(1);
                    return;
                  }
                  throw new Error("Erro ao realizar agendamento. Tente novamente.");
                }
                setBooked(true);
                tocarSom("sucesso");
                setSlotTakenMsg("");
              }}
              onBack={goBack}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-[#E5E0D8] py-6 text-center">
        <p className="text-[#9CA3AF] text-xs font-sans">
          Studio Amanda & Barbara — Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
