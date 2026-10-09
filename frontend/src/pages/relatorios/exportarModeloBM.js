import urlModelo from "../../assets/modelo-reporte-bm.xlsx?url";
import { pngDoLogo } from "../../services/logoDocumento";
import { preencherModeloBM } from "./preencherModeloBM";

const CAIXA_LOGO = { largura: 170, altura: 76 };

/** Logótipo configurado no sistema (Configurações > Identidade), já em PNG e com o tamanho certo para o cabeçalho. */
const logoDoSistema = async () => {
  const png = await pngDoLogo();
  if (!png || !png.includes(",")) return null;
  const medidas = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve(null);
    img.src = png;
  });
  if (!medidas) return null;
  const escala = Math.min(CAIXA_LOGO.largura / medidas.w, CAIXA_LOGO.altura / medidas.h);
  return {
    base64: png.split(",")[1],
    largura: Math.max(1, Math.round(medidas.w * escala)),
    altura: Math.max(1, Math.round(medidas.h * escala)),
  };
};

const descarregar = (blob, nome) => {
  const url = URL.createObjectURL(blob);
  const ligacao = document.createElement("a");
  ligacao.href = url;
  ligacao.download = nome;
  document.body.appendChild(ligacao);
  ligacao.click();
  ligacao.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const descarregarModeloBM = async (dados) => {
  const resposta = await fetch(urlModelo);
  if (!resposta.ok) throw new Error("Não foi possível carregar o modelo do Banco de Moçambique.");
  const [modelo, logo] = await Promise.all([resposta.arrayBuffer(), logoDoSistema()]);
  const ficheiro = await preencherModeloBM(dados, modelo, logo);
  const blob = new Blob([ficheiro], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  descarregar(blob, `Reporte-BM_${dados.periodo.de}_a_${dados.periodo.ate}.xlsx`);
  return Math.max(1, Math.round(blob.size / 1024));
};
