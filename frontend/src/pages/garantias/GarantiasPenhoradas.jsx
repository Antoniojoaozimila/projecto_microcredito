import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, BellRing, CalendarDays, CheckCircle2, CircleDollarSign, Eye, FileText, Gavel, Lock, LockOpen, Search, Shield, ShieldAlert,
  User, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ModalAccaoGarantia from "./ModalAccaoGarantia";
import DiasAtraso from "./DiasAtraso";
import { configAccao } from "./accoesGarantia";
import { ChipData, ChipMT, ChipTipoGarantia } from "./ChipsGarantia";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { garantiasDetalhadas, podeLibertar, podePenhorar, requisitosExecucao } from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const CelulaCliente = ({ g }) => (
  <span className="pag-cliente-celula">
    <AvatarCliente cliente={g.cliente} tamanho={32} />
    <span>
      <strong>{g.cliente?.nome_completo || "Cliente removido"}</strong>
      <small>{g.codigo_garantia} · {g.emprestimo?.numero_contrato || "—"}</small>
    </span>
  </span>
);

const Vazio = ({ icone: Icone, titulo, texto, colunas }) => (
  <tr className="cli-empty">
    <td colSpan={colunas}>
      <div className="cli-empty-box"><Icone size={28} /><strong>{titulo}</strong><span>{texto}</span></div>
    </td>
  </tr>
);

const GarantiasPenhoradas = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [accao, setAccao] = useState(null);
  const [aviso, setAviso] = useState("");
  const todas = useMemo(() => (versao >= 0 ? garantiasDetalhadas() : []), [versao]);

  const filtrar = (lista) => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((g) => [g.codigo_garantia, g.cliente?.nome_completo, g.emprestimo?.numero_contrato].join(" ").toLowerCase().includes(q));
  };
  const penhoradas = filtrar(todas.filter((g) => g.status === "Penhorada")).sort((a, b) => b.dias_atraso - a.dias_atraso);
  const elegiveis = filtrar(todas.filter((g) => podePenhorar(g, g.emprestimo))).sort((a, b) => b.dias_atraso - a.dias_atraso);
  const todasPenhoradas = todas.filter((g) => g.status === "Penhorada");
  const kpis = {
    total: todasPenhoradas.length,
    valor: todasPenhoradas.reduce((s, g) => s + g.valor, 0),
    notificadas: todasPenhoradas.filter((g) => g.notificacao).length,
    prontas: todasPenhoradas.filter((g) => requisitosExecucao(g, g.emprestimo).pronta).length,
  };
  const config = accao ? configAccao(accao.tipo, accao.garantia, usuario) : null;

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Lock size={16} /> Garantias penhoradas</span>
          <span className="cli-pill"><ShieldAlert size={16} /> {elegiveis.length} elegíve{elegiveis.length === 1 ? "l" : "is"} para penhora</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/microcredito/dashboard/garantias/execucao")}><Gavel size={16} /> Execução de garantias</button>
        </div>
      </header>

      <div className="pag-kpis">
        <div className="pag-kpi is-vermelho"><span className="pag-kpi-icone"><Lock size={20} /></span><span><small>Penhoradas</small><strong>{kpis.total}</strong><em>empréstimos em atraso</em></span></div>
        <div className="pag-kpi is-azul" style={{ animationDelay: "60ms" }}><span className="pag-kpi-icone"><CircleDollarSign size={20} /></span><span><small>Valor penhorado</small><strong>{formatarMT(kpis.valor)}</strong><em>soma das garantias</em></span></div>
        <div className="pag-kpi is-amarelo" style={{ animationDelay: "120ms" }}><span className="pag-kpi-icone"><BellRing size={20} /></span><span><small>Notificadas</small><strong>{kpis.notificadas}/{kpis.total}</strong><em>notificação formal enviada</em></span></div>
        <div className="pag-kpi" style={{ animationDelay: "180ms" }}><span className="pag-kpi-icone"><Gavel size={20} /></span><span><small>Prontas para execução</small><strong>{kpis.prontas}</strong><em>requisitos cumpridos</em></span></div>
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar código, contrato ou cliente" />
        </label>
      </section>

      <section className="cli-section gar-seccao-tabela">
        <h2><Lock size={18} /> Garantias penhoradas</h2>
        <div className="cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><User size={14} /> Cliente</span></th>
                <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
                <th><span className="cli-th"><Wallet size={14} /> Saldo devedor</span></th>
                <th><span className="cli-th"><CalendarDays size={14} /> Atraso</span></th>
                <th><span className="cli-th"><BellRing size={14} /> Notificação</span></th>
                <th><span className="cli-th"><Lock size={14} /> Penhorada em</span></th>
                <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
              </tr>
            </thead>
            <tbody key={`p-${versao}`}>
              {penhoradas.length === 0 ? (
                <Vazio icone={Shield} colunas={7} titulo="Nenhuma garantia penhorada." texto="As garantias são penhoradas quando o empréstimo entra em atraso." />
              ) : penhoradas.map((g, i) => {
                const r = requisitosExecucao(g, g.emprestimo);
                return (
                  <tr key={g.id} style={{ animationDelay: `${i * 35}ms` }}>
                    <td><CelulaCliente g={g} /></td>
                    <td><ChipMT valor={g.valor} tom="is-azul" /></td>
                    <td><ChipMT valor={g.emprestimo?.saldo_devedor} icone={Wallet} tom="is-cinza" /></td>
                    <td><DiasAtraso dias={g.dias_atraso} /></td>
                    <td>
                      {g.notificacao
                        ? <span className="cli-chip"><BadgeCheck size={13} /> {g.notificacao.meio} · {new Date(g.notificacao.data).toLocaleDateString("pt-PT")}</span>
                        : <span className="cli-chip is-amarelo"><AlertTriangle size={13} /> Por notificar</span>}
                    </td>
                    <td><ChipData data={g.data_penhor} tom="is-vermelho" /></td>
                    <td>
                      <span className="pag-accoes">
                        <button type="button" title="Ver garantia" onClick={() => navigate(`/microcredito/dashboard/garantias/${g.id}`)}><Eye size={15} /></button>
                        <button type="button" className="is-alerta" title="Notificar cliente" onClick={() => setAccao({ tipo: "notificar", garantia: g })}><BellRing size={15} /></button>
                        {podeLibertar(g, g.emprestimo) ? (
                          <button type="button" title="Libertar (cliente regularizou)" onClick={() => setAccao({ tipo: "libertar", garantia: g })}><LockOpen size={15} /></button>
                        ) : null}
                        <button type="button" className="is-perigo" title={r.pronta ? "Executar garantia" : "Requisitos de execução em falta"} disabled={!r.pronta} onClick={() => setAccao({ tipo: "executar", garantia: g })}><Gavel size={15} /></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cli-section gar-seccao-tabela">
        <h2><ShieldAlert size={18} /> Activas com empréstimo em atraso</h2>
        <p className="emp-nota"><AlertTriangle size={15} /> A penhora só é possível após o desembolso e com o empréstimo em atraso.</p>
        <div className="cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><User size={14} /> Cliente</span></th>
                <th><span className="cli-th"><Shield size={14} /> Tipo</span></th>
                <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
                <th><span className="cli-th"><AlertTriangle size={14} /> Multa</span></th>
                <th><span className="cli-th"><CalendarDays size={14} /> Atraso</span></th>
                <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
              </tr>
            </thead>
            <tbody key={`e-${versao}`}>
              {elegiveis.length === 0 ? (
                <Vazio icone={CheckCircle2} colunas={6} titulo="Nenhuma garantia a penhorar." texto="Todos os empréstimos com garantia activa estão em dia." />
              ) : elegiveis.map((g, i) => (
                <tr key={g.id} style={{ animationDelay: `${i * 35}ms` }}>
                  <td><CelulaCliente g={g} /></td>
                  <td><ChipTipoGarantia tipo={g.tipo_garantia} subtipo={g.subtipo_garantia} /></td>
                  <td><ChipMT valor={g.valor} tom="is-azul" /></td>
                  <td><ChipMT valor={g.emprestimo?.multa} icone={AlertTriangle} tom="is-vermelho" /></td>
                  <td><DiasAtraso dias={g.dias_atraso} /></td>
                  <td>
                    <span className="pag-accoes">
                      <button type="button" title="Ver empréstimo" onClick={() => navigate(`/microcredito/dashboard/emprestimos/${g.loan_id}`)}><FileText size={15} /></button>
                      <button type="button" className="is-perigo" title="Penhorar garantia" onClick={() => setAccao({ tipo: "penhorar", garantia: g })}><Lock size={15} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {config ? (
        <ModalAccaoGarantia
          {...config}
          onFechar={() => setAccao(null)}
          onConfirmar={(valores) => {
            config.executar(valores);
            setAccao(null);
            setVersao((v) => v + 1);
            setAviso(config.sucesso);
          }}
        />
      ) : null}

      {aviso ? createPortal(
        <div className="cli-modal-fundo" role="presentation">
          <div className="cli-modal cli-modal-mensagem" role="dialog" aria-modal="true">
            <span className="cli-modal-icone"><CheckCircle2 size={32} /></span>
            <p>Operação concluída</p>
            <h2>{aviso}</h2>
            <button type="button" className="cli-btn" onClick={() => setAviso("")}>Continuar</button>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default GarantiasPenhoradas;
