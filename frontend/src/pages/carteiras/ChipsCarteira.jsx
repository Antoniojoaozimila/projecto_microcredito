import { CircleDollarSign } from "lucide-react";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { TOM_CARTEIRA, TOM_DESPESA, TOM_MOVIMENTO, TOM_TRANSACAO, TOM_TRANSFERENCIA } from "./iconesCarteira";

const Chip = ({ mapa, estado }) => {
  const { icone: Icone, tom } = mapa[estado] || { icone: CircleDollarSign, tom: "is-cinza" };
  return <span className={`cli-chip ${tom}`}><Icone size={12} /> {estado || "—"}</span>;
};

export const ChipEstadoCarteira = ({ estado }) => <Chip mapa={TOM_CARTEIRA} estado={estado} />;
export const ChipMovimento = ({ tipo }) => <Chip mapa={TOM_MOVIMENTO} estado={tipo} />;
export const ChipTransacao = ({ estado }) => <Chip mapa={TOM_TRANSACAO} estado={estado} />;
export const ChipDespesa = ({ estado }) => <Chip mapa={TOM_DESPESA} estado={estado} />;
export const ChipTransferencia = ({ estado }) => <Chip mapa={TOM_TRANSFERENCIA} estado={estado} />;

export const ChipValor = ({ valor, tom = "is-azul", sinal }) => (
  <span className={`cli-chip is-forte ${tom}`}>
    <CircleDollarSign size={13} />
    {sinal === -1 ? "−" : sinal === 1 ? "+" : ""}{formatarMT(Math.abs(Number(valor) || 0))}
  </span>
);
