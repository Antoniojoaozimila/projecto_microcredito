import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaDollarSign,
  FaUser,
  FaCalendar,
  FaFileInvoice,
  FaCheck,
  FaMoneyBillWave,
  FaUserTie,
  FaExternalLinkAlt,
  FaImage,
  FaTimes,
  FaFileAlt,
  FaCashRegister,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import api from "../services/api";
import "./PagamentoVisualizar.css";

const formatarData = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("pt-PT");
};

const formatarValor = (v) => {
  if (v == null) return "0 MZN";
  return `${Number(v).toLocaleString("pt-PT")} MZN`;
};

const caminhoValido = (valor) => {
  const s = valor ? String(valor).trim() : "";
  if (!s || s === "Pagamento efectuado com sucesso" || s === "N/A") return false;
  return true;
};

const resolverUrlImagem = (caminho) => {
  if (!caminhoValido(caminho)) return null;
  const s = String(caminho);
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) {
    return s;
  }
  const baseURL = api.defaults.baseURL || "";
  return s.startsWith("/") ? `${baseURL}${s}` : `${baseURL}/uploads/${s}`;
};

function BlocoImagemAnexo({ titulo, caminho, icone: Icone }) {
  const url = resolverUrlImagem(caminho);
  const [modal, setModal] = useState(false);

  if (!url) {
    return (
      <div className="pv-anexo-card">
        <div className="pv-anexo-head">
          {Icone ? <Icone /> : <FaImage />}
          <span>{titulo}</span>
        </div>
        <span className="pv-comprovativo-sem">Sem imagem anexada</span>
      </div>
    );
  }

  return (
    <div className="pv-anexo-card">
      <div className="pv-anexo-head">
        {Icone ? <Icone /> : <FaImage />}
        <span>{titulo}</span>
        <button type="button" className="pv-btn-ver pv-btn-ver-sm" onClick={() => setModal(true)}>
          <FaExternalLinkAlt /> Ampliar
        </button>
      </div>
      <button type="button" className="pv-anexo-preview-btn" onClick={() => setModal(true)}>
        <img src={url} alt={titulo} className="pv-anexo-preview" />
      </button>
      {modal && (
        <div className="pv-modal-overlay" onClick={() => setModal(false)} role="presentation">
          <div className="pv-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pv-modal-close" onClick={() => setModal(false)} aria-label="Fechar">
              <FaTimes />
            </button>
            <img src={url} alt={titulo} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagamentoVisualizar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pagamento, setPagamento] = useState(location.state?.pagamento ?? null);
  const [carregando, setCarregando] = useState(!location.state?.pagamento);

  useEffect(() => {
    if (location.state?.pagamento && String(location.state.pagamento.id) === String(id)) {
      setPagamento(location.state.pagamento);
      setCarregando(false);
      return;
    }
    let cancelled = false;
    async function load() {
      if (!id) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      try {
        const res = await api.get("/api/pagamentos/" + id);
        if (!cancelled) setPagamento(res.data);
      } catch (e) {
        if (!cancelled) setPagamento(null);
      }
      if (!cancelled) setCarregando(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, location.state?.pagamento]);

  const comprovativo = pagamento?.comprovativo;
  const comprovativoStr = comprovativo ? String(comprovativo) : "";
  const comprovativoEhTexto = comprovativoStr && comprovativoStr !== "Pagamento efectuado com sucesso" && comprovativoStr !== "N/A" && !resolverUrlImagem(comprovativoStr);

  const mostrarFecho = pagamento?.metodo_pagamento === "pos";

  if (carregando) {
    return (
      <div className="pagamento-visualizar-page">
        <PageLoader />
      </div>
    );
  }

  if (!pagamento) {
    return (
      <div className="pagamento-visualizar-page">
        <div className="pv-erro">
          <p>Pagamento não encontrado.</p>
          <button type="button" className="pv-back" onClick={() => navigate("/imperial/dashboard/pagamentos")}>
            <FaArrowLeft /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const estadoPago = pagamento.estado === "pago";
  const confirmado = pagamento.confirmacao === "confirmado";

  return (
    <div className="pagamento-visualizar-page">
      <header className="pv-header">
        <div className="pv-header-top">
          <button type="button" className="pv-back" onClick={() => navigate("/imperial/dashboard/pagamentos")}>
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="pv-title">
            <FaDollarSign /> Pagamento #{pagamento.id}
          </h1>
        </div>
      </header>

      <section className="pv-card">
        <div className="pv-card-head">Dados do pagamento</div>
        <div className="pv-card-body">
          <div className="pv-grid">
            <div className="pv-field">
              <span className="pv-field-label"><FaUser /> Cliente</span>
              <span className="pv-field-value">{pagamento.nome_cliente || "—"}</span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaFileInvoice /> Apólice</span>
              <span className="pv-field-value">{pagamento.numero_apolice || "—"}</span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaMoneyBillWave /> Valor</span>
              <span className="pv-field-value">{formatarValor(pagamento.valor)}</span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label">Referência</span>
              <span className="pv-field-value">
                <span className="pv-ref-badge">{pagamento.referencia || "—"}</span>
              </span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label">Referência M-Pesa</span>
              <span className="pv-field-value">
                <span className="pv-ref-badge">{pagamento.referencia_mpesa && pagamento.referencia_mpesa !== "N/A" ? pagamento.referencia_mpesa : "—"}</span>
              </span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaCheck /> Estado</span>
              <span className="pv-field-value">
                <span className={`pv-estado-badge ${estadoPago ? "pago" : "pendente"}`}>
                  {pagamento.estado || "Pendente"}
                </span>
              </span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaCheck /> Confirmação</span>
              <span className="pv-field-value">
                <span className={`pv-estado-badge ${confirmado ? "pago" : "pendente"}`}>
                  <FaCheck /> {confirmado ? "Confirmado" : "Não Confirmado"}
                </span>
              </span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaUserTie /> Agente</span>
              <span className="pv-field-value">{pagamento.nome_agente || "—"}</span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaCalendar /> Data de criação</span>
              <span className="pv-field-value">{formatarData(pagamento.data_criacao)}</span>
            </div>
            <div className="pv-field">
              <span className="pv-field-label"><FaCalendar /> Data de actualização</span>
              <span className="pv-field-value">{formatarData(pagamento.data_atualizacao)}</span>
            </div>
          </div>

          <div className="pv-anexos-grid">
            <BlocoImagemAnexo
              titulo="Comprovativo (Recibo)"
              caminho={pagamento.comprovativo}
              icone={FaImage}
            />
            {mostrarFecho && (
              <BlocoImagemAnexo
                titulo="Fecho de Caixa"
                caminho={pagamento.comprovativo_fecho}
                icone={FaCashRegister}
              />
            )}
          </div>

          {comprovativoEhTexto && (
            <div className="pv-field" style={{ marginTop: 12 }}>
              <span className="pv-field-label"><FaFileAlt /> Comprovativo (texto)</span>
              <div className="pv-comprovativo-wrap">
                <button
                  type="button"
                  className="pv-btn-ver"
                  onClick={() => {
                    try {
                      alert("Comprovativo: " + JSON.stringify(JSON.parse(comprovativoStr), null, 2));
                    } catch {
                      alert("Comprovativo: " + comprovativoStr);
                    }
                  }}
                >
                  <FaFileAlt /> Ver texto
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
