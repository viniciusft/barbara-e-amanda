"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

type Categoria = "maquiagem" | "cabelo" | "combo";

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  categoria: "maquiagem" as Categoria,
  duracao_minutos: 60,
  duracao_maquiagem_min: 60,
  duracao_cabelo_min: 60,
  preco: 0,
  imagem_url: "",
};

const CATEGORIA_LABEL: Record<Categoria, string> = {
  maquiagem: "💄 Maquiagem",
  cabelo: "💇 Cabelo",
  combo: "✨ Combo",
};

const CATEGORIA_BADGE: Record<Categoria, string> = {
  maquiagem: "text-rose-400 border-rose-800 bg-rose-950/20",
  cabelo: "text-blue-400 border-blue-800 bg-blue-950/20",
  combo: "text-[#C9A84C] border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)]",
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchServicos() {
    setLoading(true);
    const res = await fetch("/api/servicos");
    const data = await res.json();
    if (Array.isArray(data)) setServicos(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchServicos();
  }, []);

  function startEdit(s: Servico) {
    setEditingId(s.id);
    const cat: Categoria = (s.categoria as Categoria) ?? "maquiagem";
    setForm({
      nome: s.nome,
      descricao: s.descricao ?? "",
      categoria: cat,
      duracao_minutos: s.duracao_minutos,
      duracao_maquiagem_min: s.duracao_maquiagem_min ?? s.duracao_minutos,
      duracao_cabelo_min: s.duracao_cabelo_min ?? s.duracao_minutos,
      preco: s.preco,
      imagem_url: s.imagem_url ?? "",
    });
    setShowForm(true);
    setError("");
  }

  function handleNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function setCategoria(cat: Categoria) {
    const updates: Partial<typeof EMPTY_FORM> = { categoria: cat };
    if (cat !== "combo") {
      updates.duracao_minutos = form.duracao_minutos;
    }
    setForm((f) => ({ ...f, ...updates }));
  }

  function setMaquiagemMin(v: number) {
    setForm((f) => ({
      ...f,
      duracao_maquiagem_min: v,
      duracao_minutos: f.categoria === "combo" ? v + f.duracao_cabelo_min : f.duracao_minutos,
    }));
  }

  function setCabeloMin(v: number) {
    setForm((f) => ({
      ...f,
      duracao_cabelo_min: v,
      duracao_minutos: f.categoria === "combo" ? f.duracao_maquiagem_min + v : f.duracao_minutos,
    }));
  }

  async function handleSave() {
    if (!form.nome || form.preco === undefined) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.categoria === "combo" && (!form.duracao_maquiagem_min || !form.duracao_cabelo_min)) {
      setError("Informe a duração da maquiagem e do cabelo para combos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        nome: form.nome,
        descricao: form.descricao || null,
        categoria: form.categoria,
        preco: form.preco,
        imagem_url: form.imagem_url || null,
      };

      if (form.categoria === "combo") {
        body.duracao_maquiagem_min = form.duracao_maquiagem_min;
        body.duracao_cabelo_min = form.duracao_cabelo_min;
        body.duracao_minutos = form.duracao_maquiagem_min + form.duracao_cabelo_min;
      } else {
        body.duracao_minutos = form.duracao_minutos;
        body.duracao_maquiagem_min = null;
        body.duracao_cabelo_min = null;
      }

      if (editingId) {
        await fetch(`/api/servicos/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/servicos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      fetchServicos();
    } catch {
      setError("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s: Servico) {
    await fetch(`/api/servicos/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !s.ativo }),
    });
    fetchServicos();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    await fetch(`/api/servicos/${id}`, { method: "DELETE" });
    fetchServicos();
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
            Serviços
          </h2>
          <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm mt-1">
            Gerencie os serviços oferecidos
          </p>
        </div>
        <button onClick={handleNew} className="btn-gold text-sm px-4 py-2">
          + Novo Serviço
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-[rgba(201,168,76,0.3)] bg-[#141414] p-6 mb-6">
          <h3 className="font-display text-xl text-[#F5F0E8] mb-5">
            {editingId ? "Editar Serviço" : "Novo Serviço"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Nome <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-luxury"
                placeholder="Nome do serviço"
              />
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="input-luxury resize-none"
                rows={2}
                placeholder="Descrição opcional"
              />
            </div>

            {/* Categoria */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Categoria <span className="text-[#C9A84C]">*</span>
              </label>
              <div className="flex gap-2">
                {(["maquiagem", "cabelo", "combo"] as Categoria[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoria(cat)}
                    className={`px-4 py-2 text-sm font-sans border transition-colors ${
                      form.categoria === cat
                        ? CATEGORIA_BADGE[cat]
                        : "border-[rgba(255,255,255,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(255,255,255,0.2)]"
                    }`}
                  >
                    {CATEGORIA_LABEL[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Duração — single or combo */}
            {form.categoria === "combo" ? (
              <>
                <div>
                  <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                    💄 Duração Maquiagem (min) <span className="text-[#C9A84C]">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.duracao_maquiagem_min}
                    onChange={(e) => setMaquiagemMin(Number(e.target.value))}
                    className="input-luxury"
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                    💇 Duração Cabelo (min) <span className="text-[#C9A84C]">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.duracao_cabelo_min}
                    onChange={(e) => setCabeloMin(Number(e.target.value))}
                    className="input-luxury"
                    min={15}
                    step={15}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans">
                    ✨ Duração total: <span className="text-[#C9A84C] font-medium">{form.duracao_maquiagem_min + form.duracao_cabelo_min} min</span>
                    <span className="text-[rgba(245,240,232,0.3)] ml-2">({form.duracao_maquiagem_min}min maquiagem + {form.duracao_cabelo_min}min cabelo)</span>
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                  Duração (minutos) <span className="text-[#C9A84C]">*</span>
                </label>
                <input
                  type="number"
                  value={form.duracao_minutos}
                  onChange={(e) => setForm({ ...form, duracao_minutos: Number(e.target.value) })}
                  className="input-luxury"
                  min={15}
                  step={15}
                />
              </div>
            )}

            {/* Preço */}
            <div>
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Preço (R$) <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="number"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
                className="input-luxury"
                min={0}
                step={0.01}
              />
            </div>

            {/* Imagem */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                Imagem
              </label>
              <ImageUpload
                value={form.imagem_url}
                onChange={(url) => setForm({ ...form, imagem_url: url })}
              />
              <p className="text-[11px] font-sans text-[rgba(245,240,232,0.35)] mt-2 leading-relaxed">
                Tamanho recomendado: 1536 x 2752px (proporção 9:16 — retrato vertical).
                Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-sans mt-3">{error}</p>
          )}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowForm(false)}
              className="border border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.6)] px-4 py-2 text-sm font-sans"
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

      {!loading && servicos.length === 0 && (
        <div className="border border-[rgba(201,168,76,0.1)] p-12 text-center">
          <p className="text-[rgba(245,240,232,0.3)] font-sans">Nenhum serviço cadastrado.</p>
        </div>
      )}

      <div className="grid gap-3">
        {servicos.map((s) => {
          const cat: Categoria = (s.categoria as Categoria) ?? "maquiagem";
          return (
            <div
              key={s.id}
              className={`border flex overflow-hidden ${
                s.ativo
                  ? "border-[rgba(201,168,76,0.15)] bg-[#141414]"
                  : "border-[rgba(255,255,255,0.05)] bg-[#111] opacity-60"
              }`}
            >
              {/* Image thumbnail */}
              <div className="w-20 h-20 shrink-0 bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                {s.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imagem_url} alt={s.nome} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-[rgba(201,168,76,0.2)]" strokeWidth={1} />
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-display text-lg text-[#F5F0E8]">{s.nome}</h4>
                    <span className={`text-[10px] font-sans border px-2 py-0.5 ${CATEGORIA_BADGE[cat]}`}>
                      {CATEGORIA_LABEL[cat]}
                    </span>
                    {!s.ativo && (
                      <span className="text-xs font-sans text-[rgba(245,240,232,0.3)] border border-[rgba(255,255,255,0.1)] px-2 py-0.5">
                        Inativo
                      </span>
                    )}
                  </div>
                  {s.descricao && (
                    <p className="text-[rgba(245,240,232,0.4)] text-sm font-sans mb-1 truncate">{s.descricao}</p>
                  )}
                  <div className="flex gap-4 text-sm font-sans text-[rgba(245,240,232,0.5)]">
                    {cat === "combo" ? (
                      <span>
                        💄{s.duracao_maquiagem_min}min + 💇{s.duracao_cabelo_min}min ={" "}
                        <span className="text-[rgba(245,240,232,0.7)]">{s.duracao_minutos}min</span>
                      </span>
                    ) : (
                      <span>{formatDuration(s.duracao_minutos)}</span>
                    )}
                    <span className="text-[#C9A84C]">{formatCurrency(s.preco)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(s)}
                    className="px-3 py-1.5 text-xs font-sans border border-[rgba(201,168,76,0.3)] text-[rgba(245,240,232,0.6)] hover:border-[rgba(201,168,76,0.5)] transition-colors"
                  >
                    {s.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => startEdit(s)}
                    className="px-3 py-1.5 text-xs font-sans border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.05)] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1.5 text-xs font-sans border border-red-900 text-red-400 hover:bg-red-950/20 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
