import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ListOrdered, Sparkles } from "lucide-react";
import { corDoNome, iniciaisDe } from "./utilModulo";

export const Campo = ({ icon: Icon, label, erro, children, full, extra }) => (
  <div className={`cli-field${full ? " full" : ""}`}>
    <label>{Icon ? <Icon size={15} /> : null}{label}{extra}</label>
    {children}
    {erro ? <small>{erro}</small> : null}
  </div>
);

export const Dado = ({ icon: Icon, rotulo, valor, tom }) => (
  <div className={`pag-dado${tom ? ` is-${tom}` : ""}`}>
    <span className="pag-dado-icone"><Icon size={16} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
    </span>
  </div>
);

export const Kpi = ({ icone: Icone, rotulo, valor, detalhe, tom, atraso = 0 }) => (
  <div className={`pag-kpi mod-kpi${tom ? ` is-${tom}` : ""}`} style={{ animationDelay: `${atraso}ms` }}>
    <span className="pag-kpi-icone"><Icone size={20} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
      {detalhe ? <em>{detalhe}</em> : null}
    </span>
  </div>
);

export const Filtro = ({ icone: Icone, rotulo, valor, opcoes, aberto, onToggle, onEscolher }) => (
  <div className={`cli-drop ${aberto ? "is-open" : ""}`}>
    <button type="button" className="cli-drop-btn" onClick={onToggle}>
      <Icone size={15} />
      <span>{rotulo}</span>
      <strong>{opcoes.find((o) => String(o.id) === String(valor))?.label || "Todos"}</strong>
      <ChevronDown size={14} className="cli-chevron" />
    </button>
    {aberto ? (
      <ul className="cli-drop-menu">
        {opcoes.map((op) => (
          <li key={op.id || "todos"}>
            <button type="button" className={String(op.id) === String(valor) ? "is-active" : ""} onClick={() => onEscolher(op.id)}>{op.label}</button>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

export const MensagemModal = ({ aviso, onFechar }) =>
  aviso
    ? createPortal(
      <div className="cli-modal-fundo" role="presentation">
        <div className="cli-modal cli-modal-mensagem" role="dialog" aria-modal="true">
          <span className={`cli-modal-icone${aviso.erro ? " pag-icone-erro" : ""}`}>{aviso.erro ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}</span>
          <p>{aviso.erro ? "Não foi possível concluir" : "Operação concluída"}</p>
          <h2>{aviso.texto}</h2>
          {aviso.detalhe ? <small className="cli-modal-texto">{aviso.detalhe}</small> : null}
          <div className="cli-modal-accoes">
            <button type="button" className="cli-btn" onClick={onFechar}>Continuar</button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

export const Abas = ({ abas, activa, onMudar }) => (
  <nav className="mod-abas" role="tablist">
    {abas.map(({ id, rotulo, icone: Icone, contagem }) => (
      <button key={id} type="button" role="tab" aria-selected={activa === id} className={activa === id ? "is-active" : ""} onClick={() => onMudar(id)}>
        <Icone size={16} /> {rotulo}
        {contagem !== undefined ? <em>{contagem}</em> : null}
      </button>
    ))}
  </nav>
);

export const BannerSucesso = ({ titulo, texto, children }) => (
  <section className="mod-sucesso">
    <span className="mod-sucesso-confetes" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</span>
    <span className="mod-sucesso-icone"><CheckCircle2 size={30} /></span>
    <div>
      <small><Sparkles size={13} /> Operação concluída</small>
      <h2>{titulo}</h2>
      {texto ? <p>{texto}</p> : null}
    </div>
    {children ? <div className="mod-sucesso-accoes">{children}</div> : null}
  </section>
);

export const Vazio = ({ icone: Icone, titulo, texto, children }) => (
  <div className="mod-vazio">
    <span className="mod-vazio-icone"><Icone size={30} /></span>
    <strong>{titulo}</strong>
    {texto ? <span>{texto}</span> : null}
    {children}
  </div>
);

export const Iniciais = ({ nome, tamanho = 40, cor }) => (
  <span className="mod-iniciais" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36, "--cor": cor || corDoNome(nome) }}>
    {iniciaisDe(nome)}
  </span>
);

export const Barra = ({ valor, tom = "", rotulo }) => (
  <span className={`mod-barra ${tom}`} title={rotulo}>
    <i style={{ width: `${Math.max(0, Math.min(100, Number(valor) || 0))}%` }} />
  </span>
);

export const Anel = ({ valor, tamanho = 96, espessura = 9, children, cor = "#4AAC05" }) => {
  const raio = (tamanho - espessura) / 2;
  const perimetro = 2 * Math.PI * raio;
  const fraccao = Math.max(0, Math.min(100, Number(valor) || 0)) / 100;
  return (
    <span className="mod-anel" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} width={tamanho} height={tamanho}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} strokeWidth={espessura} className="mod-anel-fundo" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
          stroke={cor}
          className="mod-anel-valor"
          strokeDasharray={perimetro}
          style={{ "--perimetro": perimetro, strokeDashoffset: perimetro * (1 - fraccao) }}
        />
      </svg>
      <span className="mod-anel-texto">{children}</span>
    </span>
  );
};

export const Paginacao = ({ inicio, porPagina, total, actual, totalPaginas, onMudar }) =>
  total > 0 ? (
    <footer className="cli-pager">
      <span className="cli-pill cli-pill-pequena"><ListOrdered size={15} /> {inicio + 1}–{Math.min(inicio + porPagina, total)} de {total}</span>
      <div>
        <button type="button" disabled={actual <= 1} onClick={() => onMudar(actual - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={n === actual ? "is-active" : ""} onClick={() => onMudar(n)}>{n}</button>
        ))}
        <button type="button" disabled={actual >= totalPaginas} onClick={() => onMudar(actual + 1)} aria-label="Página seguinte"><ChevronRight size={16} /></button>
      </div>
    </footer>
  ) : null;

export const ModalFormulario = ({ icone: Icone, titulo, onFechar, children, accoes, largura }) =>
  createPortal(
    <div className="cli-modal-fundo" role="presentation">
      <div className="cli-modal pag-modal mod-modal" role="dialog" aria-modal="true" style={largura ? { width: `min(${largura}px, 100%)` } : undefined}>
        <div className="pag-modal-topo">
          <h2><Icone size={20} /> {titulo}</h2>
          <button type="button" className="pag-fechar" aria-label="Fechar" onClick={onFechar}>×</button>
        </div>
        <div className="pag-modal-corpo">{children}</div>
        {accoes ? <div className="pag-modal-accoes">{accoes}</div> : null}
      </div>
    </div>,
    document.body
  );
