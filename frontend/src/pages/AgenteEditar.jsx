import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaArrowLeft,
  FaSave,
  FaGlobe,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserShield,
  FaCamera,
  FaLock,
  FaGasPump,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import ImperialSelect from "../components/ImperialSelect/ImperialSelect";
import { TIPOS_USUARIO_OPTIONS } from "../constants/tiposUsuario";
import api from "../services/api";
import "./ClienteDetalhe.css";

const CACHE_AGENTES = "agentes_cache";

export default function AgenteEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const photoInputRef = useRef(null);

  useEffect(() => {
    const stateAgente = location.state?.agente;
    if (stateAgente && String(stateAgente.id) === String(id)) {
      setForm({
        id: stateAgente.id,
        nome: stateAgente.nome ?? "",
        documento_identificacao: stateAgente.documento_identificacao ?? "",
        telefone: stateAgente.telefone ?? "",
        nacionalidade: stateAgente.nacionalidade ?? "",
        localizacao: stateAgente.localizacao ?? "bomba",
        nome_bomba: stateAgente.nome_bomba ?? "",
        endereco: stateAgente.endereco ?? "",
        email: stateAgente.email ?? "",
        tipo_usuario: stateAgente.tipo_usuario ?? "agente",
        foto_perfil: stateAgente.foto_perfil ?? null,
      });
      setFotoPreview(stateAgente.foto_perfil ?? null);
      setCarregando(false);
      return;
    }
    let cancelled = false;
    async function carregar() {
      if (!id) {
        setErro("ID do agente não informado.");
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);
      try {
        const res = await api.get(`/api/agentes/${id}`);
        const a = res.data?.agente ?? res.data;
        if (!cancelled && a) {
          setForm({
            id: a.id,
            nome: a.nome ?? "",
            documento_identificacao: a.documento_identificacao ?? "",
            telefone: a.telefone ?? "",
            nacionalidade: a.nacionalidade ?? "",
            localizacao: a.localizacao ?? "bomba",
            nome_bomba: a.nome_bomba ?? "",
            endereco: a.endereco ?? "",
            email: a.email ?? "",
            tipo_usuario: a.tipo_usuario ?? "agente",
            foto_perfil: a.foto_perfil ?? null,
          });
          setFotoPreview(a.foto_perfil ?? null);
        } else if (!cancelled) {
          setErro("Dados do agente não disponíveis.");
          setForm(null);
        }
      } catch (err) {
        if (!cancelled) {
          setErro("Erro ao carregar agente.");
          setForm(null);
        }
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelled = true; };
  }, [id, location.state?.agente]);

  const handleChange = (campo, valor) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : null));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setFotoPreview(dataUrl);
      setForm((prev) => (prev ? { ...prev, foto_perfil: dataUrl } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    if (novaSenha && novaSenha !== confirmarSenha) {
      setErro("A nova senha e a confirmação não coincidem.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const payload = {
        nome: form.nome,
        documento_identificacao: form.documento_identificacao,
        telefone: form.telefone,
        nacionalidade: form.nacionalidade,
        localizacao: form.localizacao,
        endereco: form.endereco,
        email: form.email,
        tipo: form.tipo_usuario,
      };
      if (form.nome_bomba?.trim()) {
        payload.nome_bomba = form.nome_bomba.trim();
      }
      if (fotoPreview) payload.foto_perfil = fotoPreview;
      if (novaSenha && novaSenha.trim()) payload.senha = novaSenha.trim();
      await api.put(`/api/agentes/${form.id}`, payload);
      try {
        localStorage.removeItem(CACHE_AGENTES);
      } catch (_) {}
      navigate("/imperial/dashboard/agentes", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao guardar. Tente novamente.";
      setErro(msg);
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
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="cliente-detalhe-page">
        <div className="cliente-detalhe-erro">
          <p>Não foi possível carregar os dados do agente.</p>
          <button
            type="button"
            className="cliente-detalhe-btn primary"
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cliente-detalhe-page">
      <header className="cliente-detalhe-header">
        <div className="cliente-detalhe-header-top">
          <button
            type="button"
            className="cliente-detalhe-back"
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">Editar: {form.nome || "Agente"}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">Dados do agente</h2>
          <div className="cliente-editar-form">
            <div className="cliente-editar-field cliente-editar-field-full">
              <label><FaCamera /> Foto de perfil</label>
              <div className="cliente-detalhe-foto-wrap">
                <div
                  className="cliente-detalhe-foto-preview"
                  style={{ backgroundImage: fotoPreview ? `url(${fotoPreview})` : "none" }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoChange}
                  className="cliente-detalhe-foto-input"
                />
                <button
                  type="button"
                  className="cliente-detalhe-btn secondary"
                  onClick={() => photoInputRef?.current?.click()}
                >
                  Escolher foto
                </button>
              </div>
            </div>
            <div className="cliente-editar-field">
              <label><FaUser /> Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaIdCard /> Documento</label>
              <input
                type="text"
                value={form.documento_identificacao}
                onChange={(e) => handleChange("documento_identificacao", e.target.value)}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaPhone /> Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaGlobe /> Nacionalidade</label>
              <input
                type="text"
                value={form.nacionalidade}
                onChange={(e) => handleChange("nacionalidade", e.target.value)}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaMapMarkerAlt /> Localização</label>
              <ImperialSelect
                value={form.localizacao}
                onChange={(e) => handleChange("localizacao", e.target.value)}
                required
                options={[
                  { value: "bomba", label: "Bomba" },
                  { value: "fronteira", label: "Fronteira" },
                ]}
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaGasPump /> Bomba / Posto</label>
              <input
                type="text"
                value={form.nome_bomba}
                onChange={(e) => handleChange("nome_bomba", e.target.value)}
                placeholder="Informe o nome da bomba/posto"
                required={form.tipo_usuario !== "subscricao"}
              />
            </div>
            <div className="cliente-editar-field cliente-editar-field-full">
              <label><FaMapMarkerAlt /> Endereço</label>
              <textarea
                value={form.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaEnvelope /> Email (login)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaUserShield /> Tipo de usuário</label>
              <ImperialSelect
                value={form.tipo_usuario}
                onChange={(e) => handleChange("tipo_usuario", e.target.value)}
                options={TIPOS_USUARIO_OPTIONS}
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaLock /> Nova senha (deixe em branco para não alterar)</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 4 caracteres"
                minLength={4}
                autoComplete="new-password"
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaLock /> Confirmar nova senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
          </div>
        </section>

        {erro && <p className="cliente-detalhe-erro-msg">{erro}</p>}

        <div className="cliente-editar-actions">
          <button
            type="button"
            className="cliente-detalhe-btn secondary"
            onClick={() => navigate("/imperial/dashboard/agentes")}
          >
            <FaArrowLeft /> Cancelar
          </button>
          <button type="submit" className="cliente-detalhe-btn primary" disabled={salvando}>
            <FaSave /> {salvando ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
