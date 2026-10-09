import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FaCar, FaArrowLeft, FaSave, FaCog } from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import api from "../services/api";
import "./ClienteDetalhe.css";

export default function ViaturaEditar() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clienteIdVoltar = searchParams.get("cliente");
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [classificacoes, setClassificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (usuario && !podeEditarSubscricao(usuario.tipo)) {
      navigate("/microcredito/dashboard/clientes", { replace: true });
    }
  }, [usuario, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const [resV, resT] = await Promise.all([
          api.get(`/api/viaturas/${id}`),
          api.get("/api/tipocobertura"),
        ]);
        if (cancelled) return;
        const v = resV.data;
        setTipos(Array.isArray(resT.data) ? resT.data : []);
        setForm({
          cliente_id: v.cliente_id,
          tipo_cobertura_id: v.tipo_cobertura_id || "",
          classificacao_id: v.classificacao_id || "",
          marca: v.marca || "",
          modelo: v.modelo || "",
          ano_fabricacao: v.ano_fabricacao || "",
          matricula: v.matricula || "",
          tipo_matricula: v.tipo_matricula || "",
          numero_chassis: v.numero_chassis || "",
          numero_motor: v.numero_motor || "",
          valor_viatura: v.valor_viatura ?? "",
          periodo_seguro: v.periodo_seguro || "anual",
        });
      } catch (e) {
        if (!cancelled) setErro("Erro ao carregar viatura.");
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!form?.tipo_cobertura_id) {
      setClassificacoes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(
          `/api/classificacoes?tipo_cobertura_id=${form.tipo_cobertura_id}`
        );
        if (!cancelled) {
          setClassificacoes(Array.isArray(res.data) ? res.data : []);
        }
      } catch (_) {
        if (!cancelled) setClassificacoes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form?.tipo_cobertura_id]);

  const handleChange = (campo, valor) => {
    setForm((prev) => {
      if (!prev) return null;
      const next = { ...prev, [campo]: valor };
      if (campo === "tipo_cobertura_id") next.classificacao_id = "";
      return next;
    });
  };

  const voltar = () => {
    if (clienteIdVoltar) {
      navigate(`/microcredito/dashboard/clientes/visualizar/${clienteIdVoltar}`);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.put(`/api/viaturas/${id}`, {
        ...form,
        ano_fabricacao: parseInt(form.ano_fabricacao, 10),
        tipo_cobertura_id: parseInt(form.tipo_cobertura_id, 10),
        classificacao_id: parseInt(form.classificacao_id, 10),
        valor_viatura:
          form.valor_viatura === "" ? null : parseFloat(form.valor_viatura),
      });
      voltar();
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
          <button type="button" className="cliente-detalhe-btn primary" onClick={voltar}>
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
          <button type="button" className="cliente-detalhe-back" onClick={voltar}>
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">
            <FaCar /> Editar viatura
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">Dados da viatura</h2>
          <div className="cliente-editar-form">
            <div className="cliente-editar-field">
              <label>Marca</label>
              <input
                required
                value={form.marca}
                onChange={(e) => handleChange("marca", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Modelo</label>
              <input
                required
                value={form.modelo}
                onChange={(e) => handleChange("modelo", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Ano</label>
              <input
                type="number"
                required
                value={form.ano_fabricacao}
                onChange={(e) => handleChange("ano_fabricacao", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Matrícula</label>
              <input
                required
                value={form.matricula}
                onChange={(e) => handleChange("matricula", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>Tipo matrícula</label>
              <input
                value={form.tipo_matricula}
                onChange={(e) => handleChange("tipo_matricula", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaCog /> Nº Chassis
              </label>
              <input
                required
                value={form.numero_chassis}
                onChange={(e) => handleChange("numero_chassis", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaCog /> Nº Motor
              </label>
              <input
                required
                value={form.numero_motor}
                onChange={(e) => handleChange("numero_motor", e.target.value)}
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
              <label>Tipo cobertura</label>
              <select
                required
                value={form.tipo_cobertura_id}
                onChange={(e) =>
                  handleChange("tipo_cobertura_id", e.target.value)
                }
              >
                <option value="">Seleccione…</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome_cobertura || t.nome || t.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="cliente-editar-field">
              <label>Classificação</label>
              <select
                required
                value={form.classificacao_id}
                onChange={(e) =>
                  handleChange("classificacao_id", e.target.value)
                }
              >
                <option value="">Seleccione…</option>
                {classificacoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_classificacao || c.nome || c.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="cliente-editar-field">
              <label>Período seguro</label>
              <select
                value={form.periodo_seguro}
                onChange={(e) => handleChange("periodo_seguro", e.target.value)}
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
        </section>

        {erro && <p className="cliente-detalhe-erro-msg">{erro}</p>}

        <div className="cliente-editar-actions">
          <button type="button" className="cliente-detalhe-btn secondary" onClick={voltar}>
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
