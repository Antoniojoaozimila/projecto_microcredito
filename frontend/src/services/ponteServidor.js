import api from "./api";
import { aplicarMarca, CHAVE_MARCA, EVENTO_MARCA } from "./marcaSistema";

const memoria = new Map();
let aHidratar = false;
const temporizadores = new Map();

const original = {
  getItem: localStorage.getItem.bind(localStorage),
  setItem: localStorage.setItem.bind(localStorage),
  removeItem: localStorage.removeItem.bind(localStorage),
  key: localStorage.key.bind(localStorage),
};

const MANTER = new Set(["token", "userProfile", "imperial_lang", "microcredito-remember-email"]);
const LOCAIS = new Set(["microcredito-remember-email", "microcredito-senhas-locais"]);
const eColecao = (chave) => String(chave || "").startsWith("microcredito-") && !LOCAIS.has(chave);

const limparArmazenamentoLocal = () => {
  const chaves = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = original.key(i);
    if (chave && !MANTER.has(chave)) chaves.push(chave);
  }
  chaves.forEach((chave) => original.removeItem(chave));
};

limparArmazenamentoLocal();

const tokenActual = () => {
  const token = original.getItem("token");
  if (!token || String(token).startsWith("demo-")) return "";
  return token;
};

const enviar = (chave, valor) => {
  if (!tokenActual()) return;
  let corpo = valor;
  try {
    corpo = JSON.parse(valor);
  } catch {
    return;
  }
  api.put(`/api/sincronizar/${encodeURIComponent(chave)}`, corpo).then(({ data }) => {
    if (!data?.valor || memoria.get(chave) !== valor) return;
    aHidratar = true;
    memoria.set(chave, JSON.stringify(data.valor));
    aHidratar = false;
  }).catch(() => {});
};

const agendarEnvio = (chave, valor) => {
  if (aHidratar || !tokenActual()) return;
  clearTimeout(temporizadores.get(chave));
  temporizadores.set(chave, setTimeout(() => enviar(chave, valor), 400));
};

localStorage.getItem = (chave) => {
  if (eColecao(chave)) return memoria.has(chave) ? memoria.get(chave) : null;
  return original.getItem(chave);
};

localStorage.setItem = (chave, valor) => {
  if (eColecao(chave)) {
    const texto = String(valor);
    memoria.set(chave, texto);
    agendarEnvio(chave, texto);
    return;
  }
  original.setItem(chave, valor);
};

localStorage.removeItem = (chave) => {
  if (eColecao(chave)) {
    memoria.delete(chave);
    agendarEnvio(chave, "[]");
    return;
  }
  original.removeItem(chave);
};

export const chavesDados = () => [...memoria.keys()];

export const carregarMarcaPublica = async () => {
  try {
    const { data } = await api.get("/api/marca");
    if (!data || memoria.has(CHAVE_MARCA)) return;
    const marca = {};
    ["nome", "logo", "favicon"].forEach((campo) => {
      if (data[campo]) marca[campo] = data[campo];
    });
    memoria.set(CHAVE_MARCA, JSON.stringify(marca));
    aplicarMarca();
    window.dispatchEvent(new CustomEvent(EVENTO_MARCA));
  } catch {
    /* sem servidor fica a marca padrão */
  }
};

export const hidratarDoServidor = async () => {
  if (!tokenActual()) return;
  aHidratar = true;
  try {
    const { data } = await api.get("/api/sincronizar");
    const colecoes = data?.colecoes || {};
    memoria.clear();
    Object.entries(colecoes).forEach(([chave, valor]) => {
      if (!eColecao(chave) || valor == null) return;
      memoria.set(chave, JSON.stringify(valor));
    });
    aplicarMarca();
  } finally {
    aHidratar = false;
  }
};
