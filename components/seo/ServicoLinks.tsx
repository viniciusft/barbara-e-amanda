import Link from "next/link";

const servicos = [
  { label: "Maquiagem Social", href: "/servicos/maquiagem-social" },
  { label: "Maquiagem de Noiva", href: "/servicos/maquiagem-noiva" },
  { label: "Penteado", href: "/servicos/penteado" },
  { label: "Babyliss", href: "/servicos/babyliss" },
  { label: "Combo Make + Penteado", href: "/servicos/maquiagem-e-penteado" },
];

const ocasioes = [
  { label: "Para Casamento", href: "/ocasioes/casamento" },
  { label: "Para Formatura", href: "/ocasioes/formatura" },
  { label: "Para Eventos", href: "/ocasioes/eventos" },
];

export default function ServicoLinks() {
  return (
    <nav
      aria-label="Conheça também"
      className="max-w-5xl mx-auto px-5 pb-20"
    >
      <div className="border-t border-[rgba(201,168,76,0.15)] pt-10">
        <p className="text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-sans mb-6 text-center">
          Conheça também
        </p>
        <div className="flex flex-col sm:flex-row gap-8 justify-center">
          <div>
            <p className="text-[#F5F0E8]/30 font-sans text-[10px] uppercase tracking-widest mb-3">
              Serviços
            </p>
            <ul className="space-y-2">
              {servicos.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[#F5F0E8]/55 hover:text-[#C9A84C] font-sans text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:border-l sm:border-[rgba(201,168,76,0.12)] sm:pl-8">
            <p className="text-[#F5F0E8]/30 font-sans text-[10px] uppercase tracking-widest mb-3">
              Ocasiões
            </p>
            <ul className="space-y-2">
              {ocasioes.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[#F5F0E8]/55 hover:text-[#C9A84C] font-sans text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
