import * as XLSX from "xlsx";

interface ColOpcao {
  label: string;
  largura?: number;
}

export function exportarXlsx(
  dados: Record<string, unknown>[],
  nomeArquivo: string,
  opcoesColuna?: Record<string, ColOpcao>,
) {
  const linhas = dados.map((row) => {
    if (!opcoesColuna) return row;
    const nova: Record<string, unknown> = {};
    Object.entries(opcoesColuna).forEach(([chave, { label }]) => {
      if (chave in row) nova[label] = row[chave];
    });
    return nova;
  });

  const ws = XLSX.utils.json_to_sheet(linhas);

  if (opcoesColuna) {
    ws["!cols"] = Object.values(opcoesColuna).map(({ largura }) => ({
      wch: largura ?? 20,
    }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}
