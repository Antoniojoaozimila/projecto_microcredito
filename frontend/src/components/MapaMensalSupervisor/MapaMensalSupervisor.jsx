import { Fragment, useContext, useEffect, useState } from "react";
import { FaFileExcel, FaSync, FaUsers } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import { pngDoLogo } from "../../services/logoDocumento";
import { AuthContext } from "../../contexts/AuthContext";
import { relatoriosService } from "../../services/relatoriosService";
import "./MapaMensalSupervisor.css";

const hoje = new Date();
const mesActual = hoje.toISOString().slice(0, 7);
const inicioMesActual = `${mesActual}-01`;
const fimMesActual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  .toISOString()
  .slice(0, 10);

const dinheiro = (valor) =>
  new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);

const dataCurta = (valor) =>
  valor
    ? new Date(`${valor}T00:00:00Z`).toLocaleDateString("pt-MZ", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      })
    : "";

const borda = {
  top: { style: "thin", color: { rgb: "808080" } },
  bottom: { style: "thin", color: { rgb: "808080" } },
  left: { style: "thin", color: { rgb: "808080" } },
  right: { style: "thin", color: { rgb: "808080" } },
};

const estilos = {
  titulo: {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1B5E20" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borda,
  },
  periodo: {
    font: { bold: true, sz: 11, color: { rgb: "1B5E20" } },
    fill: { fgColor: { rgb: "E2F0D9" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borda,
  },
  cabecalho: {
    font: { bold: true, color: { rgb: "1F1F1F" } },
    fill: { fgColor: { rgb: "FFFFCC" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borda,
  },
  quantidade: {
    font: { bold: true, color: { rgb: "1F1F1F" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borda,
  },
  texto: {
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: borda,
  },
  valor: {
    font: { color: { rgb: "1B5E20" } },
    fill: { fgColor: { rgb: "F2F2F2" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: borda,
    numFmt: '#,##0.00" MT"',
  },
  total: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "7F7F7F" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: borda,
    numFmt: '#,##0.00" MT"',
  },
};

const aplicarEstiloLinha = (folha, linha, primeiraColuna, ultimaColuna, estilo) => {
  for (let coluna = primeiraColuna; coluna <= ultimaColuna; coluna += 1) {
    const endereco = XLSX.utils.encode_cell({ r: linha, c: coluna });
    if (!folha[endereco]) folha[endereco] = { t: "s", v: "" };
    folha[endereco].s = estilo;
  }
};

const MapaMensalSupervisor = () => {
  const { usuario } = useContext(AuthContext);
  const [tipoPeriodo, setTipoPeriodo] = useState("mensal");
  const [mes, setMes] = useState(mesActual);
  const [dataInicio, setDataInicio] = useState(inicioMesActual);
  const [dataFim, setDataFim] = useState(fimMesActual);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    if (tipoPeriodo === "personalizado" && (!dataInicio || !dataFim)) {
      setErro("Informe a data de início e a data de fim.");
      return;
    }
    if (tipoPeriodo === "personalizado" && dataFim < dataInicio) {
      setErro("A data de fim não pode ser anterior à data de início.");
      return;
    }

    setCarregando(true);
    setErro("");
    try {
      const params =
        tipoPeriodo === "mensal"
          ? { mes }
          : { dataInicio, dataFim };
      setRelatorio(
        await relatoriosService.getMapaMensalSupervisor(params, usuario?.tipo || "admin")
      );
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar o relatório"
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  const exportarExcel = async () => {
    if (!relatorio?.linhas?.length) return;

    const semanas = relatorio.periodos || [];
    const ultimaColuna = semanas.length + 2;
    const linhas = [
      [""],
      [relatorio.titulo],
      [
        `Período: ${new Date(`${relatorio.data_inicio}T00:00:00Z`).toLocaleDateString(
          "pt-MZ",
          { timeZone: "UTC" }
        )} a ${new Date(`${relatorio.data_fim}T00:00:00Z`).toLocaleDateString(
          "pt-MZ",
          { timeZone: "UTC" }
        )}`,
      ],
      [],
      [
        usuario?.tipo === "supervisor"
          ? `Vendas da equipa de ${usuario.nome}`
          : "Vendas por agente e ponto de venda",
      ],
      [
        "Agente",
        "Ponto de venda - BOMBAS",
        ...semanas.map(
          (semana) =>
            `Semana ${semana.semana}\n${dataCurta(semana.data_inicio)} - ${dataCurta(
              semana.data_fim
            )}`
        ),
        "TOTAL",
      ],
    ];

    relatorio.linhas.forEach((linha) => {
      linhas.push([
        linha.agente,
        linha.ponto_venda,
        ...linha.semanas.map((semana) => semana.quantidade),
        linha.total_quantidade,
      ]);
      linhas.push([
        "",
        "",
        ...linha.semanas.map((semana) => semana.valor),
        linha.total_valor,
      ]);
    });

    linhas.push([
      "",
      "TOTAL",
      ...relatorio.totais_semanais.map((semana) => semana.valor),
      relatorio.total_valor,
    ]);

    const folha = XLSX.utils.aoa_to_sheet(linhas);
    folha["!merges"] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: ultimaColuna } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: ultimaColuna } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: ultimaColuna } },
    ];

    aplicarEstiloLinha(folha, 1, 0, ultimaColuna, estilos.titulo);
    aplicarEstiloLinha(folha, 2, 0, ultimaColuna, estilos.periodo);
    aplicarEstiloLinha(folha, 4, 0, ultimaColuna, estilos.periodo);
    aplicarEstiloLinha(folha, 5, 0, ultimaColuna, estilos.cabecalho);

    relatorio.linhas.forEach((linha, indice) => {
      const linhaQtd = 6 + indice * 2;
      const linhaValor = linhaQtd + 1;
      folha["!merges"].push(
        { s: { r: linhaQtd, c: 0 }, e: { r: linhaValor, c: 0 } },
        { s: { r: linhaQtd, c: 1 }, e: { r: linhaValor, c: 1 } }
      );

      aplicarEstiloLinha(folha, linhaQtd, 0, 1, estilos.texto);
      aplicarEstiloLinha(folha, linhaQtd, 2, ultimaColuna, estilos.quantidade);
      aplicarEstiloLinha(folha, linhaValor, 2, ultimaColuna, estilos.valor);
      // Células mescladas precisam de estilo nas duas linhas para manter bordas.
      aplicarEstiloLinha(folha, linhaValor, 0, 1, estilos.texto);
    });

    const linhaTotal = 6 + relatorio.linhas.length * 2;
    aplicarEstiloLinha(folha, linhaTotal, 0, ultimaColuna, estilos.total);

    folha["!cols"] = [
      { wch: 25 },
      { wch: 34 },
      ...semanas.map(() => ({ wch: 20 })),
      { wch: 20 },
    ];
    folha["!rows"] = [
      { hpt: 46 },
      { hpt: 28 },
      { hpt: 22 },
      { hpt: 8 },
      { hpt: 22 },
      { hpt: 35 },
    ];
    folha["!autofilter"] = {
      ref: `A6:${XLSX.utils.encode_col(ultimaColuna)}6`,
    };
    folha["!freeze"] = { xSplit: 2, ySplit: 6 };
    folha["!margins"] = {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, folha, "Relatorio semanal");
    const sufixo =
      relatorio.tipo_periodo === "mensal"
        ? relatorio.mes
        : `${relatorio.data_inicio}_${relatorio.data_fim}`;
    const bruto = XLSX.write(livro, { type: "array", bookType: "xlsx", compression: true });
    const excel = new ExcelJS.Workbook();
    await excel.xlsx.load(bruto);
    const logo = await pngDoLogo();
    const base64 = String(logo).split(",")[1];
    if (base64) {
      const imagem = excel.addImage({ base64, extension: "png" });
      excel.getWorksheet("Relatorio semanal").addImage(imagem, { tl: { col: 0.15, row: 0.1 }, ext: { width: 150, height: 46 } });
    }
    const buffer = await excel.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const ligacao = document.createElement("a");
    ligacao.href = url;
    ligacao.download = `mapa-vendas-${sufixo}.xlsx`;
    ligacao.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mapa-mensal-card">
      <header className="mapa-mensal-header">
        <div>
          <h2>
            <FaUsers /> Relatório de vendas
          </h2>
          <p>
            {usuario?.tipo === "supervisor"
              ? "O relatório contém exclusivamente os agentes vendedores da sua equipa (activas, emitidas, finalizadas e alocadas)."
              : usuario?.tipo === "subscricao" || usuario?.tipo === "admin"
                ? "Mapa global de vendas por agente vendedor e ponto de venda (activas, emitidas, finalizadas e alocadas)."
                : "Mapa de vendas por agente vendedor e ponto de venda (activas, emitidas, finalizadas e alocadas)."}
          </p>
        </div>
      </header>

      <div className="mapa-periodo-box">
        <div className="mapa-periodo-tipos">
          <button
            type="button"
            className={tipoPeriodo === "mensal" ? "activo" : ""}
            onClick={() => setTipoPeriodo("mensal")}
          >
            Mensal
          </button>
          <button
            type="button"
            className={tipoPeriodo === "personalizado" ? "activo" : ""}
            onClick={() => setTipoPeriodo("personalizado")}
          >
            Período personalizado
          </button>
        </div>

        <div className="mapa-mensal-actions">
          {tipoPeriodo === "mensal" ? (
            <label>
              Mês
              <input
                type="month"
                value={mes}
                onChange={(event) => setMes(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                Data de início
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </label>
              <label>
                Data de fim
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                />
              </label>
            </>
          )}
          <button type="button" onClick={carregar} disabled={carregando}>
            <FaSync className={carregando ? "mapa-spin" : ""} /> Gerar
          </button>
          <button
            type="button"
            className="mapa-export"
            onClick={exportarExcel}
            disabled={!relatorio?.linhas?.length || carregando}
          >
            <FaFileExcel /> Baixar Excel
          </button>
        </div>
      </div>

      {erro && <div className="mapa-alert">{erro}</div>}

      <div className="mapa-resumo">
        <span>
          <strong>{relatorio?.linhas?.length || 0}</strong> agentes
        </span>
        <span>
          <strong>{relatorio?.total_quantidade || 0}</strong> apólices (activas, emitidas, finalizadas e alocadas)
        </span>
        <span>
          <strong>{dinheiro(relatorio?.total_valor)}</strong> vendas
        </span>
      </div>

      <div className="mapa-table-wrap">
        <table className="mapa-table mapa-table-modelo">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Ponto de venda - BOMBAS</th>
              {(relatorio?.periodos || []).map((semana) => (
                <th key={semana.semana}>
                  Semana {semana.semana}
                  <small>
                    {dataCurta(semana.data_inicio)}–{dataCurta(semana.data_fim)}
                  </small>
                </th>
              ))}
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(relatorio?.linhas || []).map((linha) => (
              <Fragment key={linha.agente_id}>
                <tr>
                  <td rowSpan="2" className="mapa-agente">
                    {linha.agente}
                  </td>
                  <td rowSpan="2">{linha.ponto_venda}</td>
                  {linha.semanas.map((semana) => (
                    <td key={`${linha.agente_id}-${semana.semana}-q`}>
                      {semana.quantidade}
                    </td>
                  ))}
                  <td className="mapa-total">{linha.total_quantidade}</td>
                </tr>
                <tr className="mapa-valor-row">
                  {linha.semanas.map((semana) => (
                    <td key={`${linha.agente_id}-${semana.semana}-v`}>
                      {dinheiro(semana.valor)}
                    </td>
                  ))}
                  <td className="mapa-total">{dinheiro(linha.total_valor)}</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
          {!!relatorio?.linhas?.length && (
            <tfoot>
              <tr>
                <td colSpan="2">TOTAL</td>
                {relatorio.totais_semanais.map((semana) => (
                  <td key={semana.semana}>{dinheiro(semana.valor)}</td>
                ))}
                <td>{dinheiro(relatorio.total_valor)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        {!carregando && !relatorio?.linhas?.length && (
          <div className="mapa-empty">Não existem vendas para o período seleccionado.</div>
        )}
        {carregando && <div className="mapa-loading">A carregar relatório...</div>}
      </div>
    </section>
  );
};

export default MapaMensalSupervisor;
