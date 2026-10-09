import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import logoPadrao from "../../assets/logo.png";
import { lerConfig } from "../../services/configuracoesMicrocredito";
import { lerMarca } from "../../services/marcaSistema";
import { BRANCO, CINZA, ESCURO, L, LINHA, M, VERDE, VERDE_CLARO, VERDE_ESCURO, cabecalho } from "../emprestimos/pdfBase";

const VERDE_HEX = "4AAC05";
const VERDE_SUAVE = "EAF5E0";
const VERDE_ZEBRA = "F4FAF0";

const paraPng = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const tela = document.createElement("canvas");
      tela.width = img.naturalWidth || 1;
      tela.height = img.naturalHeight || 1;
      tela.getContext("2d").drawImage(img, 0, 0);
      resolve(tela.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

const logoActual = () => lerMarca().logo || logoPadrao;

const descarregar = (blob, nome) => {
  const url = URL.createObjectURL(blob);
  const ligacao = document.createElement("a");
  ligacao.href = url;
  ligacao.download = nome;
  ligacao.click();
  URL.revokeObjectURL(url);
  return Math.max(1, Math.round(blob.size / 1024));
};

const nomeFicheiro = (vista, ext) =>
  `${String(vista.tipo || "relatorio").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase()}.${ext}`;

const empresa = () => lerConfig().nome_empresa || lerMarca().nome;

const textoNumero = (valor) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(valor ?? "");
  if (Math.abs(n) >= 100) return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("pt-PT", { maximumFractionDigits: 1 });
};

const desenharBarras = (doc, vista, yInicial) => {
  const series = (vista.grafico || []).slice(0, 12);
  if (!series.length) return yInicial;
  let y = yInicial;
  const garantir = (altura) => {
    if (y + altura < 278) return;
    doc.addPage();
    y = 18;
  };
  garantir(12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ESCURO);
  doc.text(vista.graficoTitulo || "Diagrama", M, y);
  y += 6;
  const maximo = Math.max(...series.map((s) => Number(s.valor) || 0), 1);
  const larguraTrilho = L - 78;
  series.forEach((s) => {
    garantir(11);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LINHA);
    doc.roundedRect(M, y, L, 9, 1.6, 1.6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ESCURO);
    doc.text(String(s.nome), M + 3, y + 5.6);
    const inicio = M + 52;
    const largura = Math.max(1.4, (larguraTrilho * (Number(s.valor) || 0)) / maximo);
    doc.setFillColor(232, 236, 230);
    doc.roundedRect(inicio, y + 2.6, larguraTrilho, 3.8, 1.4, 1.4, "F");
    doc.setFillColor(...VERDE);
    doc.roundedRect(inicio, y + 2.6, largura, 3.8, 1.4, 1.4, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...VERDE_ESCURO);
    doc.text(s.texto || textoNumero(s.valor), M + L - 3, y + 5.6, { align: "right" });
    y += 11;
  });
  return y + 2;
};

const exportarPdf = async (vista) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await paraPng(logoActual());
  await cabecalho(doc, logo, { etiqueta: "RELATÓRIO", titulo: vista.titulo });

  const alturaFaixa = vista.extra ? 20 : 14;
  doc.setFillColor(...VERDE_CLARO);
  doc.roundedRect(M, 46, L, alturaFaixa, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ESCURO);
  doc.text(empresa(), M + 4, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...VERDE_ESCURO);
  doc.text(vista.periodo, M + L - 4, 54, { align: "right" });
  if (vista.extra) {
    doc.setFontSize(8.5);
    doc.setTextColor(...CINZA);
    const partes = String(vista.extra).split(" · ");
    let xChip = M + 4;
    partes.forEach((parte) => {
      doc.setFont("helvetica", "normal");
      const largura = doc.getTextWidth(parte) + 8;
      if (xChip + largura > M + L - 4) return;
      doc.setFillColor(...BRANCO);
      doc.roundedRect(xChip, 57.5, largura, 6, 3, 3, "F");
      doc.setTextColor(...ESCURO);
      doc.text(parte, xChip + 4, 61.6);
      xChip += largura + 3;
    });
  }

  let y = 46 + alturaFaixa + 6;
  const porLinha = vista.kpis.length > 2 ? 2 : Math.max(1, vista.kpis.length);
  const largura = (L - (porLinha - 1) * 4) / porLinha;
  vista.kpis.forEach((kpi, i) => {
    const coluna = i % porLinha;
    const linha = Math.floor(i / porLinha);
    const x = M + coluna * (largura + 4);
    const topo = y + linha * 24;
    doc.setFillColor(...BRANCO);
    doc.setDrawColor(...LINHA);
    doc.roundedRect(x, topo, largura, 20, 3, 3, "FD");
    doc.setFillColor(...VERDE);
    doc.roundedRect(x, topo, 2.2, 20, 1, 1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(kpi.rotulo, x + 6, topo + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...VERDE_ESCURO);
    doc.text(doc.splitTextToSize(String(kpi.valor), largura - 12)[0], x + 6, topo + 14.5);
  });
  y += Math.ceil(vista.kpis.length / porLinha) * 24 + 4;
  y = desenharBarras(doc, vista, y);

  const colunas = vista.colunas || [];
  const colW = L / Math.max(1, colunas.length);
  const cabeca = () => {
    doc.setFillColor(...VERDE);
    doc.rect(M, y, L, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BRANCO);
    colunas.forEach((c, i) => doc.text(String(c).slice(0, 18), M + i * colW + 1.4, y + 4.6));
    y += 7;
  };
  cabeca();
  (vista.linhas || []).forEach((linha, idx) => {
    if (y > 278) {
      doc.addPage();
      y = 16;
      cabeca();
    }
    doc.setFillColor(...(idx % 2 ? VERDE_CLARO : BRANCO));
    doc.rect(M, y, L, 6.4, "F");
    doc.setDrawColor(...LINHA);
    doc.line(M, y + 6.4, M + L, y + 6.4);
    linha.valores.forEach((v, i) => {
      const texto = String(v ?? "—");
      const x = M + i * colW + 1.4;
      const coluna = colunas[i];
      if (coluna === "Estado" || coluna === "Carteira" || coluna === "Tipo") {
        const atraso = ["Em Atraso", "Vencido", "Inativa", "Inativo", "Suspenso"].includes(texto);
        doc.setFillColor(...(atraso ? [255, 236, 236] : VERDE_CLARO));
        doc.roundedRect(x, y + 1.3, Math.min(colW - 2.4, 28), 3.8, 1.6, 1.6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.4);
        doc.setTextColor(...(atraso ? [153, 27, 27] : VERDE_ESCURO));
        doc.text(texto.slice(0, 16), x + 1.6, y + 4.1);
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...ESCURO);
      doc.text(doc.splitTextToSize(texto, colW - 2)[0] || "—", x, y + 4.2);
    });
    y += 6.4;
  });
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p += 1) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(`${empresa()} · ${vista.titulo}`, M, 291);
    doc.text(`${p} / ${paginas}`, 210 - M, 291, { align: "right" });
  }
  const blob = doc.output("blob");
  return descarregar(blob, nomeFicheiro(vista, "pdf"));
};

const pintar = (celula, argb, cor = "FFFFFFFF", negrito = true) => {
  celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
  celula.font = { name: "Calibri", bold: negrito, color: { argb: cor }, size: 11 };
  celula.alignment = { vertical: "middle", horizontal: "center" };
};

const exportarExcel = async (vista) => {
  const livro = new ExcelJS.Workbook();
  livro.creator = empresa();
  const painel = livro.addWorksheet("Painel", { views: [{ showGridLines: false }] });
  const dados = livro.addWorksheet("Dados");
  const logo = await paraPng(logoActual());
  const base64 = String(logo).split(",")[1];
  painel.getRow(1).height = 36;
  painel.getRow(2).height = 22;
  painel.getRow(3).height = 20;
  painel.mergeCells(1, 3, 1, 2 + 16);
  painel.mergeCells(2, 3, 2, 2 + 16);
  painel.mergeCells(3, 3, 3, 2 + 16);
  const nome = painel.getCell("C1");
  nome.value = empresa();
  nome.font = { name: "Calibri", size: 22, bold: true, color: { argb: "FF2F7A04" } };
  nome.alignment = { vertical: "middle", horizontal: "left" };
  const subtitulo = painel.getCell("C2");
  subtitulo.value = vista.titulo;
  subtitulo.font = { name: "Calibri", size: 14, color: { argb: "FF111111" } };
  const periodo = painel.getCell("C3");
  periodo.value = vista.periodo;
  periodo.font = { name: "Calibri", size: 12, color: { argb: "FF555555" } };
  if (base64) {
    const imagem = livro.addImage({ base64, extension: "png" });
    painel.addImage(imagem, { tl: { col: 0.15, row: 0.15 }, ext: { width: 168, height: 52 } });
  }
  vista.kpis.forEach((kpi, i) => {
    const y = 5 + i;
    const rotulo = painel.getCell(y, 1);
    const valor = painel.getCell(y, 2);
    rotulo.value = kpi.rotulo;
    valor.value = kpi.valor;
    pintar(rotulo, `FF${VERDE_HEX}`);
    pintar(valor, `FF${VERDE_SUAVE}`, "FF2F7A04");
    valor.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF2F7A04" } };
    valor.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    rotulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    painel.getRow(y).height = 26;
  });
  const passos = 16;
  if (vista.extra) {
    const yExtra = 5 + vista.kpis.length;
    painel.mergeCells(yExtra, 1, yExtra, 2 + passos);
    const extra = painel.getCell(yExtra, 1);
    extra.value = vista.extra;
    extra.font = { name: "Calibri", size: 12, color: { argb: "FF2F7A04" } };
    extra.alignment = { vertical: "middle", wrapText: true };
    painel.getRow(yExtra).height = 24;
  }
  const series = (vista.grafico || []).slice(0, 12);
  const maximo = Math.max(...series.map((s) => Number(s.valor) || 0), 1);
  const linhaTitulo = 5 + vista.kpis.length + (vista.extra ? 2 : 1);
  painel.mergeCells(linhaTitulo, 1, linhaTitulo, 2);
  painel.getCell(linhaTitulo, 1).value = vista.graficoTitulo || "Diagrama";
  pintar(painel.getCell(linhaTitulo, 1), `FF${VERDE_HEX}`);
  pintar(painel.getCell(linhaTitulo, 2), `FF${VERDE_HEX}`);
  painel.getRow(linhaTitulo).height = 22;
  series.forEach((s, indice) => {
    const y = linhaTitulo + 1 + indice;
    const nomeSerie = painel.getCell(y, 1);
    const valor = painel.getCell(y, 2);
    nomeSerie.value = s.nome;
    valor.value = s.texto || textoNumero(s.valor);
    nomeSerie.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF111111" } };
    nomeSerie.alignment = { vertical: "middle" };
    valor.font = { name: "Calibri", size: 12, color: { argb: "FF2F7A04" } };
    valor.alignment = { vertical: "middle", horizontal: "right" };
    const cheios = Math.round(((Number(s.valor) || 0) / maximo) * passos);
    for (let i = 0; i < passos; i += 1) {
      pintar(painel.getCell(y, 3 + i), i < cheios ? `FF${VERDE_HEX}` : "FFE8ECE6", "FF4AAC05", false);
    }
    painel.getRow(y).height = 22;
  });
  painel.getColumn(1).width = 34;
  painel.getColumn(2).width = 24;
  for (let i = 0; i < passos; i += 1) painel.getColumn(3 + i).width = 3.4;

  dados.addRow(vista.colunas);
  dados.getRow(1).eachCell((celula) => pintar(celula, `FF${VERDE_HEX}`));
  dados.getRow(1).height = 24;
  (vista.linhas || []).forEach((linha, idx) => {
    const row = dados.addRow(linha.valores);
    row.height = 20;
    row.eachCell((celula) => {
      celula.alignment = { vertical: "middle" };
      if (idx % 2) pintar(celula, `FF${VERDE_ZEBRA}`, "FF111111", false);
    });
  });
  dados.columns.forEach((coluna, indice) => {
    const titulo = String(vista.colunas[indice] || "");
    coluna.width = titulo === "Carteira" || titulo === "Cliente" ? 28 : 20;
  });
  const buffer = await livro.xlsx.writeBuffer();
  return descarregar(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nomeFicheiro(vista, "xlsx"));
};

const exportarCsv = (vista) => {
  const linhas = [vista.colunas, ...(vista.linhas || []).map((l) => l.valores)]
    .map((linha) => linha.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  return descarregar(new Blob([`\uFEFF${linhas}`], { type: "text/csv;charset=utf-8" }), nomeFicheiro(vista, "csv"));
};

const exportarJson = (vista) => descarregar(new Blob([JSON.stringify(vista, null, 2)], { type: "application/json" }), nomeFicheiro(vista, "json"));

export const exportarRelatorio = async (vista, formato) => {
  if (formato === "Excel") return exportarExcel(vista);
  if (formato === "CSV") return exportarCsv(vista);
  if (formato === "JSON") return exportarJson(vista);
  return exportarPdf(vista);
};
