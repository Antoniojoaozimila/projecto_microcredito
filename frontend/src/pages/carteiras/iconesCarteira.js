import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Ban, CheckCircle2, Clock, Lock, Undo2, XCircle } from "lucide-react";

export const TOM_CARTEIRA = {
  Ativa: { icone: CheckCircle2, tom: "" },
  Inativa: { icone: Ban, tom: "is-cinza" },
  Bloqueada: { icone: Lock, tom: "is-laranja" },
  Encerrada: { icone: XCircle, tom: "is-vermelho" },
};

export const TOM_MOVIMENTO = {
  Entrada: { icone: ArrowDownLeft, tom: "" },
  "Saída": { icone: ArrowUpRight, tom: "is-vermelho" },
  "Transferência": { icone: ArrowLeftRight, tom: "is-azul" },
};

export const TOM_TRANSACAO = {
  Confirmada: { icone: CheckCircle2, tom: "" },
  Pendente: { icone: Clock, tom: "is-amarelo" },
  Cancelada: { icone: Ban, tom: "is-cinza" },
  Estornada: { icone: Undo2, tom: "is-vermelho" },
};

export const TOM_DESPESA = {
  Pendente: { icone: Clock, tom: "is-amarelo" },
  Aprovada: { icone: CheckCircle2, tom: "is-azul" },
  Paga: { icone: CheckCircle2, tom: "" },
  Rejeitada: { icone: XCircle, tom: "is-vermelho" },
  Cancelada: { icone: Ban, tom: "is-cinza" },
};

export const TOM_TRANSFERENCIA = {
  Pendente: { icone: Clock, tom: "is-amarelo" },
  Concluída: { icone: CheckCircle2, tom: "" },
  Cancelada: { icone: Ban, tom: "is-cinza" },
  Falhou: { icone: XCircle, tom: "is-vermelho" },
};

export const CORES_TIPO_CARTEIRA = {
  Caixa: "#4AAC05",
  Mpesa: "#e11d48",
  "E-Mola": "#f59e0b",
  Banco: "#2563eb",
  Outro: "#7c3aed",
};

export const CAMINHO_CAR = "/imperial/dashboard/modulo/carteiras";
