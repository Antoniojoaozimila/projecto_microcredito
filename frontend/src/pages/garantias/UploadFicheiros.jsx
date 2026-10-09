import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { REGRAS_GARANTIA } from "../../services/garantiasMicrocredito";

const TIPOS_DOCUMENTO = ["image/jpeg", "image/png", "application/pdf"];
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

const lerFicheiro = (ficheiro) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve({ nome: ficheiro.name, tipo: ficheiro.type, tamanho: ficheiro.size, conteudo: leitor.result });
    leitor.onerror = () => reject(new Error(`Não foi possível ler ${ficheiro.name}.`));
    leitor.readAsDataURL(ficheiro);
  });

const UploadFicheiros = ({ rotulo, valor = [], onChange, onErro, fotos = false, max = 10, obrigatorio = false, icone: Icone = Upload }) => {
  const [arrastar, setArrastar] = useState(false);
  const aceites = fotos ? TIPOS_FOTO : TIPOS_DOCUMENTO;

  const adicionar = async (lista) => {
    const ficheiros = Array.from(lista || []);
    if (!ficheiros.length) return;
    const invalido = ficheiros.find((f) => !aceites.includes(f.type));
    if (invalido) {
      onErro?.(`${invalido.name}: formato inválido. Use ${fotos ? "JPG, PNG ou WEBP" : "JPG, PNG ou PDF"}.`);
      return;
    }
    const grande = ficheiros.find((f) => f.size > REGRAS_GARANTIA.maxFicheiroMB * 1024 * 1024);
    if (grande) {
      onErro?.(`${grande.name} excede ${REGRAS_GARANTIA.maxFicheiroMB}MB.`);
      return;
    }
    if (valor.length + ficheiros.length > max) {
      onErro?.(`Máximo de ${max} ficheiro${max === 1 ? "" : "s"} em «${rotulo}».`);
      return;
    }
    try {
      const lidos = await Promise.all(ficheiros.map(lerFicheiro));
      onChange([...valor, ...lidos]);
      onErro?.("");
    } catch (erro) {
      onErro?.(erro.message);
    }
  };

  const cheio = valor.length >= max;

  return (
    <div className={`gar-upload${valor.length ? " tem-ficheiros" : ""}${obrigatorio && !valor.length ? " is-obrigatorio" : ""}`}>
      <div className="gar-upload-topo">
        <span className="gar-upload-icone"><Icone size={16} /></span>
        <strong>{rotulo}{obrigatorio ? " *" : ""}</strong>
        <small>{valor.length}/{max}</small>
      </div>
      {!cheio ? (
        <label
          className={`gar-upload-zona${arrastar ? " is-arrastar" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setArrastar(true); }}
          onDragLeave={() => setArrastar(false)}
          onDrop={(e) => { e.preventDefault(); setArrastar(false); adicionar(e.dataTransfer.files); }}
        >
          <input type="file" multiple={max > 1} accept={aceites.join(",")} onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }} />
          <Upload size={15} /> <span><b>Carregar</b> ou arrastar</span>
        </label>
      ) : null}
      {valor.length ? (
        <div className={fotos ? "gar-fotos" : "gar-ficheiros"}>
          {valor.map((f, i) => (
            fotos ? (
              <span key={`${f.nome}-${i}`} className="gar-foto" style={{ animationDelay: `${i * 50}ms` }}>
                {f.conteudo ? <img src={f.conteudo} alt={f.nome} /> : <FileText size={18} />}
                <button type="button" aria-label="Remover" onClick={() => onChange(valor.filter((_, k) => k !== i))}><X size={12} /></button>
              </span>
            ) : (
              <span key={`${f.nome}-${i}`} className="gar-ficheiro">
                <FileText size={13} /> <span>{f.nome}</span>
                <button type="button" aria-label="Remover" onClick={() => onChange(valor.filter((_, k) => k !== i))}><X size={12} /></button>
              </span>
            )
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default UploadFicheiros;
