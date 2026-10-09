import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertOctagon, AlertTriangle, ArrowRight, BellRing, CalendarClock, CheckCircle2, ClipboardCheck, FileWarning, Gavel, Hourglass, Info, Layers, RefreshCw,
  Scale, Shield, ShieldAlert, Sparkles,
} from "lucide-react";
import { alertasGarantias } from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const NIVEIS = [
  { id: "critico", label: "Críticos", icon: AlertOctagon, texto: "Acção imediata" },
  { id: "alto", label: "Altos", icon: AlertTriangle, texto: "Resolver hoje" },
  { id: "medio", label: "Médios", icon: Info, texto: "Acompanhar" },
];

const ICONES_CATEGORIA = {
  Execução: Gavel,
  Atraso: CalendarClock,
  Avaliação: ClipboardCheck,
  Documentação: FileWarning,
  Cobertura: Scale,
  Expiração: Hourglass,
  Obrigatória: ShieldAlert,
};

const GarantiasAlertas = () => {
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [nivel, setNivel] = useState("");
  const alertas = useMemo(() => (versao >= 0 ? alertasGarantias() : []), [versao]);
  const categorias = [...new Set(alertas.map((a) => a.categoria))];
  const visiveis = alertas.filter((a) => (!categoria || a.categoria === categoria) && (!nivel || a.nivel === nivel));
  const contar = (id) => alertas.filter((a) => a.nivel === id).length;
  const criticos = contar("critico");

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><BellRing size={16} /> Alertas de garantias</span>
          <span className="cli-pill"><Layers size={16} /> {alertas.length} alerta{alertas.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io gar-btn-actualizar" onClick={() => setVersao((v) => v + 1)}><RefreshCw size={16} /> Actualizar</button>
        </div>
      </header>

      <section className={`gar-alertas-hero${criticos ? " is-critico" : alertas.length ? " is-aviso" : " is-limpo"}`}>
        <span className="gar-alertas-hero-icone">
          {alertas.length ? <BellRing size={30} /> : <CheckCircle2 size={30} />}
          {alertas.length ? <b>{alertas.length}</b> : null}
        </span>
        <div>
          <small><Sparkles size={13} /> Monitorização automática</small>
          <h2>
            {criticos
              ? `${criticos} alerta${criticos === 1 ? "" : "s"} crítico${criticos === 1 ? "" : "s"} precisa${criticos === 1 ? "" : "m"} de acção imediata`
              : alertas.length
                ? "Há garantias que precisam de acompanhamento"
                : "Todas as garantias estão em ordem"}
          </h2>
          <p>Prazos de execução, empréstimos em atraso, avaliações pendentes, documentação, cobertura e validade das avaliações.</p>
        </div>
      </section>

      <div className="gar-niveis">
        {NIVEIS.map((n, i) => {
          const total = contar(n.id);
          return (
            <button
              key={n.id}
              type="button"
              className={`gar-nivel is-${n.id}${nivel === n.id ? " is-active" : ""}${total ? "" : " is-vazio"}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => setNivel(nivel === n.id ? "" : n.id)}
            >
              <span className="gar-nivel-icone"><n.icon size={22} /></span>
              <span className="gar-nivel-texto">
                <small>{n.label}</small>
                <strong>{total}</strong>
                <em>{n.texto}</em>
              </span>
              {total ? <i className="gar-nivel-ponto" /> : null}
              <span className="gar-nivel-barra"><b style={{ width: `${alertas.length ? (total / alertas.length) * 100 : 0}%` }} /></span>
            </button>
          );
        })}
      </div>

      {categorias.length ? (
        <div className="gar-chips">
          <button type="button" className={!categoria ? "is-active" : ""} onClick={() => setCategoria("")}><Layers size={14} /> Todas <b>{alertas.length}</b></button>
          {categorias.map((c) => {
            const Icone = ICONES_CATEGORIA[c] || Shield;
            return (
              <button key={c} type="button" className={categoria === c ? "is-active" : ""} onClick={() => setCategoria(categoria === c ? "" : c)}>
                <Icone size={14} /> {c} <b>{alertas.filter((a) => a.categoria === c).length}</b>
              </button>
            );
          })}
        </div>
      ) : null}

      {visiveis.length === 0 ? (
        <section className="cli-section gar-sem-alertas">
          <span className="gar-sem-alertas-icone"><CheckCircle2 size={36} /></span>
          <strong>{alertas.length ? "Nenhum alerta com estes filtros." : "Sem alertas pendentes."}</strong>
          <span>{alertas.length ? "Limpe os filtros para ver todos os alertas." : "Todas as garantias estão em ordem."}</span>
          {alertas.length ? <button type="button" className="cli-btn-io" onClick={() => { setNivel(""); setCategoria(""); }}>Limpar filtros</button> : null}
        </section>
      ) : NIVEIS.map((n) => {
        const lista = visiveis.filter((a) => a.nivel === n.id);
        if (!lista.length) return null;
        return (
          <section key={n.id} className={`gar-grupo-alertas is-${n.id}`}>
            <h2><span><n.icon size={17} /></span> {n.label} <em>{lista.length}</em></h2>
            <div className="gar-alertas">
              {lista.map((a, i) => {
                const Icone = ICONES_CATEGORIA[a.categoria] || n.icon;
                return (
                  <article key={a.chave} className={`gar-alerta is-${a.nivel}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="gar-alerta-brilho" aria-hidden="true" />
                    <span className="gar-alerta-icone"><Icone size={20} /></span>
                    <div className="gar-alerta-corpo">
                      <span className="gar-alerta-meta">
                        <span className="cli-chip gar-alerta-categoria"><Icone size={12} /> {a.categoria}</span>
                        {a.garantia ? <span className="cli-chip is-cinza"><Shield size={12} /> {a.garantia.codigo_garantia}</span> : null}
                      </span>
                      <strong>{a.titulo}</strong>
                      <p>{a.texto}</p>
                    </div>
                    <button type="button" onClick={() => navigate(a.accao.rota)}>{a.accao.rotulo} <ArrowRight size={15} /></button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default GarantiasAlertas;
