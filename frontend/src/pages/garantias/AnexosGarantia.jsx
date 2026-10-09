import { useEffect, useState } from "react";
import { Camera, Download, Eye, File, FileBadge, FileImage, FileText, Image, Paperclip, Receipt } from "lucide-react";
import { abrirAnexo, obterAnexo } from "../../services/anexosLocais";

const tamanhoLegivel = (bytes) => {
  const n = Number(bytes) || 0;
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
};

const tipoFicheiro = (anexo) => {
  const tipo = String(anexo?.tipo || "");
  const nome = String(anexo?.nome || "").toLowerCase();
  if (tipo === "application/pdf" || nome.endsWith(".pdf")) return { icone: FileText, rotulo: "PDF", tom: "is-pdf" };
  if (tipo.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(nome)) return { icone: FileImage, rotulo: "Imagem", tom: "is-imagem" };
  return { icone: File, rotulo: "Ficheiro", tom: "" };
};

const FotoGaleria = ({ anexo, indice, total, onErro }) => {
  const [src, setSrc] = useState(anexo.conteudo || "");
  useEffect(() => {
    if (anexo.conteudo || !anexo.anexo_id) return undefined;
    let activo = true;
    obterAnexo(anexo.anexo_id).then((c) => { if (activo && c) setSrc(c); }).catch(() => {});
    return () => { activo = false; };
  }, [anexo]);
  return (
    <figure className="gar-galeria-item" style={{ animationDelay: `${indice * 70}ms` }}>
      <button type="button" title={`Abrir ${anexo.nome}`} onClick={() => abrirAnexo(anexo).catch((e) => onErro?.(e.message))}>
        {src ? <img src={src} alt={anexo.nome} /> : <span className="gar-galeria-vazia"><Image size={26} /></span>}
        <span className="gar-galeria-sobre"><Eye size={18} /> Abrir</span>
        <b className="gar-galeria-num">{indice + 1}/{total}</b>
      </button>
      <figcaption title={anexo.nome}>{anexo.nome}</figcaption>
    </figure>
  );
};

export const ListaDocumentos = ({ anexos, categoria, onErro, inicio = 0 }) =>
  (anexos || []).map((a, i) => {
    const { icone: Icone, rotulo, tom } = tipoFicheiro(a);
    return (
      <button
        key={`${a.nome}-${i}`}
        type="button"
        className={`gar-doc ${tom}`}
        style={{ animationDelay: `${(inicio + i) * 60}ms` }}
        title={`Abrir ${a.nome}`}
        onClick={() => abrirAnexo(a).catch((e) => onErro?.(e.message))}
      >
        <span className="gar-doc-icone"><Icone size={20} /><em>{rotulo}</em></span>
        <span className="gar-doc-texto">
          <strong>{a.nome}</strong>
          <small>{categoria}{tamanhoLegivel(a.tamanho) ? ` · ${tamanhoLegivel(a.tamanho)}` : ""}</small>
        </span>
        <span className="gar-doc-baixar"><Download size={15} /></span>
      </button>
    );
  });

const GRUPOS = [
  { id: "titulo", rotulo: "Título de propriedade", icone: FileBadge },
  { id: "factura", rotulo: "Factura/Recibo", icone: Receipt },
  { id: "outros", rotulo: "Outros documentos", icone: Paperclip },
];

const AnexosGarantia = ({ garantia, onErro }) => {
  const fotos = garantia.fotos_garantia || [];
  const docs = garantia.documentos_anexos || {};
  const grupos = GRUPOS.filter((grupo) => docs[grupo.id]?.length);
  const totalDocs = grupos.reduce((s, grupo) => s + docs[grupo.id].length, 0);
  if (!fotos.length && !totalDocs) return null;
  let contador = 0;

  return (
    <section className="cli-section gar-anexos">
      <div className="gar-seccao-topo">
        <h2><Paperclip size={18} /> Documentos e fotos</h2>
        <span className="gar-seccao-contagens">
          {fotos.length ? <span className="cli-chip is-azul"><Camera size={13} /> {fotos.length} foto{fotos.length === 1 ? "" : "s"}</span> : null}
          {totalDocs ? <span className="cli-chip"><FileText size={13} /> {totalDocs} documento{totalDocs === 1 ? "" : "s"}</span> : null}
        </span>
      </div>

      {fotos.length ? (
        <div className="gar-anexos-bloco">
          <h3><Camera size={15} /> Fotos da garantia</h3>
          <div className="gar-galeria">
            {fotos.map((f, i) => <FotoGaleria key={`${f.nome}-${i}`} anexo={f} indice={i} total={fotos.length} onErro={onErro} />)}
          </div>
        </div>
      ) : null}

      {grupos.map((grupo) => {
        const inicio = contador;
        contador += docs[grupo.id].length;
        return (
          <div key={grupo.id} className="gar-anexos-bloco">
            <h3><grupo.icone size={15} /> {grupo.rotulo} <em>{docs[grupo.id].length}</em></h3>
            <div className="gar-docs">
              <ListaDocumentos anexos={docs[grupo.id]} categoria={grupo.rotulo} onErro={onErro} inicio={inicio} />
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default AnexosGarantia;
