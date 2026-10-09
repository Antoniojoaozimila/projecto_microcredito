import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import MenuSuspenso from "../clientes/MenuSuspenso";

const ModalAccaoGarantia = ({ titulo, subtitulo, icone: Icone, tom = "verde", descricao, campos = [], botao, onConfirmar, onFechar }) => {
  const [valores, setValores] = useState(() => Object.fromEntries(campos.map((c) => [c.id, c.inicial ?? ""])));
  const [erro, setErro] = useState("");

  const confirmar = (evento) => {
    evento.preventDefault();
    try {
      onConfirmar(valores);
    } catch (falha) {
      setErro(falha.message || "Não foi possível concluir.");
    }
  };

  const set = (id, valor) => { setValores((v) => ({ ...v, [id]: valor })); setErro(""); };

  return createPortal(
    <div className="cli-modal-fundo" role="presentation">
      <form className={`cli-modal cli-modal-mensagem gar-accao is-${tom}`} role="dialog" aria-modal="true" onSubmit={confirmar}>
        <button type="button" className="pag-fechar gar-accao-fechar" aria-label="Fechar" onClick={onFechar}><X size={15} /></button>
        <span className="cli-modal-icone"><Icone size={28} /></span>
        <p>{subtitulo}</p>
        <h2>{titulo}</h2>
        {descricao ? <small className="cli-modal-texto">{descricao}</small> : null}
        {campos.map((c) => (
          <div key={c.id} className="cli-field full gar-accao-campo">
            <label>{c.label}</label>
            {c.opcoes ? (
              <MenuSuspenso valor={valores[c.id]} opcoes={c.opcoes.map((o) => ({ id: o, label: o }))} onChange={(v) => set(c.id, v)} />
            ) : c.tipo === "textarea" ? (
              <textarea rows={3} maxLength={1000} value={valores[c.id]} onChange={(e) => set(c.id, e.target.value)} placeholder={c.placeholder} autoFocus={c.foco} />
            ) : (
              <input type={c.tipo || "text"} value={valores[c.id]} max={c.max} onChange={(e) => set(c.id, e.target.value)} placeholder={c.placeholder} autoFocus={c.foco} />
            )}
          </div>
        ))}
        {erro ? <small className="cli-senha-erro gar-accao-erro"><AlertTriangle size={13} /> {erro}</small> : null}
        <div className="cli-modal-accoes">
          <button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button>
          <button type="submit" className={`cli-btn${tom === "vermelho" ? " cli-btn-perigo" : ""}`}><Icone size={16} /> {botao}</button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default ModalAccaoGarantia;
