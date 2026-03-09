"use client";

import { useState } from "react";
import { Servico, SlotDisponivel } from "@/types";
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgba(201,168,76,0.2)] py-8 px-6 text-center">
        <p className="text-[#C9A84C] text-sm tracking-[0.3em] uppercase font-sans mb-2">
          Studio
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-[#F5F0E8] font-light tracking-wide">
          Amanda & Barbara
        </h1>
        <p className="text-[rgba(245,240,232,0.5)] text-sm mt-2 font-sans">
          Maquiagem • Cabelo
        </p>
      </header>

      {/* Progress */}
      {!booked && (
        <div className="border-b border-[rgba(201,168,76,0.1)] py-6 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium border transition-all duration-300 ${
                        i < step
                          ? "bg-[#C9A84C] border-[#C9A84C] text-[#0a0a0a]"
                          : i === step
                          ? "border-[#C9A84C] text-[#C9A84C]"
                          : "border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.3)]"
                      }`}
                    >
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 font-sans hidden sm:block transition-colors ${
                        i === step
                          ? "text-[#C9A84C]"
                          : i < step
                          ? "text-[rgba(245,240,232,0.6)]"
                          : "text-[rgba(245,240,232,0.3)]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-2 transition-colors duration-300 ${
                        i < step
                          ? "bg-[#C9A84C]"
                          : "bg-[rgba(201,168,76,0.2)]"
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
              onSelect={(servico) => {
                updateData({ servico, slot: null, data: "" });
                goNext();
              }}
            />
          )}
          {step === 1 && (
            <>
              {slotTakenMsg && (
                <div className="mb-4 border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm font-sans text-amber-300">
                  {slotTakenMsg}
                </div>
              )}
              <StepAgenda
                servico={data.servico!}
                selectedData={data.data}
                selectedSlot={data.slot}
                onSelect={(date, slot) => {
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
              onNext={goNext}
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
                    // Slot was taken between selection and confirmation — go back silently
                    updateData({ slot: null });
                    setSlotTakenMsg("Este horário acabou de ser reservado. Por favor selecione outro horário disponível.");
                    setStep(1);
                    return;
                  }
                  throw new Error("Erro ao realizar agendamento. Tente novamente.");
                }
                setBooked(true);
                setSlotTakenMsg("");
              }}
              onBack={goBack}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-[rgba(201,168,76,0.1)] py-6 text-center">
        <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans">
          Studio Amanda & Barbara — Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
