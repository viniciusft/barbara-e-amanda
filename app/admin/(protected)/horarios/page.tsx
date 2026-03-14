"use client";

import { useEffect, useState } from "react";
import { HorarioDisponivel } from "@/types";
import { getDiaSemanaLabel } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type Modo = "auto" | "custom";
type ModoHorario = "ambos" | "separado";
type Categoria = "maquiagem" | "cabelo" | "ambos";

interface HorarioLocal {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  hora_inicio_cabelo: string;
  hora_fim_cabelo: string;
  modo_horario: ModoHorario;
  categoria: Categoria;
  ativo: boolean;
  intervalo_minutos: number;
  modo: Modo;
  customTimes: string[];        // maquiagem (or shared) custom times
  customTimesCabelo: string[];  // cabelo custom times (only used when modo_horario=separado)
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

// Encode/decode per-category custom times in the DB jsonb field.
// When modo_horario=separado and custom: store as {m:[...],c:[...]}
// When modo_horario=ambos and custom: plain string array
function encodeCustomTimes(customTimes: string[], customTimesCabelo: string[], modoHorario: ModoHorario): string[] | null {
  if (modoHorario === "separado") {
    if (customTimes.length === 0 && customTimesCabelo.length === 0) return null;
    // Encode as special marker format: [...maqTimes, "|||", ...cabeloTimes]
    return [...customTimes, "|||", ...customTimesCabelo];
  }
  return customTimes.length > 0 ? customTimes : null;
}

function decodeCustomTimes(raw: string[] | null): { maq: string[]; cab: string[] } {
  if (!raw || raw.length === 0) return { maq: [], cab: [] };
  const sepIdx = raw.indexOf("|||");
  if (sepIdx === -1) return { maq: raw, cab: [] };
  return { maq: raw.slice(0, sepIdx), cab: raw.slice(sepIdx + 1) };
}

function fromDB(h: HorarioDisponivel): HorarioLocal {
  const raw = h.horarios_customizados;
  const hasCustom = raw !== null && Array.isArray(raw) && raw.length > 0;
  const { maq, cab } = hasCustom ? decodeCustomTimes(raw as string[]) : { maq: [], cab: [] };
  return {
    id: h.id,
    dia_semana: h.dia_semana,
    hora_inicio: h.hora_inicio,
    hora_fim: h.hora_fim,
    hora_inicio_cabelo: h.hora_inicio_cabelo ?? h.hora_inicio,
    hora_fim_cabelo: h.hora_fim_cabelo ?? h.hora_fim,
    modo_horario: (h.modo_horario as ModoHorario) ?? "ambos",
    categoria: (h.categoria as Categoria) ?? "ambos",
    ativo: h.ativo,
    intervalo_minutos: h.intervalo_minutos ?? 30,
    modo: hasCustom ? "custom" : "auto",
    customTimes: maq,
    customTimesCabelo: cab,
  };
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-sans text-foreground/40 block mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-card border border-surface-border text-foreground px-3 py-2 text-sm font-sans rounded-btn focus:outline-none"
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
          categoria: "ambos" as Categoria,
          ativo: i >= 1 && i <= 5,
          intervalo_minutos: 30,
          modo: "auto" as Modo,
          customTimes: [],
          customTimesCabelo: [],
        };
      });
      setHorarios(complete);
    }
    setLoading(false);
  }

  useEffect(() => { fetchHorarios(); }, []);

  // dupWarn: key = "dia-m" or "dia-c", value = true while warning is visible
  const [dupWarn, setDupWarn] = useState<Record<string, boolean>>({});

  function showDupWarn(dia: number, cabelo: boolean) {
    const key = `${dia}-${cabelo ? "c" : "m"}`;
    setDupWarn((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setDupWarn((prev) => { const n = { ...prev }; delete n[key]; return n; }), 2000);
  }

  function update(dia: number, partial: Partial<HorarioLocal>) {
    setHorarios((prev) => prev.map((h) => h.dia_semana === dia ? { ...h, ...partial } : h));
  }

  function addCustomTime(dia: number, cabelo = false) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    const list = cabelo ? h.customTimesCabelo : h.customTimes;
    // Find first time not yet in list, starting from 09:00
    const candidates = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
      "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
    const next = candidates.find((t) => !list.includes(t)) ?? null;
    if (next === null) { showDupWarn(dia, cabelo); return; }
    if (cabelo) {
      update(dia, { customTimesCabelo: [...h.customTimesCabelo, next] });
    } else {
      update(dia, { customTimes: [...h.customTimes, next] });
    }
  }

  function removeCustomTime(dia: number, idx: number, cabelo = false) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    if (cabelo) {
      update(dia, { customTimesCabelo: h.customTimesCabelo.filter((_, i) => i !== idx) });
    } else {
      update(dia, { customTimes: h.customTimes.filter((_, i) => i !== idx) });
    }
  }

  function updateCustomTime(dia: number, idx: number, value: string, cabelo = false) {
    const h = horarios.find((hh) => hh.dia_semana === dia)!;
    const list = cabelo ? h.customTimesCabelo : h.customTimes;
    // Block if another entry already has this value
    if (list.some((t, i) => t === value && i !== idx)) {
      showDupWarn(dia, cabelo);
      return;
    }
    if (cabelo) {
      update(dia, { customTimesCabelo: list.map((t, i) => i === idx ? value : t) });
    } else {
      update(dia, { customTimes: list.map((t, i) => i === idx ? value : t) });
    }
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
        categoria: h.categoria,
        ativo: h.ativo,
        intervalo_minutos: h.intervalo_minutos,
        horarios_customizados: h.modo === "custom"
          ? encodeCustomTimes(
              Array.from(new Set(h.customTimes)),
              Array.from(new Set(h.customTimesCabelo)),
              h.modo_horario
            )
          : null,
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
        <h2 className="font-display text-3xl text-foreground font-light">
          Horários de Funcionamento
        </h2>
        <p className="text-foreground/40 font-sans text-sm mt-1">
          Configure os horários e intervalos por dia da semana
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 font-sans text-sm">Carregando...</span>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 mb-6">
            {horarios.map((h) => {
              // Compute preview slots per category
              const isSeparado = h.modo_horario === "separado";
              const previewMaq = h.modo === "auto"
                ? generateSlots(h.hora_inicio, h.hora_fim, h.intervalo_minutos)
                : Array.from(new Set(h.customTimes)).sort();
              const previewCab = h.modo === "auto"
                ? (isSeparado ? generateSlots(h.hora_inicio_cabelo, h.hora_fim_cabelo, h.intervalo_minutos) : previewMaq)
                : Array.from(new Set(h.customTimesCabelo)).sort();
              // For display: if separado show two rows; otherwise one
              const previewRows: { label: string; slots: string[]; color: string }[] = isSeparado
                ? [
                    { label: "💄 Maquiagem", slots: previewMaq, color: "text-rose-400" },
                    { label: "💇 Cabelo/Penteado", slots: previewCab, color: "text-blue-400" },
                  ]
                : [{ label: "", slots: previewMaq, color: "text-foreground/35" }];

              return (
                <div
                  key={h.dia_semana}
                  className={`border rounded-card p-5 transition-colors ${
                    h.ativo
                      ? "border-surface-border bg-surface-card"
                      : "border-surface-border bg-surface opacity-60"
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => update(h.dia_semana, { ativo: !h.ativo })}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${h.ativo ? "bg-[#C9A84C]" : "bg-surface-border"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${h.ativo ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                    <span className={`font-sans font-medium ${h.ativo ? "text-foreground" : "text-foreground/30"}`}>
                      {getDiaSemanaLabel(h.dia_semana)}
                    </span>
                  </div>

                  {h.ativo && (
                    <div className="ml-14 space-y-4">
                      {/* Categoria selector */}
                      <div>
                        <p className="text-xs font-sans text-foreground/40 uppercase tracking-wider mb-1">Serviços atendidos neste dia</p>
                        <p className="text-[10px] font-sans text-foreground/25 mb-2">
                          {h.categoria === "ambos" ? "Aceita agendamentos de maquiagem e cabelo/penteado" :
                           h.categoria === "maquiagem" ? "Aceita apenas agendamentos de maquiagem" :
                           "Aceita apenas agendamentos de cabelo/penteado"}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {([
                            { value: "ambos", label: "💄💇 Ambos" },
                            { value: "maquiagem", label: "💄 Maquiagem" },
                            { value: "cabelo", label: "💇 Cabelo/Penteado" },
                          ] as { value: Categoria; label: string }[]).map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => update(h.dia_semana, { categoria: value })}
                              className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
                                h.categoria === value
                                  ? "border-gold bg-[var(--gold-muted)] text-gold"
                                  : "border-surface-border text-foreground/50 hover:border-foreground/25"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

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
                            <span className="font-sans text-sm text-foreground/70">
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
                              <span className="font-sans text-sm text-foreground/60">
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
                              <span className="font-sans text-sm text-foreground/60">
                                Horários independentes
                              </span>
                            </label>
                          </div>

                          {h.modo_horario === "ambos" ? (
                            <div className="flex flex-wrap items-end gap-4">
                              <TimeInput label="Início" value={h.hora_inicio} onChange={(v) => update(h.dia_semana, { hora_inicio: v })} />
                              <span className="text-foreground/30 font-sans text-sm mb-2">até</span>
                              <TimeInput label="Fim" value={h.hora_fim} onChange={(v) => update(h.dia_semana, { hora_fim: v })} />
                              <div>
                                <label className="text-xs font-sans text-foreground/40 block mb-1">Intervalo (min)</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={h.intervalo_minutos}
                                    min={15}
                                    max={480}
                                    onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) update(h.dia_semana, { intervalo_minutos: v }); }}
                                    onBlur={(e) => { const v = Math.min(480, Math.max(15, Number(e.target.value) || 30)); update(h.dia_semana, { intervalo_minutos: v }); }}
                                    className="bg-surface-card border border-surface-border text-foreground px-3 py-2 text-sm font-sans rounded-btn focus:outline-none w-20 tabular-nums"
                                  />
                                  <span className="text-xs font-sans text-foreground/40">min</span>
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
                                  <span className="text-foreground/30 font-sans text-sm mb-2">até</span>
                                  <TimeInput label="Fim" value={h.hora_fim} onChange={(v) => update(h.dia_semana, { hora_fim: v })} />
                                </div>
                              </div>
                              {/* Cabelo */}
                              <div>
                                <p className="text-xs font-sans text-blue-400 uppercase tracking-wider mb-2">💇 Cabelo</p>
                                <div className="flex flex-wrap items-end gap-4">
                                  <TimeInput label="Início" value={h.hora_inicio_cabelo} onChange={(v) => update(h.dia_semana, { hora_inicio_cabelo: v })} />
                                  <span className="text-foreground/30 font-sans text-sm mb-2">até</span>
                                  <TimeInput label="Fim" value={h.hora_fim_cabelo} onChange={(v) => update(h.dia_semana, { hora_fim_cabelo: v })} />
                                </div>
                              </div>
                              {/* Shared interval */}
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-sans text-foreground/40">Intervalo (min):</label>
                                <input
                                  type="number"
                                  value={h.intervalo_minutos}
                                  min={15}
                                  max={480}
                                  onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) update(h.dia_semana, { intervalo_minutos: v }); }}
                                  onBlur={(e) => { const v = Math.min(480, Math.max(15, Number(e.target.value) || 30)); update(h.dia_semana, { intervalo_minutos: v }); }}
                                  className="bg-surface-card border border-surface-border text-foreground px-3 py-2 text-sm font-sans rounded-btn focus:outline-none w-20 tabular-nums"
                                />
                                <span className="text-xs font-sans text-foreground/40">min</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CUSTOM mode */}
                      {h.modo === "custom" && (
                        <div className="space-y-4">
                          {/* Maquiagem (or shared) */}
                          <div>
                            {h.modo_horario === "separado" && (
                              <p className="text-xs font-sans text-rose-400 uppercase tracking-wider mb-2">💄 Maquiagem</p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-1">
                              {h.customTimes.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-1 border border-surface-border bg-surface-elevated rounded-btn">
                                  <input
                                    type="time"
                                    value={t}
                                    onChange={(e) => updateCustomTime(h.dia_semana, idx, e.target.value)}
                                    className="bg-transparent text-foreground px-2 py-1.5 text-sm font-sans focus:outline-none"
                                  />
                                  <button
                                    onClick={() => removeCustomTime(h.dia_semana, idx)}
                                    className="px-1.5 text-foreground/30 hover:text-red-400 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addCustomTime(h.dia_semana)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[var(--gold-muted-border)] text-foreground/50 text-xs font-sans hover:border-gold hover:text-foreground/80 transition-colors"
                              >
                                <Plus size={12} />
                                Adicionar
                              </button>
                            </div>
                            {dupWarn[`${h.dia_semana}-m`] && (
                              <p className="text-xs text-amber-400 font-sans">Horário já adicionado</p>
                            )}
                          </div>

                          {/* Cabelo — only when separado */}
                          {h.modo_horario === "separado" && (
                            <div>
                              <p className="text-xs font-sans text-blue-400 uppercase tracking-wider mb-2">💇 Cabelo/Penteado</p>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {h.customTimesCabelo.map((t, idx) => (
                                  <div key={idx} className="flex items-center gap-1 border border-surface-border bg-surface-elevated rounded-btn">
                                    <input
                                      type="time"
                                      value={t}
                                      onChange={(e) => updateCustomTime(h.dia_semana, idx, e.target.value, true)}
                                      className="bg-transparent text-foreground px-2 py-1.5 text-sm font-sans focus:outline-none"
                                    />
                                    <button
                                      onClick={() => removeCustomTime(h.dia_semana, idx, true)}
                                      className="px-1.5 text-foreground/30 hover:text-red-400 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addCustomTime(h.dia_semana, true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[var(--gold-muted-border)] text-foreground/50 text-xs font-sans hover:border-gold hover:text-foreground/80 transition-colors"
                                >
                                  <Plus size={12} />
                                  Adicionar
                                </button>
                              </div>
                              {dupWarn[`${h.dia_semana}-c`] && (
                                <p className="text-xs text-amber-400 font-sans">Horário já adicionado</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Slot preview */}
                      {previewRows.some((r) => r.slots.length > 0) && (
                        <div className="space-y-2">
                          {previewRows.map((row, ri) => row.slots.length > 0 && (
                            <div key={ri}>
                              {row.label && (
                                <p className={`text-[10px] font-sans uppercase tracking-widest mb-1 ${row.color}`}>
                                  {row.label} — {row.slots.length} horários
                                </p>
                              )}
                              {!row.label && (
                                <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-1">
                                  Preview — {row.slots.length} horários
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {row.slots.slice(0, 10).map((s) => (
                                  <span key={s} className="text-xs font-sans text-gray-400 border border-surface-border rounded-badge px-2 py-0.5">
                                    {s}
                                  </span>
                                ))}
                                {row.slots.length > 10 && (
                                  <span className="text-xs font-sans text-foreground/35 px-2 py-0.5">
                                    +{row.slots.length - 10} mais
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!h.ativo && (
                    <span className="ml-14 text-foreground/25 font-sans text-sm">Fechado</span>
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
