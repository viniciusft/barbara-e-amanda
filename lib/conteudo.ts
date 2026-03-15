import { cache } from "react";
import { createServerSupabaseClient } from "./supabase";

export interface ConteudoPagina {
  titulo: string | null;
  subtitulo: string | null;
  descricao_curta: string | null;
}

/**
 * Busca o conteúdo de uma página da tabela conteudo_paginas.
 * Usa React cache() para deduplicar chamadas durante o mesmo render
 * (ex: generateMetadata + page component chamando ao mesmo tempo).
 */
export const getConteudo = cache(
  async (pagina: string): Promise<ConteudoPagina | null> => {
    try {
      const db = createServerSupabaseClient();
      const { data } = await db
        .from("conteudo_paginas")
        .select("titulo, subtitulo, descricao_curta")
        .eq("pagina", pagina)
        .single();
      return data ?? null;
    } catch {
      return null;
    }
  }
);
