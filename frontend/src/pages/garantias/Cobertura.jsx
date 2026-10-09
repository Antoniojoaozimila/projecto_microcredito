import { Scale } from "lucide-react";
import { REGRAS_GARANTIA } from "../../services/garantiasMicrocredito";

const Cobertura = ({ valor }) => {
  const tom = valor >= REGRAS_GARANTIA.coberturaRecomendada ? "" : valor >= REGRAS_GARANTIA.coberturaMinima ? "is-amarelo" : "is-vermelho";
  return (
    <span className={`cli-chip is-forte gar-chip-cobertura ${tom}`} title={`Mínimo ${REGRAS_GARANTIA.coberturaMinima}% · recomendado ${REGRAS_GARANTIA.coberturaRecomendada}%`}>
      <Scale size={13} /> {valor.toFixed(0)}%
      <i><b style={{ width: `${Math.min(100, (valor / 150) * 100)}%` }} /></i>
    </span>
  );
};

export default Cobertura;
