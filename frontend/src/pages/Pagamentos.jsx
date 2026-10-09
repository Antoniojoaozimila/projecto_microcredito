import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaDollarSign,
  FaSync,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheck,
  FaFilePdf,
  FaCalendar,
  FaUser,
  FaCreditCard,
  FaMoneyBillWave,
  FaMobile,
  FaCashRegister,
  FaImage,
  FaFileAlt,
  FaChevronDown,
  FaFilter,
} from "react-icons/fa";
import api from "../services/api";
import PageLoader from "../components/PageLoader/PageLoader";
import { AuthContext } from "../contexts/AuthContext";
import { pngDoLogo } from "../services/logoDocumento";
import "./Pagamentos.css";

const cacheService = {
  CACHE_KEYS: { PAGAMENTOS: "pagamentos_cache" },
  CACHE_EXPIRY: 5 * 60 * 1000,
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  },
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > this.CACHE_EXPIRY) {
        this.remove(key);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },
};

const formatarData = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("pt-PT") + " " + date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

const formatarValor = (v) => {
  if (v == null) return "0 MZN";
  return `${Number(v).toLocaleString("pt-PT")} MZN`;
};

const metodoLabel = (m) => ({ mpesa: "M-Pesa", mmola: "M-Mola", pos: "POS", emola: "E-Mola", numerario: "Numerário", manual: "Activação Manual" }[m] || m);

const Pagamentos = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const isAdmin = String(usuario?.tipo || "").toLowerCase() === "admin";
  const [pagamentos, setPagamentos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [usandoCache, setUsandoCache] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [modalComprovativo, setModalComprovativo] = useState({ aberto: false, url: null, tipo: null });
  const [filtroPdf, setFiltroPdf] = useState("todos");
  const [mostrarFiltroPdf, setMostrarFiltroPdf] = useState(false);
  const pdfRef = useRef(null);
  const itensPorPagina = 10;

  const fetchPagamentos = async (forcar = false) => {
    setCarregando(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setPagamentos([]);
      setCarregando(false);
      return;
    }
    try {
      // Se forçar atualização, limpar cache primeiro
      if (forcar) {
        cacheService.remove(cacheService.CACHE_KEYS.PAGAMENTOS);
      }
      
      let data = !forcar ? cacheService.get(cacheService.CACHE_KEYS.PAGAMENTOS) : null;
      if (data) {
        // Verificar se os dados do cache têm a estrutura esperada (com apolice_kit)
        const primeiroItem = data[0];
        if (primeiroItem && !('apolice_kit' in primeiroItem)) {
          // Cache antigo sem apolice_kit, forçar nova busca
          console.log("🔄 Cache antigo detectado, buscando dados atualizados...");
          cacheService.remove(cacheService.CACHE_KEYS.PAGAMENTOS);
          data = null;
        } else {
          setUsandoCache(true);
        }
      }
      
      if (!data) {
        console.log("🔍 ========== FRONTEND: BUSCANDO PAGAMENTOS ==========");
        const res = await api.get("/api/pagamentos");
        data = Array.isArray(res.data) ? res.data : [];
        console.log(`📊 Total de pagamentos recebidos: ${data.length}`);
        
        // DEBUG DETALHADO: Verificar estrutura dos dados recebidos
        if (data.length > 0) {
          console.log("🔍 DEBUG - Primeiro pagamento recebido:");
          console.log("  - ID:", data[0].id);
          console.log("  - numero_apolice:", data[0].numero_apolice);
          console.log("  - apolice_kit:", data[0].apolice_kit);
          console.log("  - apolice_kit tipo:", typeof data[0].apolice_kit);
          console.log("  - apolice_kit === null?", data[0].apolice_kit === null);
          console.log("  - apolice_kit === undefined?", data[0].apolice_kit === undefined);
          console.log("  - Chaves do objeto:", Object.keys(data[0]));
          console.log("  - 'apolice_kit' in objeto?", 'apolice_kit' in data[0]);
          console.log("  - Objeto completo (primeiro):", JSON.stringify(data[0], null, 2));
          
          // Verificar múltiplos pagamentos
          console.log("\n🔍 DEBUG - Verificando primeiros 5 pagamentos:");
          data.slice(0, 5).forEach((p, idx) => {
            console.log(`  Pagamento #${idx + 1} (ID: ${p.id}):`);
            console.log(`    - numero_apolice: ${p.numero_apolice}`);
            console.log(`    - apolice_kit: ${p.apolice_kit} (tipo: ${typeof p.apolice_kit})`);
            console.log(`    - apolice_kit existe? ${'apolice_kit' in p}`);
          });
        } else {
          console.log("⚠️ Nenhum pagamento recebido!");
        }
        
        cacheService.set(cacheService.CACHE_KEYS.PAGAMENTOS, data);
        setUsandoCache(false);
        console.log("✅ ========== FRONTEND: DADOS PROCESSADOS ==========");
      }
      setPagamentos(data);
    } catch (err) {
      console.error("❌ Erro ao buscar pagamentos:", err);
      setPagamentos([]);
    }
    setCarregando(false);
  };

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const confirmarPagamento = async (id) => {
    if (!window.confirm("Tem a certeza que deseja confirmar este pagamento? Esta acção não pode ser revertida facilmente.")) {
      return;
    }
    setConfirmandoId(id);
    try {
      const res = await api.post("/api/pagamentos/confirmar", { pagamento_id: id });
      if (res.data?.success) {
        const pagamentoAtualizado = res.data?.data;
        setPagamentos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  estado: "pago",
                  confirmacao: "confirmado",
                  confirmado_por_usuario_id:
                    pagamentoAtualizado?.confirmado_por_usuario_id ?? p.confirmado_por_usuario_id ?? null,
                  confirmado_por_nome:
                    pagamentoAtualizado?.confirmado_por_nome ?? p.confirmado_por_nome ?? "N/A",
                }
              : p
          )
        );
        cacheService.remove(cacheService.CACHE_KEYS.PAGAMENTOS);
      }
    } catch (e) {
      alert("Erro ao confirmar: " + (e.response?.data?.message || e.message));
    }
    setConfirmandoId(null);
  };

  const abrirComprovativo = (comprovativo) => {
    if (!comprovativo || String(comprovativo).trim() === "" || String(comprovativo) === "Pagamento efectuado com sucesso" || String(comprovativo) === "N/A") {
      return;
    }
    const comprovStr = String(comprovativo);
    if (comprovStr.startsWith("http://") || comprovStr.startsWith("https://")) {
      window.open(comprovStr, "_blank", "noopener,noreferrer");
    } else if (comprovStr.startsWith("data:")) {
      setModalComprovativo({ aberto: true, url: comprovStr, tipo: "data" });
    } else if (comprovStr.includes("/") || comprovStr.includes("\\")) {
      // É um caminho de arquivo
      const baseURL = api.defaults.baseURL || "";
      const urlCompleta = comprovStr.startsWith("/") 
        ? `${baseURL}${comprovStr}` 
        : `${baseURL}/uploads/${comprovStr}`;
      setModalComprovativo({ aberto: true, url: urlCompleta, tipo: "url" });
    } else {
      // Pode ser texto ou JSON
      try {
        const parsed = JSON.parse(comprovStr);
        alert("Comprovativo: " + JSON.stringify(parsed, null, 2));
      } catch {
        alert("Comprovativo: " + comprovStr);
      }
    }
  };

  const pagamentosFiltrados = pagamentos.filter(
    (p) =>
      !filtro ||
      [p.nome_cliente, p.referencia, p.referencia_mpesa, p.nome_agente, p.numero_apolice, p.apolice_kit].some(
        (v) => String(v || "").toLowerCase().includes(filtro.toLowerCase())
      )
  );
  const totalPaginas = Math.ceil(pagamentosFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const pagamentosPagina = pagamentosFiltrados.slice(inicio, inicio + itensPorPagina);

  const gerarPDF = async () => {
    try {
      const res = await api.get("/api/pagamentos");
      const listaCompleta = Array.isArray(res.data) ? res.data : [];
      
      // Aplicar filtro de texto
      let filtrados = !filtro
        ? listaCompleta
        : listaCompleta.filter((p) =>
            [p.nome_cliente, p.referencia, p.referencia_mpesa, p.nome_agente, p.numero_apolice, p.apolice_kit].some((v) =>
              String(v || "").toLowerCase().includes(filtro.toLowerCase())
            )
          );
      
      // Aplicar filtro de estado para PDF
      if (filtroPdf !== "todos") {
        filtrados = filtrados.filter((p) => {
          switch (filtroPdf) {
            case "confirmados":
              // Confirmados = pagamentos cuja acao foi confirmada manualmente
              return p.confirmacao === "confirmado";
            case "nao_confirmados":
              return p.confirmacao !== "confirmado";
            case "pendentes":
              return p.estado === "pendente";
            case "falha":
              return p.estado === "falhou";
            default:
              return true;
          }
        });
      }

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = 10;

      try {
        const logoPdf = await pngDoLogo();
        if (logoPdf) doc.addImage(logoPdf, "PNG", margin, y, 28, 14);
      } catch (_) {}
      y += 18;
      doc.setFontSize(14);
      doc.setTextColor(16, 106, 55);
      doc.text("Relatório de Pagamentos - Imperial Insurance", pageW / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const filtroLabel = {
        todos: "Todos",
        confirmados: "Confirmados",
        nao_confirmados: "Não Confirmados",
        pendentes: "Pendentes",
        falha: "Falha"
      }[filtroPdf] || "Todos";
      doc.text(`Gerado em ${new Date().toLocaleString("pt-PT")}  |  Filtro: ${filtroLabel}  |  Total: ${filtrados.length} registos`, pageW / 2, y, { align: "center" });
      y += 12;

      const colWidths = [8, 25, 20, 18, 20, 18, 10, 20, 18, 20, 18, 28];
      const headers = ["ID", "Cliente", "Apólice", "Apólice Kit", "Método", "Referência", "Valor", "Estado", "Comprov.", "Data criação", "Agente", "Confirmado por"];
      doc.setFillColor(16, 106, 55);
      doc.rect(margin, y, pageW - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      let x = margin + 2;
      headers.forEach((h, i) => {
        doc.text(h, x, y + 5.5);
        x += colWidths[i];
      });
      y += 10;
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const maxRowsPerPage = Math.floor((pageH - y - 16) / 6);
      let rowIndex = 0;

      filtrados.forEach((p) => {
        if (rowIndex >= maxRowsPerPage) {
          doc.addPage([pageW, pageH], "landscape");
          y = 10;
          doc.setFillColor(16, 106, 55);
          doc.rect(margin, y, pageW - 2 * margin, 8, "F");
          doc.setTextColor(255, 255, 255);
          x = margin + 2;
          headers.forEach((h, i) => {
            doc.text(h, x, y + 5.5);
            x += colWidths[i];
          });
          y += 10;
          doc.setTextColor(0, 0, 0);
          rowIndex = 0;
        }
        const comprov = p.comprovativo && String(p.comprovativo).trim() && String(p.comprovativo) !== "Pagamento efectuado com sucesso" ? "Sim" : "—";
        const row = [
          String(p.id),
          (p.nome_cliente || "—").substring(0, 12),
          (p.numero_apolice || "—").substring(0, 10),
          (p.apolice_kit || "—").substring(0, 10),
          (metodoLabel(p.metodo_pagamento || p.metodo) || "—").substring(0, 8),
          (p.referencia || "—").substring(0, 10),
          formatarValor(p.valor).substring(0, 10),
          (p.estado || "—").substring(0, 5),
          comprov,
          formatarData(p.data_criacao).substring(0, 10),
          (p.nome_agente || "—").substring(0, 12),
          (p.confirmado_por_nome || "—").substring(0, 18),
        ];
        x = margin + 2;
        row.forEach((cell, i) => {
          doc.text(cell, x, y + 4);
          x += colWidths[i];
        });
        y += 6;
        rowIndex++;
      });

      const filtroNomeArquivo = {
        todos: "todos",
        confirmados: "confirmados",
        nao_confirmados: "nao-confirmados",
        pendentes: "pendentes",
        falha: "falha"
      }[filtroPdf] || "todos";
      doc.save(`relatorio-pagamentos-${filtroNomeArquivo}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
    }
  };

  return (
    <div className="pagamentos-page">
      <header className="pagamentos-header">
        <h1 className="pagamentos-title">
          <FaDollarSign className="pagamentos-title-icon" />
          Histórico de Pagamentos
          {usandoCache && <span className="pagamentos-cache" title="Dados do cache">(Cache)</span>}
        </h1>
        <div className="pagamentos-header-actions">
          <div className="pagamentos-pdf-wrapper">
            <button 
              type="button" 
              className="pagamentos-btn-pdf" 
              onClick={gerarPDF}
            >
              <FaFilePdf /> Baixar PDF
            </button>
            <div className="pagamentos-pdf-filtro-container">
              <button
                type="button"
                className="pagamentos-btn-pdf-filtro"
                onClick={() => setMostrarFiltroPdf(!mostrarFiltroPdf)}
                title="Filtrar PDF"
              >
                <FaFilter />
                <FaChevronDown className={mostrarFiltroPdf ? "pagamentos-chevron-up" : ""} />
              </button>
              {mostrarFiltroPdf && (
                <div className="pagamentos-pdf-filtro-menu">
                  <button
                    type="button"
                    className={`pagamentos-pdf-filtro-item ${filtroPdf === "todos" ? "ativo" : ""}`}
                    onClick={() => {
                      setFiltroPdf("todos");
                      setMostrarFiltroPdf(false);
                    }}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`pagamentos-pdf-filtro-item ${filtroPdf === "confirmados" ? "ativo" : ""}`}
                    onClick={() => {
                      setFiltroPdf("confirmados");
                      setMostrarFiltroPdf(false);
                    }}
                  >
                    Confirmados
                  </button>
                  <button
                    type="button"
                    className={`pagamentos-pdf-filtro-item ${filtroPdf === "nao_confirmados" ? "ativo" : ""}`}
                    onClick={() => {
                      setFiltroPdf("nao_confirmados");
                      setMostrarFiltroPdf(false);
                    }}
                  >
                    Não Confirmados
                  </button>
                  <button
                    type="button"
                    className={`pagamentos-pdf-filtro-item ${filtroPdf === "pendentes" ? "ativo" : ""}`}
                    onClick={() => {
                      setFiltroPdf("pendentes");
                      setMostrarFiltroPdf(false);
                    }}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    className={`pagamentos-pdf-filtro-item ${filtroPdf === "falha" ? "ativo" : ""}`}
                    onClick={() => {
                      setFiltroPdf("falha");
                      setMostrarFiltroPdf(false);
                    }}
                  >
                    Falha
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pagamentos-toolbar">
        <div className="pagamentos-search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Pesquisar por cliente, referência, agente, apólice ou apólice kit..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            className="pagamentos-search"
          />
        </div>
        <button type="button" className="pagamentos-reload" disabled={carregando} onClick={() => fetchPagamentos(true)}>
          <FaSync className={carregando ? "pagamentos-spin" : ""} />
          {carregando ? "A carregar…" : "Recarregar"}
        </button>
      </div>

      <div className="pagamentos-table-wrap">
        {carregando ? (
          <PageLoader />
        ) : (
          <>
            <table className="pagamentos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Apólice Kit</th>
                  <th>Método</th>
                  <th>Referência</th>
                  <th>Ref. M-Pesa</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Comprovativo</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosPagina.map((p, idx) => {
                  // DEBUG: Logar os primeiros 3 itens renderizados
                  if (idx < 3) {
                    console.log(`🔍 RENDER - Pagamento #${idx + 1} (ID: ${p.id}):`);
                    console.log(`  - apolice_kit:`, p.apolice_kit);
                    console.log(`  - apolice_kit tipo:`, typeof p.apolice_kit);
                    console.log(`  - apolice_kit || "N/A":`, p.apolice_kit || "N/A");
                    console.log(`  - numero_apolice:`, p.numero_apolice);
                  }
                  
                  return (
                  <tr key={p.id}>
                    <td className="pagamentos-cell-id">#{p.id}</td>
                    <td className="pagamentos-cell-nowrap">
                      <span className="pagamentos-cell-valor">{p.nome_cliente || "—"}</span>
                      {p.numero_apolice ? <span className="pagamentos-cell-apolice"> · {p.numero_apolice}</span> : null}
                    </td>
                    <td className="pagamentos-cell-apolice-kit">
                      {p.apolice_kit || "N/A"}
                    </td>
                    <td>
                      {p.metodo_pagamento === "mpesa" || p.metodo === "mpesa" ? <FaMobile style={{ marginRight: 6, color: "#106a37" }} /> : null}
                      {p.metodo_pagamento === "pos" || p.metodo === "pos" ? <FaCreditCard style={{ marginRight: 6, color: "#106a37" }} /> : null}
                      {p.metodo_pagamento === "emola" || p.metodo === "emola" ? <FaMobile style={{ marginRight: 6, color: "#106a37" }} /> : null}
                      {p.metodo_pagamento === "numerario" || p.metodo === "numerario" ? <FaCashRegister style={{ marginRight: 6, color: "#106a37" }} /> : null}
                      {metodoLabel(p.metodo_pagamento || p.metodo)}
                    </td>
                    <td className="pagamentos-cell-ref">
                      <span className="pagamentos-ref-badge">{p.referencia || "—"}</span>
                    </td>
                    <td className="pagamentos-cell-ref">
                      <span className="pagamentos-ref-badge">{p.referencia_mpesa && p.referencia_mpesa !== "N/A" ? p.referencia_mpesa : "—"}</span>
                    </td>
                    <td className="pagamentos-cell-valor">{formatarValor(p.valor)}</td>
                    <td>
                      <span className={`pagamentos-badge pagamentos-badge-${(p.estado || "pendente").toLowerCase()}`}>
                        {p.estado === "pago" ? "Pago" : (p.estado || "Pendente")}
                      </span>
                    </td>
                    <td>
                      <div className="pagamentos-anexos-cell">
                        {p.comprovativo && String(p.comprovativo).trim() && String(p.comprovativo) !== "Pagamento efectuado com sucesso" && String(p.comprovativo) !== "N/A" ? (
                          <button
                            type="button"
                            className="pagamentos-btn-comprovativo"
                            onClick={() => abrirComprovativo(p.comprovativo)}
                            title="Ver comprovativo (recibo)"
                          >
                            <FaImage /> Recibo
                          </button>
                        ) : null}
                        {(p.metodo_pagamento === "pos" || p.metodo === "pos") &&
                        p.comprovativo_fecho &&
                        String(p.comprovativo_fecho).trim() ? (
                          <button
                            type="button"
                            className="pagamentos-btn-comprovativo pagamentos-btn-fecho"
                            onClick={() => abrirComprovativo(p.comprovativo_fecho)}
                            title="Ver fecho de caixa"
                          >
                            <FaCashRegister /> Fecho
                          </button>
                        ) : null}
                        {!p.comprovativo && !p.comprovativo_fecho ? (
                          <span style={{ color: "#999", fontSize: "0.85rem" }}>—</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <FaCalendar style={{ marginRight: 6, color: "#106a37", fontSize: "0.85rem" }} />
                      {formatarData(p.data_criacao)}
                    </td>
                    <td className="pagamentos-cell-actions-wrap">
                      <div className="pagamentos-cell-actions">
                        <button
                          type="button"
                          className="pagamentos-btn-view-icon"
                          title="Visualizar"
                          onClick={() => navigate("/imperial/dashboard/pagamentos/visualizar/" + p.id, { state: { pagamento: p } })}
                        >
                          <FaEye />
                        </button>
                        {p.confirmacao === "confirmado" ? (
                          <span className="pagamentos-confirmado"><FaCheck /> Confirmado</span>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            className="pagamentos-btn-confirm"
                            disabled={confirmandoId === p.id}
                            onClick={() => confirmarPagamento(p.id)}
                          >
                            <FaCheck /> {confirmandoId === p.id ? "A confirmar…" : "Confirmar"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {pagamentosPagina.length === 0 && (
              <div className="pagamentos-empty">
                <FaDollarSign className="pagamentos-empty-icon" />
                <p>Nenhum pagamento encontrado. Ajuste o filtro ou recarregue.</p>
              </div>
            )}
          </>
        )}
      </div>

      {pagamentosFiltrados.length > 0 && !carregando && (
        <div className="pagamentos-pagination">
          <button
            type="button"
            className="pagamentos-pagination-btn"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((prev) => prev - 1)}
          >
            <FaChevronLeft />
          </button>
          <span className="pagamentos-pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            className="pagamentos-pagination-btn"
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            onClick={() => setPaginaAtual((prev) => prev + 1)}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* Fechar menu de filtro PDF ao clicar fora */}
      {mostrarFiltroPdf && (
        <div 
          className="pagamentos-overlay-filtro" 
          onClick={() => setMostrarFiltroPdf(false)}
          role="presentation"
        />
      )}

      {modalComprovativo.aberto && (
        <div 
          className="pagamentos-modal-overlay" 
          onClick={() => setModalComprovativo({ aberto: false, url: null, tipo: null })}
          role="presentation"
        >
          <div className="pagamentos-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pagamentos-modal-close"
              onClick={() => setModalComprovativo({ aberto: false, url: null, tipo: null })}
              aria-label="Fechar"
            >
              ×
            </button>
            {modalComprovativo.tipo === "url" || modalComprovativo.tipo === "data" ? (
              <img src={modalComprovativo.url} alt="Comprovativo de pagamento" style={{ maxWidth: "100%", maxHeight: "90vh" }} />
            ) : (
              <div style={{ padding: "20px" }}>
                <p>{modalComprovativo.url}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagamentos;
