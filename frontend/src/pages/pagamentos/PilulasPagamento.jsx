import { CircleDollarSign } from "lucide-react";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { CHIP_ESTADO, CHIP_FORMA, CHIP_PADRAO, CHIP_TIPO } from "./mapasChipsPagamento";

const Chip = ({ mapa, valor, extra = "" }) => {
  const { icone: Icone, tom } = mapa[valor] || CHIP_PADRAO;
  return <span className={`cli-chip ${tom} ${extra}`}><Icone size={13} /> {valor || "—"}</span>;
};

export const ChipForma = ({ forma }) => <Chip mapa={CHIP_FORMA} valor={forma} />;

export const ChipTipo = ({ tipo }) => <Chip mapa={CHIP_TIPO} valor={tipo} />;

export const ChipEstadoPagamento = ({ estado, grande }) => <Chip mapa={CHIP_ESTADO} valor={estado} extra={grande ? "pag-chip-grande" : ""} />;

export const ChipValor = ({ valor, estornado }) => (
  <span className={`cli-chip is-forte ${estornado ? "is-cinza pag-chip-riscado" : ""}`}><CircleDollarSign size={13} /> {formatarMT(valor)}</span>
);
