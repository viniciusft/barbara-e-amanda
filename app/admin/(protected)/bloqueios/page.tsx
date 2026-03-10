"use client";

import { useEffect, useState } from "react";
import { Bloqueio } from "@/types";
import { formatDateBR } from "@/lib/utils";

const EMPTY_FORM = { data_inicio: "", data_fim: "", motivo: "" };

export default function BloqueiosPage() {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchBloqueios() {
    setLoading(true);
    const res = await fetch("/api/bloqueios");
    const data = await res.json();
    if (Array.isArray(data)) setBloqueios(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBloqueios();
  }, []);

  async function handleSave() {
    if (!form.data_inicio || !form.data_fim) {
      setError("Data início e data fim são obrigatórias");
      return;
    }
    if (form.data_fim < form.data_inicio) {
      setError("Data fim deve ser igual ou posterior à data início");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/bloqueios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erro ao salvar");
      } else {
        setShowForm(false);
        setForm(EMPTY_FORM);
        fetchBloqueios();
      }
    } catch {
      setError("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este bloqueio?")) return;
    await fetch(`/api/bloqueios/${id}`, { method: "DELETE" });
    fetchBloqueios();
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
            Bloqueios
          </h2>
          <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm mt-1">
            Folgas, férias e feriados
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className="btn-gold text-sm px-4 py-2"
        >
          + Novo Bloqueio
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-surface-border bg-surface-card rounded-card p-6 mb-6">
          <h3 className="font-display text-xl text-[#F5F0E8] mb-5">
            Novo Bloqueio
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Data início <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                className="input-luxury"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Data fim <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                className="input-luxury"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Motivo <span className="text-[rgba(245,240,232,0.3)]">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                placeholder="Ex: Férias, Feriado, Evento pessoal..."
                className="input-luxury"
              />
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm font-sans mt-3">{error}</p>
          )}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowForm(false)}
              className="border border-surface-border text-gray-400 px-4 py-2 text-sm font-sans rounded-btn hover:border-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold px-6 py-2 text-sm flex items-center gap-2"
            >
              {saving && (
                <div className="w-3 h-3 border border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading && (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">Carregando...</span>
        </div>
      )}

      {!loading && bloqueios.length === 0 && (
        <div className="border border-surface-border rounded-card p-12 text-center">
          <p className="text-[rgba(245,240,232,0.3)] font-sans">
            Nenhum bloqueio futuro cadastrado.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {bloqueios.map((b) => {
          const isSingleDay = b.data_inicio === b.data_fim;
          return (
            <div
              key={b.id}
              className="border border-surface-border bg-surface-card rounded-card p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <div className="border border-gold/40 px-4 py-2 rounded-btn bg-gold-muted">
                    <p className="text-[#C9A84C] font-display text-lg leading-none">
                      {formatDateBR(b.data_inicio)}
                    </p>
                    {!isSingleDay && (
                      <>
                        <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans my-0.5">até</p>
                        <p className="text-[#C9A84C] font-display text-lg leading-none">
                          {formatDateBR(b.data_fim)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  {b.motivo ? (
                    <p className="text-[#F5F0E8] font-sans">{b.motivo}</p>
                  ) : (
                    <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm italic">
                      Sem motivo informado
                    </p>
                  )}
                  <p className="text-[rgba(245,240,232,0.3)] text-xs font-sans mt-1">
                    {isSingleDay
                      ? "Bloqueio de 1 dia"
                      : `Bloqueio de ${
                          Math.round(
                            (new Date(b.data_fim).getTime() -
                              new Date(b.data_inicio).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1
                        } dias`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                className="px-3 py-1.5 text-xs font-sans border border-red-900 text-red-400 hover:bg-red-950/20 transition-colors shrink-0"
              >
                Excluir
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
