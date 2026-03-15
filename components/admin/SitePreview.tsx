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

export interface SitePreviewProps {
  titulo: string;
  subtitulo: string;
  texto_principal: string;
  meta_description: string;
  fotos_carrossel: FotoItem[];
  fotos_grid: FotoItem[];
  foto_hero: FotoItem | null;
  faq: FaqItemPrev[];
  modo: "desktop" | "mobile";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SitePreview({
  titulo,
  subtitulo,
  texto_principal,
  fotos_carrossel,
  fotos_grid,
  foto_hero,
  faq,
  modo,
}: SitePreviewProps) {
  const GOLD = "#C9A84C";

  const content = (
    <div className="bg-white text-neutral-800 text-[10px] font-sans overflow-auto h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative flex items-end px-4 pb-4"
        style={{
          minHeight: 120,
          ...(foto_hero
            ? {
                backgroundImage: `url(${foto_hero.imagem_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }),
        }}
      >
        {/* overlay sempre aplicado */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full">
          <p className="text-[8px] text-white/60 mb-0.5">
            Início / Serviços / Maquiagem Social
          </p>
          <p className="text-white font-semibold text-[12px] leading-snug line-clamp-2">
            {titulo || "Título da página"}
          </p>
          <p className="text-white/70 text-[9px] mt-0.5 line-clamp-1">
            {subtitulo || "Subtítulo aqui"}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className="text-[8px] font-semibold px-2.5 py-1 rounded"
              style={{ background: GOLD, color: "#111" }}
            >
              Agendar agora
            </span>
            <span className="text-[8px] px-2.5 py-1 rounded border border-white/50 text-white">
              WhatsApp
            </span>
          </div>
        </div>
      </div>

      {/* ── Carrossel ─────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 py-4 border-b border-neutral-100">
        <p
          className="text-[7px] tracking-[0.4em] uppercase mb-1.5 font-medium"
          style={{ color: GOLD }}
        >
          Galeria
        </p>
        <p className="text-[10px] font-semibold text-neutral-900 mb-2">Nosso Trabalho</p>
        {fotos_carrossel.length > 0 ? (
          <div className="relative rounded overflow-hidden bg-neutral-100" style={{ aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos_carrossel[0].imagem_url}
              alt=""
              className="w-full h-full object-cover"
            />
            {fotos_carrossel.length > 1 && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[7px] px-1.5 py-0.5 rounded">
                1 / {fotos_carrossel.length}
              </div>
            )}
            {/* dots */}
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
            className="rounded bg-neutral-100 flex flex-col items-center justify-center gap-1"
            style={{ aspectRatio: "4/3" }}
          >
            <Camera size={18} className="text-neutral-300" strokeWidth={1.5} />
            <p className="text-[8px] text-neutral-400">Sem fotos no carrossel</p>
          </div>
        )}
      </div>

      {/* ── Texto principal ───────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-neutral-100">
        <p
          className="text-[7px] tracking-[0.4em] uppercase mb-1 font-medium"
          style={{ color: GOLD }}
        >
          Sobre o serviço
        </p>
        <p className="text-[10px] font-semibold text-neutral-900 mb-2">
          O que é maquiagem social?
        </p>
        <p className="text-[9px] text-neutral-500 leading-relaxed line-clamp-4">
          {texto_principal
            ? texto_principal.slice(0, 200) + (texto_principal.length > 200 ? "…" : "")
            : "Nenhum texto adicionado ainda."}
        </p>
      </div>

      {/* ── Grid de fotos ─────────────────────────────────────────────────── */}
      {fotos_grid.length > 0 && (
        <div className="px-4 py-4 border-b border-neutral-100">
          <p
            className="text-[7px] tracking-[0.4em] uppercase mb-2 font-medium"
            style={{ color: GOLD }}
          >
            Portfólio
          </p>
          <div className="grid grid-cols-3 gap-1">
            {fotos_grid.slice(0, 6).map((f) => (
              <div
                key={f.id}
                className="aspect-square rounded overflow-hidden bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.imagem_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      {faq.length > 0 && (
        <div className="px-4 py-4 border-b border-neutral-100">
          <p
            className="text-[7px] tracking-[0.4em] uppercase mb-2 font-medium"
            style={{ color: GOLD }}
          >
            FAQ
          </p>
          <div className="space-y-1">
            {faq.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="rounded border overflow-hidden"
                style={{ borderColor: i === 0 ? `${GOLD}66` : "#f0f0f0" }}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-[8px] text-neutral-800 font-medium line-clamp-1 flex-1 pr-2">
                    {item.question || "Pergunta…"}
                  </p>
                  <span className="text-[9px] font-light shrink-0" style={{ color: GOLD }}>
                    {i === 0 ? "−" : "+"}
                  </span>
                </div>
                {i === 0 && (
                  <div className="px-2 pb-2 border-t border-neutral-100">
                    <p className="text-[8px] text-neutral-500 leading-relaxed line-clamp-3">
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
      <div className="bg-neutral-900 px-4 py-4 text-center">
        <p className="text-white text-[10px] font-semibold mb-2">Pronta para arrasar?</p>
        <span
          className="text-[8px] font-semibold px-4 py-1 rounded inline-block"
          style={{ background: GOLD, color: "#111" }}
        >
          Agendar agora
        </span>
      </div>
    </div>
  );

  if (modo === "mobile") {
    return (
      <div className="flex-1 flex items-start justify-center bg-surface-elevated overflow-auto">
        <div
          className="h-full overflow-auto border-x border-surface-border"
          style={{ width: 280 }}
        >
          {content}
        </div>
      </div>
    );
  }

  return <div className="flex-1 overflow-auto">{content}</div>;
}
