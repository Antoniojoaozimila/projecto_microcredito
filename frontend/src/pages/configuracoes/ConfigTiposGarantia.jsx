import { useContext, useState } from "react";
import { Shield } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { MensagemModal } from "../comum/ElementosModulo";
import { TIPOS_GARANTIA } from "../../services/garantiasMicrocredito";
import { guardarConfig, lerConfig } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const ConfigTiposGarantia = () => {
  const { usuario } = useContext(AuthContext);
  const [inactivos, setInactivos] = useState(() => lerConfig().tipos_garantia_inactivos || []);
  const [aviso, setAviso] = useState(null);

  const alternar = (id) => {
    const seguinte = inactivos.includes(id) ? inactivos.filter((x) => x !== id) : [...inactivos, id];
    setInactivos(seguinte);
    guardarConfig({ tipos_garantia_inactivos: seguinte }, usuario);
    setAviso({ texto: "Os tipos de garantia foram actualizados." });
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills"><span className="cli-pill"><Shield size={16} /> Tipos de garantia</span></div>
      </header>
      <div className="cfg-lista">
        {TIPOS_GARANTIA.map((tipo, indice) => {
          const activo = !inactivos.includes(tipo.id);
          return (
            <article className="cfg-cartao cfg-tipo" key={tipo.id} style={{ animationDelay: `${indice * 50}ms` }}>
              <span className="cfg-tipo-icone"><Shield size={22} /></span>
              <div>
                <h3 className="cfg-titulo">{tipo.label}</h3>
                <small>{tipo.detalhe}</small>
              </div>
              <button type="button" className={`cfg-switch${activo ? " is-on" : ""}`} onClick={() => alternar(tipo.id)}><i /><span>{activo ? "Activo" : "Inactivo"}</span></button>
            </article>
          );
        })}
      </div>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigTiposGarantia;
