import Image from "next/image";
import { Camera } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";

interface GaleriaItem {
  id: string;
  imagem_url: string;
  titulo: string | null;
  pagina: string;
  ordem: number;
}

interface GaleriaProps {
  pagina: string;
  titulo?: string;
  subtitulo?: string;
  limite?: number;
}

export default async function Galeria({
  pagina,
  titulo = "Veja nosso trabalho",
  subtitulo,
  limite,
}: GaleriaProps) {
  let fotos: GaleriaItem[] = [];

  try {
    const db = createServerSupabaseClient();
    let query = db
      .from("galeria")
      .select("id, imagem_url, titulo, pagina, ordem")
      .eq("pagina", pagina)
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (limite) {
      query = query.limit(limite);
    }

    const { data } = await query;
    if (data) fotos = data;
  } catch {
    // graceful fallback to placeholder state
  }

  const imageGallerySchema =
    fotos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: subtitulo ?? titulo,
          associatedMedia: fotos.map((foto) => ({
            "@type": "ImageObject",
            contentUrl: foto.imagem_url,
            description:
              foto.titulo ?? `${pagina} - Âmbar Beauty Studio - Passos MG`,
          })),
        }
      : null;

  return (
    <section>
      {imageGallerySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGallerySchema) }}
        />
      )}

      <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-3">
        Galeria
      </p>
      <h2 className="font-display text-3xl md:text-4xl text-[#F5F0E8] font-light mb-2">
        {titulo}
      </h2>
      {subtitulo && (
        <p className="text-[#F5F0E8]/40 font-sans text-sm mb-8">{subtitulo}</p>
      )}
      {!subtitulo && <div className="mb-8" />}

      {fotos.length === 0 ? (
        /* Placeholder grid — maintains layout until photos are uploaded */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-square bg-[#111] border border-[rgba(201,168,76,0.1)] rounded-card flex items-center justify-center"
            >
              <div className="text-center">
                <Camera
                  size={24}
                  className="text-[rgba(201,168,76,0.2)] mx-auto mb-2"
                  strokeWidth={1}
                />
                <p className="text-[#F5F0E8]/15 text-[10px] font-sans">
                  Fotos em breve
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Real photos — first photo spans 2 cols on desktop (destaque) */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fotos.map((foto, i) => {
            const isDestaque = i === 0;
            const altText =
              foto.titulo ?? `${pagina} - Âmbar Beauty Studio - Passos MG`;

            return (
              <div
                key={foto.id}
                className={`relative group overflow-hidden rounded-card ${
                  isDestaque
                    ? "col-span-2 md:col-span-2 aspect-[2/1]"
                    : "aspect-square"
                }`}
              >
                <Image
                  src={foto.imagem_url}
                  alt={altText}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={
                    isDestaque
                      ? "(max-width: 768px) 100vw, 66vw"
                      : "(max-width: 768px) 50vw, 33vw"
                  }
                />
                {/* Hover overlay with title */}
                {foto.titulo && (
                  <div className="absolute inset-0 bg-[rgba(0,0,0,0)] group-hover:bg-[rgba(0,0,0,0.5)] transition-colors duration-300 flex items-end">
                    <p className="px-4 pb-4 text-[#F5F0E8] font-sans text-sm translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {foto.titulo}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
