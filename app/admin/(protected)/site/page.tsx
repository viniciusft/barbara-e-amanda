"use client";

import {
  useEffect, useState, useRef, useCallback,
} from "react";
import Link from "next/link";
import {
  Globe, GripVertical, Trash2, Eye, EyeOff, Check, X,
  AlertTriangle, Info, Upload, Plus, Monitor, Smartphone,
  Star, ExternalLink, RefreshCw,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { revalidarPagina } from "@/app/actions/revalidate";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FotoItem {
  id: string;
  titulo: string | null;
  imagem_url: string;
  tipo_exibicao: string;
  ativo: boolean;
  ordem: number;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ConteudoData {
  titulo?: string | null;
  subtitulo?: string | null;
  texto_principal?: string | null;
  meta_description?: string | null;
  descricao_curta?: string | null;
  faq?: FaqItem[] | null;
  updated_at?: string | null;
}

interface ServicoData {
  id?: string;
  nome?: string;
  preco?: number | null;
  duracao_minutos?: number | null;
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-surface-card border border-gold/30 text-foreground px-4 py-3 rounded-card shadow-modal text-sm font-sans animate-in slide-in-from-top-2">
      <Check size={14} className="text-gold shrink-0" />
      {message}
    </div>
  );
}

// ── SortablePhotoCard ─────────────────────────────────────────────────────────

interface SortablePhotoCardProps {
  foto: FotoItem;
  onTitleSave: (id: string, titulo: string) => void;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
}

function SortablePhotoCard({ foto, onTitleSave, onToggle, onDelete }: SortablePhotoCardProps) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: foto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(foto.titulo ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setTitleVal(foto.titulo ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  }

  function commitTitle() {
    setEditing(false);
    onTitleSave(foto.id, titleVal);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-3 p-3 bg-surface-card border border-surface-border rounded-btn group"
    >
      {/* Drag handle */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gold shrink-0 touch-none"
      >
        <GripVertical size={16} strokeWidth={1.5} />
      </div>

      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.imagem_url}
        alt={foto.titulo ?? "foto"}
        className="w-14 h-14 rounded object-cover shrink-0 bg-surface-elevated"
      />

      {/* Title (editable inline) */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") setEditing(false);
              }}
              className="input-luxury text-xs py-1 px-2 flex-1"
              placeholder="Título da foto"
            />
            <button onClick={commitTitle} className="p-1 text-gold hover:text-gold-light">
              <Check size={13} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-500 hover:text-foreground">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="text-xs text-left text-gray-400 hover:text-foreground truncate block w-full px-1 rounded hover:bg-surface-elevated transition-colors py-0.5"
            title="Clique para editar"
          >
            {foto.titulo || <span className="italic text-gray-600">sem título</span>}
          </button>
        )}

        {/* Toggle + Delete */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => onToggle(foto.id, !foto.ativo)}
            className={`flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-badge border transition-colors ${
              foto.ativo
                ? "border-gold/30 text-gold hover:bg-gold-muted"
                : "border-surface-border text-gray-500 hover:text-foreground"
            }`}
          >
            {foto.ativo ? <Eye size={10} /> : <EyeOff size={10} />}
            {foto.ativo ? "Ativo" : "Inativo"}
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1 text-[10px] font-sans">
              <span className="text-gray-400">Remover?</span>
              <button
                onClick={() => { setConfirmDelete(false); onDelete(foto.id); }}
                className="text-red-400 hover:text-red-300 border border-red-800 px-1.5 py-0.5 rounded-badge"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-gray-500 hover:text-foreground border border-surface-border px-1.5 py-0.5 rounded-badge"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-0.5 text-gray-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SortableFaqItem ───────────────────────────────────────────────────────────

interface SortableFaqItemProps {
  id: string;
  question: string;
  answer: string;
  onChange: (field: "question" | "answer", value: string) => void;
  onDelete: () => void;
}

function SortableFaqItem({ id, question, answer, onChange, onDelete }: SortableFaqItemProps) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border border-surface-border rounded-card p-3 bg-surface-card space-y-2"
    >
      <div className="flex items-start gap-2">
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gold mt-1 shrink-0 touch-none"
        >
          <GripVertical size={15} strokeWidth={1.5} />
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={question}
            onChange={(e) => onChange("question", e.target.value)}
            placeholder="Pergunta"
            className="input-luxury text-xs py-1.5 px-2"
          />
          <textarea
            value={answer}
            onChange={(e) => onChange("answer", e.target.value)}
            placeholder="Resposta"
            rows={3}
            className="input-luxury text-xs py-1.5 px-2 resize-none"
          />
        </div>
        <button
          onClick={onDelete}
          className="p-1 text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

const SEO_HINT_CLASS = "flex items-start gap-1.5 text-[10px] text-gray-500 font-sans mt-1.5 leading-relaxed";

// ── Páginas disponíveis ────────────────────────────────────────────────────────

const PAGINAS = [
  { slug: "maquiagem-social",   label: "Maquiagem Social",     rota: "/servicos/maquiagem-social",   temServico: true,  grupo: "servicos" },
  { slug: "maquiagem-noiva",    label: "Maquiagem Noiva",      rota: "/servicos/maquiagem-noiva",    temServico: true,  grupo: "servicos" },
  { slug: "penteado",           label: "Penteado",             rota: "/servicos/penteado",           temServico: true,  grupo: "servicos" },
  { slug: "babyliss",           label: "Babyliss",             rota: "/servicos/babyliss",           temServico: true,  grupo: "servicos" },
  { slug: "maquiagem-e-penteado", label: "Maquiagem + Penteado", rota: "/servicos/maquiagem-e-penteado", temServico: true, grupo: "servicos" },
  { slug: "casamento",          label: "Casamento",            rota: "/ocasioes/casamento",          temServico: false, grupo: "ocasioes" },
  { slug: "formatura",          label: "Formatura",            rota: "/ocasioes/formatura",          temServico: false, grupo: "ocasioes" },
  { slug: "eventos",            label: "Eventos",              rota: "/ocasioes/eventos",            temServico: false, grupo: "ocasioes" },
] as const;

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSitePage() {
  const [selectedSlug, setSelectedSlug] = useState("maquiagem-social");
  const paginaConfig = PAGINAS.find((p) => p.slug === selectedSlug) ?? PAGINAS[0];
  const PAGINA = paginaConfig.slug;
  const PUBLIC_PATH = paginaConfig.rota;

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"textos" | "fotos" | "faq">("textos");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ── Preview (iframe) ─────────────────────────────────────────────────────────
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");

  function recarregarPreview() {
    setIframeLoading(true);
    setPreviewUrl(`${PUBLIC_PATH}?preview=1&t=${Date.now()}`);
  }

  // ── Textos ──────────────────────────────────────────────────────────────────
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [textoPrincipal, setTextoPrincipal] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [savingTextos, setSavingTextos] = useState(false);
  const [servico, setServico] = useState<ServicoData | null>(null);
  const [camposAlterados, setCamposAlterados] = useState<Set<string>>(new Set());
  const temMudancas = camposAlterados.size > 0;

  function marcarAlterado(campo: string) {
    setCamposAlterados((prev) => new Set(prev).add(campo));
  }

  const wordCount = textoPrincipal.trim() ? textoPrincipal.trim().split(/\s+/).length : 0;
  const metaLen = metaDesc.length;

  // ── Fotos ───────────────────────────────────────────────────────────────────
  const [tipoFoto, setTipoFoto] = useState<"carrossel" | "grid">("carrossel");
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadMobileFile, setUploadMobileFile] = useState<File | null>(null);
  const [showMobileUpload, setShowMobileUpload] = useState(false);
  const [uploadTitulo, setUploadTitulo] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // ── Hero foto upload ─────────────────────────────────────────────────────────
  const [showHeroUpload, setShowHeroUpload] = useState(false);
  const [heroUploadFile, setHeroUploadFile] = useState<File | null>(null);
  const [heroUploadPreview, setHeroUploadPreview] = useState<string | null>(null);
  const [heroUploadLoading, setHeroUploadLoading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const heroFoto = fotos.find((f) => f.tipo_exibicao === "hero") ?? null;
  const fotosFiltradas = fotos.filter((f) => f.tipo_exibicao === tipoFoto);
  const LIMITE = 6;
  const atLimit = fotosFiltradas.length >= LIMITE;

  // ── FAQ ─────────────────────────────────────────────────────────────────────
  const [faqs, setFaqs] = useState<(FaqItem & { _id: string })[]>([]);
  const [savingFaq, setSavingFaq] = useState(false);

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // ── Load data (re-runs on page change) ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      // Reset form state for new page
      setTitulo("");
      setSubtitulo("");
      setTextoPrincipal("");
      setMetaDesc("");
      setLastSaved(null);
      setServico(null);
      setCamposAlterados(new Set());
      setFotos([]);
      setFaqs([]);
      setShowUpload(false);
      setShowHeroUpload(false);
      // Set preview URL immediately (before data loads)
      setIframeLoading(true);
      setPreviewUrl(`${PUBLIC_PATH}?preview=1`);
      try {
        const res = await fetch(`/api/admin/site/conteudo?pagina=${PAGINA}`);
        const data = await res.json();

        const c: ConteudoData = data.conteudo ?? {};
        setTitulo(c.titulo ?? "");
        setSubtitulo(c.subtitulo ?? "");
        setTextoPrincipal(c.texto_principal ?? "");
        setMetaDesc(c.meta_description ?? c.descricao_curta ?? "");
        setLastSaved(c.updated_at ?? null);
        setServico(data.servico ?? null);

        const rawFaqs = c.faq ?? [];
        setFaqs(rawFaqs.map((f, i) => ({ ...f, _id: `faq-${i}-${Date.now()}` })));

        setFotos(data.fotos ?? []);
      } catch {
        /* keep empty state */
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug]);

  // ── Salvar textos ────────────────────────────────────────────────────────────
  async function handleSaveTextos() {
    setSavingTextos(true);
    try {
      const res = await fetch("/api/admin/site/conteudo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagina: PAGINA,
          titulo,
          subtitulo,
          texto_principal: textoPrincipal,
          meta_description: metaDesc,
          descricao_curta: metaDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setLastSaved(data.conteudo?.updated_at ?? new Date().toISOString());
      setCamposAlterados(new Set());
      await revalidarPagina(PUBLIC_PATH);
      recarregarPreview();
      showToast("Página atualizada com sucesso ✓");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingTextos(false);
    }
  }

  // ── Toggle foto ativo ────────────────────────────────────────────────────────
  async function handleToggleFoto(id: string, ativo: boolean) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ativo } : f)));
    await fetch(`/api/admin/site/fotos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });
  }

  // ── Salvar título da foto ────────────────────────────────────────────────────
  async function handleTitleSave(id: string, newTitulo: string) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, titulo: newTitulo || null } : f)));
    await fetch(`/api/admin/site/fotos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: newTitulo }),
    });
  }

  // ── Deletar foto ─────────────────────────────────────────────────────────────
  async function handleDeleteFoto(id: string) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
    await fetch(`/api/admin/site/fotos/${id}`, { method: "DELETE" });
    await revalidarPagina(PUBLIC_PATH);
  }

  // ── Reordenar fotos ──────────────────────────────────────────────────────────
  function handleDragEndFotos(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = fotosFiltradas.findIndex((f) => f.id === active.id);
    const newIdx = fotosFiltradas.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fotosFiltradas, oldIdx, newIdx);

    // Rebuild full fotos array preserving other tipo_exibicao items
    const others = fotos.filter((f) => f.tipo_exibicao !== tipoFoto);
    const updated = [...others, ...reordered.map((f, i) => ({ ...f, ordem: i + 1 }))];
    setFotos(updated);

    fetch("/api/admin/site/fotos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((f, i) => ({ id: f.id, ordem: i + 1 })) }),
    }).then(() => revalidarPagina(PUBLIC_PATH)).catch(() => {});
  }

  // ── Upload foto ──────────────────────────────────────────────────────────────
  function handleFileSelect(f: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setUploadError("Use JPG, PNG ou WebP"); return;
    }
    if (f.size > 5 * 1024 * 1024) { setUploadError("Máximo 5MB"); return; }
    setUploadFile(f);
    setUploadError(null);
    setUploadPreview(URL.createObjectURL(f));
  }

  async function handleSaveUpload() {
    if (!uploadFile) { setUploadError("Selecione uma imagem"); return; }
    setUploadLoading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      if (uploadMobileFile) fd.append("file_mobile", uploadMobileFile);
      fd.append("pagina", PAGINA);
      fd.append("tipo_exibicao", tipoFoto);
      if (uploadTitulo.trim()) fd.append("titulo", uploadTitulo.trim());

      const res = await fetch("/api/admin/site/fotos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");

      setFotos((prev) => [...prev, data.foto]);
      setShowUpload(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadMobileFile(null);
      setShowMobileUpload(false);
      setUploadTitulo("");
      await revalidarPagina(PUBLIC_PATH);
      showToast("Foto adicionada com sucesso ✓");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setUploadLoading(false);
    }
  }

  // ── Hero foto handlers ────────────────────────────────────────────────────────
  function handleHeroFileSelect(f: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setHeroUploadError("Use JPG, PNG ou WebP"); return;
    }
    if (f.size > 5 * 1024 * 1024) { setHeroUploadError("Máximo 5MB"); return; }
    setHeroUploadFile(f);
    setHeroUploadError(null);
    setHeroUploadPreview(URL.createObjectURL(f));
  }

  async function handleSaveHeroUpload() {
    if (!heroUploadFile) { setHeroUploadError("Selecione uma imagem"); return; }
    setHeroUploadLoading(true);
    setHeroUploadError(null);
    try {
      // Delete existing hero first
      if (heroFoto) {
        await fetch(`/api/admin/site/fotos/${heroFoto.id}`, { method: "DELETE" });
        setFotos((prev) => prev.filter((f) => f.id !== heroFoto.id));
      }
      const fd = new FormData();
      fd.append("file", heroUploadFile);
      fd.append("pagina", PAGINA);
      fd.append("tipo_exibicao", "hero");

      const res = await fetch("/api/admin/site/fotos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");

      setFotos((prev) => [...prev, data.foto]);
      setShowHeroUpload(false);
      setHeroUploadFile(null);
      setHeroUploadPreview(null);
      await revalidarPagina(PUBLIC_PATH);
      showToast("Foto de fundo atualizada ✓");
    } catch (e) {
      setHeroUploadError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setHeroUploadLoading(false);
    }
  }

  async function handleDeleteHero() {
    if (!heroFoto) return;
    setFotos((prev) => prev.filter((f) => f.id !== heroFoto.id));
    await fetch(`/api/admin/site/fotos/${heroFoto.id}`, { method: "DELETE" });
    await revalidarPagina(PUBLIC_PATH);
    showToast("Foto de fundo removida");
  }

  // ── Reordenar FAQ ────────────────────────────────────────────────────────────
  function handleDragEndFaq(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = faqs.findIndex((f) => f._id === active.id);
    const newIdx = faqs.findIndex((f) => f._id === over.id);
    setFaqs(arrayMove(faqs, oldIdx, newIdx));
  }

  // ── Salvar FAQ ───────────────────────────────────────────────────────────────
  async function handleSaveFaq() {
    setSavingFaq(true);
    try {
      const payload = faqs.map(({ question, answer }) => ({ question, answer }));
      const res = await fetch("/api/admin/site/conteudo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: PAGINA, faq: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      await revalidarPagina(PUBLIC_PATH);
      recarregarPreview();
      showToast("FAQ atualizado com sucesso ✓");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar FAQ");
    } finally {
      setSavingFaq(false);
    }
  }

  // ── Tab labels ───────────────────────────────────────────────────────────────
  const TABS = [
    { key: "textos", label: "Textos" },
    { key: "fotos", label: "Fotos" },
    { key: "faq", label: "FAQ" },
  ] as const;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Two-column layout — negate parent padding to go full-width */}
      <div className="-mx-4 lg:-mx-8 -mt-6">
        <div className="flex lg:h-screen">

          {/* ═══════════ LEFT PANEL — Editor ═══════════ */}
          <div className="w-full lg:w-[340px] shrink-0 border-r border-surface-border flex flex-col overflow-hidden bg-surface">

            {/* Header */}
            <div className="px-4 py-4 border-b border-surface-border shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} className="text-gold" strokeWidth={1.5} />
                <span className="font-sans font-semibold text-foreground text-sm">Gerenciar Site</span>
              </div>

              {/* Page selector */}
              <label className="block text-[10px] text-gray-500 font-sans uppercase tracking-wider mb-1">
                Página
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => { setSelectedSlug(e.target.value); setTab("textos"); }}
                className="input-luxury text-sm w-full"
              >
                <optgroup label="── Serviços ──">
                  {PAGINAS.filter((p) => p.grupo === "servicos").map((p) => (
                    <option key={p.slug} value={p.slug}>{p.label}</option>
                  ))}
                </optgroup>
                <optgroup label="── Ocasiões ──">
                  {PAGINAS.filter((p) => p.grupo === "ocasioes").map((p) => (
                    <option key={p.slug} value={p.slug}>{p.label}</option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[10px] text-gray-600 font-sans mt-1.5 flex items-center gap-1">
                <Info size={10} /> {paginaConfig.rota}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-border shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-3 text-xs font-sans font-medium transition-colors ${
                    tab === t.key
                      ? "border-b-2 border-gold text-gold"
                      : "text-gray-500 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* ─── ABA TEXTOS ─── */}
                  {tab === "textos" && (
                    <div className="px-4 py-5 space-y-5">

                      {/* Título */}
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                          Título da página (H1)
                        </label>
                        <input
                          value={titulo}
                          onChange={(e) => { setTitulo(e.target.value); marcarAlterado("titulo"); }}
                          className={`input-luxury text-sm ${camposAlterados.has("titulo") ? "ring-1 ring-gold/50" : ""}`}
                          placeholder="Maquiagem Social em Passos MG"
                        />
                        <p className={SEO_HINT_CLASS}>
                          <Info size={10} className="text-gold mt-0.5 shrink-0" />
                          Inclua: &quot;maquiagem social&quot;, &quot;Passos MG&quot;. Ex: Maquiagem Social em Passos MG
                        </p>
                      </div>

                      {/* Subtítulo */}
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                          Subtítulo
                        </label>
                        <input
                          value={subtitulo}
                          onChange={(e) => { setSubtitulo(e.target.value); marcarAlterado("subtitulo"); }}
                          className={`input-luxury text-sm ${camposAlterados.has("subtitulo") ? "ring-1 ring-gold/50" : ""}`}
                          placeholder="Para festas, formaturas e eventos especiais"
                        />
                        <p className={SEO_HINT_CLASS}>
                          <Info size={10} className="text-gold mt-0.5 shrink-0" />
                          Mencione o tipo de evento ou público
                        </p>
                      </div>

                      {/* Texto principal */}
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                          Texto principal
                        </label>
                        <textarea
                          value={textoPrincipal}
                          onChange={(e) => { setTextoPrincipal(e.target.value); marcarAlterado("texto"); }}
                          rows={5}
                          style={{ height: 120 }}
                          className={`input-luxury text-sm resize-none ${camposAlterados.has("texto") ? "ring-1 ring-gold/50" : ""}`}
                          placeholder="Descreva o serviço em detalhe..."
                        />
                        {/* Word count indicator */}
                        <div className={`flex items-center gap-1.5 text-[10px] mt-1 font-sans ${
                          wordCount >= 100 ? "text-green-400" : wordCount >= 80 ? "text-gold" : "text-gray-500"
                        }`}>
                          {wordCount >= 100
                            ? <Check size={10} />
                            : wordCount >= 80
                            ? <AlertTriangle size={10} />
                            : <AlertTriangle size={10} />}
                          {wordCount} palavras
                          {wordCount < 80 && " — Adicione mais texto para melhorar o SEO"}
                          {wordCount >= 80 && wordCount < 100 && " — Quase lá, mínimo 100 palavras"}
                          {wordCount >= 100 && " — Ótimo para SEO"}
                        </div>
                        <p className={SEO_HINT_CLASS}>
                          <Info size={10} className="text-gold mt-0.5 shrink-0" />
                          Mencione: &quot;maquiagem social Passos&quot;, &quot;maquiagem para festa&quot;. Mínimo 100 palavras.
                        </p>
                      </div>

                      {/* Preço e Duração — somente leitura, vem de Serviços */}
                      {(servico?.preco != null || servico?.duracao_minutos != null) && (
                        <div className="bg-surface-elevated border border-surface-border rounded-card p-4 space-y-2">
                          <p className="text-xs font-medium text-foreground font-sans">Preço e duração</p>
                          <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                            Esses dados vêm do cadastro do serviço e não podem ser editados aqui.
                          </p>
                          <div className="flex items-center gap-4 py-1">
                            <span className="text-sm font-semibold text-gold font-sans">
                              {servico?.preco != null ? `R$ ${servico.preco}` : "—"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-sans">
                              {servico?.duracao_minutos != null ? `${servico.duracao_minutos} min` : "—"}
                            </span>
                          </div>
                          <Link
                            href="/admin/servicos"
                            className="inline-flex items-center gap-1 text-[10px] text-gold hover:text-gold-light font-sans transition-colors"
                          >
                            <ExternalLink size={10} />
                            Editar em Admin → Serviços
                          </Link>
                        </div>
                      )}

                      {/* Meta description */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-foreground font-sans">
                            Meta description (Google)
                          </label>
                          <span className={`text-[10px] font-medium font-sans ${
                            metaLen > 160 ? "text-red-400" : metaLen >= 120 ? "text-green-400" : "text-gold"
                          }`}>
                            {metaLen}/160
                          </span>
                        </div>
                        <textarea
                          value={metaDesc}
                          onChange={(e) => { setMetaDesc(e.target.value); marcarAlterado("meta"); }}
                          rows={2}
                          style={{ height: 60, resize: "none" }}
                          className={`input-luxury text-sm ${camposAlterados.has("meta") ? "ring-1 ring-gold/50" : ""}`}
                          placeholder="Maquiagem social profissional em Passos MG..."
                          maxLength={170}
                        />
                        <p className={SEO_HINT_CLASS}>
                          <Info size={10} className="text-gold mt-0.5 shrink-0" />
                          Inclua o nome do serviço e &quot;Passos MG&quot;, &quot;agendar online&quot;. Entre 120 e 160 chars.
                        </p>
                      </div>

                      {/* Save button */}
                      <button
                        onClick={handleSaveTextos}
                        disabled={savingTextos}
                        className={`w-full flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50 rounded-btn font-semibold transition-colors ${
                          temMudancas
                            ? "bg-gold text-[#111] hover:bg-gold-light"
                            : "btn-gold"
                        }`}
                      >
                        {savingTextos
                          ? <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                          : <Check size={14} />}
                        {temMudancas ? "Salvar e visualizar" : "Salvar e visualizar"}
                      </button>

                      {lastSaved && (
                        <p className="text-[10px] text-gray-500 font-sans text-center">
                          Última atualização: {formatDate(lastSaved)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ─── ABA FOTOS ─── */}
                  {tab === "fotos" && (
                    <div className="px-4 py-5 space-y-4">

                      {/* ── Foto de fundo do Hero ── */}
                      <div className="border border-gold/40 rounded-card p-4 space-y-3 bg-gold-muted/5">
                        <div>
                          <p className="text-xs font-medium text-foreground font-sans mb-0.5">
                            Foto de fundo do Hero
                          </p>
                          <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                            Aparece como fundo da seção principal com overlay escuro automático.
                          </p>
                        </div>

                        {/* Preview atual */}
                        {heroFoto ? (
                          <div className="relative rounded-btn overflow-hidden bg-surface-elevated" style={{ aspectRatio: "16/5" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={heroFoto.imagem_url}
                              alt="Hero"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <p className="text-white/70 text-[9px] font-sans">
                                {heroFoto.titulo || "Foto do hero"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="rounded-btn bg-surface-elevated border border-dashed border-gold/20 flex flex-col items-center justify-center gap-1.5 py-6"
                          >
                            <div className="w-8 h-8 rounded-full bg-gold-muted flex items-center justify-center">
                              <Upload size={14} className="text-gold" strokeWidth={1.5} />
                            </div>
                            <p className="text-[10px] text-gray-400 font-sans">Nenhuma foto de fundo</p>
                            <p className="text-[9px] text-gray-600 font-sans">
                              O hero usará fundo escuro padrão
                            </p>
                          </div>
                        )}

                        {/* Upload panel do Hero */}
                        {showHeroUpload && (
                          <div className="border border-gold/20 rounded-btn p-3 space-y-3 bg-surface-card">
                            <div
                              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleHeroFileSelect(f); }}
                              onDragOver={(e) => e.preventDefault()}
                              onClick={() => heroFileInputRef.current?.click()}
                              className="border-2 border-dashed border-gold/30 hover:border-gold/60 rounded-btn p-4 cursor-pointer text-center transition-colors"
                            >
                              {heroUploadPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={heroUploadPreview} alt="preview" className="max-h-32 mx-auto rounded object-contain" />
                              ) : (
                                <>
                                  <Upload size={20} className="text-gold/60 mx-auto mb-1" strokeWidth={1.5} />
                                  <p className="text-[10px] text-gray-400 font-sans">Arraste ou clique para selecionar</p>
                                  <p className="text-[9px] text-gray-600 mt-0.5 font-sans">Dimensão ideal: 1920×600px</p>
                                </>
                              )}
                              <input
                                ref={heroFileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFileSelect(f); }}
                              />
                            </div>
                            {heroUploadError && (
                              <p className="text-[10px] text-red-400 font-sans flex items-center gap-1">
                                <AlertTriangle size={10} /> {heroUploadError}
                              </p>
                            )}
                            <p className="text-[9px] text-gray-500 font-sans flex items-center gap-1">
                              <Info size={9} className="text-gold" />
                              O overlay escuro é aplicado automaticamente — não precisa editar a foto.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setShowHeroUpload(false); setHeroUploadFile(null); setHeroUploadPreview(null); setHeroUploadError(null); }}
                                className="flex-1 btn-outline-gold text-xs py-2"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleSaveHeroUpload}
                                disabled={heroUploadLoading || !heroUploadFile}
                                className="flex-1 btn-gold text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {heroUploadLoading
                                  ? <span className="w-3 h-3 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                                  : <Check size={12} />}
                                Salvar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!showHeroUpload && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowHeroUpload(true); setHeroUploadFile(null); setHeroUploadPreview(null); setHeroUploadError(null); }}
                              className="flex-1 btn-outline-gold text-xs py-2 flex items-center justify-center gap-1.5"
                            >
                              <Upload size={12} />
                              {heroFoto ? "Trocar foto" : "Adicionar foto"}
                            </button>
                            {heroFoto && (
                              <button
                                onClick={handleDeleteHero}
                                className="px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 rounded-btn transition-colors font-sans flex items-center gap-1"
                              >
                                <Trash2 size={11} />
                                Remover
                              </button>
                            )}
                          </div>
                        )}

                        <p className="text-[9px] text-gray-600 font-sans">
                          Dimensão ideal: 1920×600px · JPG, PNG ou WebP · Máx. 5MB
                        </p>
                      </div>

                      {/* Separador */}
                      <div className="border-t border-surface-border pt-4">
                        <p className="text-[10px] text-gray-500 font-sans uppercase tracking-wider mb-3">
                          Galeria e portfólio
                        </p>
                      </div>

                      {/* Tipo pills */}
                      <div>
                        <div className="flex gap-2">
                          {(["carrossel", "grid"] as const).map((tipo) => (
                            <button
                              key={tipo}
                              onClick={() => { setTipoFoto(tipo); setShowUpload(false); }}
                              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-btn border transition-colors capitalize ${
                                tipoFoto === tipo
                                  ? "bg-gold-muted border-gold/40 text-gold"
                                  : "border-surface-border text-gray-500 hover:text-foreground"
                              }`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 font-sans mt-2">
                          {tipoFoto === "carrossel"
                            ? "Fotos em destaque logo após o hero. Máx. 6 fotos. Proporção 4:3"
                            : "Portfólio adicional mais abaixo na página. Máx. 6 fotos. Proporção 1:1"}
                        </p>
                      </div>

                      {/* Photo list */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndFotos}
                      >
                        <SortableContext
                          items={fotosFiltradas.map((f) => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {fotosFiltradas.length === 0 ? (
                              <p className="text-xs text-gray-600 font-sans text-center py-6 border border-dashed border-surface-border rounded-card">
                                Nenhuma foto neste tipo ainda
                              </p>
                            ) : (
                              fotosFiltradas.map((foto) => (
                                <SortablePhotoCard
                                  key={foto.id}
                                  foto={foto}
                                  onToggle={handleToggleFoto}
                                  onDelete={handleDeleteFoto}
                                  onTitleSave={handleTitleSave}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Add button */}
                      <div className="relative group/btn">
                        <button
                          onClick={() => { if (!atLimit) setShowUpload((v) => !v); }}
                          disabled={atLimit}
                          className="w-full flex items-center justify-center gap-2 border border-dashed border-surface-border text-xs font-sans text-gray-400 hover:border-gold/40 hover:text-gold py-2.5 rounded-btn transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={13} />
                          {atLimit ? "Limite de 6 fotos atingido" : "+ Adicionar foto"}
                        </button>
                        {atLimit && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-elevated border border-surface-border text-[10px] font-sans text-gray-400 px-2 py-1 rounded-badge whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                            Limite de 6 fotos atingido
                          </div>
                        )}
                      </div>

                      {/* Upload panel */}
                      {showUpload && !atLimit && (
                        <div className="border border-gold/20 bg-gold-muted/10 rounded-card p-4 space-y-3">
                          {/* Drop zone */}
                          <div
                            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gold/30 hover:border-gold/60 rounded-btn p-4 cursor-pointer text-center transition-colors"
                          >
                            {uploadPreview ? (
                              <img src={uploadPreview} alt="preview" className="max-h-40 mx-auto rounded object-contain" />
                            ) : (
                              <>
                                <Upload size={24} className="text-gold/60 mx-auto mb-1.5" strokeWidth={1.5} />
                                <p className="text-xs text-gray-400 font-sans">Arraste a foto ou clique para selecionar</p>
                                <p className="text-[10px] text-gray-600 mt-1 font-sans">
                                  {tipoFoto === "carrossel"
                                    ? "Dimensão ideal: 1200×900px (proporção 4:3)"
                                    : "Dimensão ideal: 800×800px (proporção 1:1)"}
                                </p>
                              </>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                            />
                          </div>

                          {/* Mobile upload toggle */}
                          {!showMobileUpload ? (
                            <button
                              onClick={() => setShowMobileUpload(true)}
                              className="text-[10px] text-gray-500 hover:text-gold font-sans flex items-center gap-1 transition-colors"
                            >
                              <Plus size={10} /> Adicionar versão mobile (opcional)
                            </button>
                          ) : (
                            <div>
                              <p className="text-[10px] text-gray-400 font-sans mb-1.5 flex items-center gap-1">
                                <Smartphone size={10} /> Versão mobile (opcional)
                              </p>
                              <div
                                onClick={() => mobileFileInputRef.current?.click()}
                                className="border border-dashed border-surface-border hover:border-gold/40 rounded-btn p-3 cursor-pointer text-center transition-colors"
                              >
                                {uploadMobileFile ? (
                                  <p className="text-[10px] text-gray-400 font-sans">{uploadMobileFile.name}</p>
                                ) : (
                                  <>
                                    <p className="text-[10px] text-gray-500 font-sans">Clique para selecionar</p>
                                    <p className="text-[9px] text-gray-600 font-sans">Dimensão ideal: 800×900px. Se não enviar, usa a mesma foto.</p>
                                  </>
                                )}
                                <input
                                  ref={mobileFileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadMobileFile(f); }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Título */}
                          <div>
                            <label className="block text-[10px] text-gray-500 font-sans mb-1">
                              Título da foto (opcional)
                            </label>
                            <input
                              value={uploadTitulo}
                              onChange={(e) => setUploadTitulo(e.target.value)}
                              className="input-luxury text-xs py-1.5"
                              placeholder="Ex: Make para formatura — acabamento natural"
                            />
                          </div>

                          {uploadError && (
                            <p className="text-[10px] text-red-400 font-sans flex items-center gap-1">
                              <AlertTriangle size={10} /> {uploadError}
                            </p>
                          )}

                          {/* Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowUpload(false); setUploadFile(null); setUploadPreview(null); setUploadError(null); }}
                              className="flex-1 btn-outline-gold text-xs py-2"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveUpload}
                              disabled={uploadLoading || !uploadFile}
                              className="flex-1 btn-gold text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {uploadLoading
                                ? <span className="w-3 h-3 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                                : <Check size={12} />}
                              Salvar foto
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── ABA FAQ ─── */}
                  {tab === "faq" && (
                    <div className="px-4 py-5 space-y-4">
                      {/* SEO tip card */}
                      <div className="bg-gold-muted border border-gold/30 rounded-card p-3 flex items-start gap-2.5">
                        <Star size={14} className="text-gold shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-[10px] text-gray-300 font-sans leading-relaxed">
                          <span className="text-gold font-medium">Dica SEO:</span> O Google pode exibir suas
                          perguntas diretamente nos resultados de busca (rich snippets). Use perguntas reais que
                          clientes fazem e inclua termos como &quot;maquiagem social Passos&quot;,
                          &quot;maquiagem para festa Passos MG&quot; naturalmente nas respostas.
                        </p>
                      </div>

                      {/* FAQ items */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndFaq}
                      >
                        <SortableContext
                          items={faqs.map((f) => f._id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {faqs.map((faq, i) => (
                              <SortableFaqItem
                                key={faq._id}
                                id={faq._id}
                                question={faq.question}
                                answer={faq.answer}
                                onChange={(field, value) =>
                                  setFaqs((prev) =>
                                    prev.map((f, idx) =>
                                      idx === i ? { ...f, [field]: value } : f
                                    )
                                  )
                                }
                                onDelete={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Add question */}
                      <div className="relative group/faq">
                        <button
                          onClick={() => {
                            if (faqs.length < 8)
                              setFaqs((prev) => [
                                ...prev,
                                { question: "", answer: "", _id: `faq-new-${Date.now()}` },
                              ]);
                          }}
                          disabled={faqs.length >= 8}
                          className="w-full flex items-center justify-center gap-1.5 border border-dashed border-surface-border text-xs text-gray-500 hover:border-gold/40 hover:text-gold py-2.5 rounded-btn transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                        >
                          <Plus size={12} />
                          {faqs.length >= 8 ? "Máximo de 8 perguntas" : "+ Adicionar pergunta"}
                        </button>
                      </div>

                      {/* Sugestões */}
                      <p className="text-[9px] text-gray-600 font-sans leading-relaxed">
                        Sugestões: &quot;Quanto tempo dura?&quot;, &quot;A maquiagem dura a noite toda?&quot;,
                        &quot;Precisa agendar com antecedência?&quot;, &quot;Atendem em domicílio?&quot;
                      </p>

                      {/* Save FAQ */}
                      <button
                        onClick={handleSaveFaq}
                        disabled={savingFaq}
                        className="w-full btn-gold flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50"
                      >
                        {savingFaq
                          ? <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                          : <Check size={14} />}
                        Salvar FAQ
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═══════════ RIGHT PANEL — Preview ═══════════ */}
          <div className="hidden lg:flex flex-1 flex-col bg-surface-elevated p-4 min-w-0">

            {/* Browser chrome */}
            <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-t-card px-3 py-2 shrink-0">
              {/* Decorative dots */}
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>

              {/* URL bar */}
              <div className="flex-1 min-w-0">
                <div className="bg-surface rounded px-3 py-1 text-xs text-gray-500 font-sans text-center truncate">
                  ...{PUBLIC_PATH}
                </div>
              </div>

              {/* Reload + Desktop/Mobile toggle */}
              <div className="flex gap-1 shrink-0 items-center">
                <button
                  onClick={recarregarPreview}
                  className="p-1.5 rounded text-gray-500 hover:text-foreground transition-colors"
                  title="Recarregar preview"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded transition-colors ${
                    previewMode === "desktop"
                      ? "bg-gold-muted text-gold"
                      : "text-gray-500 hover:text-foreground"
                  }`}
                  title="Desktop"
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded transition-colors ${
                    previewMode === "mobile"
                      ? "bg-gold-muted text-gold"
                      : "text-gray-500 hover:text-foreground"
                  }`}
                  title="Mobile"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            {/* Iframe preview */}
            <div
              className="flex-1 border-x border-b border-surface-border rounded-b-card overflow-hidden relative"
              style={{ background: previewMode === "mobile" ? "#1a1a1a" : undefined }}
            >
              {/* Loading overlay */}
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated z-10">
                  <span className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
              )}
              {previewUrl && (
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  title="Preview da página"
                  onLoad={() => setIframeLoading(false)}
                  style={{
                    border: "none",
                    height: "100%",
                    width: previewMode === "mobile" ? "390px" : "100%",
                    display: "block",
                    marginLeft: previewMode === "mobile" ? "auto" : undefined,
                    marginRight: previewMode === "mobile" ? "auto" : undefined,
                  }}
                />
              )}
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-gray-600 font-sans text-center mt-2 shrink-0">
              Preview real da página publicada · clique &ldquo;Salvar e visualizar&rdquo; para atualizar
            </p>
          </div>

        </div>
      </div>

    </>
  );
}
