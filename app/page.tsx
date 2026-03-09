import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatCurrency, formatDuration } from "@/lib/utils";
import type { Servico } from "@/types";
import { ArrowRight, Instagram, Phone, Clock, MapPin } from "lucide-react";

export default async function HomePage() {
  let servicos: Servico[] = [];
  let config: {
    nome_studio?: string | null;
    bio?: string | null;
    instagram?: string | null;
    whatsapp?: string | null;
    foto_url?: string | null;
    foto_header_url?: string | null;
    foto_header_mobile_url?: string | null;
    endereco?: string | null;
  } = {};

  try {
    const db = createServerSupabaseClient();
    const [svcsResult, cfgResult] = await Promise.all([
      db
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
      db
        .from("admin_config")
        .select("nome_studio, bio, instagram, whatsapp, foto_url, foto_header_url, foto_header_mobile_url, endereco")
        .limit(1)
        .single(),
    ]);
    if (svcsResult.data) servicos = svcsResult.data;
    if (cfgResult.data) config = cfgResult.data;
  } catch {
    // graceful fallback with defaults
  }

  const studioName = config.nome_studio || "Studio Amanda & Barbara";
  const whatsappNumber = config.whatsapp?.replace(/\D/g, "") || "";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F5F0E8]">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-[rgba(10,10,10,0.92)] backdrop-blur-md border-b border-[rgba(201,168,76,0.1)]">
        <div>
          <p className="text-[#C9A84C] text-[9px] tracking-[0.45em] uppercase font-sans">
            Studio
          </p>
          <h1 className="font-display text-lg text-[#F5F0E8] font-light leading-tight">
            {studioName}
          </h1>
        </div>
        <Link
          href="/agendar"
          className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2 group"
        >
          Agendar
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 text-center overflow-hidden pt-20">
        {/* Header background images — mobile-first, responsive */}
        {(config.foto_header_url || config.foto_header_mobile_url) && (
          <>
            {/* Mobile image (shown on small screens, hidden on md+) */}
            {(config.foto_header_mobile_url || config.foto_header_url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(config.foto_header_mobile_url || config.foto_header_url)!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center md:hidden"
                aria-hidden="true"
              />
            )}
            {/* Desktop image (hidden on mobile, shown on md+) */}
            {config.foto_header_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.foto_header_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
                aria-hidden="true"
              />
            )}
            {/* Dark overlay so text remains readable */}
            <div className="absolute inset-0 bg-[rgba(10,10,10,0.72)]" />
          </>
        )}
        {/* Decorative rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border border-[rgba(201,168,76,0.06)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[750px] h-[750px] rounded-full border border-[rgba(201,168,76,0.03)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1000px] h-[1000px] rounded-full border border-[rgba(201,168,76,0.02)]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="text-[#C9A84C] text-xs tracking-[0.5em] uppercase font-sans mb-8">
            Beleza &amp; Elegancia
          </p>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl text-[#F5F0E8] font-light leading-[1.05] mb-8">
            Arte que
            <br />
            <span className="italic text-[#C9A84C]">transforma</span>
          </h2>
          <p className="text-[rgba(245,240,232,0.5)] font-sans text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Experiencia exclusiva de beleza com atencao a cada detalhe.
            Maquiagem e cabelo para o seu dia mais especial.
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-3 btn-gold text-base px-8 py-4 group"
          >
            Agendar agora
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#C9A84C]" />
        </div>
      </section>

      {/* PROFILE */}
      {(config.bio || config.foto_url || config.instagram) && (
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            {/* Photo */}
            <div className="shrink-0">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-[rgba(201,168,76,0.3)] bg-[#141414] flex items-center justify-center">
                {config.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.foto_url}
                    alt={studioName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#111] flex items-center justify-center">
                    <span className="font-display text-5xl text-[rgba(201,168,76,0.2)]">
                      A
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <p className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase font-sans mb-3">
                Sobre
              </p>
              <h3 className="font-display text-4xl text-[#F5F0E8] font-light mb-4">
                {studioName}
              </h3>
              {config.bio && (
                <p className="text-[rgba(245,240,232,0.6)] font-sans leading-relaxed mb-6 max-w-xl">
                  {config.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                {config.instagram && (
                  <a
                    href={`https://instagram.com/${config.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[rgba(245,240,232,0.5)] hover:text-[#C9A84C] transition-colors font-sans text-sm"
                  >
                    <Instagram size={16} strokeWidth={1.5} />
                    {config.instagram}
                  </a>
                )}
                {config.whatsapp && (
                  <a
                    href={`https://wa.me/55${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[rgba(245,240,232,0.5)] hover:text-[#C9A84C] transition-colors font-sans text-sm"
                  >
                    <Phone size={16} strokeWidth={1.5} />
                    {config.whatsapp}
                  </a>
                )}
                {config.endereco && (
                  <span className="flex items-center gap-2 text-[rgba(245,240,232,0.5)] font-sans text-sm">
                    <MapPin size={16} strokeWidth={1.5} />
                    {config.endereco}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {servicos.length > 0 && (
        <section className="py-24 px-6 bg-[#0d0d0d]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#C9A84C] text-xs tracking-[0.5em] uppercase font-sans mb-4">
                Especialidades
              </p>
              <h3 className="font-display text-5xl text-[#F5F0E8] font-light">
                Nossos Servicos
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicos.map((s) => (
                <div
                  key={s.id}
                  className="border border-[rgba(201,168,76,0.12)] bg-[#141414] overflow-hidden group hover:border-[rgba(201,168,76,0.3)] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="bg-[#1a1a1a] overflow-hidden relative" style={{ aspectRatio: "9/16" }}>
                    {s.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imagem_url}
                        alt={s.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-px bg-[rgba(201,168,76,0.2)]" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-display text-xl text-[#F5F0E8] font-light mb-2">
                      {s.nome}
                    </h4>
                    {s.descricao && (
                      <p className="text-[rgba(245,240,232,0.45)] text-sm font-sans leading-relaxed mb-4">
                        {s.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[rgba(245,240,232,0.35)] text-xs font-sans">
                        <Clock size={12} strokeWidth={1.5} />
                        {formatDuration(s.duracao_minutos)}
                      </span>
                      <span className="font-display text-xl text-[#C9A84C]">
                        {formatCurrency(s.preco)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              <Link
                href="/agendar"
                className="inline-flex items-center gap-3 btn-gold px-8 py-4 group"
              >
                Agendar agora
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full border border-[rgba(201,168,76,0.05)]" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <h3 className="font-display text-4xl sm:text-5xl text-[#F5F0E8] font-light mb-6">
            Pronta para uma
            <br />
            <span className="italic text-[#C9A84C]">experiencia unica?</span>
          </h3>
          <p className="text-[rgba(245,240,232,0.5)] font-sans mb-10">
            Agende seu horario e deixe a sua beleza em boas maos.
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-3 btn-gold text-base px-8 py-4 group"
          >
            Agendar agora
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[rgba(201,168,76,0.1)] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#C9A84C] text-[9px] tracking-[0.4em] uppercase font-sans mb-1">
              Studio
            </p>
            <h2 className="font-display text-lg text-[#F5F0E8] font-light">
              {studioName}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {config.whatsapp && (
              <a
                href={`https://wa.me/55${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[rgba(245,240,232,0.45)] hover:text-[#C9A84C] transition-colors font-sans text-sm"
              >
                <Phone size={15} strokeWidth={1.5} />
                WhatsApp
              </a>
            )}
            {config.instagram && (
              <a
                href={`https://instagram.com/${config.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[rgba(245,240,232,0.45)] hover:text-[#C9A84C] transition-colors font-sans text-sm"
              >
                <Instagram size={15} strokeWidth={1.5} />
                Instagram
              </a>
            )}
          </div>

          <p className="text-[rgba(245,240,232,0.2)] text-xs font-sans">
            &copy; {new Date().getFullYear()} {studioName}
          </p>
        </div>
      </footer>
    </div>
  );
}
