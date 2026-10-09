import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgePercent, MapPin, Pencil, Phone, Plus, Search, Trash2, UserRound, Wallet } from "lucide-react";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import { Barra, Filtro, Iniciais, Kpi, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { paginar, percentagem, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipCobrador, ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import { desempenhoCobrador, eliminarCobrador, ESTADOS_COBRADOR, lerCoordenadas, listarCobradores, obterZona } from "../../services/cobrancasMicrocredito";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const POR = 8;

const CobrancasCobradores = () => {
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const cobradores = useMemo(() => (versao >= 0 ? listarCobradores() : []), [versao]);
  const desempenho = useMemo(() => Object.fromEntries(cobradores.map((c) => [c.id, desempenhoCobrador(c.id)])), [cobradores]);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return cobradores.filter((c) => {
      if (estado && c.status !== estado) return false;
      if (!q) return true;
      return [c.nome_completo, c.documento, c.telefone_principal, c.email, obterZona(c.zona_id)?.nome].join(" ").toLowerCase().includes(q);
    });
  }, [cobradores, busca, estado]);
  const page = paginar(visiveis, pagina, POR);
  const activos = cobradores.filter((c) => c.status === "Ativo");

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><UserRound size={16} /> Cobradores</span>
          <span className="cli-pill">{cobradores.length} cobrador{cobradores.length === 1 ? "" : "es"}</span>
        </div>
        <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_COB}/cobradores/novo`)}><Plus size={16} /> Novo cobrador</button>
      </header>

      <div className="pag-kpis">
        <Kpi icone={UserRound} rotulo="Cobradores" valor={cobradores.length} detalhe="registados" />
        <Kpi icone={UserRound} rotulo="Activos" valor={activos.length} detalhe="disponíveis para rotas" atraso={60} />
        <Kpi icone={Wallet} rotulo="Cobrado no mês" valor={formatarMT(Object.values(desempenho).reduce((s, d) => s + d.cobrado, 0))} detalhe="todas as zonas" tom="is-azul" atraso={120} />
        <Kpi icone={BadgePercent} rotulo="Comissão do mês" valor={formatarMT(Object.values(desempenho).reduce((s, d) => s + d.comissao, 0))} detalhe="sobre o cobrado" tom="is-ciano" atraso={180} />
      </div>

      <section className="cli-section cob-mapa-hero">
        <h2><MapPin size={18} /> Territórios dos cobradores</h2>
        <div className="mod-mapa-caixa">
          <MapaLeaflet
            aoVivo
            altura={300}
            pontos={visiveis.map((c) => {
              const z = obterZona(c.zona_id);
              const p = lerCoordenadas(z?.coordenadas_centro);
              return p ? { ...p, titulo: c.nome_completo, texto: z?.nome, raio: z?.raio_km, cor: c.status === "Ativo" ? "#4AAC05" : "#64748b" } : null;
            }).filter(Boolean)}
          />
        </div>
      </section>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar nome, documento, telefone ou zona" />
        </label>
        <Filtro icone={UserRound} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_COBRADOR.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      {page.itens.length === 0 ? (
        <section className="cli-section"><Vazio icone={UserRound} titulo={cobradores.length ? "Nenhum cobrador encontrado." : "Ainda não há cobradores."} texto="Registe o primeiro cobrador para gerar agendas." /></section>
      ) : (
        <div className="mod-cartoes">
          {page.itens.map((c, i) => {
            const d = desempenho[c.id] || {};
            const zona = obterZona(c.zona_id);
            return (
              <article key={c.id} className="mod-cartao" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="mod-cartao-topo">
                  <Iniciais nome={c.nome_completo} />
                  <span>
                    <h3>{c.nome_completo}</h3>
                    <small>{zona?.nome || "Sem zona"} · {c.documento}</small>
                  </span>
                  <ChipCobrador estado={c.status} />
                </div>
                <ul className="mod-cartao-meta">
                  <li><span><Phone size={13} /> Telefone</span><strong>{c.telefone_principal}</strong></li>
                  <li><span>Meta mensal</span><ChipValor valor={c.meta_mensal || 0} /></li>
                  <li><span>Cobrado no mês</span><strong>{formatarMT(d.cobrado || 0)}</strong></li>
                  <li><span>Comissão</span><strong>{c.comissao_percentual || 0}% · {formatarMT(d.comissao || 0)}</strong></li>
                </ul>
                <Barra valor={d.progressoMeta || 0} tom={d.progressoMeta >= 80 ? "" : d.progressoMeta >= 40 ? "is-amarelo" : "is-vermelho"} rotulo={percentagem(d.progressoMeta || 0)} />
                <div className="mod-cartao-accoes" style={{ marginTop: 12 }}>
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/agenda/nova?cobrador=${c.id}`)}>Nova agenda</button>
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/cobradores/${c.id}`)}><Pencil size={15} /> Editar</button>
                  <button type="button" className="cli-btn ghost" onClick={() => setAEliminar(c)}><Trash2 size={15} /> Eliminar</button>
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
          titulo="Eliminar cobrador"
          nome={aEliminar.nome_completo}
          aviso="Só é possível se não tiver agendas registadas."
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            try {
              eliminarCobrador(aEliminar.id);
              setAEliminar(null);
              setVersao((v) => v + 1);
              setAviso({ texto: `${aEliminar.nome_completo} foi eliminado.` });
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

export default CobrancasCobradores;
