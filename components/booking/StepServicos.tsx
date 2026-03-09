"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Scissors, Clock, CheckCircle, MessageCircle } from "lucide-react";

interface Props {
  selected: Servico | null;
  onSelect: (servico: Servico) => void;
}

const CASAMENTO_MSG =
  "Ola! Gostaria de saber mais sobre os pacotes para casamento e noivas. 💍";

export default function StepServicos({ selected, onSelect }: Props) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/servicos").then((r) => r.json()),
      fetch("/api/admin/perfil").then((r) => r.json()),
    ])
      .then(([svcs, cfg]) => {
        if (Array.isArray(svcs)) setServicos(svcs);
        else setError("Erro ao carregar servicos");
        if (cfg?.whatsapp) setWhatsapp(cfg.whatsapp.replace(/\D/g, ""));
      })
      .catch(() => setError("Erro ao carregar servicos"))
      .finally(() => setLoading(false));
  }, []);

  function handleCasamentoClick() {
    const number = whatsapp ? `55${whatsapp}` : "";
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(CASAMENTO_MSG)}`
      : `https://wa.me/?text=${encodeURIComponent(CASAMENTO_MSG)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

        {/* Casamento special card — opens WhatsApp directly */}
        {!loading && !error && (
          <button
            onClick={handleCasamentoClick}
            className="text-left border border-[rgba(201,168,76,0.4)] bg-[#141414] hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.05)] transition-all duration-200 overflow-hidden relative"
          >
            {/* Gold top accent bar */}
            <div className="h-[2px] w-full bg-gradient-to-r from-[rgba(201,168,76,0.0)] via-[#C9A84C] to-[rgba(201,168,76,0.0)]" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-xl text-[#F5F0E8] font-medium leading-tight">
                  Casamento 💍
                </h3>
                <span className="shrink-0 border border-[rgba(201,168,76,0.5)] text-[#C9A84C] text-[9px] font-sans tracking-[0.15em] uppercase px-2 py-0.5">
                  Personalizado
                </span>
              </div>
              <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mb-4 leading-relaxed">
                Pacote exclusivo para noivas e madrinhas. Entre em contato para montar o seu look perfeito.
              </p>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs font-sans">
                <MessageCircle size={13} strokeWidth={1.5} />
                Falar pelo WhatsApp
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
