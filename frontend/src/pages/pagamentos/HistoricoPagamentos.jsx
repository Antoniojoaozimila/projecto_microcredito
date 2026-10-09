import { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Download,
  Eye, Hash, History, ListOrdered, Plus, Receipt, RotateCcw, Search, Tag, Trash2, User, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import EstornoPagamento from "./EstornoPagamento";
import { ChipEstadoPagamento, ChipForma, ChipTipo, ChipValor } from "./PilulasPagamento";
import { descarregarReciboPagamento } from "./reciboPagamento";
import { listarClientes } from "../../services/clientesMicrocredito";
import { REGRAS, formatarData, formatarMT, listarCarteiras, listarEmprestimos } from "../../services/emprestimosMicrocredito";
import {
  ESTADOS_PAGAMENTO, FORMAS_PAGAMENTO, HORAS_ESTORNO, TIPOS_PAGAMENTO, dadosDoRecibo, eliminarPagamento, hojeIso, listarPagamentos, podeEstornar,
} from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "./Pagamentos.css";

const POR_PAGINA = 10;

const Filtro = ({ icone: Icone, rotulo, valor, opcoes, aberto, onToggle, onEscolher }) => (
  <div className={`cli-drop ${aberto ? "is-open" : ""}`}>
    <button type="button" className="cli-drop-btn" onClick={onToggle}>
      <Icone size={15} />
      <span>{rotulo}</span>
      <strong>{opcoes.find((o) => o.id === valor)?.label || "Todos"}</strong>
      <ChevronDown size={14} className="cli-chevron" />
    </button>
    {aberto ? (
      <ul className="cli-drop-menu">
        {opcoes.map((op) => (
          <li key={op.id}>
            <button type="button" className={op.id === valor ? "is-active" : ""} onClick={() => onEscolher(op.id)}>{op.label}</button>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const opcoesDe = (lista, todos = "Todos") => [{ id: "", label: todos }, ...lista.map((v) => ({ id: v, label: v }))];

const HistoricoPagamentos = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [forma, setForma] = useState("");
  const [tipo, setTipo] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [estorno, setEstorno] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const pagamentos = useMemo(() => (versao >= 0 ? listarPagamentos() : []), [versao]);
  const clientes = useMemo(() => Object.fromEntries(listarClientes().map((c) => [c.id, c])), []);
  const contratos = useMemo(() => (versao >= 0 ? Object.fromEntries(listarEmprestimos().map((e) => [e.id, e.numero_contrato])) : {}), [versao]);
  const carteiras = useMemo(() => (versao >= 0 ? Object.fromEntries(listarCarteiras().map((c) => [String(c.id), c])) : {}), [versao]);

  useEffect(() => {
    const fechar = (e) => {
      if (!e.target.closest(".cli-drop")) setMenu(null);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return pagamentos.filter((p) => {
      if (estado && p.status !== estado) return false;
      if (forma && p.forma_pagamento !== forma) return false;
      if (tipo && p.tipo_pagamento !== tipo) return false;
      if (de && p.data_pagamento < de) return false;
      if (ate && p.data_pagamento > ate) return false;
      if (!q) return true;
      return [p.numero_recibo, contratos[p.loan_id], clientes[p.client_id]?.nome_completo, p.referencia_transacao].join(" ").toLowerCase().includes(q);
    });
  }, [pagamentos, busca, estado, forma, tipo, de, ate, contratos, clientes]);

  const kpis = useMemo(() => {
    const confirmados = pagamentos.filter((p) => p.status === "Confirmado");
    const hoje = confirmados.filter((p) => p.data_pagamento === hojeIso());
    return {
      total: confirmados.reduce((s, p) => s + p.valor_pago, 0),
      confirmados: confirmados.length,
      hoje: hoje.reduce((s, p) => s + p.valor_pago, 0),
      hojeN: hoje.length,
      multas: confirmados.reduce((s, p) => s + (p.valor_multa || 0), 0),
      estornados: pagamentos.filter((p) => p.status === "Estornado").length,
    };
  }, [pagamentos]);

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, totalPaginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);
  const filtrar = (definir) => (valor) => { definir(valor); setPagina(1); setMenu(null); };

  const recibo = async (pagamento, accao) => {
    try {
      await accao(dadosDoRecibo(pagamento));
    } catch {
      setAviso({ erro: true, texto: "Não foi possível gerar o recibo." });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><History size={16} /> Histórico de pagamentos</span>
          <span className="cli-pill"><Receipt size={16} /> {pagamentos.length} pagamento{pagamentos.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/microcredito/dashboard/pagamentos/registar")}>
            <Plus size={16} /> Registar pagamento
          </button>
        </div>
      </header>

      <div className="pag-kpis">
        <div className="pag-kpi"><span className="pag-kpi-icone"><Wallet size={20} /></span><span><small>Total recebido</small><strong>{formatarMT(kpis.total)}</strong><em>{kpis.confirmados} confirmado{kpis.confirmados === 1 ? "" : "s"}</em></span></div>
        <div className="pag-kpi is-azul" style={{ animationDelay: "60ms" }}><span className="pag-kpi-icone"><CalendarDays size={20} /></span><span><small>Recebido hoje</small><strong>{formatarMT(kpis.hoje)}</strong><em>{kpis.hojeN} pagamento{kpis.hojeN === 1 ? "" : "s"}</em></span></div>
        <div className="pag-kpi is-amarelo" style={{ animationDelay: "120ms" }}><span className="pag-kpi-icone"><AlertTriangle size={20} /></span><span><small>Multas cobradas</small><strong>{formatarMT(kpis.multas)}</strong><em>{REGRAS.multaDiaria}% ao dia de atraso</em></span></div>
        <div className="pag-kpi is-vermelho" style={{ animationDelay: "180ms" }}><span className="pag-kpi-icone"><RotateCcw size={20} /></span><span><small>Estornados</small><strong>{kpis.estornados}</strong><em>até {HORAS_ESTORNO}h após o registo</em></span></div>
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar recibo, contrato, cliente ou referência" />
        </label>
        <Filtro icone={BadgeCheck} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={opcoesDe(ESTADOS_PAGAMENTO)} onEscolher={filtrar(setEstado)} />
        <Filtro icone={CreditCard} rotulo="Forma" valor={forma} aberto={menu === "forma"} onToggle={() => setMenu(menu === "forma" ? null : "forma")} opcoes={opcoesDe(FORMAS_PAGAMENTO, "Todas")} onEscolher={filtrar(setForma)} />
        <Filtro icone={Receipt} rotulo="Tipo" valor={tipo} aberto={menu === "tipo"} onToggle={() => setMenu(menu === "tipo" ? null : "tipo")} opcoes={opcoesDe(TIPOS_PAGAMENTO)} onEscolher={filtrar(setTipo)} />
        <label className="pag-data-filtro"><CalendarDays size={15} /> De <input type="date" className="emp-data" value={de} max={ate || undefined} onChange={(e) => { setDe(e.target.value); setPagina(1); }} /></label>
        <label className="pag-data-filtro"><CalendarDays size={15} /> Até <input type="date" className="emp-data" value={ate} min={de || undefined} onChange={(e) => { setAte(e.target.value); setPagina(1); }} /></label>
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><Receipt size={14} /> Recibo</span></th>
              <th><span className="cli-th"><User size={14} /> Cliente</span></th>
              <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              <th><span className="cli-th"><CreditCard size={14} /> Forma</span></th>
              <th><span className="cli-th"><Tag size={14} /> Tipo</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody key={`${actual}-${versao}`}>
            {itens.length === 0 ? (
              <tr className="cli-empty">
                <td colSpan={8}>
                  <div className="cli-empty-box">
                    <Receipt size={28} />
                    <strong>{pagamentos.length ? "Nenhum pagamento encontrado." : "Ainda não há pagamentos registados."}</strong>
                    <span>{pagamentos.length ? "Ajuste os filtros ou a pesquisa." : "Registe o primeiro pagamento."}</span>
                  </div>
                </td>
              </tr>
            ) : itens.map((p, indice) => (
              <tr key={p.id} style={{ animationDelay: `${indice * 35}ms` }}>
                <td><span className="pag-recibo-num"><Hash size={13} /> {p.numero_recibo}</span></td>
                <td>
                  <span className="pag-cliente-celula">
                    <AvatarCliente cliente={clientes[p.client_id]} tamanho={32} />
                    <span>
                      <strong>{clientes[p.client_id]?.nome_completo || "Cliente removido"}</strong>
                      <small>{contratos[p.loan_id] || "—"}{p.num_parcela ? ` · Parcela ${p.num_parcela}/${p.total_parcelas}` : ""}</small>
                    </span>
                  </span>
                </td>
                <td><span className="cli-cell"><CalendarDays size={14} /> {formatarData(p.data_pagamento)}{p.hora_pagamento ? ` ${p.hora_pagamento}` : ""}</span></td>
                <td>
                  <ChipValor valor={p.valor_pago} estornado={p.status === "Estornado"} />
                  {p.valor_multa > 0 ? <small className="pag-vermelho pag-multa-linha">Multa {formatarMT(p.valor_multa)}</small> : null}
                </td>
                <td><ChipForma forma={p.forma_pagamento} /></td>
                <td><ChipTipo tipo={p.tipo_pagamento} /></td>
                <td><ChipEstadoPagamento estado={p.status} /></td>
                <td>
                  <span className="pag-accoes">
                    <button type="button" title="Ver detalhes" onClick={() => navigate(`/microcredito/dashboard/pagamentos/detalhe/${p.id}`)}><Eye size={15} /></button>
                    <button type="button" title="Descarregar recibo" onClick={() => recibo(p, descarregarReciboPagamento)}><Download size={15} /></button>
                    {podeEstornar(p) ? (
                      <button type="button" className="is-alerta" title="Estornar" onClick={() => setEstorno(p)}><RotateCcw size={15} /></button>
                    ) : null}
                    <button type="button" className="is-perigo" title="Eliminar" onClick={() => setAEliminar(p)}><Trash2 size={15} /></button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visiveis.length > 0 ? (
        <footer className="cli-pager">
          <span className="cli-pill cli-pill-pequena"><ListOrdered size={15} /> {inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}</span>
          <div>
            <button type="button" disabled={actual <= 1} onClick={() => setPagina(actual - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={n === actual ? "is-active" : ""} onClick={() => setPagina(n)}>{n}</button>
            ))}
            <button type="button" disabled={actual >= totalPaginas} onClick={() => setPagina(actual + 1)} aria-label="Página seguinte"><ChevronRight size={16} /></button>
          </div>
        </footer>
      ) : null}

      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar pagamento"
          nome={`${aEliminar.numero_recibo} · ${formatarMT(aEliminar.valor_pago)}`}
          aviso={aEliminar.status === "Confirmado" ? "O valor sai da carteira e as parcelas e o saldo do empréstimo voltam ao estado anterior." : "O registo do pagamento será removido do histórico."}
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            eliminarPagamento(aEliminar.id, usuario);
            setAviso({ erro: false, texto: `Pagamento ${aEliminar.numero_recibo} eliminado.` });
            setAEliminar(null);
            setVersao((v) => v + 1);
          }}
        />
      ) : null}

      {estorno ? (
        <EstornoPagamento
          pagamento={estorno}
          carteira={carteiras[String(estorno.carteira_id)]}
          utilizador={usuario}
          onFechar={() => setEstorno(null)}
          onConcluido={(p) => {
            setEstorno(null);
            setVersao((v) => v + 1);
            setAviso({ erro: false, texto: `Pagamento ${p.numero_recibo} estornado com sucesso.` });
          }}
        />
      ) : null}

      {aviso ? createPortal(
        <div className="cli-modal-fundo" role="presentation">
          <div className="cli-modal" role="dialog" aria-modal="true">
            <span className={`cli-modal-icone${aviso.erro ? " pag-icone-erro" : ""}`}>{aviso.erro ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}</span>
            <p>{aviso.erro ? "Não foi possível concluir" : "Operação concluída"}</p>
            <h2>{aviso.texto}</h2>
            <div className="cli-modal-accoes">
              <button type="button" className="cli-btn" onClick={() => setAviso(null)}>Continuar</button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default HistoricoPagamentos;
