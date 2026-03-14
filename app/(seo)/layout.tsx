import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F5F0E8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-b border-[rgba(201,168,76,0.12)]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <p className="text-[#C9A84C] text-[8px] tracking-[0.5em] uppercase font-sans">Studio</p>
            <p className="font-display text-xl text-[#F5F0E8] font-light leading-tight group-hover:text-[#C9A84C] transition-colors">
              Âmbar Beauty Studio
            </p>
          </Link>
          <Link
            href="/agendar"
            className="flex items-center gap-2 bg-[#C9A84C] text-[#0a0a0a] px-4 py-2 text-xs font-sans font-semibold uppercase tracking-widest hover:bg-[#E2C97E] transition-colors rounded-btn"
          >
            <Sparkles size={13} />
            Agendar agora
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[rgba(201,168,76,0.12)] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-display text-lg text-[#F5F0E8] font-light">Âmbar Beauty Studio</p>
            <p className="text-[#C9A84C] text-xs font-sans mt-0.5">Passos, Minas Gerais</p>
          </div>
          <div className="flex gap-6 text-xs font-sans text-[#F5F0E8]/40">
            <Link href="/" className="hover:text-[#C9A84C] transition-colors">Início</Link>
            <Link href="/agendar" className="hover:text-[#C9A84C] transition-colors">Agendar</Link>
          </div>
        </div>
        <p className="text-center text-[10px] font-sans text-[#F5F0E8]/20 mt-6">
          © {new Date().getFullYear()} Âmbar Beauty Studio — Passos MG. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
