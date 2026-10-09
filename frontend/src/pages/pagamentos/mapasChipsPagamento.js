import { Ban, BadgeCheck, Banknote, CalendarCheck, CircleDollarSign, FastForward, FileText, Hourglass, Landmark, PieChart, RotateCcw, Smartphone, TriangleAlert } from "lucide-react";

export const CHIP_FORMA = {
  Dinheiro: { icone: Banknote, tom: "" },
  Mpesa: { icone: Smartphone, tom: "is-vermelho" },
  "E-Mola": { icone: Smartphone, tom: "is-laranja" },
  "Transferência Bancária": { icone: Landmark, tom: "is-azul" },
  Cheque: { icone: FileText, tom: "is-ciano" },
};

export const CHIP_TIPO = {
  "Pagamento de Parcela": { icone: CalendarCheck, tom: "is-azul" },
  "Pagamento Antecipado": { icone: FastForward, tom: "is-ciano" },
  "Pagamento Parcial": { icone: PieChart, tom: "is-amarelo" },
  "Quitação Total": { icone: BadgeCheck, tom: "is-roxo" },
  Multa: { icone: TriangleAlert, tom: "is-vermelho" },
};

export const CHIP_ESTADO = {
  Confirmado: { icone: BadgeCheck, tom: "" },
  Pendente: { icone: Hourglass, tom: "is-amarelo" },
  Cancelado: { icone: Ban, tom: "is-cinza" },
  Estornado: { icone: RotateCcw, tom: "is-vermelho" },
};

export const CHIP_PADRAO = { icone: CircleDollarSign, tom: "is-cinza" };
