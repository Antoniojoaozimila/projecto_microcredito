import { useMemo, useState } from "react";
import { Map as MapIcon, MapPin, Users } from "lucide-react";
import { listarClientes } from "../../services/clientesMicrocredito";
import provinciasGeo from "../../data/mocambique-provincias.json";
import "./ClienteModulo.css";

const limites = (() => {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  const visitar = (coords) => {
    if (typeof coords[0] === "number") {
      minX = Math.min(minX, coords[0]);
      maxX = Math.max(maxX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxY = Math.max(maxY, coords[1]);
      return;
    }
    coords.forEach(visitar);
  };
  provinciasGeo.features.forEach((f) => visitar(f.geometry.coordinates));
  return { minX, minY, maxX, maxY };
})();

const projectar = (lon, lat) => {
  const x = ((lon - limites.minX) / (limites.maxX - limites.minX)) * 280;
  const y = ((limites.maxY - lat) / (limites.maxY - limites.minY)) * 420;
  return [x, y];
};

const pathDe = (geometria) => {
  const poligonos = geometria.type === "Polygon" ? [geometria.coordinates] : geometria.coordinates;
  return poligonos
    .map((pol) => pol.map((anel) => anel.map((p, i) => {
      const [x, y] = projectar(p[0], p[1]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z").join(" "))
    .join(" ");
};

const nomes = provinciasGeo.features.map((f) => f.properties.shapeName).sort((a, b) => b.length - a.length);
const caminhos = provinciasGeo.features.map((f) => ({ nome: f.properties.shapeName, d: pathDe(f.geometry) }));

const ClientesMapa = () => {
  const [activa, setActiva] = useState(null);
  const [rato, setRato] = useState({ x: 0, y: 0 });
  const clientes = useMemo(() => listarClientes(), []);
  const totais = useMemo(() => {
    const mapa = {};
    clientes.forEach((c) => {
      const nome = nomes.find((n) => String(c.provincia || "").toLowerCase().includes(n.toLowerCase()));
      if (nome) mapa[nome] = (mapa[nome] || 0) + 1;
    });
    return mapa;
  }, [clientes]);
  const max = Math.max(1, ...Object.values(totais));
  const ranking = Object.entries(totais).sort((a, b) => b[1] - a[1]);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><MapIcon size={16} /> Mapa de clientes</span>
          <span className="cli-pill"><MapPin size={16} /> Províncias com clientes registados</span>
        </div>
      </header>
      <section className="cli-section cli-mapa-grid">
        <div
          className="cli-mapa-caixa"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setRato({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
        >
          <svg viewBox="-8 -8 296 436" className="cli-mapa" role="img" aria-label="Mapa de clientes por província">
            {caminhos.map(({ nome, d }, indice) => {
              const total = totais[nome] || 0;
              return (
                <path
                  key={nome}
                  d={d}
                  className={`cli-prov${activa === nome ? " is-active" : ""}`}
                  style={{ animationDelay: `${indice * 60}ms`, fillOpacity: total ? 0.3 + (total / max) * 0.7 : 0.14 }}
                  onMouseEnter={() => setActiva(nome)}
                  onMouseLeave={() => setActiva(null)}
                />
              );
            })}
          </svg>
          {activa ? (
            <div className="cli-mapa-tip" style={{ left: rato.x, top: rato.y }} key={activa}>
              <span><MapPin size={14} /> {activa}</span>
              <strong>{totais[activa] || 0}</strong>
              <small>cliente{(totais[activa] || 0) === 1 ? "" : "s"}</small>
            </div>
          ) : null}
        </div>
        <aside className="cli-mapa-lado">
          <span className="cli-pill"><Users size={16} /> {clientes.length} cliente{clientes.length === 1 ? "" : "s"}</span>
          {ranking.length === 0 ? <p className="cli-suave">Ainda não há clientes com província registada.</p> : null}
          {ranking.map(([nome, total]) => (
            <div
              key={nome}
              className={`cli-rank${activa === nome ? " is-active" : ""}`}
              onMouseEnter={() => setActiva(nome)}
              onMouseLeave={() => setActiva(null)}
            >
              <span><MapPin size={14} /> {nome}</span>
              <strong>{total}</strong>
              <i style={{ width: `${(total / max) * 100}%` }} />
            </div>
          ))}
        </aside>
      </section>
    </div>
  );
};

export default ClientesMapa;
