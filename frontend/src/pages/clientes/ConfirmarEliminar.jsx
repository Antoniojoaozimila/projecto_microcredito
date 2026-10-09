import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Lock, Trash2 } from "lucide-react";

const SENHA_ELIMINAR = "0000";

const ConfirmarEliminar = ({ titulo, nome, aviso, onConfirmar, onCancelar }) => {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const confirmar = (evento) => {
    evento.preventDefault();
    if (senha !== SENHA_ELIMINAR) {
      setErro("Senha incorrecta.");
      return;
    }
    try {
      onConfirmar();
    } catch (falha) {
      setErro(falha.message || "Não foi possível eliminar.");
    }
  };

  return createPortal(
    <div className="cli-modal-fundo" role="presentation">
      <form className="cli-modal cli-modal-perigo cli-modal-mensagem" role="dialog" aria-modal="true" onSubmit={confirmar}>
        <span className="cli-modal-icone"><Trash2 size={30} /></span>
        <p>{titulo}</p>
        <h2>{nome}</h2>
        {aviso ? <small className="cli-modal-texto"><AlertTriangle size={14} /> {aviso}</small> : null}
        <label className="cli-senha">
          <Lock size={16} />
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={senha}
            onChange={(e) => { setSenha(e.target.value.replace(/\D/g, "").slice(0, 4)); setErro(""); }}
            placeholder="Senha de confirmação"
          />
        </label>
        {erro ? <small className="cli-senha-erro">{erro}</small> : null}
        <div className="cli-modal-accoes">
          <button type="button" className="cli-btn ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="cli-btn cli-btn-perigo"><Trash2 size={16} /> Eliminar</button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default ConfirmarEliminar;
