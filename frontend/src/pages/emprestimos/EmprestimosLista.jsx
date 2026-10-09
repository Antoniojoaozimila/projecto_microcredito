import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Eye, FileText, HandCoins, Hash, Layers, ListOrdered, Plus, Search, Trash2, User, Wallet,
} from "lucide-react";
import { MODALIDADES, classeEstado, eliminarEmprestimo, obterModalidade, formatarData, formatarMT, listarEmprestimos } from "../../services/emprestimosMicrocredito";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import { listarClientes } from "../../services/clientesMicrocredito";
import "../clientes/ClienteModulo.css";
import "./Emprestimos.css";

const POR_PAGINA = 10;
const ESTADOS = ["Pendente", "Ativo", "Em Atraso", "Vencido", "Quitado", "Cancelado", "Rejeitado"];

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

const EmprestimosLista = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [aviso, setAviso] = useState(state?.sucesso || "");
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [aEliminar, setAEliminar] = useState(null);
  const emprestimos = useMemo(() => (versao >= 0 ? listarEmprestimos() : []), [versao]);
  const nomes = useMemo(() => Object.fromEntries(listarClientes().map((c) => [c.id, c.nome_completo])), []);

  useEffect(() => {
    const fechar = (e) => {
      if (!e.target.closest(".cli-drop")) setMenu(null);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return emprestimos.filter((e) => {
      if (estado && e.status !== estado) return false;
      if (modalidade && obterModalidade(e.modalidade)?.id !== modalidade) return false;
      if (!q) return true;
      return [e.numero_contrato, nomes[e.client_id]].join(" ").toLowerCase().includes(q);
    });
  }, [emprestimos, busca, estado, modalidade, nomes]);

  const totais = useMemo(() => ({
    carteira: emprestimos.filter((e) => ["Ativo", "Em Atraso", "Vencido"].includes(e.status)).reduce((s, e) => s + e.saldo_devedor, 0),
    pendentes: emprestimos.filter((e) => e.status === "Pendente").length,
    atraso: emprestimos.filter((e) => e.status === "Em Atraso").length,
  }), [emprestimos]);

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, totalPaginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><HandCoins size={16} /> Listar empréstimos</span>
          <span className="cli-pill"><Layers size={16} /> {emprestimos.length} empréstimo{emprestimos.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={() => navigate("/microcredito/dashboard/emprestimos/calendario")}>
            <CalendarDays size={16} /> Calendário
          </button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/microcredito/dashboard/emprestimos/novo")}>
            <Plus size={16} /> Novo empréstimo
          </button>
        </div>
      </header>

      <div className="emp-kpis">
        <div className="emp-kpi"><Wallet size={20} /><span><small>Carteira em curso</small><strong>{formatarMT(totais.carteira)}</strong></span></div>
        <div className="emp-kpi"><BadgeCheck size={20} /><span><small>Pendentes de aprovação</small><strong>{totais.pendentes}</strong></span></div>
        <div className="emp-kpi is-alerta"><CalendarDays size={20} /><span><small>Em atraso</small><strong>{totais.atraso}</strong></span></div>
      </div>

      {aviso ? (
        <div className="cli-modal-fundo" role="presentation">
          <div className="cli-modal cli-modal-mensagem" role="dialog" aria-modal="true">
            <span className="cli-modal-icone"><CheckCircle2 size={32} /></span>
            <p>Operação concluída</p>
            <h2>{aviso}</h2>
            <div className="cli-modal-accoes">
              <button type="button" className="cli-btn ghost" onClick={() => setAviso("")}>Continuar</button>
              {state?.id ? (
                <button type="button" className="cli-btn" onClick={() => navigate(`/microcredito/dashboard/emprestimos/${state.id}`)}><Eye size={16} /> Ver empréstimo</button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar empréstimo"
          nome={`${aEliminar.numero_contrato} · ${nomes[aEliminar.client_id] || "Cliente"}`}
          aviso={aEliminar.data_desembolso ? "O desembolso volta à carteira, os pagamentos são revertidos e as garantias associadas também são eliminadas." : "As garantias associadas também são eliminadas."}
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            eliminarEmprestimo(aEliminar.id);
            setAviso(`Empréstimo ${aEliminar.numero_contrato} eliminado.`);
            setAEliminar(null);
            setVersao((v) => v + 1);
          }}
        />
      ) : null}

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar contrato ou cliente" />
        </label>
        <Filtro icone={BadgeCheck} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
        <Filtro icone={CalendarDays} rotulo="Modalidade" valor={modalidade} aberto={menu === "modalidade"} onToggle={() => setMenu(menu === "modalidade" ? null : "modalidade")} opcoes={[{ id: "", label: "Todas" }, ...MODALIDADES.map((m) => ({ id: m.id, label: m.id }))]} onEscolher={(v) => { setModalidade(v); setPagina(1); setMenu(null); }} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table">
          <thead>
            <tr>
              <th><span className="cli-th"><FileText size={14} /> Contrato</span></th>
              <th><span className="cli-th"><User size={14} /> Cliente</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              <th><span className="cli-th"><Hash size={14} /> Parcelas</span></th>
              <th><span className="cli-th"><Wallet size={14} /> Saldo devedor</span></th>
              <th><span className="cli-th"><CalendarDays size={14} /> Último vencimento</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody key={actual}>
            {itens.length === 0 ? (
              <tr className="cli-empty">
                <td colSpan={8}>
                  <div className="cli-empty-box">
                    <HandCoins size={28} />
                    <strong>{emprestimos.length ? "Nenhum empréstimo encontrado." : "Ainda não há empréstimos."}</strong>
                    <span>{emprestimos.length ? "Ajuste os filtros ou a pesquisa." : "Crie o primeiro empréstimo."}</span>
                  </div>
                </td>
              </tr>
            ) : itens.map((e, indice) => (
              <tr key={e.id} style={{ animationDelay: `${indice * 35}ms` }}>
                <td><span className="cli-cell"><FileText size={14} /> {e.numero_contrato}</span></td>
                <td>
                  <span className="cli-pessoa"><User size={15} /><span><span className="cli-pessoa-nome">{nomes[e.client_id] || "Cliente removido"}</span><span className="cli-pessoa-tipo">{e.modalidade} · {e.sistema_amortizacao}</span></span></span>
                </td>
                <td><span className="cli-cell"><CircleDollarSign size={14} /> {formatarMT(e.valor_emprestado)}</span></td>
                <td><span className="cli-cell"><Hash size={14} /> {e.parcelas.filter((p) => p.status === "Pago").length}/{e.num_parcelas}</span></td>
                <td><span className="cli-cell"><Wallet size={14} /> {formatarMT(e.saldo_devedor)}</span></td>
                <td><span className="cli-cell"><CalendarDays size={14} /> {formatarData(e.data_vencimento)}</span></td>
                <td><span className={`emp-estado ${classeEstado(e.status)}`}>{e.status}</span></td>
                <td>
                  <span className="emp-accoes-linha">
                    <button type="button" className="cli-icon-btn" title="Detalhes" onClick={() => navigate(`/microcredito/dashboard/emprestimos/${e.id}`)}><Eye size={15} /></button>
                    <button type="button" className="cli-icon-btn cli-icon-perigo" title="Eliminar" onClick={() => setAEliminar(e)}><Trash2 size={15} /></button>
                  </span>
                </td>
              </tr>
            ))}
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
    </div>
  );
};

export default EmprestimosLista;
