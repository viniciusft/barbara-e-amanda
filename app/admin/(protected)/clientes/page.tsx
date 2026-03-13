"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, ChevronRight } from "lucide-react";
import { Cliente } from "@/types";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchClientes = useCallback(async (q: string) => {
    setLoading(true);
    const url = `/api/admin/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setClientes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes(debouncedQuery);
  }, [debouncedQuery, fetchClientes]);

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-foreground font-light">Clientes</h2>
          <p className="text-foreground/40 font-sans text-sm mt-1">
            {loading ? "Carregando..." : `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" strokeWidth={1.5} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="input-luxury pl-9 w-full"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 border border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-foreground/40 font-sans text-sm">Carregando...</span>
        </div>
      ) : clientes.length === 0 ? (
        <div className="border border-surface-border p-12 text-center">
          <UserRound size={32} className="text-foreground/15 mx-auto mb-3" strokeWidth={1} />
          <p className="text-foreground/40 font-sans text-sm">
            {query ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente ainda."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-surface-border overflow-hidden">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-surface-border bg-surface-elevated">
                  <th className="text-left px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal">Nome</th>
                  <th className="text-left px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal">Telefone</th>
                  <th className="text-left px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal hidden lg:table-cell">Email</th>
                  <th className="text-right px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal">Atendimentos</th>
                  <th className="text-right px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal">Total gasto</th>
                  <th className="text-right px-4 py-3 text-foreground/40 text-xs uppercase tracking-widest font-normal hidden lg:table-cell">Último atend.</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/admin/clientes/${c.id}`)}
                    className="border-b border-surface-border last:border-0 hover:bg-surface-elevated cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{c.nome}</span>
                        {c.total_agendamentos >= 5 && (
                          <span className="text-[9px] font-sans border border-gold/50 text-gold px-1.5 py-0.5 uppercase tracking-wider">
                            Frequente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{c.telefone}</td>
                    <td className="px-4 py-3 text-foreground/50 hidden lg:table-cell">{c.email ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-foreground/70">{c.total_agendamentos}</td>
                    <td className="px-4 py-3 text-right text-gold font-medium">{formatCurrency(c.total_gasto)}</td>
                    <td className="px-4 py-3 text-right text-foreground/50 hidden lg:table-cell">{formatDate(c.ultimo_agendamento_em)}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-foreground/25" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/admin/clientes/${c.id}`)}
                className="w-full text-left border border-surface-border bg-surface-card p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-foreground font-medium font-sans">{c.nome}</span>
                    {c.total_agendamentos >= 5 && (
                      <span className="text-[9px] border border-gold/50 text-gold px-1.5 py-0.5 uppercase tracking-wider font-sans shrink-0">
                        Frequente
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/40 text-xs font-sans">{c.telefone}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-sans text-foreground/40">{c.total_agendamentos} atend.</span>
                    <span className="text-xs font-sans text-gold">{formatCurrency(c.total_gasto)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-foreground/25 shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
