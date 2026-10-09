import { useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Navigation, Plus, Sparkles } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Kpi, Vazio } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { ChipAgenda, ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import { cobradorDoUtilizador, gerarAgendasDoDia, lerCoordenadas, listarAgendas, listarCobradores, listarZonas, taxaSucesso } from "../../services/cobrancasMicrocredito";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const CobrancasRota = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const cobrador = useMemo(() => cobradorDoUtilizador(usuario), [usuario]);
  const hoje = hojeIso();
  const agendas = useMemo(() => {
    const todas = listarAgendas().filter((a) => a.data_agendada === hoje && a.status !== "Cancelada");
    return cobrador ? todas.filter((a) => String(a.collector_id) === String(cobrador.id)) : todas;
  }, [cobrador, hoje]);
  const zonas = useMemo(() => listarZonas(), []);
  const cobradores = useMemo(() => Object.fromEntries(listarCobradores().map((c) => [String(c.id), c])), []);
  const mapaZonas = useMemo(() => Object.fromEntries(zonas.map((z) => [String(z.id), z])), [zonas]);
  const pontos = useMemo(() => zonas.map((z) => {
    const c = lerCoordenadas(z.coordenadas_centro);
    return c ? { ...c, titulo: z.nome, texto: z.codigo, raio: z.raio_km, cor: "#4AAC05" } : null;
  }).filter(Boolean), [zonas]);

  useEffect(() => {
    if (agendas.length === 1) navigate(`${CAMINHO_COB}/agenda/${agendas[0].id}`, { replace: true });
  }, [agendas, navigate]);

  if (agendas.length === 1) return null;

  const gerar = () => {
    const { criadas } = gerarAgendasDoDia(hoje, usuario);
    if (criadas[0]) navigate(`${CAMINHO_COB}/agenda/${criadas[0].id}`);
    else navigate(`${CAMINHO_COB}/agenda/nova`);
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Navigation size={16} /> Rota de cobrança</span>
          <span className="cli-pill">{formatarData(hoje)}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={gerar}><Sparkles size={16} /> Gerar rotas do dia</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/agenda/nova`)}><Plus size={16} /> Nova agenda</button>
        </div>
      </header>

      <div className="pag-kpis is-3">
        <Kpi icone={CalendarDays} rotulo="Rotas de hoje" valor={agendas.length} detalhe={cobrador ? cobrador.nome_completo : "todas as zonas"} />
        <Kpi icone={MapPin} rotulo="Esperado" valor={formatarMT(agendas.reduce((s, a) => s + Number(a.total_esperado || 0), 0))} detalhe="a cobrar hoje" tom="is-azul" atraso={60} />
        <Kpi icone={MapPin} rotulo="Cobrado" valor={formatarMT(agendas.reduce((s, a) => s + Number(a.total_cobrado || 0), 0))} detalhe={`${Math.round(taxaSucesso(agendas.reduce((s, a) => s + Number(a.total_cobrado || 0), 0), agendas.reduce((s, a) => s + Number(a.total_esperado || 0), 0)))}%`} atraso={120} />
      </div>

      <section className="cli-section cob-mapa-hero">
        <h2><Navigation size={18} /> Mapa em tempo real</h2>
        <div className="mod-mapa-caixa">
          <MapaLeaflet pontos={pontos} altura={340} aoVivo />
        </div>
      </section>

      {agendas.length === 0 ? (
        <section className="cli-section">
          <Vazio icone={Navigation} titulo="Não há rota para hoje." texto={cobrador ? "Ainda não foi gerada uma agenda para o seu território." : "Crie uma agenda ou gere automaticamente as rotas do dia."}>
            <div className="mod-form-acoes">
              <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/agenda/nova`)}>Nova agenda</button>
              <button type="button" className="cli-btn ghost" onClick={gerar}><Sparkles size={16} /> Gerar rotas do dia</button>
            </div>
          </Vazio>
        </section>
      ) : (
        <div className="mod-cartoes">
          {agendas.map((a, i) => (
            <article key={a.id} className="mod-cartao" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="mod-cartao-topo">
                <span className="mod-cartao-icone"><Navigation size={22} /></span>
                <span>
                  <h3>{a.codigo_agenda}</h3>
                  <small>{mapaZonas[String(a.zona_id)]?.nome} · {cobradores[String(a.collector_id)]?.nome_completo}</small>
                </span>
                <ChipAgenda estado={a.status} />
              </div>
              <ul className="mod-cartao-meta">
                <li><span>Clientes</span><strong>{a.total_clientes}</strong></li>
                <li><span>Esperado</span><ChipValor valor={a.total_esperado} /></li>
                <li><span>Cobrado</span><ChipValor valor={a.total_cobrado} tom="" /></li>
              </ul>
              <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/agenda/${a.id}`)}>Abrir rota</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default CobrancasRota;
