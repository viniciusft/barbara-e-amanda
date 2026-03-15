"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";

export interface CarrosselFoto {
  id: string;
  url: string;
  titulo: string | null;
}

interface CarrosselProps {
  fotos: CarrosselFoto[];
}

export default function Carrossel({ fotos }: CarrosselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number>(0);
  const total = fotos.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-play: reset timer on every slide change, pause on hover
  useEffect(() => {
    if (total <= 1 || isHovered) return;
    const timer = setTimeout(next, 4000);
    return () => clearTimeout(timer);
  }, [current, isHovered, next, total]);

  // Empty state: elegant placeholder
  if (total === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="aspect-[4/3] bg-neutral-100 rounded-lg flex flex-col items-center justify-center gap-2"
          >
            <Camera size={28} className="text-neutral-300" strokeWidth={1} />
            <p className="text-neutral-400 text-sm font-sans">Em breve</p>
          </div>
        ))}
      </div>
    );
  }

  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) next();
        else if (diff < -50) prev();
      }}
    >
      {/* Desktop: prev + current + next */}
      {total > 1 ? (
        <div className="hidden md:grid grid-cols-[1fr_2fr_1fr] gap-3 items-center">
          {/* Previous (dimmed) */}
          <button
            onClick={prev}
            className="aspect-[4/3] relative rounded-lg overflow-hidden opacity-40 hover:opacity-60 transition-opacity focus:outline-none"
            aria-label="Foto anterior"
          >
            <Image
              src={fotos[prevIdx].url}
              alt={fotos[prevIdx].titulo ?? "Maquiagem social - Âmbar Beauty Studio"}
              fill
              className="object-cover scale-95"
              sizes="25vw"
              unoptimized
            />
          </button>

          {/* Current (destaque) */}
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden shadow-lg">
            <Image
              src={fotos[current].url}
              alt={fotos[current].titulo ?? "Maquiagem social - Âmbar Beauty Studio - Passos MG"}
              fill
              className="object-cover"
              sizes="50vw"
              priority
              unoptimized
            />
            {fotos[current].titulo && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 rounded-b-lg">
                <p className="text-white text-sm font-sans">{fotos[current].titulo}</p>
              </div>
            )}
          </div>

          {/* Next (dimmed) */}
          <button
            onClick={next}
            className="aspect-[4/3] relative rounded-lg overflow-hidden opacity-40 hover:opacity-60 transition-opacity focus:outline-none"
            aria-label="Próxima foto"
          >
            <Image
              src={fotos[nextIdx].url}
              alt={fotos[nextIdx].titulo ?? "Maquiagem social - Âmbar Beauty Studio"}
              fill
              className="object-cover scale-95"
              sizes="25vw"
              unoptimized
            />
          </button>
        </div>
      ) : (
        /* Only one photo: no peek on desktop */
        <div className="hidden md:block aspect-[4/3] relative rounded-lg overflow-hidden max-w-2xl mx-auto">
          <Image
            src={fotos[0].url}
            alt={fotos[0].titulo ?? "Maquiagem social - Âmbar Beauty Studio - Passos MG"}
            fill
            className="object-cover"
            sizes="66vw"
            priority
            unoptimized
          />
          {fotos[0].titulo && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 rounded-b-lg">
              <p className="text-white text-sm font-sans">{fotos[0].titulo}</p>
            </div>
          )}
        </div>
      )}

      {/* Mobile: single slide with overflow + translate */}
      <div className="md:hidden relative overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {fotos.map((foto) => (
            <div key={foto.id} className="relative min-w-full aspect-[4/3] shrink-0">
              <Image
                src={foto.url}
                alt={foto.titulo ?? "Maquiagem social - Âmbar Beauty Studio - Passos MG"}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized
              />
              {foto.titulo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <p className="text-white text-sm font-sans">{foto.titulo}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para foto ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-[#C9A84C] w-5" : "bg-neutral-300 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}

      {/* Desktop arrows (centered) */}
      {total > 1 && (
        <div className="hidden md:flex justify-center gap-3 mt-4">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
