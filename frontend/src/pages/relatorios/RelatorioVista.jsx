import { useContext, useMemo, useState } from "react";
import {
  BadgeCheck, BarChart3, CalendarDays, CircleDollarSign, Download, FileSpreadsheet, FileText, Hash, Scale, TrendingUp, User, Users, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Kpi, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { paginar } from "../comum/utilModulo";
import { formatarMT, listarCarteiras } from "../../services/emprestimosMicrocredito";
import { inicioDoMes } from "../../services/carteirasMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import { listarCobradores, listarZonas } from "../../services/cobrancasMicrocredito";
import { FORMAS_PAGAMENTO } from "../../services/pagamentosMicrocredito";
import { PERFIS } from "../../services/clientesMicrocredito";
import { montarRelatorio, registarRelatorio } from "../../services/relatoriosMicrocredito";
import { exportarRelatorio } from "./exportarFicheiro";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "../comum/Modulo.css";
import "./Relatorios.css";

const POR = 10;
const COLUNAS_ETIQUETA = new Set(["Estado", "Carteira", "Tipo", "Perfil", "Forma"]);
const RELATORIOS_MOEDA = new Set(["Financeiro", "Performance", "Carteiras", "Pagamentos", "Cobranças", "Garantias"]);

const tomEtiqueta = (coluna, valor) => {
  const texto = String(valor || "");
  if (["Em Atraso", "Vencido", "Inativa", "Inativo", "Suspenso", "Bloqueada", "Encerrada", "Cancelado"].includes(texto)) return "is-vermelho";
  if (["Pendente", "Em Avaliação"].includes(texto)) return "is-amarelo";
  if (coluna === "Carteira" || coluna === "Forma") return "is-ciano";
  if (coluna === "Tipo" || coluna === "Perfil") return "is-roxo";
  return "";
};
const ICONES_KPI = [CircleDollarSign, Wallet, Scale, TrendingUp];
const ICONES_COL = {
  Contrato: Hash, Cliente: User, Data: CalendarDays, Emprestado: CircleDollarSign, Pago: Wallet, Saldo: Scale, Estado: BadgeCheck,
  Parcela: Hash, Vencimento: CalendarDays, Dias: CalendarDays, Zona: Users, Cobrador: User, Agendas: CalendarDays, Comissão: CircleDollarSign,
  Taxa: TrendingUp, Perfil: BadgeCheck, Score: TrendingUp, Registo: CalendarDays, Carteira: Wallet, Tipo: FileText, Recibo: Hash, Forma: Wallet, Valor: CircleDollarSign,
  Código: Hash, Telefone: User,
};

const isoDe = (data) => data.toISOString().slice(0, 10);
const periodoDe = (id) => {
  const hoje = new Date(`${hojeIso()}T00:00:00`);
  if (id === "hoje") return [hojeIso(), hojeIso()];
  if (id === "ontem") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 1);
    return [isoDe(d), isoDe(d)];
  }
  if (id === "7") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 6);
    return [isoDe(d), hojeIso()];
  }
  if (id === "mes") return [inicioDoMes(), hojeIso()];
  if (id === "passado") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return [isoDe(inicio), isoDe(fim)];
  }
  return [`${hojeIso().slice(0, 4)}-01-01`, hojeIso()];
};

const RelatorioVista = ({ tipo }) => {
  const { usuario } = useContext(AuthContext);
  const [de, setDe] = useState(inicioDoMes());
  const [ate, setAte] = useState(hojeIso());
  const [rapido, setRapido] = useState("mes");
  const [zonaId, setZonaId] = useState("");
  const [cobradorId, setCobradorId] = useState("");
  const [carteiraId, setCarteiraId] = useState("");
  const [perfil, setPerfil] = useState("");
  const [status, setStatus] = useState("");
  const [forma, setForma] = useState("");
  const [graficos, setGraficos] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aExportar, setAExportar] = useState("");

  const zonas = useMemo(() => listarZonas(), []);
  const cobradores = useMemo(() => listarCobradores(), []);
  const carteiras = useMemo(() => listarCarteiras(), []);
  const vista = useMemo(
    () => montarRelatorio(tipo, { de, ate, zonaId, cobradorId, carteiraId, perfil, status, forma }),
    [tipo, de, ate, zonaId, cobradorId, carteiraId, perfil, status, forma],
  );
  const page = paginar(vista.linhas, pagina, POR);
  const maximo = Math.max(...(vista.grafico || []).map((s) => Number(s.valor) || 0), 1);
  const emMoeda = RELATORIOS_MOEDA.has(tipo);
  const textoGrafico = (valor) => (emMoeda ? formatarMT(valor) : valor);

  const aplicarRapido = (id) => {
    setRapido(id);
    const [a, b] = periodoDe(id);
    setDe(a);
    setAte(b);
    setPagina(1);
  };

  const exportar = async (formato) => {
    if (ate < de) {
      setAviso({ erro: true, texto: "A data final tem de ser posterior à data inicial." });
      return;
    }
    setAExportar(formato);
    try {
      const tamanho = await exportarRelatorio(vista, formato);
      const gerado = registarRelatorio({ tipo, nome: vista.titulo, formato, filtros: { de, ate, zonaId, cobradorId, carteiraId, perfil, status, forma }, tamanho }, usuario);
      setAviso({ texto: `Relatório ${gerado.codigo_relatorio} gerado com sucesso!`, detalhe: `O ficheiro ${formato} foi descarregado.` });
    } catch (e) {
      setAviso({ erro: true, texto: e.message || "Não foi possível gerar o relatório." });
    } finally {
      setAExportar("");
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><BarChart3 size={16} /> {vista.titulo}</span>
          <span className="cli-pill"><CalendarDays size={16} /> {vista.periodo}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" disabled={Boolean(aExportar)} onClick={() => exportar("Excel")}><FileSpreadsheet size={16} /> Excel</button>
          <button type="button" className="cli-btn-novo" disabled={Boolean(aExportar)} onClick={() => exportar("PDF")}><FileText size={16} /> PDF</button>
          <button type="button" className="cli-btn ghost" disabled={Boolean(aExportar)} onClick={() => exportar("CSV")}><Download size={16} /> CSV</button>
        </div>
      </header>

      <section className="cli-section">
        <h2><CalendarDays size={16} /> Período e filtros</h2>
        <div className="cli-grid">
          <div className="cli-field"><label>Data início</label><input type="date" value={de} onChange={(e) => { setDe(e.target.value); setRapido(""); setPagina(1); }} /></div>
          <div className="cli-field"><label>Data fim</label><input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setRapido(""); setPagina(1); }} /></div>
          <div className="cli-field">
            <label>Período rápido</label>
            <MenuSuspenso valor={rapido} onChange={aplicarRapido} placeholder="Escolher" opcoes={[
              { id: "hoje", label: "Hoje" }, { id: "ontem", label: "Ontem" }, { id: "7", label: "Últimos 7 dias" },
              { id: "mes", label: "Este mês" }, { id: "passado", label: "Mês passado" }, { id: "ano", label: "Este ano" },
            ]} />
          </div>
          {["Inadimplência", "Performance", "Clientes", "Cobranças"].includes(tipo) ? (
            <div className="cli-field">
              <label>Zona</label>
              <MenuSuspenso valor={zonaId} onChange={(v) => { setZonaId(v); setPagina(1); }} opcoes={[{ id: "", label: "Todas" }, ...zonas.map((z) => ({ id: String(z.id), label: z.nome }))]} />
            </div>
          ) : null}
          {tipo === "Performance" ? (
            <div className="cli-field">
              <label>Cobrador</label>
              <MenuSuspenso valor={cobradorId} onChange={(v) => { setCobradorId(v); setPagina(1); }} opcoes={[{ id: "", label: "Todos" }, ...cobradores.map((c) => ({ id: String(c.id), label: c.nome_completo }))]} />
            </div>
          ) : null}
          {["Financeiro", "Carteiras"].includes(tipo) ? (
            <div className="cli-field">
              <label>Carteira</label>
              <MenuSuspenso valor={carteiraId} onChange={(v) => { setCarteiraId(v); setPagina(1); }} opcoes={[{ id: "", label: "Todas" }, ...carteiras.map((c) => ({ id: String(c.id), label: c.nome }))]} />
            </div>
          ) : null}
          {tipo === "Clientes" ? (
            <div className="cli-field">
              <label>Perfil de risco</label>
              <MenuSuspenso valor={perfil} onChange={(v) => { setPerfil(v); setPagina(1); }} opcoes={[{ id: "", label: "Todos" }, ...PERFIS.map((p) => ({ id: p.id, label: p.rotulo }))]} />
            </div>
          ) : null}
          {tipo === "Empréstimos" ? (
            <div className="cli-field">
              <label>Estado</label>
              <MenuSuspenso valor={status} onChange={(v) => { setStatus(v); setPagina(1); }} opcoes={["", "Ativo", "Em Atraso", "Vencido", "Quitado", "Pendente"].map((s) => ({ id: s, label: s || "Todos" }))} />
            </div>
          ) : null}
          {tipo === "Pagamentos" ? (
            <div className="cli-field">
              <label>Forma de pagamento</label>
              <MenuSuspenso valor={forma} onChange={(v) => { setForma(v); setPagina(1); }} opcoes={[{ id: "", label: "Todas" }, ...FORMAS_PAGAMENTO.map((f) => ({ id: f, label: f }))]} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="pag-kpis">
        {vista.kpis.map((kpi, i) => (
          <Kpi key={kpi.rotulo} icone={ICONES_KPI[i % ICONES_KPI.length]} rotulo={kpi.rotulo} valor={kpi.valor} detalhe={kpi.detalhe} atraso={i * 60} />
        ))}
      </div>

      <div className="rel-painel">
        <section className="cli-section">
          <h2><BarChart3 size={16} /> {vista.graficoTitulo || "Diagrama"}</h2>
          <button type="button" className={`cfg-switch${graficos ? " is-on" : ""}`} onClick={() => setGraficos((v) => !v)}><i /><span>Incluir gráficos</span></button>
          {graficos ? (
            <div className="rel-barras" style={{ marginTop: 14 }}>
              {(vista.grafico || []).length ? vista.grafico.map((s) => (
                <div className="rel-barra" key={s.nome}>
                  <span>{s.nome}</span>
                  <div className="rel-trilho"><i style={{ "--w": `${Math.max(4, (Number(s.valor) / maximo) * 100)}%` }} /></div>
                  <strong>{textoGrafico(s.valor)}</strong>
                </div>
              )) : <Vazio icone={BarChart3} titulo="Sem diagrama" texto="Não há valores neste período." />}
            </div>
          ) : null}
          {vista.extra ? <p className="cli-modal-texto">{vista.extra}</p> : null}
        </section>
        <section className="cli-section">
          <h2><FileText size={16} /> Leitura rápida</h2>
          <p>{vista.linhas.length} linha{vista.linhas.length === 1 ? "" : "s"} no detalhe. O PDF leva o logótipo no topo, no mesmo desenho do recibo. O Excel abre num painel verde com o diagrama e a folha de dados.</p>
        </section>
      </div>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              {vista.colunas.map((coluna) => {
                const Icone = ICONES_COL[coluna] || FileText;
                return <th key={coluna}><span className="cli-th"><Icone size={14} /> {coluna}</span></th>;
              })}
            </tr>
          </thead>
          <tbody>
            {page.itens.length ? page.itens.map((linha) => (
              <tr key={linha.id}>
                {linha.valores.map((v, i) => {
                  const coluna = vista.colunas[i];
                  return (
                    <td key={`${linha.id}-${i}`}>
                      {COLUNAS_ETIQUETA.has(coluna) ? <span className={`cli-chip rel-etiqueta ${tomEtiqueta(coluna, v)}`}>{v}</span> : v}
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr><td colSpan={vista.colunas.length}><Vazio icone={FileText} titulo="Sem linhas" texto="Não há movimentos neste período." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={vista.linhas.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default RelatorioVista;
