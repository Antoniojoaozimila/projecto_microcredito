import {
  AlertTriangle, Ban, CalendarClock, CheckCircle2, CircleDashed, Clock, MapPin, PauseCircle, RefreshCw, ShieldAlert, UserCheck, XCircle,
} from "lucide-react";

export const TOM_AGENDA = {
  Pendente: { icone: Clock, tom: "is-amarelo" },
  "Em Curso": { icone: CalendarClock, tom: "is-azul" },
  Concluída: { icone: CheckCircle2, tom: "" },
  Cancelada: { icone: Ban, tom: "is-cinza" },
};

export const TOM_ITEM = {
  Pendente: { icone: CircleDashed, tom: "is-amarelo" },
  Cobrado: { icone: CheckCircle2, tom: "" },
  "Parcialmente Cobrado": { icone: ShieldAlert, tom: "is-ciano" },
  "Não Cobrado": { icone: XCircle, tom: "is-vermelho" },
  Reagendado: { icone: RefreshCw, tom: "is-roxo" },
};

export const TOM_ROTA = {
  Pendente: { icone: CircleDashed, tom: "is-amarelo" },
  Visitado: { icone: CheckCircle2, tom: "" },
  "Não Visitado": { icone: XCircle, tom: "is-vermelho" },
};

export const TOM_ZONA = {
  Ativa: { icone: MapPin, tom: "" },
  Inativa: { icone: Ban, tom: "is-cinza" },
};

export const TOM_COBRADOR = {
  Ativo: { icone: UserCheck, tom: "" },
  Inativo: { icone: Ban, tom: "is-cinza" },
  Suspenso: { icone: PauseCircle, tom: "is-laranja" },
};

export const TOM_PROMESSA = {
  Pendente: { icone: Clock, tom: "is-amarelo" },
  Cumprida: { icone: CheckCircle2, tom: "" },
  "Não Cumprida": { icone: AlertTriangle, tom: "is-vermelho" },
  Reagendada: { icone: RefreshCw, tom: "is-roxo" },
};

export const TOM_NOTIFICACAO = {
  Pendente: { icone: Clock, tom: "is-amarelo" },
  Enviada: { icone: CheckCircle2, tom: "is-azul" },
  Entregue: { icone: CheckCircle2, tom: "" },
  Lida: { icone: CheckCircle2, tom: "is-ciano" },
  Falhou: { icone: XCircle, tom: "is-vermelho" },
};

export const CAMINHO_COB = "/imperial/dashboard/modulo/cobrancas";
