import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { pngDoLogo } from "../services/logoDocumento";
import {
  FaCheckCircle,
  FaBan,
  FaDownload,
  FaExclamationTriangle,
  FaFileInvoice,
  FaHistory,
  FaSearch,
  FaSync,
  FaTrash,
  FaFileAlt,
  FaUser,
  FaPhone,
  FaCar,
  FaShieldAlt,
  FaMoneyBillWave,
  FaClock,
  FaCreditCard,
  FaBolt,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaHashtag,
  FaUserShield,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import SistemaSelect from "../components/SistemaSelect/SistemaSelect";
import api from "../services/api";
import "./AtivacoesManuais.css";

const ITENS_POR_PAGINA = 10;

const dinheiro = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MZN`;

const dataHora = (valor) => {
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-PT");
};

const criarRecibo = async ({ seguro, pagamento, log }) => {
  const cliente = seguro?.cliente || log?.seguro?.cliente || {};
  const referencia =
    pagamento?.referencia || log?.referencia_pagamento || "—";
  const valor = pagamento?.valor ?? log?.valor ?? seguro?.premio_calculado;
  const apolice = seguro?.numero_apolice || log?.seguro?.numero_apolice || "—";
  const administrador =
    log?.admin_nome || pagamento?.confirmado_por_nome || "Administrador";
  const data = log?.criado_em || pagamento?.criado_em || new Date();

  const doc = new jsPDF();
  const logo = await pngDoLogo();
  if (logo) doc.addImage(logo, "PNG", 20, 10, 36, 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 77, 58);
  doc.setFontSize(20);
  doc.text("SISTEMA DE MICROCRÉDITO", 105, 24, { align: "center" });
  doc.setFontSize(15);
  doc.text("RECIBO DE PAGAMENTO MANUAL", 105, 35, { align: "center" });

  doc.setDrawColor(14, 77, 58);
  doc.line(20, 42, 190, 42);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const linhas = [
    ["Apólice", apolice],
    ["Cliente", cliente.nome || "—"],
    ["Contacto", cliente.contacto || "—"],
    ["Valor pago", dinheiro(valor)],
    ["Referência", referencia],
    ["Método", "Activação manual de emergência"],
    ["Estado", "Pago / Seguro activo"],
    ["Data", dataHora(data)],
    ["Activado por", administrador],
  ];

  let y = 55;
  linhas.forEach(([titulo, valorLinha]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${titulo}:`, 25, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(valorLinha), 68, y);
    y += 10;
  });

  doc.setDrawColor(210, 220, 216);
  doc.line(20, y + 3, 190, y + 3);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 96);
  doc.text(
    "Documento emitido pelo fluxo administrativo de emergência. A operação está registada no relatório de auditoria.",
    105,
    y + 15,
    { align: "center", maxWidth: 165 }
  );

  return doc;
};

const AtivacoesManuais = () => {
  const [seguros, setSeguros] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aba, setAba] = useState("pendentes");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPagamento, setFiltroPagamento] = useState("todos");
  const [pesquisaLogs, setPesquisaLogs] = useState("");
  const [paginaSeguros, setPaginaSeguros] = useState(1);
  const [paginaLogs, setPaginaLogs] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [acao, setAcao] = useState("ativar");
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      setCarregando(true);
      const [resSeguros, resLogs] = await Promise.all([
        api.get("/api/ativacoes-manuais/seguros"),
        api.get("/api/ativacoes-manuais/logs"),
      ]);
      setSeguros(resSeguros.data?.seguros || []);
      setLogs(Array.isArray(resLogs.data) ? resLogs.data : []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar a área de activações manuais."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPaginaSeguros(1);
  }, [pesquisa, filtroStatus, filtroPagamento]);

  useEffect(() => {
    setPaginaLogs(1);
  }, [pesquisaLogs]);

  const segurosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return seguros.filter((seguro) => {
      const matchTexto =
        !termo ||
        [
          seguro.numero_apolice,
          seguro.cliente?.nome,
          seguro.cliente?.contacto,
          seguro.viatura?.matricula,
          seguro.agente?.nome,
          seguro.viatura?.tipo_cobertura?.nome_cobertura,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo));

      const statusPag = seguro.ultimo_pagamento?.estado || "nenhum";
      const matchStatus =
        filtroStatus === "todos" || seguro.status === filtroStatus;
      const matchPag =
        filtroPagamento === "todos" || statusPag === filtroPagamento;

      return matchTexto && matchStatus && matchPag;
    });
  }, [pesquisa, seguros, filtroStatus, filtroPagamento]);

  const logsFiltrados = useMemo(() => {
    const termo = pesquisaLogs.trim().toLowerCase();
    if (!termo) return logs;
    return logs.filter((log) =>
      [
        log.seguro?.numero_apolice,
        log.seguro_numero_apolice,
        log.seguro?.cliente?.nome,
        log.cliente_nome,
        log.admin_nome,
        log.referencia_pagamento,
        log.motivo,
        log.acao,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termo))
    );
  }, [logs, pesquisaLogs]);

  const totalPaginasSeguros = Math.max(
    1,
    Math.ceil(segurosFiltrados.length / ITENS_POR_PAGINA)
  );
  const totalPaginasLogs = Math.max(
    1,
    Math.ceil(logsFiltrados.length / ITENS_POR_PAGINA)
  );

  const segurosPagina = useMemo(() => {
    const inicio = (paginaSeguros - 1) * ITENS_POR_PAGINA;
    return segurosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [segurosFiltrados, paginaSeguros]);

  const logsPagina = useMemo(() => {
    const inicio = (paginaLogs - 1) * ITENS_POR_PAGINA;
    return logsFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [logsFiltrados, paginaLogs]);

  const stats = useMemo(() => {
    const pendentes = seguros.filter((s) => s.status === "pendente").length;
    const activos = seguros.filter((s) => s.status === "ativo").length;
    const falhas = seguros.filter(
      (s) => s.ultimo_pagamento?.estado === "falhou"
    ).length;
    return { pendentes, activos, falhas, total: seguros.length };
  }, [seguros]);

  const confirmarAcao = async () => {
    if (!selecionado || motivo.trim().length < 10) {
      setErro("Informe uma justificativa com pelo menos 10 caracteres.");
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      const urlBase = `/api/ativacoes-manuais/seguros/${selecionado.id}`;
      const { data } =
        acao === "apagar"
          ? await api.delete(urlBase, { data: { motivo: motivo.trim() } })
          : await api.post(`${urlBase}/${acao}`, { motivo: motivo.trim() });

      if (acao === "ativar") {
        const doc = await criarRecibo({
          seguro: data.seguro || selecionado,
          pagamento: data.pagamento,
          log: data.log,
        });
        doc.save(
          `recibo-manual-${selecionado.numero_apolice || selecionado.id}.pdf`
        );
      }

      setSelecionado(null);
      setMotivo("");
      carregar();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem || "Erro ao executar a operação."
      );
    } finally {
      setProcessando(false);
    }
  };

  const descarregarRecibo = async (log) => {
    const doc = await criarRecibo({ seguro: log.seguro, pagamento: log.pagamento, log });
    doc.save(
      `recibo-manual-${log.seguro?.numero_apolice || log.seguro_id}.pdf`
    );
  };

  const exportarCsv = async () => {
    try {
      const res = await api.get("/api/ativacoes-manuais/logs/exportar", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-ativacoes-manuais-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setErro("Erro ao exportar CSV dos logs.");
    }
  };

  if (carregando) {
    return (
      <div className="am-page">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="am-page">
      <div className="am-hero">
        <div className="am-hero-bg" aria-hidden="true" />
        <div className="am-hero-content">
          <div className="am-hero-text">
            <span className="am-hero-kicker">
              <FaBolt /> Emergência operacional
            </span>
            <h1>Activações Manuais de Emergência</h1>
            <p>
              Active seguros pendentes/com falha e emita recibo ao cliente
              imediatamente. Todas as operações ficam registadas.
            </p>
          </div>
          <div className="am-hero-actions">
            <button type="button" className="am-btn am-btn-ghost" onClick={carregar}>
              <FaSync /> Atualizar
            </button>
            <button
              type="button"
              className="am-btn am-btn-light"
              onClick={exportarCsv}
            >
              <FaDownload /> Exportar Logs CSV
            </button>
          </div>
        </div>
        <div className="am-stats">
          <div className="am-stat" style={{ animationDelay: "60ms" }}>
            <FaFileAlt />
            <div>
              <strong>{stats.total}</strong>
              <span>Seguros</span>
            </div>
          </div>
          <div className="am-stat" style={{ animationDelay: "120ms" }}>
            <FaClock />
            <div>
              <strong>{stats.pendentes}</strong>
              <span>Pendentes</span>
            </div>
          </div>
          <div className="am-stat" style={{ animationDelay: "180ms" }}>
            <FaCheckCircle />
            <div>
              <strong>{stats.activos}</strong>
              <span>Activos</span>
            </div>
          </div>
          <div className="am-stat" style={{ animationDelay: "240ms" }}>
            <FaExclamationTriangle />
            <div>
              <strong>{stats.falhas}</strong>
              <span>Pag. falhou</span>
            </div>
          </div>
        </div>
      </div>

      {erro && <div className="am-alert">{erro}</div>}

      <div className="am-tabs">
        <button
          type="button"
          className={`am-tab ${aba === "pendentes" ? "am-tab-active" : ""}`}
          onClick={() => setAba("pendentes")}
        >
          <FaShieldAlt /> Gerir Seguros ({seguros.length})
        </button>
        <button
          type="button"
          className={`am-tab ${aba === "logs" ? "am-tab-active" : ""}`}
          onClick={() => setAba("logs")}
        >
          <FaHistory /> Relatório de Logs ({logs.length})
        </button>
      </div>

      {aba === "pendentes" && (
        <>
          <div className="am-filters">
            <div className="am-search-bar">
              <FaSearch className="am-search-icon" />
              <input
                type="text"
                placeholder="Pesquisar por apólice, cliente, matrícula ou agente…"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
            <div className="am-filter-group">
              <FaFilter />
              <SistemaSelect
                aria-label="Filtrar estado do seguro"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                options={[
                  { value: "todos", label: "Todos os estados" },
                  { value: "pendente", label: "Pendente" },
                  { value: "ativo", label: "Activo" },
                  { value: "cancelado", label: "Cancelado" },
                ]}
              />
            </div>
            <div className="am-filter-group">
              <FaCreditCard />
              <SistemaSelect
                aria-label="Filtrar estado do pagamento"
                value={filtroPagamento}
                onChange={(e) => setFiltroPagamento(e.target.value)}
                options={[
                  { value: "todos", label: "Todos os pagamentos" },
                  { value: "pago", label: "Pago" },
                  { value: "pendente", label: "Pendente" },
                  { value: "falhou", label: "Falhou" },
                  { value: "nenhum", label: "Sem pagamento" },
                ]}
              />
            </div>
          </div>

          {segurosFiltrados.length === 0 ? (
            <div className="am-empty">
              <FaShieldAlt />
              <p>
                {seguros.length === 0
                  ? "Nenhum seguro pendente ou com falha encontrado."
                  : "Nenhum resultado para estes filtros."}
              </p>
            </div>
          ) : (
            <>
              <div className="am-table-wrap">
                <div className="am-table-scroll">
                  <table className="am-table" key={`seg-${paginaSeguros}`}>
                    <thead>
                      <tr>
                        <th><FaFileAlt /> Apólice</th>
                        <th><FaUser /> Cliente</th>
                        <th><FaPhone /> Contacto</th>
                        <th><FaCar /> Matrícula</th>
                        <th><FaShieldAlt /> Cobertura</th>
                        <th><FaMoneyBillWave /> Prémio</th>
                        <th><FaClock /> Estado seguro</th>
                        <th><FaCreditCard /> Estado pag.</th>
                        <th><FaClock /> Data emissão</th>
                        <th>Acção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segurosPagina.map((seguro, idx) => (
                        <tr
                          key={seguro.id}
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <td className="am-cell-apolice" title={seguro.numero_apolice}>
                            {seguro.numero_apolice}
                          </td>
                          <td title={seguro.cliente?.nome || "—"}>
                            {seguro.cliente?.nome || "—"}
                          </td>
                          <td title={seguro.cliente?.contacto || "—"}>
                            {seguro.cliente?.contacto || "—"}
                          </td>
                          <td title={seguro.viatura?.matricula || "—"}>
                            {seguro.viatura?.matricula || "—"}
                          </td>
                          <td
                            title={
                              seguro.viatura?.tipo_cobertura?.nome_cobertura || "—"
                            }
                          >
                            {seguro.viatura?.tipo_cobertura?.nome_cobertura || "—"}
                          </td>
                          <td>{dinheiro(seguro.premio_calculado)}</td>
                          <td>
                            <span className={`am-badge am-badge-${seguro.status}`}>
                              {seguro.status}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`am-badge am-badge-${
                                seguro.ultimo_pagamento?.estado || "nenhum"
                              }`}
                            >
                              {seguro.ultimo_pagamento?.estado || "sem pagamento"}
                            </span>
                          </td>
                          <td title={dataHora(seguro.data_emissao)}>
                            {dataHora(seguro.data_emissao)}
                          </td>
                          <td className="am-cell-actions">
                            <div className="am-actions">
                              <button
                                type="button"
                                className="am-icon-btn am-icon-success"
                                disabled={seguro.status === "ativo"}
                                title={
                                  seguro.status === "ativo"
                                    ? "Já activo"
                                    : seguro.status === "cancelado"
                                      ? "Reactivar"
                                      : "Activar"
                                }
                                onClick={() => {
                                  setSelecionado(seguro);
                                  setAcao("ativar");
                                  setMotivo("");
                                  setErro("");
                                }}
                              >
                                <FaCheckCircle />
                              </button>
                              <button
                                type="button"
                                className="am-icon-btn am-icon-warning"
                                disabled={seguro.status === "cancelado"}
                                title="Desactivar"
                                onClick={() => {
                                  setSelecionado(seguro);
                                  setAcao("desativar");
                                  setMotivo("");
                                  setErro("");
                                }}
                              >
                                <FaBan />
                              </button>
                              <button
                                type="button"
                                className="am-icon-btn am-icon-danger"
                                title="Apagar"
                                onClick={() => {
                                  setSelecionado(seguro);
                                  setAcao("apagar");
                                  setMotivo("");
                                  setErro("");
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="am-pagination">
                <button
                  type="button"
                  className="am-pagination-btn"
                  disabled={paginaSeguros <= 1}
                  onClick={() => setPaginaSeguros((p) => Math.max(1, p - 1))}
                >
                  <FaChevronLeft /> Anterior
                </button>
                <span className="am-pagination-info">
                  Página {paginaSeguros} de {totalPaginasSeguros} ·{" "}
                  {segurosFiltrados.length} registos
                </span>
                <button
                  type="button"
                  className="am-pagination-btn"
                  disabled={paginaSeguros >= totalPaginasSeguros}
                  onClick={() =>
                    setPaginaSeguros((p) =>
                      Math.min(totalPaginasSeguros, p + 1)
                    )
                  }
                >
                  Seguinte <FaChevronRight />
                </button>
              </div>
            </>
          )}
        </>
      )}

      {aba === "logs" && (
        <>
          <div className="am-filters">
            <div className="am-search-bar">
              <FaSearch className="am-search-icon" />
              <input
                type="text"
                placeholder="Pesquisar logs por apólice, cliente, admin ou motivo…"
                value={pesquisaLogs}
                onChange={(e) => setPesquisaLogs(e.target.value)}
              />
            </div>
          </div>

          {logsFiltrados.length === 0 ? (
            <div className="am-empty">
              <FaHistory />
              <p>Nenhuma activação manual registada.</p>
            </div>
          ) : (
            <>
              <div className="am-table-wrap">
                <div className="am-table-scroll">
                  <table className="am-table" key={`log-${paginaLogs}`}>
                    <thead>
                      <tr>
                        <th><FaHashtag /> #</th>
                        <th><FaBolt /> Acção</th>
                        <th><FaFileAlt /> Apólice</th>
                        <th><FaUser /> Cliente</th>
                        <th><FaUserShield /> Administrador</th>
                        <th><FaMoneyBillWave /> Valor</th>
                        <th><FaCreditCard /> Referência</th>
                        <th><FaFileAlt /> Motivo</th>
                        <th><FaClock /> Data</th>
                        <th><FaFileInvoice /> Recibo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsPagina.map((log, idx) => (
                        <tr key={log.id} style={{ animationDelay: `${idx * 40}ms` }}>
                          <td>{log.id}</td>
                          <td>
                            <span className={`am-badge am-badge-${log.acao || "ativar"}`}>
                              {log.acao || "ativar"}
                            </span>
                          </td>
                          <td
                            className="am-cell-apolice"
                            title={
                              log.seguro?.numero_apolice ||
                              log.seguro_numero_apolice ||
                              "—"
                            }
                          >
                            {log.seguro?.numero_apolice ||
                              log.seguro_numero_apolice ||
                              "—"}
                          </td>
                          <td
                            title={
                              log.seguro?.cliente?.nome || log.cliente_nome || "—"
                            }
                          >
                            {log.seguro?.cliente?.nome || log.cliente_nome || "—"}
                          </td>
                          <td title={log.admin_nome}>{log.admin_nome}</td>
                          <td>{dinheiro(log.valor)}</td>
                          <td title={log.referencia_pagamento || "—"}>
                            {log.referencia_pagamento || "—"}
                          </td>
                          <td className="am-cell-motivo" title={log.motivo}>
                            {log.motivo}
                          </td>
                          <td title={dataHora(log.criado_em)}>
                            {dataHora(log.criado_em)}
                          </td>
                          <td className="am-cell-actions">
                            {(log.acao || "ativar") === "ativar" ? (
                              <button
                                type="button"
                                className="am-icon-btn am-icon-secondary"
                                title="Descarregar recibo PDF"
                                onClick={() => descarregarRecibo(log)}
                              >
                                <FaFileInvoice />
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="am-pagination">
                <button
                  type="button"
                  className="am-pagination-btn"
                  disabled={paginaLogs <= 1}
                  onClick={() => setPaginaLogs((p) => Math.max(1, p - 1))}
                >
                  <FaChevronLeft /> Anterior
                </button>
                <span className="am-pagination-info">
                  Página {paginaLogs} de {totalPaginasLogs} ·{" "}
                  {logsFiltrados.length} registos
                </span>
                <button
                  type="button"
                  className="am-pagination-btn"
                  disabled={paginaLogs >= totalPaginasLogs}
                  onClick={() =>
                    setPaginaLogs((p) => Math.min(totalPaginasLogs, p + 1))
                  }
                >
                  Seguinte <FaChevronRight />
                </button>
              </div>
            </>
          )}
        </>
      )}

      {selecionado && (
        <div className="am-modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="am-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              Confirmar{" "}
              {acao === "ativar"
                ? selecionado.status === "cancelado"
                  ? "reactivação"
                  : "activação"
                : acao === "desativar"
                  ? "desactivação"
                  : "exclusão"}{" "}
              manual
            </h2>
            <p className="am-modal-sub">
              Está prestes a{" "}
              {acao === "ativar"
                ? selecionado.status === "cancelado"
                  ? "reactivar"
                  : "activar"
                : acao === "desativar"
                  ? "desactivar"
                  : "apagar"}{" "}
              o seguro <strong>{selecionado.numero_apolice}</strong> do cliente{" "}
              <strong>{selecionado.cliente?.nome}</strong> com prémio de{" "}
              <strong>{dinheiro(selecionado.premio_calculado)}</strong>.
            </p>
            <p className="am-modal-warn">
              <FaExclamationTriangle /> Esta operação ficará registada
              permanentemente no log de auditoria com a sua identificação.
            </p>
            {acao === "apagar" && (
              <p className="am-modal-danger">
                A exclusão só será aceite se o seguro não possuir pagamentos.
                Caso exista histórico financeiro, utilize Desactivar.
              </p>
            )}
            <label className="am-label">
              Justificativa / Motivo de emergência *
            </label>
            <textarea
              className="am-textarea"
              rows={3}
              placeholder="Descreva brevemente o motivo desta operação (mín. 10 caracteres)…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div className="am-modal-actions">
              <button
                type="button"
                className="am-btn am-btn-secondary"
                onClick={() => setSelecionado(null)}
                disabled={processando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`am-btn ${
                  acao === "ativar" ? "am-btn-success" : "am-btn-danger"
                }`}
                onClick={confirmarAcao}
                disabled={processando || motivo.trim().length < 10}
              >
                {processando
                  ? "A processar…"
                  : acao === "ativar"
                    ? "Confirmar activação e gerar recibo"
                    : acao === "desativar"
                      ? "Confirmar desactivação"
                      : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtivacoesManuais;
