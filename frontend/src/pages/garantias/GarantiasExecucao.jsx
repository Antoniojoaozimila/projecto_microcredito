import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck, BellRing, CalendarDays, CheckCircle2, Circle, CircleDollarSign, Eye, FileText, Gavel, History, Hourglass, Lock, Scale, User,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ModalAccaoGarantia from "./ModalAccaoGarantia";
import DiasAtraso from "./DiasAtraso";
import { ChipData, ChipMT } from "./ChipsGarantia";
import { configAccao } from "./accoesGarantia";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { REGRAS_GARANTIA, garantiasDetalhadas, requisitosExecucao } from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const Requisito = ({ ok, children }) => (
  <li className={ok ? "is-ok" : "is-falta"}>
    {ok ? <BadgeCheck size={15} /> : <Circle size={15} />}
    <span>{children}</span>
  </li>
);

const GarantiasExecucao = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [accao, setAccao] = useState(null);
  const [aviso, setAviso] = useState("");
  const todas = useMemo(() => (versao >= 0 ? garantiasDetalhadas() : []), [versao]);

  const penhoradas = todas
    .filter((g) => g.status === "Penhorada")
    .map((g) => ({ ...g, requisitos: requisitosExecucao(g, g.emprestimo) }))
    .sort((a, b) => Number(b.requisitos.pronta) - Number(a.requisitos.pronta) || b.dias_atraso - a.dias_atraso);
  const executadas = todas.filter((g) => g.status === "Executada").sort((a, b) => String(b.data_execucao).localeCompare(String(a.data_execucao)));
  const kpis = {
    prontas: penhoradas.filter((g) => g.requisitos.pronta).length,
    aguardar: penhoradas.filter((g) => !g.requisitos.diasOk).length,
    semNotificacao: penhoradas.filter((g) => g.requisitos.diasOk && !g.requisitos.notificado).length,
    recuperado: executadas.reduce((s, g) => s + Number(g.valor_recuperado || 0), 0),
  };
  const config = accao ? configAccao(accao.tipo, accao.garantia, usuario) : null;

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Gavel size={16} /> Execução de garantias</span>
          <span className="cli-pill"><CalendarDays size={16} /> Após {REGRAS_GARANTIA.diasExecucao} dias de atraso</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={() => navigate("/imperial/dashboard/garantias/penhoradas")}><Lock size={16} /> Penhoradas</button>
        </div>
      </header>

      <div className="pag-kpis">
        <div className="pag-kpi is-vermelho"><span className="pag-kpi-icone"><Gavel size={20} /></span><span><small>Prontas para execução</small><strong>{kpis.prontas}</strong><em>todos os requisitos cumpridos</em></span></div>
        <div className="pag-kpi is-amarelo" style={{ animationDelay: "60ms" }}><span className="pag-kpi-icone"><BellRing size={20} /></span><span><small>Falta notificação</small><strong>{kpis.semNotificacao}</strong><em>prazo cumprido</em></span></div>
        <div className="pag-kpi is-azul" style={{ animationDelay: "120ms" }}><span className="pag-kpi-icone"><Hourglass size={20} /></span><span><small>Dentro do prazo</small><strong>{kpis.aguardar}</strong><em>menos de {REGRAS_GARANTIA.diasExecucao} dias</em></span></div>
        <div className="pag-kpi" style={{ animationDelay: "180ms" }}><span className="pag-kpi-icone"><CircleDollarSign size={20} /></span><span><small>Valor recuperado</small><strong>{formatarMT(kpis.recuperado)}</strong><em>{executadas.length} executada{executadas.length === 1 ? "" : "s"}</em></span></div>
      </div>

      <section className="cli-section">
        <h2><Scale size={18} /> Processos de execução</h2>
        {penhoradas.length === 0 ? (
          <div className="cli-empty-box"><Lock size={28} /><strong>Nenhuma garantia penhorada.</strong><span>Só as garantias penhoradas podem ser executadas.</span></div>
        ) : (
          <div className="gar-processos">
            {penhoradas.map((g, i) => {
              const r = g.requisitos;
              return (
                <article key={g.id} className={`gar-processo${r.pronta ? " is-pronta" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                  <header>
                    <AvatarCliente cliente={g.cliente} tamanho={38} />
                    <span>
                      <strong>{g.cliente?.nome_completo || "Cliente removido"}</strong>
                      <small>{g.codigo_garantia} · {g.emprestimo?.numero_contrato || "—"}</small>
                    </span>
                    <ChipMT valor={g.valor} tom="is-azul" />
                  </header>
                  <DiasAtraso dias={r.dias} />
                  <ul className="gar-checklist">
                    <Requisito ok>Garantia penhorada em {formatarData(g.data_penhor)}</Requisito>
                    <Requisito ok={r.diasOk}>
                      {r.diasOk ? `${r.dias} dias de atraso` : `Faltam ${REGRAS_GARANTIA.diasExecucao - r.dias} dia(s) para os ${REGRAS_GARANTIA.diasExecucao} dias`}
                    </Requisito>
                    <Requisito ok={r.notificado}>
                      {r.notificado ? `Notificado por ${g.notificacao.meio} em ${new Date(g.notificacao.data).toLocaleDateString("pt-PT")}` : "Notificação formal ao cliente"}
                    </Requisito>
                  </ul>
                  <footer>
                    <button type="button" className="cli-btn-voltar" onClick={() => navigate(`/imperial/dashboard/garantias/${g.id}`)}><Eye size={15} /> Ver</button>
                    {!r.notificado ? (
                      <button type="button" className="cli-btn-io" onClick={() => setAccao({ tipo: "notificar", garantia: g })}><BellRing size={15} /> Notificar</button>
                    ) : null}
                    <button type="button" className="cli-btn-novo gar-btn-executar" disabled={!r.pronta} onClick={() => setAccao({ tipo: "executar", garantia: g })}><Gavel size={15} /> Executar</button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="cli-section gar-seccao-tabela">
        <h2><History size={18} /> Garantias executadas</h2>
        <div className="cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><User size={14} /> Cliente</span></th>
                <th><span className="cli-th"><CalendarDays size={14} /> Execução</span></th>
                <th><span className="cli-th"><FileText size={14} /> Motivo</span></th>
                <th><span className="cli-th"><CircleDollarSign size={14} /> Valor da garantia</span></th>
                <th><span className="cli-th"><CheckCircle2 size={14} /> Recuperado</span></th>
                <th><span className="cli-th"><Eye size={14} /> Ver</span></th>
              </tr>
            </thead>
            <tbody>
              {executadas.length === 0 ? (
                <tr className="cli-empty">
                  <td colSpan={6}><div className="cli-empty-box"><Gavel size={28} /><strong>Nenhuma garantia executada.</strong><span>O histórico de execuções aparece aqui.</span></div></td>
                </tr>
              ) : executadas.map((g, i) => (
                <tr key={g.id} style={{ animationDelay: `${i * 35}ms` }}>
                  <td>
                    <span className="pag-cliente-celula">
                      <AvatarCliente cliente={g.cliente} tamanho={32} />
                      <span><strong>{g.cliente?.nome_completo || "Cliente removido"}</strong><small>{g.codigo_garantia} · {g.emprestimo?.numero_contrato || "—"}</small></span>
                    </span>
                  </td>
                  <td><ChipData data={g.data_execucao} tom="is-roxo" /></td>
                  <td className="gar-motivo">{g.motivo_execucao}</td>
                  <td><ChipMT valor={g.valor} tom="is-azul" /></td>
                  <td>{g.valor_recuperado != null ? <ChipMT valor={g.valor_recuperado} icone={CheckCircle2} /> : <span className="cli-chip is-cinza">Não indicado</span>}</td>
                  <td><span className="pag-accoes"><button type="button" title="Ver garantia" onClick={() => navigate(`/imperial/dashboard/garantias/${g.id}`)}><Eye size={15} /></button></span></td>
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

export default GarantiasExecucao;
