"use client";

import { useEffect, useState } from "react";
import { HorarioDisponivel } from "@/types";
import { getDiaSemanaLabel } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type Modo = "auto" | "custom";
type ModoHorario = "ambos" | "separado";

interface HorarioLocal {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  hora_inicio_cabelo: string;
  hora_fim_cabelo: string;
  modo_horario: ModoHorario;
  ativo: boolean;
  intervalo_minutos: number;
  modo: Modo;
  customTimes: string[];
}

function generateSlots(inicio: string, fim: string, intervalo: number): string[] {
  const [hS, mS] = inicio.split(":").map(Number);
  const [hE, mE] = fim.split(":").map(Number);
  const endMin = hE * 60 + mE;
  let curr = hS * 60 + mS;
  const slots: string[] = [];
  while (curr < endMin) {
    const h = Math.floor(curr / 60).toString().padStart(2, "0");
    const m = (curr % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    curr += intervalo;
  }
  return slots;
}

function fromDB(h: HorarioDisponivel): HorarioLocal {
  const isCustom =
    h.horarios_customizados !== null &&
    Array.isArray(h.horarios_customizados) &&
    h.horarios_customizados.length > 0;
  return {
    id: h.id,
    dia_semana: h.dia_semana,
    hora_inicio: h.hora_inicio,
    hora_fim: h.hora_fim,
    hora_inicio_cabelo: h.hora_inicio_cabelo ?? h.hora_inicio,
    hora_fim_cabelo: h.hora_fim_cabelo ?? h.hora_fim,
    modo_horario: (h.modo_horario as ModoHorario) ?? "ambos",
    ativo: h.ativo,
    intervalo_minutos: h.intervalo_minutos ?? 30,
    modo: isCustom ? "custom" : "auto",
    customTimes: isCustom ? (h.horarios_customizados as string[]) : [],
  };
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-sans text-[rgba(245,240,232,0.4)] block mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[#F5F0E8] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C]"
      />
    </div>
  );
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchHorarios() {
    setLoading(true);
    const res = await fetch("/api/horarios");
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Record<number, HorarioDisponivel> = {};
      for (const h of data) map[h.dia_semana] = h;
      const complete = Array.from({ length: 7 }, (_, i) => {
        const dbH = map[i];
        if (dbH) return fromDB(dbH);
        return {
          id: `temp-${i}`,
          dia_semana: i,
          hora_inicio: "09:00",
          hora_fim: "18:00",
          hora_inicio_cabelo: "09:00",
          hora_fim_cabelo: "18:00",
          modo_horario: "ambos" as ModoHorario,
          ativo: i >= 1 && i <= 5,
          intervalo_minutos: 30,
          modo: "auto" as Modo,
          customTimes: [],
        };
      });
      setHorarios(complete);
    }
    setLoading(false);
  }

  useEffect(() => { fetchHorarios(); }, []);

  function update(dia: number, partial: Partial<HorarioLocal>) {
    setHorarios((prev) => prev.map((h) => h.dia_semana === dia ? { ...h, ...partial } : h));
  }

  function addCustomTime(dia: number) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    update(dia, { customTimes: [...h.customTimes, "09:00"] });
  }

  function removeCustomTime(dia: number, idx: number) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    update(dia, { customTimes: h.customTimes.filter((_, i) => i !== idx) });
  }

  function updateCustomTime(dia: number, idx: number, value: string) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    update(dia, { customTimes: h.customTimes.map((t, i) => i === idx ? value : t) });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const toSave = horarios.map((h) => ({
        ...(h.id.startsWith("temp-") ? {} : { id: h.id }),
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fim: h.hora_fim,
        hora_inicio_cabelo: h.modo_horario === "separado" ? h.hora_inicio_cabelo : null,
        hora_fim_cabelo: h.modo_horario === "separado" ? h.hora_fim_cabelo : null,
        modo_horario: h.modo_horario,
        ativo: h.ativo,
        intervalo_minutos: h.intervalo_minutos,
        horarios_customizados: h.modo === "custom" && h.customTimes.length > 0 ? h.customTimes : null,
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
          Configure os horários e intervalos por dia da semana
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
          <div className="grid gap-4 mb-6">
            {horarios.map((h) => {
              const previewSlots = h.modo === "auto"
                ? generateSlots(h.hora_inicio, h.hora_fim, h.intervalo_minutos)
                : h.customTimes.slice().sort();

              return (
                <div
                  key={h.dia_semana}
                  className={`border p-5 transition-colors ${
                    h.ativo
                      ? "border-[rgba(201,168,76,0.2)] bg-[#141414]"
                      : "border-[rgba(255,255,255,0.05)] bg-[#111]"
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => update(h.dia_semana, { ativo: !h.ativo })}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${h.ativo ? "bg-[#C9A84C]" : "bg-[rgba(255,255,255,0.1)]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${h.ativo ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                    <span className={`font-sans font-medium ${h.ativo ? "text-[#F5F0E8]" : "text-[rgba(245,240,232,0.3)]"}`}>
                      {getDiaSemanaLabel(h.dia_semana)}
                    </span>
                  </div>

                  {h.ativo && (
                    <div className="ml-14 space-y-4">
                      {/* Mode toggle */}
                      <div className="flex items-center gap-6">
                        {(["auto", "custom"] as Modo[]).map((m) => (
                          <label key={m} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={h.modo === m}
                              onChange={() => update(h.dia_semana, { modo: m })}
                              className="accent-[#C9A84C]"
                            />
                            <span className="font-sans text-sm text-[rgba(245,240,232,0.7)]">
                              {m === "auto" ? "Automático" : "Personalizado"}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* AUTO mode */}
                      {h.modo === "auto" && (
                        <div className="space-y-4">
                          {/* Modo horário: ambos/separado */}
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={h.modo_horario === "ambos"}
                                onChange={() => update(h.dia_semana, { modo_horario: "ambos" })}
                                className="accent-[#C9A84C]"
                              />
                              <span className="font-sans text-sm text-[rgba(245,240,232,0.6)]">
                                💄💇 Mesmo horário para ambas
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={h.modo_horario === "separado"}
                                onChange={() => update(h.dia_semana, { modo_horario: "separado" })}
                                className="accent-[#C9A84C]"
                              />
                              <span className="font-sans text-sm text-[rgba(245,240,232,0.6)]">
                                Horários independentes
                              </span>
                            </label>
                          </div>

                          {h.modo_horario === "ambos" ? (
                            <div className="flex flex-wrap items-end gap-4">
                              <TimeInput label="Início" value={h.hora_inicio} onChange={(v) => update(h.dia_semana, { hora_inicio: v })} />
                              <span className="text-[rgba(245,240,232,0.3)] font-sans text-sm mb-2">até</span>
                              <TimeInput label="Fim" value={h.hora_fim} onChange={(v) => update(h.dia_semana, { hora_fim: v })} />
                              <div>
                                <label className="text-xs font-sans text-[rgba(245,240,232,0.4)] block mb-1">Intervalo (min)</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={h.intervalo_minutos}
                                    min={15}
                                    max={480}
                                    onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) update(h.dia_semana, { intervalo_minutos: v }); }}
                                    onBlur={(e) => { const v = Math.min(480, Math.max(15, Number(e.target.value) || 30)); update(h.dia_semana, { intervalo_minutos: v }); }}
                                    className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[#F5F0E8] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C] w-20 tabular-nums"
                                  />
                                  <span className="text-xs font-sans text-[rgba(245,240,232,0.4)]">min</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Maquiagem */}
                              <div>
                                <p className="text-xs font-sans text-rose-400 uppercase tracking-wider mb-2">💄 Maquiagem</p>
                                <div className="flex flex-wrap items-end gap-4">
                                  <TimeInput label="Início" value={h.hora_inicio} onChange={(v) => update(h.dia_semana, { hora_inicio: v })} />
                                  <span className="text-[rgba(245,240,232,0.3)] font-sans text-sm mb-2">até</span>
                                  <TimeInput label="Fim" value={h.hora_fim} onChange={(v) => update(h.dia_semana, { hora_fim: v })} />
                                </div>
                              </div>
                              {/* Cabelo */}
                              <div>
                                <p className="text-xs font-sans text-blue-400 uppercase tracking-wider mb-2">💇 Cabelo</p>
                                <div className="flex flex-wrap items-end gap-4">
                                  <TimeInput label="Início" value={h.hora_inicio_cabelo} onChange={(v) => update(h.dia_semana, { hora_inicio_cabelo: v })} />
                                  <span className="text-[rgba(245,240,232,0.3)] font-sans text-sm mb-2">até</span>
                                  <TimeInput label="Fim" value={h.hora_fim_cabelo} onChange={(v) => update(h.dia_semana, { hora_fim_cabelo: v })} />
                                </div>
                              </div>
                              {/* Shared interval */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-sans text-[rgba(245,240,232,0.4)]">Intervalo (min):</label>
                                <input
                                  type="number"
                                  value={h.intervalo_minutos}
                                  min={15}
                                  max={480}
                                  onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) update(h.dia_semana, { intervalo_minutos: v }); }}
                                  onBlur={(e) => { const v = Math.min(480, Math.max(15, Number(e.target.value) || 30)); update(h.dia_semana, { intervalo_minutos: v }); }}
                                  className="bg-transparent border border-[rgba(201,168,76,0.2)] text-[#F5F0E8] px-3 py-2 text-sm font-sans focus:outline-none focus:border-[#C9A84C] w-20 tabular-nums"
                                />
                                <span className="text-xs font-sans text-[rgba(245,240,232,0.4)]">min</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CUSTOM mode */}
                      {h.modo === "custom" && (
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {h.customTimes.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-1 border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.03)]">
                                <input
                                  type="time"
                                  value={t}
                                  onChange={(e) => updateCustomTime(h.dia_semana, idx, e.target.value)}
                                  className="bg-transparent text-[#F5F0E8] px-2 py-1.5 text-sm font-sans focus:outline-none"
                                />
                                <button
                                  onClick={() => removeCustomTime(h.dia_semana, idx)}
                                  className="px-1.5 text-[rgba(245,240,232,0.3)] hover:text-red-400 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addCustomTime(h.dia_semana)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.5)] text-xs font-sans hover:border-[rgba(201,168,76,0.6)] hover:text-[rgba(245,240,232,0.8)] transition-colors"
                            >
                              <Plus size={12} />
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Slot preview */}
                      {previewSlots.length > 0 && (
                        <div>
                          <p className="text-[10px] font-sans text-[rgba(245,240,232,0.35)] uppercase tracking-widest mb-2">
                            Preview — {previewSlots.length} horários
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {previewSlots.slice(0, 10).map((s) => (
                              <span key={s} className="text-xs font-sans text-[rgba(245,240,232,0.5)] border border-[rgba(201,168,76,0.12)] px-2 py-0.5">
                                {s}
                              </span>
                            ))}
                            {previewSlots.length > 10 && (
                              <span className="text-xs font-sans text-[rgba(245,240,232,0.35)] px-2 py-0.5">
                                +{previewSlots.length - 10} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!h.ativo && (
                    <span className="ml-14 text-[rgba(245,240,232,0.25)] font-sans text-sm">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="border border-red-800 bg-red-950/20 p-4 text-red-400 text-sm font-sans mb-4">{error}</div>
          )}
          {success && (
            <div className="border border-green-800 bg-green-950/20 p-4 text-green-400 text-sm font-sans mb-4">{success}</div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-3"
          >
            {saving && <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />}
            {saving ? "Salvando..." : "Salvar Horários"}
          </button>
        </>
      )}
    </div>
  );
}
