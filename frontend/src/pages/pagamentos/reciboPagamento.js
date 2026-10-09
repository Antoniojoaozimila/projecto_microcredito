import { jsPDF } from "jspdf";
import { origemLogo } from "../../services/logoDocumento";
import { formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import {
  BRANCO, CINZA, ESCURO, L, LINHA, M, VERDE, VERDE_CLARO, VERDE_ESCURO, cabecalho, criarChip, criarTabela, criarTitulo, icone,
} from "../emprestimos/pdfBase";

const VERMELHO = [200, 45, 45];
const LIMITE_FUNDO = 282;

const montarRecibo = async ({ pagamento, emprestimo, cliente, carteira }) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const direita = 210 - M;
  const estornado = pagamento.status === "Estornado";
  const quitado = pagamento.estado_emprestimo_apos === "Quitado" && !estornado;

  await cabecalho(doc, origemLogo(), { etiqueta: "RECIBO", titulo: "Recibo de Pagamento" });
  const chip = criarChip(doc);
  const titulo = criarTitulo(doc);
  const tabela = criarTabela(doc);
  const xData = chip("calendario", `${formatarData(pagamento.data_pagamento)}${pagamento.hora_pagamento ? ` às ${pagamento.hora_pagamento}` : ""}`, direita, 30);
  chip("hash", pagamento.numero_recibo, xData - 3, 30, true);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...(estornado ? VERMELHO : CINZA));
  doc.text(`Estado do pagamento: ${pagamento.status} · Tipo: ${pagamento.tipo_pagamento}`, direita, 38.5, { align: "right" });

  let y = 51;
  const metade = (L - 6) / 2;
  titulo("pessoa", "Cliente", M, metade, y);
  titulo("documento", "Empréstimo", M + metade + 6, metade, y);
  const parcelaTexto = pagamento.num_parcela ? `${pagamento.num_parcela}/${pagamento.total_parcelas || emprestimo?.num_parcelas || "—"}` : "—";
  y += 4 + Math.max(
    tabela({
      x: M, largura: metade, porLinha: 1, larguraRotulo: 26, yTopo: y + 4,
      pares: [
        ["Nome", cliente?.nome_completo || "—"],
        ["Documento", `${cliente?.documento_tipo || ""} ${cliente?.documento_numero || "—"}`.trim()],
        ["Telefone", cliente?.telefone_principal || "—"],
      ],
    }),
    tabela({
      x: M + metade + 6, largura: metade, porLinha: 1, larguraRotulo: 30, yTopo: y + 4,
      pares: [
        ["Contrato", emprestimo?.numero_contrato || "—"],
        ["Parcela", parcelaTexto],
        ["Valor emprestado", formatarMT(emprestimo?.valor_emprestado)],
      ],
    })
  ) + 9;

  titulo("carteira", "Detalhes do pagamento", M, L, y);
  const saldoTexto = quitado ? "QUITADO" : formatarMT(pagamento.saldo_devedor_apos);
  y += 4 + tabela({
    x: M, largura: L, porLinha: 2, larguraRotulo: 34, yTopo: y + 4,
    pares: [
      ["Data do pagamento", `${formatarData(pagamento.data_pagamento)}${pagamento.hora_pagamento ? ` · ${pagamento.hora_pagamento}` : ""}`],
      ["Forma de pagamento", pagamento.forma_pagamento],
      ["Referência", pagamento.referencia_transacao || "—"],
      ["Carteira", `${carteira?.nome || "—"}${carteira?.tipo ? ` (${carteira.tipo})` : ""}`],
      ["Valor da parcela", formatarMT(pagamento.valor_parcela)],
      ["Valor pago", formatarMT(pagamento.valor_pago), VERDE_ESCURO],
      ["Multa", formatarMT(pagamento.valor_multa), pagamento.valor_multa > 0 ? VERMELHO : ESCURO],
      ["Saldo devedor", saldoTexto, quitado ? VERDE_ESCURO : ESCURO],
      ["Juros pagos", formatarMT(pagamento.valor_juros_pago)],
      ["Principal pago", formatarMT(pagamento.valor_principal_pago)],
      ["Estado", estornado ? "ESTORNADO" : quitado ? "QUITADO" : pagamento.status.toUpperCase(), estornado ? VERMELHO : VERDE_ESCURO],
      ["Registado por", pagamento.registado_por || "—"],
    ],
  }) + 6;

  const cartoes = [
    { nome: "percentagem", rotulo: "Saldo anterior", valor: formatarMT(pagamento.saldo_antes) },
    { nome: quitado ? "visto" : "calendario", rotulo: "Novo saldo devedor", valor: saldoTexto },
    { nome: "moeda", rotulo: "Valor pago", valor: formatarMT(pagamento.valor_pago), destaque: true },
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

  titulo("lista", "Alocação do pagamento", M, L, y);
  y += 4;
  const linhas = pagamento.parcelas_afectadas || [];
  const reservaFinal = 34 + (pagamento.observacoes ? 14 : 0) + (quitado || estornado ? 13 : 0);
  const disponivel = LIMITE_FUNDO - reservaFinal - y - 14;
  const alturaLinha = Math.min(6.4, Math.max(3.4, disponivel / Math.max(1, linhas.length)));
  const capacidade = Math.max(1, Math.floor(disponivel / alturaLinha));
  const visiveis = linhas.length > capacidade ? linhas.slice(0, capacidade - 1) : linhas;
  const escondidas = linhas.slice(visiveis.length);
  const fonte = alturaLinha < 5 ? 7 : 8.2;
  const colunas = [
    { t: "Parcela", w: 0.12, alinhar: "center" },
    { t: "Vencimento", w: 0.18, alinhar: "left" },
    { t: "Multa", w: 0.17, alinhar: "right" },
    { t: "Juros", w: 0.17, alinhar: "right" },
    { t: "Principal", w: 0.17, alinhar: "right" },
    { t: "Estado", w: 0.19, alinhar: "center" },
  ];
  const escrever = (valores, yTexto) => {
    let xc = M;
    colunas.forEach((c, i) => {
      const w = c.w * L;
      const xt = c.alinhar === "right" ? xc + w - 2.2 : c.alinhar === "center" ? xc + w / 2 : xc + 2.2;
      doc.text(String(valores[i] ?? ""), xt, yTexto, { align: c.alinhar });
      xc += w;
    });
  };
  const alturaCab = Math.max(6, alturaLinha + 1);
  doc.setFillColor(...VERDE_CLARO);
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, L, alturaCab, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fonte);
  doc.setTextColor(...VERDE_ESCURO);
  escrever(colunas.map((c) => c.t), y + alturaCab / 2 + fonte * 0.13);
  y += alturaCab;
  const soma = (lista, chave) => lista.reduce((s, l) => s + Number(l[chave] || 0), 0);
  const linhasTabela = visiveis.map((l) => [
    l.num_parcela, formatarData(l.data_vencimento), formatarMT(l.multa), formatarMT(l.juros), formatarMT(l.principal), l.estado || (l.quita ? "Pago" : "Parcialmente Pago"),
  ]);
  if (escondidas.length) {
    linhasTabela.push([`+${escondidas.length}`, "outras parcelas", formatarMT(soma(escondidas, "multa")), formatarMT(soma(escondidas, "juros")), formatarMT(soma(escondidas, "principal")), "Pago"]);
  }
  doc.setFont("helvetica", "normal");
  linhasTabela.forEach((valores, indice) => {
    if (indice % 2) {
      doc.setFillColor(248, 251, 245);
      doc.rect(M, y, L, alturaLinha, "F");
    }
    doc.setDrawColor(...LINHA);
    doc.line(M, y + alturaLinha, M + L, y + alturaLinha);
    doc.setTextColor(...ESCURO);
    doc.setFontSize(fonte);
    escrever(valores, y + alturaLinha / 2 + fonte * 0.13);
    y += alturaLinha;
  });
  doc.setFillColor(...VERDE);
  doc.roundedRect(M, y + 0.8, L, alturaCab, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRANCO);
  escrever(["", "Total", formatarMT(pagamento.valor_multa), formatarMT(pagamento.valor_juros_pago), formatarMT(pagamento.valor_principal_pago), formatarMT(pagamento.valor_pago)], y + 0.8 + alturaCab / 2 + fonte * 0.13);
  y += alturaCab + 6;

  if (quitado || estornado) {
    const cor = estornado ? VERMELHO : VERDE;
    doc.setFillColor(...(estornado ? [253, 236, 236] : [236, 248, 226]));
    doc.setDrawColor(...cor);
    doc.roundedRect(M, y, L, 10, 2.2, 2.2, "FD");
    icone(doc, estornado ? "info" : "visto", M + 6, y + 5, 6, { fundo: cor });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(...cor);
    const texto = estornado
      ? `PAGAMENTO ESTORNADO em ${new Date(pagamento.estorno?.data).toLocaleString("pt-PT")}: ${pagamento.estorno?.motivo || ""}`
      : "EMPRÉSTIMO QUITADO. Não existem valores em dívida.";
    doc.text(doc.splitTextToSize(texto, L - 16)[0], M + 12, y + 6.3);
    y += 13;
  }

  if (pagamento.observacoes) {
    const nota = doc.splitTextToSize(`Observações: ${pagamento.observacoes}`, L - 16).slice(0, 2);
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
  }

  if (estornado) {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    doc.setTextColor(...VERMELHO);
    doc.text("ESTORNADO", 105, 175, { align: "center", angle: 30 });
    doc.restoreGraphicsState();
  }

  const yAssinatura = Math.min(LIMITE_FUNDO - 6, Math.max(y + 16, LIMITE_FUNDO - 14));
  doc.setDrawColor(...CINZA);
  doc.setLineWidth(0.25);
  doc.line(M + 6, yAssinatura, M + 76, yAssinatura);
  doc.line(direita - 76, yAssinatura, direita - 6, yAssinatura);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...CINZA);
  doc.text("Assinatura do cliente", M + 41, yAssinatura + 4.5, { align: "center" });
  doc.text(`Operador: ${pagamento.registado_por || "—"}`, direita - 41, yAssinatura + 4.5, { align: "center" });

  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(M, 286, direita, 286);
  doc.setFontSize(7.2);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-PT")}`, M, 291);
  doc.text("Sistema de Microcrédito - Todos os direitos reservados", direita, 291, { align: "right" });
  return doc;
};

export const descarregarReciboPagamento = async (dados) => {
  const doc = await montarRecibo(dados);
  doc.save(`Recibo-${dados.pagamento.numero_recibo}.pdf`);
};

export const imprimirReciboPagamento = async (dados) => {
  const doc = await montarRecibo(dados);
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};
