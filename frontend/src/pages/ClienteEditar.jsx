import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaArrowLeft,
  FaSave,
  FaBirthdayCake,
  FaGlobe,
  FaEnvelope,
  FaBriefcase,
  FaMapMarkerAlt,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import api from "../services/api";
import "./ClienteDetalhe.css";

const CACHE_CLIENTES = "clientes_cache_v2";

export default function ClienteEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(null);
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
      if (!id) {
        setErro("ID do cliente não informado.");
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);
      try {
        let c = null;
        try {
          const resId = await api.get(`/api/clientes/${id}`);
          c = resId.data;
        } catch (_) {
          const res = await api.get("/api/clientes");
          const clientes = Array.isArray(res.data) ? res.data : [];
          c = clientes.find((x) => String(x.id) === String(id));
        }
        if (cancelled) return;
        if (!c) {
          setErro("Cliente não encontrado.");
          setForm(null);
        } else {
          const dataNasc = c.data_nascimento
            ? String(c.data_nascimento).slice(0, 10)
            : "";
          setForm({
            id: c.id,
            nome: c.nome ?? "",
            documento: c.documento ?? "",
            contacto: c.contacto ?? c.telefone ?? "",
            email: c.email ?? "",
            morada: c.morada ?? "",
            data_nascimento: dataNasc,
            nacionalidade: c.nacionalidade ?? "",
            tipo_nuit: c.tipo_nuit ?? "",
            numero_nuit: c.numero_nuit ?? "",
            profissao: c.profissao ?? c.actividade ?? "",
            whatsapp: c.whatsapp ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setErro("Erro ao carregar cliente.");
          setForm(null);
        }
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
      const payload = {
        nome: form.nome.trim(),
        documento: form.documento.trim(),
        contacto: form.contacto.trim(),
        email: form.email?.trim() || null,
        morada: form.morada?.trim() || null,
        data_nascimento: form.data_nascimento || null,
        nacionalidade: form.nacionalidade?.trim() || null,
        tipo_nuit: form.tipo_nuit || null,
        numero_nuit: form.numero_nuit?.trim() || null,
        profissao: form.profissao?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
      };
      await api.put(`/api/clientes/${form.id}`, payload);
      localStorage.removeItem(CACHE_CLIENTES);
      navigate(`/microcredito/dashboard/clientes/visualizar/${form.id}`, {
        replace: true,
      });
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
            onClick={() => navigate("/microcredito/dashboard/clientes")}
          >
            <FaArrowLeft /> Voltar à lista
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
            onClick={() =>
              navigate(`/microcredito/dashboard/clientes/visualizar/${id}`)
            }
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">
            Editar: {form.nome || "Cliente"}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">Dados do cliente</h2>
          <div className="cliente-editar-form">
            <div className="cliente-editar-field">
              <label>
                <FaUser /> Nome
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaIdCard /> Nº Documento
              </label>
              <input
                type="text"
                required
                value={form.documento}
                onChange={(e) => handleChange("documento", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaPhone /> Telefone / Contacto
              </label>
              <input
                type="text"
                required
                value={form.contacto}
                onChange={(e) => handleChange("contacto", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaPhone /> WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaMapMarkerAlt /> Morada
              </label>
              <textarea
                value={form.morada}
                onChange={(e) => handleChange("morada", e.target.value)}
                rows={3}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaBirthdayCake /> Data nascimento
              </label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={(e) =>
                  handleChange("data_nascimento", e.target.value)
                }
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaGlobe /> Nacionalidade
              </label>
              <input
                type="text"
                value={form.nacionalidade}
                onChange={(e) => handleChange("nacionalidade", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaIdCard /> Tipo NUIT
              </label>
              <select
                value={form.tipo_nuit}
                onChange={(e) => handleChange("tipo_nuit", e.target.value)}
              >
                <option value="">—</option>
                <option value="Pessoal">Pessoal</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaIdCard /> Nº NUIT
              </label>
              <input
                type="text"
                maxLength={9}
                value={form.numero_nuit}
                onChange={(e) => handleChange("numero_nuit", e.target.value)}
              />
            </div>
            <div className="cliente-editar-field">
              <label>
                <FaBriefcase /> Profissão
              </label>
              <input
                type="text"
                value={form.profissao}
                onChange={(e) => handleChange("profissao", e.target.value)}
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
              navigate(`/microcredito/dashboard/clientes/visualizar/${id}`)
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
