export const STATUS_APROVACAO_LABELS = {
  nao_requer: "Não Requer Aprovação",
  aguardando: "Aguardando Aprovação",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export const STATUS_APROVACAO_CORES = {
  nao_requer: "bg-gray-100 text-gray-700",
  aguardando: "bg-amber-100 text-amber-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
};

export function getStatusAprovacaoLabel(status) {
  return STATUS_APROVACAO_LABELS[status] || STATUS_APROVACAO_LABELS.nao_requer;
}

export function cotacaoPodePartilhar(statusAprovacao) {
  const status = statusAprovacao || "nao_requer";
  return status === "nao_requer" || status === "aprovada";
}

export function formatarTaxaPercentual(taxaDecimal) {
  const taxa = parseFloat(taxaDecimal);
  if (Number.isNaN(taxa)) return "—";
  return `${(taxa * 100).toFixed(2)}%`;
}
