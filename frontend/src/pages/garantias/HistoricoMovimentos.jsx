import { ArrowRight, CalendarDays, Clock, History, ShieldPlus, StickyNote, User } from "lucide-react";
import { ICONES_ESTADO_GARANTIA, TOM_ESTADO_GARANTIA } from "./iconesGarantia";

const ha = (iso) => {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias < 30 ? `há ${dias} dia${dias === 1 ? "" : "s"}` : new Date(iso).toLocaleDateString("pt-PT");
};

const Estado = ({ estado }) => {
  const Icone = ICONES_ESTADO_GARANTIA[estado] || ShieldPlus;
  return <span className={`cli-chip ${TOM_ESTADO_GARANTIA[estado] ?? "is-cinza"}`}><Icone size={12} /> {estado}</span>;
};

const HistoricoMovimentos = ({ movimentos }) => (
  <section className="cli-section gar-movimentos">
    <div className="gar-seccao-topo">
      <h2><History size={18} /> Histórico de movimentos</h2>
      <span className="cli-chip is-cinza"><History size={13} /> {movimentos.length} registo{movimentos.length === 1 ? "" : "s"}</span>
    </div>
    <ol className="gar-linha-tempo">
      {movimentos.map((m, i) => {
        const Icone = ICONES_ESTADO_GARANTIA[m.status_novo] || ShieldPlus;
        const tom = TOM_ESTADO_GARANTIA[m.status_novo] ?? "is-cinza";
        const data = new Date(m.data_movimento);
        return (
          <li key={m.id} className={`${tom}${i === 0 ? " is-recente" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
            <span className="gar-linha-no"><Icone size={16} /></span>
            <div className="gar-linha-cartao">
              <div className="gar-linha-topo">
                <span className="gar-linha-estados">
                  <Estado estado={m.status_anterior} />
                  <ArrowRight size={14} className="gar-linha-seta" />
                  <Estado estado={m.status_novo} />
                </span>
                <span className="gar-linha-ha"><Clock size={12} /> {ha(m.data_movimento)}</span>
              </div>
              {m.motivo ? <p><StickyNote size={13} /> {m.motivo}</p> : null}
              <span className="gar-linha-meta">
                <span><CalendarDays size={12} /> {data.toLocaleDateString("pt-PT")} · {data.toLocaleTimeString("pt-PT")}</span>
                <span><User size={12} /> {m.utilizador}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  </section>
);

export default HistoricoMovimentos;
