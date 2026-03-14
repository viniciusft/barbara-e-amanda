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
      <h2 className="font-display text-3xl text-[#F5F0E8] font-light mb-2">
        Escolha o Servico
      </h2>
      <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8">
        Selecione o servico que deseja agendar
      </p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="border border-red-800 bg-red-950/20 p-4 text-red-400 text-sm font-sans">
          {error}
        </div>
      )}

      {!loading && !error && servicos.length === 0 && (
        <p className="text-[rgba(245,240,232,0.4)] font-sans text-center py-12">
          Nenhum servico disponivel no momento.
        </p>
      )}

      <div className="grid gap-4">
        {servicos.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`text-left border overflow-hidden transition-all duration-200 flex ${
                isSelected
                  ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)]"
                  : "border-[rgba(201,168,76,0.2)] bg-[#141414] hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.03)]"
              }`}
            >
              {/* Left: info (65%) */}
              <div className="flex-1 p-5 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-xl text-[#F5F0E8] font-medium leading-tight">
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
                  <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mb-3 leading-relaxed">
                    {s.descricao}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[rgba(245,240,232,0.4)] text-xs font-sans">
                    <Clock size={12} strokeWidth={1.5} />
                    {formatDuration(s.duracao_minutos)}
                  </span>
                  <span className="font-display text-lg text-[#C9A84C]">
                    {formatCurrency(s.preco)}
                  </span>
                </div>
              </div>

              {/* Right: image (35%) */}
              <div className="w-[35%] shrink-0 bg-[#1a1a1a] overflow-hidden relative" style={{ aspectRatio: "9/16" }}>
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
                      className="text-[rgba(201,168,76,0.15)]"
                      strokeWidth={1}
                    />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-[rgba(201,168,76,0.12)]" />
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
            className="text-left border border-[rgba(201,168,76,0.4)] bg-[#141414] hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.05)] transition-all duration-200 overflow-hidden relative block"
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-[rgba(201,168,76,0.0)] via-[#C9A84C] to-[rgba(201,168,76,0.0)]" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-xl text-[#F5F0E8] font-medium leading-tight">
                  {config.titulo_casamento}
                </h3>
                <span className="shrink-0 border border-[rgba(201,168,76,0.5)] text-[#C9A84C] text-[9px] font-sans tracking-[0.15em] uppercase px-2 py-0.5">
                  Personalizado
                </span>
              </div>
              <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mb-4 leading-relaxed">
                {config.descricao_casamento}
              </p>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs font-sans">
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
            className="text-left border border-[rgba(201,168,76,0.4)] bg-[#141414] hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.05)] transition-all duration-200 overflow-hidden relative block"
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-[rgba(201,168,76,0.0)] via-[#C9A84C] to-[rgba(201,168,76,0.0)]" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-xl text-[#F5F0E8] font-medium leading-tight">
                  {config.titulo_destination_beauty}
                </h3>
                <span className="shrink-0 border border-[rgba(201,168,76,0.5)] text-[#C9A84C] text-[9px] font-sans tracking-[0.15em] uppercase px-2 py-0.5">
                  Especial
                </span>
              </div>
              <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mb-4 leading-relaxed">
                {config.descricao_destination_beauty}
              </p>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs font-sans">
                <Plane size={13} strokeWidth={1.5} />
                Falar pelo WhatsApp
              </div>
            </div>
          </a>
        )}

        {/* ── Suporte / "Falar com a equipe" ── */}
        {!loading && !error && (
          <div className="mt-2 pt-5 border-t border-[rgba(255,255,255,0.06)] flex flex-col items-center gap-3">
            <p className="text-[rgba(245,240,232,0.35)] text-xs font-sans">
              Duvidas sobre seu agendamento?
            </p>
            <a
              href={waUrl(SUPORTE_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarContato("duvida")}
              className="inline-flex items-center gap-2 text-[#25D366] hover:text-[#20bc5a] transition-colors text-sm font-sans"
            >
              <MessageCircle size={15} strokeWidth={1.5} className="shrink-0" />
              Falar com alguem da equipe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
