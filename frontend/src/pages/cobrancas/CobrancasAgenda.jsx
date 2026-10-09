import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, CalendarDays, CircleDollarSign, Eye, Hash, MapPinned, Plus, Search, Sparkles, Trash2, UserRound, Users, Wallet } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import { Filtro, Kpi, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { paginar, percentagem, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipAgenda, ChipData, ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import {
  eliminarAgenda, ESTADOS_AGENDA, gerarAgendasDoDia, listarAgendas, listarCobradores, listarZonas, resumoCobrancas,
} from "../../services/cobrancasMicrocredito";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const POR = 10;

const CobrancasAgenda = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const agendas = useMemo(() => (versao >= 0 ? listarAgendas() : []), [versao]);
  const cobradores = useMemo(() => Object.fromEntries(listarCobradores().map((c) => [String(c.id), c])), [versao]);
  const zonas = useMemo(() => Object.fromEntries(listarZonas().map((z) => [String(z.id), z])), [versao]);
  const resumo = useMemo(() => resumoCobrancas(), [versao]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return agendas.filter((a) => {
      if (estado && a.status !== estado) return false;
      if (!q) return true;
      return [a.codigo_agenda, cobradores[String(a.collector_id)]?.nome_completo, zonas[String(a.zona_id)]?.nome, a.data_agendada].join(" ").toLowerCase().includes(q);
    });
  }, [agendas, busca, estado, cobradores, zonas]);
  const page = paginar(visiveis, pagina, POR);

  const gerar = () => {
    try {
      const { criadas, ignoradas } = gerarAgendasDoDia(hojeIso(), usuario);
      setVersao((v) => v + 1);
      setAviso({
        texto: criadas.length ? `${criadas.length} agenda${criadas.length === 1 ? "" : "s"} gerada${criadas.length === 1 ? "" : "s"} para hoje.` : "Nenhuma agenda nova foi gerada.",
        detalhe: ignoradas.length ? ignoradas.join(" · ") : undefined,
      });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><CalendarDays size={16} /> Agenda de cobranças</span>
          <span className="cli-pill">{agendas.length} agenda{agendas.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={gerar}><Sparkles size={16} /> Gerar agendas de hoje</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/agenda/nova`)}><Plus size={16} /> Nova agenda</button>
        </div>
      </header>

      <div className="pag-kpis">
        <Kpi icone={CalendarDays} rotulo="Hoje" valor={resumo.hoje} detalhe="rotas agendadas" />
        <Kpi icone={CalendarDays} rotulo="Em curso" valor={resumo.emCurso} detalhe="a ser executadas" tom="is-azul" atraso={60} />
        <Kpi icone={CalendarDays} rotulo="Esperado hoje" valor={formatarMT(resumo.esperadoHoje)} detalhe={`${percentagem(resumo.taxaHoje)} de sucesso`} atraso={120} />
        <Kpi icone={CalendarDays} rotulo="Cobrado hoje" valor={formatarMT(resumo.cobradoHoje)} detalhe="já registado" tom="is-ciano" atraso={180} />
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar código, cobrador ou zona" />
        </label>
        <Filtro icone={CalendarDays} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_AGENDA.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><Hash size={14} /> Código</span></th>
              <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
              <th><span className="cli-th"><UserRound size={14} /> Cobrador</span></th>
              <th><span className="cli-th"><MapPinned size={14} /> Zona</span></th>
              <th><span className="cli-th"><Users size={14} /> Clientes</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Esperado</span></th>
              <th><span className="cli-th"><Wallet size={14} /> Cobrado</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody>
            {page.itens.length === 0 ? (
              <tr className="cli-empty"><td colSpan={9}><Vazio icone={CalendarDays} titulo={agendas.length ? "Nenhuma agenda encontrada." : "Ainda não há agendas."} texto="Crie uma agenda ou gere as rotas do dia." /></td></tr>
            ) : page.itens.map((a, i) => (
              <tr key={a.id} style={{ animationDelay: `${i * 35}ms` }}>
                <td><strong>{a.codigo_agenda}</strong></td>
                <td><ChipData data={a.data_agendada} /></td>
                <td><span className="cli-chip is-cinza"><UserRound size={12} /> {cobradores[String(a.collector_id)]?.nome_completo || "—"}</span></td>
                <td><span className="cli-chip is-azul"><MapPinned size={12} /> {zonas[String(a.zona_id)]?.nome || "—"}</span></td>
                <td>{a.total_clientes}</td>
                <td><ChipValor valor={a.total_esperado} /></td>
                <td><ChipValor valor={a.total_cobrado} tom={a.total_cobrado > 0 ? "" : "is-cinza"} /></td>
                <td><ChipAgenda estado={a.status} /></td>
                <td>
                  <span className="pag-accoes">
                    <button type="button" title="Abrir" onClick={() => navigate(`${CAMINHO_COB}/agenda/${a.id}`)}><Eye size={15} /></button>
                    {["Pendente", "Cancelada"].includes(a.status) ? <button type="button" className="is-perigo" title="Eliminar" onClick={() => setAEliminar(a)}><Trash2 size={15} /></button> : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar agenda"
          nome={aEliminar.codigo_agenda}
          aviso="Os itens e a rota desta agenda serão removidos."
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            try {
              eliminarAgenda(aEliminar.id);
              setAEliminar(null);
              setVersao((v) => v + 1);
              setAviso({ texto: `Agenda ${aEliminar.codigo_agenda} eliminada.` });
            } catch (e) {
              setAEliminar(null);
              setAviso({ erro: true, texto: e.message });
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default CobrancasAgenda;
