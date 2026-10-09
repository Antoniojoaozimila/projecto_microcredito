import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaFileAlt, FaArrowLeft, FaSave } from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import api from "../services/api";
import "./ClienteDetalhe.css";

export default function SeguroEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (usuario && !podeEditarSubscricao(usuario.tipo)) {
      navigate("/imperial/dashboard/seguros", { replace: true });
    }
  }, [usuario, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        let s = null;
        try {
          const res = await api.get(`/api/seguros/${id}`);
          s = res.data?.seguro || res.data;
        } catch (_) {
          const res = await api.get("/api/seguros");
          const lista = Array.isArray(res.data) ? res.data : [];
          s = lista.find((x) => String(x.id) === String(id));
        }
        if (cancelled) return;
        if (!s) {
          setErro("Seguro não encontrado.");
          return;
        }
        setForm({
          numero_apolice: s.numero_apolice || "",
          apolice_kit: s.apolice_kit || "",
          status: s.status || "pendente",
          periodo_seguro: s.periodo_seguro || "anual",
          validade_meses: s.validade_meses || 12,
          data_fim: s.data_fim ? String(s.data_fim).slice(0, 10) : "",
          valor_viatura: s.valor_viatura ?? "",
          premio_calculado: s.premio_calculado ?? "",
          cliente_id: s.cliente_id || s.cliente?.id,
        });
      } catch (e) {
        if (!cancelled) setErro("Erro ao carregar seguro.");
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (campo, valor) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : null));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.patch(`/api/seguros/${id}/correcao`, {
        numero_apolice: form.numero_apolice.trim(),
        apolice_kit: form.apolice_kit?.trim() || null,
        status: form.status,
        periodo_seguro: form.periodo_seguro,
        validade_meses: parseInt(form.validade_meses, 10),
        data_fim: form.data_fim || undefined,
        valor_viatura: form.valor_viatura === "" ? undefined : form.valor_viatura,
        premio_calculado:
          form.premio_calculado === "" ? undefined : form.premio_calculado,
      });
      navigate(`/imperial/dashboard/seguros/visualizar/${id}`, { replace: true });
    } catch (err) {
      setErro(
        err.response?.data?.mensagem || "Erro ao guardar. Tente novamente."
      );
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="cliente-detalhe-page">
        <PageLoader />
      </div>
    );
  }

  if (erro && !form) {
    return (
      <div className="cliente-detalhe-page">
        <div className="cliente-detalhe-erro">
          <p>{erro}</p>
          <button
            type="button"
            className="cliente-detalhe-btn primary"
            onClick={() => navigate("/imperial/dashboard/seguros")}
          >
            <FaArrowLeft /> Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="cliente-detalhe-page">
      <header className="cliente-detalhe-header">
        <div className="cliente-detalhe-header-top">
          <button
            type="button"
            className="cliente-detalhe-back"
            onClick={() => navigate(`/imperial/dashboard/seguros/visualizar/${id}`)}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">
            <FaFileAlt /> Editar seguro
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">Dados do seguro</h2>
          <div className="cliente-editar-form">
            <div className="cliente-editar-field">
              <label>Nº Apólice</label>
              <input
                required
                value={form.numero_apolice}
                onChange={(e) => handleChange("numero_apolice", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Apólice Kit</label>
              <input
                value={form.apolice_kit}
                onChange={(e) => handleChange("apolice_kit", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Estado</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="pendente">Pendente</option>
                <option value="ativo">Ativo</option>
                <option value="cancelado">Cancelado</option>
                <option value="emitido">Emitido</option>
                <option value="finalizada">Finalizada</option>
                <option value="alocada">Alocada</option>
              </select>
            </div>
            <div className="cliente-editar-field">
              <label>Período</label>
              <select
                value={form.periodo_seguro}
                onChange={(e) => handleChange("periodo_seguro", e.target.value)}
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="cliente-editar-field">
              <label>Validade (meses)</label>
              <input
                type="number"
                value={form.validade_meses}
                onChange={(e) => handleChange("validade_meses", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Data fim</label>
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => handleChange("data_fim", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Valor viatura</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_viatura}
                onChange={(e) => handleChange("valor_viatura", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Prémio calculado</label>
              <input
                type="number"
                step="0.01"
                value={form.premio_calculado}
                onChange={(e) =>
                  handleChange("premio_calculado", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        {erro && <p className="cliente-detalhe-erro-msg">{erro}</p>}

        <div className="cliente-editar-actions">
          <button
            type="button"
            className="cliente-detalhe-btn secondary"
            onClick={() =>
              navigate(`/imperial/dashboard/seguros/visualizar/${id}`)
            }
          >
            <FaArrowLeft /> Cancelar
          </button>
          <button
            type="submit"
            className="cliente-detalhe-btn primary"
            disabled={salvando}
          >
            <FaSave /> {salvando ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
