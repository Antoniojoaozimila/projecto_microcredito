import ExcelJS from "exceljs";

const FORMATO_MOEDA = "#,##0.00";
const FORMATO_INTEIRO = "#,##0";
const FORMATO_TAXA = '0.00"%"';
const FORMATO_PRAZO = "0.0";

const FONTE = { name: "Calibri", size: 11, family: 2 };
const comRotulo = (rotulo, valor) => ({
  richText: [
    { font: FONTE, text: rotulo },
    { font: { ...FONTE, underline: true }, text: String(valor ?? "") },
  ],
});

/**
 * Preenche o ficheiro "Modelo de Reporte BM" original (mantém formatação, células unidas e impressão)
 * com os dados já calculados e troca o logótipo pelo logótipo configurado no sistema.
 *
 * @param {object} dados   resultado de `montarReporteBM`
 * @param {ArrayBuffer} modelo conteúdo do ficheiro .xlsx do modelo
 * @param {{base64: string, largura: number, altura: number} | null} logo logótipo em PNG
 * @returns {Promise<ArrayBuffer>} ficheiro .xlsx pronto a gravar
 */
export const preencherModeloBM = async (dados, modelo, logo) => {
  const livro = new ExcelJS.Workbook();
  await livro.xlsx.load(modelo);
  const folha = livro.worksheets[0];
  folha.name = "Reporte BM";

  const definir = (endereco, valor, formato, resultado) => {
    const celula = folha.getCell(endereco);
    celula.value = resultado === undefined ? valor : { formula: valor, result: resultado };
    if (formato) celula.numFmt = formato;
    return celula;
  };
  const soma2 = (a, b) => Math.round((Number(a) + Number(b)) * 100) / 100;

  // Larguras suficientes para valores em meticais não aparecerem como "####".
  ["B", "D", "G", "H", "I", "J", "O", "P", "Q"].forEach((letra) => { folha.getColumn(letra).width = Math.max(folha.getColumn(letra).width || 0, 17); });

  // Logótipo do sistema no lugar do logótipo do modelo.
  folha._media = [];
  if (logo?.base64) {
    livro.media[0] = { type: "image", name: "image1", extension: "png", base64: logo.base64 };
    folha.addImage(0, { tl: { col: 0.1, row: 0.2 }, ext: { width: logo.largura, height: logo.altura } });
  }

  const { operador: o, periodo, volume: v, numero, sectores, clientes, classes, taxas, fontes, financiamentos, capital, situacao } = dados;

  folha.getCell("A8").value = periodo.texto;

  folha.getCell("A12").value = comRotulo("DENOMINAÇÃO: ", o.denominacao);
  folha.getCell("A13").value = comRotulo("ENDEREÇO: ", o.endereco);
  folha.getCell("A14").value = `PROVINCIA: ${o.provincia || ""}`;
  folha.getCell("A15").value = comRotulo("TELEFONE: ", o.telefone);
  folha.getCell("A16").value = comRotulo("FAX: ", o.fax || "N/A");
  folha.getCell("I16").value = comRotulo("EMAIL: ", o.email);
  folha.getCell("A17").value = `NR DE TRABALHADORES: ${o.trabalhadores ?? ""}`;
  folha.getCell("A18").value = comRotulo("DATA DE INICIO DE ATIVIDADES: ", o.inicio_actividades);
  folha.getCell("A19").value = comRotulo("NOME DO OPERADOR: ", o.nome_operador);

  // 2.1.1 Volume de créditos (Capital | Juro | Total)
  [
    [25, v.concedidos],
    [26, v.reembolsados],
    [27, v.abatidos],
    [28, v.activa],
    [29, v.risco],
  ].forEach(([linha, valor]) => {
    definir(`O${linha}`, valor.capital, FORMATO_MOEDA);
    definir(`P${linha}`, valor.juro, FORMATO_MOEDA);
    definir(`Q${linha}`, `O${linha}+P${linha}`, FORMATO_MOEDA, soma2(valor.capital, valor.juro));
  });

  // 2.1.2 Número de créditos
  definir("Q33", numero.concedidos, FORMATO_INTEIRO);
  definir("Q34", numero.reembolsados, FORMATO_INTEIRO);

  // 2.1.3 Créditos concedidos por sector (linhas 39 a 45)
  sectores.forEach((s, i) => definir(`G${39 + i}`, s.montante, FORMATO_MOEDA));

  // 2.1.4 Carteira de clientes
  definir("G50", clientes.homens, FORMATO_INTEIRO);
  definir("G51", clientes.mulheres, FORMATO_INTEIRO);
  definir("G52", clientes.outros, FORMATO_INTEIRO);
  definir("G53", "SUM(G50:G52)", FORMATO_INTEIRO, clientes.total);

  // 2.1.5 Estrutura da carteira em risco
  classes.forEach((c, i) => {
    const linha = 57 + i;
    definir(`H${linha}`, c.capital, FORMATO_MOEDA);
    definir(`I${linha}`, c.juros, FORMATO_MOEDA);
    definir(`J${linha}`, `H${linha}+I${linha}`, FORMATO_MOEDA, soma2(c.capital, c.juros));
  });

  // 2.2 Taxas de juro e prazos
  definir("G65", taxas.juroMin, FORMATO_TAXA);
  definir("H65", taxas.juroMax, FORMATO_TAXA);
  definir("G66", taxas.prazoMin, FORMATO_PRAZO);
  definir("H66", taxas.prazoMax, FORMATO_PRAZO);

  // 2.3 Fontes de financiamento
  definir("D69", fontes.proprios, FORMATO_MOEDA);
  definir("D70", "D71+D72", FORMATO_MOEDA, fontes.alheios);
  definir("D71", fontes.nacionais, FORMATO_MOEDA);
  definir("D72", fontes.estrangeiros, FORMATO_MOEDA);
  definir("D73", "D69+D70", FORMATO_MOEDA, fontes.total);

  // 2.4 Financiamentos do período
  definir("G76", financiamentos.emprestimos, FORMATO_MOEDA);
  definir("G77", financiamentos.donativos, FORMATO_MOEDA);
  definir("G78", financiamentos.aumentoCapital, FORMATO_MOEDA);
  definir("G79", "SUM(G76:G78)", FORMATO_MOEDA, financiamentos.total);

  // 2.5 Capital
  definir("B83", capital.inicial, FORMATO_MOEDA);
  definir("B84", capital.actual, FORMATO_MOEDA);

  // 3. Situação financeira (um mês por coluna)
  ["G", "H", "I"].forEach((letra, i) => {
    const mes = situacao[i];
    const cabecalho = folha.getCell(`${letra}88`);
    cabecalho.value = mes ? mes.rotulo.replace(" (", "\n").replace(")", "") : `Mês ${i + 1}`;
    cabecalho.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    if (!mes) return;
    definir(`${letra}89`, mes.caixa, FORMATO_MOEDA);
    definir(`${letra}90`, mes.bancos, FORMATO_MOEDA);
    definir(`${letra}91`, mes.outros, FORMATO_MOEDA);
    definir(`${letra}92`, `SUM(${letra}89:${letra}91)`, FORMATO_MOEDA, mes.total);
  });
  folha.getRow(88).height = 32;

  livro.calcProperties = { ...(livro.calcProperties || {}), fullCalcOnLoad: true };
  return livro.xlsx.writeBuffer();
};

