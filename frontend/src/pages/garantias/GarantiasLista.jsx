import { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Eye, Hourglass, Layers,
  ListOrdered, Lock, Plus, Scale, Search, Shield, ShieldCheck, Trash2, User,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import EstadoGarantia from "./EstadoGarantia";
import ModalAccaoGarantia from "./ModalAccaoGarantia";
import { configAccao } from "./accoesGarantia";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { ESTADOS_GARANTIA, TIPOS_GARANTIA, eliminarGarantia, garantiasDetalhadas } from "../../services/garantiasMicrocredito";
import Cobertura from "./Cobertura";
import { ChipData, ChipMT, ChipTipoGarantia } from "./ChipsGarantia";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const POR_PAGINA = 10;

const Filtro = ({ icone: Icone, rotulo, valor, opcoes, aberto, onToggle, onEscolher }) => (
  <div className={`cli-drop ${aberto ? "is-open" : ""}`}>
    <button type="button" className="cli-drop-btn" onClick={onToggle}>
      <Icone size={15} />
      <span>{rotulo}</span>
      <strong>{opcoes.find((o) => o.id === valor)?.label || "Todos"}</strong>
      <ChevronDown size={14} className="cli-chevron" />
    </button>
    {aberto ? (
      <ul className="cli-drop-menu">
        {opcoes.map((op) => (
          <li key={op.id}>
            <button type="button" className={op.id === valor ? "is-active" : ""} onClick={() => onEscolher(op.id)}>{op.label}</button>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const GarantiasLista = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [accao, setAccao] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [aviso, setAviso] = useState("");
  const garantias = useMemo(() => (versao >= 0 ? garantiasDetalhadas() : []), [versao]);

  useEffect(() => {
    const fechar = (e) => {
      if (!e.target.closest(".cli-drop")) setMenu(null);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return garantias.filter((g) => {
      if (estado && g.status !== estado) return false;
      if (tipo && g.tipo_garantia !== tipo) return false;
      if (!q) return true;
      return [g.codigo_garantia, g.emprestimo?.numero_contrato, g.cliente?.nome_completo, g.descricao, g.subtipo_garantia].join(" ").toLowerCase().includes(q);
    });
  }, [garantias, busca, estado, tipo]);

  const kpis = useMemo(() => ({
    avaliacao: garantias.filter((g) => g.status === "Em Avaliação").length,
    activas: garantias.filter((g) => g.status === "Ativa").length,
    penhoradas: garantias.filter((g) => g.status === "Penhorada").length,
    valor: garantias.filter((g) => ["Ativa", "Penhorada"].includes(g.status)).reduce((s, g) => s + g.valor, 0),
  }), [garantias]);

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, totalPaginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);
  const filtrar = (definir) => (valor) => { definir(valor); setPagina(1); setMenu(null); };
  const config = accao ? configAccao(accao.tipo, accao.garantia, usuario) : null;

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Shield size={16} /> Lista de garantias</span>
          <span className="cli-pill"><Layers size={16} /> {garantias.length} garantia{garantias.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={() => navigate("/microcredito/dashboard/garantias/alertas")}><AlertTriangle size={16} /> Alertas</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/microcredito/dashboard/garantias/nova")}><Plus size={16} /> Nova garantia</button>
        </div>
      </header>

      <div className="pag-kpis">
        <div className="pag-kpi is-amarelo"><span className="pag-kpi-icone"><Hourglass size={20} /></span><span><small>Em avaliação</small><strong>{kpis.avaliacao}</strong><em>aguardam o gestor</em></span></div>
        <div className="pag-kpi" style={{ animationDelay: "60ms" }}><span className="pag-kpi-icone"><ShieldCheck size={20} /></span><span><small>Activas</small><strong>{kpis.activas}</strong><em>associadas a empréstimos</em></span></div>
        <div className="pag-kpi is-vermelho" style={{ animationDelay: "120ms" }}><span className="pag-kpi-icone"><Lock size={20} /></span><span><small>Penhoradas</small><strong>{kpis.penhoradas}</strong><em>empréstimos em atraso</em></span></div>
        <div className="pag-kpi is-azul" style={{ animationDelay: "180ms" }}><span className="pag-kpi-icone"><CircleDollarSign size={20} /></span><span><small>Valor em garantia</small><strong>{formatarMT(kpis.valor)}</strong><em>activas e penhoradas</em></span></div>
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar código, contrato, cliente ou descrição" />
        </label>
        <Filtro icone={BadgeCheck} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_GARANTIA.map((s) => ({ id: s, label: s }))]} onEscolher={filtrar(setEstado)} />
        <Filtro icone={Shield} rotulo="Tipo" valor={tipo} aberto={menu === "tipo"} onToggle={() => setMenu(menu === "tipo" ? null : "tipo")} opcoes={[{ id: "", label: "Todos" }, ...TIPOS_GARANTIA.map((t) => ({ id: t.id, label: t.label }))]} onEscolher={filtrar(setTipo)} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><Shield size={14} /> Código</span></th>
              <th><span className="cli-th"><User size={14} /> Cliente</span></th>
              <th><span className="cli-th"><Layers size={14} /> Tipo</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              <th><span className="cli-th"><Scale size={14} /> Cobertura</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><CalendarDays size={14} /> Registo</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody key={`${actual}-${versao}`}>
            {itens.length === 0 ? (
              <tr className="cli-empty">
                <td colSpan={8}>
                  <div className="cli-empty-box">
                    <Shield size={28} />
                    <strong>{garantias.length ? "Nenhuma garantia encontrada." : "Ainda não há garantias registadas."}</strong>
                    <span>{garantias.length ? "Ajuste os filtros ou a pesquisa." : "Registe a primeira garantia."}</span>
                  </div>
                </td>
              </tr>
            ) : itens.map((g, indice) => {
              return (
                <tr key={g.id} style={{ animationDelay: `${indice * 35}ms` }}>
                  <td><span className="pag-recibo-num"><Shield size={13} /> {g.codigo_garantia}</span></td>
                  <td>
                    <span className="pag-cliente-celula">
                      <AvatarCliente cliente={g.cliente} tamanho={32} />
                      <span>
                        <strong>{g.cliente?.nome_completo || "Cliente removido"}</strong>
                        <small>{g.emprestimo?.numero_contrato || "—"}</small>
                      </span>
                    </span>
                  </td>
                  <td><ChipTipoGarantia tipo={g.tipo_garantia} subtipo={g.subtipo_garantia} /></td>
                  <td>
                    <ChipMT valor={g.valor} tom="is-azul" />
                    <small className="cli-suave gar-valor-origem">{g.valor_avaliado ? "valor avaliado" : "valor estimado"}</small>
                  </td>
                  <td>{g.tipo_garantia === "Sem Garantia" ? "—" : <Cobertura valor={g.cobertura} />}</td>
                  <td><EstadoGarantia estado={g.status} /></td>
                  <td><ChipData data={g.data_registo} /></td>
                  <td>
                    <span className="pag-accoes">
                      <button type="button" title="Ver detalhes" onClick={() => navigate(`/microcredito/dashboard/garantias/${g.id}`)}><Eye size={15} /></button>
                      {g.status === "Em Avaliação" ? (
                        <button type="button" title="Aprovar" onClick={() => setAccao({ tipo: "aprovar", garantia: g })}><CheckCircle2 size={15} /></button>
                      ) : null}
                      <button type="button" className="is-perigo" title="Eliminar" onClick={() => setAEliminar(g)}><Trash2 size={15} /></button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visiveis.length > 0 ? (
        <footer className="cli-pager">
          <span className="cli-pill cli-pill-pequena"><ListOrdered size={15} /> {inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}</span>
          <div>
            <button type="button" disabled={actual <= 1} onClick={() => setPagina(actual - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={n === actual ? "is-active" : ""} onClick={() => setPagina(n)}>{n}</button>
            ))}
            <button type="button" disabled={actual >= totalPaginas} onClick={() => setPagina(actual + 1)} aria-label="Página seguinte"><ChevronRight size={16} /></button>
          </div>
        </footer>
      ) : null}

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

      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar garantia"
          nome={`${aEliminar.codigo_garantia} · ${aEliminar.cliente?.nome_completo || "Cliente"}`}
          aviso="Os avalistas, documentos e o histórico de movimentos desta garantia também são eliminados."
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            eliminarGarantia(aEliminar.id);
            setAviso(`Garantia ${aEliminar.codigo_garantia} eliminada.`);
            setAEliminar(null);
            setVersao((v) => v + 1);
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

export default GarantiasLista;
