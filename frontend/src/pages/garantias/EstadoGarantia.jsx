import { ICONES_ESTADO_GARANTIA, TOM_ESTADO_GARANTIA } from "./iconesGarantia";

const EstadoGarantia = ({ estado, grande }) => {
  const Icone = ICONES_ESTADO_GARANTIA[estado];
  return (
    <span className={`cli-chip gar-estado ${TOM_ESTADO_GARANTIA[estado] ?? "is-cinza"}${grande ? " gar-chip-grande" : ""}`}>
      {Icone ? <Icone size={grande ? 15 : 13} /> : null} {estado}
    </span>
  );
};

export default EstadoGarantia;
