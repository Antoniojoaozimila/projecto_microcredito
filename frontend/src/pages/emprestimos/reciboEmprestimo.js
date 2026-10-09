import { jsPDF } from "jspdf";
import { origemLogo } from "../../services/logoDocumento";
import { SEM_GARANTIA, calcularMapaOperacao, formatarData, formatarMT, periodoTaxa, rotuloJuros } from "../../services/emprestimosMicrocredito";
import {
  BRANCO, CINZA, ESCURO, L, LINHA, M, VERDE, VERDE_CLARO, VERDE_ESCURO, cabecalho, criarChip, criarTabela, criarTitulo, icone,
} from "./pdfBase";

const LIMITE_FUNDO = 282;
const RESERVA_FINAL = 38;

const montarRecibo = async (emprestimo, cliente, carteira, contrato = false) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const direita = 210 - M;

  await cabecalho(doc, origemLogo(), contrato ? { etiqueta: "CONTRATO", titulo: "Contrato de Microcrédito" } : { etiqueta: "COMPROVATIVO", titulo: "Recibo de Pedido de Empréstimo" });
  const chip = criarChip(doc);
  const xData = chip("calendario", `${contrato ? "Aprovado em" : "Emitido em"} ${new Date((contrato && emprestimo.data_aprovacao) || emprestimo.data_registo).toLocaleString("pt-PT")}`, direita, 30);
  chip("hash", `Nº ${emprestimo.numero_contrato}`, xData - 3, 30, true);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...CINZA);
  doc.text(contrato ? `Aprovado por ${emprestimo.aprovado_por || "—"} · Desembolso: ${carteira?.nome || "—"}` : `Estado: ${emprestimo.status} · Fase: ${emprestimo.fase_atual || "Análise"}`, direita, 38.5, { align: "right" });

  let y = 51;

  const titulo = criarTitulo(doc);
  const tabela = criarTabela(doc);

  const mapa = calcularMapaOperacao(emprestimo);
  const metade = (L - 6) / 2;
  titulo("pessoa", "Cliente", M, metade, y);
  titulo("carteira", "Desembolso e garantia", M + metade + 6, metade, y);
  const semGarantia = emprestimo.garantia_tipo === SEM_GARANTIA;
  const alturaBloco = Math.max(
    tabela({
      x: M, largura: metade, porLinha: 1, larguraRotulo: 26, yTopo: y + 4,
      pares: [
        ["Nome", cliente?.nome_completo || "—"],
        ["Documento", `${cliente?.documento_tipo || ""} ${cliente?.documento_numero || "—"}`.trim()],
        ["Telefone", cliente?.telefone_principal || "—"],
        ["NUIT", cliente?.nuit || "—"],
      ],
    }),
    tabela({
      x: M + metade + 6, largura: metade, porLinha: 1, larguraRotulo: 30, yTopo: y + 4,
      pares: [
        ["Carteira", `${carteira?.nome || "—"}${carteira?.tipo ? ` (${carteira.tipo})` : ""}`],
        ["Garantia", emprestimo.garantia_tipo],
        ["Valor da garantia", semGarantia ? "—" : formatarMT(emprestimo.garantia_valor)],
        ["Descrição", semGarantia ? "—" : emprestimo.garantia_descricao || "—"],
      ],
    })
  );
  y += 4 + alturaBloco + 9;

  titulo("documento", "Dados do empréstimo", M, L, y);
  y += 4 + tabela({
    x: M, largura: L, porLinha: 2, larguraRotulo: 32, yTopo: y + 4,
    pares: [
      ["Valor emprestado", formatarMT(emprestimo.valor_emprestado)],
      ["Modalidade", `${emprestimo.modalidade} · ${emprestimo.num_parcelas} parcela(s)`],
      ["Taxa de juros", `${emprestimo.taxa_juros}% ${periodoTaxa(emprestimo)}`],
      ["Tipo de juros", rotuloJuros(emprestimo.tipo_juros)],
      ["Amortização", emprestimo.sistema_amortizacao],
      ["Data de início", formatarData(emprestimo.data_inicio)],
      ["1.º vencimento", formatarData(emprestimo.parcelas?.[0]?.data_vencimento)],
      ["Último vencimento", formatarData(emprestimo.data_vencimento)],
      ["Capital em risco", formatarMT(mapa.capital)],
      ["Juros em dívida", formatarMT(mapa.juros)],
      ["Juro de mora diário", formatarMT(mapa.moraDiaria)],
      ["Dias vencidos", String(mapa.diasVencidos)],
      ["Saldo com juros de mora", formatarMT(mapa.saldoComMora)],
      ["Imposto de selo a pagar", formatarMT(mapa.impostoSelo)],
    ],
  }) + 6;

  const cartoes = [
    { nome: "percentagem", rotulo: "Total de juros", valor: formatarMT(emprestimo.valor_total_juros) },
    { nome: "calendario", rotulo: "Valor da parcela", valor: formatarMT(emprestimo.valor_parcela) },
    { nome: "moeda", rotulo: "Total a pagar", valor: formatarMT(emprestimo.valor_total_receber), destaque: true },
  ];
  const larguraCartao = (L - 8) / 3;
  cartoes.forEach((c, i) => {
    const x = M + i * (larguraCartao + 4);
    doc.setFillColor(...(c.destaque ? VERDE : [243, 251, 232]));
    doc.setDrawColor(...(c.destaque ? VERDE : [205, 230, 185]));
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, larguraCartao, 16, 3, 3, "FD");
    icone(doc, c.nome, x + 7.5, y + 8, 8.4, c.destaque ? { fundo: BRANCO, cor: VERDE } : {});
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);
    doc.setTextColor(...(c.destaque ? BRANCO : CINZA));
    doc.text(c.rotulo, x + 14, y + 6.4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...(c.destaque ? BRANCO : ESCURO));
    doc.text(c.valor, x + 14, y + 12.4);
  });
  y += 16 + 9;

  titulo("lista", "Cronograma de pagamentos", M, L, y);
  y += 4;
  const parcelas = emprestimo.parcelas || [];
  const disponivel = LIMITE_FUNDO - RESERVA_FINAL - y;

  const desenharTabela = ({ x, largura, colunas, linhas, alturaLinha, fonte, total }) => {
    const alturaCab = Math.max(6, alturaLinha + 1);
    const escrever = (valores, yTexto) => {
      let xc = x;
      colunas.forEach((c, i) => {
        const w = c.w * largura;
        const xt = c.alinhar === "right" ? xc + w - 2.2 : c.alinhar === "center" ? xc + w / 2 : xc + 2.2;
        doc.text(String(valores[i] ?? ""), xt, yTexto, { align: c.alinhar });
        xc += w;
      });
    };
    let yt = y;
    doc.setFillColor(...VERDE_CLARO);
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yt, largura, alturaCab, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fonte);
    doc.setTextColor(...VERDE_ESCURO);
    escrever(colunas.map((c) => c.t), yt + alturaCab / 2 + fonte * 0.13);
    yt += alturaCab;
    doc.setFont("helvetica", "normal");
    linhas.forEach((valores, indice) => {
      if (indice % 2) {
        doc.setFillColor(248, 251, 245);
        doc.rect(x, yt, largura, alturaLinha, "F");
      }
      doc.setDrawColor(...LINHA);
      doc.line(x, yt + alturaLinha, x + largura, yt + alturaLinha);
      doc.setTextColor(...ESCURO);
      doc.setFontSize(fonte);
      escrever(valores, yt + alturaLinha / 2 + fonte * 0.13);
      yt += alturaLinha;
    });
    if (total) {
      doc.setFillColor(...VERDE);
      doc.roundedRect(x, yt + 0.8, largura, alturaCab, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fonte);
      doc.setTextColor(...BRANCO);
      escrever(total, yt + 0.8 + alturaCab / 2 + fonte * 0.13);
      yt += alturaCab + 0.8;
    }
    return yt;
  };

  const linhaTotal = ["", "Total", formatarMT(emprestimo.valor_total_receber), formatarMT(emprestimo.valor_total_juros), formatarMT(emprestimo.valor_emprestado), ""];
  const alturaCompleta = (disponivel - 14) / Math.max(1, parcelas.length);

  if (alturaCompleta >= 4.2) {
    const alturaLinha = Math.min(6.4, alturaCompleta);
    y = desenharTabela({
      x: M,
      largura: L,
      alturaLinha,
      fonte: alturaLinha < 5 ? 7.2 : 8.2,
      colunas: [
        { t: "Nº", w: 0.07, alinhar: "center" },
        { t: "Vencimento", w: 0.17, alinhar: "left" },
        { t: "Parcela", w: 0.19, alinhar: "right" },
        { t: "Juros", w: 0.19, alinhar: "right" },
        { t: "Principal", w: 0.19, alinhar: "right" },
        { t: "Saldo", w: 0.19, alinhar: "right" },
      ],
      linhas: parcelas.map((p) => [p.num_parcela, formatarData(p.data_vencimento), formatarMT(p.valor_parcela), formatarMT(p.valor_juros), formatarMT(p.valor_principal), formatarMT(p.saldo_apos_pagamento)]),
      total: linhaTotal,
    });
  } else {
    const espacoLinhas = disponivel - 16;
    let alturaLinha = 3.6;
    let porColuna = Math.floor(espacoLinhas / alturaLinha);
    let colunasN = Math.ceil(parcelas.length / porColuna);
    if (colunasN > 4) {
      alturaLinha = 3;
      porColuna = Math.floor(espacoLinhas / alturaLinha);
      colunasN = Math.min(4, Math.ceil(parcelas.length / porColuna));
    }
    const capacidade = porColuna * colunasN;
    const visiveis = parcelas.length > capacidade ? parcelas.slice(0, capacidade - 1) : parcelas;
    porColuna = Math.ceil(visiveis.length / colunasN);
    const larguraColuna = (L - (colunasN - 1) * 3) / colunasN;
    const yInicio = y;
    let yFim = y;
    for (let k = 0; k < colunasN; k += 1) {
      const fatia = visiveis.slice(k * porColuna, (k + 1) * porColuna);
      if (!fatia.length) break;
      y = yInicio;
      yFim = Math.max(yFim, desenharTabela({
        x: M + k * (larguraColuna + 3),
        largura: larguraColuna,
        alturaLinha,
        fonte: alturaLinha < 3.4 ? 5.6 : 6.3,
        colunas: [
          { t: "Nº", w: 0.16, alinhar: "center" },
          { t: "Vencimento", w: 0.4, alinhar: "left" },
          { t: "Parcela", w: 0.44, alinhar: "right" },
        ],
        linhas: fatia.map((p) => [p.num_parcela, formatarData(p.data_vencimento), formatarMT(p.valor_parcela)]),
      }));
    }
    y = yFim + 1.5;
    doc.setFillColor(...VERDE);
    doc.roundedRect(M, y, L, 6.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(...BRANCO);
    const resto = parcelas.length - visiveis.length;
    doc.text(`${parcelas.length} parcelas${resto ? ` (mais ${resto} na ficha do empréstimo)` : ""}`, M + 3, y + 4.3);
    doc.text(`Juros ${formatarMT(emprestimo.valor_total_juros)}   ·   Total ${formatarMT(emprestimo.valor_total_receber)}`, M + L - 3, y + 4.3, { align: "right" });
    y += 6.5;
  }

  y += 5;
  const nota = doc.splitTextToSize(
    contrato
      ? `O cliente compromete-se a pagar as parcelas nas datas indicadas. O juro de mora diário é (capital em risco + juros) × taxa do contrato / 30. O saldo a pagar com juros de mora é capital + juros + (mora diária × dias vencidos). O imposto de selo, de ${mapa.taxaSelo.toLocaleString("pt-PT")}% sobre esse saldo, é devido em linha separada e não está incluído no saldo. A garantia pode ser penhorada e executada nos termos da lei.`
      : `Este recibo confirma o registo do pedido e não substitui o contrato, que é emitido após a aprovação. O juro de mora diário é (capital em risco + juros) × taxa do contrato / 30. O saldo a pagar com juros de mora é capital + juros + (mora diária × dias vencidos). O imposto de selo, de ${mapa.taxaSelo.toLocaleString("pt-PT")}% sobre esse saldo, é devido em linha separada e não está incluído no saldo.`,
    L - 16
  );
  const alturaNota = nota.length * 3.7 + 5;
  doc.setFillColor(255, 250, 235);
  doc.setDrawColor(243, 217, 139);
  doc.roundedRect(M, y, L, alturaNota, 2.2, 2.2, "FD");
  icone(doc, "info", M + 5.5, y + alturaNota / 2, 5.4, { fundo: [217, 160, 30] });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(120, 85, 10);
  doc.text(nota, M + 11, y + 4.4);
  y += alturaNota;

  const yAssinatura = Math.min(LIMITE_FUNDO - 6, Math.max(y + 16, LIMITE_FUNDO - 14));
  doc.setDrawColor(...CINZA);
  doc.setLineWidth(0.25);
  doc.line(M + 6, yAssinatura, M + 76, yAssinatura);
  doc.line(direita - 76, yAssinatura, direita - 6, yAssinatura);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...CINZA);
  doc.text(contrato ? "O cliente" : "Assinatura do cliente", M + 41, yAssinatura + 4.5, { align: "center" });
  doc.text(contrato ? "A instituição" : `Registado por ${emprestimo.criado_por || "—"}`, direita - 41, yAssinatura + 4.5, { align: "center" });

  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(M, 286, direita, 286);
  doc.setFontSize(7.2);
  doc.text(`${contrato ? "Contrato" : "Recibo"} ${emprestimo.numero_contrato}`, M, 291);
  doc.text("Página 1 de 1", direita, 291, { align: "right" });
  return doc;
};

export const descarregarRecibo = async (emprestimo, cliente, carteira) => {
  const doc = await montarRecibo(emprestimo, cliente, carteira);
  doc.save(`Recibo-${emprestimo.numero_contrato}.pdf`);
};

export const descarregarContrato = async (emprestimo, cliente, carteira) => {
  const doc = await montarRecibo(emprestimo, cliente, carteira, true);
  doc.save(`${emprestimo.numero_contrato}.pdf`);
};

export const imprimirRecibo = async (emprestimo, cliente, carteira) => {
  const doc = await montarRecibo(emprestimo, cliente, carteira);
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};

