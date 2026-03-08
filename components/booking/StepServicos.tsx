"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Scissors, Clock, CheckCircle } from "lucide-react";

interface Props {
  selected: Servico | null;
  onSelect: (servico: Servico) => void;
}

export default function StepServicos({ selected, onSelect }: Props) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setServicos(d);
        else setError("Erro ao carregar servicos");
      })
      .catch(() => setError("Erro ao carregar servicos"))
      .finally(() => setLoading(false));
  }, []);

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
      </div>
    </div>
  );
}
