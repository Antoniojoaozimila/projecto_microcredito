import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, CalendarDays, CircleDollarSign, Eye, FileText, History, Search, User, UserRound, Wallet } from "lucide-react";
import AvatarCliente from "../clientes/AvatarCliente";
import { Filtro, Kpi, Paginacao, Vazio } from "../comum/ElementosModulo";
import { paginar, percentagem, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipData, ChipItem, ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import { ESTADOS_ITEM, historicoCobrancas, relatorioPeriodo } from "../../services/cobrancasMicrocredito";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const POR = 12;
const inicioMes = () => `${hojeIso().slice(0, 7)}-01`;

const CobrancasHistorico = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [de, setDe] = useState(inicioMes());
  const [ate, setAte] = useState(hojeIso());
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const lista = useMemo(() => historicoCobrancas(), []);
  const relatorio = useMemo(() => relatorioPeriodo(de, ate), [de, ate]);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((i) => {
      const dia = i.data_cobranca || i.agenda?.data_agendada;
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      if (estado && i.status !== estado) return false;
      if (!q) return true;
      return [i.contrato, i.cliente?.nome_completo, i.cobrador?.nome_completo, i.zona?.nome, i.agenda?.codigo_agenda].join(" ").toLowerCase().includes(q);
    });
  }, [lista, busca, estado, de, ate]);
  const page = paginar(visiveis, pagina, POR);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><History size={16} /> Histórico de cobranças</span>
          <span className="cli-pill">{visiveis.length} registo{visiveis.length === 1 ? "" : "s"}</span>
        </div>
      </header>

      <div className="pag-kpis">
        <Kpi icone={History} rotulo="Agendas" valor={relatorio.totais.agendas} detalhe="no período" />
        <Kpi icone={History} rotulo="Esperado" valor={formatarMT(relatorio.totais.esperado)} detalhe="a cobrar" tom="is-azul" atraso={60} />
        <Kpi icone={History} rotulo="Cobrado" valor={formatarMT(relatorio.totais.cobrado)} detalhe={`${percentagem(relatorio.totais.taxa)} de sucesso`} atraso={120} />
        <Kpi icone={History} rotulo="Comissões" valor={formatarMT(relatorio.totais.comissao)} detalhe="dos cobradores" tom="is-ciano" atraso={180} />
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar cliente, contrato, cobrador ou zona" />
        </label>
        <label className="pag-data-filtro"><CalendarDays size={15} /><input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} /></label>
        <label className="pag-data-filtro"><CalendarDays size={15} /><input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} /></label>
        <Filtro icone={History} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_ITEM.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
              <th><span className="cli-th"><User size={14} /> Cliente</span></th>
              <th><span className="cli-th"><FileText size={14} /> Empréstimo</span></th>
              <th><span className="cli-th"><UserRound size={14} /> Cobrador</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Esperado</span></th>
              <th><span className="cli-th"><Wallet size={14} /> Cobrado</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody>
            {page.itens.length === 0 ? (
              <tr className="cli-empty"><td colSpan={8}><Vazio icone={History} titulo="Sem cobranças neste período." /></td></tr>
            ) : page.itens.map((i, n) => (
              <tr key={i.id} style={{ animationDelay: `${n * 30}ms` }}>
                <td><ChipData data={i.data_cobranca || i.agenda.data_agendada} /></td>
                <td>
                  <span className="pag-cliente-celula">
                    <AvatarCliente cliente={i.cliente} tamanho={32} />
                    <span>
                      <strong>{i.cliente?.nome_completo || "—"}</strong>
                      <small>{i.zona?.nome || "—"}</small>
                    </span>
                  </span>
                </td>
                <td>{i.contrato} · {i.num_parcela}/{i.total_parcelas}</td>
                <td><span className="cli-chip is-cinza"><UserRound size={12} /> {i.cobrador?.nome_completo || "—"}</span></td>
                <td><ChipValor valor={i.valor_esperado} /></td>
                <td><ChipValor valor={i.valor_cobrado} tom={i.valor_cobrado > 0 ? "" : "is-cinza"} /></td>
                <td><ChipItem estado={i.status} /></td>
                <td><span className="pag-accoes"><button type="button" onClick={() => navigate(`${CAMINHO_COB}/agenda/${i.schedule_id}`)}><Eye size={15} /></button></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
    </div>
  );
};

export default CobrancasHistorico;
