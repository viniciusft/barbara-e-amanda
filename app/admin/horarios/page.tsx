"use client";

import { useEffect, useState } from "react";
import { HorarioDisponivel } from "@/types";
import { getDiaSemanaLabel } from "@/lib/utils";

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchHorarios() {
    setLoading(true);
    const res = await fetch("/api/horarios");
    const data = await res.json();
    if (Array.isArray(data)) {
      // Ensure all 7 days are present
      const map: Record<number, HorarioDisponivel> = {};
      for (const h of data) map[h.dia_semana] = h;
      const complete: HorarioDisponivel[] = Array.from({ length: 7 }, (_, i) => {
        return (
          map[i] ?? {
            id: `temp-${i}`,
            dia_semana: i,
            hora_inicio: "09:00",
            hora_fim: "18:00",
            ativo: i >= 1 && i <= 5, // Mon-Fri active by default
          }
        );
      });
      setHorarios(complete);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHorarios();
  }, []);

  function updateHorario(dia: number, partial: Partial<HorarioDisponivel>) {
    setHorarios((prev) =>
      prev.map((h) => (h.dia_semana === dia ? { ...h, ...partial } : h))
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // Filter out temp IDs
      const toSave = horarios.map((h) => ({
        ...(h.id.startsWith("temp-") ? {} : { id: h.id }),
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
        ativo: h.ativo,
      }));

      const res = await fetch("/api/horarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erro ao salvar");
      } else {
        setSuccess("Horários salvos com sucesso!");
        fetchHorarios();
      }
    } catch {
      setError("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
          Horários de Funcionamento
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm mt-1">
          Configure os horários disponíveis por dia da semana
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Carregando...</span>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-3 mb-6">
            {horarios.map((h) => (
              <div
                key={h.dia_semana}
                className={`border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
                  h.ativo
                    ? "border-[rgba(201,168,76,0.2)] bg-[#141414]"
                    : "border-[rgba(255,255,255,0.05)] bg-[#111]"
                }`}
              >
                {/* Day name + toggle */}
                <div className="flex items-center gap-4 sm:w-44">
                  <button
                    onClick={() => updateHorario(h.dia_semana, { ativo: !h.ativo })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      h.ativo ? "bg-[#C9A84C]" : "bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        h.ativo ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`font-sans text-sm ${
                      h.ativo ? "text-[#F5F0E8]" : "text-[rgba(245,240,232,0.3)]"
                    }`}
                  >
                    {getDiaSemanaLabel(h.dia_semana)}
                  </span>
                </div>

                {/* Time inputs */}
                {h.ativo ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <label className="text-xs font-sans text-[rgba(245,240,232,0.4)] block mb-1">
                        Início
                      </label>
                      <input
                        type="time"
                        value={h.hora_inicio}
                        onChange={(e) =>
                          updateHorario(h.dia_semana, { hora_inicio: e.target.value })
                        }
                        className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[#F5F0E8] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <span className="text-[rgba(245,240,232,0.3)] font-sans text-sm mt-4">até</span>
                    <div>
                      <label className="text-xs font-sans text-[rgba(245,240,232,0.4)] block mb-1">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={h.hora_fim}
                        onChange={(e) =>
                          updateHorario(h.dia_semana, { hora_fim: e.target.value })
                        }
                        className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[#F5F0E8] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-[rgba(245,240,232,0.25)] font-sans text-sm">
                    Fechado
                  </span>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="border border-red-800 bg-red-950/20 p-4 text-red-400 text-sm font-sans mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="border border-green-800 bg-green-950/20 p-4 text-green-400 text-sm font-sans mb-4">
              {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-3"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? "Salvando..." : "Salvar Horários"}
          </button>
        </>
      )}
    </div>
  );
}
