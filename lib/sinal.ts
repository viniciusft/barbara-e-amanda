import { Agendamento, AdminConfig, Servico } from "@/types";

/**
 * Calculate the sinal (deposit) amount for an agendamento.
 *
 * Priority:
 * 1. If the agendamento already has sinal_valor set → use it as-is
 * 2. If service has sinal_tipo = 'fixo' → use sinal_valor_fixo
 * 3. If service has sinal_tipo = 'percentual' and sinal_percentual_custom → calculate from custom %
 * 4. Fallback → calculate from adminConfig.sinal_percentual_padrao (default 50%)
 *
 * Returns { valorSinal, sinalPct, isFixo }
 */
export function calcSinal(
  valorTotal: number,
  agendamento: Pick<Agendamento, "sinal_valor" | "sinal_percentual"> | null,
  servico: Pick<Servico, "sinal_tipo" | "sinal_percentual_custom" | "sinal_valor_fixo"> | null | undefined,
  adminConfig: Pick<AdminConfig, "sinal_percentual_padrao"> | null | undefined
): { valorSinal: number; sinalPct: number; isFixo: boolean } {
  // 1. Agendamento already has sinal_valor
  if (agendamento?.sinal_valor != null && agendamento.sinal_valor > 0) {
    const pct = valorTotal > 0
      ? Math.round((agendamento.sinal_valor / valorTotal) * 100)
      : agendamento.sinal_percentual ?? 50;
    return { valorSinal: agendamento.sinal_valor, sinalPct: pct, isFixo: true };
  }

  // 2. Service has fixed sinal
  if (servico?.sinal_tipo === "fixo" && servico.sinal_valor_fixo != null) {
    const v = Math.min(servico.sinal_valor_fixo, valorTotal);
    const pct = valorTotal > 0 ? Math.round((v / valorTotal) * 100) : 0;
    return { valorSinal: round2(v), sinalPct: pct, isFixo: true };
  }

  // 3. Service has custom percentage
  if (
    (servico?.sinal_tipo === "percentual" || servico?.sinal_tipo == null) &&
    servico?.sinal_percentual_custom != null
  ) {
    const pct = servico.sinal_percentual_custom;
    return { valorSinal: round2((valorTotal * pct) / 100), sinalPct: pct, isFixo: false };
  }

  // 4. Fallback to admin global default
  const pct = adminConfig?.sinal_percentual_padrao ?? 50;
  return { valorSinal: round2((valorTotal * pct) / 100), sinalPct: pct, isFixo: false };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
