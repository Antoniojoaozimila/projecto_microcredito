import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Ban, CalendarClock, CalendarDays,   CheckCircle2, CircleDollarSign, CreditCard,
  Download, Eye, FileText, Gauge, Hash, History, Layers, Percent, Plus, Receipt, Shield, Stamp, StickyNote, TrendingUp, User, UserCheck, Wallet, XCircle,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { obterCliente } from "../../services/clientesMicrocredito";
import {
  SEM_GARANTIA, aprovarEmprestimo, calcularMapaOperacao, periodoTaxa, rotuloJuros, cancelarEmprestimo, classeEstado, formatarData, formatarMT, listarCarteiras, obterEmprestimo, rejeitarEmprestimo,
} from "../../services/emprestimosMicrocredito";
import { descarregarContrato, descarregarRecibo } from "./reciboEmprestimo";
import { descarregarReciboPagamento } from "../pagamentos/reciboPagamento";
import { classeEstadoPagamento, dadosDoRecibo, pagamentosDoEmprestimo } from "../../services/pagamentosMicrocredito";
import { REGRAS_GARANTIA, garantiasDoEmprestimo, valorGarantia } from "../../services/garantiasMicrocredito";
import EstadoGarantia from "../garantias/EstadoGarantia";
import "../clientes/ClienteModulo.css";
import "./Emprestimos.css";
import "../garantias/Garantias.css";

const FASES = ["Análise", "Aprovação", "Desembolso", "Em Curso", "Concluído"];

const Item = ({ icon: Icone, rotulo, valor, indice = 0 }) => (
  <div className="cli-info" style={{ animationDelay: `${indice * 35}ms` }}>
    <span className="cli-info-icone"><Icone size={17} /></span>
    <span><small>{rotulo}</small><strong>{valor || "—"}</strong></span>
  </div>
);

const EmprestimoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [emprestimo, setEmprestimo] = useState(() => obterEmprestimo(id));
  const [mensagem, setMensagem] = useState(null);

  if (!emprestimo) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><FileText size={16} /> Empréstimo não encontrado</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/emprestimos")}><ArrowLeft size={16} /> Voltar à lista</button>
      </div>
    );
  }

  const cliente = obterCliente(emprestimo.client_id);
  const carteira = listarCarteiras().find((c) => String(c.id) === String(emprestimo.carteira_id));
  const faseIndice = FASES.indexOf(emprestimo.fase_atual);
  const pagamentos = pagamentosDoEmprestimo(emprestimo.id);
  const garantias = garantiasDoEmprestimo(emprestimo.id);
  const valorActivo = garantias.filter((g) => g.status === "Ativa").reduce((s, g) => s + valorGarantia(g), 0);
  const faltaGarantia = emprestimo.status === "Pendente" && Number(emprestimo.valor_emprestado) > REGRAS_GARANTIA.obrigatoriaAcima && valorActivo < Number(emprestimo.valor_emprestado);
  const pagas = emprestimo.parcelas.filter((p) => p.status === "Pago").length;
  const progresso = emprestimo.valor_total_receber ? Math.round((emprestimo.valor_pago / emprestimo.valor_total_receber) * 100) : 0;
  const mapa = calcularMapaOperacao(emprestimo);
  const taxaSelo = mapa.taxaSelo.toLocaleString("pt-PT");

  const executar = (accao, sucesso, detalhe) => {
    try {
      const actualizado = accao();
      setEmprestimo(obterEmprestimo(actualizado.id));
      setMensagem({ tipo: "ok", texto: sucesso, detalhe });
      if (actualizado.status === "Ativo") descarregarContrato(obterEmprestimo(actualizado.id), cliente, carteira);
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: erro.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><FileText size={16} /> {emprestimo.numero_contrato}</span>
          <span className="cli-pill"><User size={16} /> {cliente?.nome_completo || "Cliente removido"}</span>
          <span className={`emp-estado emp-estado-grande ${classeEstado(emprestimo.status)}`}>{emprestimo.status}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/emprestimos")}><ArrowLeft size={16} /> Voltar</button>
          {emprestimo.status === "Pendente" ? (
            <>
              <button type="button" className="cli-btn-voltar emp-btn-rejeitar" onClick={() => executar(() => rejeitarEmprestimo(emprestimo.id, usuario), "Empréstimo rejeitado.")}><XCircle size={16} /> Rejeitar</button>
              <button type="button" className="cli-btn-voltar" onClick={() => executar(() => cancelarEmprestimo(emprestimo.id, usuario), "Empréstimo cancelado.")}><Ban size={16} /> Cancelar</button>
              <button type="button" className="cli-btn-novo" onClick={() => executar(() => aprovarEmprestimo(emprestimo.id, usuario), "Empréstimo aprovado.", `${formatarMT(emprestimo.valor_emprestado)} debitados da carteira ${carteira?.nome || ""} e contrato gerado.`)}><BadgeCheck size={16} /> Aprovar e desembolsar</button>
            </>
          ) : null}
          {["Ativo", "Em Atraso", "Vencido"].includes(emprestimo.status) ? (
            <button type="button" className="cli-btn-novo" onClick={() => navigate(`/imperial/dashboard/pagamentos/registar?emprestimo=${emprestimo.id}`)}><CreditCard size={16} /> Registar pagamento</button>
          ) : null}
          <button type="button" className="cli-btn-io" onClick={() => descarregarRecibo(emprestimo, cliente, carteira)}><Receipt size={16} /> Recibo PDF</button>
          {emprestimo.data_aprovacao ? (
            <button type="button" className="cli-btn-io" onClick={() => descarregarContrato(emprestimo, cliente, carteira)}><Download size={16} /> Contrato PDF</button>
          ) : null}
        </div>
      </header>

      {mensagem ? createPortal(
        <div className="cli-modal-fundo" role="presentation">
          <div className={`cli-modal cli-modal-mensagem${mensagem.tipo === "erro" ? " cli-modal-perigo" : ""}`} role="dialog" aria-modal="true">
            <span className="cli-modal-icone">{mensagem.tipo === "erro" ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}</span>
            <p>{mensagem.tipo === "erro" ? "Não foi possível concluir" : "Operação concluída"}</p>
            <h2>{mensagem.texto}</h2>
            {mensagem.detalhe ? <small className="cli-modal-texto">{mensagem.detalhe}</small> : null}
            <button type="button" className="cli-btn" onClick={() => setMensagem(null)}>Continuar</button>
          </div>
        </div>,
        document.body
      ) : null}

      <section className="cli-section">
        <h2><Layers size={18} /> Fase do empréstimo</h2>
        <ol className="emp-fases">
          {FASES.map((fase, i) => (
            <li key={fase} className={`${i < faseIndice ? "is-feita" : ""}${i === faseIndice ? " is-actual" : ""}`}>
              <span>{i < faseIndice ? <BadgeCheck size={16} /> : i + 1}</span>
              {fase}
            </li>
          ))}
        </ol>
        {emprestimo.exige_gestor && emprestimo.status === "Pendente" ? (
          <p className="emp-nota"><Shield size={15} /> Este valor exige aprovação de um gestor ou administrador.</p>
        ) : null}
        {faltaGarantia ? (
          <p className="emp-nota gar-nota-alerta"><AlertTriangle size={15} /> Acima de {formatarMT(REGRAS_GARANTIA.obrigatoriaAcima)} a aprovação exige garantia activa de pelo menos {formatarMT(emprestimo.valor_emprestado)} (actual: {formatarMT(valorActivo)}).</p>
        ) : null}
        <div className="emp-progresso">
          <span><small>Pago</small><strong>{formatarMT(emprestimo.valor_pago)}</strong></span>
          <div><i style={{ width: `${progresso}%` }} /></div>
          <span><small>{progresso}% · {pagas}/{emprestimo.num_parcelas} parcelas</small><strong>{formatarMT(emprestimo.saldo_devedor)} em dívida</strong></span>
        </div>
      </section>

      <section className="cli-section">
        <h2><CircleDollarSign size={18} /> Dados do empréstimo</h2>
        <div className="cli-infos">
          {[
            { icon: CircleDollarSign, rotulo: "Valor emprestado", valor: formatarMT(emprestimo.valor_emprestado) },
            { icon: Percent, rotulo: "Taxa de juros", valor: `${emprestimo.taxa_juros}% ${periodoTaxa(emprestimo)} · ${rotuloJuros(emprestimo.tipo_juros)}` },
            { icon: Layers, rotulo: "Sistema de amortização", valor: emprestimo.sistema_amortizacao },
            { icon: CalendarClock, rotulo: "Modalidade", valor: `${emprestimo.modalidade}${emprestimo.data_primeiro_vencimento && emprestimo.dia_vencimento ? ` · 1.º vencimento ${formatarData(emprestimo.data_primeiro_vencimento)}` : emprestimo.dia_vencimento ? ` · dia ${emprestimo.dia_vencimento}` : ""}` },
            { icon: Hash, rotulo: "Parcelas", valor: `${emprestimo.num_parcelas} × ${formatarMT(emprestimo.valor_parcela)}` },
            { icon: TrendingUp, rotulo: "Total de juros", valor: formatarMT(emprestimo.valor_total_juros) },
            { icon: Wallet, rotulo: "Total a receber", valor: formatarMT(emprestimo.valor_total_receber) },
            { icon: CalendarDays, rotulo: "Início / último vencimento", valor: `${formatarData(emprestimo.data_inicio)} → ${formatarData(emprestimo.data_vencimento)}` },
            { icon: Wallet, rotulo: "Carteira de desembolso", valor: carteira ? `${carteira.nome} · saldo ${formatarMT(carteira.saldo)}` : "—" },
            { icon: Gauge, rotulo: "Score do cliente", valor: cliente ? `${cliente.score} · Perfil ${cliente.perfil_risco}` : "—" },
            { icon: Shield, rotulo: "Garantia", valor: emprestimo.garantia_tipo === SEM_GARANTIA ? emprestimo.garantia_tipo : `${emprestimo.garantia_tipo} · ${emprestimo.garantia_descricao} · ${formatarMT(emprestimo.garantia_valor)}` },
            { icon: UserCheck, rotulo: "Aprovado por", valor: emprestimo.aprovado_por ? `${emprestimo.aprovado_por} · ${new Date(emprestimo.data_aprovacao).toLocaleString("pt-PT")}` : "" },
            { icon: User, rotulo: "Criado por", valor: `${emprestimo.criado_por} · ${new Date(emprestimo.data_registo).toLocaleString("pt-PT")}` },
            { icon: StickyNote, rotulo: "Observações", valor: emprestimo.observacoes },
          ].map((item, i) => <Item key={item.rotulo} indice={i} {...item} />)}
        </div>
      </section>

      <section className="cli-section">
        <h2><TrendingUp size={18} /> Juro de mora e imposto de selo</h2>
        <p className="emp-nota emp-nota-formula">
          <AlertTriangle size={15} />
          <span>Juro de mora diário = (capital em risco + juros) × taxa do contrato / 30. Saldo a pagar com juros de mora = capital + juros + (mora diária × dias vencidos).</span>
        </p>
        <div className="cli-infos">
          {[
            { icon: Wallet, rotulo: "Capital em risco", valor: formatarMT(mapa.capital) },
            { icon: TrendingUp, rotulo: "Juros", valor: formatarMT(mapa.juros) },
            { icon: Percent, rotulo: "Taxa do contrato", valor: `${mapa.taxa}% ${periodoTaxa(emprestimo)}` },
            { icon: CalendarClock, rotulo: "Juro de mora diário", valor: formatarMT(mapa.moraDiaria) },
            { icon: CalendarDays, rotulo: "Dias vencidos", valor: String(mapa.diasVencidos) },
            { icon: AlertTriangle, rotulo: "Juro de mora acumulado", valor: formatarMT(mapa.moraAcumulada) },
            { icon: CircleDollarSign, rotulo: "Saldo a pagar com juros de mora", valor: formatarMT(mapa.saldoComMora) },
          ].map((item, i) => <Item key={item.rotulo} indice={i} {...item} />)}
        </div>
        <div className="emp-linha-selo">
          <span className="cli-info-icone"><Stamp size={17} /></span>
          <span>
            <small>Imposto de selo a pagar</small>
            <strong>{formatarMT(mapa.impostoSelo)}</strong>
          </span>
          <em>Linha separada: {taxaSelo}% do saldo com juros de mora. Não entra nesse saldo.</em>
        </div>
      </section>

      <section className="cli-section">
        <h2><CalendarDays size={18} /> Cronograma de parcelas</h2>
        <div className="cli-table-wrap">
          <table className="cli-table">
            <thead>
              <tr>
                <th><span className="cli-th"><Hash size={14} /> Nº</span></th>
                <th><span className="cli-th"><CalendarDays size={14} /> Vencimento</span></th>
                <th><span className="cli-th"><CircleDollarSign size={14} /> Parcela</span></th>
                <th><span className="cli-th"><TrendingUp size={14} /> Juros</span></th>
                <th><span className="cli-th"><Wallet size={14} /> Principal</span></th>
                <th><span className="cli-th"><Layers size={14} /> Saldo após</span></th>
                <th><span className="cli-th"><AlertTriangle size={14} /> Atraso / multa</span></th>
                <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              </tr>
            </thead>
            <tbody>
              {emprestimo.parcelas.map((p, i) => (
                <tr key={p.id} style={{ animationDelay: `${i * 25}ms` }}>
                  <td>{p.num_parcela}</td>
                  <td>{formatarData(p.data_vencimento)}</td>
                  <td>{formatarMT(p.valor_parcela)}</td>
                  <td>{formatarMT(p.valor_juros)}</td>
                  <td>{formatarMT(p.valor_principal)}</td>
                  <td>{formatarMT(p.saldo_apos_pagamento)}</td>
                  <td>{p.dias_atraso && p.status !== "Pago" ? `${p.dias_atraso} dia(s) · ${formatarMT(p.multa)}` : "—"}</td>
                  <td>
                    <span className={`emp-estado ${p.status === "Pago" ? "is-quitado" : p.status === "Atrasado" || p.status === "Parcialmente Pago" ? "is-atraso" : p.status === "Cancelado" ? "is-cancelado" : "is-pendente"}`}>{p.status}</span>
                    {p.status === "Parcialmente Pago" && p.valor_pago > 0 ? <small className="cli-suave" style={{ display: "block" }}>Pago {formatarMT(p.valor_pago)}</small> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {garantias.length || ["Pendente", "Ativo", "Em Atraso", "Vencido"].includes(emprestimo.status) ? (
        <section className="cli-section">
          <h2><Shield size={18} /> Garantias</h2>
          {garantias.length ? (
            <div className="cli-table-wrap">
              <table className="cli-table">
                <thead>
                  <tr>
                    <th><span className="cli-th"><Shield size={14} /> Código</span></th>
                    <th><span className="cli-th"><Layers size={14} /> Tipo</span></th>
                    <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
                    <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
                    <th><span className="cli-th"><Eye size={14} /> Ver</span></th>
                  </tr>
                </thead>
                <tbody>
                  {garantias.map((g, i) => (
                    <tr key={g.id} style={{ animationDelay: `${i * 25}ms` }}>
                      <td>{g.codigo_garantia}</td>
                      <td>{g.tipo_garantia}{g.subtipo_garantia ? ` · ${g.subtipo_garantia}` : ""}</td>
                      <td>{formatarMT(valorGarantia(g))}</td>
                      <td><EstadoGarantia estado={g.status} /></td>
                      <td><button type="button" className="cli-icon-btn" title="Ver garantia" onClick={() => navigate(`/imperial/dashboard/garantias/${g.id}`)}><Eye size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="cli-suave">Nenhuma garantia registada para este empréstimo.</p>}
          {["Pendente", "Ativo", "Em Atraso", "Vencido"].includes(emprestimo.status) ? (
            <button type="button" className="gar-adicionar" onClick={() => navigate(`/imperial/dashboard/garantias/nova?emprestimo=${emprestimo.id}`)}><Plus size={16} /> Registar garantia</button>
          ) : null}
        </section>
      ) : null}

      {pagamentos.length ? (
        <section className="cli-section">
          <h2><CreditCard size={18} /> Pagamentos</h2>
          <div className="cli-table-wrap">
            <table className="cli-table">
              <thead>
                <tr>
                  <th><span className="cli-th"><Receipt size={14} /> Recibo</span></th>
                  <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
                  <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
                  <th><span className="cli-th"><AlertTriangle size={14} /> Multa</span></th>
                  <th><span className="cli-th"><CreditCard size={14} /> Forma</span></th>
                  <th><span className="cli-th"><Wallet size={14} /> Saldo após</span></th>
                  <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
                  <th><span className="cli-th"><Download size={14} /> Recibo</span></th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p, i) => (
                  <tr key={p.id} style={{ animationDelay: `${i * 25}ms` }}>
                    <td>{p.numero_recibo}</td>
                    <td>{formatarData(p.data_pagamento)}{p.hora_pagamento ? ` ${p.hora_pagamento}` : ""}</td>
                    <td>{formatarMT(p.valor_pago)}</td>
                    <td>{formatarMT(p.valor_multa)}</td>
                    <td>{p.forma_pagamento}</td>
                    <td>{p.estado_emprestimo_apos === "Quitado" ? "QUITADO" : formatarMT(p.saldo_devedor_apos)}</td>
                    <td><span className={`emp-estado ${classeEstadoPagamento(p.status)}`}>{p.status}</span></td>
                    <td><button type="button" className="cli-icon-btn" title="Descarregar recibo" onClick={() => descarregarReciboPagamento(dadosDoRecibo(p))}><Download size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="cli-section">
        <h2><History size={18} /> Histórico</h2>
        <ul className="emp-historico">
          {(emprestimo.historico || []).slice().reverse().map((h, i) => (
            <li key={`${h.data}-${i}`}>
              <span />
              <div><strong>{h.accao}</strong><small>{new Date(h.data).toLocaleString("pt-PT")} · {h.por}</small></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default EmprestimoDetalhe;
