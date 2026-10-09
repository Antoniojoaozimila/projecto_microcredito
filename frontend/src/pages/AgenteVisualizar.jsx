import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaArrowLeft,
  FaEdit,
  FaGlobe,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserShield,
  FaCalendarAlt,
  FaUserCog,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import { labelTipoUsuario } from "../constants/tiposUsuario";
import "./AgenteVisualizar.css";

function InfoCard({ icon, label, value, highlight, delay = 0 }) {
  return (
    <div
      className={`av-card ${highlight ? "av-card--highlight" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="av-card-label">
        {icon} {label}
      </span>
      <span className="av-card-value">{value || "—"}</span>
    </div>
  );
}

export default function AgenteVisualizar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useContext(AuthContext);
  const [agente, setAgente] = useState(location.state?.agente ?? null);
  const [carregando, setCarregando] = useState(!location.state?.agente);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (location.state?.agente && String(location.state.agente.id) === String(id)) {
      setAgente(location.state.agente);
      setCarregando(false);
      return;
    }
    let cancelled = false;
    async function fetchAgente() {
      if (!id) {
        setErro("ID do agente não informado.");
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);
      try {
        const res = await api.get(`/api/agentes/${id}`);
        if (!cancelled) setAgente(res.data);
      } catch (err) {
        if (!cancelled) {
          setErro("Agente não encontrado ou erro ao carregar.");
          setAgente(null);
        }
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    fetchAgente();
    return () => {
      cancelled = true;
    };
  }, [id, location.state?.agente]);

  const formatarData = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("pt-PT");
  };

  const tipoUsuario = labelTipoUsuario(agente?.tipo_usuario);

  const localizacao =
    agente?.localizacao === "fronteira"
      ? "Fronteira"
      : agente?.localizacao === "bomba"
        ? "Bomba"
        : agente?.localizacao || "—";

  if (carregando) {
    return (
      <div className="agente-visualizar-page">
        <PageLoader />
      </div>
    );
  }

  if (erro && !agente) {
    return (
      <div className="agente-visualizar-page">
        <div className="agente-visualizar-erro">
          <p>{erro}</p>
          <button
            type="button"
            className="av-btn av-btn-primary"
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  if (!agente) return null;

  return (
    <div className="agente-visualizar-page">
      <div className="av-hero">
        <div className="av-hero-bg" aria-hidden="true" />
        <div className="av-hero-top">
          <button
            type="button"
            className="av-btn av-btn-ghost"
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar
          </button>
          {usuario?.tipo === "admin" && (
            <button
              type="button"
              className="av-btn av-btn-primary"
              onClick={() =>
                navigate(`/imperial/dashboard/agentes/editar/${agente.id}`, {
                  state: { agente },
                })
              }
            >
              <FaEdit /> Editar
            </button>
          )}
        </div>
        <div className="av-hero-body">
          <div className="av-hero-avatar">
            <FaUserCog />
          </div>
          <div className="av-hero-text">
            <p className="av-hero-kicker">Perfil do agente</p>
            <h1>{agente.nome || "Agente"}</h1>
            <div className="av-hero-meta">
              <span className="av-chip av-chip-tipo">
                <FaUserShield /> {tipoUsuario}
              </span>
              <span className="av-chip">
                <FaMapMarkerAlt /> {localizacao}
              </span>
              <span className="av-chip">
                <FaPhone /> {agente.telefone || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="av-section" style={{ animationDelay: "80ms" }}>
        <h2 className="av-section-title">
          <FaUser /> Dados do agente
        </h2>
        <div className="av-grid">
          <InfoCard icon={<FaUser />} label="Nome" value={agente.nome} highlight delay={100} />
          <InfoCard icon={<FaIdCard />} label="Documento" value={agente.documento_identificacao} delay={140} />
          <InfoCard icon={<FaPhone />} label="Telefone" value={agente.telefone} delay={180} />
          <InfoCard icon={<FaGlobe />} label="Nacionalidade" value={agente.nacionalidade} delay={220} />
          <InfoCard icon={<FaMapMarkerAlt />} label="Localização" value={localizacao} delay={260} />
          <InfoCard icon={<FaMapMarkerAlt />} label="Endereço" value={agente.endereco} delay={300} />
          <InfoCard icon={<FaEnvelope />} label="Email (login)" value={agente.email} highlight delay={340} />
          <InfoCard icon={<FaUserShield />} label="Tipo de usuário" value={tipoUsuario} delay={380} />
          <InfoCard icon={<FaCalendarAlt />} label="Criado em" value={formatarData(agente.criado_em)} delay={420} />
        </div>
      </section>

      <div className="av-footer-actions">
        <button
          type="button"
          className="av-btn av-btn-ghost-dark"
          onClick={() => navigate("/imperial/dashboard/agentes")}
        >
          <FaArrowLeft /> Voltar à lista
        </button>
        {usuario?.tipo === "admin" && (
          <button
            type="button"
            className="av-btn av-btn-solid"
            onClick={() =>
              navigate(`/imperial/dashboard/agentes/editar/${agente.id}`, {
                state: { agente },
              })
            }
          >
            <FaEdit /> Editar agente
          </button>
        )}
      </div>
    </div>
  );
}
