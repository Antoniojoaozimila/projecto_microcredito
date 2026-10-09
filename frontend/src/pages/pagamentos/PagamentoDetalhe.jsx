import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, CircleDollarSign, Clock, CreditCard, Download, FileText, Hash, Layers, Paperclip,
  PiggyBank, Printer, Receipt, RotateCcw, StickyNote, Tag, Trash2, TrendingUp, User, Wallet, WalletCards,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import LogoCarteira from "../emprestimos/LogoCarteira";
import EstornoPagamento from "./EstornoPagamento";
import { ChipEstadoPagamento, ChipForma, ChipTipo } from "./PilulasPagamento";
import { descarregarReciboPagamento, imprimirReciboPagamento } from "./reciboPagamento";
import { abrirAnexo } from "../../services/anexosLocais";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { dadosDoRecibo, eliminarPagamento, obterPagamento, podeEstornar } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "./Pagamentos.css";

const TOM_ALOCACAO = { Multa: "is-vermelho", Juros: "is-amarelo", Principal: "" };
const ICONE_ALOCACAO = { Multa: AlertTriangle, Juros: TrendingUp, Principal: Wallet };

const Linha = ({ icon: Icone, rotulo, children, indice = 0 }) => (
  <tr style={{ animationDelay: `${indice * 30}ms` }}>
    <th><span><Icone size={15} /> {rotulo}</span></th>
    <td>{children}</td>
  </tr>
);

const PagamentoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [estorno, setEstorno] = useState(false);
  const [aEliminar, setAEliminar] = useState(false);
  const [aviso, setAviso] = useState(null);
  const pagamento = versao >= 0 ? obterPagamento(id) : null;

  if (!pagamento) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><Receipt size={16} /> Pagamento não encontrado</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/pagamentos")}><ArrowLeft size={16} /> Voltar ao histórico</button>
      </div>
    );
  }

  const { emprestimo, cliente, carteira, alocacoes } = dadosDoRecibo(pagamento);
  const estornado = pagamento.status === "Estornado";
  const quitado = pagamento.estado_emprestimo_apos === "Quitado";
  const parcela = pagamento.num_parcela ? `${pagamento.num_parcela}/${pagamento.total_parcelas}` : "—";
  const somaTipo = (tipo) => alocacoes.filter((a) => a.tipo_alocacao === tipo).reduce((s, a) => s + Number(a.valor_alocado || 0), 0);

  const recibo = async (accao) => {
    try {
      await accao(dadosDoRecibo(pagamento));
    } catch {
      setAviso({ erro: true, texto: "Não foi possível gerar o recibo." });
    }
  };

  const abrirComprovativo = async () => {
    try {
      await abrirAnexo(pagamento.comprovativo);
    } catch (erro) {
      setAviso({ erro: true, texto: erro.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Receipt size={16} /> Pagamento {pagamento.numero_recibo}</span>
          <ChipEstadoPagamento estado={pagamento.status} grande />
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/pagamentos")}><ArrowLeft size={16} /> Voltar</button>
          <button type="button" className="cli-btn-io" onClick={() => navigate(`/imperial/dashboard/emprestimos/${pagamento.loan_id}`)}><FileText size={16} /> Ver empréstimo</button>
          <button type="button" className="cli-btn-io" onClick={() => recibo(imprimirReciboPagamento)}><Printer size={16} /> Imprimir</button>
          <button type="button" className="cli-btn-novo" onClick={() => recibo(descarregarReciboPagamento)}><Download size={16} /> Recibo PDF</button>
          {podeEstornar(pagamento) ? (
            <button type="button" className="cli-btn-voltar emp-btn-rejeitar" onClick={() => setEstorno(true)}><RotateCcw size={16} /> Estornar</button>
          ) : null}
          <button type="button" className="cli-btn-voltar emp-btn-rejeitar" onClick={() => setAEliminar(true)}><Trash2 size={16} /> Eliminar</button>
        </div>
      </header>

      <section className={`pag-destaque${estornado ? " is-estornado" : ""}`}>
        <div className="pag-destaque-cliente">
          <AvatarCliente cliente={cliente} tamanho={52} />
          <span>
            <strong>{cliente?.nome_completo || "Cliente removido"}</strong>
            <small>{emprestimo?.numero_contrato || "—"} · Parcela {parcela}</small>
          </span>
        </div>
        <div className="pag-destaque-valor">
          <small>Valor pago</small>
          <strong>{formatarMT(pagamento.valor_pago)}</strong>
          <span className="pag-destaque-chips">
            <ChipForma forma={pagamento.forma_pagamento} />
            <ChipTipo tipo={pagamento.tipo_pagamento} />
          </span>
        </div>
        <div className="pag-destaque-data">
          <span><CalendarDays size={16} /> {formatarData(pagamento.data_pagamento)}</span>
          {pagamento.hora_pagamento ? <span><Clock size={16} /> {pagamento.hora_pagamento}</span> : null}
        </div>
      </section>

      {estornado && pagamento.estorno ? (
        <p className="pag-estorno-info">
          <RotateCcw size={16} /> Estornado por {pagamento.estorno.por} em {new Date(pagamento.estorno.data).toLocaleString("pt-PT")}: {pagamento.estorno.motivo}
        </p>
      ) : null}

      <div className="pag-detalhe-grelha">
        <section className="cli-section">
          <h2><Receipt size={18} /> Dados do pagamento</h2>
          <table className="pag-ficha">
            <tbody>
              <Linha icon={Hash} rotulo="Nº do recibo" indice={0}><strong>{pagamento.numero_recibo}</strong></Linha>
              <Linha icon={FileText} rotulo="Contrato" indice={1}>{emprestimo?.numero_contrato || "—"}</Linha>
              <Linha icon={Layers} rotulo="Parcela" indice={2}>{parcela}</Linha>
              <Linha icon={CalendarDays} rotulo="Data e hora" indice={3}>{formatarData(pagamento.data_pagamento)}{pagamento.hora_pagamento ? ` · ${pagamento.hora_pagamento}` : ""}</Linha>
              <Linha icon={CreditCard} rotulo="Forma de pagamento" indice={4}><ChipForma forma={pagamento.forma_pagamento} /></Linha>
              <Linha icon={Tag} rotulo="Referência" indice={5}>{pagamento.referencia_transacao || "—"}</Linha>
              <Linha icon={Receipt} rotulo="Tipo de pagamento" indice={6}><ChipTipo tipo={pagamento.tipo_pagamento} /></Linha>
              <Linha icon={WalletCards} rotulo="Carteira" indice={7}>
                {carteira ? <span className="pag-ficha-carteira"><LogoCarteira carteira={carteira} /> {carteira.nome}</span> : "—"}
              </Linha>
              <Linha icon={BadgeCheck} rotulo="Estado" indice={8}><ChipEstadoPagamento estado={pagamento.status} /></Linha>
              <Linha icon={User} rotulo="Registado por" indice={9}>{pagamento.registado_por} · {new Date(pagamento.data_registo).toLocaleString("pt-PT")}</Linha>
            </tbody>
          </table>
        </section>

        <section className="cli-section">
          <h2><CircleDollarSign size={18} /> Resumo financeiro</h2>
          <ul className="pag-resumo-lista pag-resumo-detalhe">
            <li><span><CircleDollarSign size={15} /> Valor pago</span><strong className="pag-verde">{formatarMT(pagamento.valor_pago)}</strong></li>
            <li><span><AlertTriangle size={15} /> Multa</span><strong className={pagamento.valor_multa ? "pag-vermelho" : ""}>{formatarMT(pagamento.valor_multa || somaTipo("Multa"))}</strong></li>
            <li><span><TrendingUp size={15} /> Juros</span><strong>{formatarMT(pagamento.valor_juros_pago ?? somaTipo("Juros"))}</strong></li>
            <li><span><Wallet size={15} /> Principal</span><strong>{formatarMT(pagamento.valor_principal_pago ?? somaTipo("Principal"))}</strong></li>
            <li className="pag-resumo-total">
              <span><PiggyBank size={15} /> Saldo após pagamento</span>
              {quitado ? <span className="cli-chip is-roxo is-forte"><BadgeCheck size={13} /> QUITADO</span> : <strong>{formatarMT(pagamento.saldo_devedor_apos)}</strong>}
            </li>
          </ul>

          {pagamento.comprovativo ? (
            <button type="button" className="pag-comprovativo" onClick={abrirComprovativo}>
              <span><Paperclip size={16} /></span>
              <span><small>Comprovativo</small><strong>{pagamento.comprovativo.nome}</strong></span>
              <Download size={15} />
            </button>
          ) : null}
          {pagamento.observacoes ? <p className="emp-nota"><StickyNote size={15} /> {pagamento.observacoes}</p> : null}
        </section>
      </div>

      <section className="cli-section">
        <h2><Layers size={18} /> Alocação do pagamento</h2>
        <div className="cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><Layers size={14} /> Parcela</span></th>
                <th><span className="cli-th"><Tag size={14} /> Tipo de alocação</span></th>
                <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              </tr>
            </thead>
            <tbody>
              {alocacoes.length === 0 ? (
                <tr className="cli-empty"><td colSpan={3}><div className="cli-empty-box"><Layers size={24} /><strong>Sem alocações registadas.</strong></div></td></tr>
              ) : alocacoes.map((a, i) => {
                const Icone = ICONE_ALOCACAO[a.tipo_alocacao] || Tag;
                return (
                  <tr key={a.id} style={{ animationDelay: `${i * 35}ms` }}>
                    <td>{a.num_parcela}/{pagamento.total_parcelas}</td>
                    <td><span className={`cli-chip ${TOM_ALOCACAO[a.tipo_alocacao] ?? "is-cinza"}`}><Icone size={13} /> {a.tipo_alocacao}</span></td>
                    <td><strong>{formatarMT(a.valor_alocado)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
            {alocacoes.length ? (
              <tfoot>
                <tr className="pag-alocacao-total"><th colSpan={2}>Total</th><td>{formatarMT(pagamento.valor_pago)}</td></tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>

      {estorno ? (
        <EstornoPagamento
          pagamento={pagamento}
          carteira={carteira}
          utilizador={usuario}
          onFechar={() => setEstorno(false)}
          onConcluido={(p) => {
            setEstorno(false);
            setVersao((v) => v + 1);
            setAviso({ erro: false, texto: `Pagamento ${p.numero_recibo} estornado com sucesso.` });
          }}
        />
      ) : null}

      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar pagamento"
          nome={`${pagamento.numero_recibo} · ${formatarMT(pagamento.valor_pago)}`}
          aviso={pagamento.status === "Confirmado" ? "O valor sai da carteira e as parcelas e o saldo do empréstimo voltam ao estado anterior." : "O registo do pagamento será removido do histórico."}
          onCancelar={() => setAEliminar(false)}
          onConfirmar={() => {
            eliminarPagamento(pagamento.id, usuario);
            navigate("/imperial/dashboard/pagamentos");
          }}
        />
      ) : null}

      {aviso ? createPortal(
        <div className="cli-modal-fundo" role="presentation">
          <div className={`cli-modal cli-modal-mensagem${aviso.erro ? " cli-modal-perigo" : ""}`} role="dialog" aria-modal="true">
            <span className="cli-modal-icone">{aviso.erro ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}</span>
            <p>{aviso.erro ? "Não foi possível concluir" : "Operação concluída"}</p>
            <h2>{aviso.texto}</h2>
            <button type="button" className="cli-btn" onClick={() => setAviso(null)}>Continuar</button>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default PagamentoDetalhe;
