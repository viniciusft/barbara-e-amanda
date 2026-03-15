"use client";

import { Camera } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FotoItem {
  id: string;
  imagem_url: string;
  titulo: string | null;
  tipo_exibicao: string;
  ativo: boolean;
  ordem: number;
}

interface FaqItemPrev {
  question: string;
  answer: string;
}

interface ParaQuemItem {
  icone: string;
  titulo: string;
  descricao: string;
}

interface ServicoData {
  id?: string;
  nome?: string;
  preco?: number | null;
  duracao_minutos?: number | null;
}

export interface SitePreviewProps {
  titulo: string;
  subtitulo: string;
  texto_principal: string;
  meta_description: string;
  fotos_carrossel: FotoItem[];
  fotos_grid: FotoItem[];
  foto_hero: FotoItem | null;
  faq: FaqItemPrev[];
  para_quem?: ParaQuemItem[];
  servico?: ServicoData | null;
  loading?: boolean;
  modo: "desktop" | "mobile";
}

// ── Icon map ───────────────────────────────────────────────────────────────────

const ICONES: Record<string, string> = {
  party: "🎉",
  graduation: "🎓",
  heart: "💛",
  camera: "📷",
  briefcase: "💼",
  star: "⭐",
  users: "👥",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function SitePreview({
  titulo,
  subtitulo,
  texto_principal,
  fotos_carrossel,
  fotos_grid,
  foto_hero,
  faq,
  para_quem,
  servico,
  loading,
  modo,
}: SitePreviewProps) {
  const GOLD = "#C9A84C";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-elevated">
        <span className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const hasPreco = servico?.preco != null;
  const hasDuracao = servico?.duracao_minutos != null;
  const hasServico = hasPreco || hasDuracao;

  const content = (
    <div className="bg-white text-neutral-800 text-[10px] font-sans overflow-y-auto overflow-x-hidden h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative flex items-end px-4 pb-5"
        style={{
          minHeight: 140,
          ...(foto_hero
            ? {
                backgroundImage: `url(${foto_hero.imagem_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }),
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full">
          <p className="text-[7px] text-white/60 mb-1">
            Início / Serviços / {titulo || "Serviço"}
          </p>
          <p
            className="text-white font-semibold leading-snug line-clamp-2 mb-1"
            style={{ fontSize: 14, fontFamily: "Georgia, serif" }}
          >
            {titulo || "Título da página"}
          </p>
          <p className="text-white/70 text-[9px] mb-3 line-clamp-1">
            {subtitulo || "Subtítulo aqui"}
          </p>
          <div className="flex gap-2">
            <span
              className="text-[8px] font-semibold px-2.5 py-1 rounded-md"
              style={{ background: GOLD, color: "#111" }}
            >
              Agendar agora
            </span>
            <span className="text-[8px] px-2.5 py-1 rounded-md border border-white/50 text-white">
              WhatsApp
            </span>
          </div>
        </div>
      </div>

      {/* ── Carrossel ─────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 py-4 border-b border-neutral-100">
        <p
          className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium"
          style={{ color: GOLD }}
        >
          GALERIA
        </p>
        <p className="text-[11px] font-semibold text-neutral-900 mb-2.5" style={{ fontFamily: "Georgia, serif" }}>
          Nosso Trabalho
        </p>
        {fotos_carrossel.length > 0 ? (
          <div className="relative rounded-lg overflow-hidden bg-neutral-100" style={{ aspectRatio: "4/3" }}>
            <img src={fotos_carrossel[0].imagem_url} alt="" className="w-full h-full object-cover" />
            {fotos_carrossel.length > 1 && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[7px] px-1.5 py-0.5 rounded">
                1 / {fotos_carrossel.length}
              </div>
            )}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {fotos_carrossel.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full"
                  style={{
                    width: i === 0 ? 14 : 6,
                    background: i === 0 ? GOLD : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg bg-neutral-100 flex flex-col items-center justify-center gap-1"
            style={{ aspectRatio: "4/3" }}
          >
            <Camera size={18} className="text-neutral-300" strokeWidth={1.5} />
            <p className="text-[8px] text-neutral-400">Sem fotos no carrossel</p>
          </div>
        )}
      </div>

      {/* ── Sobre + Card de preço ─────────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-neutral-100">
        <div className={hasServico ? "flex gap-3 items-start" : ""}>
          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium" style={{ color: GOLD }}>
              SOBRE O SERVIÇO
            </p>
            <p className="text-[11px] font-semibold text-neutral-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Sobre {titulo || "o serviço"}
            </p>
            <p className="text-[8.5px] text-neutral-500 leading-relaxed line-clamp-4">
              {texto_principal
                ? texto_principal.slice(0, 200) + (texto_principal.length > 200 ? "…" : "")
                : "Nenhum texto adicionado ainda."}
            </p>
          </div>
          {/* Card de preço */}
          {hasServico && (
            <div
              className="rounded-xl border p-3 shrink-0"
              style={{ borderColor: `${GOLD}44`, minWidth: 88 }}
            >
              {hasPreco && (
                <p className="text-[9px] font-bold mb-0.5" style={{ color: GOLD }}>
                  R$&nbsp;{servico!.preco}
                </p>
              )}
              {hasDuracao && (
                <p className="text-[7.5px] text-neutral-400 mb-2">
                  {servico!.duracao_minutos} min
                </p>
              )}
              <span
                className="block text-center text-[7px] font-semibold px-2 py-1 rounded-md"
                style={{ background: GOLD, color: "#111" }}
              >
                Agendar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Para quem é ideal ─────────────────────────────────────────────── */}
      {para_quem && para_quem.length > 0 && (
        <div className="bg-neutral-50 px-4 py-4 border-b border-neutral-100">
          <p className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium" style={{ color: GOLD }}>
            INDICAÇÕES
          </p>
          <p className="text-[11px] font-semibold text-neutral-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Para quem é ideal?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {para_quem.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-2.5 border border-neutral-100"
              >
                <span className="text-[13px] block mb-1">{ICONES[item.icone] ?? "⭐"}</span>
                <p className="text-[8px] font-semibold text-neutral-800 mb-0.5 leading-tight">
                  {item.titulo || "—"}
                </p>
                <p className="text-[7.5px] text-neutral-500 leading-relaxed line-clamp-2">
                  {item.descricao || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid de fotos ─────────────────────────────────────────────────── */}
      {fotos_grid.length > 0 && (
        <div className="px-4 py-4 border-b border-neutral-100">
          <p className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium" style={{ color: GOLD }}>
            PORTFÓLIO
          </p>
          <p className="text-[11px] font-semibold text-neutral-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Mais trabalhos
          </p>
          <div className="grid grid-cols-3 gap-1">
            {fotos_grid.slice(0, 6).map((f) => (
              <div key={f.id} className="aspect-square rounded-lg overflow-hidden bg-neutral-100">
                <img src={f.imagem_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      {faq.length > 0 && (
        <div className="px-4 py-4 border-b border-neutral-100">
          <p className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium" style={{ color: GOLD }}>
            DÚVIDAS
          </p>
          <p className="text-[11px] font-semibold text-neutral-900 mb-2.5" style={{ fontFamily: "Georgia, serif" }}>
            Perguntas frequentes
          </p>
          <div className="space-y-1.5">
            {faq.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: i === 0 ? `${GOLD}66` : "#f0f0f0" }}
              >
                <div className="flex items-center justify-between px-2.5 py-2">
                  <p className="text-[8px] text-neutral-800 font-medium line-clamp-1 flex-1 pr-2">
                    {item.question || "Pergunta…"}
                  </p>
                  <span className="text-[10px] font-light shrink-0" style={{ color: GOLD }}>
                    {i === 0 ? "−" : "+"}
                  </span>
                </div>
                {i === 0 && (
                  <div className="px-2.5 pb-2.5 border-t border-neutral-100">
                    <p className="text-[7.5px] text-neutral-500 leading-relaxed line-clamp-3">
                      {item.answer || "Resposta aqui…"}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {faq.length > 4 && (
              <p className="text-[7px] text-neutral-400 pt-0.5">
                + {faq.length - 4} mais perguntas
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-5 text-center" style={{ background: "#1a1a1a" }}>
        <p className="text-white font-semibold mb-1" style={{ fontSize: 11, fontFamily: "Georgia, serif" }}>
          Pronta para arrasar?
        </p>
        <p className="text-white/60 text-[7.5px] mb-3">Agende com facilidade, sem sair de casa</p>
        <span
          className="text-[8px] font-semibold px-5 py-1.5 rounded-md inline-block"
          style={{ background: GOLD, color: "#111" }}
        >
          Agendar agora
        </span>
      </div>
    </div>
  );

  if (modo === "mobile") {
    return (
      <div className="flex-1 flex items-start justify-center bg-surface-elevated overflow-auto py-4">
        <div
          className="overflow-hidden border border-surface-border shadow-lg"
          style={{
            width: 390,
            maxWidth: "100%",
            borderRadius: 16,
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ maxWidth: 1100 }}
    >
      {content}
    </div>
  );
}
