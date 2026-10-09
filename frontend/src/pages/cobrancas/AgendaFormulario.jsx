import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronUp, MapPin, Navigation, Plus, Save, Trash2, Users } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal, ModalFormulario, Vazio } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { ligacaoGoogleMaps } from "../comum/utilModulo";
import { ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import {
  calcularRota, clientesComParcelas, cobradoresActivos, criarAgenda, formatarDuracao, lerCoordenadas, metaDaAgenda,
  origemDaZona, propostaAgenda, REGRAS_COBRANCA, validarAgenda, zonasActivas,
} from "../../services/cobrancasMicrocredito";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const AgendaFormulario = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { usuario } = useContext(AuthContext);
  const cobradores = useMemo(() => cobradoresActivos(), []);
  const zonas = useMemo(() => zonasActivas(), []);
  const [form, setForm] = useState({
    data_agendada: hojeIso(),
    hora_inicio: "08:00",
    hora_fim: "17:00",
    collector_id: params.get("cobrador") || "",
    zona_id: params.get("zona") || (cobradores.find((c) => String(c.id) === params.get("cobrador"))?.zona_id ? String(cobradores.find((c) => String(c.id) === params.get("cobrador")).zona_id) : ""),
    observacoes: "",
  });
  const [paragens, setParagens] = useState([]);
  const [excedentes, setExcedentes] = useState([]);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const [manual, setManual] = useState(false);
  const [buscaManual, setBuscaManual] = useState("");
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));

  const carregar = (zonaId, data) => {
    if (!zonaId || !data) {
      setParagens([]);
      setExcedentes([]);
      return;
    }
    const { paragens: p, excedentes: e } = propostaAgenda({ zonaId, data });
    setParagens(p);
    setExcedentes(e);
  };

  const escolherCobrador = (id) => {
    const c = cobradores.find((x) => String(x.id) === String(id));
    const zonaId = c ? String(c.zona_id) : form.zona_id;
    setForm((a) => ({ ...a, collector_id: id, zona_id: zonaId }));
    carregar(zonaId, form.data_agendada);
  };

  const escolherZona = (id) => {
    set("zona_id", id);
    carregar(id, form.data_agendada);
  };

  const escolherData = (data) => {
    set("data_agendada", data);
    carregar(form.zona_id, data);
  };

  const mover = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= paragens.length) return;
    const copia = [...paragens];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setParagens(copia);
  };

  const origem = origemDaZona(form.zona_id);
  const rota = useMemo(() => calcularRota(paragens, origem), [paragens, origem]);
  const esperado = rota.paragens.reduce((s, p) => s + p.valor, 0);
  const mapas = ligacaoGoogleMaps([origem, ...rota.paragens.map((p) => lerCoordenadas(p.coordenadas))]);
  const extras = useMemo(() => clientesComParcelas({ data: form.data_agendada }).filter((p) => !paragens.some((x) => String(x.client_id) === String(p.client_id))), [form.data_agendada, paragens]);
  useEffect(() => {
    if (form.zona_id) carregar(form.zona_id, form.data_agendada);
    // só na abertura, quando já vem zona na URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extrasVisiveis = extras.filter((p) => !buscaManual || p.cliente_nome.toLowerCase().includes(buscaManual.toLowerCase()) || p.itens.some((i) => i.contrato.toLowerCase().includes(buscaManual.toLowerCase())));

  const salvar = (e) => {
    e.preventDefault();
    const dados = { ...form, paragens };
    const falhas = validarAgenda(dados);
    setErros(falhas);
    if (Object.keys(falhas).length) return setAviso({ erro: true, texto: Object.values(falhas)[0] });
    try {
      const agenda = criarAgenda(dados, usuario);
      navigate(`${CAMINHO_COB}/agenda/${agenda.id}?criada=1`);
    } catch (erro) {
      setAviso({ erro: true, texto: erro.message });
    }
  };

  return (
    <form className="cli-page cli-form-entrada" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><CalendarDays size={16} /> Nova agenda de cobrança</span>
        </div>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/agenda`)}><ArrowLeft size={16} /> Voltar</button>
      </header>

      <section className="cli-section">
        <h2><CalendarDays size={18} /> Dados da agenda</h2>
        <div className="cli-grid">
          <Campo label="Data agendada *" erro={erros.data_agendada}>
            <input type="date" min={hojeIso()} value={form.data_agendada} onChange={(e) => escolherData(e.target.value)} />
          </Campo>
          <Campo label="Hora de início">
            <input type="time" value={form.hora_inicio} onChange={(e) => set("hora_inicio", e.target.value)} />
          </Campo>
          <Campo label="Hora de fim" erro={erros.hora_fim}>
            <input type="time" value={form.hora_fim} onChange={(e) => set("hora_fim", e.target.value)} />
          </Campo>
          <Campo label="Cobrador *" erro={erros.collector_id}>
            <MenuSuspenso valor={form.collector_id} pesquisavel opcoes={[{ id: "", label: "Seleccione o cobrador" }, ...cobradores.map((c) => ({ id: String(c.id), label: c.nome_completo }))]} onChange={escolherCobrador} />
          </Campo>
          <Campo label="Zona / território *" erro={erros.zona_id}>
            <MenuSuspenso valor={String(form.zona_id)} pesquisavel opcoes={[{ id: "", label: "Seleccione a zona" }, ...zonas.map((z) => ({ id: String(z.id), label: `${z.nome} · ${z.codigo}` }))]} onChange={escolherZona} />
          </Campo>
          <Campo label="Observações" full erro={erros.observacoes}>
            <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais sobre a rota..." />
          </Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><Users size={18} /> Clientes na rota</h2>
        {erros.paragens ? <p className="cli-aviso">{erros.paragens}</p> : null}
        {paragens.length === 0 ? (
          <Vazio icone={Users} titulo="Ainda não há clientes nesta rota." texto="Seleccione o cobrador e a zona para carregar as parcelas a vencer ou em atraso." />
        ) : (
          <ol className="cob-rota-lista">
            {rota.paragens.map((p, i) => (
              <li key={p.client_id} className={`cob-parada${p.dias_atraso > 0 ? " is-atraso" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                <span className="cob-ordem">{p.ordem_visita}</span>
                <div>
                  <h3>{p.cliente_nome}</h3>
                  <p>{p.endereco || "Sem endereço"} · {p.itens.map((x) => `${x.contrato} ${x.num_parcela}/${x.total_parcelas}`).join(" · ")}</p>
                  <p>Venc. {p.itens.map((x) => formatarData(x.data_vencimento)).join(", ")}{p.dias_atraso > 0 ? ` · ${p.dias_atraso} dia${p.dias_atraso === 1 ? "" : "s"} em atraso` : ""}</p>
                </div>
                <div className="cob-parada-acoes">
                  <ChipValor valor={p.valor} tom={p.dias_atraso > 0 ? "is-vermelho" : "is-azul"} />
                  <span className="cob-ordenacao">
                    <button type="button" aria-label="Subir" onClick={() => mover(i, -1)}><ChevronUp size={14} /></button>
                    <button type="button" aria-label="Descer" onClick={() => mover(i, 1)}><ChevronDown size={14} /></button>
                  </span>
                  <button type="button" className="cli-btn ghost" onClick={() => setParagens((a) => a.filter((x) => String(x.client_id) !== String(p.client_id)))}><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
        {excedentes.length ? <p className="cob-excedentes">Limite de {REGRAS_COBRANCA.maxClientesRota} clientes por rota. {excedentes.length} cliente{excedentes.length === 1 ? "" : "s"} ficaram de fora por prioridade.</p> : null}
        <button type="button" className="cli-btn-novo" style={{ marginTop: 12 }} onClick={() => setManual(true)}><Plus size={16} /> Adicionar cliente manualmente</button>
      </section>

      <section className="cli-section">
        <h2><MapPin size={18} /> Rota optimizada</h2>
        <div className="mod-mapa-caixa">
          <MapaLeaflet
            aoVivo
            altura={320}
            pontos={rota.paragens.map((p) => {
              const c = lerCoordenadas(p.coordenadas);
              return c ? { ...c, ordem: p.ordem_visita, titulo: p.cliente_nome, texto: formatarMT(p.valor), cor: p.dias_atraso > 0 ? "#dc2626" : "#4AAC05" } : null;
            }).filter(Boolean)}
          />
        </div>
        <div className="mod-mapa-stats">
          <span className="cli-chip">Distância {rota.distancia_total_km} km</span>
          <span className="cli-chip is-azul">Tempo {formatarDuracao(rota.tempo_estimado_min)}</span>
          {rota.sem_coordenadas ? <span className="cli-chip is-amarelo">{rota.sem_coordenadas} sem GPS</span> : null}
          {mapas ? <a className="cli-btn-novo" href={mapas} target="_blank" rel="noreferrer"><Navigation size={16} /> Abrir navegação</a> : null}
        </div>
      </section>

      <section className="cli-section">
        <h2>Resumo da agenda</h2>
        <div className="pag-kpis is-3">
          <div className="pag-kpi"><span><small>Total clientes</small><strong>{paragens.length}</strong></span></div>
          <div className="pag-kpi is-azul"><span><small>Total esperado</small><strong>{formatarMT(esperado)}</strong><em>meta {formatarMT(metaDaAgenda(esperado))}</em></span></div>
          <div className="pag-kpi"><span><small>Total cobrado</small><strong>{formatarMT(0)}</strong><em>taxa 0%</em></span></div>
        </div>
      </section>

      <div className="mod-form-acoes">
        <button type="submit" className="cli-btn-novo"><Save size={16} /> Criar agenda</button>
        <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/agenda`)}>Cancelar</button>
      </div>

      {manual ? (
        <ModalFormulario icone={Users} titulo="Adicionar cliente à rota" onFechar={() => setManual(false)} largura={720} accoes={<button type="button" className="cli-btn" onClick={() => setManual(false)}>Fechar</button>}>
          <label className="cli-busca" style={{ marginBottom: 12 }}>
            <input value={buscaManual} onChange={(e) => setBuscaManual(e.target.value)} placeholder="Pesquisar cliente ou contrato" />
          </label>
          {extrasVisiveis.length === 0 ? <Vazio icone={Users} titulo="Não há mais clientes com parcelas em aberto." /> : extrasVisiveis.slice(0, 20).map((p) => (
            <button key={p.client_id} type="button" className="cob-parada" style={{ width: "100%", marginBottom: 8, textAlign: "left" }} disabled={paragens.length >= REGRAS_COBRANCA.maxClientesRota} onClick={() => { setParagens((a) => [...a, p]); setManual(false); }}>
              <span className="cob-ordem">+</span>
              <div>
                <h3>{p.cliente_nome}</h3>
                <p>{p.itens.map((i) => `${i.contrato} · ${formatarMT(i.valor_esperado)}`).join(" · ")}</p>
              </div>
              <ChipValor valor={p.valor} />
            </button>
          ))}
        </ModalFormulario>
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </form>
  );
};

export default AgendaFormulario;
