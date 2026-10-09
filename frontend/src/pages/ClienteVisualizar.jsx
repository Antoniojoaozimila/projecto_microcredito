import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaArrowLeft,
  FaEdit,
  FaBirthdayCake,
  FaGlobe,
  FaEnvelope,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserShield,
  FaCar,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload,
  FaHashtag,
  FaCog,
  FaShieldAlt,
  FaMoneyBillWave,
  FaUserTie,
  FaCalendarAlt,
  FaFileAlt,
  FaUpload,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import api, { baseURL } from "../services/api";
import "./ClienteDetalhe.css";

// =======================================================
// Serviço de imagens e download (lógica do colega)
// =======================================================

function urlImagem(img, base) {
  if (!img || typeof img !== "string") return "";
  const t = img.trim().replace(/\\/g, "/");
  if (t.startsWith("http")) return t;
  if (t.startsWith("/uploads/")) return `${base}${t}`;
  return `${base}/uploads/viaturas/${t}`;
}

const downloadService = {
  baseURL,

  obterExtensaoArquivo(url) {
    const extensoes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = extensoes.find((e) => String(url).toLowerCase().includes(e));
    return ext || ".jpg";
  },

  getImagensArray(viatura) {
    if (!viatura?.imagens) return [];
    if (typeof viatura.imagens === "string") {
      try {
        const parsed = JSON.parse(viatura.imagens);
        return Array.isArray(parsed) ? parsed : [viatura.imagens];
      } catch {
        return [viatura.imagens];
      }
    }
    return Array.isArray(viatura.imagens) ? viatura.imagens : [];
  },

  extrairImagensViatura(viatura) {
    const arr = this.getImagensArray(viatura);
    return arr.map((img, index) => {
      const url = urlImagem(img, this.baseURL);
      const nome = `viatura_${viatura.marca || ""}_${viatura.modelo || ""}_${index + 1}`.replace(/\s+/g, "_");
      return { url, nome, index, raw: img };
    });
  },

  async baixarImagem(url, nomeArquivo) {
    const resposta = await fetch(url);
    const blob = await resposta.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo || "imagem.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  async baixarTodasImagensComoZip(viaturas, nomeCliente) {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (let i = 0; i < viaturas.length; i++) {
      const viatura = viaturas[i];
      const imagens = this.extrairImagensViatura(viatura);
      if (imagens.length === 0) continue;
      const nomePasta = `Viatura_${(viatura.marca || "").replace(/\s+/g, "_")}_${(viatura.modelo || "").replace(/\s+/g, "_")}_${(viatura.matricula || "").replace(/\s+/g, "_")}`.replace(/[^a-zA-Z0-9_]/g, "_");
      const pastaViatura = zip.folder(nomePasta);
      for (let j = 0; j < imagens.length; j++) {
        try {
          const resposta = await fetch(imagens[j].url);
          if (resposta.ok) {
            const blob = await resposta.blob();
            const ext = this.obterExtensaoArquivo(imagens[j].url);
            pastaViatura.file(`imagem_${j + 1}${ext}`, blob);
          }
        } catch (err) {
          console.warn("Não foi possível baixar imagem:", err);
        }
      }
    }
    const count = Object.keys(zip.files).filter((k) => !zip.files[k].dir).length;
    if (count === 0) throw new Error("Nenhuma imagem disponível para download");
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Imagens_Viaturas_${(nomeCliente || "Cliente").replace(/\s+/g, "_")}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};

export default function ClienteVisualizar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const podeEditar = podeEditarSubscricao(usuario?.tipo);
  const fileInputRefs = useRef({});
  const [cliente, setCliente] = useState(null);
  const [viaturas, setViaturas] = useState([]);
  const [seguroInfo, setSeguroInfo] = useState(null);
  const [estadoSeguro, setEstadoSeguro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [uploadingViaturaId, setUploadingViaturaId] = useState(null);
  const [imagemModal, setImagemModal] = useState({
    aberto: false,
    imagens: [],
    indice: 0,
    viatura: null,
  });
  const [baixandoImagens, setBaixandoImagens] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) {
      setErro("ID do cliente não informado.");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const [resClientes, resViaturas, resSeguros] = await Promise.all([
        api.get("/api/clientes"),
        api.get("/api/viaturas"),
        api.get("/api/seguros"),
      ]);

      const clientes = Array.isArray(resClientes.data) ? resClientes.data : [];
      const c = clientes.find((x) => String(x.id) === String(id));
      if (!c) {
        setErro("Cliente não encontrado.");
        setCliente(null);
        setCarregando(false);
        return;
      }
      setCliente(c);

      const viaturasList = Array.isArray(resViaturas.data) ? resViaturas.data : [];
      setViaturas(viaturasList.filter((v) => String(v.cliente_id) === String(id)));

      const seguros = Array.isArray(resSeguros.data) ? resSeguros.data : [];
      const seg = seguros.find((s) => String(s.cliente_id || s.cliente?.id) === String(id));
      setSeguroInfo(seg || null);
      setEstadoSeguro(seg?.status || "—");
    } catch (err) {
      setErro("Erro ao carregar dados do cliente.");
      setCliente(null);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const uploadImagensViatura = async (viaturaId, files) => {
    if (!files?.length) return;
    setUploadingViaturaId(viaturaId);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("imagens", file));
      await api.post(`/api/viaturas/${viaturaId}/imagens`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await carregar();
    } catch (err) {
      alert(err.response?.data?.mensagem || "Erro ao enviar imagens. Tente novamente.");
    } finally {
      setUploadingViaturaId(null);
      if (fileInputRefs.current[viaturaId]) {
        fileInputRefs.current[viaturaId].value = "";
      }
    }
  };

  const abrirLightbox = useCallback((viatura, indice = 0) => {
    const imagens = downloadService.getImagensArray(viatura);
    setImagemModal({ aberto: true, imagens, indice, viatura });
  }, []);

  const fecharLightbox = useCallback(() => {
    setImagemModal({ aberto: false, imagens: [], indice: 0, viatura: null });
  }, []);

  const baixarTodasImagensZip = useCallback(async () => {
    if (!viaturas.length || !cliente) return;
    const temAlguma = viaturas.some((v) => downloadService.extrairImagensViatura(v).length > 0);
    if (!temAlguma) {
      alert("Nenhuma imagem disponível para download.");
      return;
    }
    setBaixandoImagens(true);
    try {
      await downloadService.baixarTodasImagensComoZip(viaturas, cliente.nome);
    } catch (err) {
      if (err.message === "Nenhuma imagem disponível para download") {
        alert("Nenhuma imagem disponível para download.");
      } else {
        alert("Erro ao criar o ficheiro ZIP. Tente novamente.");
      }
    } finally {
      setBaixandoImagens(false);
    }
  }, [viaturas, cliente]);

  const renderizarImagensViatura = useCallback((viatura) => {
    const imagens = downloadService.extrairImagensViatura(viatura);
    if (imagens.length === 0) {
      return (
        <div className="cliente-detalhe-sem-imagens-box">
          <FaImage className="cliente-detalhe-icon-imagem" />
          <span>Sem imagens</span>
        </div>
      );
    }
    return (
      <div className="cliente-detalhe-container-imagens-viatura">
        {imagens.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={`Viatura ${viatura.marca} ${viatura.modelo} ${idx + 1}`}
            className="cliente-detalhe-imagem-viatura-thumbnail"
            onClick={() => abrirLightbox(viatura, idx)}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ))}
      </div>
    );
  }, [abrirLightbox]);

  if (carregando) {
    return (
      <div className="cliente-detalhe-page">
        <PageLoader />
      </div>
    );
  }

  if (erro || !cliente) {
    return (
      <div className="cliente-detalhe-page">
        <div className="cliente-detalhe-erro">
          <p>{erro || "Cliente não encontrado."}</p>
          <button type="button" className="cliente-detalhe-btn primary" onClick={() => navigate("/imperial/dashboard/clientes")}>
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
          <button type="button" className="cliente-detalhe-back" onClick={() => navigate("/imperial/dashboard/clientes")}>
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="cliente-detalhe-title">
            <FaUser /> {cliente.nome}
          </h1>
          {podeEditar && (
            <button type="button" className="cliente-detalhe-btn primary" onClick={() => navigate(`/imperial/dashboard/clientes/editar/${id}`)}>
              <FaEdit /> Editar
            </button>
          )}
        </div>
      </header>

      <section className="cliente-detalhe-section">
        <h2 className="cliente-detalhe-section-title">Informações pessoais</h2>
        <div className="cliente-detalhe-grid">
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaIdCard /> Nº Documento</span>
            <span className="cliente-detalhe-value">{cliente.documento || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaPhone /> Telefone</span>
            <span className="cliente-detalhe-value">{cliente.contacto || cliente.telefone || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaPhone /> WhatsApp</span>
            <span className="cliente-detalhe-value">{cliente.whatsapp || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaEnvelope /> Email</span>
            <span className="cliente-detalhe-value">{cliente.email || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaMapMarkerAlt /> Morada</span>
            <span className="cliente-detalhe-value">{cliente.morada || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaBirthdayCake /> Data nascimento</span>
            <span className="cliente-detalhe-value">{cliente.data_nascimento || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaGlobe /> Nacionalidade</span>
            <span className="cliente-detalhe-value">{cliente.nacionalidade || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaIdCard /> Tipo NUIT</span>
            <span className="cliente-detalhe-value">{cliente.tipo_nuit || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaIdCard /> Nº NUIT</span>
            <span className="cliente-detalhe-value">{cliente.numero_nuit || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaBriefcase /> Profissão</span>
            <span className="cliente-detalhe-value">{cliente.profissao || cliente.actividade || "—"}</span>
          </div>
          <div className="cliente-detalhe-card">
            <span className="cliente-detalhe-label"><FaUserShield /> Estado seguro</span>
            <span className="cliente-detalhe-value">{estadoSeguro}</span>
          </div>
        </div>
      </section>

      {seguroInfo && (
        <section className="cliente-detalhe-section">
          <h2 className="cliente-detalhe-section-title">
            <FaFileAlt /> Resumo do Seguro
            {podeEditar && seguroInfo.id && (
              <button
                type="button"
                className="cliente-detalhe-btn secondary"
                style={{ marginLeft: "auto", fontSize: "0.85rem" }}
                onClick={() =>
                  navigate(`/imperial/dashboard/seguros/editar/${seguroInfo.id}`)
                }
              >
                <FaEdit /> Editar seguro
              </button>
            )}
          </h2>
          <div className="cliente-detalhe-seguro-resumo">
            <div className="cliente-detalhe-seguro-hero">
              <div>
                <span className="cliente-detalhe-seguro-hero-label">Nº Apólice</span>
                <strong>{seguroInfo.numero_apolice || "—"}</strong>
              </div>
              <span className={`cliente-detalhe-seguro-pill status-${String(seguroInfo.status || "").toLowerCase()}`}>
                {estadoSeguro === "ativo" || seguroInfo.status === "ativo"
                  ? "Ativo"
                  : estadoSeguro === "pendente" || seguroInfo.status === "pendente"
                    ? "Pendente"
                    : estadoSeguro === "cancelado" || seguroInfo.status === "cancelado"
                      ? "Cancelado"
                      : estadoSeguro || "—"}
              </span>
            </div>
            <div className="cliente-detalhe-seguro-grid">
              <div className="cliente-detalhe-seguro-item">
                <span><FaFileAlt /> Kit</span>
                <strong>{seguroInfo.apolice_kit || "—"}</strong>
              </div>
              <div className="cliente-detalhe-seguro-item">
                <span><FaCalendarAlt /> Emissão / Validade</span>
                <strong>
                  {seguroInfo.data_emissao
                    ? new Date(seguroInfo.data_emissao).toLocaleDateString("pt-MZ")
                    : "—"}{" "}
                  · {seguroInfo.validade_meses || "—"} meses
                </strong>
              </div>
              <div className="cliente-detalhe-seguro-item">
                <span><FaMoneyBillWave /> Prémio</span>
                <strong>
                  {seguroInfo.premio_calculado != null
                    ? `${parseFloat(seguroInfo.premio_calculado).toLocaleString("pt-MZ")} MZN`
                    : "—"}
                </strong>
              </div>
              <div className="cliente-detalhe-seguro-item">
                <span><FaCar /> Veículo</span>
                <strong>
                  {[seguroInfo.viatura?.marca, seguroInfo.viatura?.modelo]
                    .filter(Boolean)
                    .join(" ") || "—"}
                  {seguroInfo.viatura?.matricula
                    ? ` · ${seguroInfo.viatura.matricula}`
                    : ""}
                </strong>
              </div>
              <div className="cliente-detalhe-seguro-item">
                <span><FaUserTie /> Agente</span>
                <strong>
                  {seguroInfo.agente?.nome || "—"}
                  {seguroInfo.agente?.telefone
                    ? ` · ${seguroInfo.agente.telefone}`
                    : ""}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="cliente-detalhe-section cliente-detalhe-veiculos">
        <div className="cliente-detalhe-veiculos-head">
          <h2 className="cliente-detalhe-section-title">
            <FaCar /> Veículos
            {viaturas.length > 0 && (
              <span className="cliente-detalhe-veiculos-count">{viaturas.length}</span>
            )}
          </h2>
          {viaturas.length > 0 && (
            <button
              type="button"
              className="cliente-detalhe-btn primary cliente-detalhe-download-zip"
              onClick={baixarTodasImagensZip}
              disabled={baixandoImagens}
            >
              <FaDownload className={baixandoImagens ? "girando" : ""} />
              {baixandoImagens ? "A preparar ZIP..." : "Baixar todas as imagens (ZIP)"}
            </button>
          )}
        </div>

        {viaturas.length > 0 ? (
          <div className="cliente-detalhe-veiculos-lista">
            {viaturas.map((v) => {
              const imagens = downloadService.extrairImagensViatura(v);
              return (
                <article key={v.id} className="cliente-detalhe-veiculo-card">
                  <header className="cliente-detalhe-veiculo-card-header">
                    <div className="cliente-detalhe-veiculo-titulo">
                      <span className="cliente-detalhe-veiculo-id">
                        <FaHashtag /> {v.id}
                      </span>
                      <h3>
                        {v.marca || "—"} {v.modelo || ""}
                      </h3>
                      <span className="cliente-detalhe-veiculo-matricula">
                        {v.matricula || "Sem matrícula"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {podeEditar && (
                        <button
                          type="button"
                          className="cliente-detalhe-btn secondary"
                          style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                          onClick={() =>
                            navigate(
                              `/imperial/dashboard/viaturas/editar/${v.id}?cliente=${id}`
                            )
                          }
                        >
                          <FaEdit /> Editar
                        </button>
                      )}
                      <div className="cliente-detalhe-veiculo-ano">
                        {v.ano_fabricacao || "—"}
                      </div>
                    </div>
                  </header>

                  <div className="cliente-detalhe-veiculo-grid">
                    <div className="cliente-detalhe-veiculo-campo">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaCog /> Nº Chassis
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor">
                        {v.numero_chassis || "—"}
                      </span>
                    </div>
                    <div className="cliente-detalhe-veiculo-campo">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaCog /> Nº Motor
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor">
                        {v.numero_motor || "—"}
                      </span>
                    </div>
                    <div className="cliente-detalhe-veiculo-campo cliente-detalhe-veiculo-campo--wide">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaShieldAlt /> Classificação
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor">
                        {v.classificacao?.nome_classificacao || "—"}
                      </span>
                    </div>
                    <div className="cliente-detalhe-veiculo-campo cliente-detalhe-veiculo-campo--wide">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaShieldAlt /> Tipo Cobertura
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor">
                        {v.tipo_cobertura?.nome_cobertura || "—"}
                      </span>
                    </div>
                    <div className="cliente-detalhe-veiculo-campo">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaMoneyBillWave /> Valor
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor cliente-detalhe-veiculo-valor">
                        {v.valor_viatura
                          ? `${parseFloat(v.valor_viatura).toLocaleString("pt-MZ")} MZN`
                          : "—"}
                      </span>
                    </div>
                    <div className="cliente-detalhe-veiculo-campo">
                      <span className="cliente-detalhe-veiculo-campo-label">
                        <FaImage /> Fotos
                      </span>
                      <span className="cliente-detalhe-veiculo-campo-valor">
                        {imagens.length} imagem{imagens.length === 1 ? "" : "ns"}
                      </span>
                    </div>
                  </div>

                  <div className="cliente-detalhe-veiculo-galeria">
                    <div className="cliente-detalhe-veiculo-galeria-titulo">
                      <FaImage /> Galeria de imagens
                      {podeEditar && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            ref={(el) => {
                              fileInputRefs.current[v.id] = el;
                            }}
                            onChange={(e) =>
                              uploadImagensViatura(v.id, e.target.files)
                            }
                          />
                          <button
                            type="button"
                            className="cliente-detalhe-btn primary"
                            style={{ marginLeft: "auto", fontSize: "0.8rem", padding: "6px 10px" }}
                            disabled={uploadingViaturaId === v.id}
                            onClick={() => fileInputRefs.current[v.id]?.click()}
                          >
                            <FaUpload />{" "}
                            {uploadingViaturaId === v.id
                              ? "A enviar…"
                              : "Carregar imagens"}
                          </button>
                        </>
                      )}
                    </div>
                    {renderizarImagensViatura(v)}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="cliente-detalhe-empty">
            <FaCar />
            <p>Nenhum veículo registado para este cliente.</p>
          </div>
        )}
      </section>

      {imagemModal.aberto && imagemModal.imagens.length > 0 && (
        <div
          className="cliente-detalhe-lightbox-overlay"
          onClick={fecharLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Imagem ampliada"
        >
          <div className="cliente-detalhe-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="cliente-detalhe-lightbox-header">
              <div className="cliente-detalhe-lightbox-actions">
                <button
                  type="button"
                  className="cliente-detalhe-lightbox-botao-download"
                  title="Baixar esta imagem"
                  onClick={async () => {
                    const url = urlImagem(imagemModal.imagens[imagemModal.indice], baseURL);
                    const nome = `imagem_${imagemModal.indice + 1}_${cliente?.nome || "cliente"}.jpg`;
                    try {
                      await downloadService.baixarImagem(url, nome);
                    } catch (err) {
                      alert("Erro ao baixar imagem.");
                    }
                  }}
                >
                  <FaDownload /> Baixar esta
                </button>
                {imagemModal.viatura && (
                  <button
                    type="button"
                    className="cliente-detalhe-lightbox-botao-download-todas"
                    disabled={baixandoImagens}
                    title="Baixar todas as imagens desta viatura"
                    onClick={async () => {
                      setBaixandoImagens(true);
                      try {
                        await downloadService.baixarTodasImagensComoZip(
                          [imagemModal.viatura],
                          `${cliente?.nome || "Cliente"}_${imagemModal.viatura.marca}_${imagemModal.viatura.modelo}`
                        );
                      } catch (err) {
                        alert("Erro ao baixar imagens da viatura.");
                      } finally {
                        setBaixandoImagens(false);
                      }
                    }}
                  >
                    <FaDownload />
                    {baixandoImagens ? "A preparar..." : "Baixar todas da viatura"}
                  </button>
                )}
              </div>
              <button type="button" className="cliente-detalhe-lightbox-fechar" onClick={fecharLightbox} aria-label="Fechar">
                <FaTimes />
              </button>
            </div>
            <div className="cliente-detalhe-lightbox-img-wrap">
              <img
                src={urlImagem(imagemModal.imagens[imagemModal.indice], baseURL)}
                alt=""
                className="cliente-detalhe-lightbox-img"
              />
            </div>
            <div className="cliente-detalhe-lightbox-nav">
              <button
                type="button"
                className="cliente-detalhe-lightbox-btn"
                disabled={imagemModal.indice === 0}
                onClick={() => setImagemModal((p) => ({ ...p, indice: Math.max(0, p.indice - 1) }))}
                aria-label="Anterior"
              >
                <FaChevronLeft />
              </button>
              <span className="cliente-detalhe-lightbox-contador">
                {imagemModal.indice + 1} / {imagemModal.imagens.length}
              </span>
              <button
                type="button"
                className="cliente-detalhe-lightbox-btn"
                disabled={imagemModal.indice >= imagemModal.imagens.length - 1}
                onClick={() => setImagemModal((p) => ({ ...p, indice: Math.min(p.imagens.length - 1, p.indice + 1) }))}
                aria-label="Próxima"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cliente-detalhe-actions">
        <button type="button" className="cliente-detalhe-btn secondary" onClick={() => navigate("/imperial/dashboard/clientes")}>
          <FaArrowLeft /> Voltar à lista
        </button>
          {podeEditar && (
            <button type="button" className="cliente-detalhe-btn primary" onClick={() => navigate(`/imperial/dashboard/clientes/editar/${id}`)}>
              <FaEdit /> Editar cliente
            </button>
          )}
      </div>
    </div>
  );
}
