import {
  Ban, Bike, Car, FileBadge, Gavel, Gem, Handshake, Hourglass, House, LandPlot, Lock, LockOpen, Package, PiggyBank, ShieldCheck, ShieldOff, Wrench,
} from "lucide-react";

export const ICONES_TIPO_GARANTIA = {
  "Sem Garantia": ShieldOff,
  "Aval/Fiador": Handshake,
  "Bem Móvel": Car,
  "Bem Imóvel": House,
  "Cheque Caução": FileBadge,
  "Depósito Caução": PiggyBank,
  Outro: Package,
};

export const ICONES_SUBTIPO = { Carro: Car, Moto: Bike, Joias: Gem, Equipamento: Wrench, Casa: House, Terreno: LandPlot };

export const ICONES_ESTADO_GARANTIA = {
  "Em Avaliação": Hourglass,
  Ativa: ShieldCheck,
  Penhorada: Lock,
  Libertada: LockOpen,
  Executada: Gavel,
  Cancelada: Ban,
};

export const TOM_ESTADO_GARANTIA = {
  "Em Avaliação": "is-amarelo",
  Ativa: "",
  Penhorada: "is-vermelho",
  Libertada: "is-azul",
  Executada: "is-roxo",
  Cancelada: "is-cinza",
};

export const CORES_TIPO_GARANTIA = {
  "Sem Garantia": "#64748b",
  "Aval/Fiador": "#4AAC05",
  "Bem Móvel": "#2563eb",
  "Bem Imóvel": "#d97706",
  "Cheque Caução": "#7c3aed",
  "Depósito Caução": "#0891b2",
  Outro: "#db2777",
};

export const ETIQUETAS_TIPO_GARANTIA = {
  "Sem Garantia": "Pessoal",
  "Aval/Fiador": "Pessoas",
  "Bem Móvel": "Bens",
  "Bem Imóvel": "Bens",
  "Cheque Caução": "Financeira",
  "Depósito Caução": "Financeira",
  Outro: "Outra",
};
