import { CalendarDays, CircleDollarSign, Shield } from "lucide-react";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { CORES_TIPO_GARANTIA, ICONES_SUBTIPO, ICONES_TIPO_GARANTIA } from "./iconesGarantia";

export const ChipMT = ({ valor, tom = "", icone: Icone = CircleDollarSign, forte = true }) => (
  <span className={`cli-chip ${forte ? "is-forte" : ""} ${tom}`}><Icone size={13} /> {valor == null ? "—" : formatarMT(valor)}</span>
);

export const ChipData = ({ data, tom = "is-cinza" }) =>
  data ? <span className={`cli-chip ${tom}`}><CalendarDays size={13} /> {formatarData(data)}</span> : "—";

export const ChipTipoGarantia = ({ tipo, subtipo }) => {
  const Icone = (subtipo && ICONES_SUBTIPO[subtipo]) || ICONES_TIPO_GARANTIA[tipo] || Shield;
  const cor = CORES_TIPO_GARANTIA[tipo] || "#4b5563";
  return (
    <span className="cli-chip gar-chip-tipo" style={{ "--chip-cor": cor, "--chip-fundo": `${cor}18` }}>
      <Icone size={13} /> {tipo}{subtipo ? <em>· {subtipo}</em> : null}
    </span>
  );
};
