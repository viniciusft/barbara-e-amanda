"use client";

import { useEffect, useState } from "react";
import { Servico } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { ImageIcon, GripVertical } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Categoria = "maquiagem" | "cabelo" | "combo";
type SinalOpcao = "percentual" | "fixo";

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  categoria: "maquiagem" as Categoria,
  duracao_minutos: 60,
  duracao_maquiagem_min: 60,
  duracao_cabelo_min: 60,
  preco: 0,
  imagem_url: "",
  // Sinal config
  sinal_opcao: "percentual" as SinalOpcao,
  sinal_percentual_custom: 50,
  sinal_valor_fixo: 0,
};

const CATEGORIA_LABEL: Record<Categoria, string> = {
  maquiagem: "💄 Maquiagem",
  cabelo: "💇 Cabelo",
  combo: "✨ Combo",
};

const CATEGORIA_BADGE: Record<Categoria, string> = {
  maquiagem: "text-rose-400 border-rose-800 bg-rose-950/20",
  cabelo: "text-blue-400 border-blue-800 bg-blue-950/20",
  combo: "text-gold border-[var(--gold-muted-border)] bg-[var(--gold-muted)]",
};

// ── Sortable item component ───────────────────────────────────────────────────
interface SortableItemProps {
  servico: Servico;
  onEdit: (s: Servico) => void;
  onToggle: (s: Servico) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ servico: s, onEdit, onToggle, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: s.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const cat: Categoria = (s.categoria as Categoria) ?? "maquiagem";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border flex overflow-hidden ${
        isDragging
          ? "border-gold bg-[var(--gold-muted)] shadow-lg shadow-[rgba(201,168,76,0.15)]"
          : s.ativo
          ? "border-[var(--gold-muted-border)] bg-surface-card"
          : "border-surface-border bg-[#111] opacity-60"
      }`}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="w-8 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none text-[rgba(201,168,76,0.25)] hover:text-[rgba(201,168,76,0.6)] transition-colors border-r border-[var(--gold-muted-border)]"
        aria-label="Arrastar para reordenar"
        style={{ minHeight: 44 }}
      >
        <GripVertical size={16} strokeWidth={1.5} />
      </button>

      {/* Image thumbnail */}
      <div className="w-20 h-20 shrink-0 bg-surface-elevated flex items-center justify-center overflow-hidden">
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
            <h4 className="font-display text-lg text-foreground">{s.nome}</h4>
            <span className={`text-[10px] font-sans border px-2 py-0.5 ${CATEGORIA_BADGE[cat]}`}>
              {CATEGORIA_LABEL[cat]}
            </span>
            {!s.ativo && (
              <span className="text-xs font-sans text-foreground/30 border border-surface-border px-2 py-0.5">
                Inativo
              </span>
            )}
          </div>
          {s.descricao && (
            <p className="text-foreground/40 text-sm font-sans mb-1 truncate">{s.descricao}</p>
          )}
          <div className="flex gap-4 text-sm font-sans text-foreground/50">
            {cat === "combo" ? (
              <span>
                💄{s.duracao_maquiagem_min}min + 💇{s.duracao_cabelo_min}min ={" "}
                <span className="text-foreground/70">{s.duracao_minutos}min</span>
              </span>
            ) : (
              <span>{formatDuration(s.duracao_minutos)}</span>
            )}
            <span className="text-gold">{formatCurrency(s.preco)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(s)}
            className="px-3 py-1.5 text-xs font-sans border border-[var(--gold-muted-border)] text-foreground/60 hover:border-[rgba(201,168,76,0.5)] transition-colors"
          >
            {s.ativo ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={() => onEdit(s)}
            className="px-3 py-1.5 text-xs font-sans border border-[var(--gold-muted-border)] text-gold hover:bg-[rgba(201,168,76,0.05)] transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(s.id)}
            className="px-3 py-1.5 text-xs font-sans border border-red-900 text-red-400 hover:bg-red-950/20 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MSG_CASAMENTO = "Olá! Gostaria de saber mais sobre os pacotes para casamento e noivas. 💍";
const DEFAULT_MSG_DESTINATION = "Olá! Gostaria de saber mais sobre o serviço de Destination Beauty — atendimento no local de minha preferência. Podem me ajudar? ✨";

type EspecialKey = "casamento" | "destination_beauty";

const ESPECIAL_DEFAULTS: Record<EspecialKey, { titulo: string; descricao: string; mensagem: string }> = {
  casamento: {
    titulo: "Casamento 💍",
    descricao: "Pacote exclusivo para noivas e madrinhas. Entre em contato para montar o seu look perfeito.",
    mensagem: DEFAULT_MSG_CASAMENTO,
  },
  destination_beauty: {
    titulo: "Destination Beauty ✈️",
    descricao: "Levamos a experiência de maquiagem e penteado até você. Ideal para eventos, ensaios, casamentos ou qualquer ocasião especial no local de sua preferência.",
    mensagem: DEFAULT_MSG_DESTINATION,
  },
};

interface EspecialForm { titulo: string; descricao: string; mensagem: string }

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reorderError, setReorderError] = useState("");

  // Special services
  const [especiais, setEspeciais] = useState<Record<EspecialKey, EspecialForm>>({
    casamento: { ...ESPECIAL_DEFAULTS.casamento },
    destination_beauty: { ...ESPECIAL_DEFAULTS.destination_beauty },
  });
  const [editingEspecial, setEditingEspecial] = useState<EspecialKey | null>(null);
  const [especialForm, setEspecialForm] = useState<EspecialForm>({ titulo: "", descricao: "", mensagem: "" });
  const [savingEspecial, setSavingEspecial] = useState(false);
  const [errorEspecial, setErrorEspecial] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = servicos.findIndex((s) => s.id === active.id);
    const newIndex = servicos.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(servicos, oldIndex, newIndex);
    setServicos(reordered);
    setReorderError("");

    try {
      const res = await fetch("/api/admin/servicos/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reordered.map((s, i) => ({ id: s.id, ordem: i })),
        }),
      });
      if (!res.ok) {
        setReorderError("Erro ao salvar ordem. Recarregue a página.");
        setServicos(servicos); // revert
      }
    } catch {
      setReorderError("Erro ao salvar ordem. Recarregue a página.");
      setServicos(servicos); // revert
    }
  }

  async function fetchServicos() {
    setLoading(true);
    const res = await fetch("/api/servicos");
    const data = await res.json();
    if (Array.isArray(data)) setServicos(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchServicos();
    fetch("/api/admin/perfil", { cache: "no-store" })
      .then((r) => r.json())
      .then((cfg) => {
        if (!cfg) return;
        setEspeciais({
          casamento: {
            titulo: cfg.titulo_casamento ?? ESPECIAL_DEFAULTS.casamento.titulo,
            descricao: cfg.descricao_casamento ?? ESPECIAL_DEFAULTS.casamento.descricao,
            mensagem: cfg.mensagem_casamento ?? ESPECIAL_DEFAULTS.casamento.mensagem,
          },
          destination_beauty: {
            titulo: cfg.titulo_destination_beauty ?? ESPECIAL_DEFAULTS.destination_beauty.titulo,
            descricao: cfg.descricao_destination_beauty ?? ESPECIAL_DEFAULTS.destination_beauty.descricao,
            mensagem: cfg.mensagem_destination_beauty ?? ESPECIAL_DEFAULTS.destination_beauty.mensagem,
          },
        });
      });
  }, []);

  function startEditEspecial(key: EspecialKey) {
    setEditingEspecial(key);
    setEspecialForm({ ...especiais[key] });
    setErrorEspecial("");
  }

  async function saveEspecial() {
    if (!editingEspecial) return;
    setSavingEspecial(true);
    setErrorEspecial("");
    try {
      const fieldMap: Record<EspecialKey, Record<string, string>> = {
        casamento: {
          titulo_casamento: especialForm.titulo,
          descricao_casamento: especialForm.descricao,
          mensagem_casamento: especialForm.mensagem,
        },
        destination_beauty: {
          titulo_destination_beauty: especialForm.titulo,
          descricao_destination_beauty: especialForm.descricao,
          mensagem_destination_beauty: especialForm.mensagem,
        },
      };
      const res = await fetch("/api/admin/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldMap[editingEspecial]),
      });
      if (!res.ok) { setErrorEspecial("Erro ao salvar"); return; }
      setEspeciais((prev) => ({ ...prev, [editingEspecial]: { ...especialForm } }));
      setEditingEspecial(null);
    } catch {
      setErrorEspecial("Erro ao salvar");
    } finally {
      setSavingEspecial(false);
    }
  }

  function startEdit(s: Servico) {
    setEditingId(s.id);
    const cat: Categoria = (s.categoria as Categoria) ?? "maquiagem";
    let sinalOpcao: SinalOpcao = "percentual";
    if (s.sinal_tipo === "fixo") sinalOpcao = "fixo";
    setForm({
      nome: s.nome,
      descricao: s.descricao ?? "",
      categoria: cat,
      duracao_minutos: s.duracao_minutos,
      duracao_maquiagem_min: s.duracao_maquiagem_min ?? s.duracao_minutos,
      duracao_cabelo_min: s.duracao_cabelo_min ?? s.duracao_minutos,
      preco: s.preco,
      imagem_url: s.imagem_url ?? "",
      sinal_opcao: sinalOpcao,
      sinal_percentual_custom: s.sinal_percentual_custom ?? 50,
      sinal_valor_fixo: s.sinal_valor_fixo ?? 0,
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
        // Sinal config
        sinal_tipo: form.sinal_opcao,
        sinal_percentual_custom: form.sinal_opcao === "percentual" ? form.sinal_percentual_custom : null,
        sinal_valor_fixo: form.sinal_opcao === "fixo" ? form.sinal_valor_fixo : null,
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
          <h2 className="font-display text-3xl text-foreground font-light">
            Serviços
          </h2>
          <p className="text-foreground/40 font-sans text-sm mt-1">
            Gerencie os serviços oferecidos
          </p>
        </div>
        <button onClick={handleNew} className="btn-gold text-sm px-4 py-2">
          + Novo Serviço
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-[var(--gold-muted-border)] bg-surface-card p-6 mb-6">
          <h3 className="font-display text-xl text-foreground mb-5">
            {editingId ? "Editar Serviço" : "Novo Serviço"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Nome <span className="text-gold">*</span>
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
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
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
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Categoria <span className="text-gold">*</span>
              </label>
              <div className="flex gap-2">
                {(["maquiagem", "cabelo", "combo"] as Categoria[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoria(cat)}
                    className={`px-4 py-2 text-sm font-sans border transition-colors ${
                      form.categoria === cat
                        ? CATEGORIA_BADGE[cat]
                        : "border-surface-border text-foreground/40 hover:border-foreground/20"
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
                  <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                    💄 Duração Maquiagem (min) <span className="text-gold">*</span>
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
                  <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                    💇 Duração Cabelo (min) <span className="text-gold">*</span>
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
                  <p className="text-foreground/40 text-sm font-sans">
                    ✨ Duração total: <span className="text-gold font-medium">{form.duracao_maquiagem_min + form.duracao_cabelo_min} min</span>
                    <span className="text-foreground/30 ml-2">({form.duracao_maquiagem_min}min maquiagem + {form.duracao_cabelo_min}min cabelo)</span>
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                  Duração (minutos) <span className="text-gold">*</span>
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
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Preço (R$) <span className="text-gold">*</span>
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

            {/* Sinal config */}
            <div className="sm:col-span-2 border-t border-[var(--gold-muted-border)] pt-4">
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-3">
                Configuração de Sinal
              </label>
              <div className="flex gap-2 flex-wrap mb-3">
                {(["percentual", "fixo"] as SinalOpcao[]).map((op) => {
                  const labels: Record<SinalOpcao, string> = { percentual: "Percentual personalizado", fixo: "Valor fixo" };
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sinal_opcao: op }))}
                      className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
                        form.sinal_opcao === op
                          ? "border-gold text-gold bg-[var(--gold-muted)]"
                          : "border-surface-border text-foreground/40 hover:border-foreground/20"
                      }`}
                    >
                      {labels[op]}
                    </button>
                  );
                })}
              </div>
              {form.sinal_opcao === "percentual" && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.sinal_percentual_custom}
                    onChange={(e) => setForm((f) => ({ ...f, sinal_percentual_custom: Number(e.target.value) }))}
                    className="input-luxury w-28"
                    placeholder="50"
                  />
                  <span className="text-foreground/40 text-sm font-sans">% do valor total</span>
                </div>
              )}
              {form.sinal_opcao === "fixo" && (
                <div className="flex items-center gap-3">
                  <span className="text-foreground/40 text-sm font-sans">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.sinal_valor_fixo}
                    onChange={(e) => setForm((f) => ({ ...f, sinal_valor_fixo: Number(e.target.value) }))}
                    className="input-luxury w-36"
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>

            {/* Imagem */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Imagem
              </label>
              <ImageUpload
                value={form.imagem_url}
                onChange={(url) => setForm({ ...form, imagem_url: url })}
              />
              <p className="text-[11px] font-sans text-foreground/35 mt-2 leading-relaxed">
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
              className="border border-[var(--gold-muted-border)] text-foreground/60 px-4 py-2 text-sm font-sans"
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
          <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 font-sans text-sm">Carregando...</span>
        </div>
      )}

      {!loading && servicos.length === 0 && (
        <div className="border border-[var(--gold-muted-border)] p-12 text-center">
          <p className="text-foreground/30 font-sans">Nenhum serviço cadastrado.</p>
        </div>
      )}

      {reorderError && (
        <div className="border border-red-800 bg-red-950/20 p-3 text-red-400 text-sm font-sans mb-3">
          {reorderError}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={servicos.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-3">
            {servicos.map((s) => (
              <SortableItem
                key={s.id}
                servico={s}
                onEdit={startEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Serviços Especiais ─────────────────────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-5">
          <h3 className="font-display text-xl text-foreground font-light">Serviços Especiais</h3>
          <p className="text-foreground/40 font-sans text-xs mt-1">
            Contatos diretos via WhatsApp — sem agendamento online.
          </p>
        </div>

        {/* Edit form */}
        {editingEspecial && (
          <div className="border border-[var(--gold-muted-border)] bg-surface-card p-6 mb-6">
            <h4 className="font-display text-lg text-foreground mb-4">
              Editar: {ESPECIAL_DEFAULTS[editingEspecial].titulo}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">Título</label>
                <input
                  type="text"
                  value={especialForm.titulo}
                  onChange={(e) => setEspecialForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">Descrição</label>
                <textarea
                  value={especialForm.descricao}
                  onChange={(e) => setEspecialForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="input-luxury resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">Mensagem WhatsApp</label>
                <textarea
                  value={especialForm.mensagem}
                  onChange={(e) => setEspecialForm((f) => ({ ...f, mensagem: e.target.value }))}
                  className="input-luxury resize-none font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>
            {errorEspecial && <p className="text-red-400 text-sm font-sans mt-3">{errorEspecial}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditingEspecial(null)}
                className="border border-[var(--gold-muted-border)] text-foreground/60 px-4 py-2 text-sm font-sans"
              >
                Cancelar
              </button>
              <button
                onClick={saveEspecial}
                disabled={savingEspecial}
                className="btn-gold px-6 py-2 text-sm flex items-center gap-2"
              >
                {savingEspecial && <div className="w-3 h-3 border border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />}
                {savingEspecial ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {(["casamento", "destination_beauty"] as EspecialKey[]).map((key) => (
            <div key={key} className="border border-[var(--gold-muted-border)] bg-surface-card flex overflow-hidden">
              {/* Gold accent bar */}
              <div className="w-1 shrink-0 bg-gradient-to-b from-[rgba(201,168,76,0.0)] via-[#C9A84C] to-[rgba(201,168,76,0.0)]" />
              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-display text-lg text-foreground">{especiais[key].titulo}</h4>
                    <span className="text-[10px] font-sans border border-[rgba(201,168,76,0.5)] text-gold px-2 py-0.5 uppercase tracking-wider">
                      Contato direto
                    </span>
                  </div>
                  <p className="text-foreground/40 text-sm font-sans truncate">{especiais[key].descricao}</p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => startEditEspecial(key)}
                    className="px-3 py-1.5 text-xs font-sans border border-[var(--gold-muted-border)] text-gold hover:bg-[rgba(201,168,76,0.05)] transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
