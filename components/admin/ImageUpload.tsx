"use client";

import { useRef, useState } from "react";
import { Upload, X, User } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  rounded?: boolean;
}

export default function ImageUpload({ value, onChange, rounded = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Use JPG, PNG ou WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande (max. 5MB)");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer upload");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("Erro ao fazer upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`shrink-0 bg-surface-elevated border-2 border-[var(--gold-muted-border)] overflow-hidden flex items-center justify-center ${
          rounded ? "w-20 h-20 rounded-full" : "w-24 h-16"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <User size={22} className="text-gold/20" strokeWidth={1} />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--gold-muted-border)] text-foreground/70 text-xs font-sans hover:border-gold transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-3 h-3 border border-[var(--gold-muted-border)] border-t-gold rounded-full animate-spin" />
            ) : (
              <Upload size={12} strokeWidth={1.5} />
            )}
            {uploading ? "Enviando..." : value ? "Trocar foto" : "Escolher foto"}
          </button>

          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1 px-2 py-2 border border-red-900/40 text-red-400/70 text-xs font-sans hover:border-red-800 hover:text-red-400 transition-colors"
            >
              <X size={12} />
              Remover
            </button>
          )}
        </div>

        <p className="text-[10px] font-sans text-foreground/30">
          JPG, PNG ou WebP · max. 5MB
        </p>
        {error && (
          <p className="text-[11px] font-sans text-red-400 mt-1">{error}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
