import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  FaLock,
  FaCamera,
  FaGasPump,
} from "react-icons/fa";
import api from "../services/api";
import SistemaSelect from "../components/SistemaSelect/SistemaSelect";
import { TIPOS_USUARIO_OPTIONS } from "../constants/tiposUsuario";
import "./ClienteDetalhe.css";

const CACHE_AGENTES = "agentes_cache";

export default function AgenteCriar() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    nome: "",
    documento_identificacao: "",
    telefone: "",
    nacionalidade: "",
    localizacao: "bomba",
    nome_bomba: "",
    endereco: "",
    email: "",
    senha: "",
    tipo: "agente",
    foto_perfil: null,
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setFotoPreview(dataUrl);
      setForm((prev) => ({ ...prev, foto_perfil: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.senha || form.senha.length < 4) {
      setErro("Email e senha são obrigatórios (mínimo 4 caracteres).");
      return;
    }
    if (form.tipo !== "subscricao" && !form.nome_bomba.trim()) {
      setErro("Informe o nome da Bomba/Posto do agente.");
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
        senha: form.senha,
        tipo: form.tipo,
      };
      if (form.nome_bomba.trim()) {
        payload.nome_bomba = form.nome_bomba.trim();
      }
      if (fotoPreview) payload.foto_perfil = fotoPreview;
      await api.post("/api/agentes", payload);
      try {
        localStorage.removeItem(CACHE_AGENTES);
      } catch (_) {}
      navigate("/microcredito/dashboard/agentes", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao criar agente. Tente novamente.";
      setErro(msg);
      setSalvando(false);
    }
  };

  return (
    <div className="cliente-detalhe-page">
      <header className="cliente-detalhe-header">
        <div className="cliente-detalhe-header-top">
          <button
            type="button"
            className="cliente-detalhe-back"
            onClick={() => navigate("/microcredito/dashboard/agentes")}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">Criar novo agente</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">Dados do agente e acesso</h2>
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
                  onClick={() => photoInputRef.current?.click()}
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
              <SistemaSelect
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
                required={form.tipo !== "subscricao"}
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
              <label><FaEnvelope /> Email (login / username)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@institucional.com"
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaLock /> Senha</label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => handleChange("senha", e.target.value)}
                placeholder="Mínimo 4 caracteres"
                minLength={4}
                required
              />
            </div>
            <div className="cliente-editar-field">
              <label><FaUserShield /> Tipo de usuário</label>
              <SistemaSelect
                value={form.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                options={TIPOS_USUARIO_OPTIONS}
              />
            </div>
          </div>
        </section>

        {erro && <p className="cliente-detalhe-erro-msg">{erro}</p>}

        <div className="cliente-editar-actions">
          <button
            type="button"
            className="cliente-detalhe-btn secondary"
            onClick={() => navigate("/microcredito/dashboard/agentes")}
          >
            <FaArrowLeft /> Cancelar
          </button>
          <button type="submit" className="cliente-detalhe-btn primary" disabled={salvando}>
            <FaSave /> {salvando ? "A criar…" : "Criar agente"}
          </button>
        </div>
      </form>
    </div>
  );
}
