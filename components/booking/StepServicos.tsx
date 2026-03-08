"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";

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
        else setError("Erro ao carregar serviços");
      })
      .catch(() => setError("Erro ao carregar serviços"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-display text-3xl text-[#F5F0E8] font-light mb-2">
        Escolha o Serviço
      </h2>
      <p className="text-[rgba(245,240,232,0.5)] font-sans text-sm mb-8">
        Selecione o serviço que deseja agendar
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
          Nenhum serviço disponível no momento.
        </p>
      )}

      <div className="grid gap-4">
        {servicos.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`text-left border p-6 transition-all duration-200 group ${
              selected?.id === s.id
                ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)]"
                : "border-[rgba(201,168,76,0.2)] bg-[#141414] hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.03)]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-display text-xl text-[#F5F0E8] font-medium mb-1">
                  {s.nome}
                </h3>
                {s.descricao && (
                  <p className="text-[rgba(245,240,232,0.5)] text-sm font-sans mb-3">
                    {s.descricao}
                  </p>
                )}
                <span className="text-[rgba(245,240,232,0.4)] text-xs font-sans flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  {formatDuration(s.duracao_minutos)}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-xl text-[#C9A84C]">
                  {formatCurrency(s.preco)}
                </p>
                {selected?.id === s.id && (
                  <p className="text-[#C9A84C] text-xs font-sans mt-1">Selecionado</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
