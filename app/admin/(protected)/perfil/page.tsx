"use client";

import { useEffect, useState } from "react";
import { Save, Instagram, Phone, MapPin, ImageIcon, User } from "lucide-react";

interface PerfilForm {
  nome_studio: string;
  bio: string;
  instagram: string;
  whatsapp: string;
  endereco: string;
  foto_url: string;
}

const EMPTY: PerfilForm = {
  nome_studio: "",
  bio: "",
  instagram: "",
  whatsapp: "",
  endereco: "",
  foto_url: "",
};

export default function PerfilPage() {
  const [form, setForm] = useState<PerfilForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/perfil")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setForm({
            nome_studio: data.nome_studio ?? "",
            bio: data.bio ?? "",
            instagram: data.instagram ?? "",
            whatsapp: data.whatsapp ?? "",
            endereco: data.endereco ?? "",
            foto_url: data.foto_url ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erro ao salvar");
      } else {
        setSuccess("Perfil salvo com sucesso!");
      }
    } catch {
      setError("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  function set(field: keyof PerfilForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="py-6 max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-3xl text-[#F5F0E8] font-light">
          Perfil do Studio
        </h2>
        <p className="text-[rgba(245,240,232,0.4)] font-sans text-sm mt-1">
          Informacoes exibidas na pagina publica do studio
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[rgba(245,240,232,0.4)] font-sans text-sm">
            Carregando...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Photo preview */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[rgba(201,168,76,0.3)] bg-[#1a1a1a] flex items-center justify-center shrink-0">
              {form.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.foto_url}
                  alt="Foto do studio"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-[rgba(201,168,76,0.3)]" strokeWidth={1} />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
                URL da Foto
              </label>
              <div className="relative">
                <ImageIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]"
                />
                <input
                  type="url"
                  value={form.foto_url}
                  onChange={(e) => set("foto_url", e.target.value)}
                  className="input-luxury pl-9"
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>
            </div>
          </div>

          {/* Studio name */}
          <div>
            <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
              Nome do Studio
            </label>
            <input
              type="text"
              value={form.nome_studio}
              onChange={(e) => set("nome_studio", e.target.value)}
              className="input-luxury"
              placeholder="Studio Amanda & Barbara"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
              Bio / Descricao
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              className="input-luxury resize-none"
              rows={4}
              placeholder="Descreva o studio, sua especialidade e experiencia..."
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
              Instagram
            </label>
            <div className="relative">
              <Instagram
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]"
              />
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className="input-luxury pl-9"
                placeholder="@studio.amandabarbara"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
              WhatsApp
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]"
              />
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                className="input-luxury pl-9"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-sans text-[rgba(245,240,232,0.5)] uppercase tracking-widest mb-2">
              Endereco
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-3.5 text-[rgba(245,240,232,0.3)]"
              />
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => set("endereco", e.target.value)}
                className="input-luxury pl-9"
                placeholder="Rua das Flores, 123 - Sao Paulo, SP"
              />
            </div>
          </div>

          {error && (
            <div className="border border-red-800 bg-red-950/20 p-4 text-red-400 text-sm font-sans">
              {error}
            </div>
          )}
          {success && (
            <div className="border border-green-800 bg-green-950/20 p-4 text-green-400 text-sm font-sans">
              {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-3"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      )}
    </div>
  );
}
