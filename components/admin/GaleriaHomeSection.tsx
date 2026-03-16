"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FotoGaleria {
  id: string;
  imagem_url: string;
  titulo: string | null;
  ativo: boolean;
  ordem: number;
}

// ── Sortable photo card ───────────────────────────────────────────────────────

interface CardProps {
  foto: FotoGaleria;
  onTituloChange: (id: string, titulo: string) => void;
  onToggleAtivo: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
}

function SortableCard({ foto, onTituloChange, onToggleAtivo, onDelete }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: foto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const [editingTitulo, setEditingTitulo] = useState(false);
  const [tituloLocal, setTituloLocal] = useState(foto.titulo ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveTitulo() {
    setEditingTitulo(false);
    if (tituloLocal === (foto.titulo ?? "")) return;
    await fetch(`/api/admin/galeria/${foto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: tituloLocal }),
    });
    onTituloChange(foto.id, tituloLocal);
  }

  async function toggleAtivo() {
    const newAtivo = !foto.ativo;
    await fetch(`/api/admin/galeria/${foto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: newAtivo }),
    });
    onToggleAtivo(foto.id, newAtivo);
  }

  async function handleDelete() {
    await fetch(`/api/admin/galeria/${foto.id}`, { method: "DELETE" });
    onDelete(foto.id);
    setConfirmDelete(false);
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Thumbnail */}
      <div
        className={`relative aspect-square rounded-card overflow-hidden border border-surface-border transition-opacity ${
          foto.ativo ? "" : "opacity-40"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.imagem_url} alt={foto.titulo ?? ""} className="w-full h-full object-cover" />

        {/* Controls — shown on hover */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors group flex">
          {/* Drag handle */}
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="absolute top-1.5 left-1.5 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            aria-label="Arrastar"
          >
            <GripVertical size={13} />
          </button>

          {/* Toggle ativo */}
          <button
            onClick={toggleAtivo}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-sans leading-none"
            title={foto.ativo ? "Ocultar" : "Exibir"}
          >
            {foto.ativo ? "●" : "○"}
          </button>

          {/* Delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Excluir foto"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Confirm delete overlay */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 p-2">
            <p className="text-white text-[11px] font-sans text-center leading-tight">
              Excluir foto?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-500 text-white text-[11px] px-2.5 py-1 rounded font-sans"
              >
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-surface-elevated text-foreground/70 text-[11px] px-2.5 py-1 rounded font-sans"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-1">
        {editingTitulo ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tituloLocal}
              onChange={(e) => setTituloLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitulo();
                if (e.key === "Escape") {
                  setEditingTitulo(false);
                  setTituloLocal(foto.titulo ?? "");
                }
              }}
              autoFocus
              className="flex-1 text-xs font-sans bg-surface-card border border-surface-border rounded px-2 py-1 text-foreground/80 focus:outline-none focus:border-gold"
              placeholder="Título (opcional)"
            />
            <button onClick={saveTitulo} className="text-green-500 hover:text-green-400 transition-colors">
              <Check size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingTitulo(true)}
            className="w-full text-left text-[11px] font-sans text-foreground/40 hover:text-foreground/70 transition-colors truncate flex items-center gap-1"
          >
            <Pencil size={9} className="shrink-0" />
            {foto.titulo || <span className="italic">Sem título</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Upload panel ──────────────────────────────────────────────────────────────

interface UploadPanelProps {
  onSaved: (foto: FotoGaleria) => void;
  onCancel: () => void;
}

function UploadPanel({ onSaved, onCancel }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Use JPG, PNG ou WebP");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Máximo 5MB");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("pagina", "home");
    fd.append("titulo", titulo);
    try {
      const res = await fetch("/api/admin/galeria", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar");
        return;
      }
      onSaved(data.foto);
    } catch {
      setError("Erro ao salvar foto");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-[var(--gold-muted-border)] rounded-card p-4 space-y-4">
      {/* Drop / preview area */}
      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed border-[var(--gold-muted-border)] rounded-card aspect-square max-w-[180px] mx-auto flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors"
        >
          <Camera size={26} className="text-gold" strokeWidth={1} />
          <p className="text-foreground/40 text-[11px] font-sans text-center px-2 leading-relaxed">
            Arraste a foto ou clique para selecionar
          </p>
        </div>
      ) : (
        <div className="relative max-w-[180px] mx-auto">
          <div className="aspect-square relative rounded-card overflow-hidden border border-surface-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => {
              setPreview(null);
              setFile(null);
            }}
            className="absolute -top-2 -right-2 bg-surface-elevated border border-surface-border rounded-full p-1 text-foreground/60 hover:text-foreground transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <p className="text-foreground/30 text-[10px] font-sans text-center">
        Dimensão ideal: 800×800px (proporção 1:1) — JPG, PNG ou WebP, máx. 5MB
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <div>
        <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-1.5">
          Título (opcional)
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Maquiagem para formatura"
          className="input-luxury"
        />
      </div>

      {error && <p className="text-red-400 text-xs font-sans">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 border border-surface-border text-foreground/60 text-sm font-sans py-2 rounded-btn hover:border-[var(--gold-muted-border)] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!file || uploading}
          className="flex-1 btn-gold text-sm py-2 disabled:opacity-50"
        >
          {uploading ? "Salvando..." : "Salvar foto"}
        </button>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function GaleriaHomeSection() {
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  useEffect(() => {
    fetch("/api/admin/galeria?pagina=home")
      .then((r) => r.json())
      .then(({ fotos: data }) => {
        if (Array.isArray(data)) setFotos(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fotos.findIndex((f) => f.id === active.id);
    const newIndex = fotos.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fotos, oldIndex, newIndex).map((f, i) => ({
      ...f,
      ordem: i + 1,
    }));
    setFotos(reordered);
    await fetch("/api/admin/galeria/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map(({ id, ordem }) => ({ id, ordem })),
      }),
    });
  }

  function handleDelete(id: string) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
  }

  function handleTituloChange(id: string, titulo: string) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, titulo } : f)));
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ativo } : f)));
  }

  function handleSaved(foto: FotoGaleria) {
    setFotos((prev) => [...prev, foto]);
    setShowUpload(false);
  }

  return (
    <div className="border-t border-[var(--gold-muted-border)] pt-5 space-y-4">
      <div className="flex items-center gap-2">
        <Camera size={14} className="text-gold" strokeWidth={1.5} />
        <span className="text-xs font-sans text-foreground/50 uppercase tracking-widest">
          Galeria da Home
        </span>
      </div>
      <p className="text-foreground/35 text-[11px] font-sans leading-relaxed">
        Fotos do carrossel na página inicial. Sem limite — adicione quantas quiser. Arraste para
        reordenar.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 text-xs font-sans">Carregando...</span>
        </div>
      ) : (
        <>
          {fotos.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fotos.map((f) => f.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotos.map((foto) => (
                    <SortableCard
                      key={foto.id}
                      foto={foto}
                      onTituloChange={handleTituloChange}
                      onToggleAtivo={handleToggleAtivo}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {fotos.length === 0 && !showUpload && (
            <p className="text-foreground/30 text-xs font-sans text-center py-4">
              Nenhuma foto ainda. Adicione a primeira!
            </p>
          )}

          {showUpload ? (
            <UploadPanel onSaved={handleSaved} onCancel={() => setShowUpload(false)} />
          ) : (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 border border-[var(--gold-muted-border)] text-foreground/60 text-sm font-sans px-4 py-2 rounded-btn hover:border-gold hover:text-gold transition-colors"
            >
              <Plus size={14} />
              Adicionar foto
            </button>
          )}
        </>
      )}
    </div>
  );
}
