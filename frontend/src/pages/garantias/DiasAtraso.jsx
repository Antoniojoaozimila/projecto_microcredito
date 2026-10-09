import { CalendarClock } from "lucide-react";
import { REGRAS_GARANTIA } from "../../services/garantiasMicrocredito";

const DiasAtraso = ({ dias }) => {
  const limite = REGRAS_GARANTIA.diasExecucao;
  const tom = dias >= limite ? "is-vermelho" : dias >= REGRAS_GARANTIA.diasAvisoExecucao ? "is-laranja" : "is-amarelo";
  return (
    <span className={`cli-chip is-forte gar-chip-cobertura gar-chip-dias ${tom}`} title={`${dias} de ${limite} dias até à execução`}>
      <CalendarClock size={13} /> {dias}/{limite} dias
      <i><b style={{ width: `${Math.min(100, (dias / limite) * 100)}%` }} /></i>
    </span>
  );
};

export default DiasAtraso;
