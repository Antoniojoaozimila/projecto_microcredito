import { CalendarDays, CircleDollarSign } from "lucide-react";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { TOM_AGENDA, TOM_COBRADOR, TOM_ITEM, TOM_NOTIFICACAO, TOM_PROMESSA, TOM_ROTA, TOM_ZONA } from "./iconesCobranca";

const Chip = ({ mapa, estado, forte }) => {
  const { icone: Icone, tom } = mapa[estado] || { icone: CircleDollarSign, tom: "is-cinza" };
  return <span className={`cli-chip ${tom}${forte ? " is-forte" : ""}`}><Icone size={12} /> {estado || "—"}</span>;
};

export const ChipAgenda = ({ estado }) => <Chip mapa={TOM_AGENDA} estado={estado} />;
export const ChipItem = ({ estado }) => <Chip mapa={TOM_ITEM} estado={estado} />;
export const ChipRota = ({ estado }) => <Chip mapa={TOM_ROTA} estado={estado} />;
export const ChipZona = ({ estado }) => <Chip mapa={TOM_ZONA} estado={estado} />;
export const ChipCobrador = ({ estado }) => <Chip mapa={TOM_COBRADOR} estado={estado} />;
export const ChipPromessa = ({ estado }) => <Chip mapa={TOM_PROMESSA} estado={estado} />;
export const ChipNotificacao = ({ estado }) => <Chip mapa={TOM_NOTIFICACAO} estado={estado} />;

export const ChipValor = ({ valor, tom = "is-azul" }) => (
  <span className={`cli-chip is-forte ${tom}`}><CircleDollarSign size={13} /> {formatarMT(valor)}</span>
);

export const ChipData = ({ data }) => (
  <span className="cli-chip is-cinza"><CalendarDays size={12} /> {formatarData(data)}</span>
);
