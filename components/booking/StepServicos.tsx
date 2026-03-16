"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Scissors, Clock, CheckCircle, MessageCircle, Plane } from "lucide-react";
import { PublicConfig } from "./BookingWizard";

interface Props {
  selected: Servico | null;
  config: PublicConfig;
  onSelect: (servico: Servico) => void;
}

const SUPORTE_MSG =
  "Ola! Tenho uma duvida sobre os agendamentos, podem me ajudar?";

function registrarContato(tipo: "casamento" | "destination_beauty" | "duvida") {
  fetch("/api/contatos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo }),
  }).catch(() => {}); // fire-and-forget, non-critical
}

export default function StepServicos({ selected, config, onSelect }: Props) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((svcs) => {
        if (Array.isArray(svcs)) setServicos(svcs);
        else setError("Erro ao carregar servicos");
      })
      .catch(() => setError("Erro ao carregar servicos"))
      .finally(() => setLoading(false));
  }, []);

  function waUrl(msg: string) {
    const number = config.whatsapp ? `55${config.whatsapp}` : "";
    return number
      ? `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#111111] font-light mb-2">
        Escolha o Serviço
      </h2>
      <p className="text-[#6B7280] font-sans text-sm mb-8">
        Selecione o serviço que deseja agendar
      </p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="border border-red-300 bg-red-50 p-4 text-red-600 text-sm font-sans rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && servicos.length === 0 && (
        <p className="text-[#9CA3AF] font-sans text-center py-12">
          Nenhum serviço disponível no momento.
        </p>
      )}

      <div className="grid gap-4">
        {servicos.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`text-left border overflow-hidden transition-all duration-200 flex rounded-xl ${
                isSelected
                  ? "border-2 border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                  : "border border-[#E5E0D8] bg-white hover:border-[#C9A84C] hover:shadow-sm"
              }`}
            >
              {/* Left: info (65%) */}
              <div className="flex-1 p-5 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-xl text-[#111111] font-medium leading-tight">
                    {s.nome}
                  </h3>
                  {isSelected && (
                    <CheckCircle
                      size={18}
                      className="text-[#C9A84C] shrink-0 mt-0.5"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                {s.descricao && (
                  <p className="text-[#6B7280] text-sm font-sans mb-3 leading-relaxed">
                    {s.descricao}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[#6B7280] text-xs font-sans">
                    <Clock size={12} strokeWidth={1.5} />
                    {formatDuration(s.duracao_minutos)}
                  </span>
                  <span className="font-display text-lg text-[#A07830] font-semibold">
                    {formatCurrency(s.preco)}
                  </span>
                </div>
              </div>

              {/* Right: image (35%) */}
              <div className="w-[35%] shrink-0 bg-[#EDEAE4] overflow-hidden relative" style={{ aspectRatio: "9/16" }}>
                {s.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imagem_url}
                    alt={s.nome}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors
                      size={28}
                      className="text-[#C9A84C]/40"
                      strokeWidth={1}
                    />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#C9A84C]/10" />
                )}
              </div>
            </button>
          );
        })}

        {/* ── Casamento special card ── */}
        {!loading && !error && (
          <a
            href={waUrl(config.mensagem_casamento)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => registrarContato("casamento")}
            className="text-left border-2 border-[#C9A84C] bg-amber-50/50 hover:bg-amber-50 transition-all duration-200 overflow-hidden relative block rounded-xl"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-xl text-[#111111] font-medium leading-tight">
                  {config.titulo_casamento}
                </h3>
                <span className="shrink-0 bg-[#C9A84C]/15 text-[#A07830] text-[9px] font-sans tracking-[0.15em] uppercase px-2 py-0.5 rounded">
                  Personalizado
                </span>
              </div>
              <p className="text-[#6B7280] text-sm font-sans mb-4 leading-relaxed">
                {config.descricao_casamento}
              </p>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs font-sans font-medium">
                <MessageCircle size={13} strokeWidth={1.5} />
                Falar pelo WhatsApp
              </div>
            </div>
          </a>
        )}

        {/* ── Destination Beauty special card ── */}
        {!loading && !error && (
          <a
            href={waUrl(config.mensagem_destination_beauty)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => registrarContato("destination_beauty")}
            className="text-left border-2 border-[#C9A84C] bg-amber-50/50 hover:bg-amber-50 transition-all duration-200 overflow-hidden relative block rounded-xl"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-xl text-[#111111] font-medium leading-tight">
                  {config.titulo_destination_beauty}
                </h3>
                <span className="shrink-0 bg-[#C9A84C]/15 text-[#A07830] text-[9px] font-sans tracking-[0.15em] uppercase px-2 py-0.5 rounded">
                  Especial
                </span>
              </div>
              <p className="text-[#6B7280] text-sm font-sans mb-4 leading-relaxed">
                {config.descricao_destination_beauty}
              </p>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs font-sans font-medium">
                <Plane size={13} strokeWidth={1.5} />
                Falar pelo WhatsApp
              </div>
            </div>
          </a>
        )}

        {/* ── Suporte / "Falar com a equipe" ── */}
        {!loading && !error && (
          <div className="mt-2 pt-5 border-t border-[#E5E0D8] flex flex-col items-center gap-3">
            <p className="text-[#9CA3AF] text-xs font-sans">
              Dúvidas sobre seu agendamento?
            </p>
            <a
              href={waUrl(SUPORTE_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarContato("duvida")}
              className="inline-flex items-center gap-2 border border-[#E5E0D8] text-[#6B7280] hover:border-[#C9A84C] hover:text-[#A07830] transition-colors text-sm font-sans px-4 py-2 rounded-lg"
            >
              <MessageCircle size={15} strokeWidth={1.5} className="shrink-0 text-[#25D366]" />
              Falar com alguém da equipe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
