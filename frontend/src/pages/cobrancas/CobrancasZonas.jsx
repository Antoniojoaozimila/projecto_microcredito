import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CircleDot, Eye, MapPin, Pencil, Plus, Radar, Search, Trash2, UserRound, Users } from "lucide-react";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import { Filtro, Kpi, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { paginar, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipZona } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import { eliminarZona, ESTADOS_ZONA, estatisticasZona, lerCoordenadas, listarZonas } from "../../services/cobrancasMicrocredito";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const POR = 8;

const pontosDe = (zonas) => zonas.map((z) => {
  const c = lerCoordenadas(z.coordenadas_centro);
  return c ? { ...c, titulo: z.nome, texto: `${z.codigo} · ${z.provincia}`, raio: z.raio_km, cor: z.status === "Ativa" ? "#4AAC05" : "#64748b" } : null;
}).filter(Boolean);

const CobrancasZonas = () => {
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [sel, setSel] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const zonas = useMemo(() => (versao >= 0 ? listarZonas() : []), [versao]);
  const stats = useMemo(() => Object.fromEntries(zonas.map((z) => [z.id, estatisticasZona(z.id)])), [zonas]);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return zonas.filter((z) => {
      if (estado && z.status !== estado) return false;
      if (!q) return true;
      return [z.nome, z.codigo, z.provincia, z.distrito, z.bairro, z.responsavel].join(" ").toLowerCase().includes(q);
    });
  }, [zonas, busca, estado]);
  const page = paginar(visiveis, pagina, POR);
  const pontos = useMemo(() => pontosDe(visiveis), [visiveis]);
  const kpis = useMemo(() => ({
    total: zonas.length,
    activas: zonas.filter((z) => z.status === "Ativa").length,
    clientes: Object.values(stats).reduce((s, x) => s + x.clientes, 0),
    atraso: Object.values(stats).reduce((s, x) => s + x.valorAtraso, 0),
  }), [zonas, stats]);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><MapPin size={16} /> Zonas e territórios</span>
          <span className="cli-pill">{zonas.length} zona{zonas.length === 1 ? "" : "s"}</span>
        </div>
        <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/zonas/nova`)}><Plus size={16} /> Nova zona</button>
      </header>

      <div className="pag-kpis">
        <Kpi icone={MapPin} rotulo="Zonas" valor={kpis.total} detalhe="territórios registados" />
        <Kpi icone={MapPin} rotulo="Activas" valor={kpis.activas} detalhe="prontas para cobrança" atraso={60} />
        <Kpi icone={Users} rotulo="Clientes cobertos" valor={kpis.clientes} detalhe="associados às zonas" tom="is-azul" atraso={120} />
        <Kpi icone={AlertTriangle} rotulo="Em atraso" valor={formatarMT(kpis.atraso)} detalhe="parcelas vencidas" tom="is-vermelho" atraso={180} />
      </div>

      <section className="cli-section cob-mapa-hero">
        <h2><Radar size={18} /> Mapa das zonas</h2>
        <div className="mod-mapa-caixa">
          <MapaLeaflet pontos={pontos} altura={320} aoVivo selecionado={sel} />
        </div>
      </section>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar zona, código, bairro ou responsável" />
        </label>
        <Filtro icone={MapPin} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_ZONA.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      {page.itens.length === 0 ? (
        <section className="cli-section"><Vazio icone={MapPin} titulo={zonas.length ? "Nenhuma zona encontrada." : "Ainda não há zonas."} texto={zonas.length ? "Ajuste a pesquisa ou o filtro." : "Registe a primeira zona de cobrança."} /></section>
      ) : (
        <div className="cob-zona-grelha">
          {page.itens.map((z, i) => {
            const s = stats[z.id] || {};
            const centro = lerCoordenadas(z.coordenadas_centro);
            return (
              <article
                key={z.id}
                className={`cob-zona-card${sel && centro && sel.lat === centro.lat ? " is-sel" : ""}`}
                style={{ "--cartao-cor": z.status === "Ativa" ? "#4AAC05" : "#64748b", animationDelay: `${i * 50}ms` }}
                onMouseEnter={() => centro && setSel(centro)}
              >
                <div className="mod-cartao-topo">
                  <span className="mod-cartao-icone"><MapPin size={22} /></span>
                  <span>
                    <h3>{z.nome}</h3>
                    <small>{z.codigo} · {z.provincia}{z.distrito ? ` · ${z.distrito}` : ""}</small>
                  </span>
                  <ChipZona estado={z.status} />
                </div>
                <ul className="cob-zona-stats">
                  <li><i><Users size={14} /></i><span><small>Clientes</small><strong>{s.clientes || 0}</strong></span></li>
                  <li><i><UserRound size={14} /></i><span><small>Cobradores activos</small><strong>{s.cobradores || 0}</strong></span></li>
                  <li><i><AlertTriangle size={14} /></i><span><small>Em atraso</small><strong>{s.atrasados || 0} · {formatarMT(s.valorAtraso || 0)}</strong></span></li>
                  <li><i><CircleDot size={14} /></i><span><small>Raio</small><strong>{z.raio_km ? `${z.raio_km} km` : "—"}</strong></span></li>
                  <li><i><UserRound size={14} /></i><span><small>Responsável</small><strong>{z.responsavel || "—"}</strong></span></li>
                  <li><i><MapPin size={14} /></i><span><small>Bairro</small><strong>{z.bairro || "—"}</strong></span></li>
                </ul>
                <div className="mod-cartao-accoes">
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/agenda/nova?zona=${z.id}`)}><Eye size={15} /> Nova agenda</button>
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/zonas/${z.id}`)}><Pencil size={15} /> Editar</button>
                  <button type="button" className="cli-btn ghost" onClick={() => setAEliminar(z)}><Trash2 size={15} /> Eliminar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar zona"
          nome={aEliminar.nome}
          aviso="Só é possível se não houver cobradores nem agendas associadas."
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            try {
              eliminarZona(aEliminar.id);
              setAEliminar(null);
              setVersao((v) => v + 1);
              setAviso({ texto: `Zona ${aEliminar.codigo} eliminada.` });
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

export default CobrancasZonas;
