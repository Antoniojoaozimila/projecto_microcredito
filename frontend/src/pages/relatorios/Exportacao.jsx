import { useContext, useMemo, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, FileText, Mail, SlidersHorizontal } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { dataHoraCurta, paginar } from "../comum/utilModulo";
import { inicioDoMes } from "../../services/carteirasMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import { listarCarteiras } from "../../services/emprestimosMicrocredito";
import { listarCobradores, listarZonas } from "../../services/cobrancasMicrocredito";
import { PERFIS } from "../../services/clientesMicrocredito";
import { FORMAS_PAGAMENTO } from "../../services/pagamentosMicrocredito";
import { FORMATOS, TIPOS_RELATORIO, guardarAgendamento, listarAgendamentos, listarRelatoriosGerados, montarRelatorio, registarRelatorio } from "../../services/relatoriosMicrocredito";
import { exportarRelatorio } from "./exportarFicheiro";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "../comum/Modulo.css";
import "./Relatorios.css";

const POR = 8;
const vazio = () => ({
  tipo: "Financeiro",
  modelo: "",
  nome: "Relatório financeiro",
  de: inicioDoMes(),
  ate: hojeIso(),
  zonaId: "",
  cobradorId: "",
  carteiraId: "",
  status: "",
  forma: "",
  perfil: "",
  formato: "PDF",
  agrupamento: "",
  ordenacao: "Data",
  graficos: true,
  totais: true,
  detalhes: true,
  agendar: false,
  frequencia: "Mensal",
  hora_envio: "08:00",
  destinatarios: "",
});

const Exportacao = () => {
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(vazio);
  const [versao, setVersao] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aGerar, setAGerar] = useState(false);
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const historico = useMemo(() => (versao >= 0 ? listarRelatoriosGerados() : []), [versao]);
  const agendas = useMemo(() => (versao >= 0 ? listarAgendamentos() : []), [versao]);
  const page = paginar(historico, pagina, POR);
  const zonas = useMemo(() => listarZonas(), []);
  const cobradores = useMemo(() => listarCobradores(), []);
  const carteiras = useMemo(() => listarCarteiras(), []);

  const gerar = async (evento) => {
    evento.preventDefault();
    if (!form.nome.trim()) {
      setAviso({ erro: true, texto: "Dê um nome ao relatório." });
      return;
    }
    if (!form.de || !form.ate || form.ate < form.de) {
      setAviso({ erro: true, texto: "Defina um período válido. A data final tem de ser posterior à inicial." });
      return;
    }
    setAGerar(true);
    try {
      const filtros = { de: form.de, ate: form.ate, zonaId: form.zonaId, cobradorId: form.cobradorId, carteiraId: form.carteiraId, status: form.status, forma: form.forma, perfil: form.perfil };
      const vista = montarRelatorio(form.tipo, filtros);
      const linhas = [...vista.linhas];
      if (form.ordenacao === "Nome") linhas.sort((a, b) => String(a.valores[0]).localeCompare(String(b.valores[0]), "pt"));
      const apresentacao = {
        ...vista,
        titulo: form.nome.trim(),
        grafico: form.graficos ? vista.grafico : [],
        linhas: form.detalhes ? linhas : [],
        extra: form.totais ? vista.extra : "",
      };
      const tamanho = await exportarRelatorio(apresentacao, form.formato);
      const gerado = registarRelatorio({ tipo: form.tipo, nome: form.nome.trim(), formato: form.formato, filtros, tamanho }, usuario);
      if (form.agendar) guardarAgendamento({ ...form, nome: form.nome.trim() }, usuario);
      setVersao((v) => v + 1);
      setAviso({
        texto: `Relatório ${gerado.codigo_relatorio} gerado com sucesso!`,
        detalhe: form.agendar ? "O agendamento ficou registado para os destinatários indicados." : "O ficheiro foi descarregado e fica disponível durante 90 dias.",
      });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    } finally {
      setAGerar(false);
    }
  };

  const repetir = async (item) => {
    try {
      const vista = montarRelatorio(item.tipo, item.parametros || {});
      await exportarRelatorio({ ...vista, titulo: item.nome }, item.formato);
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Download size={16} /> Exportação</span>
          <span className="cli-pill">{historico.length} gerado{historico.length === 1 ? "" : "s"}</span>
        </div>
      </header>
      <form className="cli-form-entrada" onSubmit={gerar}>
        <section className="cli-section">
          <h2><FileText size={16} /> Tipo de relatório</h2>
          <div className="cli-grid">
            <Campo icon={FileText} label="Tipo de relatório">
              <MenuSuspenso valor={form.tipo} onChange={(v) => setForm((f) => ({ ...f, tipo: v, modelo: "", nome: `Relatório de ${v}` }))} opcoes={TIPOS_RELATORIO.map((t) => ({ id: t, label: t }))} />
            </Campo>
            <Campo icon={FileText} label="Modelo">
              <MenuSuspenso valor={form.modelo} onChange={(v) => setForm((f) => ({ ...f, modelo: v, ...(v ? { tipo: v, nome: `Relatório de ${v}` } : {}) }))} opcoes={[{ id: "", label: "Sem modelo" }, ...TIPOS_RELATORIO.map((t) => ({ id: t, label: `Modelo ${t}` }))]} />
            </Campo>
            <Campo icon={FileText} label="Nome do relatório" full>
              <input value={form.nome} onChange={(e) => set("nome")(e.target.value)} maxLength={200} />
            </Campo>
          </div>
        </section>
        <section className="cli-section">
          <h2><CalendarDays size={16} /> Período</h2>
          <div className="cli-grid">
            <Campo icon={CalendarDays} label="Data início"><input type="date" value={form.de} onChange={(e) => set("de")(e.target.value)} /></Campo>
            <Campo icon={CalendarDays} label="Data fim"><input type="date" value={form.ate} onChange={(e) => set("ate")(e.target.value)} /></Campo>
          </div>
        </section>
        <section className="cli-section">
          <h2><SlidersHorizontal size={16} /> Filtros</h2>
          <div className="cli-grid">
            <Campo icon={UsersIcone} label="Zona"><MenuSuspenso valor={form.zonaId} onChange={set("zonaId")} opcoes={[{ id: "", label: "Todas" }, ...zonas.map((z) => ({ id: String(z.id), label: z.nome }))]} /></Campo>
            <Campo icon={UsersIcone} label="Cobrador"><MenuSuspenso valor={form.cobradorId} onChange={set("cobradorId")} opcoes={[{ id: "", label: "Todos" }, ...cobradores.map((c) => ({ id: String(c.id), label: c.nome_completo }))]} /></Campo>
            <Campo icon={WalletIcone} label="Carteira"><MenuSuspenso valor={form.carteiraId} onChange={set("carteiraId")} opcoes={[{ id: "", label: "Todas" }, ...carteiras.map((c) => ({ id: String(c.id), label: c.nome }))]} /></Campo>
            <Campo icon={BadgeIcone} label="Perfil de risco"><MenuSuspenso valor={form.perfil} onChange={set("perfil")} opcoes={[{ id: "", label: "Todos" }, ...PERFIS.map((p) => ({ id: p.id, label: p.rotulo }))]} /></Campo>
            <Campo icon={WalletIcone} label="Forma de pagamento"><MenuSuspenso valor={form.forma} onChange={set("forma")} opcoes={[{ id: "", label: "Todas" }, ...FORMAS_PAGAMENTO.map((f) => ({ id: f, label: f }))]} /></Campo>
            <Campo icon={BadgeIcone} label="Estado"><MenuSuspenso valor={form.status} onChange={set("status")} opcoes={["", "Ativo", "Em Atraso", "Quitado", "Pendente"].map((s) => ({ id: s, label: s || "Todos" }))} /></Campo>
          </div>
        </section>
        <section className="cli-section">
          <h2><FileSpreadsheet size={16} /> Apresentação</h2>
          <div className="cli-grid">
            <Campo icon={FileSpreadsheet} label="Formato"><MenuSuspenso valor={form.formato} onChange={set("formato")} opcoes={[...FORMATOS, "JSON"].map((f) => ({ id: f, label: f }))} /></Campo>
            <Campo icon={SlidersHorizontal} label="Agrupamento"><MenuSuspenso valor={form.agrupamento} onChange={set("agrupamento")} opcoes={["", "Zona", "Cobrador", "Cliente", "Data"].map((s) => ({ id: s, label: s || "Nenhum" }))} /></Campo>
            <Campo icon={SlidersHorizontal} label="Ordenação"><MenuSuspenso valor={form.ordenacao} onChange={set("ordenacao")} opcoes={["Data", "Valor", "Nome"].map((s) => ({ id: s, label: s }))} /></Campo>
          </div>
          <div className="cfg-perm" style={{ marginTop: 12 }}>
            <button type="button" className={form.graficos ? "is-on" : ""} onClick={() => set("graficos")(!form.graficos)}>Gráficos</button>
            <button type="button" className={form.totais ? "is-on" : ""} onClick={() => set("totais")(!form.totais)}>Totais</button>
            <button type="button" className={form.detalhes ? "is-on" : ""} onClick={() => set("detalhes")(!form.detalhes)}>Detalhes</button>
          </div>
        </section>
        <section className="cli-section">
          <h2><Mail size={16} /> Envio automático</h2>
          <button type="button" className={`cfg-switch${form.agendar ? " is-on" : ""}`} onClick={() => set("agendar")(!form.agendar)}><i /><span>Agendar envio</span></button>
          {form.agendar ? (
            <div className="cli-grid" style={{ marginTop: 12 }}>
              <Campo icon={CalendarDays} label="Frequência"><MenuSuspenso valor={form.frequencia} onChange={set("frequencia")} opcoes={["Diário", "Semanal", "Mensal"].map((s) => ({ id: s, label: s }))} /></Campo>
              <Campo icon={CalendarDays} label="Hora de envio"><input type="time" value={form.hora_envio} onChange={(e) => set("hora_envio")(e.target.value)} /></Campo>
              <Campo icon={Mail} label="Destinatários" full><input value={form.destinatarios} onChange={(e) => set("destinatarios")(e.target.value)} placeholder="admin@mukuru.co.mz, gestor@mukuru.co.mz" /></Campo>
            </div>
          ) : null}
        </section>
        <div className="cli-form-accoes">
          <button type="submit" className="cli-btn" disabled={aGerar}><Download size={16} /> Gerar relatório</button>
          <button type="button" className="cli-btn ghost" onClick={() => setForm(vazio())}>Cancelar</button>
        </div>
      </form>

      <section className="cli-section">
        <h2><Download size={16} /> Relatórios gerados</h2>
        <div className="cli-card cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><HashIcone size={14} /> Código</span></th>
                <th><span className="cli-th"><FileText size={14} /> Nome</span></th>
                <th><span className="cli-th"><FileSpreadsheet size={14} /> Formato</span></th>
                <th><span className="cli-th"><CalendarDays size={14} /> Gerado</span></th>
                <th><span className="cli-th"><BadgeIcone size={14} /> Estado</span></th>
                <th><span className="cli-th"><Download size={14} /> Acção</span></th>
              </tr>
            </thead>
            <tbody>
              {page.itens.length ? page.itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo_relatorio}</td>
                  <td>{item.nome}</td>
                  <td>{item.formato}</td>
                  <td>{dataHoraCurta(item.data_geracao)}</td>
                  <td>{item.status}</td>
                  <td><button type="button" className="cli-btn-io" onClick={() => repetir(item)}><Download size={14} /> Descarregar</button></td>
                </tr>
              )) : <tr><td colSpan={6}><Vazio icone={Download} titulo="Histórico vazio" texto="Os relatórios gerados aparecem aqui durante 90 dias." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Paginacao inicio={page.inicio} porPagina={POR} total={historico.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
        {agendas.length ? <p>{agendas.length} agendamento{agendas.length === 1 ? "" : "s"} activo{agendas.length === 1 ? "" : "s"}.</p> : null}
      </section>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

const UsersIcone = SlidersHorizontal;
const WalletIcone = FileSpreadsheet;
const BadgeIcone = FileText;
const HashIcone = FileText;

export default Exportacao;
