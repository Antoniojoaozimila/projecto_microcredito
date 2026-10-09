import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaFileAlt,
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaCar,
  FaCalendarAlt,
  FaUserShield,
  FaCog,
  FaPrint,
  FaMoneyBillWave,
  FaShieldAlt,
  FaEdit,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import { urlLogo } from "../services/logoDocumento";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import api from "../services/api";
import "./SeguroVisualizar.css";

const formatarData = (dataString) => {
  if (!dataString) return "—";
  return new Date(dataString).toLocaleDateString("pt-MZ");
};

const formatarValor = (valor) => {
  if (valor == null) return "0 MZN";
  return `${parseFloat(valor).toLocaleString("pt-MZ")} MZN`;
};

const obterStatusTraduzido = (status) => {
  const map = { ativo: "Ativo", pendente: "Pendente", cancelado: "Cancelado", emitido: "Emitido", finalizada: "Finalizada", alocada: "Alocada" };
  return map[status] || status;
};

function InfoCard({ icon, label, value, highlight, delay = 0 }) {
  return (
    <div
      className={`sv-card ${highlight ? "sv-card--highlight" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="sv-card-label">
        {icon} {label}
      </span>
      <span className="sv-card-value">{value || "—"}</span>
    </div>
  );
}

export default function SeguroVisualizar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useContext(AuthContext);
  const podeEditar = podeEditarSubscricao(usuario?.tipo);
  const [seguro, setSeguro] = useState(location.state?.seguro ?? null);
  const [carregando, setCarregando] = useState(!location.state?.seguro);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (location.state?.seguro) return;
    let cancelled = false;
    async function carregar() {
      if (!id) {
        setErro("ID do seguro não informado.");
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);
      try {
        const res = await api.get("/api/seguros");
        const lista = Array.isArray(res.data) ? res.data : [];
        const s = lista.find((x) => String(x.id) === String(id));
        if (cancelled) return;
        if (!s) {
          setErro("Seguro não encontrado.");
          setSeguro(null);
        } else {
          setSeguro(s);
        }
      } catch (err) {
        if (!cancelled) {
          setErro("Erro ao carregar dados do seguro.");
          setSeguro(null);
        }
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [id, location.state?.seguro]);

  const imprimirSeguro = () => {
    if (!seguro) return;
    const conteudo = `
      <div style="font-family: sans-serif; padding: 20px;">
        <img src="${urlLogo()}" alt="" style="height: 52px; object-fit: contain; margin-bottom: 12px;" />
        <h1 style="color: #106a37; border-bottom: 2px solid #106a37; padding-bottom: 10px;">Detalhes do Seguro</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
          <div>
            <p><strong>Número Apólice:</strong> ${seguro.numero_apolice}</p>
            <p><strong>Data Emissão:</strong> ${formatarData(seguro.data_emissao)}</p>
            <p><strong>Prémio Calculado:</strong> ${formatarValor(seguro.premio_calculado)}</p>
            <p><strong>Validade:</strong> ${seguro.validade_meses} meses</p>
          </div>
          <div>
            <p><strong>Cliente:</strong> ${seguro.cliente?.nome}</p>
            <p><strong>Agente:</strong> ${seguro.agente?.nome}</p>
            <p><strong>Veículo:</strong> ${seguro.viatura?.marca} ${seguro.viatura?.modelo}</p>
            <p><strong>Matrícula:</strong> ${seguro.viatura?.matricula}</p>
          </div>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">Emitido em: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    const w = window.open("", "_blank");
    w.document.write(conteudo);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 500);
  };

  if (carregando) {
    return (
      <div className="seguro-visualizar-page">
        <PageLoader />
      </div>
    );
  }

  if (erro || !seguro) {
    return (
      <div className="seguro-visualizar-page">
        <div className="seguro-visualizar-erro">
          <p>{erro || "Seguro não encontrado."}</p>
          <button
            type="button"
            className="sv-btn sv-btn-primary"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const status = String(seguro.status || "").toLowerCase();

  return (
    <div className="seguro-visualizar-page">
      <div className="sv-hero">
        <div className="sv-hero-bg" aria-hidden="true" />
        <div className="sv-hero-top">
          <button
            type="button"
            className="sv-btn sv-btn-ghost"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Voltar
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            {podeEditar && (
              <button
                type="button"
                className="sv-btn sv-btn-primary"
                onClick={() =>
                  navigate(`/imperial/dashboard/seguros/editar/${id}`)
                }
              >
                <FaEdit /> Editar
              </button>
            )}
            <button
              type="button"
              className="sv-btn sv-btn-primary"
              onClick={imprimirSeguro}
            >
              <FaPrint /> Imprimir
            </button>
          </div>
        </div>
        <div className="sv-hero-body">
          <div className="sv-hero-icon">
            <FaShieldAlt />
          </div>
          <div className="sv-hero-text">
            <p className="sv-hero-kicker">Detalhe do seguro</p>
            <h1>Seguro {seguro.numero_apolice}</h1>
            <div className="sv-hero-meta">
              <span className={`sv-status sv-status-${status}`}>
                {obterStatusTraduzido(seguro.status)}
              </span>
              <span className="sv-hero-chip">
                <FaCalendarAlt /> {formatarData(seguro.data_emissao)}
              </span>
              <span className="sv-hero-chip">
                <FaMoneyBillWave /> {formatarValor(seguro.premio_calculado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="sv-section" style={{ animationDelay: "80ms" }}>
        <h2 className="sv-section-title">
          <FaUser /> Informações do Cliente
        </h2>
        <div className="sv-grid">
          <InfoCard icon={<FaUser />} label="Nome" value={seguro.cliente?.nome} delay={100} />
          <InfoCard icon={<FaPhone />} label="Telefone" value={seguro.cliente?.contacto || seguro.cliente?.telefone} delay={140} />
          <InfoCard icon={<FaEnvelope />} label="Email" value={seguro.cliente?.email} delay={180} />
          <InfoCard icon={<FaIdCard />} label="Documento" value={seguro.cliente?.documento} delay={220} />
          <InfoCard icon={<FaMapMarkerAlt />} label="Morada" value={seguro.cliente?.morada} delay={260} />
        </div>
      </section>

      <section className="sv-section" style={{ animationDelay: "160ms" }}>
        <h2 className="sv-section-title">
          <FaFileAlt /> Detalhes do Seguro
        </h2>
        <div className="sv-grid">
          <InfoCard icon={<FaFileAlt />} label="Número Apólice" value={seguro.numero_apolice} highlight delay={120} />
          <InfoCard icon={<FaIdCard />} label="Apólice Kit" value={seguro.apolice_kit || "—"} delay={160} />
          <InfoCard icon={<FaCalendarAlt />} label="Data Emissão" value={formatarData(seguro.data_emissao)} delay={200} />
          <InfoCard icon={<FaCalendarAlt />} label="Validade" value={`${seguro.validade_meses || "—"} meses`} delay={240} />
          <InfoCard icon={<FaCar />} label="Valor da Viatura" value={formatarValor(seguro.valor_viatura)} delay={280} />
          <InfoCard icon={<FaMoneyBillWave />} label="Prémio Calculado" value={formatarValor(seguro.premio_calculado)} highlight delay={320} />
        </div>
      </section>

      <section className="sv-section" style={{ animationDelay: "240ms" }}>
        <h2 className="sv-section-title">
          <FaCar /> Veículo
        </h2>
        <div className="sv-grid">
          <InfoCard icon={<FaCar />} label="Marca" value={seguro.viatura?.marca} delay={140} />
          <InfoCard icon={<FaCar />} label="Modelo" value={seguro.viatura?.modelo} delay={180} />
          <InfoCard icon={<FaCalendarAlt />} label="Ano" value={seguro.viatura?.ano_fabricacao} delay={220} />
          <InfoCard icon={<FaCar />} label="Matrícula" value={seguro.viatura?.matricula} highlight delay={260} />
          <InfoCard icon={<FaCog />} label="Nº Chassis" value={seguro.viatura?.numero_chassis} delay={300} />
          <InfoCard icon={<FaShieldAlt />} label="Classificação" value={seguro.viatura?.classificacao?.nome_classificacao} delay={340} />
        </div>
      </section>

      <section className="sv-section" style={{ animationDelay: "320ms" }}>
        <h2 className="sv-section-title">
          <FaUserShield /> Agente
        </h2>
        <div className="sv-grid">
          <InfoCard icon={<FaUserShield />} label="Nome" value={seguro.agente?.nome} delay={160} />
          <InfoCard icon={<FaPhone />} label="Telefone" value={seguro.agente?.telefone} delay={200} />
          <InfoCard icon={<FaEnvelope />} label="Email" value={seguro.agente?.email} delay={240} />
          <InfoCard icon={<FaIdCard />} label="Código Agente" value={seguro.agente?.codigo_agente} delay={280} />
        </div>
      </section>

      <div className="sv-footer-actions">
        <button
          type="button"
          className="sv-btn sv-btn-ghost"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Voltar à lista
        </button>
        <button
          type="button"
          className="sv-btn sv-btn-primary"
          onClick={imprimirSeguro}
        >
          <FaPrint /> Imprimir
        </button>
      </div>
    </div>
  );
}
