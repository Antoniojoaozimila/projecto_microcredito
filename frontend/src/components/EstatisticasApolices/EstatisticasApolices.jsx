import { useEffect, useState } from "react";
import {
  FaFileSignature,
  FaClipboardCheck,
  FaMapMarkedAlt,
  FaFolderOpen,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import api from "../../services/api";
import { contarEstatisticasApolices } from "../../utils/seguroEstatisticas";
import "./EstatisticasApolices.css";

const CARD_META = [
  {
    key: "ativo",
    titulo: "Apólices Activas",
    icon: FaFileSignature,
    tom: "ativo",
  },
  {
    key: "finalizada",
    titulo: "Apólices Finalizadas",
    icon: FaClipboardCheck,
    tom: "finalizada",
  },
  {
    key: "alocada",
    titulo: "Apólices Alocadas",
    icon: FaMapMarkedAlt,
    tom: "alocada",
  },
  {
    key: "total",
    titulo: "Total de Apólices",
    icon: FaFolderOpen,
    tom: "total",
  },
];

const EstatisticasApolices = () => {
  const [stats, setStats] = useState({
    ativo: 0,
    finalizada: 0,
    alocada: 0,
    total: 0,
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function carregar() {
      setCarregando(true);
      try {
        const res = await api.get("/api/seguros");
        const lista = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setStats(contarEstatisticasApolices(lista));
      } catch {
        if (!cancelled) {
          setStats({ ativo: 0, finalizada: 0, alocada: 0, total: 0 });
        }
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = stats.total || 0;

  const cards = CARD_META.map((meta) => {
    const valor = stats[meta.key] || 0;
    const pct =
      meta.key === "total"
        ? 100
        : total > 0
          ? Math.round((valor / total) * 1000) / 10
          : 0;
    const tendencia =
      meta.key === "total"
        ? "neutro"
        : pct >= 30
          ? "positivo"
          : pct >= 15
            ? "neutro"
            : "negativo";

    return { ...meta, valor, pct, tendencia };
  });

  return (
    <section className="estat-apolices">
      <header className="estat-apolices-header">
        <span className="estat-apolices-title-btn">
          Estatísticas de Apólices
        </span>
      </header>
      <div className="estat-apolices-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon =
            card.tendencia === "positivo"
              ? FaArrowUp
              : card.tendencia === "negativo"
                ? FaArrowDown
                : FaMinus;

          return (
            <article
              key={card.titulo}
              className={`estat-apolices-card estat-apolices-card--${card.tom}`}
              style={{ "--delay": `${index * 0.06}s` }}
            >
              <div className="estat-apolices-top">
                <div className="estat-apolices-icon">
                  <Icon />
                </div>
                <span
                  className={`estat-apolices-trend estat-apolices-trend--${card.tendencia}`}
                  title="Peso relativo no total"
                >
                  <TrendIcon />
                  {carregando ? "…" : `${card.pct}%`}
                </span>
              </div>
              <p className="estat-apolices-label">{card.titulo}</p>
              <p className="estat-apolices-valor">
                {carregando ? "…" : card.valor.toLocaleString("pt-MZ")}
              </p>
              <div className="estat-apolices-bar">
                <span style={{ width: `${Math.min(card.pct, 100)}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default EstatisticasApolices;
