export const VERDE = [74, 172, 5];
export const VERDE_ESCURO = [47, 122, 4];
export const VERDE_CLARO = [234, 245, 224];
export const FUNDO = [244, 246, 243];
export const LINHA = [221, 229, 216];
export const ESCURO = [17, 17, 17];
export const CINZA = [110, 110, 110];
export const BRANCO = [255, 255, 255];

export const M = 14;
export const L = 210 - M * 2;

export const carregarImagem = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const ICONES = {
  pessoa: (doc, x, y, s) => {
    doc.circle(x, y - s * 0.22, s * 0.2, "F");
    doc.roundedRect(x - s * 0.34, y + s * 0.06, s * 0.68, s * 0.34, s * 0.16, s * 0.16, "F");
  },
  documento: (doc, x, y, s, cor) => {
    doc.roundedRect(x - s * 0.28, y - s * 0.36, s * 0.56, s * 0.72, 0.4, 0.4, "F");
    doc.setDrawColor(...cor);
    doc.setLineWidth(0.3);
    [-0.14, 0.02, 0.18].forEach((d) => doc.line(x - s * 0.16, y + s * d, x + s * 0.16, y + s * d));
  },
  calendario: (doc, x, y, s, cor) => {
    doc.roundedRect(x - s * 0.34, y - s * 0.3, s * 0.68, s * 0.62, 0.5, 0.5, "F");
    doc.setFillColor(...cor);
    doc.rect(x - s * 0.26, y - s * 0.08, s * 0.52, s * 0.32, "F");
    doc.setDrawColor(...BRANCO);
    doc.setLineWidth(0.5);
    doc.line(x - s * 0.16, y - s * 0.4, x - s * 0.16, y - s * 0.22);
    doc.line(x + s * 0.16, y - s * 0.4, x + s * 0.16, y - s * 0.22);
  },
  carteira: (doc, x, y, s, cor) => {
    doc.roundedRect(x - s * 0.36, y - s * 0.26, s * 0.72, s * 0.52, 0.6, 0.6, "F");
    doc.setFillColor(...cor);
    doc.circle(x + s * 0.18, y, s * 0.08, "F");
  },
  lista: (doc, x, y, s) => {
    [-0.22, 0, 0.22].forEach((d) => {
      doc.circle(x - s * 0.26, y + s * d, s * 0.06, "F");
      doc.roundedRect(x - s * 0.14, y + s * d - s * 0.05, s * 0.44, s * 0.1, 0.2, 0.2, "F");
    });
  },
  escudo: (doc, x, y, s) => {
    doc.triangle(x - s * 0.32, y - s * 0.12, x + s * 0.32, y - s * 0.12, x, y + s * 0.4, "F");
    doc.roundedRect(x - s * 0.32, y - s * 0.36, s * 0.64, s * 0.3, 0.4, 0.4, "F");
  },
  visto: (doc, x, y, s, cor) => {
    doc.setDrawColor(...(cor === BRANCO ? VERDE : BRANCO));
    doc.setLineWidth(s * 0.14);
    doc.lines([[s * 0.2, s * 0.2], [s * 0.36, -s * 0.42]], x - s * 0.26, y + s * 0.02);
  },
  percentagem: (doc, x, y, s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s * 2.3);
    doc.text("%", x, y + s * 0.28, { align: "center" });
  },
  moeda: (doc, x, y, s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s * 1.55);
    doc.text("MT", x, y + s * 0.2, { align: "center" });
  },
  hash: (doc, x, y, s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s * 2.2);
    doc.text("#", x, y + s * 0.28, { align: "center" });
  },
  info: (doc, x, y, s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s * 2.2);
    doc.text("i", x, y + s * 0.28, { align: "center" });
  },
};

export const icone = (doc, nome, x, y, diametro, { fundo = VERDE, cor = BRANCO } = {}) => {
  doc.setFillColor(...fundo);
  doc.circle(x, y, diametro / 2, "F");
  doc.setFillColor(...cor);
  doc.setTextColor(...cor);
  ICONES[nome](doc, x, y, diametro * 0.62, fundo);
};

export const criarTitulo = (doc) => (nome, texto, x, largura, yTitulo) => {
  icone(doc, nome, x + 3.2, yTitulo - 1.1, 6.4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...ESCURO);
  doc.text(texto, x + 8.6, yTitulo);
  const fim = x + 10 + doc.getTextWidth(texto);
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(fim + 2, yTitulo - 1.1, x + largura, yTitulo - 1.1);
};

export const criarTabela = (doc) => ({ x, largura, pares, porLinha, alturaLinha = 7, larguraRotulo = 30, yTopo }) => {
  const linhas = Math.ceil(pares.length / porLinha);
  const bloco = largura / porLinha;
  const altura = linhas * alturaLinha;
  doc.setFillColor(...BRANCO);
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, yTopo, largura, altura, 1.2, 1.2, "FD");
  for (let r = 0; r < linhas; r += 1) {
    const yLinha = yTopo + r * alturaLinha;
    for (let c = 0; c < porLinha; c += 1) {
      const xBloco = x + c * bloco;
      const recuo = c === 0 ? 0.4 : 0;
      doc.setFillColor(...(r % 2 ? [239, 245, 235] : [246, 249, 244]));
      doc.rect(xBloco + recuo, yLinha + (r === 0 ? 0.4 : 0), larguraRotulo - recuo, alturaLinha - (r === 0 ? 0.4 : 0) - (r === linhas - 1 ? 0.4 : 0), "F");
      const par = pares[r * porLinha + c];
      if (!par) continue;
      const yTexto = yLinha + alturaLinha / 2 + 1.2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.6);
      doc.setTextColor(...CINZA);
      doc.text(par[0], xBloco + 2.6, yTexto);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);
      doc.setTextColor(...(par[2] || ESCURO));
      doc.text(doc.splitTextToSize(String(par[1] ?? "—"), bloco - larguraRotulo - 4)[0], xBloco + larguraRotulo + 2.6, yTexto);
    }
    if (r > 0) {
      doc.setDrawColor(...LINHA);
      doc.line(x, yLinha, x + largura, yLinha);
    }
  }
  doc.setDrawColor(...LINHA);
  for (let c = 0; c < porLinha; c += 1) {
    doc.line(x + c * bloco + larguraRotulo, yTopo, x + c * bloco + larguraRotulo, yTopo + altura);
    if (c > 0) doc.line(x + c * bloco, yTopo, x + c * bloco, yTopo + altura);
  }
  doc.roundedRect(x, yTopo, largura, altura, 1.2, 1.2, "S");
  return altura;
};

export const criarChip = (doc) => (nome, texto, xDireita, yChip, destaque) => {
  doc.setFont("helvetica", destaque ? "bold" : "normal");
  doc.setFontSize(8.2);
  const largura = doc.getTextWidth(texto) + 12.5;
  const x = xDireita - largura;
  doc.setFillColor(...(destaque ? VERDE : BRANCO));
  doc.setDrawColor(...(destaque ? VERDE : LINHA));
  doc.roundedRect(x, yChip - 4, largura, 7, 3.5, 3.5, "FD");
  icone(doc, nome, x + 4.2, yChip - 0.5, 4.4, destaque ? { fundo: BRANCO, cor: VERDE } : {});
  doc.setFont("helvetica", destaque ? "bold" : "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(...(destaque ? BRANCO : ESCURO));
  doc.text(texto, x + 8.3, yChip + 0.6);
  return x;
};

export const cabecalho = async (doc, logo, { etiqueta, titulo }) => {
  const direita = 210 - M;
  doc.setFillColor(...FUNDO);
  doc.rect(0, 0, 210, 42, "F");
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, 210, 2, "F");
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(0, 42, 210, 42);

  const imagem = await carregarImagem(logo);
  doc.setFillColor(...BRANCO);
  doc.setDrawColor(...LINHA);
  doc.roundedRect(M, 8, 60, 26, 3, 3, "FD");
  if (imagem) {
    const tela = document.createElement("canvas");
    tela.width = imagem.naturalWidth || 1;
    tela.height = imagem.naturalHeight || 1;
    tela.getContext("2d").drawImage(imagem, 0, 0);
    const alto = 17;
    const largo = Math.min(52, (tela.width / tela.height) * alto);
    doc.addImage(tela.toDataURL("image/png"), "PNG", M + (60 - largo) / 2, 12.5, largo, alto);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  const larguraEtiqueta = doc.getTextWidth(etiqueta) + 9;
  doc.setFillColor(...VERDE_CLARO);
  doc.roundedRect(direita - larguraEtiqueta, 7.5, larguraEtiqueta, 6, 3, 3, "F");
  doc.setTextColor(...VERDE_ESCURO);
  doc.text(etiqueta, direita - larguraEtiqueta / 2, 11.6, { align: "center" });

  doc.setFontSize(15);
  doc.setTextColor(...ESCURO);
  doc.text(titulo, direita, 21.5, { align: "right" });
};
