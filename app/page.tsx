import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { ArrowRight, Instagram, Phone } from "lucide-react";

export const revalidate = 0; // always re-render; revalidatePath('/') also triggers this

export default async function HomePage() {
  let config: {
    nome_studio?: string | null;
    instagram?: string | null;
    whatsapp?: string | null;
    foto_header_url?: string | null;
    foto_header_mobile_url?: string | null;
  } = {};

  try {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("admin_config")
      .select("nome_studio, instagram, whatsapp, foto_header_url, foto_header_mobile_url")
      .limit(1)
      .single();
    if (data) config = data;
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
