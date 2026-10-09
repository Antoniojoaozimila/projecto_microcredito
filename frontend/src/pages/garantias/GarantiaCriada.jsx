import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, Eye, FileText, Hash, List, Paperclip, Shield,
  ShieldCheck, ShieldPlus, Sparkles, User, UserCheck, Users,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import EstadoGarantia from "./EstadoGarantia";
import Cobertura from "./Cobertura";
import { ChipTipoGarantia } from "./ChipsGarantia";
import { CORES_TIPO_GARANTIA, ICONES_SUBTIPO, ICONES_TIPO_GARANTIA } from "./iconesGarantia";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { SEM_GARANTIA_G, bloqueiosAprovacao, dadosGarantia, podeAprovar } from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "./Garantias.css";

const PASSOS = [
  { id: "registo", titulo: "Registada", texto: "Dados e documentos guardados", icon: ShieldPlus },
  { id: "avaliacao", titulo: "Em avaliação", texto: "Análise da garantia", icon: ClipboardCheck },
  { id: "aprovacao", titulo: "Aprovação", texto: "Decisão do gestor", icon: UserCheck },
  { id: "activa", titulo: "Activa", texto: "Associada ao empréstimo", icon: ShieldCheck },
];

const indicePasso = (estado) => ({ "Em Avaliação": 1, Ativa: 3, Penhorada: 3, Libertada: 3, Executada: 3 })[estado] ?? 0;

const GarantiaCriada = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const dados = dadosGarantia(id);

  if (!dados) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><Shield size={16} /> Garantia não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/garantias")}><ArrowLeft size={16} /> Voltar à lista</button>
      </div>
    );
  }

  const { garantia: g, emprestimo, cliente, avalistas, valor, cobertura } = dados;
  const cor = CORES_TIPO_GARANTIA[g.tipo_garantia] || "#4AAC05";
  const IconeTipo = (g.subtipo_garantia && ICONES_SUBTIPO[g.subtipo_garantia]) || ICONES_TIPO_GARANTIA[g.tipo_garantia] || Shield;
  const passo = indicePasso(g.status);
  const bloqueios = g.status === "Em Avaliação" ? bloqueiosAprovacao(g) : [];
  const anexos = Object.values(g.documentos_anexos || {}).reduce((s, l) => s + (l?.length || 0), 0) + (g.fotos_garantia?.length || 0);

  const linhas = [
    { icon: Hash, rotulo: "Código", valor: <strong>{g.codigo_garantia}</strong> },
    { icon: FileText, rotulo: "Contrato", valor: emprestimo?.numero_contrato || "—" },
    { icon: User, rotulo: "Cliente", valor: cliente?.nome_completo || "—" },
    { icon: Shield, rotulo: "Tipo", valor: <ChipTipoGarantia tipo={g.tipo_garantia} subtipo={g.subtipo_garantia} /> },
    { icon: CircleDollarSign, rotulo: "Valor", valor: <span className="cli-chip is-forte is-azul"><CircleDollarSign size={13} /> {formatarMT(valor)}</span> },
    g.tipo_garantia !== SEM_GARANTIA_G ? { icon: BadgeCheck, rotulo: "Cobertura", valor: <Cobertura valor={cobertura} /> } : null,
    { icon: ShieldCheck, rotulo: "Estado", valor: <EstadoGarantia estado={g.status} /> },
    avalistas.length ? { icon: Users, rotulo: "Avalistas", valor: avalistas.map((a) => a.nome_completo).join(", ") } : null,
    { icon: Paperclip, rotulo: "Anexos", valor: `${anexos} ficheiro${anexos === 1 ? "" : "s"}` },
    { icon: CalendarDays, rotulo: "Registada", valor: `${new Date(g.data_registo).toLocaleString("pt-PT")} · ${g.registado_por}` },
  ].filter(Boolean);

  const accoes = [
    { icon: Eye, titulo: "Ver garantia", texto: podeAprovar(usuario) && g.status === "Em Avaliação" ? "Analisar e aprovar" : "Abrir a ficha completa", accao: () => navigate(`/imperial/dashboard/garantias/${g.id}`), principal: true },
    { icon: List, titulo: "Lista de garantias", texto: "Ver todas as garantias", accao: () => navigate("/imperial/dashboard/garantias") },
    emprestimo ? { icon: FileText, titulo: "Ver empréstimo", texto: emprestimo.numero_contrato, accao: () => navigate(`/imperial/dashboard/emprestimos/${emprestimo.id}`) } : null,
  ].filter(Boolean);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><ShieldPlus size={16} /> Garantia registada</span>
          <span className="cli-pill"><Shield size={16} /> {g.codigo_garantia}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Voltar</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/imperial/dashboard/garantias/nova")}><ShieldPlus size={16} /> Registar outra garantia</button>
        </div>
      </header>

      <section className="gar-criada-hero">
        <span className="gar-criada-confetes" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>
        <span className="gar-criada-icone"><CheckCircle2 size={34} /></span>
        <div>
          <small><Sparkles size={13} /> Operação concluída</small>
          <h2>Garantia {g.codigo_garantia} criada com sucesso!</h2>
          <p>{g.status === "Em Avaliação" ? "A garantia aguarda a análise e aprovação do gestor." : `Estado actual: ${g.status}.`}</p>
        </div>
      </section>

      <ol className="gar-criada-passos">
        {PASSOS.map((p, i) => (
          <li key={p.id} className={`${i < passo ? "is-feito" : ""}${i === passo ? " is-actual" : ""}`} style={{ animationDelay: `${150 + i * 90}ms` }}>
            <span className="gar-criada-passo-icone">{i < passo ? <CheckCircle2 size={18} /> : <p.icon size={18} />}</span>
            <span><strong>{p.titulo}</strong><small>{p.texto}</small></span>
          </li>
        ))}
      </ol>

      <div className="gar-criada-grelha">
        <article className="gar-certificado" style={{ "--tipo-cor": cor }}>
          <header>
            <span className="gar-certificado-icone"><IconeTipo size={30} /></span>
            <span>
              <small>Certificado de garantia</small>
              <strong>{g.codigo_garantia}</strong>
              <em>{g.tipo_garantia}{g.subtipo_garantia ? ` · ${g.subtipo_garantia}` : ""}</em>
            </span>
            <span className="gar-certificado-valor">
              <small>Valor</small>
              <strong>{formatarMT(valor)}</strong>
            </span>
          </header>
          <div className="gar-certificado-cliente">
            <AvatarCliente cliente={cliente} tamanho={40} />
            <span>
              <strong>{cliente?.nome_completo || "Cliente removido"}</strong>
              <small>{emprestimo ? `${emprestimo.numero_contrato} · ${formatarMT(emprestimo.valor_emprestado)}` : "—"}</small>
            </span>
          </div>
          <table className="gar-certificado-tabela">
            <tbody>
              {linhas.map(({ icon: IconeLinha, rotulo, valor: conteudo }, i) => (
                <tr key={rotulo} style={{ animationDelay: `${250 + i * 45}ms` }}>
                  <th><span><IconeLinha size={14} /></span>{rotulo}</th>
                  <td>{conteudo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {g.descricao ? <p className="gar-certificado-descricao">{g.descricao}</p> : null}
        </article>

        <aside className="gar-criada-lado">
          {bloqueios.length ? (
            <div className="gar-criada-pendencias">
              <strong><ClipboardCheck size={16} /> Antes da aprovação</strong>
              <ul>{bloqueios.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ) : null}
          <h3>O que deseja fazer?</h3>
          {accoes.map(({ icon: IconeAccao, titulo, texto, accao, principal }, i) => (
            <button key={titulo} type="button" className={`gar-criada-accao${principal ? " is-principal" : ""}`} style={{ animationDelay: `${350 + i * 70}ms` }} onClick={accao}>
              <span className="gar-criada-accao-icone"><IconeAccao size={18} /></span>
              <span><strong>{titulo}</strong><small>{texto}</small></span>
              <ChevronRight size={17} />
            </button>
          ))}
          <button type="button" className="gar-adicionar gar-criada-outra" onClick={() => navigate("/imperial/dashboard/garantias/nova")}>
            <ShieldPlus size={16} /> Registar outra garantia
          </button>
        </aside>
      </div>
    </div>
  );
};

export default GarantiaCriada;
