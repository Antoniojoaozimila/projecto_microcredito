import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Ban, BellRing, Briefcase, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardCheck, FileText,
  Gavel, Heart, IdCard, Layers, Lock, LockOpen, Mail, MapPin, Phone, Scale, Shield, ShieldCheck, StickyNote,
  Trash2, User, Users, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import AvatarCliente from "../clientes/AvatarCliente";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import EstadoGarantia from "./EstadoGarantia";
import ModalAccaoGarantia from "./ModalAccaoGarantia";
import Cobertura from "./Cobertura";
import AnexosGarantia, { ListaDocumentos } from "./AnexosGarantia";
import HistoricoMovimentos from "./HistoricoMovimentos";
import { configAccao } from "./accoesGarantia";
import { ICONES_TIPO_GARANTIA } from "./iconesGarantia";
import { classeEstado, formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import {
  REGRAS_GARANTIA, bloqueiosAprovacao, dadosGarantia, eBem, eliminarGarantia, hojeIso, podeAprovar, podeLibertar, podePenhorar, registarAvaliacao,
  requisitosExecucao, validadeAvaliacao,
} from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const ETAPAS = [
  { id: "Em Avaliação", icon: ClipboardCheck },
  { id: "Ativa", icon: ShieldCheck },
  { id: "Penhorada", icon: Lock },
  { id: "Final", icon: LockOpen },
];

const Item = ({ icon: Icone, rotulo, valor, indice = 0 }) => (
  <div className="cli-info" style={{ animationDelay: `${indice * 30}ms` }}>
    <span className="cli-info-icone"><Icone size={17} /></span>
    <span><small>{rotulo}</small><strong>{valor || "—"}</strong></span>
  </div>
);

const GarantiaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [accao, setAccao] = useState(null);
  const [aEliminar, setAEliminar] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const dados = versao >= 0 ? dadosGarantia(id) : null;

  if (!dados) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><Shield size={16} /> Garantia não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/microcredito/dashboard/garantias")}><ArrowLeft size={16} /> Voltar à lista</button>
      </div>
    );
  }

  const { garantia: g, emprestimo: e, cliente, avalistas, movimentos, valor, cobertura, dias_atraso: dias } = dados;
  const IconeTipo = ICONES_TIPO_GARANTIA[g.tipo_garantia] || Shield;
  const bloqueios = g.status === "Em Avaliação" ? bloqueiosAprovacao(g) : [];
  const execucao = requisitosExecucao(g, e);
  const validade = validadeAvaliacao(g);
  const etapaActual = ["Libertada", "Executada"].includes(g.status) ? 3 : ETAPAS.findIndex((x) => x.id === g.status);

  const configAvaliacao = {
    titulo: `Avaliação formal · ${g.codigo_garantia}`,
    subtitulo: "Registar avaliação",
    icone: ClipboardCheck,
    descricao: "Obrigatória para bens móveis e imóveis antes da aprovação.",
    campos: [
      { id: "valor_avaliado", label: "Valor avaliado (MT) *", tipo: "number", inicial: g.valor_avaliado || "", foco: true },
      { id: "data_avaliacao", label: "Data da avaliação *", tipo: "date", inicial: g.data_avaliacao || hojeIso(), max: hojeIso() },
      { id: "avaliador", label: "Avaliador *", inicial: g.avaliador || "", placeholder: "Nome do avaliador responsável" },
    ],
    botao: "Guardar avaliação",
    sucesso: "Avaliação registada.",
    executar: (v) => registarAvaliacao(g.id, v, usuario),
  };
  const config = accao === "avaliacao" ? configAvaliacao : accao ? configAccao(accao, g, usuario) : null;

  const botoes = [
    g.status === "Em Avaliação" && eBem(g.tipo_garantia) ? { id: "avaliacao", icon: ClipboardCheck, rotulo: g.valor_avaliado ? "Reavaliar" : "Registar avaliação" } : null,
    ["Ativa", "Penhorada"].includes(g.status) ? { id: "avaliacao", icon: ClipboardCheck, rotulo: "Reavaliar" } : null,
    g.status === "Em Avaliação" ? { id: "cancelar", icon: Ban, rotulo: "Cancelar", perigo: true } : null,
    g.status === "Em Avaliação" ? { id: "aprovar", icon: ShieldCheck, rotulo: "Aprovar", principal: true, desactivado: bloqueios.length > 0 || !podeAprovar(usuario) } : null,
    podePenhorar(g, e) ? { id: "penhorar", icon: Lock, rotulo: "Penhorar", perigo: true } : null,
    g.status === "Penhorada" ? { id: "notificar", icon: BellRing, rotulo: g.notificacao ? "Nova notificação" : "Notificar cliente" } : null,
    podeLibertar(g, e) ? { id: "libertar", icon: LockOpen, rotulo: "Libertar", principal: true } : null,
    g.status === "Penhorada" ? { id: "executar", icon: Gavel, rotulo: "Executar", perigo: true, desactivado: !execucao.pronta } : null,
  ].filter(Boolean);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Shield size={16} /> {g.codigo_garantia}</span>
          <span className="cli-pill"><User size={16} /> {cliente?.nome_completo || "Cliente removido"}</span>
          <EstadoGarantia estado={g.status} grande />
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate("/microcredito/dashboard/garantias")}><ArrowLeft size={16} /> Voltar</button>
          {botoes.map((b) => (
            <button
              key={`${b.id}-${b.rotulo}`}
              type="button"
              className={b.principal ? "cli-btn-novo" : `cli-btn-voltar${b.perigo ? " emp-btn-rejeitar" : ""}`}
              disabled={b.desactivado}
              title={b.desactivado ? (b.id === "aprovar" ? (bloqueios[0] || "Apenas gestor ou administrador.") : "Requisitos de execução em falta.") : undefined}
              onClick={() => setAccao(b.id)}
            >
              <b.icon size={16} /> {b.rotulo}
            </button>
          ))}
          <button type="button" className="cli-btn-voltar emp-btn-rejeitar" onClick={() => setAEliminar(true)}><Trash2 size={16} /> Eliminar</button>
        </div>
      </header>

      <section className="cli-section">
        <h2><Layers size={18} /> Ciclo de vida</h2>
        {g.status === "Cancelada" ? (
          <p className="pag-estorno-info"><Ban size={16} /> Garantia cancelada. {movimentos.find((m) => m.status_novo === "Cancelada")?.motivo || ""}</p>
        ) : (
          <ol className="emp-fases gar-fases">
            {ETAPAS.map((etapa, i) => {
              const Icone = i === 3 && g.status === "Executada" ? Gavel : etapa.icon;
              const rotulo = i === 3 ? (g.status === "Executada" ? "Executada" : "Libertada") : etapa.id;
              const saltada = i === 2 && etapaActual === 3 && !g.data_penhor;
              return (
                <li key={etapa.id} className={`${i < etapaActual && !saltada ? "is-feita" : ""}${i === etapaActual ? " is-actual" : ""}${saltada ? " is-saltada" : ""}${i === 3 && g.status === "Executada" ? " is-executada" : ""}`}>
                  <span>{i < etapaActual && !saltada ? <BadgeCheck size={16} /> : <Icone size={15} />}</span>
                  {rotulo}
                </li>
              );
            })}
          </ol>
        )}
        {bloqueios.length ? (
          <ul className="gar-bloqueios">
            {bloqueios.map((b) => <li key={b}><AlertTriangle size={14} /> {b}</li>)}
          </ul>
        ) : null}
        {g.status === "Em Avaliação" && !podeAprovar(usuario) ? <p className="emp-nota"><ShieldCheck size={15} /> A aprovação é feita por um gestor ou administrador.</p> : null}
        {g.status === "Penhorada" ? (
          <div className="gar-execucao-req">
            <span className={execucao.diasOk ? "is-ok" : ""}><CalendarDays size={14} /> {dias}/{REGRAS_GARANTIA.diasExecucao} dias de atraso</span>
            <span className={execucao.notificado ? "is-ok" : ""}><BellRing size={14} /> {g.notificacao ? `Notificado por ${g.notificacao.meio} em ${new Date(g.notificacao.data).toLocaleDateString("pt-PT")}` : "Notificação formal em falta"}</span>
          </div>
        ) : null}
      </section>

      <div className="gar-duas">
        <section className="cli-section">
          <h2><IconeTipo size={18} /> Dados da garantia</h2>
          <div className="cli-infos gar-infos">
            {[
              { icon: IconeTipo, rotulo: "Tipo", valor: `${g.tipo_garantia}${g.subtipo_garantia ? ` · ${g.subtipo_garantia}` : ""}` },
              { icon: FileText, rotulo: "Descrição", valor: g.descricao },
              { icon: CircleDollarSign, rotulo: "Valor estimado", valor: formatarMT(g.valor_estimado) },
              { icon: BadgeCheck, rotulo: "Valor avaliado", valor: g.valor_avaliado ? formatarMT(g.valor_avaliado) : "" },
              { icon: ClipboardCheck, rotulo: "Avaliação", valor: g.data_avaliacao ? `${formatarData(g.data_avaliacao)} · ${g.avaliador || "—"}${validade ? ` · válida até ${validade.toLocaleDateString("pt-PT")}` : ""}` : "" },
              eBem(g.tipo_garantia) ? { icon: Heart, rotulo: "Estado de conservação", valor: g.estado_conservacao } : null,
              g.localizacao_garantia ? { icon: MapPin, rotulo: "Localização", valor: g.localizacao_garantia } : null,
              { icon: User, rotulo: "Registada por", valor: `${g.registado_por} · ${new Date(g.data_registo).toLocaleString("pt-PT")}` },
              g.aprovado_por ? { icon: ShieldCheck, rotulo: "Aprovada por", valor: `${g.aprovado_por} · ${new Date(g.data_aprovacao).toLocaleString("pt-PT")}` } : null,
              g.data_penhor ? { icon: Lock, rotulo: "Data de penhor", valor: formatarData(g.data_penhor) } : null,
              g.data_libertacao ? { icon: LockOpen, rotulo: "Data de libertação", valor: formatarData(g.data_libertacao) } : null,
              g.data_execucao ? { icon: Gavel, rotulo: "Execução", valor: `${formatarData(g.data_execucao)} · ${g.motivo_execucao}${g.valor_recuperado != null ? ` · recuperado ${formatarMT(g.valor_recuperado)}` : ""}` } : null,
              g.observacoes ? { icon: StickyNote, rotulo: "Observações", valor: g.observacoes } : null,
            ].filter(Boolean).map((item, i) => <Item key={item.rotulo} indice={i} {...item} />)}
          </div>
        </section>

        <section className="cli-section">
          <h2><FileText size={18} /> Empréstimo</h2>
          {e ? (
            <>
              <div className="pag-resumo-cliente">
                <AvatarCliente cliente={cliente} tamanho={40} />
                <span>
                  <strong>{cliente?.nome_completo || "Cliente"}</strong>
                  <small>{e.numero_contrato} · <span className={`emp-estado ${classeEstado(e.status)}`}>{e.status}</span></small>
                </span>
              </div>
              <ul className="pag-resumo-lista">
                <li><span><CircleDollarSign size={15} /> Valor emprestado</span><strong>{formatarMT(e.valor_emprestado)}</strong></li>
                <li><span><Wallet size={15} /> Saldo devedor</span><strong>{formatarMT(e.saldo_devedor)}</strong></li>
                <li><span><CalendarDays size={15} /> Dias em atraso</span><strong className={dias ? "pag-vermelho" : ""}>{dias}</strong></li>
                <li><span><Shield size={15} /> Valor da garantia</span><strong>{formatarMT(valor)}</strong></li>
                <li><span><Scale size={15} /> Cobertura</span><Cobertura valor={cobertura} /></li>
              </ul>
              <button type="button" className="cli-btn-io gar-ver-emprestimo" onClick={() => navigate(`/microcredito/dashboard/emprestimos/${e.id}`)}><FileText size={15} /> Ver empréstimo</button>
            </>
          ) : <p className="cli-suave">Empréstimo removido.</p>}
        </section>
      </div>

      {avalistas.length ? (
        <section className="cli-section">
          <h2><Users size={18} /> Avalistas / Fiadores</h2>
          <div className="gar-avalistas-ver">
            {avalistas.map((a, i) => (
              <div key={a.id} className="gar-avalista-cartao" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="gar-avalista-topo">
                  <span className="gar-avalista-num">{i + 1}</span>
                  <strong>{a.nome_completo}</strong>
                  <span className={`emp-estado ${a.status === "Ativo" ? "is-activo" : "is-cancelado"}`}>{a.status}</span>
                </div>
                <ul>
                  <li><IdCard size={13} /> {a.documento_tipo} {a.documento_numero}</li>
                  <li><Phone size={13} /> {a.telefone_principal}{a.telefone_alternativo ? ` · ${a.telefone_alternativo}` : ""}</li>
                  {a.email ? <li><Mail size={13} /> {a.email}</li> : null}
                  <li><MapPin size={13} /> {a.endereco_completo}</li>
                  {a.profissao || a.rendimento_mensal ? <li><Briefcase size={13} /> {a.profissao || "—"}{a.rendimento_mensal ? ` · ${formatarMT(a.rendimento_mensal)}/mês` : ""}</li> : null}
                  {a.relacao_com_cliente ? <li><Heart size={13} /> {a.relacao_com_cliente}</li> : null}
                </ul>
                {a.documentos_anexos?.length ? <div className="gar-docs gar-docs-avalista"><ListaDocumentos anexos={a.documentos_anexos} categoria="Documento do avalista" onErro={(t) => setMensagem({ erro: true, texto: t })} /></div> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AnexosGarantia garantia={g} onErro={(t) => setMensagem({ erro: true, texto: t })} />

      <HistoricoMovimentos movimentos={movimentos} />

      {config ? (
        <ModalAccaoGarantia
          {...config}
          onFechar={() => setAccao(null)}
          onConfirmar={(valores) => {
            config.executar(valores);
            setAccao(null);
            setVersao((v) => v + 1);
            setMensagem({ erro: false, texto: config.sucesso });
          }}
        />
      ) : null}

      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar garantia"
          nome={g.codigo_garantia}
          aviso="Os avalistas, documentos e o histórico de movimentos também são eliminados."
          onCancelar={() => setAEliminar(false)}
          onConfirmar={() => {
            eliminarGarantia(g.id);
            navigate("/microcredito/dashboard/garantias");
          }}
        />
      ) : null}

      {mensagem ? createPortal(
        <div className="cli-modal-fundo" role="presentation">
          <div className={`cli-modal cli-modal-mensagem${mensagem.erro ? " cli-modal-perigo" : ""}`} role="dialog" aria-modal="true">
            <span className="cli-modal-icone">{mensagem.erro ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}</span>
            <p>{mensagem.erro ? "Não foi possível concluir" : "Operação concluída"}</p>
            <h2>{mensagem.texto}</h2>
            <button type="button" className="cli-btn" onClick={() => setMensagem(null)}>Continuar</button>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default GarantiaDetalhe;
