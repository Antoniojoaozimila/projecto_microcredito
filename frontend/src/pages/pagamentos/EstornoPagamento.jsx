import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, RotateCcw, StickyNote, X } from "lucide-react";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { HORAS_ESTORNO, estornarPagamento } from "../../services/pagamentosMicrocredito";

const EstornoPagamento = ({ pagamento, carteira, utilizador, onFechar, onConcluido }) => {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [aGravar, setAGravar] = useState(false);

  const confirmar = () => {
    if (aGravar) return;
    setAGravar(true);
    try {
      onConcluido(estornarPagamento(pagamento.id, motivo, utilizador));
    } catch (falha) {
      setErro(falha.message);
      setAGravar(false);
    }
  };

  return createPortal(
    <div className="cli-modal-fundo" role="presentation">
      <div className="cli-modal pag-modal pag-estorno" role="dialog" aria-modal="true" aria-labelledby="pag-estorno-titulo">
        <div className="pag-modal-topo">
          <h2 id="pag-estorno-titulo"><RotateCcw size={20} /> Estornar pagamento {pagamento.numero_recibo}</h2>
          <button type="button" className="pag-fechar" aria-label="Fechar" onClick={onFechar}><X size={16} /></button>
        </div>
        <p className="pag-estorno-info">
          <AlertTriangle size={16} />
          <span>
            O valor de {formatarMT(pagamento.valor_pago)} será debitado da carteira {carteira?.nome || ""} e as parcelas voltam ao estado anterior.
            Só é possível estornar até {HORAS_ESTORNO} horas após o registo ({new Date(new Date(pagamento.data_registo).getTime() + HORAS_ESTORNO * 3600000).toLocaleString("pt-PT")}).
          </span>
        </p>
        {carteira ? (
          <div className="emp-debito is-baixa">
            <LogoCarteira carteira={carteira} />
            <span>
              <small>Saldo da carteira</small>
              <strong>{formatarMT(carteira.saldo)} → {formatarMT(carteira.saldo - pagamento.valor_pago)}</strong>
            </span>
          </div>
        ) : null}
        <div className="cli-field full" style={{ marginTop: 14 }}>
          <label><StickyNote size={15} /> Justificação *</label>
          <textarea maxLength={1000} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(""); }} placeholder="Explique o motivo do estorno" autoFocus />
          {erro ? <small>{erro}</small> : null}
        </div>
        <div className="pag-modal-accoes">
          <button type="button" className="cli-btn-voltar" onClick={onFechar}><X size={15} /> Cancelar</button>
          <button type="button" className="pag-btn-perigo" disabled={aGravar || motivo.trim().length < 5} onClick={confirmar}>
            {aGravar ? <Loader2 size={15} className="emp-girar" /> : <RotateCcw size={15} />} Confirmar estorno
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EstornoPagamento;
