"use client";

import { useEffect, useState } from "react";
import { Save, Instagram, Phone, MapPin, CreditCard, MessageCircle, RefreshCw, Image as ImageIcon, Star, Link as LinkIcon } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

const DEFAULT_SINAL_TEMPLATE = `Ola {nome_cliente}! Sou {nome_secretaria} do {nome_studio}.

Sua solicitacao para *{servico}* em *{data}* as *{horario}* foi recebida! Aguardamos o pagamento do sinal para confirmar.

Valor total: R$ {valor_total}
Sinal ({sinal_percentual}%): R$ {valor_sinal}
Restante no dia: R$ {valor_restante}

Chave PIX: {chave_pix}
Nome: {nome_recebedor}

Apos o pagamento, envie o comprovante por aqui. Obrigada!`;

const DEFAULT_CONFIRMACAO_TEMPLATE = `Ola {nome_cliente}! Tudo certo para o seu dia especial! 🎉

Seu agendamento no *{nome_studio}* esta confirmado:

📅 Data: {data}
⏰ Horario: {horario}
💄 Servico: {servico}
💰 Valor: R$ {valor_total}

Qualquer duvida estamos a disposicao. Ate logo!
{nome_secretaria}`;

const DEFAULT_AVALIACAO_TEMPLATE = `Ola {nome_cliente}! Muito obrigada pela sua visita ao *{nome_studio}*! 😊

Esperamos que tenha amado seu *{servico}*!

Sua opiniao e muito importante para nos. Seria um enorme prazer se voce pudesse deixar uma avaliacao no Google:

⭐ {link_google}

Muito obrigada! Ate a proxima!
{nome_secretaria}`;

const SINAL_VARS = [
  { v: "{nome_cliente}", desc: "Nome da cliente" },
  { v: "{nome_secretaria}", desc: "Secretaria/atendente" },
  { v: "{nome_studio}", desc: "Nome do studio" },
  { v: "{data}", desc: "Data do agendamento" },
  { v: "{horario}", desc: "Horario do agendamento" },
  { v: "{servico}", desc: "Nome do servico" },
  { v: "{valor_total}", desc: "Valor total" },
  { v: "{sinal_percentual}", desc: "Percentual do sinal" },
  { v: "{valor_sinal}", desc: "Valor do sinal em R$" },
  { v: "{valor_restante}", desc: "Valor restante" },
  { v: "{chave_pix}", desc: "Chave PIX" },
  { v: "{nome_recebedor}", desc: "Nome recebedor PIX" },
];

const CONFIRMACAO_VARS = [
  { v: "{nome_cliente}", desc: "Nome da cliente" },
  { v: "{nome_secretaria}", desc: "Secretaria/atendente" },
  { v: "{nome_studio}", desc: "Nome do studio" },
  { v: "{data}", desc: "Data (ex: sabado, 23 de marco)" },
  { v: "{horario}", desc: "Horario do agendamento" },
  { v: "{servico}", desc: "Nome do servico" },
  { v: "{valor_total}", desc: "Valor total" },
];

const AVALIACAO_VARS = [
  { v: "{nome_cliente}", desc: "Nome da cliente" },
  { v: "{nome_secretaria}", desc: "Secretaria/atendente" },
  { v: "{nome_studio}", desc: "Nome do studio" },
  { v: "{data}", desc: "Data do atendimento" },
  { v: "{servico}", desc: "Nome do servico" },
  { v: "{link_google}", desc: "URL do Google Meu Negocio" },
];

function buildPreview(template: string): string {
  return template
    .replace(/\{nome_cliente\}/g, "Ana Silva")
    .replace(/\{nome_secretaria\}/g, "Barbara")
    .replace(/\{nome_studio\}/g, "Studio Amanda & Barbara")
    .replace(/\{data\}/g, "15/04/2025")
    .replace(/\{horario\}/g, "10:00")
    .replace(/\{servico\}/g, "Noiva Completa")
    .replace(/\{valor_total\}/g, "350,00")
    .replace(/\{sinal_percentual\}/g, "50")
    .replace(/\{valor_sinal\}/g, "175,00")
    .replace(/\{chave_pix\}/g, "11999999999")
    .replace(/\{nome_recebedor\}/g, "Amanda Santos")
    .replace(/\{valor_restante\}/g, "175,00")
    .replace(/\{link_google\}/g, "https://g.page/r/exemplo");
}

interface PerfilForm {
  nome_studio: string;
  bio: string;
  instagram: string;
  whatsapp: string;
  endereco: string;
  foto_url: string;
  foto_header_url: string;
  foto_header_mobile_url: string;
  chave_pix: string;
  tipo_chave_pix: string;
  nome_recebedor_pix: string;
  nome_secretaria: string;
  mensagem_whatsapp_template: string;
  mensagem_confirmacao_template: string;
  google_meu_negocio_url: string;
  mensagem_avaliacao_template: string;
  mensagem_horario_personalizado: string;
}

const EMPTY: PerfilForm = {
  nome_studio: "",
  bio: "",
  instagram: "",
  whatsapp: "",
  endereco: "",
  foto_url: "",
  foto_header_url: "",
  foto_header_mobile_url: "",
  chave_pix: "",
  tipo_chave_pix: "celular",
  nome_recebedor_pix: "",
  nome_secretaria: "",
  mensagem_whatsapp_template: DEFAULT_SINAL_TEMPLATE,
  mensagem_confirmacao_template: DEFAULT_CONFIRMACAO_TEMPLATE,
  google_meu_negocio_url: "",
  mensagem_avaliacao_template: DEFAULT_AVALIACAO_TEMPLATE,
  mensagem_horario_personalizado: "Olá! Não encontrei um horário disponível que se encaixe na minha agenda. Gostaria de solicitar um horário personalizado. Podem me ajudar? 😊",
};

export default function PerfilPage() {
  const [form, setForm] = useState<PerfilForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewConfirmacao, setShowPreviewConfirmacao] = useState(false);
  const [showPreviewAvaliacao, setShowPreviewAvaliacao] = useState(false);

  useEffect(() => {
    fetch("/api/admin/perfil", { cache: "no-store" })
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
            foto_header_url: data.foto_header_url ?? "",
            foto_header_mobile_url: data.foto_header_mobile_url ?? "",
            chave_pix: data.chave_pix ?? "",
            tipo_chave_pix: data.tipo_chave_pix ?? "celular",
            nome_recebedor_pix: data.nome_recebedor_pix ?? "",
            nome_secretaria: data.nome_secretaria ?? "",
            mensagem_whatsapp_template: data.mensagem_whatsapp_template || DEFAULT_SINAL_TEMPLATE,
            mensagem_confirmacao_template: data.mensagem_confirmacao_template || DEFAULT_CONFIRMACAO_TEMPLATE,
            google_meu_negocio_url: data.google_meu_negocio_url ?? "",
            mensagem_avaliacao_template: data.mensagem_avaliacao_template || DEFAULT_AVALIACAO_TEMPLATE,
            mensagem_horario_personalizado: data.mensagem_horario_personalizado ?? "Olá! Não encontrei um horário disponível que se encaixe na minha agenda. Gostaria de solicitar um horário personalizado. Podem me ajudar? 😊",
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
        body: JSON.stringify({
          ...form,
          foto_header_url: form.foto_header_url || null,
          foto_header_mobile_url: form.foto_header_mobile_url || null,
          google_meu_negocio_url: form.google_meu_negocio_url || null,
        }),
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
        <h2 className="font-display text-3xl text-foreground font-light">
          Perfil do Studio
        </h2>
        <p className="text-foreground/40 font-sans text-sm mt-1">
          Informacoes exibidas na pagina publica do studio
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 font-sans text-sm">
            Carregando...
          </span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Studio info */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-3">
                Foto do Perfil
              </label>
              <ImageUpload
                value={form.foto_url}
                onChange={(url) => set("foto_url", url)}
                rounded
              />
            </div>

            {/* Header / hero background images */}
            <div className="border-t border-[var(--gold-muted-border)] pt-5 space-y-5">
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-gold" strokeWidth={1.5} />
                <span className="text-xs font-sans text-foreground/50 uppercase tracking-widest">
                  Imagens de Fundo do Hero
                </span>
              </div>

              {/* Desktop */}
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-1">
                  Desktop
                </label>
                <p className="text-foreground/30 text-[11px] font-sans mb-3">
                  Recomendado: 1920 × 600 px (proporção 16:5)
                </p>
                <ImageUpload
                  value={form.foto_header_url}
                  onChange={(url) => set("foto_header_url", url)}
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-1">
                  Mobile
                </label>
                <p className="text-foreground/30 text-[11px] font-sans mb-3">
                  Recomendado: 800 × 900 px (proporção 9:10). Se vazio, usa a imagem desktop.
                </p>
                <ImageUpload
                  value={form.foto_header_mobile_url}
                  onChange={(url) => set("foto_header_mobile_url", url)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
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
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
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
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Instagram
              </label>
              <div className="relative">
                <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  className="input-luxury pl-9"
                  placeholder="@studio.amandabarbara"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                WhatsApp
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  className="input-luxury pl-9"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                Endereco
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3.5 text-foreground/30" />
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => set("endereco", e.target.value)}
                  className="input-luxury pl-9"
                  placeholder="Rua das Flores, 123 - Sao Paulo, SP"
                />
              </div>
            </div>
          </div>

          {/* Payment config */}
          <div className="border-t border-[var(--gold-muted-border)] pt-8">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} className="text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-foreground font-light">
                Configuracoes de Pagamento
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={form.tipo_chave_pix}
                    onChange={(e) => set("tipo_chave_pix", e.target.value)}
                    className="input-luxury"
                  >
                    <option value="celular">Celular</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="aleatoria">Chave aleatoria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={form.chave_pix}
                    onChange={(e) => set("chave_pix", e.target.value)}
                    className="input-luxury"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                  Nome do Recebedor PIX
                </label>
                <input
                  type="text"
                  value={form.nome_recebedor_pix}
                  onChange={(e) => set("nome_recebedor_pix", e.target.value)}
                  className="input-luxury"
                  placeholder="Amanda Santos"
                />
              </div>
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                  Nome da Secretaria
                </label>
                <input
                  type="text"
                  value={form.nome_secretaria}
                  onChange={(e) => set("nome_secretaria", e.target.value)}
                  className="input-luxury"
                  placeholder="Barbara"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp template */}
          <div className="border-t border-[var(--gold-muted-border)] pt-8">
            <div className="flex items-center gap-2 mb-5">
              <MessageCircle size={16} className="text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-foreground font-light">
                Mensagem WhatsApp
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans text-foreground/50 uppercase tracking-widest">
                    Template da Mensagem
                  </label>
                  <button
                    onClick={() => set("mensagem_whatsapp_template", DEFAULT_SINAL_TEMPLATE)}
                    className="flex items-center gap-1 text-[10px] font-sans text-foreground/30 hover:text-foreground/60 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Restaurar padrao
                  </button>
                </div>
                <textarea
                  value={form.mensagem_whatsapp_template}
                  onChange={(e) => set("mensagem_whatsapp_template", e.target.value)}
                  className="input-luxury resize-none font-mono text-xs leading-relaxed"
                  rows={12}
                />
              </div>

              {/* Variable reference */}
              <div className="border border-[var(--gold-muted-border)] p-3">
                <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-2.5">
                  Variaveis disponiveis
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {SINAL_VARS.map(({ v, desc }) => (
                    <div key={v} className="flex gap-2 items-baseline">
                      <code className="text-gold text-[10px] font-mono shrink-0">{v}</code>
                      <span className="text-foreground/30 text-[10px] font-sans truncate">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <button
                  onClick={() => setShowPreview((p) => !p)}
                  className="text-xs font-sans text-foreground/40 hover:text-foreground/70 border border-surface-border px-3 py-1.5 transition-colors"
                >
                  {showPreview ? "Ocultar previa" : "Ver previa com dados ficticios"}
                </button>
                {showPreview && (
                  <div className="mt-3 p-4 bg-surface-elevated border border-surface-border whitespace-pre-wrap text-foreground/70 text-sm font-sans leading-relaxed">
                    {buildPreview(form.mensagem_whatsapp_template)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation template */}
          <div className="border-t border-[var(--gold-muted-border)] pt-8">
            <div className="flex items-center gap-2 mb-5">
              <MessageCircle size={16} className="text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-foreground font-light">
                Mensagem de Confirmacao
              </h3>
            </div>
            <p className="text-foreground/40 text-xs font-sans mb-4">
              Enviada pelo WhatsApp quando o agendamento esta no status <span className="text-green-400">Confirmado</span>.
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans text-foreground/50 uppercase tracking-widest">
                    Template da Mensagem
                  </label>
                  <button
                    onClick={() => set("mensagem_confirmacao_template", DEFAULT_CONFIRMACAO_TEMPLATE)}
                    className="flex items-center gap-1 text-[10px] font-sans text-foreground/30 hover:text-foreground/60 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Restaurar padrao
                  </button>
                </div>
                <textarea
                  value={form.mensagem_confirmacao_template}
                  onChange={(e) => set("mensagem_confirmacao_template", e.target.value)}
                  className="input-luxury resize-none font-mono text-xs leading-relaxed"
                  rows={10}
                />
              </div>

              {/* Variable reference */}
              <div className="border border-[var(--gold-muted-border)] p-3">
                <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-2.5">
                  Variaveis disponiveis
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {CONFIRMACAO_VARS.map(({ v, desc }) => (
                    <div key={v} className="flex gap-2 items-baseline">
                      <code className="text-gold text-[10px] font-mono shrink-0">{v}</code>
                      <span className="text-foreground/30 text-[10px] font-sans truncate">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <button
                  onClick={() => setShowPreviewConfirmacao((p) => !p)}
                  className="text-xs font-sans text-foreground/40 hover:text-foreground/70 border border-surface-border px-3 py-1.5 transition-colors"
                >
                  {showPreviewConfirmacao ? "Ocultar previa" : "Ver previa com dados ficticios"}
                </button>
                {showPreviewConfirmacao && (
                  <div className="mt-3 p-4 bg-surface-elevated border border-surface-border whitespace-pre-wrap text-foreground/70 text-sm font-sans leading-relaxed">
                    {buildPreview(form.mensagem_confirmacao_template)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Google review template */}
          <div className="border-t border-[var(--gold-muted-border)] pt-8">
            <div className="flex items-center gap-2 mb-5">
              <Star size={16} className="text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-foreground font-light">
                Mensagem de Avaliacao Google
              </h3>
            </div>
            <p className="text-foreground/40 text-xs font-sans mb-4">
              Enviada pelo WhatsApp apos o atendimento ser marcado como <span className="text-emerald-400">Concluido</span> e executado.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans text-foreground/50 uppercase tracking-widest mb-2">
                  URL do Google Meu Negocio
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                  <input
                    type="url"
                    value={form.google_meu_negocio_url}
                    onChange={(e) => set("google_meu_negocio_url", e.target.value)}
                    className="input-luxury pl-9"
                    placeholder="https://g.page/r/..."
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans text-foreground/50 uppercase tracking-widest">
                    Template da Mensagem
                  </label>
                  <button
                    onClick={() => set("mensagem_avaliacao_template", DEFAULT_AVALIACAO_TEMPLATE)}
                    className="flex items-center gap-1 text-[10px] font-sans text-foreground/30 hover:text-foreground/60 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Restaurar padrao
                  </button>
                </div>
                <textarea
                  value={form.mensagem_avaliacao_template}
                  onChange={(e) => set("mensagem_avaliacao_template", e.target.value)}
                  className="input-luxury resize-none font-mono text-xs leading-relaxed"
                  rows={10}
                />
              </div>
              <div className="border border-[var(--gold-muted-border)] p-3">
                <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-2.5">
                  Variaveis disponiveis
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {AVALIACAO_VARS.map(({ v, desc }) => (
                    <div key={v} className="flex gap-2 items-baseline">
                      <code className="text-gold text-[10px] font-mono shrink-0">{v}</code>
                      <span className="text-foreground/30 text-[10px] font-sans truncate">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <button
                  onClick={() => setShowPreviewAvaliacao((p) => !p)}
                  className="text-xs font-sans text-foreground/40 hover:text-foreground/70 border border-surface-border px-3 py-1.5 transition-colors"
                >
                  {showPreviewAvaliacao ? "Ocultar previa" : "Ver previa com dados ficticios"}
                </button>
                {showPreviewAvaliacao && (
                  <div className="mt-3 p-4 bg-surface-elevated border border-surface-border whitespace-pre-wrap text-foreground/70 text-sm font-sans leading-relaxed">
                    {buildPreview(form.mensagem_avaliacao_template)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Horário personalizado template */}
          <div className="border-t border-[var(--gold-muted-border)] pt-8">
            <div className="flex items-center gap-2 mb-5">
              <MessageCircle size={16} className="text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-foreground font-light">
                Mensagem — Solicitar Horário Personalizado
              </h3>
            </div>
            <p className="text-foreground/40 text-xs font-sans mb-4">
              Enviada pelo WhatsApp quando a cliente clica em &quot;Solicitar horário personalizado&quot; na tela de agendamento.
            </p>
            <div className="space-y-4">
              <textarea
                value={form.mensagem_horario_personalizado}
                onChange={(e) => set("mensagem_horario_personalizado", e.target.value)}
                className="input-luxury resize-none font-mono text-xs leading-relaxed"
                rows={4}
              />
              <div className="border border-[var(--gold-muted-border)] p-3">
                <p className="text-[10px] font-sans text-foreground/35 uppercase tracking-widest mb-2.5">
                  Variaveis disponiveis
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {[
                    { v: "{nome_studio}", desc: "Nome do studio" },
                    { v: "{nome_secretaria}", desc: "Secretaria/atendente" },
                  ].map(({ v, desc }) => (
                    <div key={v} className="flex gap-2 items-baseline">
                      <code className="text-gold text-[10px] font-mono shrink-0">{v}</code>
                      <span className="text-foreground/30 text-[10px] font-sans truncate">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
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
