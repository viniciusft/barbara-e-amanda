"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Trash2, GripVertical, Globe, ImageIcon,
  Save, Check, X, AlertTriangle, Eye, EyeOff, Upload,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GaleriaItem {
  id: string;
  pagina: string;
  url: string;
  titulo: string | null;
  ativo: boolean;
  ordem: number;
}

interface ConteudoPagina {
  pagina: string;
  titulo: string;
  subtitulo: string;
  descricao_curta: string;
  updated_at: string | null;
}

type TabType = "fotos" | "textos";
type PageKey =
  | "home"
  | "maquiagem-social"
  | "maquiagem-noiva"
  | "penteado"
  | "babyliss"
  | "maquiagem-e-penteado"
  | "casamento"
  | "formatura"
  | "eventos";

// ── Config ─────────────────────────────────────────────────────────────────────

const PAGINAS: { key: PageKey; label: string; limite: number }[] = [
  { key: "home",               label: "Home",            limite: 6 },
  { key: "maquiagem-social",   label: "Maquiagem Social",limite: 9 },
  { key: "maquiagem-noiva",    label: "Maquiagem Noiva", limite: 9 },
  { key: "penteado",           label: "Penteado",        limite: 9 },
  { key: "babyliss",           label: "Babyliss",        limite: 9 },
  { key: "maquiagem-e-penteado", label: "Combo",         limite: 9 },
  { key: "casamento",          label: "Casamento",       limite: 9 },
  { key: "formatura",          label: "Formatura",       limite: 9 },
  { key: "eventos",            label: "Eventos",         limite: 9 },
];

const DIMENSOES: Record<string, string> = {
  home: "800×800px recomendado (quadrado)",
};
const DEFAULT_DIMENSAO = "600×600px recomendado (quadrado)";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Sortable photo card ────────────────────────────────────────────────────────

interface SortableCardProps {
  foto: GaleriaItem;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
  onSaveTitle: (id: string, titulo: string) => void;
}

function SortableCard({ foto, onToggle, onDelete, onSaveTitle }: SortableCardProps) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: foto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(foto.titulo ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setTitleVal(foto.titulo ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }
  function commitEdit() {
    setEditing(false);
    onSaveTitle(foto.id, titleVal);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative bg-surface-card border rounded-card overflow-hidden group ${
        foto.ativo ? "border-surface-border" : "border-surface-border opacity-50"
      }`}
    >
      {/* Drag handle */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 rounded bg-black/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} className="text-white" />
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-surface-elevated">
        <Image
          src={foto.url}
          alt={foto.titulo ?? "foto da galeria"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
          unoptimized
        />
        {!foto.ativo && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs text-white font-sans bg-black/60 px-2 py-0.5 rounded-badge">
              Inativo
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1.5">
        {/* Title */}
        {editing ? (
          <div className="flex gap-1">
            <input
              ref={inputRef}
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
              className="input-luxury text-xs py-1 px-2 flex-1"
              placeholder="Título da foto"
            />
            <button onClick={commitEdit} className="p-1 text-gold hover:text-gold-light">
              <Check size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-500 hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="w-full text-left text-xs text-gray-400 hover:text-foreground truncate px-1 py-0.5 rounded hover:bg-surface-elevated transition-colors"
            title="Clique para editar o título"
          >
            {foto.titulo || <span className="italic text-gray-600">sem título</span>}
          </button>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onToggle(foto.id, !foto.ativo)}
            className={`flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-badge border transition-colors ${
              foto.ativo
                ? "border-gold/40 text-gold hover:bg-gold-muted"
                : "border-surface-border text-gray-500 hover:text-foreground"
            }`}
          >
            {foto.ativo ? <Eye size={11} /> : <EyeOff size={11} />}
            {foto.ativo ? "Ativo" : "Inativo"}
          </button>

          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => { setConfirmDelete(false); onDelete(foto.id); }}
                className="text-[10px] text-red-400 hover:text-red-300 font-sans px-1.5 py-0.5 border border-red-800 rounded-badge"
              >
                Confirmar
              </button>
              <button onClick={() => setConfirmDelete(false)} className="p-0.5 text-gray-500 hover:text-foreground">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add photo modal ────────────────────────────────────────────────────────────

interface AddModalProps {
  pagina: PageKey;
  onClose: () => void;
  onAdded: (foto: GaleriaItem) => void;
}

function AddModal({ pagina, onClose, onAdded }: AddModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Use JPG, PNG ou WebP");
      return;
    }
    if (f.size > 5 * 1024 * 1024) { setError("Máximo 5MB"); return; }
    setFile(f);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSave() {
    if (!file) { setError("Selecione uma imagem"); return; }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pagina", pagina);
      if (titulo.trim()) fd.append("titulo", titulo.trim());

      const res = await fetch("/api/admin/galeria", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      onAdded(data.foto);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const dica = DIMENSOES[pagina] ?? DEFAULT_DIMENSAO;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-card w-full max-w-md shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-sans font-semibold text-foreground">Adicionar foto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-surface-border hover:border-gold/50 rounded-card p-6 text-center cursor-pointer transition-colors relative overflow-hidden"
          >
            {preview ? (
              <div className="relative h-40 w-full">
                <Image src={preview} alt="preview" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="py-4">
                <Upload size={28} className="text-gray-500 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-400 font-sans">Arraste ou clique para selecionar</p>
                <p className="text-xs text-gray-600 mt-1 font-sans">{dica}</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs text-gray-400 font-sans mb-1">Título (opcional)</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Maquiagem de noiva clássica"
              className="input-luxury text-sm"
            />
          </div>

          {/* Página */}
          <div>
            <label className="block text-xs text-gray-400 font-sans mb-1">Página</label>
            <input
              value={PAGINAS.find((p) => p.key === pagina)?.label ?? pagina}
              readOnly
              className="input-luxury text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-sans bg-red-950/30 border border-red-800 rounded-btn p-3">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} className="btn-outline-gold text-sm py-2 px-4">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !file}
            className="btn-gold text-sm py-2 px-5 flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Salvar foto
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Textos tab form ────────────────────────────────────────────────────────────

interface TextoFormProps {
  pagina: PageKey;
  label: string;
  initial: ConteudoPagina;
  onSaved: (updated: ConteudoPagina) => void;
}

function TextoForm({ pagina, label, initial, onSaved }: TextoFormProps) {
  const [titulo, setTitulo] = useState(initial.titulo ?? "");
  const [subtitulo, setSubtitulo] = useState(initial.subtitulo ?? "");
  const [descricao, setDescricao] = useState(initial.descricao_curta ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/conteudo-paginas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina, titulo, subtitulo, descricao_curta: descricao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      onSaved(data.pagina);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  const descWarn = descricao.length > 155;
  const descOver = descricao.length > 160;

  return (
    <div className="card-luxury space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-semibold text-foreground text-sm">{label}</h3>
        {initial.updated_at && (
          <span className="text-xs text-gray-500 font-sans">
            Atualizado em {formatDate(initial.updated_at)}
          </span>
        )}
      </div>

      <div className="grid gap-3">
        <div>
          <label className="block text-xs text-gray-400 font-sans mb-1">
            Título <span className="text-gray-600">(H1 da página)</span>
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="input-luxury text-sm"
            placeholder="Ex: Maquiagem Social em Passos MG"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 font-sans mb-1">
            Subtítulo <span className="text-gray-600">(texto abaixo do H1)</span>
          </label>
          <input
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            className="input-luxury text-sm"
            placeholder="Ex: Look perfeito para festas e eventos especiais"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400 font-sans">
              Descrição curta <span className="text-gray-600">(meta description)</span>
            </label>
            <span className={`text-xs font-sans font-medium ${descOver ? "text-red-400" : descWarn ? "text-yellow-400" : "text-gray-500"}`}>
              {descricao.length}/160
            </span>
          </div>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            maxLength={160}
            className="input-luxury text-sm resize-none"
            placeholder="Descrição breve para aparecer nos resultados de busca do Google…"
          />
          {descWarn && !descOver && (
            <p className="text-xs text-yellow-400 mt-1 font-sans flex items-center gap-1">
              <AlertTriangle size={11} /> Acima de 155 caracteres pode ser cortado no Google
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 font-sans flex items-center gap-1.5">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold text-sm py-2 px-5 flex items-center gap-2"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const EMPTY_CONTEUDO = (pagina: PageKey): ConteudoPagina => ({
  pagina,
  titulo: "",
  subtitulo: "",
  descricao_curta: "",
  updated_at: null,
});

export default function AdminSitePage() {
  const [activeTab, setActiveTab] = useState<TabType>("fotos");
  const [selectedPage, setSelectedPage] = useState<PageKey>("home");
  const [fotos, setFotos] = useState<GaleriaItem[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [textos, setTextos] = useState<Record<PageKey, ConteudoPagina>>(
    Object.fromEntries(PAGINAS.map((p) => [p.key, EMPTY_CONTEUDO(p.key)])) as Record<PageKey, ConteudoPagina>
  );
  const [loadingTextos, setLoadingTextos] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Load photos for selected page
  const loadFotos = useCallback(async (pagina: string) => {
    setLoadingFotos(true);
    try {
      const res = await fetch(`/api/admin/galeria?pagina=${pagina}`);
      const data = await res.json();
      setFotos(data.fotos ?? []);
    } catch { /* ignore */ } finally {
      setLoadingFotos(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "fotos") loadFotos(selectedPage);
  }, [selectedPage, activeTab, loadFotos]);

  // Load texts once
  useEffect(() => {
    if (activeTab !== "textos") return;
    setLoadingTextos(true);
    fetch("/api/admin/conteudo-paginas")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<PageKey, ConteudoPagina> = Object.fromEntries(
          PAGINAS.map((p) => [p.key, EMPTY_CONTEUDO(p.key)])
        ) as Record<PageKey, ConteudoPagina>;
        for (const item of data.paginas ?? []) {
          if (item.pagina in map) map[item.pagina as PageKey] = item;
        }
        setTextos(map);
      })
      .catch(() => {})
      .finally(() => setLoadingTextos(false));
  }, [activeTab]);

  // DnD reorder
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fotos.findIndex((f) => f.id === active.id);
    const newIdx = fotos.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fotos, oldIdx, newIdx).map((f, i) => ({ ...f, ordem: i + 1 }));
    setFotos(reordered);
    // Persist
    fetch("/api/admin/galeria/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((f) => ({ id: f.id, ordem: f.ordem })) }),
    }).catch(() => {});
  }

  // Toggle active
  async function handleToggle(id: string, ativo: boolean) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ativo } : f)));
    await fetch(`/api/admin/galeria/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });
  }

  // Delete
  async function handleDelete(id: string) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
    await fetch(`/api/admin/galeria/${id}`, { method: "DELETE" });
  }

  // Save title
  async function handleSaveTitle(id: string, titulo: string) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, titulo: titulo || null } : f)));
    await fetch(`/api/admin/galeria/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    });
  }

  // Photo added
  function handlePhotoAdded(foto: GaleriaItem) {
    setFotos((prev) => [...prev, foto]);
  }

  const pageConfig = PAGINAS.find((p) => p.key === selectedPage)!;
  const limite = pageConfig.limite;
  const atLimit = fotos.length >= limite;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe size={22} className="text-gold" strokeWidth={1.5} />
        <div>
          <h1 className="font-sans font-bold text-xl text-foreground">Gerenciar Site</h1>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Edite fotos e textos das páginas públicas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-elevated rounded-btn p-1 w-fit">
        {(["fotos", "textos"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-sans font-medium rounded-btn transition-colors capitalize ${
              activeTab === tab
                ? "bg-surface-card text-foreground shadow-card"
                : "text-gray-500 hover:text-foreground"
            }`}
          >
            {tab === "fotos" ? "📷 Fotos" : "✏️ Textos"}
          </button>
        ))}
      </div>

      {/* ── FOTOS TAB ── */}
      {activeTab === "fotos" && (
        <div className="space-y-5">
          {/* Page pills */}
          <div className="flex gap-2 flex-wrap">
            {PAGINAS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPage(p.key)}
                className={`px-3 py-1.5 text-xs font-sans font-medium rounded-btn border transition-colors ${
                  selectedPage === p.key
                    ? "bg-gold-muted border-gold/40 text-gold"
                    : "border-surface-border text-gray-400 hover:text-foreground hover:border-gold/30"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Count + limit bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-sans">
              {fotos.length} de {limite} fotos
              {atLimit && (
                <span className="ml-2 text-yellow-400 flex items-center gap-1 inline-flex">
                  <AlertTriangle size={11} /> Limite atingido
                </span>
              )}
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={atLimit}
              className="btn-gold text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Adicionar foto
            </button>
          </div>

          {/* Grid */}
          {loadingFotos ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="aspect-square bg-surface-elevated rounded-card animate-pulse" />
              ))}
            </div>
          ) : fotos.length === 0 ? (
            <div className="border-2 border-dashed border-surface-border rounded-card p-12 text-center">
              <ImageIcon size={32} className="text-gray-600 mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm text-gray-500 font-sans">Nenhuma foto cadastrada</p>
              <p className="text-xs text-gray-600 font-sans mt-1">
                Clique em &ldquo;Adicionar foto&rdquo; para começar
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fotos.map((f) => f.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-3">
                  {fotos.map((foto) => (
                    <SortableCard
                      key={foto.id}
                      foto={foto}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onSaveTitle={handleSaveTitle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ── TEXTOS TAB ── */}
      {activeTab === "textos" && (
        <div className="space-y-4 max-w-2xl">
          {loadingTextos ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 bg-surface-elevated rounded-card animate-pulse" />
              ))}
            </div>
          ) : (
            PAGINAS.map((p) => (
              <TextoForm
                key={p.key}
                pagina={p.key}
                label={p.label}
                initial={textos[p.key]}
                onSaved={(updated) =>
                  setTextos((prev) => ({ ...prev, [p.key]: updated }))
                }
              />
            ))
          )}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddModal
          pagina={selectedPage}
          onClose={() => setShowAddModal(false)}
          onAdded={handlePhotoAdded}
        />
      )}
    </div>
  );
}
